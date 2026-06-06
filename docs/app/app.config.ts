export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Document Driven Monorepo'
  },
  header: {
    title: 'Document Driven Monorepo',
    to: '/',
    logo: {
      alt: 'Document Driven Monorepo',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: []
  },
  footer: {
    credits: `Document Driven Monorepo • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: []
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Read Next',
      links: [{
        icon: 'i-lucide-play-circle',
        label: 'Getting Started',
        to: '/operations/getting-started'
      }, {
        icon: 'i-lucide-crosshair',
        label: 'Current Scope',
        to: '/delivery/current-scope'
      }]
    }
  }
})
