<template>
  <div class="tool-page">
    <h2>💰 智能账单分摊助手</h2>
    <p class="subtitle">聚餐后实时计算每个人应付金额，包含小费计算和多项目分账</p>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="input-group">
        <label>聚餐总金额</label>
        <div class="amount-input">
          <span class="currency">¥</span>
          <input type="number" v-model.number="totalAmount" min="0" step="0.01" class="num-input" placeholder="0.00" />
        </div>
      </div>
      
      <div class="input-group">
        <label>人数</label>
        <div class="people-input">
          <button @click="peopleCount = Math.max(1, peopleCount - 1)" class="counter-btn">-</button>
          <input type="number" v-model.number="peopleCount" min="1" max="50" class="num-input" />
          <button @click="peopleCount = peopleCount + 1" class="counter-btn">+</button>
        </div>
      </div>

      <div class="input-group">
        <label>小费比例</label>
        <div class="tip-input">
          <input type="range" v-model.number="tipPercentage" min="0" max="30" step="1" class="slider" />
          <span class="tip-value">{{ tipPercentage }}%</span>
        </div>
      </div>

      <div class="input-group">
        <label>支付方式</label>
        <div class="payment-toggle">
          <button :class="{ active: paymentMethod === 'split' }" @click="paymentMethod = 'split'">
            💳 平均分摊
          </button>
          <button :class="{ active: paymentMethod === 'itemize' }" @click="paymentMethod = 'itemize'">
            📝 项目分账
          </button>
        </div>
      </div>
    </div>

    <!-- 项目分账区域 -->
    <div v-if="paymentMethod === 'itemize'" class="itemize-section">
      <h3>📋 添加消费项目</h3>
      <div class="item-input">
        <input type="text" v-model="newItem.name" placeholder="项目名称（如：菜名、酒水等）" class="item-name-input" />
        <div class="item-amount">
          <span class="currency">¥</span>
          <input type="number" v-model.number="newItem.amount" min="0" step="0.01" class="num-input" placeholder="0.00" />
        </div>
        <button @click="addItem" class="add-item-btn">+</button>
      </div>
      
      <div v-if="billItems.length > 0" class="items-list">
        <div v-for="(item, index) in billItems" :key="index" class="item-row">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-amount">¥{{ item.amount.toFixed(2) }}</span>
          <button @click="removeItem(index)" class="remove-item-btn">×</button>
        </div>
      </div>
    </div>

    <!-- 计算结果 -->
    <div class="results-section">
      <div class="summary-card">
        <h3>📊 账单汇总</h3>
        <div class="summary-row">
          <span>消费金额</span>
          <span class="amount">¥{{ subtotal.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>小费金额</span>
          <span class="amount" :class="{ positive: tipAmount > 0 }">¥{{ tipAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-row total">
          <span>应付总额</span>
          <span class="amount total-amount">¥{{ totalWithTip.toFixed(2) }}</span>
        </div>
      </div>

      <div class="people-results">
        <h3>👥 每人应付</h3>
        <div v-for="person in peopleResults" :key="person.id" class="person-card">
          <div class="person-info">
            <span class="person-name">人员 {{ person.id }}</span>
            <span class="person-percentage">{{ person.percentage }}%</span>
          </div>
          <div class="person-amount">
            <span class="amount">¥{{ person.amount.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="resetCalculator" class="reset-btn">🔄 重置</button>
      <button @copyResults="copyResults" class="copy-btn">📋 复制结果</button>
      <button @shareResults="shareResults" class="share-btn">📤 分享</button>
    </div>

    <!-- 分享模态框 -->
    <div v-if="showShareModal" class="modal-overlay" @click="showShareModal = false">
      <div class="modal-content" @click.stop>
        <h3>📤 分享账单</h3>
        <div class="share-content">
          <textarea v-model="shareText" readonly class="share-textarea"></textarea>
        </div>
        <div class="modal-buttons">
          <button @click="copyShareText" class="copy-btn">复制</button>
          <button @click="showShareModal = false" class="close-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: '智能账单分摊助手 - 野火小站' })

const totalAmount = ref(0)
const peopleCount = ref(2)
const tipPercentage = ref(10)
const paymentMethod = ref('split')
const billItems = ref([])
const newItem = ref({ name: '', amount: 0 })
const showShareModal = ref(false)
const shareText = ref('')

// 计算小项总额
const subtotal = computed(() => {
  if (paymentMethod.value === 'split') {
    return totalAmount.value
  } else {
    return billItems.value.reduce((sum, item) => sum + item.amount, 0)
  }
})

// 计算小费金额
const tipAmount = computed(() => {
  return subtotal.value * (tipPercentage.value / 100)
})

// 计算应付总额
const totalWithTip = computed(() => {
  return subtotal.value + tipAmount.value
})

// 计算每人应付金额
const peopleResults = computed(() => {
  const results = []
  const baseAmount = totalWithTip.value / peopleCount.value
  
  for (let i = 0; i < peopleCount.value; i++) {
    results.push({
      id: i + 1,
      amount: baseAmount,
      percentage: 100 / peopleCount.value
    })
  }
  
  return results
})

// 添加项目
const addItem = () => {
  if (newItem.value.name && newItem.value.amount > 0) {
    billItems.value.push({
      name: newItem.value.name,
      amount: newItem.value.amount
    })
    newItem.value = { name: '', amount: 0 }
  }
}

// 移除项目
const removeItem = (index) => {
  billItems.value.splice(index, 1)
}

// 重置计算器
const resetCalculator = () => {
  totalAmount.value = 0
  peopleCount.value = 2
  tipPercentage.value = 10
  paymentMethod.value = 'split'
  billItems.value = []
  newItem.value = { name: '', amount: 0 }
  showShareModal.value = false
}

// 复制结果
const copyResults = () => {
  const results = generateResultsText()
  navigator.clipboard.writeText(results)
  
  // 显示复制成功提示
  const originalText = event.target.textContent
  event.target.textContent = '✅ 已复制'
  setTimeout(() => {
    event.target.textContent = originalText
  }, 2000)
}

// 生成结果文本
const generateResultsText = () => {
  const date = new Date().toLocaleDateString('zh-CN')
  let text = `💰 聚餐账单分摊 (${date})\n\n`
  text += `消费金额: ¥${subtotal.value.toFixed(2)}\n`
  text += `小费 (${tipPercentage.value}%): ¥${tipAmount.value.toFixed(2)}\n`
  text += `应付总额: ¥${totalWithTip.value.toFixed(2)}\n`
  text += `分摊人数: ${peopleCount.value}人\n\n`
  
  text += `每人应付:\n`
  peopleResults.value.forEach(person => {
    text += `  人员${person.id}: ¥${person.amount.toFixed(2)} (${person.percentage}%)\n`
  })
  
  if (paymentMethod.value === 'itemize' && billItems.value.length > 0) {
    text += `\n详细项目:\n`
    billItems.value.forEach(item => {
      text += `  ${item.name}: ¥${item.amount.toFixed(2)}\n`
    })
  }
  
  return text
}

// 分享结果
const shareResults = () => {
  shareText.value = generateResultsText()
  showShareModal.value = true
}

// 复制分享文本
const copyShareText = () => {
  navigator.clipboard.writeText(shareText.value)
  
  // 显示复制成功提示
  const btn = event.target
  const originalText = btn.textContent
  btn.textContent = '✅ 已复制'
  setTimeout(() => {
    btn.textContent = originalText
  }, 2000)
}
</script>

<style scoped>
.tool-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

/* 输入区域样式 */
.input-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.amount-input, .people-input, .tip-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.currency {
  font-size: 18px;
  font-weight: 600;
  color: #22c55e;
}

.num-input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.num-input:focus {
  outline: none;
  border-color: #22c55e;
}

.counter-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.counter-btn:hover {
  background: #f3f4f6;
}

.payment-toggle, .itemize-section {
  display: flex;
  gap: 10px;
}

.payment-toggle button {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-toggle button.active {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.itemize-section {
  margin-top: 30px;
}

.item-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.item-name-input {
  flex: 2;
  padding: 10px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.item-amount {
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-item-btn {
  padding: 10px 15px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.add-item-btn:hover {
  background: #16a34a;
}

.items-list {
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  font-weight: 500;
}

.item-amount {
  font-weight: 600;
  color: #22c55e;
  margin-right: 10px;
}

.remove-item-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.remove-item-btn:hover {
  background: #dc2626;
}

/* 结果区域样式 */
.results-section {
  margin: 30px 0;
}

.summary-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-card h3 {
  margin-bottom: 15px;
  color: #0369a1;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 16px;
}

.summary-row.total {
  font-weight: 600;
  font-size: 18px;
  color: #0369a1;
  border-top: 1px solid #e0f2fe;
  padding-top: 10px;
  margin-top: 15px;
}

.amount {
  font-weight: 600;
  color: #22c55e;
}

.amount.positive {
  color: #dc2626;
}

.people-results h3 {
  margin-bottom: 15px;
  color: #333;
}

.person-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.person-info {
  display: flex;
  gap: 15px;
}

.person-name {
  font-weight: 500;
}

.person-percentage {
  color: #666;
  font-size: 14px;
}

.person-amount .amount {
  font-size: 18px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.reset-btn, .copy-btn, .share-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  text-align: center;
}

.reset-btn:hover, .copy-btn:hover, .share-btn:hover {
  background: #f3f4f6;
}

.copy-btn, .share-btn {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.copy-btn:hover, .share-btn:hover {
  background: #16a34a;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
}

.share-content {
  margin-bottom: 20px;
}

.share-textarea {
  width: 100%;
  height: 200px;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.modal-buttons {
  display: flex;
  gap: 10px;
}

.modal-buttons button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.close-btn {
  background: #6b7280;
  color: white;
}

.close-btn:hover {
  background: #4b5563;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tool-page {
    padding: 15px;
  }
  
  .input-section {
    padding: 15px;
  }
  
  .payment-toggle, .itemize-section {
    flex-direction: column;
  }
  
  .people-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .person-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>