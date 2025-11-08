"use client"

import { useState } from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { DataProvider } from '@/components/providers/data-provider'
import { PageHeaderProvider } from '@/components/providers/page-header-provider'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export default function RootLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <title>Eğitim Analiz Dashboard</title>
        <meta name="description" content="Personel eğitim verilerini analiz edin ve raporlayın" />
      </head>
      <body
        className={cn(
          inter.variable,
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DataProvider>
            <PageHeaderProvider>
              <div className="relative flex min-h-screen">
                <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

                <div
                  className={cn(
                    "flex flex-1 flex-col transition-all duration-300",
                    isCollapsed ? "ml-16" : "ml-64"
                  )}
                >
                  <Header />

                  <main className="flex-1 p-6">
                    {children}
                  </main>
                </div>
              </div>

              <Toaster position="top-right" />
            </PageHeaderProvider>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
