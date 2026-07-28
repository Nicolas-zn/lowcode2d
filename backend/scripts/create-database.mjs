import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const envPath = resolve(process.cwd(), '.env')
const envText = readFileSync(envPath, 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const index = line.indexOf('=')
      const key = line.slice(0, index)
      const rawValue = line.slice(index + 1).trim()
      return [key, rawValue.replace(/^['"]|['"]$/g, '')]
    })
)

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required in backend/.env')
}

const targetUrl = new URL(databaseUrl)
const targetDatabase = targetUrl.pathname.replace(/^\//, '')
if (!targetDatabase) {
  throw new Error('DATABASE_URL must include a database name')
}

const adminUrl = new URL(databaseUrl)
adminUrl.pathname = '/postgres'
adminUrl.search = ''

const client = new pg.Client({ connectionString: adminUrl.toString() })
await client.connect()

try {
  const exists = await client.query('select 1 from pg_database where datname = $1', [targetDatabase])
  if (exists.rowCount > 0) {
    console.log(`Database "${targetDatabase}" already exists.`)
  } else {
    await client.query(`create database "${targetDatabase.replace(/"/g, '""')}"`)
    console.log(`Database "${targetDatabase}" created.`)
  }
} finally {
  await client.end()
}
