import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: {
    default: 'circular.moda docs',
    template: '%s - circular.moda docs'
  },
  description: 'Documentation interne locale pour circular.moda',
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
}

const navbar = (
  <Navbar
    logo={
      <span style={{ fontWeight: 700 }}>
        circular.moda docs
      </span>
    }
  />
)

const footer = (
  <Footer>
    Documentation locale et confidentielle. Ne pas exposer sans protection
    d'acces.
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/ErwanEL/circular.moda/tree/feat/doc/docs-site/content"
          footer={footer}
          copyPageButton={false}
          editLink={null}
          feedback={{ content: null }}
          toc={{ title: 'Sur cette page' }}
          themeSwitch={{
            dark: 'Sombre',
            light: 'Clair',
            system: 'Systeme'
          }}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
