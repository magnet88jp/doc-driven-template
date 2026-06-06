<script setup lang="ts">
const route = useRoute()

const sections = [
  { label: 'Design', to: '/design/overview/vision', prefix: '/design' },
  { label: 'Operations', to: '/operations/overview', prefix: '/operations' },
  { label: 'Delivery', to: '/delivery/development-roadmap', prefix: '/delivery' }
]

const isActive = (prefix: string) => route.path.startsWith(prefix)
</script>

<template>
  <nav
    aria-label="Docs sections"
    class="items-center gap-1 overflow-x-auto"
  >
    <NuxtLink
      v-for="section in sections"
      :key="section.prefix"
      :to="section.to"
      class="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-muted hover:text-highlighted"
      :class="[
        isActive(section.prefix) && 'bg-primary/10 text-primary ring ring-primary/20'
      ]"
    >
      {{ section.label }}
    </NuxtLink>
  </nav>
</template>
