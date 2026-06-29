<template>
  <div class="tool-page">
    <h2>🎨 SQL 格式化与美化</h2>
    <p class="subtitle">粘贴 SQL 语句自动格式化，支持关键字高亮、方言选择</p>

    <!-- 选项栏 -->
    <div class="options-bar">
      <div class="option-group">
        <label>方言</label>
        <select v-model="dialect" class="opt-select">
          <option value="sql">标准 SQL</option>
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="sqlite">SQLite</option>
        </select>
      </div>
      <div class="option-group">
        <label>缩进</label>
        <select v-model="indent" class="opt-select">
          <option value="2">2 空格</option>
          <option value="4">4 空格</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <div class="option-group">
        <label>关键字大小写</label>
        <select v-model="keywordCase" class="opt-select">
          <option value="upper">大写</option>
          <option value="lower">小写</option>
          <option value="preserve">原样</option>
        </select>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <div class="section-header">
        <label>输入 SQL</label>
        <div class="header-actions">
          <span class="btn-small" @click="loadExample">📋 示例</span>
          <span class="btn-small" @click="sqlInput = ''; formattedSql = ''">清空</span>
        </div>
      </div>
      <textarea
        v-model="sqlInput"
        placeholder="粘贴 SQL 语句..."
        rows="8"
        spellcheck="false"
        @input="formatSql"
      ></textarea>
    </div>

    <!-- 格式化结果 -->
    <div class="output-section" v-if="formattedSql">
      <div class="section-header">
        <label>格式化结果</label>
        <div class="header-actions">
          <span class="btn-small" @click="copyResult">{{ copyLabel }}</span>
        </div>
      </div>
      <div class="code-block">
        <pre v-html="highlightedSql"></pre>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>

    <div class="notice">
      <p>💡 使用 sql-formatter 库进行格式化，支持 MySQL / PostgreSQL / SQLite 方言。</p>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({
  title: 'SQL 格式化与美化 - 野火小站',
  script: [{ src: 'https://cdn.jsdelivr.net/npm/sql-formatter@15.5.2/dist/sql-formatter.min.js', defer: true }],
})

const sqlInput = ref('')
const formattedSql = ref('')
const errorMsg = ref('')
const dialect = ref('mysql')
const indent = ref('2')
const keywordCase = ref('upper')
const copyLabel = ref('复制')

// ==================== SQL 关键字高亮 ====================
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON',
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'DROP',
  'ALTER', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'TRUNCATE',
  'UNION', 'ALL', 'EXCEPT', 'INTERSECT', 'AS', 'DISTINCT', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'BETWEEN', 'LIKE', 'EXISTS',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT',
  'CHECK', 'UNIQUE', 'IF', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  'WITH', 'RECURSIVE', 'OVER', 'PARTITION', 'ROW', 'ROWS', 'RANGE',
  'FETCH', 'NEXT', 'ONLY', 'TOP', 'OUTPUT', 'MERGE', 'MATCHED',
  'GRANT', 'REVOKE', 'REPLACE', 'RENAME', 'USE', 'SHOW', 'DESCRIBE',
  'EXPLAIN', 'ANALYZE', 'COALESCE', 'CAST', 'CONVERT', 'NULLIF',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'TRUE', 'FALSE', 'BOOLEAN',
  'INTEGER', 'INT', 'BIGINT', 'SMALLINT', 'FLOAT', 'DOUBLE', 'DECIMAL',
  'NUMERIC', 'VARCHAR', 'CHAR', 'TEXT', 'DATE', 'TIME', 'TIMESTAMP',
  'SERIAL', 'AUTO_INCREMENT', 'NOT', 'UNSIGNED', 'ZEROFILL', 'ENGINE',
  'CHARSET', 'COLLATE', 'IFNULL', 'ISNULL', 'CONCAT', 'SUBSTRING',
]

// 转义 HTML
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 高亮 SQL
const highlightedSql = computed(() => {
  if (!formattedSql.value) return ''
  let escaped = escapeHtml(formattedSql.value)
  // 高亮字符串（单引号和双引号）
  escaped = escaped.replace(/(&#39;[^&#]*?&#39;|&quot;[^&]*?&quot;)/g, '<span class="hl-string">$1</span>')
  // 高亮数字
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
  // 高亮注释
  escaped = escaped.replace(/(--.*$)/gm, '<span class="hl-comment">$1</span>')
  // 高亮关键字
  const kwPattern = new RegExp(`\\b(${SQL_KEYWORDS.join('|')})\\b`, 'gi')
  escaped = escaped.replace(kwPattern, '<span class="hl-keyword">$1</span>')
  return escaped
})

// ==================== 格式化 SQL ====================
function formatSql() {
  errorMsg.value = ''
  formattedSql.value = ''
  if (!sqlInput.value.trim()) return

  try {
    // 使用 sql-formatter CDN 库
    if (typeof window !== 'undefined' && window.sqlFormatter) {
      const indentStr = indent.value === 'tab' ? '\t' : ' '.repeat(Number(indent.value))
      formattedSql.value = window.sqlFormatter.format(sqlInput.value, {
        language: dialect.value === 'sql' ? 'sql' : dialect.value,
        indent: indentStr,
        keywordCase: keywordCase.value,
        linesBetweenQueries: 2,
      })
    } else {
      // 回退：简单格式化
      formattedSql.value = simpleFormat(sqlInput.value)
    }
  } catch (e) {
    errorMsg.value = 'SQL 解析失败：' + (e.message || '请检查语法')
  }
}

// 简单 SQL 格式化（回退方案）
function simpleFormat(sql) {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE', 'UNION', 'UNION ALL']
  let formatted = sql
  // 在主要关键字前换行
  keywords.forEach(kw => {
    const re = new RegExp(`\\b${kw}\\b`, 'gi')
    formatted = formatted.replace(re, `\n${kw.toUpperCase()}`)
  })
  // 清理多余空行
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  return formatted
}

// ==================== 示例 SQL ====================
const examples = [
  `SELECT u.id, u.name, u.email, COUNT(o.id) AS order_count, SUM(o.amount) AS total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01' AND u.is_active = 1
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY total_amount DESC
LIMIT 20;`,
  `CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  category_id INT,
  stock INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id),
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  `WITH recursive_comments AS (
  SELECT id, post_id, author, content, parent_id, 0 AS depth
  FROM comments WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.post_id, c.author, c.content, c.parent_id, rc.depth + 1
  FROM comments c JOIN recursive_comments rc ON c.parent_id = rc.id
)
SELECT * FROM recursive_comments WHERE depth <= 3 ORDER BY depth, id;`,
]

let exampleIdx = 0
function loadExample() {
  sqlInput.value = examples[exampleIdx % examples.length]
  exampleIdx++
  formatSql()
}

function copyResult() {
  navigator.clipboard.writeText(formattedSql.value).then(() => {
    copyLabel.value = '已复制 ✓'
    setTimeout(() => { copyLabel.value = '复制' }, 1500)
  })
}
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

.options-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.option-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #555;
}
.opt-select {
  padding: 0.4rem 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}
.opt-select:focus {
  outline: none;
  border-color: #10b981;
}

.input-section, .output-section {
  margin-bottom: 1.2rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}
.section-header label {
  font-weight: 600;
  font-size: 0.95rem;
}
.header-actions {
  display: flex;
  gap: 0.6rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
  resize: vertical;
  background: white;
  line-height: 1.5;
  box-sizing: border-box;
}
textarea:focus {
  outline: none;
  border-color: #10b981;
}

.code-block {
  background: #1e1e2e;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  overflow-x: auto;
}
.code-block pre {
  margin: 0;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.88rem;
  line-height: 1.7;
  color: #e0e0e0;
  white-space: pre;
}

.btn-small {
  padding: 0.25rem 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 0.82rem;
  cursor: pointer;
  background: white;
  color: #555;
  transition: all 0.15s;
}
.btn-small:hover {
  border-color: #10b981;
  color: #22c55e;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.notice {
  background: #f8fff8;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
}
.notice p {
  font-size: 0.85rem;
  color: #666;
}

/* 高亮样式 */
:deep(.hl-keyword) { color: #c084fc; font-weight: 600; }
:deep(.hl-string) { color: #a5d6a7; }
:deep(.hl-number) { color: #fbbf24; }
:deep(.hl-comment) { color: #6b7280; font-style: italic; }

.back-link {
  display: inline-block;
  margin-top: 2rem;
  color: #22c55e;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .options-bar {
    flex-direction: column;
  }
}
</style>
