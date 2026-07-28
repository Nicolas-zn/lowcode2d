import { PrismaClient, WorkspaceRole } from '@prisma/client'

const prisma = new PrismaClient()
const base = process.env.API_BASE || 'http://127.0.0.1:3011/api'
const stamp = Date.now()
const users = []

async function api(path, options = {}, token, expectOk = true) {
  const res = await fetch(base + path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })
  const body = await res.json().catch(() => ({}))
  if (expectOk && (!res.ok || body.success === false)) {
    throw new Error(`${path} failed: ${res.status} ${JSON.stringify(body)}`)
  }
  return { status: res.status, data: body.data ?? body }
}

async function register(label) {
  const email = `phase8-${label}-${stamp}@example.com`
  const { data } = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: 'Passw0rd!123',
      displayName: `Phase8 ${label}`
    })
  })
  users.push(data.user.id)
  const workspaces = await api('/workspaces', {}, data.accessToken)
  return {
    email,
    token: data.accessToken,
    userId: data.user.id,
    workspaceId: workspaces.data[0].id
  }
}

try {
  const owner = await register('owner')
  const viewer = await register('viewer')

  await prisma.workspaceMember.create({
    data: {
      workspaceId: owner.workspaceId,
      userId: viewer.userId,
      role: WorkspaceRole.VIEWER
    }
  })

  const project = await api('/projects', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId: owner.workspaceId,
      name: 'Phase 8 Governance Project',
      description: 'RBAC audit notification smoke'
    })
  }, owner.token)

  const denied = await api('/projects', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId: owner.workspaceId,
      name: 'Viewer should not create'
    })
  }, viewer.token, false)

  if (denied.status !== 403) {
    throw new Error(`Expected viewer project create to be denied, got ${denied.status}`)
  }

  const publish = await api('/publishes', {
    method: 'POST',
    body: JSON.stringify({
      projectId: project.data.id,
      title: 'Phase 8 Governance Template',
      summary: 'Governance smoke template',
      category: 'dashboard',
      tags: ['phase8', 'governance']
    })
  }, owner.token)

  const auditLogs = await api(`/audit-logs?workspaceId=${owner.workspaceId}`, {}, owner.token)
  const notifications = await api('/notifications?unreadOnly=true', {}, owner.token)

  const hasProjectAudit = auditLogs.data.some(log => log.action === 'project.create')
  const hasPublishAudit = auditLogs.data.some(log => log.action === 'publish.create')
  const hasPublishNotification = notifications.data.some(item => item.type === 'PUBLISH')

  if (!hasProjectAudit || !hasPublishAudit || !hasPublishNotification) {
    throw new Error(`Governance verification failed: ${JSON.stringify({
      hasProjectAudit,
      hasPublishAudit,
      hasPublishNotification
    })}`)
  }

  console.log(JSON.stringify({
    ok: true,
    projectId: project.data.id,
    publishId: publish.data.id,
    viewerDeniedStatus: denied.status,
    auditLogCount: auditLogs.data.length,
    unreadNotifications: notifications.data.length
  }, null, 2))
} finally {
  for (const userId of users) {
    await prisma.workspace.deleteMany({ where: { ownerId: userId } })
    await prisma.uploadFile.deleteMany({ where: { ownerId: userId } })
    await prisma.refreshToken.deleteMany({ where: { userId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  }
  await prisma.$disconnect()
}
