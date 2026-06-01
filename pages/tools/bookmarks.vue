<template>
  <div class="tool-page">
    <h2>🔗 外部收藏</h2>
    <p class="tool-subtitle">好用的工具、资讯站点、Skill 等资源归档</p>

    <div class="categories">
      <div v-for="cat in categories" :key="cat.name" class="category">
        <h3 class="cat-title">
          <span class="cat-icon">{{ cat.icon }}</span>
          {{ cat.name }}
        </h3>
        <div class="links-grid">
          <a
            v-for="link in cat.links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="link-card"
          >
            <div class="link-header">
              <span class="link-emoji">{{ link.emoji || cat.icon }}</span>
              <span class="link-name">{{ link.name }}</span>
              <span class="link-arrow">↗</span>
            </div>
            <p class="link-desc">{{ link.desc }}</p>
          </a>
        </div>
      </div>
    </div>

    <NuxtLink to="/" class="back-link">← 返回首页</NuxtLink>
  </div>
</template>

<script setup>
useHead({ title: '外部收藏 - 野火小站' })

const categories = [
  {
    name: '资讯站点',
    icon: '📰',
    links: [
      {
        name: 'StormZhang AI 每日资讯',
        url: 'https://news.stormzhang.ai/',
        emoji: '⚡',
        desc: '每日 AI 领域最新资讯，保持对行业动态的感知',
      },
      {
        name: '阮一峰的网络日志',
        url: 'https://www.ruanyifeng.com/blog/',
        emoji: '📝',
        desc: '科技爱好者周刊，涵盖技术、工具、读书等内容',
      },
    ],
  },
  {
    name: 'AI Skill',
    icon: '🤖',
    links: [
      {
        name: 'Sigma - 苏格拉底式提问学习',
        url: 'https://github.com/sanyuan0704/sanyuan-skills/tree/main/skills/sigma',
        emoji: '🎯',
        desc: '个性化 1v1 AI 导师，基于 Bloom 2-Sigma 精通学习法，通过提问引导深度理解',
      },
    ],
  },
  {
    name: '在线工具',
    icon: '🛠',
    links: [
      {
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        emoji: '✏️',
        desc: '手绘风格在线白板，适合画架构图、流程图、头脑风暴',
      },
    ],
  },
]
</script>

<style scoped>
.tool-page {
  padding-top: 0.5rem;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.3rem;
}

.tool-subtitle {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.cat-title {
  font-size: 1.15rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cat-icon {
  font-size: 1.2rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.link-card {
  display: block;
  background: white;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.25rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  cursor: pointer;
}

.link-card:hover {
  border-color: #ff8c42;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.link-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.link-emoji {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.link-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.link-arrow {
  color: #ccc;
  font-size: 1.1rem;
  transition: color 0.2s, transform 0.2s;
}

.link-card:hover .link-arrow {
  color: #ff6b35;
  transform: translate(2px, -2px);
}

.link-desc {
  color: #888;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
  padding-left: 1.9rem;
}

.back-link {
  display: inline-block;
  margin-top: 2.5rem;
  color: #ff6b35;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
  .link-desc {
    padding-left: 0;
  }
}
</style>
