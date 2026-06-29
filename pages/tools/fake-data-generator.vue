<template>
  <div class="tool-page">
    <h2>📊 随机数据表格生成器</h2>
    <p class="tool-desc">生成中文姓名、手机号、邮箱、地址等模拟数据，支持导出 CSV 和 JSON</p>

    <!-- 字段配置 -->
    <div class="field-section">
      <div class="section-header">
        <h4>字段配置</h4>
        <button class="btn-add" @click="addField">＋ 添加字段</button>
      </div>
      <div class="field-list">
        <div v-for="(f, i) in fields" :key="i" class="field-item">
          <select v-model="f.type" class="field-select">
            <option v-for="t in fieldTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <input v-model="f.label" class="field-label-input" placeholder="列名" />
          <button class="btn-remove" @click="fields.splice(i, 1)" :disabled="fields.length <= 1">✕</button>
        </div>
      </div>
    </div>

    <!-- 生成参数 -->
    <div class="gen-row">
      <label>生成行数</label>
      <div class="gen-controls">
        <input type="range" v-model.number="rowCount" min="1" max="100" />
        <span class="gen-val">{{ rowCount }}</span>
      </div>
      <button class="btn-primary" @click="generate">🎲 生成数据</button>
    </div>

    <!-- 数据表格 -->
    <div v-if="tableData.length" class="table-section">
      <div class="table-header">
        <span>生成结果（{{ tableData.length }} 行 × {{ fields.length }} 列）</span>
        <div class="table-actions">
          <button class="btn-export" @click="exportCsv">📥 CSV</button>
          <button class="btn-export" @click="exportJson">📥 JSON</button>
          <button class="btn-tiny" @click="tableData = []">清空</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-row">#</th>
              <th v-for="(f, i) in fields" :key="i">{{ f.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in tableData" :key="ri">
              <td class="td-row">{{ ri + 1 }}</td>
              <td v-for="(f, fi) in fields" :key="fi">{{ row[fi] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '随机数据表格生成器 - 野火小站' })

const fieldTypes = [
  { value: 'name', label: '中文姓名' },
  { value: 'phone', label: '手机号' },
  { value: 'email', label: '邮箱' },
  { value: 'address', label: '地址' },
  { value: 'company', label: '公司名' },
  { value: 'date', label: '日期' },
  { value: 'amount', label: '金额' },
  { value: 'ip', label: 'IP地址' },
  { value: 'url', label: 'URL' },
  { value: 'idcard', label: '身份证号' },
  { value: 'profession', label: '职业' },
]

const fields = ref([
  { type: 'name', label: '姓名' },
  { type: 'phone', label: '手机号' },
  { type: 'email', label: '邮箱' },
  { type: 'address', label: '地址' },
])
const rowCount = ref(10)
const tableData = ref([])

// 随机工具
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[rand(0, arr.length - 1)] }

// 数据生成素材
const surnames = ['赵','钱','孙','李','周','吴','郑','王','冯','陈','褚','卫','蒋','沈','韩','杨','朱','秦','尤','许','何','吕','施','张','孔','曹','严','华','金','魏','陶','姜','戚','谢','邹','喻','柏','水','窦','章','云','苏','潘','葛','奚','范','彭','郎','鲁','韦','昌','马','苗','凤','花','方','俞','任','袁','柳','鲍','史','唐','费','廉','岑','薛','雷','贺','倪','汤','滕','殷','罗','毕','郝','邬','安','常','乐','于','时','傅','皮','卞','齐','康','伍','余','元','卜','顾','孟','平','黄','和','穆','萧','尹','姚','邵','湛','汪','祁','毛','禹','狄','米','贝','明','臧','计','伏','成','戴','谈','宋','茅','庞','熊','纪','舒','屈','项','祝','董','梁','杜','阮','蓝','闵','席','季','麻','强','贾','路','娄','危','江','童','颜','郭','梅','盛','林','刁','钟','徐','邱','骆','高','夏','蔡','田','樊','胡','凌','霍','虞','万','支','柯','昝','管','卢','莫','经','房','裘','缪','干','解','应','宗','丁','宣','贲','邓','郁','单','杭','洪','包','诸','左','石','崔','吉','钮','龚','程','嵇','邢','滑','裴','陆','荣','翁','荀','羊','於','惠','甄','曲','家','封','芮','羿','储','靳','汲','邴','糜','松','井','段','富','巫','乌','焦','巴','弓','牧','隗','山','谷','车','侯','宓','蓬','全','郗','班','仰','秋','仲','伊','宫','宁','仇','栾','暴','甘','钭','厉','戎','祖','武','符','刘','景','詹','束','龙','叶','幸','司','韶','郜','黎','蓟','溥','印','宿','白','怀','蒲','邰','从','鄂','索','咸','籍','赖','卓','蔺','屠','蒙','池','乔','阴','郁','胥','能','苍','双','闻','莘','党','翟','谭','贡','劳','逄','姬','申','扶','堵','冉','宰','郦','雍','璩','桑','桂','濮','牛','寿','通','边','扈','燕','冀','浦','尚','农','温','别','庄','晏','柴','瞿','阎','充','慕','连','茹','习','宦','艾','鱼','容','向','古','易','慎','戈','廖','庚','终','暨','居','衡','步','都','耿','满','弘','匡','国','文','寇','广','禄','阙','东','殴','殳','沃','利','蔚','越','夔','隆','师','巩','厍','聂','晁','勾','敖','融','冷','訾','辛','阚','那','简','饶','空','曾','毋','沙','乜','养','鞠','须','丰','巢','关','蒯','相','查','后','荆','红','游','竺','权','逯','盖','益','桓','公']
const maleNames = ['伟','强','磊','军','洋','勇','艳','杰','娟','涛','明','超','秀英','华','亮','刚','桂英','文','云','建华','建国','建军','玉兰','桂兰','秀兰','鑫','志强','志明','志刚','建','国','海','鑫','鹏','旭','辉','浩','宇','博','峰','子轩']
const femaleNames = ['芳','娜','敏','静','丽','秀英','燕','玲','婷','慧','雪','琳','梅','莉','洁','莹','倩','雅','馨','蕾','薇','佳','欣','怡','梦','颖','思','菲','瑶','妍']
const cities = ['北京市','上海市','广州市','深圳市','杭州市','成都市','武汉市','南京市','重庆市','西安市','长沙市','苏州市','天津市','青岛市','郑州市','大连市','宁波市','厦门市','福州市','昆明市','贵阳市','合肥市','济南市','沈阳市','哈尔滨市','长春市','石家庄市','太原市','兰州市','海口市']
const districts = ['朝阳区','海淀区','西城区','东城区','浦东新区','静安区','天河区','越秀区','南山区','福田区','西湖区','余杭区','武侯区','锦江区','洪山区','武昌区','鼓楼区','江宁区','渝中区','南岸区','雁塔区','碑林区','芙蓉区','天心区','姑苏区','工业园区','滨海新区','和平区','市南区','市北区','金水区','中原区','中山区','西岗区','思明区','湖里区','鼓楼区','台江区']
const streets = ['人民路','解放路','建设路','中山路','文化路','学府路','科技路','朝阳路','青年路','花园路','长江路','黄河路','新华路','友谊路','光明路','幸福路','平安路','振兴路','发展路','创新路']
const companyPrefix = ['华信','中科','盛世','恒达','嘉禾','天宇','金桥','宏图','鼎盛','万通','明德','鹏程','锦绣','长城','祥瑞','鸿运','启明','永泰','安达','博远']
const companySuffix = ['科技','信息技术','网络科技','数据服务','智能科技','云计算','软件开发','电子商务','新材料','文化传媒','教育科技','生物科技','金融科技','环保科技','咨询服务']
const professions = ['软件工程师','产品经理','设计师','教师','医生','律师','会计','销售经理','市场总监','项目经理','数据分析师','运营经理','人力资源','财务主管','行政专员','采购经理','物流主管','编辑','记者','摄影师','建筑师','工程师','护士','药剂师','心理咨询师','司机','厨师','保安','快递员','服务员']

function genName() {
  const s = pick(surnames)
  const n = pick(Math.random() > 0.5 ? maleNames : femaleNames)
  return s + n
}

function genPhone() {
  const prefixes = ['130','131','132','133','134','135','136','137','138','139','150','151','152','153','155','156','157','158','159','170','171','172','173','175','176','177','178','180','181','182','183','184','185','186','187','188','189','191','198','199']
  return pick(prefixes) + Array.from({ length: 8 }, () => rand(0, 9)).join('')
}

function genEmail() {
  const domains = ['qq.com','163.com','126.com','gmail.com','outlook.com','sina.com','foxmail.com','hotmail.com']
  const users = ['zhangsan','lisi','wangwu','zhaoliu','chenqi','liuwei','test','admin','user','info']
  return pick(users) + rand(10, 999) + '@' + pick(domains)
}

function genAddress() {
  return pick(cities) + pick(districts) + pick(streets) + rand(1, 200) + '号'
}

function genCompany() {
  return pick(companyPrefix) + pick(companySuffix) + '有限公司'
}

function genDate() {
  const y = rand(2020, 2026)
  const m = String(rand(1, 12)).padStart(2, '0')
  const d = String(rand(1, 28)).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function genAmount() {
  return (Math.random() * 10000).toFixed(2)
}

function genIp() {
  return [rand(1, 254), rand(0, 255), rand(0, 255), rand(1, 254)].join('.')
}

function genUrl() {
  const domains = ['example.com','test.cn','demo.org','sample.net','mock.io','fake.dev']
  const paths = ['blog','api','user','product','order','home','about','docs','news','help']
  return 'https://www.' + pick(domains) + '/' + pick(paths)
}

function genIdcard() {
  // 简化模拟，非真实身份证号
  const area = String(rand(110000, 659004))
  const y = rand(1960, 2005)
  const m = String(rand(1, 12)).padStart(2, '0')
  const d = String(rand(1, 28)).padStart(2, '0')
  const seq = String(rand(0, 99)).padStart(2, '0') + String(rand(0, 9))
  const base = area + y + m + d + seq
  const weights = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2]
  const checks = '10X98765432'
  let sum = 0
  for (let i = 0; i < 17; i++) sum += parseInt(base[i]) * weights[i]
  return base + checks[sum % 11]
}

// 生成一行数据
function genRow() {
  return fields.value.map(f => {
    switch (f.type) {
      case 'name': return genName()
      case 'phone': return genPhone()
      case 'email': return genEmail()
      case 'address': return genAddress()
      case 'company': return genCompany()
      case 'date': return genDate()
      case 'amount': return '¥' + genAmount()
      case 'ip': return genIp()
      case 'url': return genUrl()
      case 'idcard': return genIdcard()
      case 'profession': return pick(professions)
      default: return '-'
    }
  })
}

function addField() {
  const usedTypes = fields.value.map(f => f.type)
  const next = fieldTypes.find(t => !usedTypes.includes(t.value)) || fieldTypes[0]
  fields.value.push({ type: next.value, label: next.label })
}

function generate() {
  tableData.value = Array.from({ length: rowCount.value }, () => genRow())
}

// 导出CSV
function exportCsv() {
  const header = fields.value.map(f => f.label).join(',')
  const rows = tableData.value.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  const csv = '\uFEFF' + header + '\n' + rows.join('\n')
  downloadFile(csv, 'data.csv', 'text/csv;charset=utf-8')
}

// 导出JSON
function exportJson() {
  const data = tableData.value.map(row => {
    const obj = {}
    fields.value.forEach((f, i) => { obj[f.label] = row[i] })
    return obj
  })
  downloadFile(JSON.stringify(data, null, 2), 'data.json', 'application/json')
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.tool-page { padding-top: 0.5rem; }
h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
.tool-desc { color: #666; margin-bottom: 1.5rem; font-size: 0.95rem; }

.field-section { margin-bottom: 1.5rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
.section-header h4 { font-size: 1rem; }
.btn-add {
  padding: 0.4rem 0.8rem; background: linear-gradient(135deg, #22c55e, #10b981);
  color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
}
.field-list { display: flex; flex-direction: column; gap: 0.5rem; }
.field-item { display: flex; gap: 0.5rem; align-items: center; }
.field-select {
  padding: 0.5rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.9rem; outline: none; background: white; cursor: pointer; min-width: 120px;
}
.field-select:focus { border-color: #22c55e; }
.field-label-input {
  flex: 1; padding: 0.5rem 0.8rem; border: 2px solid #e0e0e0; border-radius: 8px;
  font-size: 0.9rem; outline: none;
}
.field-label-input:focus { border-color: #22c55e; }
.btn-remove {
  width: 32px; height: 32px; border: 2px solid #fecaca; border-radius: 6px;
  background: #fef2f2; color: #ef4444; cursor: pointer; font-size: 0.9rem;
  transition: all 0.2s; flex-shrink: 0;
}
.btn-remove:hover { background: #fee2e2; }
.btn-remove:disabled { opacity: 0.3; cursor: not-allowed; }

.gen-row {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  background: #f8f9fa; border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;
}
.gen-row label { font-weight: 600; font-size: 0.9rem; }
.gen-controls { display: flex; align-items: center; gap: 0.6rem; }
.gen-controls input[type="range"] { width: 150px; accent-color: #22c55e; }
.gen-val { min-width: 2rem; text-align: center; font-weight: 700; color: #22c55e; }
.btn-primary {
  padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #22c55e, #10b981);
  color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600;
  margin-left: auto;
}

.table-section { margin-bottom: 1.5rem; }
.table-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;
}
.table-header span { font-weight: 600; font-size: 0.9rem; }
.table-actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-export {
  padding: 0.4rem 0.8rem; background: white; border: 2px solid #22c55e; color: #22c55e;
  border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
}
.btn-export:hover { background: #f0fdf4; }
.btn-tiny {
  background: none; border: none; color: #999; cursor: pointer; font-size: 0.85rem;
}
.btn-tiny:hover { color: #ef4444; }

.table-wrap {
  overflow-x: auto; border-radius: 10px; border: 1px solid #e9ecef;
}
.data-table {
  width: 100%; border-collapse: collapse; font-size: 0.85rem;
}
.data-table th {
  background: #f8f9fa; padding: 0.7rem 0.8rem; text-align: left;
  font-weight: 600; border-bottom: 2px solid #e9ecef; white-space: nowrap;
  position: sticky; top: 0;
}
.th-row { width: 40px; text-align: center; }
.data-table td {
  padding: 0.6rem 0.8rem; border-bottom: 1px solid #f0f0f0;
  white-space: nowrap; font-family: monospace;
}
.td-row {
  text-align: center; color: #999; font-family: inherit;
}
.data-table tbody tr:hover { background: #f0fdf4; }

.back-link { display: inline-block; margin-top: 2rem; color: #22c55e; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .field-item { flex-wrap: wrap; }
  .field-select { min-width: 100%; }
  .gen-row { flex-direction: column; align-items: stretch; }
  .gen-row .btn-primary { margin-left: 0; }
  .gen-controls input[type="range"] { width: 100%; }
}
</style>
