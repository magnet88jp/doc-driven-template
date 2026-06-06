<script setup lang="ts">
const props = defineProps<{
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  hideHeader?: boolean
  meta?: string
  class?: unknown
}>()

const isMermaid = computed(() => props.language === 'mermaid')
const source = computed(() => props.code?.trim() || '')
const diagramId = `mermaid-${Math.random().toString(36).slice(2)}`
const svg = ref('')
const error = ref('')

watchEffect(async () => {
  if (!import.meta.client || !isMermaid.value || !source.value) {
    return
  }

  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'default'
    })

    const rendered = await mermaid.render(diagramId, source.value)
    svg.value = rendered.svg
    error.value = ''
  } catch (err) {
    svg.value = ''
    error.value = err instanceof Error ? err.message : 'Failed to render Mermaid diagram.'
  }
})
</script>

<template>
  <figure
    v-if="isMermaid"
    class="my-6 overflow-x-auto rounded-lg border border-default bg-default p-4"
  >
    <!-- eslint-disable vue/no-v-html -- Mermaid renders sanitized SVG with securityLevel=strict. -->
    <div
      v-if="svg"
      class="[&_svg]:mx-auto [&_svg]:max-w-full"
      v-html="svg"
    />
    <!-- eslint-enable vue/no-v-html -->
    <pre
      v-else
      class="overflow-x-auto text-sm text-muted"
    >{{ error || source }}</pre>
  </figure>

  <div
    v-else
    class="my-5 overflow-hidden rounded-lg border border-default bg-elevated"
  >
    <div
      v-if="filename && !hideHeader"
      class="border-b border-default px-4 py-2 text-sm font-medium text-muted"
    >
      {{ filename }}
    </div>
    <pre
      class="overflow-x-auto p-4 text-sm"
      :class="props.class"
    ><slot /></pre>
  </div>
</template>
