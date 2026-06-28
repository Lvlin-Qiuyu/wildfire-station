<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">万能生活计算器套件</h1>
      <p class="text-gray-600">一站式解决房贷计算、BMI健康、个税申报、汇率换算、大写转换等日常计算需求</p>
    </div>

    <!-- 工具选择标签 -->
    <div class="flex justify-center mb-8">
      <div class="bg-gray-100 rounded-lg p-1 inline-flex">
        <button
          v-for="tool in tools"
          :key="tool.id"
          @click="activeTool = tool.id"
          :class="activeTool === tool.id ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'"
          class="px-4 py-2 rounded-md transition-colors"
        >
          {{ tool.name }}
        </button>
      </div>
    </div>

    <!-- 房贷计算器 -->
    <div v-if="activeTool === 'mortgage'" class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">房贷计算器</h3>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 左侧：输入参数 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">房屋总价（万元）</label>
            <input
              v-model="mortgage.housePrice"
              type="number"
              placeholder="请输入房屋总价"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">首付比例</label>
            <select
              v-model="mortgage.downPaymentRatio"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0.2">20%</option>
              <option value="0.3">30%</option>
              <option value="0.4">40%</option>
              <option value="0.5">50%</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">贷款年限</label>
            <select
              v-model="mortgage.loanYears"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="year in [10,15,20,25,30]" :key="year" :value="year">{{year}}年</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">贷款利率</label>
            <input
              v-model="mortgage.interestRate"
              type="number"
              step="0.01"
              placeholder="4.35"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">贷款类型</label>
            <select
              v-model="mortgage.loanType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="commercial">商业贷款</option>
              <option value="公积金">公积金贷款</option>
              <option value="mixed">组合贷款</option>
            </select>
          </div>
        </div>
        
        <!-- 右侧：计算结果 -->
        <div class="space-y-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-800 mb-3">计算结果</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">贷款金额：</span>
                <span class="text-sm font-medium">{{ mortgageResult.loanAmount }}万元</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">月供：</span>
                <span class="text-sm font-medium text-blue-600">{{ mortgageResult.monthlyPayment }}元</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">支付利息：</span>
                <span class="text-sm font-medium">{{ mortgageResult.totalInterest }}万元</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">还款总额：</span>
                <span class="text-sm font-medium">{{ mortgageResult.totalPayment }}万元</span>
              </div>
            </div>
          </div>
          
          <button
            @click="calculateMortgage"
            class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            重新计算
          </button>
        </div>
      </div>
    </div>

    <!-- BMI计算器 -->
    <div v-if="activeTool === 'bmi'" class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">BMI健康计算器</h3>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 左侧：输入参数 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">身高（厘米）</label>
            <input
              v-model="bmi.height"
              type="number"
              placeholder="请输入身高"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">体重（公斤）</label>
            <input
              v-model="bmi.weight"
              type="number"
              placeholder="请输入体重"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">年龄</label>
            <input
              v-model="bmi.age"
              type="number"
              placeholder="请输入年龄（可选）"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">性别</label>
            <div class="flex gap-4">
              <label class="flex items-center">
                <input v-model="bmi.gender" value="male" type="radio" class="mr-2">
                <span class="text-sm">男性</span>
              </label>
              <label class="flex items-center">
                <input v-model="bmi.gender" value="female" type="radio" class="mr-2">
                <span class="text-sm">女性</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- 右侧：计算结果 -->
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-4xl font-bold mb-2" :class="bmiResult.category.color">
              {{ bmiResult.bmi.toFixed(1) }}
            </div>
            <div class="text-lg font-medium text-gray-800">{{ bmiResult.category.name }}</div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-medium text-gray-800 mb-3">健康指标</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">BMI范围：</span>
                <span class="font-medium">{{ bmiResult.category.min }} - {{ bmiResult.category.max }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">标准体重：</span>
                <span class="font-medium">{{ bmiResult.standardWeight }}kg</span>
              </div>
              <div v-if="bmiResult.bmr" class="flex justify-between">
                <span class="text-gray-600">基础代谢率：</span>
                <span class="font-medium">{{ bmiResult.bmr }} kcal/日</span>
              </div>
              <div v-if="bmiResult.idealWeight" class="flex justify-between">
                <span class="text-gray-600">理想体重范围：</span>
                <span class="font-medium">{{ bmiResult.idealWeight.min }} - {{ bmiResult.idealWeight.max }}kg</span>
              </div>
            </div>
          </div>
          
          <button
            @click="calculateBMI"
            class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            重新计算
          </button>
        </div>
      </div>
    </div>

    <!-- 个税计算器 -->
    <div v-if="activeTool === 'tax'" class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">个人所得税计算器</h3>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 左侧：输入参数 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">月薪（元）</label>
            <input
              v-model="tax.monthlySalary"
              type="number"
              placeholder="请输入月薪"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">专项扣除（元/月）</label>
            <input
              v-model="tax.specialDeduction"
              type="number"
              placeholder="社保、公积金等"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">专项附加扣除（元/月）</label>
            <input
              v-model="tax.additionalDeduction"
              type="number"
              placeholder="子女教育、房贷利息等"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">申报方式</label>
            <select
              v-model="tax.filingMethod"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">按月申报</option>
              <option value="annual">按年申报</option>
            </select>
          </div>
        </div>
        
        <!-- 右侧：计算结果 -->
        <div class="space-y-4">
          <div class="bg-green-50 rounded-lg p-4">
            <h4 class="font-medium text-green-800 mb-3">税后收入</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">税前月薪：</span>
                <span class="text-sm font-medium">{{ tax.monthlySalary }}元</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">应纳税所得额：</span>
                <span class="text-sm font-medium">{{ taxResult.taxableIncome }}元</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">应缴个税：</span>
                <span class="text-sm font-medium text-red-600">{{ taxResult.taxAmount }}元</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="text-sm font-medium">税后月薪：</span>
                <span class="text-sm font-bold text-green-600">{{ taxResult.netSalary }}元</span>
              </div>
            </div>
          </div>
          
          <button
            @click="calculateTax"
            class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            重新计算
          </button>
        </div>
      </div>
    </div>

    <!-- 汇率换算器 -->
    <div v-if="activeTool === 'exchange'" class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">汇率换算器</h3>
      
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 左侧：输入参数 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">原始货币</label>
            <select
              v-model="exchange.fromCurrency"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CNY">人民币 (CNY)</option>
              <option value="USD">美元 (USD)</option>
              <option value="EUR">欧元 (EUR)</option>
              <option value="GBP">英镑 (GBP)</option>
              <option value="JPY">日元 (JPY)</option>
              <option value="KRW">韩元 (KRW)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">目标货币</label>
            <select
              v-model="exchange.toCurrency"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">美元 (USD)</option>
              <option value="CNY">人民币 (CNY)</option>
              <option value="EUR">欧元 (EUR)</option>
              <option value="GBP">英镑 (GBP)</option>
              <option value="JPY">日元 (JPY)</option>
              <option value="KRW">韩元 (KRW)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">金额</label>
            <input
              v-model="exchange.amount"
              type="number"
              placeholder="请输入金额"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">汇率</label>
            <input
              v-model="exchange.rate"
              type="number"
              step="0.0001"
              placeholder="实时汇率"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <!-- 右侧：计算结果 -->
        <div class="space-y-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-800 mb-3">换算结果</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">原始金额：</span>
                <span class="text-sm font-medium">{{ exchange.amount }} {{ exchange.fromCurrency }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600">汇率：</span>
                <span class="text-sm font-medium">{{ exchange.rate }}</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="text-sm font-medium">换算金额：</span>
                <span class="text-sm font-bold text-blue-600">{{ exchangeResult.convertedAmount }} {{ exchange.toCurrency }}</span>
              </div>
            </div>
          </div>
          
          <button
            @click="calculateExchange"
            class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            重新计算
          </button>
        </div>
      </div>
    </div>

    <!-- 大写转换器 -->
    <div v-if="activeTool === 'currency'" class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">人民币大写转换器</h3>
      
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">输入数字</label>
          <input
            v-model="currency.numberInput"
            type="number"
            placeholder="请输入数字金额"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div class="bg-gray-50 rounded-lg p-6">
          <h4 class="font-medium text-gray-800 mb-3 text-center">转换结果</h4>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-800 mb-2">{{ currencyResult.upperCase }}</div>
            <div class="text-sm text-gray-600">大写金额</div>
          </div>
        </div>
        
        <button
          @click="convertToUpperCase"
          class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          转换大写
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 工具列表
const tools = [
  { id: 'mortgage', name: '房贷计算器' },
  { id: 'bmi', name: 'BMI计算器' },
  { id: 'tax', name: '个税计算器' },
  { id: 'exchange', name: '汇率换算' },
  { id: 'currency', name: '大写转换' }
]

const activeTool = ref('mortgage')

// 房贷计算器数据
const mortgage = ref({
  housePrice: 100,
  downPaymentRatio: 0.3,
  loanYears: 20,
  interestRate: 4.35,
  loanType: 'commercial'
})

const mortgageResult = ref({
  loanAmount: 0,
  monthlyPayment: 0,
  totalInterest: 0,
  totalPayment: 0
})

// BMI计算器数据
const bmi = ref({
  height: 170,
  weight: 65,
  age: 25,
  gender: 'male'
})

const bmiResult = ref({
  bmi: 0,
  category: { name: '', min: 0, max: 0, color: '' },
  standardWeight: 0,
  bmr: 0,
  idealWeight: { min: 0, max: 0 }
})

// 个税计算器数据
const tax = ref({
  monthlySalary: 10000,
  specialDeduction: 2000,
  additionalDeduction: 1000,
  filingMethod: 'monthly'
})

const taxResult = ref({
  taxableIncome: 0,
  taxAmount: 0,
  netSalary: 0
})

// 汇率换算器数据
const exchange = ref({
  fromCurrency: 'CNY',
  toCurrency: 'USD',
  amount: 1000,
  rate: 0.14
})

const exchangeResult = ref({
  convertedAmount: 0
})

// 大写转换器数据
const currency = ref({
  numberInput: ''
})

const currencyResult = ref({
  upperCase: ''
})

// BMI分类
const bmiCategories = [
  { name: '偏瘦', min: 0, max: 18.5, color: 'text-blue-600' },
  { name: '正常', min: 18.5, max: 24, color: 'text-green-600' },
  { name: '偏胖', min: 24, max: 28, color: 'text-yellow-600' },
  { name: '肥胖', min: 28, max: 100, color: 'text-red-600' }
]

// 计算方法
const calculateMortgage = () => {
  const housePrice = mortgage.value.housePrice * 10000 // 转换为元
  const downPayment = housePrice * mortgage.value.downPaymentRatio
  const loanAmount = housePrice - downPayment
  const monthlyRate = mortgage.value.interestRate / 100 / 12
  const months = mortgage.value.loanYears * 12
  
  // 等额本息计算公式
  const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
  const totalPayment = monthlyPayment * months
  const totalInterest = totalPayment - loanAmount
  
  mortgageResult.value = {
    loanAmount: (loanAmount / 10000).toFixed(2),
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: (totalInterest / 10000).toFixed(2),
    totalPayment: (totalPayment / 10000).toFixed(2)
  }
}

const calculateBMI = () => {
  const height = bmi.value.height / 100 // 转换为米
  const weight = bmi.value.weight
  const bmiValue = weight / (height * height)
  
  // 找到BMI分类
  const category = bmiCategories.find(cat => bmiValue >= cat.min && bmiValue < cat.max) || bmiCategories[bmiCategories.length - 1]
  
  // 计算标准体重（BMI = 22）
  const standardWeight = (22 * height * height).toFixed(1)
  
  // 计算BMR（基础代谢率）
  let bmr = 0
  if (bmi.value.gender === 'male') {
    bmr = Math.round(88.362 + (13.397 * weight) + (4.799 * bmi.value.height) - (5.677 * bmi.value.age))
  } else {
    bmr = Math.round(447.593 + (9.247 * weight) + (3.098 * bmi.value.height) - (4.330 * bmi.value.age))
  }
  
  // 理想体重范围（BMI 18.5-24.9）
  const minIdealWeight = (18.5 * height * height).toFixed(1)
  const maxIdealWeight = (24.9 * height * height).toFixed(1)
  
  bmiResult.value = {
    bmi: bmiValue.toFixed(1),
    category,
    standardWeight,
    bmr,
    idealWeight: {
      min: minIdealWeight,
      max: maxIdealWeight
    }
  }
}

const calculateTax = () => {
  const monthlySalary = tax.value.monthlySalary
  const totalDeduction = tax.value.specialDeduction + tax.value.additionalDeduction
  const taxableIncome = Math.max(0, monthlySalary - 5000 - totalDeduction) // 5000起征点
  
  // 个税税率表（2023年）
  const taxBrackets = [
    { min: 0, max: 3000, rate: 0.03, quickDeduction: 0 },
    { min: 3000, max: 12000, rate: 0.1, quickDeduction: 210 },
    { min: 12000, max: 25000, rate: 0.2, quickDeduction: 1410 },
    { min: 25000, max: 35000, rate: 0.25, quickDeduction: 2660 },
    { min: 35000, max: 55000, rate: 0.3, quickDeduction: 4410 },
    { min: 55000, max: 80000, rate: 0.35, quickDeduction: 7160 },
    { min: 80000, max: Infinity, rate: 0.45, quickDeduction: 15160 }
  ]
  
  let taxAmount = 0
  for (const bracket of taxBrackets) {
    if (taxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
      taxAmount += taxableInBracket * bracket.rate + bracket.quickDeduction
    }
  }
  
  taxResult.value = {
    taxableIncome: Math.round(taxableIncome),
    taxAmount: Math.round(taxAmount),
    netSalary: Math.round(monthlySalary - taxAmount)
  }
}

const calculateExchange = () => {
  const convertedAmount = exchange.value.amount * exchange.value.rate
  exchangeResult.value = {
    convertedAmount: convertedAmount.toFixed(2)
  }
}

const convertToUpperCase = () => {
  const number = parseFloat(currency.value.numberInput)
  if (isNaN(number) || number < 0) {
    currencyResult.value.upperCase = '请输入有效数字'
    return
  }
  
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟', '万']
  const decimalUnits = ['角', '分']
  
  let result = ''
  let integerPart = Math.floor(number)
  let decimalPart = Math.round((number - integerPart) * 100)
  
  // 处理整数部分
  if (integerPart === 0) {
    result = '零'
  } else {
    let integerStr = integerPart.toString()
    for (let i = 0; i < integerStr.length; i++) {
      const digit = parseInt(integerStr[i])
      const unitIndex = integerStr.length - 1 - i
      result += digits[digit] + units[unitIndex]
      
      // 处理连续的零
      if (digit === 0) {
        // 跳过中间的零
        while (i + 1 < integerStr.length && integerStr[i + 1] === '0') {
          i++
        }
      }
    }
    
    result += '元'
  }
  
  // 处理小数部分
  if (decimalPart > 0) {
    const jiao = Math.floor(decimalPart / 10)
    const fen = decimalPart % 10
    
    if (jiao > 0) {
      result += digits[jiao] + '角'
    }
    if (fen > 0) {
      result += digits[fen] + '分'
    }
  } else {
    result += '整'
  }
  
  currencyResult.value.upperCase = result
}

// 生命周期
onMounted(() => {
  calculateMortgage()
  calculateBMI()
  calculateTax()
  calculateExchange()
})
</script>