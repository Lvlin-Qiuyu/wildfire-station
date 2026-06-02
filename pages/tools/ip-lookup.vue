<template>
  <div class="tool-page">
    <h2>🌐 IP 信息查询</h2>

    <div class="search-area">
      <div class="input-row">
        <input
          v-model="ipInput"
          type="text"
          placeholder="输入 IP 地址，如 8.8.8.8"
          @keyup.enter="lookup"
        />
        <button class="btn-primary" @click="lookup" :disabled="loading">
          {{ loading ? '查询中...' : '查询' }}
        </button>
        <button class="btn-secondary" @click="lookupMyIp" :disabled="loading">
          查询我的 IP
        </button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="result" class="result-card">
      <div class="result-header">
        <span class="result-ip">{{ result.ip }}</span>
        <span class="result-type" v-if="result.version === 'IPv6'">IPv6</span>
        <span class="result-type v4" v-else>IPv4</span>
      </div>

      <div class="result-grid">
        <div class="result-item">
          <span class="label">📍 归属地</span>
          <span class="value">{{ [result.country, result.region, result.city].filter(Boolean).join(' · ') || '未知' }}</span>
        </div>
        <div class="result-item">
          <span class="label">🏢 ISP / 运营商</span>
          <span class="value">{{ result.org || result.isp || '未知' }}</span>
        </div>
        <div class="result-item">
          <span class="label">🕐 时区</span>
          <span class="value">{{ result.timezone || '未知' }}</span>
        </div>
        <div class="result-item">
          <span class="label">🌍 经纬度</span>
          <span class="value" v-if="result.lat && result.lon">{{ result.lat }}, {{ result.lon }}</span>
          <span class="value" v-else>未知</span>
        </div>
        <div class="result-item">
          <span class="label">🏷️ ASN</span>
          <span class="value">{{ result.asn || '未知' }}</span>
        </div>
        <div class="result-item" v-if="result.country_code">
          <span class="label">🏳️ 国家代码</span>
          <span class="value">{{ result.country_code }}</span>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: 'IP 信息查询 - 野火小站' })

const ipInput = ref('')
const loading = ref(false)
const error = ref('')
const result = ref(null)

async function lookup() {
  const ip = ipInput.value.trim()
  if (!ip) {
    error.value = '请输入 IP 地址'
    return
  }
  if (!isValidIp(ip)) {
    error.value = 'IP 地址格式不正确'
    return
  }
  await doLookup(ip)
}

async function lookupMyIp() {
  await doLookup('')
}

async function doLookup(ip) {
  loading.value = true
  error.value = ''
  result.value = null

  try {
    const url = ip
      ? `https://ipapi.co/${ip}/json/`
      : 'https://ipapi.co/json/'

    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      error.value = data.reason || `查询失败：${data.error}`
      return
    }

    result.value = {
      ip: data.ip || ip || '',
      version: data.version || (data.ip?.includes(':') ? 'IPv6' : 'IPv4'),
      country: data.country_name || data.country || '',
      country_code: data.country_code || '',
      region: data.region || '',
      city: data.city || '',
      isp: data.org || '',
      org: data.org || '',
      timezone: data.timezone || '',
      lat: data.latitude ?? data.lat ?? '',
      lon: data.longitude ?? data.lon ?? '',
      asn: data.asn || '',
    }
  } catch (e) {
    // Fallback to ip-api.com
    try {
      const url2 = ip
        ? `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp,org,timezone,lat,lon,as,query`
        : 'http://ip-api.com/json/?fields=status,message,country,regionName,city,isp,org,timezone,lat,lon,as,query'

      const res2 = await fetch(url2)
      const data2 = await res2.json()

      if (data2.status === 'fail') {
        error.value = data2.message || '查询失败'
        return
      }

      result.value = {
        ip: data2.query || ip || '',
        version: data2.query?.includes(':') ? 'IPv6' : 'IPv4',
        country: data2.country || '',
        country_code: data2.countryCode || '',
        region: data2.regionName || '',
        city: data2.city || '',
        isp: data2.isp || '',
        org: data2.org || '',
        timezone: data2.timezone || '',
        lat: data2.lat ?? '',
        lon: data2.lon ?? '',
        asn: data2.as || '',
      }
    } catch (e2) {
      error.value = '网络请求失败，请检查网络后重试'
    }
  } finally {
    loading.value = false
  }
}

function isValidIp(ip) {
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const v6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  return v4.test(ip) || v6.test(ip)
}
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
}

.search-area {
  margin-bottom: 1.5rem;
}

.input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.input-row input {
  flex: 1;
  min-width: 200px;
  padding: 0.7rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.input-row input:focus {
  outline: none;
  border-color: #10b981;
}

.btn-primary {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.7rem 1.5rem;
  background: white;
  color: #10b981;
  border: 2px solid #10b981;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #ecfdf5;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  color: #e74c3c;
  border-radius: 8px;
  font-size: 0.95rem;
  border: 1px solid #fecaca;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.result-ip {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a1a1a;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.result-type {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #dbeafe;
  color: #1d4ed8;
}

.result-type.v4 {
  background: #d1fae5;
  color: #065f46;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-item .label {
  font-size: 0.85rem;
  color: #888;
  font-weight: 500;
}

.result-item .value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
  word-break: break-all;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .input-row {
    flex-direction: column;
  }
  .input-row input {
    min-width: auto;
    width: 100%;
  }
  .input-row button {
    width: 100%;
  }
  .result-grid {
    grid-template-columns: 1fr;
  }
  .result-ip {
    font-size: 1.1rem;
  }
}
</style>
