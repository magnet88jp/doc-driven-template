<script setup lang="ts">
const route = useRoute()

const sections = [{
  label: '設計思想',
  description: 'Architecture docs',
  icon: 'i-lucide-compass',
  to: '/design/overview/vision',
  active: (path: string) => path.startsWith('/design')
}, {
  label: 'オペレーション',
  description: 'Runbooks and operational checks',
  icon: 'i-lucide-activity',
  to: '/operations/getting-started',
  active: (path: string) => path.startsWith('/operations')
}, {
  label: '開発計画',
  description: 'Tasks and delivery plan',
  icon: 'i-lucide-list-checks',
  to: '/delivery/development-roadmap',
  active: (path: string) => path.startsWith('/delivery')
}, {
  label: 'メンテナンス',
  description: 'State, evidence, and PR lifecycle',
  icon: 'i-lucide-database',
  to: '/maintenance/state-management',
  active: (path: string) => path.startsWith('/maintenance')
}]
</script>

<template>
  <div class="border-b border-default bg-default/75 backdrop-blur">
    <UContainer>
      <nav class="flex items-center gap-1 overflow-x-auto py-2">
        <NuxtLink
          v-for="section in sections"
          :key="section.to"
          :to="section.to"
          class="group inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          :class="section.active(route.path)
            ? 'bg-primary/10 text-primary'
            : 'text-muted hover:bg-elevated/50 hover:text-highlighted'"
        >
          <UIcon
            :name="section.icon"
            class="size-4"
          />
          <span>{{ section.label }}</span>
        </NuxtLink>
      </nav>
    </UContainer>
  </div>
</template>
