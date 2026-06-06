import type { ContentNavigationItem } from '@nuxt/content'
import type { NavigationMenuItem } from '@nuxt/ui'

export function withoutHeaderNavigationItems(
  navigation: ContentNavigationItem[] | null | undefined,
  headerNavigation: NavigationMenuItem[] | null | undefined
): ContentNavigationItem[] {
  const headerPaths = new Set(
    (headerNavigation || [])
      .map(item => item.to)
      .filter((to): to is string => typeof to === 'string' && to.startsWith('/'))
  )

  return (navigation || [])
    .filter(item => !headerPaths.has(item.path))
    .map(item => ({
      ...item,
      children: item.children
        ? withoutHeaderNavigationItems(item.children, headerNavigation)
        : item.children
    }))
}
