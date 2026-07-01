<template>
  <div class="tool-page">
    <h2>📸 图片 EXIF 元数据查看器</h2>
    <p class="subtitle">拖拽或点击上传图片，纯前端解析 EXIF 二进制数据，查看相机型号、拍摄参数、GPS 坐标等元数据</p>

    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{ dragover: isDragover }"
      @click="triggerUpload"
      @dragover.prevent="isDragover = true"
      @dragleave="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      />
      <div class="upload-icon">📷</div>
      <p class="upload-text">拖拽图片到此处，或点击选择文件</p>
      <p class="upload-hint">支持 JPEG / PNG / HEIC / TIFF / WebP</p>
    </div>

    <!-- 图片预览与基本信息 -->
    <div v-if="previewUrl" class="preview-section">
      <div class="preview-image-wrap">
        <img :src="previewUrl" class="preview-image" alt="预览" />
      </div>
      <div class="file-info">
        <h3>📄 基本信息</h3>
        <div class="info-grid">
          <div class="info-item" v-if="fileName">
            <span class="info-label">文件名</span>
            <span class="info-value">{{ fileName }}</span>
          </div>
          <div class="info-item" v-if="fileSize">
            <span class="info-label">文件大小</span>
            <span class="info-value">{{ fileSize }}</span>
          </div>
          <div class="info-item" v-if="fileType">
            <span class="info-label">文件类型</span>
            <span class="info-value">{{ fileType }}</span>
          </div>
          <div class="info-item" v-if="imageDimensions">
            <span class="info-label">图片尺寸</span>
            <span class="info-value">{{ imageDimensions }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- EXIF 数据 -->
    <div v-if="exifData && Object.keys(exifData).length" class="exif-section">
      <div class="exif-header">
        <h3>📋 EXIF 元数据</h3>
        <div class="exif-actions">
          <button class="btn-copy" @click="copyJSON">{{ copyJSONText }}</button>
          <button class="btn-copy btn-text" @click="copyText">{{ copyTextBtnText }}</button>
        </div>
      </div>

      <!-- 按类别分组展示 -->
      <div v-for="group in exifGroups" :key="group.label" class="exif-group">
        <h4>{{ group.icon }} {{ group.label }}</h4>
        <table class="exif-table">
          <thead>
            <tr>
              <th>字段</th>
              <th>值</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in group.items" :key="item.key">
              <td class="td-key">{{ item.key }}</td>
              <td class="td-val">{{ item.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- GPS 地图提示 -->
    <div v-if="gpsCoords" class="gps-section">
      <h3>🌍 GPS 坐标</h3>
      <div class="gps-display">
        <div class="gps-coord">
          <span class="gps-label">纬度</span>
          <span class="gps-value">{{ gpsCoords.lat }}</span>
        </div>
        <div class="gps-coord">
          <span class="gps-label">经度</span>
          <span class="gps-value">{{ gpsCoords.lng }}</span>
        </div>
        <a
          class="gps-link"
          :href="`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          🗺️ 在 Google Maps 中查看
        </a>
      </div>
    </div>

    <!-- 无 EXIF 提示 -->
    <div v-if="noExif" class="no-exif">
      <p>⚠️ 该图片未包含 EXIF 元数据</p>
      <p class="no-exif-hint">可能原因：截图工具生成、社交软件压缩、PNG 格式本身不包含 EXIF</p>
    </div>

    <!-- 缩略图 -->
    <div v-if="thumbnailUrl" class="thumbnail-section">
      <h3>🖼️ EXIF 内嵌缩略图</h3>
      <div class="thumbnail-wrap">
        <img :src="thumbnailUrl" class="thumbnail-image" alt="EXIF 缩略图" />
      </div>
    </div>

    <!-- 原始二进制预览 -->
    <div v-if="rawHexPreview" class="raw-section">
      <h3>🔍 APP1 段原始字节</h3>
      <div class="raw-toggle">
        <button :class="['tab-btn', { active: showRawHex }]" @click="showRawHex = true">十六进制</button>
        <button :class="['tab-btn', { active: !showRawHex }]" @click="showRawHex = false">UTF-8 文本</button>
      </div>
      <pre class="raw-pre">{{ showRawHex ? rawHexPreview : rawTextPreview }}</pre>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '图片 EXIF 元数据查看器 - 野火小站' })

// 状态
const fileInput = ref(null)
const isDragover = ref(false)
const previewUrl = ref('')
const fileName = ref('')
const fileSize = ref('')
const fileType = ref('')
const imageDimensions = ref('')
const exifData = ref({})
const noExif = ref(false)
const gpsCoords = ref(null)
const thumbnailUrl = ref('')
const rawHexPreview = ref('')
const rawTextPreview = ref('')
const showRawHex = ref(true)
const copyJSONText = ref('📋 复制 JSON')
const copyTextBtnText = ref('📝 复制纯文本')

// EXIF 标签字典（常用标签 ID → 名称）
const exifTags = {
  0x010F: '相机制造商 (Make)',
  0x0110: '相机型号 (Model)',
  0x0112: '拍摄方向 (Orientation)',
  0x011A: 'X 分辨率 (X Resolution)',
  0x011B: 'Y 分辨率 (Y Resolution)',
  0x0128: '分辨率单位 (Resolution Unit)',
  0x0131: '软件版本 (Software)',
  0x0132: '修改时间 (DateTime)',
  0x013B: '作者 (Artist)',
  0x8298: '版权 (Copyright)',
  0x8769: 'Exif IFD 指针',
  0x8825: 'GPS IFD 指针',
  0x920A: '焦距 (Focal Length)',
  0x920B: 'X 像素/分辨率单位',
  0x920C: 'Y 像素/分辨率单位',
  0xA001: '色彩空间 (Color Space)',
  0xA002: '有效像素宽度 (Pixel X Dimension)',
  0xA003: '有效像素高度 (Pixel Y Dimension)',
  0xA210: '场景类型 (Scene Capture Type)',
  0xA214: '镜头型号 (Lens Model)',
  0xA215: '35mm等效焦距 (Focal Length In 35mm)',
  0xA217: '感应器类型 (Sensing Method)',
  0xA401: '自定义处理 (Custom Rendered)',
  0xA402: '曝光模式 (Exposure Mode)',
  0xA403: '白平衡 (White Balance)',
  0xA404: '数码变焦 (Digital Zoom Ratio)',
  0xA406: '场景类型 (Scene Capture Type)',
  0xA407: '增益控制 (Gain Control)',
  0xA408: '对比度 (Contrast)',
  0xA409: '饱和度 (Saturation)',
  0xA40A: '锐度 (Sharpness)',
  0xA40C: '拍摄距离 (Subject Distance Range)',
  0xA433: '镜头制造商 (Lens Make)',
  0xA434: '镜头型号 (Lens Model)',
  0x0001: 'GPS 纬度引用 (GPSLatitudeRef)',
  0x0002: 'GPS 纬度 (GPSLatitude)',
  0x0003: 'GPS 经度引用 (GPSLongitudeRef)',
  0x0004: 'GPS 经度 (GPSLongitude)',
  0x0005: 'GPS 海拔引用 (GPSAltitudeRef)',
  0x0006: 'GPS 海拔 (GPSAltitude)',
  0x0007: 'GPS 时间 (GPSTimeStamp)',
  0x001D: 'GPS 日期 (GPSDateStamp)',
}

// 测光模式映射
const meteringModes = { 0: '未知', 1: '平均', 2: '中央重点', 3: '点测光', 4: '多点', 5: '评价', 6: '局部' }
// 闪光灯映射
const flashModes = { 0x00: '未闪光', 0x01: '已闪光', 0x05: '已闪光(无回光)', 0x07: '已闪光(有回光)', 0x09: '已闪光(强制)', 0x0D: '已闪光(强制,有回光)', 0x10: '未闪光(强制)', 0x18: '未闪光(自动)', 0x19: '已闪光(自动)', 0x1D: '已闪光(自动,有回光)', 0x41: '已闪光(红眼消除)', 0x45: '已闪光(红眼消除,有回光)', 0x49: '已闪光(红眼消除,强制)' }
// 曝光模式映射
const exposureModes = { 0: '自动', 1: '手动', 2: '自动包围', 3: '光圈优先', 4: '快门优先', 5: '创意', 6: '运动', 7: '人像', 8: '风景' }
// 场景类型映射
const sceneTypes = { 0: '标准', 1: '风景', 2: '人像', 3: '夜景' }
// 白平衡映射
const whiteBalanceModes = { 0: '自动', 1: '手动' }
// 对比度/饱和度/锐度映射
const hsMap = { 0: '标准', 1: '低', 2: '高' }

// EXIF 分组（按类别展示）
const exifGroups = computed(() => {
  const data = exifData.value
  if (!data || !Object.keys(data).length) return []

  const groups = []
  // 相机/设备信息
  const cameraKeys = ['相机制造商 (Make)', '相机型号 (Model)', '镜头制造商 (Lens Make)', '镜头型号 (Lens Model)', '镜头规格 (Lens Specification)', '机身序列号 (Body Serial Number)', '软件版本 (Software)', '作者 (Artist)', '版权 (Copyright)']
  const cameraItems = cameraKeys.filter(k => data[k] != null && data[k] !== '').map(k => ({ key: k, value: data[k] }))
  if (cameraItems.length) groups.push({ icon: '📷', label: '相机与镜头', items: cameraItems })

  // 拍摄参数
  const shootKeys = ['曝光时间 (Exposure Time)', '光圈值 (F-Number)', 'ISO 感光度 (ISO)', '焦距 (Focal Length)', '等效35mm焦距 (Focal Length In 35mm)', '曝光补偿 (Exposure Bias Value)', '曝光模式 (Exposure Mode)', '测光模式 (Metering Mode)', '闪光灯 (Flash)', '白平衡 (White Balance)', '光源 (Light Source)', '场景类型 (Scene Capture Type)', '对比度 (Contrast)', '饱和度 (Saturation)', '锐度 (Sharpness)', '数码变焦 (Digital Zoom Ratio)', '拍摄方向 (Orientation)']
  const shootItems = shootKeys.filter(k => data[k] != null && data[k] !== '').map(k => ({ key: k, value: data[k] }))
  if (shootItems.length) groups.push({ icon: '⚙️', label: '拍摄参数', items: shootItems })

  // 图像信息
  const imageKeys = ['有效像素宽度 (Pixel X Dimension)', '有效像素高度 (Pixel Y Dimension)', 'X 分辨率 (X Resolution)', 'Y 分辨率 (Y Resolution)', '分辨率单位 (Resolution Unit)', '色彩空间 (Color Space)', '最大光圈 (Max Aperture Value)']
  const imageItems = imageKeys.filter(k => data[k] != null && data[k] !== '').map(k => ({ key: k, value: data[k] }))
  if (imageItems.length) groups.push({ icon: '📐', label: '图像属性', items: imageItems })

  // 时间信息
  const timeKeys = ['修改时间 (DateTime)', '拍摄时间 (DateTimeOriginal)', '数字化时间 (DateTimeDigitized)']
  const timeItems = timeKeys.filter(k => data[k] != null && data[k] !== '').map(k => ({ key: k, value: data[k] }))
  if (timeItems.length) groups.push({ icon: '🕐', label: '时间信息', items: timeItems })

  // GPS 信息（单独处理，有专门的地图区域）
  const gpsKeys = ['GPS 纬度 (GPSLatitude)', 'GPS 经度 (GPSLongitude)', 'GPS 海拔 (GPSAltitude)', 'GPS 海拔引用 (GPSAltitudeRef)', 'GPS 时间 (GPSTimeStamp)', 'GPS 日期 (GPSDateStamp)']
  const gpsItems = gpsKeys.filter(k => data[k] != null && data[k] !== '').map(k => ({ key: k, value: data[k] }))
  if (gpsItems.length) groups.push({ icon: '🌍', label: 'GPS 数据', items: gpsItems })

  // 其他未分类
  const allKnownKeys = new Set([...cameraKeys, ...shootKeys, ...imageKeys, ...timeKeys, ...gpsKeys])
  const otherItems = Object.entries(data)
    .filter(([k, v]) => !allKnownKeys.has(k) && v != null && v !== '')
    .map(([k, v]) => ({ key: k, value: v }))
  if (otherItems.length) groups.push({ icon: '📦', label: '其他信息', items: otherItems })

  return groups
})

// 触发文件选择
function triggerUpload() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

// 处理拖拽
function handleDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

// 处理文件
function processFile(file) {
  // 重置状态
  exifData.value = {}
  noExif.value = false
  gpsCoords.value = null
  rawHexPreview.value = ''
  rawTextPreview.value = ''

  // 释放旧的 ObjectURL 防止内存泄漏
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (thumbnailUrl.value) URL.revokeObjectURL(thumbnailUrl.value)
  previewUrl.value = ''
  thumbnailUrl.value = ''

  // 基本信息
  fileName.value = file.name
  fileSize.value = formatFileSize(file.size)
  fileType.value = file.type || '未知'

  // 生成预览
  const url = URL.createObjectURL(file)
  previewUrl.value = url
  const img = new Image()
  img.onload = () => {
    imageDimensions.value = `${img.width} × ${img.height} px`
  }
  img.src = url

  // 读取为 ArrayBuffer 解析 EXIF
  const reader = new FileReader()
  reader.onload = (e) => {
    const buffer = e.target.result
    parseExif(buffer)
  }
  reader.readAsArrayBuffer(file)
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 解析 EXIF 数据
function parseExif(buffer) {
  try {
    const view = new DataView(buffer)
    // 检查 JPEG SOI 标记 (0xFFD8)
    if (view.getUint16(0) !== 0xFFD8) {
      // 非 JPEG，尝试其他格式
      exifData.value = { '提示': '当前仅完整支持 JPEG 格式的 EXIF 解析，其他格式仅显示基本信息' }
      noExif.value = true
      return
    }

    let offset = 2
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset)
      if (marker === 0xFFE1) {
        // APP1 段（EXIF）
        const segLen = view.getUint16(offset + 2)
        const exifHeader = view.getUint32(offset + 4, false)
        if (exifHeader === 0x45786966) { // "Exif"
          const tiffStart = offset + 10
          // 保存原始字节预览（前 64 字节）
          const previewLen = Math.min(segLen, 64)
          const hexArr = []
          const textArr = []
          for (let i = 0; i < previewLen; i++) {
            const b = view.getUint8(offset + 4 + i)
            hexArr.push(b.toString(16).padStart(2, '0'))
            textArr.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')
          }
          rawHexPreview.value = formatHexDump(hexArr, 16)
          rawTextPreview.value = textArr.join('')

          parseTIFF(view, tiffStart)
          return
        }
      }
      // 跳到下一个段
      if ((marker & 0xFF00) !== 0xFF00) break
      const segLen = view.getUint16(offset + 2)
      offset += 2 + segLen
    }
    // 没找到 EXIF 段
    noExif.value = true
  } catch (e) {
    console.error('EXIF 解析错误:', e)
    noExif.value = true
  }
}

// 格式化十六进制转储
function formatHexDump(hexArr, cols) {
  const lines = []
  for (let i = 0; i < hexArr.length; i += cols) {
    const row = hexArr.slice(i, i + cols)
    const hex = row.join(' ')
    const addr = i.toString(16).padStart(6, '0')
    lines.push(`${addr}: ${hex}`)
  }
  return lines.join('\n')
}

// 解析 TIFF/IFD 结构
function parseTIFF(view, tiffStart) {
  const byteOrder = view.getUint16(tiffStart)
  const littleEndian = byteOrder === 0x4949 // "II"
  const magic = view.getUint16(tiffStart + 2, littleEndian)
  if (magic !== 42) return

  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian)
  parseIFD(view, tiffStart, littleEndian, tiffStart + ifdOffset, 'IFD0')

  // 查找 Exif IFD 和 GPS IFD 子目录
  const exifOffsetTag = 0x8769
  const gpsOffsetTag = 0x8825
  const ifd0Data = getIFDData(view, tiffStart, littleEndian, tiffStart + ifdOffset)
  if (ifd0Data) {
    if (ifd0Data[exifOffsetTag] != null) {
      parseIFD(view, tiffStart, littleEndian, tiffStart + ifd0Data[exifOffsetTag].value, 'ExifIFD')
    }
    if (ifd0Data[gpsOffsetTag] != null) {
      parseIFD(view, tiffStart, littleEndian, tiffStart + ifd0Data[gpsOffsetTag].value, 'GPSIFD')
    }
    // 查找缩略图（IFD1）
    const nextIFD = ifd0Data._nextIFD
    if (nextIFD) {
      parseThumbnail(view, tiffStart, littleEndian, nextIFD)
    }
  }
}

// 解析单个 IFD
function parseIFD(view, tiffStart, littleEndian, ifdStart, prefix) {
  if (ifdStart < tiffStart || ifdStart >= view.byteLength - 2) return
  const entryCount = view.getUint16(ifdStart, littleEndian)

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdStart + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, littleEndian)
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)
    const valueOffset = entryOffset + 8

    const tagName = exifTags[tag]
    const rawValue = readTagValue(view, tiffStart, littleEndian, type, count, valueOffset)

    if (tagName) {
      const displayValue = formatExifValue(tag, type, rawValue, view, tiffStart, littleEndian, valueOffset)
      exifData.value[tagName] = displayValue
    }
  }
}

// 获取 IFD 原始数据（用于查找子 IFD 偏移）
function getIFDData(view, tiffStart, littleEndian, ifdStart) {
  if (ifdStart < tiffStart || ifdStart >= view.byteLength - 2) return null
  const entryCount = view.getUint16(ifdStart, littleEndian)
  const result = {}

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdStart + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, littleEndian)
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)
    const valueOffset = entryOffset + 8

    if (type === 4 && count === 1) { // LONG
      result[tag] = { value: view.getUint32(valueOffset, littleEndian) }
    }
  }

  // 下一个 IFD 偏移
  const nextOffset = ifdStart + 2 + entryCount * 12
  if (nextOffset + 4 <= view.byteLength) {
    const nextIFD = view.getUint32(nextOffset, littleEndian)
    if (nextIFD !== 0) result._nextIFD = tiffStart + nextIFD
  }

  return result
}

// 读取标签值
function readTagValue(view, tiffStart, littleEndian, type, count, valueOffset) {
  const typeSizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }
  const totalSize = (typeSizes[type] || 1) * count
  const isInline = totalSize <= 4
  let dataOffset = isInline ? valueOffset : tiffStart + view.getUint32(valueOffset, littleEndian)

  switch (type) {
    case 2: // ASCII
      return readString(view, dataOffset, count)
    case 3: // SHORT
      if (count === 1) return view.getUint16(dataOffset, littleEndian)
      return Array.from({ length: count }, (_, i) => view.getUint16(dataOffset + i * 2, littleEndian))
    case 4: // LONG
      if (count === 1) return view.getUint32(dataOffset, littleEndian)
      return Array.from({ length: count }, (_, i) => view.getUint32(dataOffset + i * 4, littleEndian))
    case 5: // RATIONAL (unsigned)
      return Array.from({ length: count }, (_, i) => {
        const num = view.getUint32(dataOffset + i * 8, littleEndian)
        const den = view.getUint32(dataOffset + i * 8 + 4, littleEndian)
        return den ? num / den : 0
      })
    case 7: // UNDEFINED
      return Array.from({ length: count }, (_, i) => view.getUint8(dataOffset + i))
    case 9: // SLONG
      if (count === 1) return view.getInt32(dataOffset, littleEndian)
      return Array.from({ length: count }, (_, i) => view.getInt32(dataOffset + i * 4, littleEndian))
    case 10: // SRATIONAL
      return Array.from({ length: count }, (_, i) => {
        const num = view.getInt32(dataOffset + i * 8, littleEndian)
        const den = view.getInt32(dataOffset + i * 8 + 4, littleEndian)
        return den ? num / den : 0
      })
    default:
      return count === 1 ? view.getUint16(dataOffset, littleEndian) : `[类型${type} ×${count}]`
  }
}

// 读取字符串
function readString(view, offset, count) {
  let str = ''
  for (let i = 0; i < count; i++) {
    const ch = view.getUint8(offset + i)
    if (ch === 0) break
    str += String.fromCharCode(ch)
  }
  return str.trim()
}

// 格式化 EXIF 值为可读文本
function formatExifValue(tag, type, rawValue, view, tiffStart, littleEndian, valueOffset) {
  // GPS 纬度/经度特殊处理
  if (tag === 0x0002 && Array.isArray(rawValue)) {
    // GPSLatitude: [度, 分, 秒] 各为 RATIONAL
    const gpsData = readTagValue(view, tiffStart, littleEndian, 5, 3, valueOffset)
    if (Array.isArray(gpsData) && gpsData.length === 3) {
      const dec = gpsData[0] + gpsData[1] / 60 + gpsData[2] / 3600
      // GPSLatitudeRef
      const latRef = exifData.value['GPS 纬度引用 (GPSLatitudeRef)']
      gpsCoords.value = gpsCoords.value || {}
      gpsCoords.value.lat = (latRef === 'S' ? -1 : 1) * dec
      return `${gpsData[0].toFixed(4)}° ${gpsData[1].toFixed(4)}' ${gpsData[2].toFixed(4)}" ${latRef || 'N'}`
    }
  }
  if (tag === 0x0004 && Array.isArray(rawValue)) {
    const gpsData = readTagValue(view, tiffStart, littleEndian, 5, 3, valueOffset)
    if (Array.isArray(gpsData) && gpsData.length === 3) {
      const dec = gpsData[0] + gpsData[1] / 60 + gpsData[2] / 3600
      const lngRef = exifData.value['GPS 经度引用 (GPSLongitudeRef)']
      gpsCoords.value = gpsCoords.value || {}
      gpsCoords.value.lng = (lngRef === 'W' ? -1 : 1) * dec
      return `${gpsData[0].toFixed(4)}° ${gpsData[1].toFixed(4)}' ${gpsData[2].toFixed(4)}" ${lngRef || 'E'}`
    }
  }
  if (tag === 0x0006 && type === 5) {
    // GPSAltitude
    return `${rawValue} 米`
  }
  if (tag === 0x0007 && Array.isArray(rawValue)) {
    return `${String(rawValue[0]).padStart(2,'0')}:${String(rawValue[1]).padStart(2,'0')}:${String(rawValue[2]).padStart(2,'0')} UTC`
  }

  // 曝光时间
  if (tag === 0x829A) {
    if (typeof rawValue === 'number' && rawValue > 0 && rawValue < 1) {
      return `1/${Math.round(1 / rawValue)} 秒`
    }
    return `${rawValue} 秒`
  }
  // 光圈值
  if (tag === 0x8822 || tag === 0x9202) {
    return typeof rawValue === 'number' ? `f/${rawValue.toFixed(1)}` : String(rawValue)
  }
  // 焦距
  if (tag === 0x920A) {
    return `${rawValue} mm`
  }
  // 闪光灯
  if (tag === 0x9209) {
    return flashModes[rawValue] || `值: ${rawValue}`
  }
  // 测光模式
  if (tag === 0x9207) {
    return meteringModes[rawValue] || `值: ${rawValue}`
  }
  // 曝光模式
  if (tag === 0xA402) {
    return exposureModes[rawValue] || `值: ${rawValue}`
  }
  // 白平衡
  if (tag === 0xA403) {
    return whiteBalanceModes[rawValue] || `值: ${rawValue}`
  }
  // 场景类型
  if (tag === 0xA406) {
    return sceneTypes[rawValue] || `值: ${rawValue}`
  }
  // 对比度/饱和度/锐度
  if (tag === 0xA408 || tag === 0xA409 || tag === 0xA40A) {
    return hsMap[rawValue] || `值: ${rawValue}`
  }
  // 色彩空间
  if (tag === 0xA001) {
    return rawValue === 1 ? 'sRGB' : rawValue === 65535 ? 'Uncalibrated' : `值: ${rawValue}`
  }
  // 日期时间格式化
  if (tag === 0x0132 || tag === 0x9003 || tag === 0x9004 || tag === 0x001D) {
    return typeof rawValue === 'string' ? rawValue.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') : rawValue
  }
  // 曝光补偿
  if (tag === 0x9204 && typeof rawValue === 'number') {
    return `${rawValue >= 0 ? '+' : ''}${rawValue.toFixed(1)} EV`
  }
  // 分辨率
  if (tag === 0x011A || tag === 0x011B) {
    return typeof rawValue === 'number' ? `${rawValue}` : rawValue
  }
  // 分辨率单位
  if (tag === 0x0128) {
    return { 2: '英寸', 3: '厘米' }[rawValue] || `值: ${rawValue}`
  }
  // 镜头规格（RATIONAL 数组，4 个值）
  if (tag === 0xA432 && Array.isArray(rawValue) && rawValue.length === 4) {
    return `${rawValue[0].toFixed(1)}-${rawValue[1].toFixed(1)} mm  f/${rawValue[2].toFixed(1)}-${rawValue[3].toFixed(1)}`
  }
  // 拍摄方向
  if (tag === 0x0112) {
    return { 1: '正常', 2: '水平翻转', 3: '旋转180°', 4: '垂直翻转', 5: '逆时针90°+翻转', 6: '顺时针90°', 7: '顺时针90°+翻转', 8: '逆时针90°' }[rawValue] || `值: ${rawValue}`
  }

  // 数组转字符串
  if (Array.isArray(rawValue)) {
    return rawValue.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(', ')
  }
  return rawValue
}

// 解析缩略图
function parseThumbnail(view, tiffStart, littleEndian, ifdStart) {
  try {
    if (ifdStart < tiffStart || ifdStart >= view.byteLength - 2) return
    const entryCount = view.getUint16(ifdStart, littleEndian)
    let thumbOffset = 0, thumbLength = 0

    for (let i = 0; i < entryCount; i++) {
      const eo = ifdStart + 2 + i * 12
      if (eo + 12 > view.byteLength) break
      const tag = view.getUint16(eo, littleEndian)
      const count = view.getUint32(eo + 4, littleEndian)
      const valueOffset = eo + 8
      if (tag === 0x0111) { // JPEGInterchangeFormat
        thumbOffset = tiffStart + (count <= 4 ? valueOffset : view.getUint32(valueOffset, littleEndian))
      }
      if (tag === 0x0117) { // JPEGInterchangeFormatLength
        thumbLength = count <= 4 ? view.getUint32(valueOffset, littleEndian) : view.getUint32(valueOffset, littleEndian)
      }
    }

    if (thumbOffset > 0 && thumbLength > 0 && thumbOffset + thumbLength <= view.byteLength) {
      const bytes = new Uint8Array(view.buffer.slice(view.byteOffset + thumbOffset, view.byteOffset + thumbOffset + thumbLength))
      const blob = new Blob([bytes], { type: 'image/jpeg' })
      thumbnailUrl.value = URL.createObjectURL(blob)
    }
  } catch (e) {
    // 缩略图解析失败不影响主功能
  }
}

// 复制 JSON
function copyJSON() {
  const json = JSON.stringify(exifData.value, null, 2)
  navigator.clipboard.writeText(json).then(() => {
    copyJSONText.value = '已复制 ✓'
    setTimeout(() => { copyJSONText.value = '📋 复制 JSON' }, 1500)
  })
}

// 复制纯文本
function copyText() {
  const lines = exifGroups.value.flatMap(g =>
    [`【${g.label}】`, ...g.items.map(item => `${item.key}: ${item.value}`)]
  )
  if (gpsCoords.value) {
    lines.push('', `【GPS 坐标】`, `纬度: ${gpsCoords.value.lat.toFixed(6)}°`, `经度: ${gpsCoords.value.lng.toFixed(6)}°`)
  }
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    copyTextBtnText.value = '已复制 ✓'
    setTimeout(() => { copyTextBtnText.value = '📝 复制纯文本' }, 1500)
  })
}
</script>

<style scoped>
.tool-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}
h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafbfc;
  margin-bottom: 1.5rem;
}
.upload-area:hover,
.upload-area.dragover {
  border-color: #22c55e;
  background: #f0fdf4;
}
.upload-icon {
  font-size: 3rem;
  margin-bottom: 0.8rem;
}
.upload-text {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.4rem;
}
.upload-hint {
  font-size: 0.85rem;
  color: #999;
}

/* 预览区域 */
.preview-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.preview-image-wrap {
  flex-shrink: 0;
  width: 200px;
}
.preview-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.file-info {
  flex: 1;
}
.file-info h3 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #f3f4f6;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f9fafb;
}
.info-label {
  font-size: 0.82rem;
  color: #888;
}
.info-value {
  font-size: 0.85rem;
  color: #333;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
}

/* EXIF 数据区 */
.exif-section {
  margin-bottom: 1.5rem;
}
.exif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.exif-header h3 {
  font-size: 1.05rem;
  color: #333;
}
.exif-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-copy {
  padding: 0.4rem 0.8rem;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: opacity 0.2s;
}
.btn-copy:hover { opacity: 0.85; }
.btn-text {
  background: #3b82f6;
}

/* EXIF 分组 */
.exif-group {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
}
.exif-group h4 {
  font-size: 0.92rem;
  color: #444;
  margin-bottom: 0.6rem;
}
.exif-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.exif-table th {
  text-align: left;
  padding: 0.4rem 0.6rem;
  background: #f8f9fa;
  color: #666;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
}
.exif-table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid #f3f4f6;
}
.td-key {
  color: #666;
  white-space: nowrap;
  width: 45%;
}
.td-val {
  color: #1a1a1a;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

/* GPS 区域 */
.gps-section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}
.gps-section h3 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.8rem;
}
.gps-display {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}
.gps-coord {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.gps-label {
  font-size: 0.78rem;
  color: #888;
}
.gps-value {
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
  font-family: 'Courier New', monospace;
}
.gps-link {
  margin-left: auto;
  padding: 0.4rem 0.8rem;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-size: 0.82rem;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}
.gps-link:hover {
  background: #dbeafe;
}

/* 无 EXIF */
.no-exif {
  text-align: center;
  padding: 2rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
  color: #666;
}
.no-exif p:first-child {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.no-exif-hint {
  font-size: 0.82rem;
  color: #999;
}

/* 缩略图 */
.thumbnail-section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}
.thumbnail-section h3 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.8rem;
}
.thumbnail-wrap {
  text-align: center;
}
.thumbnail-image {
  max-width: 160px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

/* 原始字节 */
.raw-section {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
}
.raw-section h3 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.8rem;
}
.raw-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}
.tab-btn {
  padding: 0.35rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.tab-btn.active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #16a34a;
}
.raw-pre {
  background: #1e293b;
  color: #e2e8f0;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  line-height: 1.6;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .preview-section {
    flex-direction: column;
  }
  .preview-image-wrap {
    width: 100%;
  }
  .gps-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .gps-link {
    margin-left: 0;
  }
}
</style>
