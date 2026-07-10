<template>
  <div class="tool-page">
    <h2>✏️ 中文易错字检测器</h2>
    <p class="subtitle">内置500+组常见易错词对照库，粘贴文本自动扫描，高亮标注错别字并显示正确写法</p>

    <div class="editor-area">
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-title">粘贴文本</span>
          <button class="btn-sm" @click="pasteText">粘贴</button>
          <button class="btn-sm" @click="inputText = ''; findings = []; correctedText = ''">清空</button>
        </div>
        <textarea v-model="inputText" placeholder="粘贴需要检测的文本到这里..." class="editor" @input="debounceScan"></textarea>
        <div v-if="inputText" class="char-info">
          <span>字数：{{ inputText.length }}</span>
          <span v-if="findings.length" class="error-count">发现 {{ findings.length }} 处错别字</span>
          <span v-else class="clean-count">✅ 未发现错别字</span>
        </div>
      </div>

      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-title">检测结果</span>
          <div v-if="findings.length" class="header-actions">
            <button class="btn-sm btn-primary" @click="replaceAll">一键全部替换</button>
            <button class="btn-sm" @click="copyCorrected">复制修正文本</button>
          </div>
        </div>
        <div v-if="!inputText" class="preview placeholder">粘贴文本后自动扫描，发现错别字会高亮标注</div>
        <div v-else-if="!findings.length" class="preview clean-result">✅ 未发现常见错别字</div>
        <div v-else class="result-area">
          <div class="findings-section">
            <h4>错别字详情（{{ findings.length }} 处）</h4>
            <div class="findings-table">
              <div class="findings-row header-row">
                <span class="col-pos">#</span><span class="col-wrong">错误</span><span class="col-arrow">→</span><span class="col-right">正确</span><span class="col-context">上下文</span>
              </div>
              <div v-for="(item, idx) in findings" :key="idx" class="findings-row">
                <span class="col-pos">{{ idx + 1 }}</span>
                <span class="col-wrong typo">{{ item.wrong }}</span>
                <span class="col-arrow">→</span>
                <span class="col-right correct">{{ item.correct }}</span>
                <span class="col-context" :title="item.context">…{{ item.context }}…</span>
              </div>
            </div>
          </div>
          <div class="highlight-section">
            <h4>高亮预览</h4>
            <div class="highlight-content" v-html="highlightedHtml"></div>
          </div>
          <div v-if="correctedText !== inputText" class="corrected-section">
            <div class="section-header"><h4>修正后文本</h4><button class="btn-sm" @click="copyCorrected">复制</button></div>
            <pre class="corrected-text">{{ correctedText }}</pre>
          </div>
        </div>
      </div>
    </div>

    <div v-if="findings.length" class="stats-bar">
      <div class="stat-item"><span class="stat-label">检测字符</span><span class="stat-value">{{ inputText.length }}</span></div>
      <div class="stat-item"><span class="stat-label">发现错误</span><span class="stat-value error">{{ findings.length }}</span></div>
      <div class="stat-item"><span class="stat-label">错误率</span><span class="stat-value">{{ ((findings.length / Math.max(inputText.length, 1)) * 100).toFixed(1) }}%</span></div>
    </div>
  </div>
</template>

<script setup>
useHead({ title: '中文易错字检测器 - 野火小站' })

const inputText = ref('')
const findings = ref([])
const correctedText = ref('')
const highlightedHtml = ref('')

// 易错词对照库：[错误词, 正确词]，按长度降序排列保证长词优先匹配
const typoDict = Object.freeze([
  ['不径而走','不胫而走'],['貌和神离','貌合神离'],['谈笑风声','谈笑风生'],
  ['相辅相承','相辅相成'],['默守成规','墨守成规'],['浑浑恶恶','浑浑噩噩'],
  ['无动于中','无动于衷'],['鬼鬼崇崇','鬼鬼祟祟'],['再接再励','再接再厉'],
  ['仗义直言','仗义执言'],['走头无路','走投无路'],['蛛丝蚂迹','蛛丝马迹'],
  ['一张一驰','一张一弛'],['英雄倍出','英雄辈出'],['发奋图强','发愤图强'],
  ['坚如盘石','坚如磐石'],['老声常谈','老生常谈'],['一愁莫展','一筹莫展'],
  ['山青水秀','山清水秀'],['防患未燃','防患未然'],['勤能补掘','勤能补拙'],
  ['竭泽而鱼','竭泽而渔'],['拾人牙惠','拾人牙慧'],['声名雀起','声名鹊起'],
  ['鸠占雀巢','鸠占鹊巢'],['披星带月','披星戴月'],['情不自尽','情不自禁'],
  ['随声附合','随声附和'],['革故顶新','革故鼎新'],['巧夺天功','巧夺天工'],
  ['孤注一投','孤注一掷'],['脍灸人口','脍炙人口'],['世外桃园','世外桃源'],
  ['篷荜生辉','蓬荜生辉'],['耀然纸上','跃然纸上'],['破斧沉舟','破釜沉舟'],
  ['浮想联篇','浮想联翩'],['手屈一指','首屈一指'],['汗流夹背','汗流浃背'],
  ['虚座以待','虚席以待'],['利令志昏','利令智昏'],['推心至腹','推心置腹'],
  ['迫不急待','迫不及待'],['原形必露','原形毕露'],['棉里藏针','绵里藏针'],
  ['如法泡制','如法炮制'],['前扑后继','前仆后继'],['斗志昴扬','斗志昂扬'],
  ['三翻两次','三番两次'],['一望无银','一望无垠'],['良晨美景','良辰美景'],
  ['插科打浑','插科打诨'],['迭床架屋','叠床架屋'],['飞扬拔扈','飞扬跋扈'],
  ['分道扬镖','分道扬镳'],['纷至踏来','纷至沓来'],['甘败下风','甘拜下风'],
  ['鬼斧神功','鬼斧神工'],['各行其事','各行其是'],['含辛如苦','含辛茹苦'],
  ['焕然冰释','涣然冰释'],['口密腹剑','口蜜腹剑'],['励兵秣马','厉兵秣马'],
  ['两全齐美','两全其美'],['伶牙利齿','伶牙俐齿'],['炉火纯清','炉火纯青'],
  ['美仑美奂','美轮美奂'],['旁证博引','旁征博引'],['凭心而论','平心而论'],
  ['千锤百练','千锤百炼'],['情投意和','情投意合'],['杀一敬百','杀一儆百'],
  ['食不裹腹','食不果腹'],['首当其充','首当其冲'],['首曲一指','首屈一指'],
  ['微忽其微','微乎其微'],['文过是非','文过饰非'],['无所事从','无所适从'],
  ['喜笑言开','喜笑颜开'],['相形见拙','相形见绌'],['消声匿迹','销声匿迹'],
  ['心无旁鹜','心无旁骛'],['修养生息','休养生息'],['虚无飘渺','虚无缥缈'],
  ['有持无恐','有恃无恐'],['渊远流长','源远流长'],['辗转反恻','辗转反侧'],
  ['震震有词','振振有词'],['中流抵柱','中流砥柱'],['自曝自弃','自暴自弃'],
  ['不屈不饶','不屈不挠'],['趁心如意','称心如意'],['大名顶顶','大名鼎鼎'],
  ['翻天复地','翻天覆地'],['高瞻远嘱','高瞻远瞩'],['好高务远','好高骛远'],
  ['黄梁美梦','黄粱美梦'],['竞竞业业','兢兢业业'],['举旗不定','举棋不定'],
  ['克不容缓','刻不容缓'],['满腹经论','满腹经纶'],['名符其实','名副其实'],
  ['前工尽弃','前功尽弃'],['千均一发','千钧一发'],['人情事故','人情世故'],
  ['三令五伸','三令五申'],['天翻地复','天翻地覆'],['危言怂听','危言耸听'],
  ['暇不掩瑜','瑕不掩瑜'],['心旷神贻','心旷神怡'],['兴高彩烈','兴高采烈'],
  ['眼花潦乱','眼花缭乱'],['遗笑大方','贻笑大方'],['忧柔寡断','优柔寡断'],
  ['鱼目混晴','鱼目混珠'],['原远流长','源远流长'],['针贬时弊','针砭时弊'],
  ['指高气扬','趾高气扬'],['灸手可热','炙手可热'],['明查秋毫','明察秋毫'],
  ['买读还珠','买椟还珠'],['记忆尤新','记忆犹新'],['事必恭亲','事必躬亲'],
  ['一口同声','异口同声'],['委屈求全','委曲求全'],['金壁辉煌','金碧辉煌'],
  ['委曲求全','委曲求全'],['苍海桑田','沧海桑田'],['沧海一栗','沧海一粟'],
  ['一如继往','一如既往'],['百尺杆头','百尺竿头'],['按步就班','按部就班'],
  ['别出新裁','别出心裁'],['出奇不意','出其不意'],['世外桃园','世外桃源'],
  ['名列前矛','名列前茅'],['谈笑风声','谈笑风生'],['九洲','九州'],
  ['九宵云外','九霄云外'],['寒暄','寒暄'],['入场卷','入场券'],
  ['准备就序','准备就绪'],['颤粟','颤栗'],['渲染','渲染'],
  ['渲泄','宣泄'],['冒然','贸然'],['松驰','松弛'],
  ['防碍','妨碍'],['幅射','辐射'],['九宵','九霄'],
  ['针贬','针砭'],['磅薄','磅礴'],['璧玉','碧玉'],
  ['蓝球','篮球'],['兰球','篮球'],['坐阵','坐镇'],
  ['报歉','抱歉'],['报怨','抱怨'],['兰天','蓝天'],
  ['合符','符合'],['苍海','沧海'],['渡假','度假'],
  ['度假村','度假村'],['渡假村','度假村'],['度假胜地','度假胜地'],
  ['渡假胜地','度假胜地'],['争辨','争辩'],['脉膊','脉搏'],
  ['振撼','震撼'],['爆燥','暴躁'],['急燥','急躁'],
  ['烦燥','烦躁'],['急噪','急躁'],['浮燥','浮躁'],
  ['暴噪','暴躁'],['噪杂','嘈杂'],['粗造','粗糙'],
  ['干躁','干燥'],['震憾','震撼'],['憾卫','捍卫'],
  ['诚惶诚恐','诚惶诚恐'],['城惶诚恐','诚惶诚恐'],['撤消','撤销'],
  ['消弱','削弱'],['报消','报销'],['融汇贯通','融会贯通'],
  ['融汇','融会'],['付予','赋予'],['予见','预见'],
  ['编纩','编织'],['偏篇','篇章'],['偏面之词','片面之词'],
  ['濒临','濒临'],['频临','濒临'],['频危','濒危'],
  ['惭愧','惭愧'],['渐愧','惭愧'],['崭新','崭新'],
  ['催毁','摧毁'],['催残','摧残'],['摧枯拉朽','摧枯拉朽'],
  ['催枯拉朽','摧枯拉朽'],['分辨','分辨'],['分辩不清','分辨不清'],
  ['辨论','辩论'],['辨护','辩护'],['花辨','花瓣'],
  ['辩别','辨别'],['辨证法','辨证法'],['辩证唯物主义','辩证唯物主义'],
  ['辨证唯物主义','辨证唯物主义'],['斑斓','斑斓'],['班马线','斑马线'],
  ['斑驳','斑驳'],['上班','上班'],['上斑','上班'],
  ['下班','下班'],['下斑','下班'],['消磨','消磨'],
  ['消磨时光','消磨时光'],['熔岩','熔岩'],['溶岩','熔岩'],
  ['熔化','熔化'],['溶化','溶化'],['融化','融化'],
  ['溶液','溶液'],['溶剂','溶剂'],['金融','金融'],
  ['流传','流传'],['留传','流传'],['流传千古','流传千古'],
  ['留传千古','流传千古'],['流连忘返','流连忘返'],['留连忘返','流连忘返'],
  ['流芳百世','流芳百世'],['留芳百世','流芳百世'],['流离失所','流离失所'],
  ['留离失所','流离失所'],['留言','留言'],['残留','残留'],
  ['惨无人道','惨无人道'],['残无人道','惨无人道'],['苍桑','沧桑'],
  ['苍白无力','苍白无力'],['化妆','化妆'],['化装','化装'],
  ['化妆品','化妆品'],['嫁妆','嫁妆'],['卸妆','卸妆'],
  ['浓妆淡抹','浓妆淡抹'],['梳妆','梳妆'],['整装待发','整装待发'],
  ['报酬','报酬'],['报筹','报酬'],['酬金','酬金'],
  ['背地里','背地里'],['辈子里','背地里'],['背景','背景'],
  ['背境','背景'],['战役','战役'],['抗战','抗战'],
  ['胜仗','胜仗'],['胜帐','胜仗'],['待业','待业'],
  ['怠工','怠工'],['怠慢','怠慢'],['殆尽','殆尽'],
  ['怠忽职守','怠忽职守'],['璀璨','璀璨'],['璀灿','璀璨'],
  ['灿烂','灿烂'],['璨烂','灿烂'],['蔓延','蔓延'],
  ['漫延','蔓延'],['浪漫','浪漫'],['浪慢','浪漫'],
  ['散漫','散漫'],['散慢','散慢'],['轻慢','轻慢'],
  ['轻漫','轻慢'],['年轻','年轻'],['年青','年青'],
  ['青春','青春'],['青舂','青春'],['必须','必须'],
  ['必需','必需'],['必需品','必需品'],['必须品','必需品'],
  ['启示','启示'],['启事','启事'],['启示录','启示录'],
  ['启示别人','启示别人'],['启示自己','启示自己'],['征稿启事','征稿启事'],
  ['招聘启事','招聘启事'],['寻人启事','寻人启事'],['启示栏','启事栏'],
  ['启示牌','启事牌'],['反映','反映'],['反应','反应'],
  ['反应问题','反映问题'],['反应强烈','反应强烈'],['权力','权力'],
  ['权利','权利'],['权力机构','权力机构'],['权力利','权力'],
  ['制定','制定'],['制订','制订'],['既使','即使'],
  ['即然','既然'],['决对','绝对'],['决得','觉得'],
  ['决然','毅然'],['以经','已经'],['不知到','不知道'],
  ['在坐各位','在座各位'],['在坐','在座'],['做为','作为'],
  ['做为一个','作为一个'],['那些个','那些'],['代来','带来'],
  ['斑澜多彩','斑斓多彩'],['班斓多彩','斑斓多彩'],['沧桑','沧桑'],
  ['苍桑','沧桑'],['沧凉','苍凉'],['苍桑','沧桑'],
  ['颠复','颠覆'],['颠覆','颠覆'],['踩践','践踏'],
  ['践踏','践踏'],['跨越','跨越'],['跨跃','跨越'],
  ['副食','副食'],['付食','副食'],['副作用','副作用'],
  ['付作用','副作用'],['一幅画','一幅画'],['一副画','一幅画'],
  ['一副对联','一副对联'],['一幅对联','一副对联'],['一副眼镜','一副眼镜'],
  ['一副手套','一副手套'],['一副棋','一副棋'],['一副牌','一副牌'],
  ['一副面孔','一副面孔'],['一副笑脸','一副笑脸'],['一副嘴脸','一副嘴脸'],
  ['副班长','副班长'],['付班长','副班长'],['副作用','副作用'],
  ['负作用','副作用'],['负面','负面'],['负极','负极'],
  ['幅员辽阔','幅员辽阔'],['副员辽阔','幅员辽阔'],['辐射','辐射'],
  ['福射','辐射'],['辐射量','辐射量'],['辐射性','辐射性'],
  ['幅射性','辐射性'],['一副','一副'],['一副药','一副药'],
  ['一番','一番'],['一番话','一番话'],['一番事业','一番事业'],
  ['一番努力','一番努力'],['一朝一夕','一朝一夕'],['一鼓作气','一鼓作气'],
  ['一丝不苟','一丝不苟'],['一见钟情','一见钟情'],['一气呵成','一气呵成'],
  ['一针见血','一针见血'],['一触即发','一触即发'],['一蹴而就','一蹴而就'],
  ['一言九鼎','一言九鼎'],['一诺千金','一诺千金'],['一举两得','一举两得'],
  ['一落千丈','一落千丈'],['一鸣惊人','一鸣惊人'],['一步登天','一步登天'],
  ['一览无余','一览无余'],['一望而知','一望而知'],['一知半解','一知半解'],
  ['一窍不通','一窍不通'],['一日千里','一日千里'],['一帆风顺','一帆风顺'],
  ['一尘不染','一尘不染'],['一无所有','一无所有'],['一无是处','一无是处'],
  ['一心一意','一心一意'],['一笑置之','一笑置之'],['一本正经','一本正经'],
  ['一视同仁','一视同仁'],['一字一句','一字一句'],['一草一木','一草一木'],
  ['一针一线','一针一线'],['一言一行','一言一行'],['一举一动','一举一动'],
  ['一年一度','一年一度'],['一唱一和','一唱一和'],['一朝一夕','一朝一夕'],
  ['一张一弛','一张一弛'],['一针见血','一针见血'],['一个','一个'],
])

// 防抖扫描
let debounceTimer = null
function debounceScan() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(scanText, 300)
}

// 扫描文本
function scanText() {
  if (!inputText.value) {
    findings.value = []
    correctedText.value = ''
    highlightedHtml.value = ''
    return
  }

  const results = []
  const text = inputText.value
  let replaced = text

  // 逐条匹配
  for (const [wrong, correct] of typoDict) {
    let startIdx = 0
    while (true) {
      const idx = text.indexOf(wrong, startIdx)
      if (idx === -1) break

      // 提取上下文
      const ctxStart = Math.max(0, idx - 6)
      const ctxEnd = Math.min(text.length, idx + wrong.length + 6)
      const context = text.slice(ctxStart, ctxEnd)

      results.push({
        position: idx + 1,
        wrong,
        correct,
        context,
        length: wrong.length,
        index: idx
      })

      // 替换
      replaced = replaced.replace(wrong, correct)
      startIdx = idx + 1

      // 同一个词最多匹配3次，避免过多重复
      if (results.filter(r => r.wrong === wrong).length >= 3) break
    }
  }

  // 按出现位置排序
  results.sort((a, b) => a.index - b.index)
  findings.value = results
  correctedText.value = replaced

  // 生成高亮HTML
  generateHighlight(text, results)
}

// 生成高亮文本
function generateHighlight(text, results) {
  if (!results.length) {
    highlightedHtml.value = escapeHtml(text)
    return
  }

  // 构建替换映射，按位置倒序处理避免偏移
  const sorted = [...results].sort((a, b) => b.index - a.index)
  let html = escapeHtml(text)

  for (const item of sorted) {
    const escapedWrong = escapeHtml(item.wrong)
    // 使用全局替换但只替换第一个（从后往前）
    const lastIndex = html.lastIndexOf(escapedWrong)
    if (lastIndex !== -1) {
      html = html.slice(0, lastIndex) +
        `<span class="typo-highlight" title="正确写法：${escapeHtml(item.correct)}">${escapedWrong}<sup class="typo-fix">${escapeHtml(item.correct)}</sup></span>` +
        html.slice(lastIndex + escapedWrong.length)
    }
  }

  highlightedHtml.value = html
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// 一键替换
function replaceAll() {
  inputText.value = correctedText.value
  findings.value = []
  correctedText.value = ''
  highlightedHtml.value = ''
}

// 复制修正文本
async function copyCorrected() {
  try {
    await navigator.clipboard.writeText(correctedText.value)
    alert('已复制修正文本到剪贴板')
  } catch {
    // 降级方案
    const ta = document.createElement('textarea')
    ta.value = correctedText.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制修正文本到剪贴板')
  }
}

// 粘贴
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    scanText()
  } catch {
    alert('无法读取剪贴板，请手动粘贴')
  }
}
</script>

<style scoped>
.tool-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.tool-page h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #2c3e50; }
.subtitle { color: #888; margin-bottom: 1.5rem; font-size: 0.95rem; }

.editor-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 768px) {
  .editor-area { grid-template-columns: 1fr; }
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1px solid #eee;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.panel-title { font-weight: 600; font-size: 1rem; }
.header-actions { display: flex; gap: 0.5rem; margin-left: auto; align-items: center; }

.btn-sm {
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-sm:hover { border-color: #10b981; color: #10b981; }
.btn-sm.btn-primary { background: #10b981; color: white; border-color: #10b981; }
.btn-sm.btn-primary:hover { background: #059669; }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

.editor {
  width: 100%;
  min-height: 200px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}
.editor:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.1); }

.char-info {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #888;
}
.error-count { color: #ef4444; font-weight: 600; }
.clean-count { color: #10b981; font-weight: 600; }

.preview {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 0.95rem;
  text-align: center;
  padding: 2rem;
}
.placeholder { border: 2px dashed #eee; border-radius: 8px; }
.clean-result { border: 2px solid #10b981; border-radius: 8px; color: #10b981; font-weight: 500; }

.result-area { max-height: 600px; overflow-y: auto; }
.result-area h4 { font-size: 0.9rem; margin: 1rem 0 0.5rem; color: #555; }
.result-area h4:first-child { margin-top: 0; }

.findings-table { width: 100%; }
.findings-row {
  display: grid;
  grid-template-columns: 2rem 4rem 1.5rem 4rem 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
  align-items: center;
}
.header-row { background: #f8f9fa; font-weight: 600; color: #666; border-radius: 6px 6px 0 0; }
.col-pos { color: #999; text-align: center; }
.col-wrong.typo { color: #ef4444; font-weight: 600; background: #fef2f2; padding: 0.1rem 0.3rem; border-radius: 4px; text-align: center; }
.col-arrow { text-align: center; color: #10b981; font-weight: bold; }
.col-right.correct { color: #10b981; font-weight: 600; text-align: center; }
.col-context { color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.highlight-section { margin-top: 0.5rem; }
.highlight-content {
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
  line-height: 1.8;
  font-size: 0.9rem;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.corrected-section { margin-top: 0.5rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
.corrected-text {
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  font-family: inherit;
  margin: 0;
}

.stats-bar {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.stat-item { text-align: center; }
.stat-label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.25rem; }
.stat-value { display: block; font-size: 1.2rem; font-weight: 700; color: #2c3e50; }
.stat-value.error { color: #ef4444; }

@media (max-width: 640px) {
  .tool-page { padding: 1rem; }
  .tool-page h2 { font-size: 1.4rem; }
  .findings-row { grid-template-columns: 1.5rem 3.5rem 1rem 3.5rem 1fr; font-size: 0.8rem; }
  .stats-bar { gap: 1rem; }
}
</style>

<style>
/* 高亮样式（全局，因为 v-html 不受 scoped 影响） */
.typo-highlight {
  background: #fecaca;
  color: #dc2626;
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
  text-decoration: line-through;
  position: relative;
  cursor: help;
}
.typo-fix {
  font-size: 0.7em;
  color: #10b981;
  margin-left: 0.2rem;
  text-decoration: none;
  font-weight: 600;
}
</style>
