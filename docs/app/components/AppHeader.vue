<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()
const route = useRoute()

const showSectionNav = computed(() => route.path !== '/')

const activeNavigation = computed(() => {
  const items = navigation?.value || []
  const sectionPath = route.path.startsWith('/delivery')
    ? '/delivery'
    : route.path.startsWith('/operations')
      ? '/operations'
      : '/design'
  const section = items.find(item => item.path === sectionPath)

  return section?.children || []
})
</script>

<template>
  <div>
    <UHeader
      :ui="{ center: 'flex-1' }"
      :to="header?.to || '/'"
    >
      <UContentSearchButton
        v-if="header?.search"
        :collapsed="false"
        class="w-full"
      />

      <template
        v-if="header?.logo?.dark || header?.logo?.light || header?.title"
        #title
      >
        <UColorModeImage
          v-if="header?.logo?.dark || header?.logo?.light"
          :light="header?.logo?.light!"
          :dark="header?.logo?.dark!"
          :alt="header?.logo?.alt"
          class="h-6 w-auto shrink-0"
        />

        <span v-else-if="header?.title">
          {{ header.title }}
        </span>
      </template>

      <template
        v-else
        #left
      >
        <NuxtLink :to="header?.to || '/'">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>

        <TemplateMenu />
      </template>

      <template #right>
        <UContentSearchButton
          v-if="header?.search"
          class="lg:hidden"
        />

        <UColorModeButton v-if="header?.colorMode" />

        <template v-if="header?.links">
          <UButton
            v-for="(link, index) of header.links"
            :key="index"
            v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
          />
        </template>
      </template>

      <template #body>
        <DocsSectionNav v-if="showSectionNav" />

        <UContentNavigation
          highlight
          :navigation="navigation"
        />
      </template>
    </UHeader>

    <DocsSectionNav
      v-if="showSectionNav"
      class="hidden lg:block"
    />
  </div>
</template>
