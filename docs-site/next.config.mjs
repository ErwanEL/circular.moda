import nextra from 'nextra'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

const withNextra = nextra({
  contentDirBasePath: '/'
})

export default withNextra({
  turbopack: {
    root,
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.jsx'
    }
  }
})
