<template>
  <div class="tool-page">
    <h2>🏥 网站健康检查器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="input-section">
      <div class="input-row">
        <input v-model="url" placeholder="输入网站地址，例如 https://example.com" @keyup.enter="startCheck" />
        <button class="btn-primary" @click="startCheck" :disabled="checking || !url.trim()">开始检查</button>
      </div>
    </div>

    <div v-if="checking" class="loading">
      <div class="spinner"></div> 正在检查...
    </div>

    <div v-if="results && !checking" class="results">
      <div v-for="item in results" :key="item.label" :class="['card', item.status]">
        <div class="card-header">
          <span class="card-icon">{{ item.status === 'ok' ? '✅' : item.status === 'warn' ? '⚠️' : '❌' }}</span>
          <span class="card-label">{{ item.label }}</span>
        </div>
        <div class="card-value">{{ item.value }}</div>
        <div class="card-desc">{{ item.desc }}</div>
      </div>
    </div>

    <div v-if="corsWarning" class="cors-warning">
      <p>⚠️ 由于浏览器 CORS 安全策略限制，部分检查项目可能无法直接在浏览器中完成：</p>
      <ul>
        <li>HTTP 状态码检测：需要服务器允许跨域访问</li>
        <li>SSL 证书信息：浏览器无法直接获取证书详情</li>
        <li>DNS 解析时间：无法在浏览器端精确测量</li>
      </ul>
      <p>建议使用后端 API 或在线工具获取完整检测信息。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

useHead({ title: '网站健康检查器 - 野火小站' })

const url = ref('')
const checking = ref(false)
const results = ref<any[]>([])
const corsWarning = ref(false)

async function startCheck() {
  let targetUrl = url.value.trim()
  if (!targetUrl) return
  if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl

  checking.value = true
  corsWarning.value = true
  results.value = []

  const start = performance.now()
  let statusOk = false
  let statusText = '无法检测'

  try {
    const resp = await fetch(targetUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache' })
    const elapsed = performance.now() - start
    statusOk = resp.ok
    statusText = `${resp.status} ${resp.statusText}`

    results.value = [
      { label: 'HTTP 状态码', value: statusText, status: resp.ok ? 'ok' : resp.status >= 500 ? 'error' : 'warn', desc: resp.ok ? '服务器正常运行' : `服务器返回 ${resp.status}` },
      { label: '响应时间', value: `${elapsed.toFixed(0)} ms`, status: elapsed < 1000 ? 'ok' : elapsed < 3000 ? 'warn' : 'error', desc: elapsed < 500 ? '响应很快' : elapsed < 2000 ? '响应正常' : '响应较慢' },
      { label: 'Content-Type', value: resp.headers.get('content-type') || '未知', status: 'ok', desc: '返回的内容类型' },
      { label: '缓存控制', value: resp.headers.get('cache-control') || '无', status: 'ok', desc: resp.headers.get('cache-control') ? '已配置缓存策略' : '未设置缓存头' },
      { label: 'URL 可达性', value: '✅ 可访问', status: 'ok', desc: 'fetch 请求成功' },
    ]
  } catch (e: any) {
    const elapsed = performance.now() - start
    results.value = [
      { label: 'URL 可达性', value: '❌ 请求失败', status: 'error', desc: `错误: ${e.message}` },
      { label: '可能原因', value: 'CORS 限制 / 网络不可达 / 服务器离线', status: 'warn', desc: '浏览器端无法完成完整检查' },
      { label: '耗时', value: `${elapsed.toFixed(0)} ms`, status: 'warn', desc: elapsed < 3000 ? '连接超时可能由 CORS 阻止' : '连接超时' },
    ]
  }

  // DNS hint
  try {
    const hostname = new URL(targetUrl).hostname
    const dnsStart = performance.now()
    await fetch(`https://${hostname}/`, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' }).catch(() => {})
    const dnsEnd = performance.now()
    results.value.push({ label: '连接测试', value: `${(dnsEnd - dnsStart).toFixed(0)} ms`, status: dnsEnd - dnsStart < 1000 ? 'ok' : 'warn', desc: 'DNS解析+连接（no-cors模式）' })
  } catch {}

  checking.value = false
}
</script>

<style scoped>
.tool-page { max-width: 700px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.input-section { margin-bottom: 20px; }
.input-row { display: flex; gap: 8px; }
.input-row input { flex: 1; padding: 12px 16px; border: 2px solid #ddd; border-radius: 8px; font-size: 15px; }
.input-row input:focus { border-color: #22c55e; outline: none; }
.btn-primary { padding: 12px 24px; background: #22c55e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; white-space: nowrap; }
.btn-primary:hover { background: #16a34a; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.loading { text-align: center; padding: 40px; color: #555; }
.spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid #ddd; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }
.results { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
.card { padding: 14px 16px; border-radius: 10px; border-left: 4px solid; }
.card.ok { background: #f0fdf4; border-color: #22c55e; }
.card.warn { background: #fffbeb; border-color: #f59e0b; }
.card.error { background: #fef2f2; border-color: #ef4444; }
.card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.card-icon { font-size: 16px; }
.card-label { font-weight: bold; font-size: 14px; color: #1a1a2e; }
.card-value { font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; margin-bottom: 4px; }
.card-desc { font-size: 13px; color: #666; }
.cors-warning { margin-top: 20px; padding: 16px; background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; font-size: 13px; line-height: 1.6; color: #92400e; }
.cors-warning ul { margin: 8px 0; padding-left: 20px; }
@media (max-width: 600px) { .tool-page { padding: 12px; } .input-row { flex-direction: column; } }
</style>
