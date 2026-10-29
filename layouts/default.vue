<template>
  <div class="shell">
    <header class="nav">
      <div class="nav-inner">
        <NuxtLink to="/" class="brand" aria-label="野火小站">
          <picture v-if="!logoFailed">
            <source :srcset="logoWebp" type="image/webp" />
            <img :src="logoSrc" alt="" class="brand-logo" width="40" height="40" @error="logoFailed = true" />
          </picture>
          <span v-else class="brand-logo brand-logo--fallback">野</span>
          <span class="brand-name">野火小站</span>
        </NuxtLink>

        <nav class="menu" :class="{ open: mobileOpen }">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="menu-item"
            active-class="is-active"
            exact-active-class="is-active"
            @click="mobileOpen = false"
          >{{ item.label }}</NuxtLink>
        </nav>

        <div class="nav-actions">
        <button
          class="theme-toggle"
          :aria-label="theme === 'light' ? '切换到暗色' : '切换到亮色'"
          :title="theme === 'light' ? '切换到暗色' : '切换到亮色'"
          @click="toggle()"
        >
          <svg v-if="theme === 'light'" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.5 12h2M19.5 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" />
          </svg>
        </button>

        <button class="burger" :class="{ open: mobileOpen }" aria-label="菜单" @click="mobileOpen = !mobileOpen">
          <span></span><span></span><span></span>
        </button>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="foot">
      <div class="container foot-inner">
        <span>© {{ year }} 野火小站</span>
        <span class="dot">·</span>
        <span>星星之火，可以燎原</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  { to: '/', label: '工具' },
  { to: '/blog', label: '博客' },
  { to: '/contact', label: '联系我' },
]
const { theme, toggle, init } = useTheme()
const mobileOpen = ref(false)
onMounted(init)
const logoFailed = ref(false)
const baseURL = useRuntimeConfig().app.baseURL
const logoSrc = computed(() => `${baseURL}logo.png`)
const logoWebp = computed(() => `${baseURL}logo.webp`)
const year = new Date().getFullYear()
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(14px);
  background: var(--nav-bg);
  border-bottom: 1px solid var(--line);
  transition: background-color 0.25s ease;
}

.nav-inner {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: contain;
  display: block;
  background: #0d0c0b;
  border: 1.5px solid rgba(255, 138, 74, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(255, 122, 26, 0.22);
}

.brand-logo--fallback {
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent), #ff9d3d);
  color: #1a1206;
  font-weight: 800;
  font-size: 18px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.menu {
  display: flex;
  gap: 6px;
}

.menu-item {
  padding: 8px 14px;
  font-size: 14.5px;
  color: var(--muted);
  border-radius: 9px;
  transition: color 0.18s, background 0.18s;
}

.menu-item:hover {
  color: var(--text);
  background: var(--bg-soft);
}

.menu-item.is-active {
  color: var(--accent-soft);
  background: var(--accent-dim);
  font-weight: 600;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.theme-toggle {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--muted);
  transition: color 0.18s, background 0.18s, border-color 0.18s, transform 0.18s;
}

.theme-toggle:hover {
  color: var(--accent-soft);
  background: var(--accent-dim);
  border-color: var(--accent-dim);
  transform: rotate(-12deg);
}

.burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: 0;
  padding: 8px;
}

.burger span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
  transition: transform 0.2s, opacity 0.2s;
}

.burger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.burger.open span:nth-child(2) {
  opacity: 0;
}
.burger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.foot {
  margin-top: auto;
  border-top: 1px solid var(--line);
  position: relative;
  z-index: 1;
}

.foot-inner {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.dot {
  opacity: 0.5;
}

@media (max-width: 720px) {
  .nav-inner {
    padding: 0 16px;
  }
  .burger {
    display: flex;
  }
  .menu {
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 2px;
    padding: 10px 16px 16px;
    background: var(--mobile-menu-bg);
    border-bottom: 1px solid var(--line);
    display: none;
  }
  .menu.open {
    display: flex;
  }
  .menu-item {
    padding: 12px 14px;
    font-size: 15px;
  }
}
</style>
