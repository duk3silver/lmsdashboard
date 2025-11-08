"use client"

import { useState, useEffect, useMemo } from 'react'
import { Calendar, TrendingUp, Users, BookOpen, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

export default function MonthlyPage() {
  const { cleanedData, availableYears } = useData()
  const { setPageHeader } = usePageHeader()
  const [year, setYear] = useState('2024')
  const [trainingTypes, setTrainingTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [company, setCompany] = useState('Nemport')
  const [gender, setGender] = useState('ALL')
  const [collar, setCollar] = useState('ALL')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    setPageHeader({
      title: "Aylık Analiz",
      description: "Eğitim oturum sıklığı ve aylık dağılım",
      icon: Calendar
    })
  }, [setPageHeader])

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
    const dataTypes = [...new Set(cleanedData.map(r => r.egitimTuru))].filter(t => t && t !== 'EHLİYET-SERTİFİKA')

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

  const monthlyStats = useMemo(() => {
    const stats = Array(12).fill(0).map((_, idx) => ({
      month: monthNames[idx],
      sessions: 0,
      participants: new Set(),
      hours: 0
    }))

    filteredData.forEach(row => {
      const date = parseDate(row.baslangic)
      if (!date) return

      const month = date.getMonth()
      stats[month].sessions++
      stats[month].participants.add(row.sicilNo)
      stats[month].hours += row.sure || 0
    })

    // Convert participants Set to count
    return stats.map(stat => ({
      ...stat,
      participants: stat.participants.size
    }))
  }, [filteredData])

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const monthsToShow = parseInt(year) === currentYear ? currentMonth + 1 : 12

  const chartData = monthlyStats.slice(0, monthsToShow)

  const metrics = useMemo(() => {
    const totalSessions = chartData.reduce((sum, m) => sum + m.sessions, 0)
    const totalParticipants = new Set(filteredData.map(r => r.sicilNo)).size
    const totalHours = chartData.reduce((sum, m) => sum + m.hours, 0)
    const avgSessionsPerMonth = monthsToShow > 0 ? (totalSessions / monthsToShow).toFixed(1) : 0

    return {
      totalSessions,
      totalParticipants,
      totalHours: Math.round(totalHours),
      avgSessionsPerMonth
    }
  }, [chartData, filteredData, monthsToShow])

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Oturum
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Bu yıl</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aylık Ortalama
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgSessionsPerMonth}</div>
            <p className="text-xs text-muted-foreground">Oturum/Ay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Katılımcı Sayısı
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalParticipants.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Kişi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Saat
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalHours.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Saat</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Oturum Sayıları - {year}</CardTitle>
          <CardDescription>Her ayda gerçekleştirilen eğitim oturumu sayıları</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="sessions" fill="#2563eb" name="Oturum Sayısı" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Detay Tablosu</CardTitle>
          <CardDescription>Her ayın detaylı istatistikleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Ay</TableHead>
                  <TableHead className="font-bold text-right">Oturum</TableHead>
                  <TableHead className="font-bold text-right">Katılımcı</TableHead>
                  <TableHead className="font-bold text-right">Toplam Saat</TableHead>
                  <TableHead className="font-bold text-right">Ort. Saat/Oturum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right">{row.sessions.toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{row.participants.toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{Math.round(row.hours).toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">
                      {row.sessions > 0 ? (row.hours / row.sessions).toFixed(1) : '0.0'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOPLAM</TableCell>
                  <TableCell className="text-right">{metrics.totalSessions.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-right">{metrics.totalParticipants.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-right">{metrics.totalHours.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-right">
                    {metrics.totalSessions > 0 ? (metrics.totalHours / metrics.totalSessions).toFixed(1) : '0.0'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
