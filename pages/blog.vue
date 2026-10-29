<template>
  <div class="page">
    <h1 class="page-title">📮 博客</h1>
    <p class="page-sub">记录折腾、思考与踩坑。 <span class="tag">测试数据</span></p>

    <div class="post-list">
      <article v-for="p in posts" :key="p.id" class="post">
        <div class="post-meta">
          <span class="date">{{ p.date }}</span>
          <span class="cat">{{ p.tag }}</span>
        </div>
        <h2 class="post-title">{{ p.title }}</h2>
        <p class="post-excerpt">{{ p.excerpt }}</p>
        <div class="post-foot">
          <span>{{ p.readTime }} 分钟读完</span>
          <span class="more">阅读全文 →</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: '博客 - 野火小站' })

// TODO: 接入真实博客数据源
const posts = [
  {
    id: 1,
    date: '2026-10-28',
    tag: '折腾记',
    title: '用 Nuxt 3 + GitHub Pages 搭一个零成本工具站',
    excerpt: '整套方案不花一分钱：静态生成、自动部署、CDN 全球加速。这篇文章记录了从建仓到上线的完整流程，以及我踩过的几个坑。',
    readTime: 6,
  },
  {
    id: 2,
    date: '2026-10-21',
    tag: '思考',
    title: '为什么我坚持把工具做成纯前端',
    excerpt: '数据不上传、断网可用、没有隐私顾虑。纯前端不是技术炫技，而是对使用者最基本的尊重。',
    readTime: 4,
  },
  {
    id: 3,
    date: '2026-10-12',
    tag: '前端',
    title: 'Canvas 导出高清图片的正确姿势',
    excerpt: 'devicePixelRatio 到底该怎么用？为什么导出的图总是糊？这篇文章讲清楚画布尺寸、CSS 尺寸与像素密度三者之间的关系。',
    readTime: 8,
  },
  {
    id: 4,
    date: '2026-09-30',
    tag: '踩坑',
    title: '中文字体在 Canvas 里的那些事',
    excerpt: '系统字体不可控，跨平台渲染差异巨大。要么打包字体，要么接受差异，要么用图片替代。我的选择是……',
    readTime: 5,
  },
]
</script>

<style scoped>
.tag {
  font-size: 11px;
  color: var(--accent-soft);
  background: var(--accent-dim);
  border-radius: 999px;
  padding: 2px 8px;
  margin-left: 6px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 780px;
}

.post {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  transition: border-color 0.18s, transform 0.18s;
  cursor: pointer;
}

.post:hover {
  border-color: rgba(255, 106, 43, 0.4);
  transform: translateY(-2px);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 9px;
}

.cat {
  color: var(--accent-soft);
}

.post-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: 0.3px;
}

.post-excerpt {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 13.5px;
  line-height: 1.75;
}

.post-foot {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted);
}

.more {
  color: var(--accent-soft);
  font-weight: 600;
}
</style>
