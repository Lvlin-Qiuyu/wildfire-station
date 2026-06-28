<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">智能学习进度追踪器</h1>
      <p class="text-gray-600">结合番茄钟+间隔重复+记忆曲线的AI辅助学习工具</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- 左侧：学习内容管理 -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">学习内容管理</h3>
          
          <!-- 添加学习内容 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">添加学习内容</label>
            <textarea
              v-model="newContent"
              rows="3"
              placeholder="输入要学习的内容或问题"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
            <button
              @click="addLearningContent"
              :disabled="!newContent.trim()"
              class="mt-2 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              添加到学习计划
            </button>
          </div>

          <!-- 学习列表 -->
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in learningItems"
              :key="index"
              class="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs text-gray-500">第{{ index + 1 }}项</span>
                <button
                  @click="removeLearningContent(index)"
                  class="text-red-500 hover:text-red-700 text-xs"
                >
                  删除
                </button>
              </div>
              <p class="text-sm text-gray-800 line-clamp-2">{{ item.content }}</p>
              <div class="mt-2">
                <span class="text-xs px-2 py-1 rounded-full"
                  :class="getDifficultyColor(item.difficulty)">
                  {{ getDifficultyText(item.difficulty) }}
                </span>
                <span class="text-xs text-gray-500 ml-2">
                  下次复习: {{ formatNextReview(item.nextReview) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 学习统计 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">学习统计</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">总学习项</span>
              <span class="text-sm font-medium">{{ learningItems.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">今日复习</span>
              <span class="text-sm font-medium text-green-600">{{ todayReviewCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">掌握度</span>
              <span class="text-sm font-medium text-blue-600">{{ masteryRate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：番茄钟计时器 -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">番茄钟计时器</h3>
          
          <!-- 计时器显示 -->
          <div class="text-center mb-6">
            <div class="text-4xl font-bold text-gray-800 mb-2">{{ formatTime(timerSeconds) }}</div>
            <div class="text-sm text-gray-500">{{ timerStatus }}</div>
          </div>

          <!-- 控制按钮 -->
          <div class="flex justify-center gap-3 mb-6">
            <button
              @click="toggleTimer"
              :class="timerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
              class="text-white px-4 py-2 rounded-md transition-colors"
            >
              {{ timerRunning ? '暂停' : '开始' }}
            </button>
            <button
              @click="resetTimer"
              class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
            <button
              @click="skipTimer"
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              跳过
            </button>
          </div>

          <!-- 设置 -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">学习时长</label>
              <select v-model="timerSettings.workDuration" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option :value="25">25分钟</option>
                <option :value="30">30分钟</option>
                <option :value="45">45分钟</option>
                <option :value="60">60分钟</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">休息时长</label>
              <select v-model="timerSettings.breakDuration" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option :value="5">5分钟</option>
                <option :value="10">10分钟</option>
                <option :value="15">15分钟</option>
                <option :value="20">20分钟</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 学习记录 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">今日学习记录</h3>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div v-for="(session, index) in todaySessions" :key="index" class="flex justify-between items-center py-2 border-b">
              <div>
                <span class="text-sm text-gray-600">{{ session.type === 'work' ? '学习' : '休息' }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ session.duration }}分钟</span>
              </div>
              <span class="text-xs text-gray-500">{{ session.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：学习分析 -->
      <div class="lg:col-span-1">
        <!-- 学习曲线 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">学习进度曲线</h3>
          <div class="h-48 bg-gray-50 rounded-md flex items-center justify-center">
            <div class="text-center text-gray-500">
              <svg class="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p class="text-sm">进度图表区域</p>
            </div>
          </div>
        </div>

        <!-- 复习提醒 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-medium text-gray-800 mb-4">复习提醒</h3>
          <div class="space-y-3">
            <div v-if="reviewItems.length === 0" class="text-center text-gray-500 py-4">
              暂无需要复习的内容
            </div>
            <div
              v-for="item in reviewItems"
              :key="item.id"
              class="border rounded-lg p-3 hover:bg-yellow-50 transition-colors"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-medium text-yellow-600">需要复习</span>
                <span class="text-xs text-gray-500">{{ item.urgency }}</span>
              </div>
              <p class="text-sm text-gray-800 line-clamp-2">{{ item.content }}</p>
              <button
                @click="reviewItem(item.id)"
                class="mt-2 w-full bg-yellow-500 text-white py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                开始复习
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习复盘 -->
    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 class="text-lg font-medium text-gray-800 mb-4">学习复盘</h3>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ totalStudyTime }}</div>
          <div class="text-sm text-gray-600">总学习时间(分钟)</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ completedReviews }}</div>
          <div class="text-sm text-gray-600">完成复习次数</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ averageScore }}</div>
          <div class="text-sm text-gray-600">平均掌握度</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 状态管理
const newContent = ref('')
const learningItems = ref([])
const timerSeconds = ref(25 * 60) // 默认25分钟
const timerRunning = ref(false)
const timerStatus = ref('准备开始')
const todaySessions = ref([])
const reviewItems = ref([])

// 计时器设置
const timerSettings = ref({
  workDuration: 25,
  breakDuration: 5
})

// 计算属性
const todayReviewCount = computed(() => {
  return learningItems.value.filter(item => isDueToday(item.nextReview)).length
})

const masteryRate = computed(() => {
  if (learningItems.value.length === 0) return 0
  const mastered = learningItems.value.filter(item => item.difficulty <= 2).length
  return Math.round((mastered / learningItems.value.length) * 100)
})

const totalStudyTime = computed(() => {
  return todaySessions.value
    .filter(session => session.type === 'work')
    .reduce((total, session) => total + session.duration, 0)
})

const completedReviews = computed(() => {
  return learningItems.value.filter(item => item.reviewCount > 0).length
})

const averageScore = computed(() => {
  if (learningItems.value.length === 0) return 0
  const totalScore = learningItems.value.reduce((sum, item) => sum + (5 - item.difficulty), 0)
  return Math.round(totalScore / learningItems.value.length)
})

// 方法
const addLearningContent = () => {
  if (!newContent.value.trim()) return
  
  const newItem = {
    id: Date.now(),
    content: newContent.value.trim(),
    difficulty: 5, // 初始难度最高
    nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
    reviewCount: 0,
    createdAt: new Date(),
    lastReviewed: null,
    score: 0
  }
  
  learningItems.value.push(newItem)
  newContent.value = ''
  updateReviewItems()
}

const removeLearningContent = (index) => {
  learningItems.value.splice(index, 1)
  updateReviewItems()
}

const updateReviewItems = () => {
  reviewItems.value = learningItems.value.filter(item => isDueToday(item.nextReview))
}

const isDueToday = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const getDifficultyColor = (difficulty) => {
  if (difficulty <= 2) return 'bg-green-100 text-green-800'
  if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getDifficultyText = (difficulty) => {
  if (difficulty <= 2) return '已掌握'
  if (difficulty <= 3) return '熟悉'
  if (difficulty <= 4) return '一般'
  return '不熟悉'
}

const formatNextReview = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = date - now
  
  if (diff < 0) return '已过期'
  if (diff < 60 * 60 * 1000) return Math.round(diff / 60000) + '分钟后'
  if (diff < 24 * 60 * 60 * 1000) return Math.round(diff / (60 * 60 * 1000)) + '小时后'
  return Math.round(diff / (24 * 60 * 60 * 1000)) + '天后'
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleTimer = () => {
  if (timerRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const startTimer = () => {
  timerRunning.value = true
  timerStatus.value = '学习中...'
  
  const timer = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--
    } else {
      clearInterval(timer)
      timerComplete()
    }
  }, 1000)
  
  // 保存timer引用以便清理
  currentTimer.value = timer
}

const pauseTimer = () => {
  timerRunning.value = false
  timerStatus.value = '已暂停'
  if (currentTimer.value) {
    clearInterval(currentTimer.value)
  }
}

const resetTimer = () => {
  timerRunning.value = false
  timerSeconds.value = timerSettings.value.workDuration * 60
  timerStatus.value = '准备开始'
  if (currentTimer.value) {
    clearInterval(currentTimer.value)
  }
}

const skipTimer = () => {
  if (currentTimer.value) {
    clearInterval(currentTimer.value)
  }
  timerComplete()
}

const timerComplete = () => {
  timerRunning.value = false
  const sessionType = timerSeconds.value === 0 ? 'work' : 'break'
  
  const session = {
    type: sessionType,
    duration: sessionType === 'work' ? timerSettings.value.workDuration : timerSettings.value.breakDuration,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    completed: timerSeconds.value === 0
  }
  
  todaySessions.value.push(session)
  
  if (sessionType === 'work') {
    timerSeconds.value = timerSettings.value.breakDuration * 60
    timerStatus.value = '休息中...'
  } else {
    timerSeconds.value = timerSettings.value.workDuration * 60
    timerStatus.value = '准备开始'
  }
}

const reviewItem = (itemId) => {
  const item = learningItems.value.find(item => item.id === itemId)
  if (item) {
    // 模拟复习评分
    const score = Math.random() * 5 // 0-5分
    item.score = score
    item.difficulty = Math.max(1, Math.min(5, 5 - score))
    item.reviewCount++
    item.lastReviewed = new Date()
    
    // 计算下次复习时间（基于间隔重复算法）
    const intervals = [1, 3, 7, 14, 30] // 天数
    const intervalIndex = Math.min(item.reviewCount, intervals.length - 1)
    item.nextReview = new Date(Date.now() + intervals[intervalIndex] * 24 * 60 * 60 * 1000)
    
    updateReviewItems()
  }
}

// 生命周期
onMounted(() => {
  // 从localStorage加载数据
  const savedItems = localStorage.getItem('learningItems')
  if (savedItems) {
    learningItems.value = JSON.parse(savedItems)
  }
  
  const savedSessions = localStorage.getItem('todaySessions')
  if (savedSessions) {
    todaySessions.value = JSON.parse(savedSessions)
  }
  
  updateReviewItems()
})

// 保存数据到localStorage
watch([learningItems, todaySessions], () => {
  localStorage.setItem('learningItems', JSON.stringify(learningItems.value))
  localStorage.setItem('todaySessions', JSON.stringify(todaySessions.value))
}, { deep: true })

const currentTimer = ref(null)
</script>