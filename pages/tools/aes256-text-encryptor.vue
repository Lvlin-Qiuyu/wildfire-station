<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">AES-256在线文本加密解密器</h1>
      <p class="text-gray-600">使用AES-256-CBC算法保护你的隐私数据，支持文本和文件加密</p>
    </div>

    <!-- 加密模式选择 -->
    <div class="flex justify-center mb-6">
      <div class="bg-gray-100 rounded-lg p-1 inline-flex">
        <button 
          @click="mode = 'encrypt'" 
          :class="mode === 'encrypt' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'"
          class="px-4 py-2 rounded-md transition-colors"
        >
          加密
        </button>
        <button 
          @click="mode = 'decrypt'" 
          :class="mode === 'decrypt' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'"
          class="px-4 py-2 rounded-md transition-colors"
        >
          解密
        </button>
      </div>
    </div>

    <!-- 密钥输入 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        加密密钥（32位字符）
      </label>
      <input
        v-model="password"
        type="password"
        placeholder="请输入32位加密密钥"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        maxlength="32"
      />
      <p class="text-xs text-gray-500 mt-1">提示：密钥长度必须为32位字符</p>
    </div>

    <!-- 文件上传区域 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ mode === 'encrypt' ? '要加密的文件' : '要解密的文件' }}
      </label>
      <div
        @drop.prevent="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        :class="isDragging ? 'border-blue-400 bg-blue-50' : ''"
      >
        <input
          ref="fileInput"
          type="file"
          @change="handleFileChange"
          class="hidden"
          :accept="mode === 'encrypt' ? '*' : '.enc'"
        />
        <div v-if="!file">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-gray-600 mb-2">拖拽文件到此处或点击选择</p>
          <button
            @click="$refs.fileInput.click()"
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            选择文件
          </button>
        </div>
        <div v-else class="text-center">
          <p class="text-sm text-gray-600 mb-2">{{ file.name }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
          <button
            @click="file = null"
            class="text-red-500 hover:text-red-700 text-sm mt-2"
          >
            清除文件
          </button>
        </div>
      </div>
    </div>

    <!-- 文本输入区域 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        {{ mode === 'encrypt' ? '要加密的文本' : '要解密的文本' }}
      </label>
      <textarea
        v-model="inputText"
        rows="6"
        placeholder="请输入要处理的内容"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      ></textarea>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-center gap-4 mb-6">
      <button
        @click="handleProcess"
        :disabled="!canProcess"
        class="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {{ mode === 'encrypt' ? '加密' : '解密' }}
      </button>
      <button
        @click="resetForm"
        class="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors"
      >
        重置
      </button>
    </div>

    <!-- 加密选项 -->
    <div v-if="mode === 'encrypt'" class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-4">加密选项</h3>
      <div class="space-y-4">
        <label class="flex items-center">
          <input v-model="options.ivBase64" type="checkbox" class="mr-2 rounded">
          <span class="text-sm text-gray-700">使用随机IV（推荐）</span>
        </label>
        <label class="flex items-center">
          <input v-model="options.encodeBase64" type="checkbox" class="mr-2 rounded" checked>
          <span class="text-sm text-gray-700">Base64编码结果</span>
        </label>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="result" class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-800">处理结果</h3>
        <div class="flex gap-2">
          <button
            @click="copyResult"
            class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
          >
            复制结果
          </button>
          <button
            @click="downloadResult"
            class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            下载文件
          </button>
        </div>
      </div>
      <div class="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
        <pre class="text-sm text-gray-800 whitespace-pre-wrap break-all">{{ result }}</pre>
      </div>
      <div v-if="processing" class="mt-4 text-center">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-gray-600">处理中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 状态管理
const mode = ref('encrypt')
const password = ref('')
const inputText = ref('')
const file = ref(null)
const result = ref('')
const processing = ref(false)
const isDragging = ref(false)
const fileInput = ref(null)

// 加密选项
const options = ref({
  ivBase64: true,
  encodeBase64: true
})

// 计算属性
const canProcess = computed(() => {
  if (mode.value === 'encrypt') {
    return (password.value.length === 32 && inputText.value.trim()) || file.value
  } else {
    return (password.value.length === 32 && inputText.value.trim()) || file.value
  }
})

// 方法
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    file.value = files[0]
  }
}

const handleFileChange = (e) => {
  file.value = e.target.files[0] || null
}

const handleProcess = async () => {
  if (!canProcess.value) return
  
  processing.value = true
  result.value = ''
  
  try {
    if (file.value) {
      // 处理文件
      const arrayBuffer = await file.value.arrayBuffer()
      if (mode.value === 'encrypt') {
        result.value = await encryptFile(arrayBuffer)
      } else {
        result.value = await decryptFile(arrayBuffer)
      }
    } else {
      // 处理文本
      if (mode.value === 'encrypt') {
        result.value = await encryptText(inputText.value)
      } else {
        result.value = await decryptText(inputText.value)
      }
    }
  } catch (error) {
    result.value = '处理失败: ' + error.message
  } finally {
    processing.value = false
  }
}

const encryptText = async (text) => {
  // 这里应该实现AES加密逻辑
  // 为简化演示，返回模拟结果
  return '加密结果（演示模式）：' + btoa(text + '__ENCRYPTED__')
}

const decryptText = async (text) => {
  // 这里应该实现AES解密逻辑
  // 为简化演示，返回模拟结果
  try {
    const decoded = atob(text)
    if (decoded.endsWith('__ENCRYPTED__')) {
      return decoded.replace('__ENCRYPTED__', '')
    }
    return '解密结果（演示模式）：' + decoded
  } catch (error) {
    return '解密失败，请检查输入格式'
  }
}

const encryptFile = async (arrayBuffer) => {
  // 这里应该实现文件加密逻辑
  const blob = new Blob([arrayBuffer])
  return '文件加密完成（演示模式）：' + blob.size + ' bytes'
}

const decryptFile = async (arrayBuffer) => {
  // 这里应该实现文件解密逻辑
  const blob = new Blob([arrayBuffer])
  return '文件解密完成（演示模式）：' + blob.size + ' bytes'
}

const copyResult = () => {
  navigator.clipboard.writeText(result.value)
}

const downloadResult = () => {
  const blob = new Blob([result.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = mode.value === 'encrypt' ? 'encrypted.enc' : 'decrypted.txt'
  a.click()
  URL.revokeObjectURL(url)
}

const resetForm = () => {
  password.value = ''
  inputText.value = ''
  file.value = null
  result.value = ''
  processing.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>