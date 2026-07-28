<template>
  <div class="datasource-panel">
    <header class="panel-header">
      <div>
        <h3>数据源</h3>
        <p>统一管理请求器与接口数据源，组件可直接选择已配置的数据源绑定</p>
      </div>
      <div class="header-actions">
        <div class="summary-pill">{{ requesters.length }} 请求器</div>
        <div class="summary-pill">{{ apiDataSources.length }} 数据源</div>
        <el-button :icon="Plus" @click="openRequesterDialog()">新建请求器</el-button>
        <el-button type="primary" :icon="CirclePlus" @click="openDataSourceDialog()">新建数据源</el-button>
      </div>
    </header>

    <div class="panel-body">
      <aside class="asset-sidebar">
        <el-segmented v-model="activeSection" :options="sectionOptions" class="section-tabs" />

        <template v-if="activeSection === 'requesters'">
          <div class="section-heading">
            <span>请求器</span>
            <el-button text type="primary" :icon="Plus" @click="openRequesterDialog()">添加</el-button>
          </div>
          <AppEmpty v-if="requesters.length === 0" title="还没有请求器" description="先创建请求器，用于统一配置基础地址、鉴权和默认 Header。" size="compact">
            <template #actions>
              <el-button size="small" type="primary" :icon="Plus" @click="openRequesterDialog()">新建请求器</el-button>
            </template>
          </AppEmpty>
          <div class="asset-list">
            <button v-for="requester in requesters" :key="requester.id" class="asset-item"
              :class="{ active: requester.id === selectedRequesterId }" type="button"
              @click="selectRequester(requester.id)">
              <span class="asset-row">
                <span class="asset-name">{{ requester.name }}</span>
                <el-tag size="small" effect="plain">{{ getAuthLabel(requester.auth?.type) }}</el-tag>
              </span>
              <span class="asset-url">{{ requester.baseUrl || '未配置基础地址' }}</span>
              <span class="asset-meta">
                {{ getRequesterDataSources(requester.id).length }} 数据源 · {{ requester.timeout || 15000 }} ms
              </span>
            </button>
          </div>
        </template>

        <template v-else>
          <div class="section-heading">
            <span>数据源</span>
            <el-button text type="primary" :icon="CirclePlus" @click="openDataSourceDialog()">添加</el-button>
          </div>
          <AppEmpty v-if="apiDataSources.length === 0" title="还没有数据源" description="创建数据源后，图表组件即可绑定接口数据。" size="compact">
            <template #actions>
              <el-button size="small" type="primary" :icon="CirclePlus" @click="openDataSourceDialog()">新建数据源</el-button>
            </template>
          </AppEmpty>
          <div class="asset-list">
            <button v-for="source in apiDataSources" :key="source.id" class="asset-item"
              :class="{ active: source.id === selectedDataSourceId }" type="button"
              @click="selectDataSource(source.id)">
              <span class="asset-row">
                <span class="asset-name">{{ source.name }}</span>
                <span class="asset-tags">
                  <el-tag
                    v-if="getDataSourceTestResult(source.id)"
                    size="small"
                    :type="getDataSourceTestResult(source.id).status === 'success' ? 'success' : 'danger'"
                    effect="plain"
                  >
                    {{ getDataSourceTestResult(source.id).status === 'success' ? 'success' : 'failed' }}
                  </el-tag>
                  <el-tag size="small" type="success" effect="plain">{{ source.requestConfig?.method || 'GET' }}</el-tag>
                </span>
              </span>
              <span class="asset-url">{{ getRequesterName(source.requesterId) }}</span>
              <span class="asset-meta">{{ source.requestConfig?.path || source.config?.url || '未配置接口路径' }}</span>
            </button>
          </div>
        </template>
      </aside>

      <main class="asset-detail">
        <template v-if="activeSection === 'requesters'">
          <section v-if="selectedRequester" class="hero-card">
            <div class="detail-title">
              <div>
                <el-tag size="small" type="success" effect="plain">请求器</el-tag>
                <h4>{{ selectedRequester.name }}</h4>
                <p>{{ selectedRequester.baseUrl || '未配置基础地址' }}</p>
              </div>
              <div class="detail-actions">
                <el-button :icon="VideoPlay" @click="testRequester(selectedRequester)">测试</el-button>
                <el-button :icon="Edit" @click="openRequesterDialog(selectedRequester)">编辑</el-button>
                <el-button v-if="selectedRequester.id !== 'default'" :icon="Delete" type="danger" plain
                  @click="deleteRequester(selectedRequester.id)">
                  删除
                </el-button>
              </div>
            </div>

            <div class="metric-grid">
              <div class="metric-card">
                <span>认证方式</span>
                <strong>{{ getAuthLabel(selectedRequester.auth?.type) }}</strong>
              </div>
              <div class="metric-card">
                <span>默认 Header</span>
                <strong>{{ Object.keys(selectedRequester.headers || {}).length }}</strong>
              </div>
              <div class="metric-card">
                <span>关联数据源</span>
                <strong>{{ boundDataSources.length }}</strong>
              </div>
              <div class="metric-card">
                <span>超时时间</span>
                <strong>{{ selectedRequester.timeout || 15000 }} ms</strong>
              </div>
            </div>
          </section>

          <div v-if="selectedRequester" class="detail-grid">
            <section class="content-card">
              <div class="section-heading">
                <span>默认 Header</span>
              </div>
              <div v-if="Object.keys(selectedRequester.headers || {}).length === 0" class="empty-inline">
                未配置默认 Header
              </div>
              <div v-else class="header-chip-list">
                <div v-for="(value, key) in selectedRequester.headers" :key="key" class="header-chip">
                  <span>{{ key }}</span>
                  <strong>{{ value }}</strong>
                </div>
              </div>
            </section>

            <section class="content-card binding-card">
              <div class="section-heading">
                <span>关联数据源</span>
                <el-button text type="primary" :icon="CirclePlus"
                  @click="openDataSourceDialog({ requesterId: selectedRequester.id })">
                  新建
                </el-button>
              </div>
              <div class="binding-list">
                <AppEmpty v-if="boundDataSources.length === 0" title="暂无关联数据源" description="可以基于当前请求器新建数据源。" size="compact">
                  <template #actions>
                    <el-button size="small" type="primary" :icon="CirclePlus"
                      @click="openDataSourceDialog({ requesterId: selectedRequester.id })">
                      新建数据源
                    </el-button>
                  </template>
                </AppEmpty>
                <div v-for="source in boundDataSources" :key="source.id" class="binding-item">
                  <div>
                    <strong>{{ source.name }}</strong>
                    <span>{{ source.requestConfig?.method || 'GET' }} {{ source.requestConfig?.path ||
                      source.config?.url }}</span>
                  </div>
                  <div class="inline-actions">
                    <el-button text type="primary" @click="selectDataSource(source.id)">查看</el-button>
                    <el-button text type="primary" :icon="VideoPlay" @click="testDataSource(source.id)">测试</el-button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </template>

        <template v-else>
          <template v-if="selectedDataSource">
            <section class="hero-card">
              <div class="detail-title">
                <div>
                  <div class="title-row">
                    <el-tag size="small" type="success" effect="plain">数据源</el-tag>
                    <el-tag v-if="selectedDataSourceTestResult" size="small"
                      :type="selectedDataSourceTestResult.status === 'success' ? 'success' : 'danger'" effect="plain">
                      {{ selectedDataSourceTestResult.status === 'success' ? 'success' : 'failed' }}
                    </el-tag>
                  </div>
                  <h4>{{ selectedDataSource.name }}</h4>
                  <p>{{ getDataSourceUrl(selectedDataSource) }}</p>
                </div>
                <div class="detail-actions">
                  <el-button :icon="VideoPlay" @click="testDataSource(selectedDataSource.id)">测试</el-button>
                  <el-button :icon="Edit" @click="openDataSourceDialog(selectedDataSource)">编辑</el-button>
                  <el-button :icon="Delete" type="danger" plain
                    @click="deleteDataSource(selectedDataSource.id)">删除</el-button>
                </div>
              </div>

              <div class="metric-grid">
                <div class="metric-card">
                  <span>请求器</span>
                  <strong>{{ getRequesterName(selectedDataSource.requesterId) }}</strong>
                </div>
                <div class="metric-card">
                  <span>请求方法</span>
                  <strong>{{ selectedDataSource.requestConfig?.method || 'GET' }}</strong>
                </div>
                <div class="metric-card">
                  <span>Query 参数</span>
                  <strong>{{ getEnabledRows(selectedDataSource.requestConfig?.queryRows).length }}</strong>
                </div>
                <div class="metric-card">
                  <span>Header 参数</span>
                  <strong>{{ getEnabledRows(selectedDataSource.requestConfig?.headerRows).length }}</strong>
                </div>
              </div>
            </section>

            <div class="detail-grid">
              <section class="content-card">
                <div class="section-heading">
                  <span>请求参数</span>
                </div>
                <div class="param-block">
                  <label>接口路径</label>
                  <strong>{{ selectedDataSource.requestConfig?.path || '未配置' }}</strong>
                </div>
                <div class="param-block">
                  <label>请求 Body</label>
                  <pre>{{ formatBody(selectedDataSource.requestConfig?.body) }}</pre>
                </div>
              </section>

              <section class="content-card binding-card">
                <div class="section-heading">
                  <span>参数列表</span>
                </div>
                <div class="binding-list">
                  <div class="param-group">
                    <h5>Query</h5>
                    <div v-if="getEnabledRows(selectedDataSource.requestConfig?.queryRows).length === 0"
                      class="empty-compact">未配置</div>
                    <div v-for="row in getEnabledRows(selectedDataSource.requestConfig?.queryRows)"
                      :key="`query-${row.key}`" class="binding-item compact">
                      <strong>{{ row.key }}</strong>
                      <span>{{ row.value }}</span>
                    </div>
                  </div>
                  <div class="param-group">
                    <h5>Header</h5>
                    <div v-if="getEnabledRows(selectedDataSource.requestConfig?.headerRows).length === 0"
                      class="empty-compact">未配置</div>
                    <div v-for="row in getEnabledRows(selectedDataSource.requestConfig?.headerRows)"
                      :key="`header-${row.key}`" class="binding-item compact">
                      <strong>{{ row.key }}</strong>
                      <span>{{ row.value }}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section class="content-card result-card">
              <div class="section-heading">
                <span>请求结果</span>
                <div class="result-actions">
                  <el-tag v-if="selectedDataSourceTestResult" size="small"
                    :type="selectedDataSourceTestResult.status === 'success' ? 'success' : 'danger'" effect="plain">
                    {{ selectedDataSourceTestResult.status === 'success' ? 'success' : 'failed' }}
                  </el-tag>
                  <el-button v-if="selectedDataSourceTestResult?.status === 'success'" size="small" type="primary"
                    plain :icon="DataAnalysis" @click="openTransformDialog">
                    数据转换
                  </el-button>
                  <el-button v-if="selectedDataSourceTestResult?.status === 'success'" size="small" :icon="CopyDocument"
                    @click="copyResultJson">
                    复制结果
                  </el-button>
                  <el-button v-if="selectedDataSourceTestResult?.status === 'success'" size="small" :icon="Download"
                    @click="downloadResultJson">
                    下载 JSON
                  </el-button>
                </div>
              </div>
              <AppEmpty v-if="!selectedDataSourceTestResult" title="暂无请求结果" description="点击测试后查看接口响应、状态和字段结构。"
                size="compact" class="result-empty">
                <template #actions>
                  <el-button size="small" type="primary" :icon="VideoPlay" @click="testDataSource(selectedDataSource.id)">
                    测试数据源
                  </el-button>
                </template>
              </AppEmpty>
              <AppError v-else-if="selectedDataSourceTestResult.status !== 'success'" title="数据源测试失败"
                :description="selectedDataSourceTestResult.message || '请求未成功，请检查请求器、接口路径或鉴权配置。'"
                :detail="selectedDataSourceTestResult.detail || selectedDataSourceTestResult.error">
                <template #actions>
                  <el-button size="small" type="primary" :icon="VideoPlay" @click="testDataSource(selectedDataSource.id)">
                    重试
                  </el-button>
                  <el-button size="small" :icon="Edit" @click="openDataSourceDialog(selectedDataSource)">编辑配置</el-button>
                </template>
              </AppError>
              <template v-else>
                <div class="result-meta">
                  <strong>{{ selectedDataSourceTestResult.title }}</strong>
                  <span>{{ selectedDataSourceTestResult.message }}</span>
                </div>
                <div class="request-debug-grid">
                  <div>
                    <span>状态码</span>
                    <strong>{{ selectedDataSourceTestResult.statusCode || '-' }}</strong>
                  </div>
                  <div>
                    <span>耗时</span>
                    <strong>{{ formatDuration(selectedDataSourceTestResult.duration) }}</strong>
                  </div>
                  <div>
                    <span>请求时间</span>
                    <strong>{{ formatDateTime(selectedDataSourceTestResult.requestedAt || selectedDataSourceTestResult.updatedAt) }}</strong>
                  </div>
                  <div>
                    <span>请求方法</span>
                    <strong>{{ selectedDataSourceTestResult.method || selectedDataSource.requestConfig?.method || 'GET' }}</strong>
                  </div>
                  <div class="wide">
                    <span>请求地址</span>
                    <strong>{{ selectedDataSourceTestResult.url || getDataSourceUrl(selectedDataSource) }}</strong>
                  </div>
                </div>
                <div class="result-preview-toolbar">
                  <el-segmented v-model="resultViewMode" :options="resultViewOptions" size="small" />
                  <span>{{ resultSummary }}</span>
                </div>
                <div v-if="resultViewMode === 'summary'" class="result-summary-grid">
                  <div class="metric-card compact">
                    <span>数据类型</span>
                    <strong>{{ resultPreview.typeLabel }}</strong>
                  </div>
                  <div class="metric-card compact">
                    <span>记录数量</span>
                    <strong>{{ resultPreview.rowCount }}</strong>
                  </div>
                  <div class="metric-card compact">
                    <span>字段数量</span>
                    <strong>{{ resultPreview.columns.length }}</strong>
                  </div>
                  <div class="metric-card compact">
                    <span>预览模式</span>
                    <strong>{{ resultPreview.rows.length > 0 ? '表格可用' : 'JSON' }}</strong>
                  </div>
                </div>
                <div v-else-if="resultViewMode === 'table'" class="result-table-wrap">
                  <el-table v-if="resultPreview.rows.length > 0" :data="resultPreview.rows" size="small" border stripe
                    height="320">
                    <el-table-column v-for="column in resultPreview.columns" :key="column" :prop="column" :label="column"
                      min-width="140" show-overflow-tooltip>
                      <template #default="{ row }">
                        {{ formatCellValue(row[column]) }}
                      </template>
                    </el-table-column>
                  </el-table>
                  <AppEmpty v-else title="无法生成表格预览" description="当前返回值不是对象数组，请切换到 JSON 查看原始结构。" size="compact" />
                </div>
                <div v-else-if="resultViewMode === 'fields'" class="field-path-list">
                  <div v-if="resultFieldPaths.length > 0" class="field-path-header">
                    <span>字段路径</span>
                    <span>{{ resultFieldPaths.length }} 个字段</span>
                  </div>
                  <div v-for="field in resultFieldPaths" :key="field.path" class="field-path-item">
                    <div class="field-path-main">
                      <strong>{{ field.path }}</strong>
                      <span>{{ field.typeLabel }} · {{ field.sample }}</span>
                    </div>
                    <div class="field-path-actions">
                      <el-button size="small" text type="primary" @click="copyText(field.path, '字段路径已复制')">
                        复制路径
                      </el-button>
                      <el-button size="small" text type="primary" @click="copyText(`{{ ${field.path} }}`, '绑定表达式已复制')">
                        复制表达式
                      </el-button>
                    </div>
                  </div>
                  <AppEmpty v-if="resultFieldPaths.length === 0" title="未提取到字段路径" description="当前返回值为空或不是可遍历对象。"
                    size="compact" />
                </div>
                <pre v-else class="result-body">{{ selectedDataSourceTestResult.detail }}</pre>
              </template>
            </section>

            <section class="content-card request-history-card">
              <div class="section-heading">
                <span>请求历史</span>
                <el-button text type="primary" :disabled="selectedRequestHistory.length === 0" @click="clearRequestHistory">
                  清空
                </el-button>
              </div>
              <el-table v-if="selectedRequestHistory.length > 0" :data="selectedRequestHistory" size="small" height="260">
                <el-table-column label="时间" min-width="150">
                  <template #default="{ row }">{{ formatDateTime(row.requestedAt) }}</template>
                </el-table-column>
                <el-table-column label="状态" width="90">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.status === 'success' ? 'success' : 'danger'" effect="plain">
                      {{ row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="statusCode" label="HTTP" width="80" />
                <el-table-column label="耗时" width="90">
                  <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
                </el-table-column>
                <el-table-column prop="method" label="方法" width="80" />
                <el-table-column prop="url" label="请求地址" min-width="260" show-overflow-tooltip />
                <el-table-column prop="error" label="错误" min-width="180" show-overflow-tooltip />
              </el-table>
              <AppEmpty v-else title="暂无请求历史" description="点击测试数据源后，这里会记录最近 20 次请求。" size="compact" />
            </section>
          </template>

          <AppEmpty v-else title="选择或新建一个数据源" description="在左侧选择数据源查看详情，或新建一个 API 数据源开始绑定组件。" class="detail-empty">
            <template #actions>
              <el-button type="primary" :icon="CirclePlus" @click="openDataSourceDialog()">新建数据源</el-button>
            </template>
          </AppEmpty>
        </template>
      </main>
    </div>

    <el-dialog v-model="showRequesterDialog" :title="editingRequesterId ? '编辑请求器' : '新建请求器'" width="680px" append-to-body>
      <el-form :model="requesterForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="requesterForm.name" placeholder="例如：业务后端" />
        </el-form-item>
        <el-form-item label="基础地址" required>
          <el-input v-model="requesterForm.baseUrl" placeholder="https://api.example.com" />
        </el-form-item>
        <el-form-item label="认证方式">
          <el-select v-model="requesterForm.auth.type" style="width: 100%">
            <el-option label="无" value="none" />
            <el-option label="Bearer Token" value="bearer" />
            <el-option label="Basic Auth" value="basic" />
            <el-option label="API Key Header" value="apiKey" />
          </el-select>
        </el-form-item>

        <template v-if="requesterForm.auth.type === 'bearer'">
          <el-form-item label="Token">
            <el-input v-model="requesterForm.auth.token" type="textarea" :rows="2" />
          </el-form-item>
        </template>
        <template v-if="requesterForm.auth.type === 'basic'">
          <el-form-item label="用户名">
            <el-input v-model="requesterForm.auth.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="requesterForm.auth.password" show-password />
          </el-form-item>
        </template>
        <template v-if="requesterForm.auth.type === 'apiKey'">
          <el-form-item label="Header 名">
            <el-input v-model="requesterForm.auth.keyName" placeholder="X-API-Key" />
          </el-form-item>
          <el-form-item label="Header 值">
            <el-input v-model="requesterForm.auth.keyValue" show-password />
          </el-form-item>
        </template>

        <el-form-item label="默认 Header">
          <div class="kv-list">
            <div v-for="(row, index) in requesterForm.headerRows" :key="index" class="kv-row">
              <el-checkbox v-model="row.enabled" />
              <el-input v-model="row.key" placeholder="Header" />
              <el-input v-model="row.value" placeholder="Value" />
              <el-button :icon="Delete" @click="removeRequesterHeaderRow(index)" />
            </div>
            <el-button :icon="Plus" @click="addRequesterHeaderRow">添加 Header</el-button>
          </div>
        </el-form-item>

        <el-form-item label="超时">
          <el-input-number v-model="requesterForm.timeout" :min="1000" :step="1000" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRequesterDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRequester">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDataSourceDialog" :title="editingDataSourceId ? '编辑数据源' : '新建数据源'" width="760px" append-to-body>
      <el-form :model="dataSourceForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="dataSourceForm.name" placeholder="例如：用户列表" />
        </el-form-item>
        <el-form-item label="请求器" required>
          <el-select v-model="dataSourceForm.requesterId" style="width: 100%" placeholder="选择请求器">
            <el-option v-for="requester in requesters" :key="requester.id" :label="requester.name"
              :value="requester.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口路径" required>
          <div class="method-path">
            <el-select v-model="dataSourceForm.method" class="method-select">
              <el-option v-for="method in methods" :key="method" :label="method" :value="method" />
            </el-select>
            <el-input v-model="dataSourceForm.path" placeholder="/api/users" />
          </div>
        </el-form-item>

        <el-form-item label="Query 参数">
          <div class="kv-list">
            <div v-for="(row, index) in dataSourceForm.queryRows" :key="index" class="kv-row">
              <el-checkbox v-model="row.enabled" />
              <el-input v-model="row.key" placeholder="参数名" />
              <el-input v-model="row.value" placeholder="参数值" />
              <el-button :icon="Delete" @click="removeDataSourceRow('queryRows', index)" />
            </div>
            <el-button :icon="Plus" @click="addDataSourceRow('queryRows')">添加 Query</el-button>
          </div>
        </el-form-item>

        <el-form-item label="请求 Header">
          <div class="kv-list">
            <div v-for="(row, index) in dataSourceForm.headerRows" :key="index" class="kv-row">
              <el-checkbox v-model="row.enabled" />
              <el-input v-model="row.key" placeholder="Header" />
              <el-input v-model="row.value" placeholder="Value" />
              <el-button :icon="Delete" @click="removeDataSourceRow('headerRows', index)" />
            </div>
            <el-button :icon="Plus" @click="addDataSourceRow('headerRows')">添加 Header</el-button>
          </div>
        </el-form-item>

        <el-form-item label="请求 Body">
          <el-input v-model="dataSourceForm.bodyText" type="textarea" :rows="5" placeholder='{"pageSize": 20}' />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDataSourceDialog = false">取消</el-button>
        <el-button :icon="VideoPlay" @click="testDataSourceForm">测试</el-button>
        <el-button type="primary" @click="saveDataSource">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTransformDialog" title="数据转换" width="980px" :close-on-click-modal="false" append-to-body>
      <div class="transform-dialog-body">
        <section class="transform-editor">
          <LightCodeEditor v-model="transformForm.code" title="转换脚本" placeholder="function transform(data) {
  return data;
}">
            <template #actions>
              <el-switch v-model="transformForm.enabled" active-text="启用转换" />
              <el-button size="small" :icon="Refresh" @click="resetTransformCode">重置模板</el-button>
            </template>
          </LightCodeEditor>
        </section>

        <section class="transform-preview">
          <div class="preview-header">
            <span>预览结果</span>
            <el-button size="small" type="primary" :icon="VideoPlay" :loading="transformPreviewLoading"
              @click="runTransformPreview">
              预览
            </el-button>
          </div>
          <AppError v-if="transformPreviewError" title="转换预览失败" :description="transformPreviewError" class="preview-alert" />
          <pre v-else class="preview-output">{{ transformPreviewOutput || '点击“预览”查看转换后的数据' }}</pre>
        </section>
      </div>

      <template #footer>
        <el-button @click="showTransformDialog = false">取消</el-button>
        <el-button :icon="VideoPlay" @click="runTransformPreview">预览</el-button>
        <el-button type="primary" @click="saveTransformConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CirclePlus, CopyDocument, DataAnalysis, Delete, Download, Edit, Plus, Refresh, VideoPlay } from '@element-plus/icons-vue'
import { useDataSourceStore } from '../stores/dataSourceStore'
import LightCodeEditor from './LightCodeEditor.vue'
import AppEmpty from './common/AppEmpty.vue'
import AppError from './common/AppError.vue'
import {
  buildRequesterHeaders,
  buildRequesterUrl,
  createKeyValueRow,
  normalizeKeyValueRows,
  parseJsonText
} from '../utils/requester'
import { transformData } from '../utils/dataTransform'

const dataSourceStore = useDataSourceStore()

const sectionOptions = [
  { label: '请求器', value: 'requesters' },
  { label: '数据源', value: 'dataSources' }
]
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const requesters = computed(() => dataSourceStore.requesters)
const apiDataSources = computed(() => dataSourceStore.dataSources.filter(ds => ds.type === 'api'))
const activeSection = ref('requesters')
const selectedRequesterId = ref('')
const selectedDataSourceId = ref('')
const showRequesterDialog = ref(false)
const showDataSourceDialog = ref(false)
const showTransformDialog = ref(false)
const editingRequesterId = ref(null)
const editingDataSourceId = ref(null)
const transformPreviewLoading = ref(false)
const transformPreviewOutput = ref('')
const transformPreviewError = ref('')
const resultViewMode = ref('summary')
const resultViewOptions = [
  { label: '摘要', value: 'summary' },
  { label: '表格', value: 'table' },
  { label: '字段', value: 'fields' },
  { label: 'JSON', value: 'json' }
]

const defaultTransformCode = `function transform(data) {
  return data;
}`

const transformForm = ref({
  enabled: false,
  code: defaultTransformCode
})

const defaultRequesterForm = () => ({
  name: '',
  baseUrl: '',
  auth: { type: 'none' },
  headerRows: [createKeyValueRow()],
  timeout: 15000
})

const defaultDataSourceForm = (overrides = {}) => ({
  name: '',
  requesterId: requesters.value[0]?.id || '',
  method: 'GET',
  path: '',
  queryRows: [createKeyValueRow()],
  headerRows: [createKeyValueRow()],
  bodyText: '',
  ...overrides
})

const requesterForm = ref(defaultRequesterForm())
const dataSourceForm = ref(defaultDataSourceForm())

const selectedRequester = computed(() => {
  return requesters.value.find(requester => requester.id === selectedRequesterId.value) || requesters.value[0] || null
})

const selectedDataSource = computed(() => {
  return apiDataSources.value.find(source => source.id === selectedDataSourceId.value) || apiDataSources.value[0] || null
})

const selectedDataSourceTestResult = computed(() => {
  if (!selectedDataSource.value) return null
  return getDataSourceTestResult(selectedDataSource.value.id)
})

const selectedRequestHistory = computed(() => {
  if (!selectedDataSource.value) return []
  return dataSourceStore.requestHistories[selectedDataSource.value.id] || []
})

const resultPayload = computed(() => {
  const result = selectedDataSourceTestResult.value
  if (!result || result.status !== 'success') return null
  return result.transformedData ?? result.rawData ?? null
})

const resultPreview = computed(() => createResultPreview(resultPayload.value))
const resultFieldPaths = computed(() => extractFieldPaths(resultPayload.value))

const resultSummary = computed(() => {
  if (!selectedDataSourceTestResult.value) return ''
  if (selectedDataSourceTestResult.value.status !== 'success') return '请求失败'
  const preview = resultPreview.value
  if (preview.rows.length > 0) {
    return `${preview.typeLabel} · ${preview.rowCount} 条记录 · ${preview.columns.length} 个字段`
  }
  return `${preview.typeLabel} · JSON 预览`
})

const boundDataSources = computed(() => {
  if (!selectedRequester.value) return []
  return getRequesterDataSources(selectedRequester.value.id)
})

watch(requesters, (list) => {
  if (!selectedRequesterId.value && list.length > 0) {
    selectedRequesterId.value = list[0].id
  }
}, { immediate: true })

watch(apiDataSources, (list) => {
  if (!selectedDataSourceId.value && list.length > 0) {
    selectedDataSourceId.value = list[0].id
  }
}, { immediate: true })

const selectRequester = (id) => {
  selectedRequesterId.value = id
}

const selectDataSource = (id) => {
  selectedDataSourceId.value = id
  activeSection.value = 'dataSources'
  resultViewMode.value = 'summary'
}

const getAuthLabel = (type) => {
  const map = {
    none: '无认证',
    bearer: 'Bearer',
    basic: 'Basic',
    apiKey: 'API Key'
  }
  return map[type] || '无认证'
}

const getRequesterName = (id) => {
  return dataSourceStore.getRequester(id)?.name || '未选择请求器'
}

const getRequesterDataSources = (requesterId) => {
  return apiDataSources.value.filter(source => source.requesterId === requesterId)
}

const getDataSourceTestResult = (id) => dataSourceStore.lastRequestResults[id] || null

const getEnabledRows = (rows = []) => rows.filter(row => row && row.enabled !== false && String(row.key || '').trim())

const headersToRows = (headers = {}) => {
  const rows = Object.entries(headers).map(([key, value]) => createKeyValueRow(key, value, true))
  return rows.length ? rows : [createKeyValueRow()]
}

const cloneRows = (rows = []) => {
  const cloned = rows.map(row => createKeyValueRow(row.key, row.value, row.enabled !== false))
  return cloned.length ? cloned : [createKeyValueRow()]
}

const formatBody = (body) => {
  if (body === null || body === undefined || body === '') return '未配置'
  return typeof body === 'string' ? body : JSON.stringify(body, null, 2)
}

const getValueTypeLabel = (value) => {
  if (Array.isArray(value)) return 'Array'
  if (value === null) return 'Null'
  if (typeof value === 'object') return 'Object'
  if (typeof value === 'string') return 'String'
  if (typeof value === 'number') return 'Number'
  if (typeof value === 'boolean') return 'Boolean'
  return 'Unknown'
}

const normalizeTableRows = (value) => {
  if (Array.isArray(value)) return value

  if (value && typeof value === 'object') {
    const candidateKeys = ['data', 'list', 'records', 'rows', 'items', 'result']
    for (const key of candidateKeys) {
      if (Array.isArray(value[key])) return value[key]
    }

    const firstArray = Object.values(value).find(item => Array.isArray(item))
    if (firstArray) return firstArray
  }

  return []
}

const createResultPreview = (value) => {
  const sourceRows = normalizeTableRows(value)
  const rows = sourceRows
    .filter(row => row && typeof row === 'object' && !Array.isArray(row))
    .slice(0, 100)
  const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row)))).slice(0, 24)

  return {
    typeLabel: getValueTypeLabel(value),
    rowCount: sourceRows.length,
    rows,
    columns
  }
}

const getPathSegment = (key) => {
  if (/^[A-Za-z_$][\w$]*$/.test(String(key))) return `.${key}`
  return `[${JSON.stringify(String(key))}]`
}

const getSampleValue = (value) => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    const text = JSON.stringify(value)
    return text.length > 64 ? `${text.slice(0, 64)}...` : text
  }
  const text = String(value)
  return text.length > 64 ? `${text.slice(0, 64)}...` : text
}

const extractFieldPaths = (value, basePath = 'data', depth = 0, result = []) => {
  if (value === null || value === undefined || depth > 5 || result.length >= 120) return result

  if (Array.isArray(value)) {
    const first = value.find(item => item !== null && item !== undefined)
    if (first !== undefined) {
      extractFieldPaths(first, `${basePath}[0]`, depth + 1, result)
    }
    return result
  }

  if (typeof value !== 'object') {
    result.push({
      path: basePath,
      typeLabel: getValueTypeLabel(value),
      sample: getSampleValue(value)
    })
    return result
  }

  Object.entries(value).forEach(([key, child]) => {
    if (result.length >= 120) return
    const childPath = `${basePath}${getPathSegment(key)}`
    if (child && typeof child === 'object') {
      result.push({
        path: childPath,
        typeLabel: getValueTypeLabel(child),
        sample: Array.isArray(child) ? `${child.length} items` : `${Object.keys(child).length} keys`
      })
      extractFieldPaths(child, childPath, depth + 1, result)
    } else {
      result.push({
        path: childPath,
        typeLabel: getValueTypeLabel(child),
        sample: getSampleValue(child)
      })
    }
  })

  return result
}

const formatCellValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

const formatDuration = (duration) => {
  if (duration === null || duration === undefined) return '-'
  return `${duration} ms`
}

const copyText = async (text, successMessage = '已复制') => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success(successMessage)
  } catch (error) {
    ElMessage.error(`复制失败：${error.message}`)
  }
}

const copyResultJson = () => {
  if (!selectedDataSourceTestResult.value) return
  copyText(selectedDataSourceTestResult.value.detail || formatTestDetail(resultPayload.value), '请求结果已复制')
}

const downloadResultJson = () => {
  if (!selectedDataSource.value || !selectedDataSourceTestResult.value) return
  const text = selectedDataSourceTestResult.value.detail || formatTestDetail(resultPayload.value)
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = String(selectedDataSource.value.name || 'data-source').replace(/[^\w\u4e00-\u9fa5-]+/g, '_')
  link.href = url
  link.download = `${safeName}_${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('JSON 已下载')
}

const clearRequestHistory = () => {
  if (!selectedDataSource.value) return
  dataSourceStore.clearRequestHistory(selectedDataSource.value.id)
  ElMessage.success('请求历史已清空')
}

const getDataSourceUrl = (source) => {
  const requester = dataSourceStore.getRequester(source.requesterId)
  if (!requester || !source.requestConfig) return source.config?.url || '未配置请求地址'
  return buildRequesterUrl({
    baseUrl: requester.baseUrl,
    path: source.requestConfig.path,
    queryRows: source.requestConfig.queryRows
  })
}

const openRequesterDialog = (requester = null) => {
  editingRequesterId.value = requester?.id || null
  requesterForm.value = requester
    ? {
      name: requester.name,
      baseUrl: requester.baseUrl,
      auth: { type: 'none', ...(requester.auth || {}) },
      headerRows: headersToRows(requester.headers),
      timeout: requester.timeout || 15000
    }
    : defaultRequesterForm()
  showRequesterDialog.value = true
}

const addRequesterHeaderRow = () => {
  requesterForm.value.headerRows.push(createKeyValueRow())
}

const removeRequesterHeaderRow = (index) => {
  requesterForm.value.headerRows.splice(index, 1)
  if (requesterForm.value.headerRows.length === 0) addRequesterHeaderRow()
}

const saveRequester = () => {
  if (!requesterForm.value.name.trim()) {
    ElMessage.warning('请输入请求器名称')
    return
  }
  if (!requesterForm.value.baseUrl.trim()) {
    ElMessage.warning('请输入基础地址')
    return
  }

  const payload = {
    name: requesterForm.value.name.trim(),
    baseUrl: requesterForm.value.baseUrl.trim(),
    auth: { ...requesterForm.value.auth },
    headers: normalizeKeyValueRows(requesterForm.value.headerRows),
    timeout: requesterForm.value.timeout
  }

  if (editingRequesterId.value) {
    dataSourceStore.updateRequester(editingRequesterId.value, payload)
    ElMessage.success('请求器已更新')
  } else {
    const requester = dataSourceStore.addRequester(payload)
    selectedRequesterId.value = requester.id
    ElMessage.success('请求器已创建')
  }

  showRequesterDialog.value = false
}

const deleteRequester = async (id) => {
  try {
    await ElMessageBox.confirm('删除后相关数据源会失去请求器，是否继续？', '删除请求器', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    dataSourceStore.removeRequester(id)
    selectedRequesterId.value = requesters.value[0]?.id || ''
    ElMessage.success('请求器已删除')
  } catch { }
}

const openDataSourceDialog = (sourceOrOptions = null) => {
  const isSource = sourceOrOptions?.id && sourceOrOptions?.type === 'api'
  const requestConfig = sourceOrOptions?.requestConfig || {}
  editingDataSourceId.value = isSource ? sourceOrOptions.id : null
  dataSourceForm.value = isSource
    ? defaultDataSourceForm({
      name: sourceOrOptions.name,
      requesterId: sourceOrOptions.requesterId || requesters.value[0]?.id || '',
      method: requestConfig.method || 'GET',
      path: requestConfig.path || '',
      queryRows: cloneRows(requestConfig.queryRows),
      headerRows: cloneRows(requestConfig.headerRows),
      bodyText: requestConfig.body ? JSON.stringify(requestConfig.body, null, 2) : ''
    })
    : defaultDataSourceForm({
      requesterId: sourceOrOptions?.requesterId || selectedRequester.value?.id || requesters.value[0]?.id || ''
    })
  showDataSourceDialog.value = true
}

const addDataSourceRow = (field) => {
  dataSourceForm.value[field].push(createKeyValueRow())
}

const removeDataSourceRow = (field, index) => {
  dataSourceForm.value[field].splice(index, 1)
  if (dataSourceForm.value[field].length === 0) addDataSourceRow(field)
}

const buildDataSourcePayload = () => {
  if (!dataSourceForm.value.name.trim()) throw new Error('请输入数据源名称')
  if (!dataSourceForm.value.requesterId) throw new Error('请选择请求器')
  if (!dataSourceForm.value.path.trim()) throw new Error('请输入接口路径')

  return {
    name: dataSourceForm.value.name.trim(),
    requesterId: dataSourceForm.value.requesterId,
    method: dataSourceForm.value.method,
    path: dataSourceForm.value.path.trim(),
    queryRows: cloneRows(dataSourceForm.value.queryRows),
    headerRows: cloneRows(dataSourceForm.value.headerRows),
    body: parseJsonText(dataSourceForm.value.bodyText, null),
    mapping: {}
  }
}

const saveDataSource = () => {
  try {
    const payload = buildDataSourcePayload()

    if (editingDataSourceId.value) {
      dataSourceStore.updateDataSource(editingDataSourceId.value, {
        name: payload.name,
        requesterId: payload.requesterId,
        requestConfig: {
          method: payload.method,
          path: payload.path,
          queryRows: payload.queryRows,
          headerRows: payload.headerRows,
          body: payload.body,
          mapping: payload.mapping
        }
      })
      selectedDataSourceId.value = editingDataSourceId.value
      ElMessage.success('数据源已更新')
    } else {
      const source = dataSourceStore.addApiDataSource(payload)
      selectedDataSourceId.value = source.id
      ElMessage.success('数据源已创建')
    }

    activeSection.value = 'dataSources'
    showDataSourceDialog.value = false
  } catch (error) {
    ElMessage.warning(error.message)
  }
}

const deleteDataSource = async (id) => {
  try {
    await ElMessageBox.confirm('删除后组件将无法继续使用该数据源，是否继续？', '删除数据源', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    dataSourceStore.removeDataSource(id)
    selectedDataSourceId.value = apiDataSources.value[0]?.id || ''
    ElMessage.success('数据源已删除')
  } catch { }
}

const testRequester = async (requester) => {
  try {
    if (!requester.baseUrl) throw new Error('基础地址未配置')
    const response = await fetch(requester.baseUrl, {
      headers: buildRequesterHeaders({ requester })
    })
    ElMessage.success(`请求器可访问：HTTP ${response.status}`)
  } catch (error) {
    ElMessage.error(`测试失败：${error.message}`)
  }
}

const testDataSource = async (id) => {
  try {
    await dataSourceStore.fetchData(id)
    ElMessage.success('数据源测试成功')
  } catch (error) {
    ElMessage.error(`测试失败：${error.message}`)
  }
}

const testDataSourceForm = async () => {
  let requestUrl = ''
  let requestMethod = dataSourceForm.value.method
  let requestedAt = Date.now()
  let startedAt = performance.now()
  try {
    const payload = buildDataSourcePayload()
    const requester = dataSourceStore.getRequester(payload.requesterId)
    requestMethod = payload.method
    requestUrl = buildRequesterUrl({
      baseUrl: requester?.baseUrl || '',
      path: payload.path,
      queryRows: payload.queryRows
    })
    requestedAt = Date.now()
    startedAt = performance.now()
    const response = await fetch(requestUrl, {
      method: payload.method,
      headers: buildRequesterHeaders({ requester, headerRows: payload.headerRows }),
      body: payload.body ? JSON.stringify(payload.body) : undefined
    })
    const duration = Math.round(performance.now() - startedAt)
    const text = await response.text()
    const rawData = parseResponseText(text)
    ElMessage.success(`测试完成：HTTP ${response.status}`)
    if (editingDataSourceId.value) {
      dataSourceStore.setLastRequestResult(editingDataSourceId.value, {
        status: 'success',
        title: `HTTP ${response.status}`,
        message: `${requester?.name || '请求器'} · ${payload.method} ${payload.path}`,
        detail: formatTestDetail(rawData),
        rawData,
        transformedData: rawData,
        error: '',
        statusCode: response.status,
        duration,
        requestedAt,
        method: payload.method,
        url: requestUrl
      })
    }
  } catch (error) {
    if (editingDataSourceId.value) {
      dataSourceStore.setLastRequestResult(editingDataSourceId.value, {
        status: 'failed',
        title: '请求测试失败',
        message: dataSourceForm.value.name || '未命名数据源',
        detail: error.message || '未知错误',
        rawData: null,
        transformedData: null,
        error: error.message || '未知错误',
        statusCode: error.statusCode ?? null,
        duration: error.duration ?? Math.round(performance.now() - startedAt),
        requestedAt: error.requestedAt || requestedAt,
        method: error.method || requestMethod,
        url: error.url || requestUrl
      })
    }
    ElMessage.error(`测试失败：${error.message}`)
  }
}

const openTransformDialog = () => {
  if (!selectedDataSource.value || !selectedDataSourceTestResult.value?.rawData) {
    ElMessage.warning('请先成功请求一次数据源')
    return
  }

  const transform = selectedDataSource.value.transform || {}
  transformForm.value = {
    enabled: Boolean(transform.enabled),
    code: transform.code || transform.script?.code || defaultTransformCode
  }
  transformPreviewOutput.value = ''
  transformPreviewError.value = ''
  showTransformDialog.value = true
}

const resetTransformCode = () => {
  transformForm.value.code = defaultTransformCode
}

const runTransformPreview = () => {
  if (!selectedDataSourceTestResult.value?.rawData) {
    transformPreviewError.value = '没有可转换的原始数据'
    return null
  }

  transformPreviewLoading.value = true
  transformPreviewError.value = ''

  try {
    const result = transformForm.value.enabled
      ? transformData(selectedDataSourceTestResult.value.rawData, {
        script: {
          enabled: true,
          code: transformForm.value.code
        }
      })
      : selectedDataSourceTestResult.value.rawData

    transformPreviewOutput.value = formatTestDetail(result)
    return result
  } catch (error) {
    transformPreviewError.value = `转换失败：${error.message}`
    return null
  } finally {
    transformPreviewLoading.value = false
  }
}

const saveTransformConfig = () => {
  if (!selectedDataSource.value) return

  dataSourceStore.updateDataSourceTransform(selectedDataSource.value.id, transformForm.value)
  const transformedData = runTransformPreview()

  if (transformedData !== null && selectedDataSourceTestResult.value) {
    dataSourceStore.setLastRequestResult(selectedDataSource.value.id, {
      ...selectedDataSourceTestResult.value,
      status: 'success',
      detail: formatTestDetail(transformedData),
      transformedData,
      error: ''
    }, { recordHistory: false })
  }

  showTransformDialog.value = false
  ElMessage.success('数据转换已保存')
}

const parseResponseText = (text) => {
  if (!text) return ''
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const formatTestDetail = (value) => {
  if (value === null || value === undefined || value === '') return '空响应'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>

<style scoped>
.datasource-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--lc-bg-page);
}

.panel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 28px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.panel-header h3,
.detail-title h4 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.panel-header p,
.detail-title p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.panel-header h3 {
  font-size: 22px;
  line-height: 1.2;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.summary-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 999px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
}

.panel-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 18px;
  overflow: hidden;
  padding: 18px;
}

.asset-sidebar,
.content-card,
.hero-card {
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-panel);
  box-shadow: var(--lc-shadow-sm);
}

.asset-sidebar {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-tabs {
  margin: 14px;
}

.section-heading {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.asset-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
}

.asset-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.asset-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: inset 3px 0 0 var(--el-color-primary);
}

.asset-item:hover {
  border-color: var(--el-border-color);
  background: var(--el-fill-color-light);
}

.asset-row {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.asset-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.asset-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.asset-url,
.asset-meta,
.binding-item span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.asset-detail {
  min-height: 0;
  overflow-y: auto;
  padding: 0;
}

.hero-card {
  padding: 22px;
  margin-bottom: 18px;
}

.detail-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.detail-title h4 {
  margin-top: 10px;
  font-size: 24px;
  line-height: 1.2;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-actions,
.inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.metric-card span {
  display: block;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.metric-card strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

.metric-card.compact {
  padding: 12px;
}

.metric-card.compact strong {
  font-size: 15px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(280px, 36%) minmax(0, 1fr);
  gap: 18px;
}

.content-card {
  min-height: 220px;
  overflow: hidden;
}

.header-chip-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.header-chip {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.header-chip span,
.header-chip strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-chip span {
  margin-bottom: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.header-chip strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.empty-inline {
  margin: 14px;
  padding: 28px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.binding-card {
  min-width: 0;
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.binding-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.binding-item.compact {
  align-items: flex-start;
}

.binding-item div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-block {
  margin: 14px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.param-block label {
  display: block;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.param-block strong,
.param-block pre {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.param-group h5 {
  margin: 6px 2px;
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.empty-compact {
  padding: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.detail-empty {
  margin-top: 15vh;
}

.result-card {
  margin-top: 18px;
}

.result-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.result-empty {
  margin: 14px;
}

.result-card :deep(.app-error) {
  margin: 14px;
}

.result-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px 0;
}

.result-meta strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.result-meta span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.request-debug-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 14px 0;
}

.request-debug-grid div {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-subtle);
}

.request-debug-grid .wide {
  grid-column: 1 / -1;
}

.request-debug-grid span,
.request-debug-grid strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-debug-grid span {
  margin-bottom: 4px;
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

.request-debug-grid strong {
  color: var(--lc-text-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.result-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 12px 14px 0;
  padding: 10px 12px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-subtle);
}

.result-preview-toolbar span {
  overflow: hidden;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 14px 14px;
}

.result-table-wrap {
  margin: 12px 14px 14px;
}

.field-path-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  margin: 12px 14px 14px;
  overflow: auto;
}

.field-path-header,
.field-path-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.field-path-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 10px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-subtle);
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  font-weight: 600;
}

.field-path-item {
  padding: 10px 12px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-panel);
}

.field-path-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.field-path-main strong,
.field-path-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-path-main strong {
  color: var(--lc-text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 18px;
}

.field-path-main span {
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

.field-path-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.request-history-card {
  margin-top: 18px;
}

.result-body {
  margin: 12px 14px 14px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.5;
}

.kv-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv-row {
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  gap: 8px;
  align-items: center;
}

.method-path {
  width: 100%;
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 8px;
}

.method-select {
  width: 120px;
}

.transform-dialog-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 42%);
  gap: 16px;
  min-height: 520px;
}

.transform-editor,
.transform-preview {
  min-width: 0;
  overflow: hidden;
}

.preview-header {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  font-size: 14px;
  font-weight: 700;
}

.preview-output {
  min-height: 470px;
  max-height: 470px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  color: var(--el-text-color-primary);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-alert {
  margin: 14px;
}

@media screen and (max-width: 1180px) {
  .panel-body {
    grid-template-columns: 320px minmax(0, 1fr);
  }

  .metric-grid,
  .detail-grid,
  .result-summary-grid,
  .request-debug-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .request-debug-grid .wide {
    grid-column: 1 / -1;
  }
}

@media screen and (max-width: 900px) {
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .panel-body {
    grid-template-columns: 1fr;
    grid-template-rows: 300px minmax(0, 1fr);
  }

  .transform-dialog-body {
    grid-template-columns: 1fr;
  }
}
</style>
