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
