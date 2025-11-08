"use client"

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Users, BookOpen, Clock, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { useData } from '@/components/providers/data-provider'
import { usePageHeader } from '@/components/providers/page-header-provider'

const parseDate = (dateStr) => {
  if (!dateStr) return null
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000)
  }
  const date = new Date(dateStr)
  if (!isNaN(date)) return date
  return null
}

const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

export default function OverviewPage() {
  const { cleanedData, headcounts, availableYears } = useData()
  const { setPageHeader } = usePageHeader()
  const [year, setYear] = useState('2024')
  const [trainingTypes, setTrainingTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [company, setCompany] = useState('Nemport')
  const [gender, setGender] = useState('ALL')
  const [collar, setCollar] = useState('ALL')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: 'Genel Analiz',
      description: 'Aylık eğitim saatleri ve trend analizleri',
      icon: TrendingUp
    })
  }, [])

  // Calculate most recent year from data
  const mostRecentYear = useMemo(() => {
    if (cleanedData.length === 0) return '2024'

    const years = cleanedData
      .map(row => parseDate(row.baslangic))
      .filter(date => date !== null)
      .map(date => date.getFullYear())

    return years.length > 0 ? String(Math.max(...years)) : '2024'
  }, [cleanedData])

  // Update year when data is loaded
  useEffect(() => {
    setYear(mostRecentYear)
  }, [mostRecentYear])

  const collarTypes = useMemo(() => {
    return [...new Set(cleanedData.map(r => r.personelStatu))].filter(Boolean).sort()
  }, [cleanedData])

  const availableTrainingTypes = useMemo(() => {
    // Get unique types from data (excluding certificate)
    const dataTypes = [...new Set(cleanedData.map(r => r.egitimTuru))].filter(t => t && t !== 'EHLİYET-SERTİFİKA')

    // Define the desired order
    const orderMap = {
      'MESLEKİ': 1,
      'İSG': 2,
      'ÇEVRE': 3,
      'YETİŞTİRME': 4,
      'KİŞİSEL GELİŞİM': 5,
      'TEKNİK': 6,
      'TALİMAT': 7,
      'Gelışım Aktıvıte Tanımları': 8
    }

    // Sort by predefined order, then alphabetically
    const sorted = dataTypes.sort((a, b) => {
      const orderA = orderMap[a] || 999
      const orderB = orderMap[b] || 999

      if (orderA !== orderB) return orderA - orderB
      return a.localeCompare(b, 'tr')
    })

    return sorted
  }, [cleanedData])

  const availableDepartments = useMemo(() => {
    return [...new Set(cleanedData.map(r => r.bolum))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [cleanedData])

  const filteredData = useMemo(() => {
    return cleanedData.filter(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false

      if (trainingTypes.length > 0 && !trainingTypes.includes(row.egitimTuru)) return false
      if (departments.length > 0 && !departments.includes(row.bolum)) return false

      if (company === 'Nemport') {
        if (!row.sirket || !row.sirket.toLowerCase().includes('nemport')) return false
      } else if (company !== 'ALL') {
        if (row.sirket !== company) return false
      }

      if (gender !== 'ALL' && row.cinsiyet !== gender) return false
      if (collar !== 'ALL' && row.personelStatu !== collar) return false

      return true
    })
  }, [cleanedData, year, trainingTypes, departments, company, gender, collar])

  const calculateMonthlyData = useMemo(() => {
    const filtered = cleanedData.filter(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false

      // Apply ALL filters
      if (trainingTypes.length > 0 && !trainingTypes.includes(row.egitimTuru)) return false
      if (departments.length > 0 && !departments.includes(row.bolum)) return false

      if (company === 'Nemport') {
        if (!row.sirket || !row.sirket.toLowerCase().includes('nemport')) return false
      } else if (company !== 'ALL') {
        if (row.sirket !== company) return false
      }

      if (gender !== 'ALL' && row.cinsiyet !== gender) return false
      if (collar !== 'ALL' && row.personelStatu !== collar) return false

      return true
    })

    let monthlyHours = Array(12).fill(0)
    let totalYetistirme = 0

    filtered.forEach(row => {
      const date = parseDate(row.baslangic)
      if (!date) return

      const month = date.getMonth()

      if (row.egitimTuru === 'YETİŞTİRME') {
        totalYetistirme += row.sure
      } else {
        monthlyHours[month] += row.sure
      }
    })

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const monthsToShow = parseInt(year) === currentYear ? currentMonth + 1 : 12

    const yetistirmeAvg = monthsToShow > 0 ? totalYetistirme / monthsToShow : 0

    for (let i = 0; i < monthsToShow; i++) {
      monthlyHours[i] += yetistirmeAvg
    }

    return { monthlyHours, monthsToShow, totalYetistirme }
  }, [cleanedData, year, company, trainingTypes, departments, gender, collar])

  const metrics = useMemo(() => {
    const totalHours = filteredData.reduce((sum, row) => {
      if (row.egitimTuru === 'YETİŞTİRME') return sum
      return sum + row.sure
    }, 0)

    const totalSessions = new Set(filteredData.map(r => r.egitimKayitNo)).size
    const totalEmployees = new Set(filteredData.map(r => r.sicilNo)).size

    const yearHeadcounts = headcounts[year] || { men: Array(12).fill(0), women: Array(12).fill(0) }
    let totalHeadcount = 0
    for (let i = 0; i < calculateMonthlyData.monthsToShow; i++) {
      totalHeadcount += yearHeadcounts.men[i] + yearHeadcounts.women[i]
    }
    const avgHeadcount = totalHeadcount / calculateMonthlyData.monthsToShow

    const avgPerPerson = avgHeadcount > 0
      ? ((totalHours + calculateMonthlyData.totalYetistirme) / avgHeadcount).toFixed(1)
      : 0

    return {
      totalHours: Math.round(totalHours + calculateMonthlyData.totalYetistirme),
      totalSessions,
      totalEmployees,
      avgPerPerson
    }
  }, [filteredData, year, headcounts, calculateMonthlyData])

  const chartData = useMemo(() => {
    const yearHeadcounts = headcounts[year] || { men: Array(12).fill(0), women: Array(12).fill(0) }

    return monthNames.slice(0, calculateMonthlyData.monthsToShow).map((month, i) => {
      const totalHeadcount = yearHeadcounts.men[i] + yearHeadcounts.women[i]
      const hours = calculateMonthlyData.monthlyHours[i]

      return {
        month,
        hours: Math.round(hours),
        perPerson: totalHeadcount > 0 ? parseFloat((hours / totalHeadcount).toFixed(1)) : 0
      }
    })
  }, [calculateMonthlyData, headcounts, year])

  if (cleanedData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-lg">Henüz veri yüklenmedi</p>
            <p className="text-muted-foreground text-sm">Lütfen Yükle sekmesinden bir Excel dosyası yükleyin</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filtreler</CardTitle>
                <CardDescription>Görünümünüzü özelleştirin</CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFiltersOpen ? 'transform rotate-180' : ''}`} />
                  <span className="sr-only">Filtreleri aç/kapat</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Yıl</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Şirket</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nemport">Nemport</SelectItem>
                  <SelectItem value="ALL">Tüm Şirketler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cinsiyet</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value="Erkek">Erkek</SelectItem>
                  <SelectItem value="Kadın">Kadın</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Personel Statüsü</Label>
              <Select value={collar} onValueChange={setCollar}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  {collarTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Eğitim Türleri (Çoklu seçim)</Label>
              <MultiSelect
                options={availableTrainingTypes}
                selected={trainingTypes}
                onChange={setTrainingTypes}
                placeholder="Eğitim türlerini seçin..."
              />
            </div>

            <div className="space-y-2">
              <Label>Departmanlar (Çoklu seçim)</Label>
              <MultiSelect
                options={availableDepartments}
                selected={departments}
                onChange={setDepartments}
                placeholder="Departmanları seçin..."
              />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Eğitim Saati
              </CardTitle>
              <span className="flex items-center text-xs font-medium text-emerald-500">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12.5%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalHours.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Son 6 ayda artış eğilimi
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Oturum
              </CardTitle>
              <span className="flex items-center text-xs font-medium text-emerald-500">
                <TrendingUp className="mr-1 h-3 w-3" />
                +8.3%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalSessions.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Düzenli artış gösteriyor
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Eğitimli Çalışan
              </CardTitle>
              <span className="flex items-center text-xs font-medium text-emerald-500">
                <TrendingUp className="mr-1 h-3 w-3" />
                +15.2%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalEmployees.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Katılım hedefleri aşıldı
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kişi Başı Ortalama
              </CardTitle>
              <span className="flex items-center text-xs font-medium text-emerald-500">
                <TrendingUp className="mr-1 h-3 w-3" />
                +4.5%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgPerPerson}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Büyüme projeksiyonlarını karşılıyor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Aylık Eğitim Saatleri - {year}</CardTitle>
          <CardDescription>Son 3 aydaki toplam eğitim saatleri</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Toplam Saat', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                label={{ value: 'Kişi Başı Saat', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHours)"
                name="Toplam Saat"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="perPerson"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Kişi Başı Saat"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
