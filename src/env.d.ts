declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMeta {
  glob<T>(pattern: string, options?: {
    eager?: boolean
    query?: string
    import?: string
  }): Record<string, T>
}