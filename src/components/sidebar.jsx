"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  TrendingUp,
  Calendar,
  PieChart,
  Table2,
  Users,
  Building2,
  Trophy,
  GraduationCap,
  Award,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const sidebarItems = [
  { title: 'Genel Bakış', href: '/', icon: LayoutDashboard },
  { title: 'Analiz', href: '/overview', icon: TrendingUp },
  { title: 'Aylık İstatistikler', href: '/monthly', icon: Calendar },
  { title: 'Dağılım Analizi', href: '/breakdown', icon: PieChart },
  { title: 'Yetiştirme', href: '/yetistirme', icon: GraduationCap },
  { title: 'Sertifikalar', href: '/sertifikalar', icon: Award },
  { title: 'Veri Tablosu', href: '/data-table', icon: Table2 },
  { title: 'Departman Analizi', href: '/department', icon: Building2 },
  { title: 'En İyi Eğitimler', href: '/top-trainings', icon: Trophy },
]

const bottomSidebarItems = [
  { title: 'Dosya Yükle', href: '/upload', icon: Upload },
  { title: 'Kadro Yönetimi', href: '/headcount', icon: Users },
]

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border/40 bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center border-b border-border/40 px-4">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <LayoutDashboard className="h-6 w-6" />
              <span>Eğitim Analizi</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/" className="flex items-center justify-center w-full">
              <LayoutDashboard className="h-6 w-6" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation Items */}
        <div className="border-t border-border/40 px-3 py-2">
          <nav className="flex flex-col gap-1">
            {bottomSidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Collapse Button */}
        <div className="border-t border-border/40 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-start"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            {!isCollapsed && <span className="ml-2">Daralt</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
