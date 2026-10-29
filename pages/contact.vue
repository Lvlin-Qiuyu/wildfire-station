<template>
  <div class="page">
    <h1 class="page-title">💬 联系我</h1>
    <p class="page-sub">有话想说、想提需求、发现 bug，都可以找我。 <span class="tag">测试数据</span></p>

    <div class="cards">
      <a class="card" href="mailto:hello@example.com">
        <span class="ico">✉️</span>
        <div>
          <h3>邮箱</h3>
          <p>hello@example.com</p>
        </div>
      </a>
      <a class="card" href="#" @click.prevent>
        <span class="ico">🐙</span>
        <div>
          <h3>GitHub</h3>
          <p>@Lvlin-Qiuyu</p>
        </div>
      </a>
      <a class="card" href="#" @click.prevent>
        <span class="ico">💬</span>
        <div>
          <h3>微信</h3>
          <p>扫码添加（待补充）</p>
        </div>
      </a>
      <a class="card" href="#" @click.prevent>
        <span class="ico">📕</span>
        <div>
          <h3>小红书</h3>
          <p>@野火小站</p>
        </div>
      </a>
    </div>

    <section class="note">
      <h2>关于这个小站</h2>
      <p>
        野火小站是一个纯前端工具集合，所有功能都在你的浏览器里跑，输入的内容不会离开你的设备。
        如果某个工具帮到你了，或者你希望增加什么工具，欢迎告诉我。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: '联系我 - 野火小站' })
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

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  max-width: 780px;
}

.card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 20px;
  transition: border-color 0.18s, transform 0.18s;
}

.card:hover {
  border-color: rgba(255, 106, 43, 0.4);
  transform: translateY(-2px);
}

.ico {
  font-size: 22px;
}

.card h3 {
  margin: 0 0 3px;
  font-size: 14px;
  font-weight: 600;
}

.card p {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
}

.note {
  max-width: 780px;
  margin-top: 28px;
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 20px 22px;
}

.note h2 {
  margin: 0 0 10px;
  font-size: 15px;
}

.note p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--muted);
}
</style>
