"use client"

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { usePageHeader } from '@/components/providers/page-header-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { pageHeader } = usePageHeader()
  const PageIcon = pageHeader.icon

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-gradient-to-b from-muted/30 to-background">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-4 pb-4">
        {/* Page Title and Description */}
        <div className="flex-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {PageIcon && <PageIcon className="h-8 w-8" />}
              <h1 className="text-3xl font-bold tracking-tight">
                {pageHeader.title}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {pageHeader.description}
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Açık
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Koyu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                Sistem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
