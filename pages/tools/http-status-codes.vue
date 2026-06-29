<template>
  <div class="tool-page">
    <h2>🌐 HTTP 状态码速查手册</h2>
    <p class="subtitle">可视化展示 HTTP 状态码，按类别分组，支持搜索和详细说明</p>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索状态码或描述..."
        class="search-input"
      />
    </div>

    <!-- 分类切换 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['tab-btn', { active: activeCategory === cat.id }]"
        @click="activeCategory = cat.id"
      >
        {{ cat.icon }} {{ cat.label }}
        <span class="tab-count">{{ getStatusCount(cat.id) }}</span>
      </button>
    </div>

    <!-- 状态码卡片 -->
    <div class="codes-grid">
      <div
        v-for="code in filteredCodes"
        :key="code.code"
        :class="['code-card', `cat-${getCodeCategory(code.code)}`]"
        @click="toggleDetail(code.code)"
      >
        <div class="code-header">
          <span class="code-number">{{ code.code }}</span>
          <span class="code-phrase">{{ code.phrase }}</span>
        </div>
        <div v-if="code.tags" class="code-tags">
          <span v-for="tag in code.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <!-- 展开详情 -->
        <div v-if="expandedCode === code.code" class="code-detail">
          <p class="detail-desc">{{ code.description }}</p>
          <div v-if="code.scenarios" class="detail-section">
            <strong>常见场景：</strong>
            <ul>
              <li v-for="s in code.scenarios" :key="s">{{ s }}</li>
            </ul>
          </div>
          <div v-if="code.tips" class="detail-section">
            <strong>建议：</strong>
            <p>{{ code.tips }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredCodes.length === 0" class="empty-state">
      未找到匹配的状态码
    </div>

    <div class="notice">
      <p>💡 点击任意状态码卡片查看详细说明、常见场景和使用建议。收录约 60 个常用 HTTP 状态码。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'HTTP 状态码速查手册 - 野火小站' })

const searchText = ref('')
const activeCategory = ref('all')
const expandedCode = ref(null)

// ==================== 分类配置 ====================
const categories = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: '1xx', label: '信息响应', icon: 'ℹ️' },
  { id: '2xx', label: '成功', icon: '✅' },
  { id: '3xx', label: '重定向', icon: '🔄' },
  { id: '4xx', label: '客户端错误', icon: '⚠️' },
  { id: '5xx', label: '服务端错误', icon: '❌' },
]

// ==================== 状态码数据 ====================
const statusCodes = [
  // 1xx 信息响应
  { code: 100, phrase: 'Continue', description: '服务器已收到请求的初始部分，客户端应继续发送剩余部分。常用于大文件上传或需要请求体的场景。', scenarios: ['客户端发送 Expect: 100-continue 头', '大文件分块上传'], tags: ['HTTP/1.1'] },
  { code: 101, phrase: 'Switching Protocols', description: '服务器同意将连接协议切换为客户端请求的协议。通常在 WebSocket 升级时使用。', scenarios: ['WebSocket 连接建立', 'HTTP 升级为 HTTP/2'], tags: ['WebSocket'] },
  { code: 103, phrase: 'Early Hints', description: '用于在最终 HTTP 响应之前返回一些响应头，主要与 Link 头和预加载相关。', scenarios: ['页面预加载资源', 'CDN 提前返回 Link 头'], tags: ['性能'] },

  // 2xx 成功
  { code: 200, phrase: 'OK', description: '请求成功。服务器已成功处理请求并返回了预期的响应。', scenarios: ['GET 请求获取资源', 'POST 请求创建资源', 'API 正常响应'], tags: ['最常用'] },
  { code: 201, phrase: 'Created', description: '请求成功并创建了新资源。通常在 POST 创建资源后返回。', scenarios: ['创建新用户', '新增文章', '上传文件'], tips: '响应应包含 Location 头指向新资源位置' },
  { code: 202, phrase: 'Accepted', description: '请求已被接受处理，但处理尚未完成。适用于异步操作。', scenarios: ['异步任务提交', '邮件发送请求', '批量导入'], tips: '适合需要长时间处理的任务，可通过轮询获取最终结果' },
  { code: 204, phrase: 'No Content', description: '请求成功，但服务器不返回响应体。常用于 PUT/PATCH 更新和 DELETE 删除。', scenarios: ['更新资源成功', '删除资源成功', 'PUT 更新'], tags: ['常用'] },
  { code: 206, phrase: 'Partial Content', description: '服务器成功返回了请求的部分内容。用于分块下载/断点续传。', scenarios: ['视频流分片', '断点续传下载', 'Range 请求'], tags: ['大文件'] },
  { code: 226, phrase: 'IM Used', description: '服务器已完成对 GET 请求的实例操作，响应表示对实例操作的结果。', scenarios: ['Delta 编码'] },

  // 3xx 重定向
  { code: 301, phrase: 'Moved Permanently', description: '请求的资源已永久移动到新 URL。搜索引擎会更新索引到新地址。', scenarios: ['网站域名迁移', 'HTTP 重定向到 HTTPS', 'URL 结构调整'], tips: '搜索引擎会转移权重到新 URL，SEO 迁移首选' },
  { code: 302, phrase: 'Found', description: '请求的资源临时位于另一个 URL。浏览器会缓存原始 URL 并继续访问旧地址。', scenarios: ['临时维护跳转', 'A/B 测试', '临时活动页面'], tags: ['常用'] },
  { code: 303, phrase: 'See Other', description: '服务器返回此响应后，客户端应对新 URL 执行 GET 请求。常用于 POST 之后重定向。', scenarios: ['表单提交后跳转', 'PRG 模式（Post-Redirect-Get）'], tags: ['表单'] },
  { code: 304, phrase: 'Not Modified', description: '资源自上次请求以来未被修改。客户端应使用缓存的版本。', scenarios: ['浏览器缓存', 'ETag/If-None-Match 匹配', 'Last-Modified 校验'], tags: ['缓存', '常用'] },
  { code: 307, phrase: 'Temporary Redirect', description: '与 302 类似，但严格要求不改变请求方法（POST 仍为 POST）。', scenarios: ['HTTPS 升级', '临时重定向保持请求方法'] },
  { code: 308, phrase: 'Permanent Redirect', description: '与 301 类似，但严格要求不改变请求方法。', scenarios: ['API 端点迁移', '保持 POST/PUT 方法不变'] },

  // 4xx 客户端错误
  { code: 400, phrase: 'Bad Request', description: '服务器无法理解客户端的请求，通常因为请求语法错误、参数缺失或格式不对。', scenarios: ['请求参数格式错误', 'JSON 解析失败', '缺少必填字段'], tags: ['常用'] },
  { code: 401, phrase: 'Unauthorized', description: '请求需要身份验证。客户端未提供有效的认证凭据。', scenarios: ['未登录访问受保护页面', 'Token 过期', 'API Key 缺失'], tags: ['认证', '常用'] },
  { code: 403, phrase: 'Forbidden', description: '服务器理解请求，但拒绝执行。客户端没有权限访问该资源。', scenarios: ['权限不足', 'IP 被封禁', '目录禁止列出', 'WAF 拦截'], tags: ['权限', '常用'] },
  { code: 404, phrase: 'Not Found', description: '服务器找不到请求的资源。最常见的 HTTP 错误之一。', scenarios: ['页面不存在', 'API 端点错误', '资源已被删除'], tags: ['最常用'] },
  { code: 405, phrase: 'Method Not Allowed', description: '请求的 HTTP 方法不被允许用于该资源。', scenarios: ['对只读资源使用 POST', 'DELETE 方法被禁用'], tags: ['REST'] },
  { code: 406, phrase: 'Not Acceptable', description: '服务器无法生成客户端可接受的内容类型。', scenarios: ['Accept 头不匹配', '请求 XML 但只支持 JSON'] },
  { code: 408, phrase: 'Request Timeout', description: '服务器在等待请求的时间内未收到完整请求。', scenarios: ['网络超时', '客户端发送过慢', '大文件上传中断'], tags: ['超时'] },
  { code: 409, phrase: 'Conflict', description: '请求与服务器当前状态冲突。通常与 PUT 操作相关。', scenarios: ['创建已存在的资源', '版本冲突', '并发修改'], tags: ['并发'] },
  { code: 410, phrase: 'Gone', description: '资源已永久删除，不再可用。比 404 更明确地表示资源已不存在。', scenarios: ['API 版本废弃', '资源永久删除'] },
  { code: 411, phrase: 'Length Required', description: '服务器拒绝未包含 Content-Length 头的请求。', scenarios: ['POST 请求缺少 Content-Length'] },
  { code: 412, phrase: 'Precondition Failed', description: '服务器检测到客户端请求中的条件不满足。', scenarios: ['If-Match/If-Unmodified-Since 条件失败'] },
  { code: 413, phrase: 'Payload Too Large', description: '请求体大小超过服务器允许的限制。', scenarios: ['上传文件过大', '请求体超限'], tags: ['上传'] },
  { code: 414, phrase: 'URI Too Long', description: '请求的 URL 长度超过服务器限制。', scenarios: ['GET 参数过长', 'URL 编码后超长'] },
  { code: 415, phrase: 'Unsupported Media Type', description: '请求的 Content-Type 不被服务器支持。', scenarios: ['发送 XML 但服务器只接受 JSON', '缺少 Content-Type 头'], tags: ['常用'] },
  { code: 418, phrase: "I'm a Teapot", description: 'RFC 2324 定义的状态码，服务器拒绝泡咖啡因为它是茶壶。这个彩蛋状态码来自超文本咖啡壶控制协议。', scenarios: ['愚人节彩蛋', '拒绝处理的幽默回应'], tags: ['彩蛋'] },
  { code: 422, phrase: 'Unprocessable Entity', description: '请求格式正确但语义错误，服务器无法处理。常用于表单验证。', scenarios: ['表单验证失败', '业务规则校验不通过'], tags: ['验证'] },
  { code: 423, phrase: 'Locked', description: '正在访问的资源被锁定。', scenarios: ['文件被其他用户锁定编辑', 'WebDAV 资源锁定'] },
  { code: 428, phrase: 'Precondition Required', description: '服务器要求客户端发送条件请求。', scenarios: ['防止丢失更新（PUT 竞态）'] },
  { code: 429, phrase: 'Too Many Requests', description: '客户端在给定时间内发送了太多请求，触发了速率限制。', scenarios: ['API 调用频率超限', '短时间大量请求', 'DDoS 防护'], tags: ['限流', '常用'], tips: '响应应包含 Retry-After 头，告知客户端何时可以重试' },
  { code: 431, phrase: 'Request Header Fields Too Large', description: '请求头字段过大，超过服务器限制。', scenarios: ['Cookie 过多', '超大 Authorization 头'] },
  { code: 451, phrase: 'Unavailable For Legal Reasons', description: '因法律要求无法访问该资源。', scenarios: ['版权保护', '政府审查', 'GDPR 合规'] },

  // 5xx 服务端错误
  { code: 500, phrase: 'Internal Server Error', description: '服务器遇到未知错误，无法完成请求。最常见的服务端错误。', scenarios: ['未捕获的异常', '数据库连接失败', '代码 Bug', '配置错误'], tags: ['最常用'] },
  { code: 501, phrase: 'Not Implemented', description: '服务器不支持请求的功能。', scenarios: ['使用了服务器不支持的 HTTP 方法', '功能尚未开发'] },
  { code: 502, phrase: 'Bad Gateway', description: '网关或代理服务器从上游服务器收到了无效响应。', scenarios: ['Nginx 反向代理后端挂了', 'API 网关上游超时', '微服务间通信失败'], tags: ['网关', '常用'] },
  { code: 503, phrase: 'Service Unavailable', description: '服务器暂时不可用，通常因为维护或过载。', scenarios: ['服务器维护', '流量过载', '依赖服务不可用'], tags: ['运维', '常用'], tips: '响应应包含 Retry-After 头' },
  { code: 504, phrase: 'Gateway Timeout', description: '网关或代理服务器没有及时从上游服务器收到响应。', scenarios: ['后端处理超时', '数据库查询太慢', '微服务调用超时'], tags: ['网关', '常用'] },
  { code: 505, phrase: 'HTTP Version Not Supported', description: '服务器不支持请求中使用的 HTTP 协议版本。', scenarios: ['使用了不支持的 HTTP 版本'] },
  { code: 506, phrase: 'Variant Also Negotiates', description: '服务器存在内部配置错误。', scenarios: ['透明内容协商配置问题'] },
  { code: 507, phrase: 'Insufficient Storage', description: '服务器存储空间不足，无法完成请求。', scenarios: ['磁盘空间满', '数据库空间不足'], tags: ['存储'] },
  { code: 508, phrase: 'Loop Detected', description: '服务器检测到无限循环。', scenarios: ['WebDAV 资源循环绑定'] },
  { code: 510, phrase: 'Not Extended', description: '服务器需要对请求进行进一步扩展才能处理。', scenarios: ['缺少必选的扩展'] },
  { code: 511, phrase: 'Network Authentication Required', description: '客户端需要通过认证才能访问网络。', scenarios: ['公共 WiFi 登录页', ' captive portal'] },
]

// ==================== 过滤逻辑 ====================
const filteredCodes = computed(() => {
  let codes = statusCodes
  // 分类过滤
  if (activeCategory.value !== 'all') {
    const prefix = activeCategory.value
    codes = codes.filter(c => Math.floor(c.code / 100) === parseInt(prefix))
  }
  // 搜索过滤
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase()
    codes = codes.filter(c =>
      String(c.code).includes(q) ||
      c.phrase.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  }
  return codes
})

function getCodeCategory(code) {
  return Math.floor(code / 100)
}

function getStatusCount(catId) {
  if (catId === 'all') return statusCodes.length
  const prefix = parseInt(catId)
  return statusCodes.filter(c => Math.floor(c.code / 100) === prefix).length
}

function toggleDetail(code) {
  expandedCode.value = expandedCode.value === code ? null : code
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}
.subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 1rem;
}
.search-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.search-input:focus {
  outline: none;
  border-color: #10b981;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 0.45rem 0.9rem;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.tab-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #22c55e;
  font-weight: 600;
}
.tab-btn:hover:not(.active) {
  border-color: #10b981;
}
.tab-count {
  font-size: 0.75rem;
  background: #e9ecef;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  color: #888;
}
.tab-btn.active .tab-count {
  background: #d1fae5;
  color: #22c55e;
}

/* 状态码网格 */
.codes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.code-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #e0e0e0;
}
.code-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}
.code-card.cat-1 { border-left-color: #3b82f6; }
.code-card.cat-2 { border-left-color: #22c55e; }
.code-card.cat-3 { border-left-color: #f59e0b; }
.code-card.cat-4 { border-left-color: #ef4444; }
.code-card.cat-5 { border-left-color: #8b5cf6; }

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}
.code-number {
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}
.cat-1 .code-number { color: #3b82f6; }
.cat-2 .code-number { color: #22c55e; }
.cat-3 .code-number { color: #f59e0b; }
.cat-4 .code-number { color: #ef4444; }
.cat-5 .code-number { color: #8b5cf6; }

.code-phrase {
  font-size: 0.82rem;
  color: #666;
  text-align: right;
  font-weight: 500;
}

.code-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}
.tag {
  font-size: 0.72rem;
  padding: 0.15rem 0.4rem;
  background: #f3f4f6;
  border-radius: 4px;
  color: #888;
}

/* 展开详情 */
.code-detail {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid #f0f0f0;
  font-size: 0.88rem;
}
.detail-desc {
  color: #555;
  line-height: 1.6;
  margin-bottom: 0.6rem;
}
.detail-section {
  margin-bottom: 0.5rem;
}
.detail-section strong {
  color: #333;
  font-size: 0.85rem;
}
.detail-section ul {
  margin: 0.3rem 0 0 1.2rem;
  color: #666;
}
.detail-section li {
  margin-bottom: 0.2rem;
  font-size: 0.85rem;
}
.detail-section p {
  color: #666;
  margin-top: 0.2rem;
  font-size: 0.85rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #aaa;
  font-size: 0.95rem;
}

.notice {
  background: #f8fff8;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}
.notice p {
  font-size: 0.85rem;
  color: #666;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .codes-grid {
    grid-template-columns: 1fr;
  }
  .category-tabs {
    gap: 0.3rem;
  }
  .tab-btn {
    font-size: 0.78rem;
    padding: 0.35rem 0.6rem;
  }
}
</style>
