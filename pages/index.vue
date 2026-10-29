<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">WILDFIRE STATION</p>
        <h1 class="hero-title">星星之火，可以燎原</h1>
        <p class="hero-desc">一个干净、好用、不打扰的在线工具箱。全部在浏览器本地运行，数据不上传。</p>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <b>{{ onlineCount }}</b>
          <span>个工具已上线</span>
        </div>
        <div class="stat">
          <b>{{ tools.length }}</b>
          <span>个工具规划中</span>
        </div>
      </div>
    </section>

    <!-- 分类筛选 -->
    <div class="filters">
      <button class="chip" :class="{ on: activeCat === '全部' }" @click="activeCat = '全部'">全部</button>
      <button
        v-for="c in categories"
        :key="c.key"
        class="chip"
        :class="{ on: activeCat === c.key }"
        @click="activeCat = c.key"
      >{{ c.icon }} {{ c.key }}</button>
    </div>

    <!-- 工具箱 -->
    <section v-for="group in visibleGroups" :key="group.key" class="group">
      <div class="group-head">
        <h2>{{ group.icon }} {{ group.key }}</h2>
        <span class="group-count">{{ group.items.length }}</span>
      </div>

      <div class="tool-grid">
        <component
          :is="t.to ? 'NuxtLink' : 'button'"
          v-for="t in group.items"
          :key="t.id"
          :to="t.to"
          class="tool"
          :class="{ 'is-coming': t.coming, 'is-hot': t.hot }"
          @click="t.coming && openSoon(t)"
        >
          <div class="tool-top">
            <span class="tool-icon">{{ t.icon }}</span>
            <span v-if="t.hot" class="badge badge-hot">NEW</span>
            <span v-else-if="t.coming" class="badge">规划中</span>
          </div>
          <h3 class="tool-name">{{ t.name }}</h3>
          <p class="tool-desc">{{ t.desc }}</p>
          <span class="tool-go" :class="{ off: t.coming }">{{ t.coming ? '敬请期待' : '打开 →' }}</span>
        </component>
      </div>
    </section>

    <p v-if="!visibleGroups.length" class="empty">这个分类下暂时没有工具 🤔</p>

    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { tools, categories, type ToolCategory } from '~/data/tools'

useHead({ title: '工具 - 野火小站' })

const activeCat = ref<'全部' | ToolCategory>('全部')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

const onlineCount = computed(() => tools.filter((t) => !t.coming).length)

const visibleGroups = computed(() => {
  const list = categories.map((c) => ({
    ...c,
    items: tools.filter((t) => t.category === c.key),
  }))
  return activeCat.value === '全部' ? list : list.filter((g) => g.key === activeCat.value)
})

function openSoon(t: { name: string }) {
  toast.value = `「${t.name}」还在打磨中，敬请期待`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}
</script>

<style scoped>
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 28px 0 40px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--accent);
  font-weight: 600;
}

.hero-title {
  margin: 0 0 12px;
  font-size: 40px;
  line-height: 1.15;
  letter-spacing: 2px;
  font-family: var(--serif);
  font-weight: 700;
  background: var(--hero-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  margin: 0;
  color: var(--muted);
  font-size: 14.5px;
  max-width: 520px;
}

.hero-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px 20px;
  min-width: 108px;
}

.stat b {
  display: block;
  font-size: 22px;
  color: var(--accent-soft);
  line-height: 1.2;
}

.stat span {
  font-size: 12px;
  color: var(--muted);
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 24px 0 8px;
}

.chip {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 999px;
  padding: 7px 15px;
  font-size: 13px;
  transition: all 0.16s;
}

.chip:hover {
  color: var(--text);
  border-color: var(--accent-dim);
}

.chip.on {
  background: var(--accent-dim);
  border-color: rgba(255, 106, 43, 0.5);
  color: var(--accent-soft);
  font-weight: 600;
}

.group {
  margin-top: 34px;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.group-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--text);
}

.group-count {
  font-size: 11px;
  color: var(--muted);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 1px 8px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
  gap: 12px;
}

.tool {
  /* 工具箱格子质感 */
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  padding: 18px 18px 16px;
  background: linear-gradient(180deg, var(--panel) 0%, var(--bg-soft) 100%);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--text);
  box-shadow: var(--shadow-card);
  transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;
  overflow: hidden;
}

.tool::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(220px 90px at 50% 120%, var(--accent-dim), transparent 70%);
  opacity: 0;
  transition: opacity 0.22s;
  pointer-events: none;
}

.tool:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 106, 43, 0.45);
  box-shadow: var(--shadow-hover);
}

.tool:hover::after {
  opacity: 1;
}

.tool.is-hot {
  border-color: rgba(255, 106, 43, 0.4);
}

.tool.is-coming {
  opacity: 0.62;
}

.tool.is-coming:hover {
  transform: none;
  border-color: var(--line);
}

.tool-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 12px;
}

.tool-icon {
  font-size: 24px;
  line-height: 1;
  filter: saturate(1.1);
}

.badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--muted);
  border: 1px solid var(--line);
  background: var(--bg-soft);
}

.badge-hot {
  color: #fff;
  border: 0;
  background: linear-gradient(90deg, var(--accent), #ff9d3d);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.tool-name {
  margin: 0 0 6px;
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.tool-desc {
  margin: 0 0 14px;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--muted);
  flex: 1;
}

.tool-go {
  font-size: 12.5px;
  color: var(--accent-soft);
  font-weight: 600;
}

.tool-go.off {
  color: var(--muted);
  font-weight: 400;
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 60px 0;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 100;
  box-shadow: var(--shadow-hover);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-width: 820px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 22px;
    padding: 14px 0 28px;
  }
  .hero-title {
    font-size: 30px;
  }
  .hero-stats {
    width: 100%;
  }
  .stat {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 560px) {
  .tool-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .tool {
    padding: 14px 13px 13px;
  }
  .tool-icon {
    font-size: 20px;
  }
  .tool-name {
    font-size: 14px;
  }
  .tool-desc {
    font-size: 11.5px;
    margin-bottom: 10px;
  }
}
</style>
