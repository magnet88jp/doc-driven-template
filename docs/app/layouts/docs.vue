<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const route = useRoute()

const currentDeliveryScopePath = '/delivery/scopes/risk-regime-layer'

const activeNavigation = computed(() => {
  const items = navigation?.value || []
  const sectionPath = route.path.startsWith('/delivery')
    ? '/delivery'
    : route.path.startsWith('/operations')
      ? '/operations'
      : '/design'
  const section = items.find(item => item.path === sectionPath)

  const children = section?.children || []
  if (sectionPath !== '/delivery') {
    return children
  }

  return children.map(item => withDeliveryDefaultOpen(item))
})

function withDeliveryDefaultOpen(item: ContentNavigationItem): ContentNavigationItem {
  const shouldOpen = isDeliveryItemOpen(item)

  return {
    ...item,
    defaultOpen: shouldOpen,
    children: item.children?.map(child => withDeliveryDefaultOpen(child))
  }
}

function isDeliveryItemOpen(item: ContentNavigationItem): boolean {
  const itemPath = item.path || ''

  if (itemPath === '/delivery/scopes') {
    return true
  }

  if (itemPath.startsWith('/delivery/scopes/')) {
    return itemPath === currentDeliveryScopePath
      || itemPath.startsWith(`${currentDeliveryScopePath}/`)
  }

  return false
}
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation
            highlight
            :navigation="activeNavigation"
          />
        </UPageAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
