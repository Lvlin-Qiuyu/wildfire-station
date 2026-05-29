<template>
  <div class="home">
    <section class="hero">
      <h1>🔥 野火小站</h1>
      <p>简洁实用的在线工具集合</p>
    </section>

    <section class="tools-grid">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.path"
        :to="tool.path"
        class="tool-card"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <h3 class="tool-name">{{ tool.name }}</h3>
        <p class="tool-desc">{{ tool.desc }}</p>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup>
useHead({ title: '野火小站 - 在线工具箱' })

const tools = [
  {
    icon: '🔤',
    name: 'Base64 编解码',
    desc: '文本与 Base64 互相转换，支持实时编解码',
    path: '/tools/base64',
  },
  {
    icon: '📱',
    name: '二维码工具',
    desc: '生成二维码图片，上传图片解码识别内容',
    path: '/tools/qrcode',
  },
  {
    icon: '📋',
    name: '文本比对',
    desc: '对比两段文本差异，类似代码 Diff 效果',
    path: '/tools/text-diff',
  },
  {
    icon: '🔢',
    name: '进制转换器',
    desc: '支持二/八/十/十六进制和 Base64 互转，自动识别前缀',
    path: '/tools/radix',
  },
  {
    icon: '🎨',
    name: 'CSS 渐变生成器',
    desc: '可视化创建线性/径向/锥形渐变，实时预览，一键复制代码',
    path: '/tools/css-gradient',
  },
  {
    icon: '⏰',
    name: 'Cron 表达式可视化',
    desc: '解析 Cron 表达式，人类可读描述，预览接下来执行时间',
    path: '/tools/cron',
  },
  {
    icon: '🔗',
    name: '外部收藏',
    desc: '好用的工具、资讯站点、Skill 等资源归档',
    path: '/tools/bookmarks',
  },
]
</script>

<style scoped>
.home {
  padding-top: 1rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  color: #666;
  font-size: 1.1rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  border-color: #ff8c42;
}

.tool-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.tool-name {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.tool-desc {
  color: #888;
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .hero h1 {
    font-size: 1.8rem;
  }
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
