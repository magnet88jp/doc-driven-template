<script setup lang="ts">
const { footer } = useAppConfig()
const footerLinks = computed(() => (footer?.links || []) as Record<string, unknown>[])
</script>

<template>
  <UFooter>
    <template #left>
      {{ footer.credits }}
    </template>

    <template #right>
      <UColorModeButton v-if="footer?.colorMode" />

      <template v-if="footerLinks.length">
        <UButton
          v-for="(link, index) of footerLinks"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>
  </UFooter>
</template>
