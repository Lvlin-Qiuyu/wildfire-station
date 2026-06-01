<template>
  <div class="app-container">
    <header class="app-header">
      <NuxtLink to="/" class="logo">🔥 野火小站</NuxtLink>
    </header>
    <main class="app-main">
      <NuxtPage />
    </main>
    <footer class="app-footer">
      <p>© {{ year }} 野火小站</p>
    </footer>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
  color: #2c3e50;
  line-height: 1.6;
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #22c55e, #10b981);
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.logo {
  color: white;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.app-main {
  flex: 1;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.app-footer {
  text-align: center;
  padding: 1.5rem;
  color: #999;
  font-size: 0.85rem;
  border-top: 1px solid #eee;
}
</style>
