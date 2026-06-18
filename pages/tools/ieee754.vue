<template>
  <div class="tool-page">
    <h2>🔢 IEEE 754 浮点数转换器</h2>
    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>

    <div class="controls">
      <div class="control-group">
        <label>输入浮点数 / 二进制位串</label>
        <div class="input-row">
          <input v-model="inputVal" placeholder="例如：3.14 或 0100000001001000111101011100001010001111010111000010100011" @input="parseInput" />
          <select v-model="inputMode">
            <option value="float">浮点数</option>
            <option value="binary32">32位二进制</option>
            <option value="binary64">64位二进制</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 32位 -->
    <div class="section">
      <h3>单精度（32-bit）</h3>
      <div class="bit-display">
        <span v-for="(bit, idx) in bits32" :key="idx" :class="['bit', bitClass32(idx)]" :title="bitLabel32(idx)">
          {{ bit }}
        </span>
      </div>
      <div class="bit-bar">
        <span class="bar-sign" style="width:3.125%">S</span>
        <span class="bar-exp" style="width:12.5%">E (8位)</span>
        <span class="bar-mant" style="width:84.375%">M (23位)</span>
      </div>
      <div class="decomp">
        <div class="decomp-item sign">
          <span class="decomp-label">符号</span>
          <span class="decomp-val">{{ float32.sign === 0 ? '+' : '-' }}</span>
          <span class="decomp-desc">({{ float32.sign }})</span>
        </div>
        <div class="decomp-item exp">
          <span class="decomp-label">指数</span>
          <span class="decomp-val">{{ float32.exponent }}</span>
          <span class="decomp-desc">（实际值 {{ float32.exponentValue }}，偏移127）</span>
        </div>
        <div class="decomp-item mant">
          <span class="decomp-label">尾数</span>
          <span class="decomp-val">0.{{ float32.mantissa }}</span>
          <span class="decomp-desc">({{ float32.mantissaValue }})</span>
        </div>
        <div class="decomp-item result">
          <span class="decomp-label">值</span>
          <span class="decomp-val">{{ float32.value }}</span>
        </div>
      </div>
    </div>

    <!-- 64位 -->
    <div class="section">
      <h3>双精度（64-bit）</h3>
      <div class="bit-display sixty-four">
        <span v-for="(bit, idx) in bits64" :key="idx" :class="['bit', bitClass64(idx)]" :title="bitLabel64(idx)">
          {{ bit }}
        </span>
      </div>
      <div class="bit-bar">
        <span class="bar-sign" style="width:1.5625%">S</span>
        <span class="bar-exp" style="width:17.1875%">E (11位)</span>
        <span class="bar-mant" style="width:81.25%">M (52位)</span>
      </div>
      <div class="decomp">
        <div class="decomp-item sign">
          <span class="decomp-label">符号</span>
          <span class="decomp-val">{{ float64.sign === 0 ? '+' : '-' }}</span>
          <span class="decomp-desc">({{ float64.sign }})</span>
        </div>
        <div class="decomp-item exp">
          <span class="decomp-label">指数</span>
          <span class="decomp-val">{{ float64.exponent }}</span>
          <span class="decomp-desc">（实际值 {{ float64.exponentValue }}，偏移1023）</span>
        </div>
        <div class="decomp-item mant">
          <span class="decomp-label">尾数</span>
          <span class="decomp-val">0.{{ float64.mantissa }}</span>
        </div>
        <div class="decomp-item result">
          <span class="decomp-label">值</span>
          <span class="decomp-val">{{ float64.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

useHead({ title: 'IEEE 754 浮点数转换器 - 野火小站' })

const inputVal = ref('3.14')
const inputMode = ref('float')

function parseFloat32(num) {
  const buf = new ArrayBuffer(4)
  new Float32Array(buf)[0] = num
  const uint = new Uint32Array(buf)[0]
  const bits = uint.toString(2).padStart(32, '0')
  const sign = parseInt(bits[0])
  const expBits = parseInt(bits.slice(1, 9), 2)
  const mantBits = bits.slice(9)
  const isSpecial = expBits === 0 || expBits === 255
  const exponentValue = isSpecial ? (expBits === 0 ? -126 : 128) : expBits - 127
  let mantissaValue = 0
  for (let i = 0; i < 23; i++) if (mantBits[i] === '1') mantissaValue += 2 ** -(i + 1)
  if (!isSpecial) mantissaValue += 1
  return {
    sign, bits, mantissa: mantBits,
    exponent: bits.slice(1, 9),
    exponentValue,
    mantissaValue,
    value: isSpecial ? (expBits === 255 ? (mantBits.includes('1') ? 'NaN' : (sign ? '-∞' : '+∞')) : (sign ? '-0' : '0')) : num.toPrecision(9)
  }
}

function parseFloat64(num) {
  const buf = new ArrayBuffer(8)
  new Float64Array(buf)[0] = num
  const high = new Uint32Array(buf)[1]
  const low = new Uint32Array(buf)[0]
  const bits = high.toString(2).padStart(32, '0') + low.toString(2).padStart(32, '0')
  const sign = parseInt(bits[0])
  const expBits = parseInt(bits.slice(1, 12), 2)
  const mantBits = bits.slice(12)
  const isSpecial = expBits === 0 || expBits === 2047
  const exponentValue = isSpecial ? (expBits === 0 ? -1022 : 1024) : expBits - 1023
  return {
    sign, bits, mantissa: mantBits,
    exponent: bits.slice(1, 12),
    exponentValue,
    mantissaValue: num,
    value: isSpecial ? (expBits === 2047 ? (mantBits.includes('1') ? 'NaN' : (sign ? '-∞' : '+∞')) : (sign ? '-0' : '0')) : num.toPrecision(17)
  }
}

function fromBinary32(bin) {
  const uint = parseInt(bin, 2)
  return new Float32Array(new Uint32Array([uint]).buffer)[0]
}

function fromBinary64(bin) {
  const high = parseInt(bin.slice(0, 32), 2)
  const low = parseInt(bin.slice(32), 2)
  return new Float64Array(new Uint32Array([low, high]).buffer)[0]
}

const currentFloat = computed(() => {
  const v = inputVal.value.trim()
  if (!v) return 0
  if (inputMode.value === 'binary32') {
    const clean = v.replace(/\s/g, '')
    if (/^[01]{32}$/.test(clean)) return fromBinary32(clean)
    return parseFloat(v) || 0
  }
  if (inputMode.value === 'binary64') {
    const clean = v.replace(/\s/g, '')
    if (/^[01]{64}$/.test(clean)) return fromBinary64(clean)
    return parseFloat(v) || 0
  }
  return parseFloat(v) || 0
})

const float32 = computed(() => parseFloat32(currentFloat.value))
const float64 = computed(() => parseFloat64(currentFloat.value))

const bits32 = computed(() => float32.value.bits.split(''))
const bits64 = computed(() => float64.value.bits.split(''))

function bitClass32(idx) {
  if (idx === 0) return 'sign-bit'
  if (idx < 9) return 'exp-bit'
  return 'mant-bit'
}
function bitClass64(idx) {
  if (idx === 0) return 'sign-bit'
  if (idx < 11) return 'exp-bit'
  return 'mant-bit'
}
function bitLabel32(idx) {
  if (idx === 0) return '符号位'
  if (idx < 9) return `指数位 E${idx - 1}`
  return `尾数位 M${idx - 9}`
}
function bitLabel64(idx) {
  if (idx === 0) return '符号位'
  if (idx < 11) return `指数位 E${idx - 1}`
  return `尾数位 M${idx - 11}`
}
function parseInput() { /* reactive */ }
</script>

<style scoped>
.tool-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.back-link { display: inline-block; margin-bottom: 16px; color: #10b981; text-decoration: none; }
.back-link:hover { text-decoration: underline; }
h2 { color: #1a1a2e; margin-bottom: 20px; }
.controls { margin-bottom: 24px; }
.control-group label { display: block; font-size: 14px; color: #555; margin-bottom: 6px; }
.input-row { display: flex; gap: 8px; }
.input-row input { flex: 1; padding: 10px 12px; border: 2px solid #ddd; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; }
.input-row input:focus { border-color: #22c55e; outline: none; }
.input-row select { padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; }
.section { margin-bottom: 24px; }
.section h3 { font-size: 16px; color: #1a1a2e; margin-bottom: 10px; }
.bit-display { display: flex; flex-wrap: wrap; gap: 1px; padding: 8px; background: #f8f9fa; border-radius: 8px; }
.bit-display.sixty-four { font-size: 11px; }
.bit { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: bold; border-radius: 4px; }
.sign-bit { background: #fecaca; color: #dc2626; }
.exp-bit { background: #bfdbfe; color: #2563eb; }
.mant-bit { background: #bbf7d0; color: #16a34a; }
.bit-bar { display: flex; margin-top: 4px; }
.bar-sign { background: #dc2626; color: #fff; font-size: 11px; text-align: center; border-radius: 2px 0 0 2px; }
.bar-exp { background: #2563eb; color: #fff; font-size: 11px; text-align: center; }
.bar-mant { background: #16a34a; color: #fff; font-size: 11px; text-align: center; border-radius: 0 2px 2px 0; }
.decomp { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.decomp-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 13px; }
.decomp-item.sign { background: #fef2f2; }
.decomp-item.exp { background: #eff6ff; }
.decomp-item.mant { background: #f0fdf4; }
.decomp-item.result { background: #fefce8; grid-column: 1 / -1; }
.decomp-label { font-weight: bold; min-width: 40px; }
.decomp-val { font-family: 'Courier New', monospace; font-weight: bold; }
.decomp-desc { color: #888; font-size: 12px; }
@media (max-width: 600px) {
  .tool-page { padding: 12px; }
  .input-row { flex-direction: column; }
  .bit { width: 22px; height: 22px; font-size: 11px; }
  .decomp { grid-template-columns: 1fr; }
}
</style>
