<template>
  <div class="tool-page">
    <h2>🎓 抽认卡学习器</h2>
    <p class="subtitle">创建卡片 + 间隔重复算法，高效记忆和复习</p>

    <!-- Main View: Deck List -->
    <div v-if="view === 'list'" class="deck-list">
      <div class="deck-actions">
        <button class="btn-primary" @click="createDeck">➕ 新建卡组</button>
      </div>

      <div v-if="decks.length === 0" class="empty-state">
        <p>📝 还没有卡组，点击上方按钮创建一个吧</p>
      </div>

      <div v-for="deck in decks" :key="deck.id" class="deck-card">
        <div class="deck-info" @click="view = 'deck'; currentDeckId = deck.id">
          <h3>{{ deck.name }}</h3>
          <p>{{ deck.cards.length }} 张卡片</p>
        </div>
        <div class="deck-meta">
          <span class="badge" v-if="getDueCount(deck) > 0" @click="startReview(deck.id)">
            📋 {{ getDueCount(deck) }} 待复习
          </span>
          <span class="deck-date">{{ deck.updatedAt || '刚刚创建' }}</span>
        </div>
        <div class="deck-btns">
          <button class="btn-sm btn-study" @click="startReview(deck.id)" :disabled="getDueCount(deck.id) === 0">复习</button>
          <button class="btn-sm btn-edit" @click="view = 'deck'; currentDeckId = deck.id">管理</button>
          <button class="btn-sm btn-danger" @click="deleteDeck(deck.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- Deck View: Manage Cards -->
    <div v-if="view === 'deck'" class="deck-detail">
      <div class="detail-header">
        <button class="btn-back" @click="view = 'list'">← 返回</button>
        <h3>{{ currentDeck?.name }}</h3>
      </div>

      <!-- Add Card Form -->
      <div class="add-card-form">
        <input v-model="newFront" placeholder="正面：问题 / 关键词" class="text-input" />
        <textarea v-model="newBack" placeholder="背面：答案 / 解释" class="text-input textarea" rows="2"></textarea>
        <button class="btn-primary btn-sm" @click="addCard">添加卡片</button>
      </div>

      <!-- Cards List -->
      <div class="cards-list">
        <div v-for="(card, i) in currentDeck?.cards" :key="card.id" class="card-item">
          <div class="card-number">#{{ i + 1 }}</div>
          <div class="card-content">
            <div class="card-front">{{ card.front }}</div>
            <div class="card-back">{{ card.back }}</div>
          </div>
          <div class="card-box">盒{{ card.box }}</div>
          <button class="btn-xs btn-danger" @click="removeCard(card.id)">✕</button>
        </div>
        <div v-if="currentDeck?.cards.length === 0" class="empty-state small">
          <p>还没有卡片，在上方添加</p>
        </div>
      </div>

      <!-- Import / Export -->
      <div class="io-row">
        <button class="btn-sm" @click="exportDeck">📤 导出卡组</button>
        <label class="btn-sm btn-import-label">
          📥 导入卡组
          <input type="file" accept=".json" @change="importDeck" hidden />
        </label>
      </div>
    </div>

    <!-- Review Mode -->
    <div v-if="view === 'review'" class="review-mode">
      <div class="review-header">
        <button class="btn-back" @click="exitReview">← 退出复习</button>
        <div class="review-progress">{{ reviewIndex + 1 }} / {{ reviewQueue.length }}</div>
      </div>

      <div v-if="reviewQueue.length > 0 && reviewIndex < reviewQueue.length" class="review-area">
        <!-- Progress Bar -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: ((reviewIndex + 1) / reviewQueue.length * 100) + '%' }"></div>
        </div>

        <!-- Flashcard -->
        <div class="flashcard" :class="{ flipped: isFlipped }" @click="isFlipped = !isFlipped">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="flashcard-label">正面 · 问题</div>
              <div class="flashcard-text">{{ currentReviewCard?.front }}</div>
            </div>
            <div class="flashcard-back">
              <div class="flashcard-label">背面 · 答案</div>
              <div class="flashcard-text">{{ currentReviewCard?.back }}</div>
            </div>
          </div>
        </div>

        <p class="flip-hint">👆 点击卡片翻转查看答案</p>

        <!-- Answer Buttons -->
        <div class="answer-btns" v-if="isFlipped">
          <button class="btn-wrong" @click="answerCard(false)">😅 不熟</button>
          <button class="btn-right" @click="answerCard(true)">😎 记住了</button>
        </div>
      </div>

      <!-- Review Complete -->
      <div v-if="reviewIndex >= reviewQueue.length" class="review-complete">
        <div class="complete-icon">🎉</div>
        <h3>复习完成！</h3>
        <p>本轮复习了 {{ reviewQueue.length }} 张卡片</p>
        <button class="btn-primary" @click="exitReview">返回</button>
      </div>
    </div>

    <!-- Create Deck Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <h3>新建卡组</h3>
        <input v-model="newDeckName" placeholder="卡组名称（如：英语单词、AI演讲）" class="text-input" />
        <div class="modal-btns">
          <button class="btn-sm" @click="showCreateModal = false">取消</button>
          <button class="btn-primary btn-sm" @click="confirmCreateDeck">创建</button>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="exportData" class="modal-overlay" @click.self="exportData = null">
      <div class="modal">
        <h3>导出卡组 JSON</h3>
        <textarea class="export-textarea" :value="exportData" readonly rows="8"></textarea>
        <div class="modal-btns">
          <button class="btn-sm" @click="copyExport">📋 复制</button>
          <button class="btn-primary btn-sm" @click="downloadExport">💾 下载</button>
        </div>
      </div>
    </div>

    <NuxtLink v-if="view === 'list'" to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '抽认卡学习器 - 野火小站' })

// State
const view = ref('list') // list | deck | review
const decks = ref([])
const currentDeckId = ref(null)
const showCreateModal = ref(false)
const newDeckName = ref('')
const newFront = ref('')
const newBack = ref('')
const exportData = ref(null)

// Review state
const reviewQueue = ref([])
const reviewIndex = ref(0)
const isFlipped = ref(false)

const currentDeck = computed(() => decks.value.find(d => d.id === currentDeckId.value))
const currentReviewCard = computed(() => reviewQueue.value[reviewIndex.value])

// Storage
const STORAGE_KEY = 'flashcard_decks'

function loadDecks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) decks.value = JSON.parse(raw)
  } catch {}
}

function saveDecks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks.value))
  } catch {}
}

// Deck CRUD
function createDeck() {
  newDeckName.value = ''
  showCreateModal.value = true
}

function confirmCreateDeck() {
  const name = newDeckName.value.trim()
  if (!name) return
  decks.value.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    cards: [],
    createdAt: new Date().toLocaleDateString('zh-CN'),
    updatedAt: new Date().toLocaleDateString('zh-CN'),
  })
  saveDecks()
  showCreateModal.value = false
}

function deleteDeck(id) {
  if (!confirm('确定删除此卡组？')) return
  decks.value = decks.value.filter(d => d.id !== id)
  if (currentDeckId.value === id) {
    view.value = 'list'
    currentDeckId.value = null
  }
  saveDecks()
}

// Card CRUD
function addCard() {
  const front = newFront.value.trim()
  const back = newBack.value.trim()
  if (!front || !back || !currentDeck.value) return

  currentDeck.value.cards.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    front,
    back,
    box: 1, // Start in box 1
    nextReview: Date.now(), // Due immediately
  })

  currentDeck.value.updatedAt = new Date().toLocaleDateString('zh-CN')
  newFront.value = ''
  newBack.value = ''
  saveDecks()
}

function removeCard(cardId) {
  if (!currentDeck.value) return
  currentDeck.value.cards = currentDeck.value.cards.filter(c => c.id !== cardId)
  saveDecks()
}

// Leitner System: boxes 1-5
// Box 1: review every time (interval 0)
// Box 2: review after 1 day
// Box 3: review after 3 days
// Box 4: review after 7 days
// Box 5: review after 14 days (mastered)

const boxIntervals = [0, 0, 1, 3, 7, 14] // in days, index = box number

function getDueCount(deck) {
  const now = Date.now()
  return deck.cards.filter(c => c.nextReview <= now).length
}

function getDueCards(deck) {
  const now = Date.now()
  return deck.cards.filter(c => c.nextReview <= now)
}

function startReview(deckId) {
  const deck = decks.value.find(d => d.id === deckId)
  if (!deck) return
  const due = getDueCards(deck)
  if (due.length === 0) return

  reviewQueue.value = [...due]
  reviewIndex.value = 0
  isFlipped.value = false
  view.value = 'review'
}

function answerCard(correct) {
  const card = currentReviewCard.value
  if (!card) return

  if (correct) {
    // Move to next box (max 5)
    card.box = Math.min(5, card.box + 1)
  } else {
    // Back to box 1
    card.box = 1
  }

  // Set next review time
  const intervalMs = boxIntervals[card.box] * 24 * 60 * 60 * 1000
  card.nextReview = Date.now() + intervalMs

  // Also update in deck
  const deck = decks.value.find(d => d.id === currentDeckId.value)
  if (deck) {
    deck.updatedAt = new Date().toLocaleDateString('zh-CN')
  }

  saveDecks()

  // Next card
  reviewIndex.value++
  isFlipped.value = false
}

function exitReview() {
  view.value = 'list'
  reviewQueue.value = []
  reviewIndex.value = 0
}

// Import / Export
function exportDeck() {
  if (!currentDeck.value) return
  exportData.value = JSON.stringify(currentDeck.value, null, 2)
}

function copyExport() {
  if (!exportData.value) return
  navigator.clipboard.writeText(exportData.value).then(() => {
    alert('已复制到剪贴板')
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = exportData.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制到剪贴板')
  })
}

function downloadExport() {
  if (!exportData.value || !currentDeck.value) return
  const blob = new Blob([exportData.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = currentDeck.value.name + '.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importDeck(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result)
      if (!data.name || !Array.isArray(data.cards)) {
        alert('无效的卡组文件')
        return
      }
      // Validate and normalize cards
      const deck = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: data.name + '（导入）',
        cards: data.cards.map(c => ({
          id: c.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          front: c.front || '',
          back: c.back || '',
          box: Math.max(1, Math.min(5, parseInt(c.box) || 1)),
          nextReview: parseInt(c.nextReview) || Date.now(),
        })),
        createdAt: new Date().toLocaleDateString('zh-CN'),
        updatedAt: new Date().toLocaleDateString('zh-CN'),
      }
      decks.value.push(deck)
      saveDecks()
      currentDeckId.value = deck.id
      view.value = 'deck'
      alert('导入成功！')
    } catch {
      alert('文件解析失败，请检查JSON格式')
    }
  }
  reader.readAsText(file)
  // Reset input
  e.target.value = ''
}

onMounted(() => {
  loadDecks()
})
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

/* Buttons */
.btn-primary {
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.85; }

.btn-sm {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sm:hover { border-color: #22c55e; color: #22c55e; }

.btn-sm.btn-primary { border: none; color: white; }
.btn-sm.btn-primary:hover { opacity: 0.85; }

.btn-sm.btn-study {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.btn-sm.btn-study:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-sm.btn-danger { color: #e74c3c; }
.btn-sm.btn-danger:hover { border-color: #e74c3c; background: #fef2f2; }

.btn-xs {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-xs.btn-danger { color: #e74c3c; }
.btn-xs.btn-danger:hover { background: #fef2f2; border-color: #e74c3c; }

.btn-back {
  background: none;
  border: none;
  color: #22c55e;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.3rem 0;
}

.btn-back:hover { text-decoration: underline; }

.text-input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.text-input:focus { border-color: #22c55e; }

.textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

/* Deck List */
.deck-actions {
  margin-bottom: 1rem;
}

.deck-card {
  background: white;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  margin-bottom: 0.8rem;
  border: 1px solid #f0f0f0;
}

.deck-info {
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.deck-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
  color: #2c3e50;
}

.deck-info p {
  color: #aaa;
  font-size: 0.85rem;
}

.deck-meta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
}

.badge {
  display: inline-block;
  background: #f0fdf4;
  color: #22c55e;
  font-size: 0.82rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
}

.deck-date {
  color: #ccc;
  font-size: 0.8rem;
}

.deck-btns {
  display: flex;
  gap: 0.5rem;
}

/* Deck Detail */
.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.detail-header h3 {
  font-size: 1.2rem;
  color: #2c3e50;
}

.add-card-form {
  background: #fafafa;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cards-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.card-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.card-number {
  color: #ccc;
  font-size: 0.8rem;
  min-width: 28px;
  text-align: center;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-front {
  font-size: 0.9rem;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-back {
  font-size: 0.8rem;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-box {
  font-size: 0.75rem;
  color: #22c55e;
  background: #f0fdf4;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  white-space: nowrap;
}

.io-row {
  display: flex;
  gap: 0.5rem;
}

.btn-import-label {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

/* Review Mode */
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.review-progress {
  font-size: 0.9rem;
  color: #888;
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Flashcard */
.flashcard {
  width: 100%;
  max-width: 420px;
  height: 260px;
  margin: 0 auto 1rem;
  perspective: 1000px;
  cursor: pointer;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flashcard.flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.flashcard-front {
  background: white;
  border: 2px solid #22c55e;
}

.flashcard-back {
  background: linear-gradient(135deg, #22c55e, #10b981);
  color: white;
  transform: rotateY(180deg);
}

.flashcard-label {
  font-size: 0.75rem;
  opacity: 0.5;
  margin-bottom: 0.6rem;
}

.flashcard-text {
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  line-height: 1.6;
  max-height: 180px;
  overflow-y: auto;
}

.flip-hint {
  text-align: center;
  color: #bbb;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.answer-btns {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-wrong, .btn-right {
  padding: 0.7rem 2rem;
  border-radius: 12px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-wrong {
  background: #fef2f2;
  color: #e74c3c;
  border: 2px solid #fecaca;
}

.btn-wrong:hover {
  background: #e74c3c;
  color: white;
}

.btn-right {
  background: #22c55e;
  color: white;
}

.btn-right:hover {
  background: #16a34a;
}

/* Review Complete */
.review-complete {
  text-align: center;
  padding: 3rem 1rem;
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.review-complete h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.review-complete p {
  color: #888;
  margin-bottom: 1.5rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.export-textarea {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  resize: vertical;
  box-sizing: border-box;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #bbb;
}

.empty-state.small {
  padding: 1.5rem 1rem;
}

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}

.back-link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .flashcard {
    height: 220px;
  }
  .flashcard-text {
    font-size: 1rem;
  }
  .answer-btns {
    flex-direction: column;
  }
  .btn-wrong, .btn-right {
    width: 100%;
  }
  .deck-btns {
    flex-wrap: wrap;
  }
}
</style>
