"use client"

import { useState, useEffect, useMemo } from 'react'
import { GraduationCap, Users, Clock, BookOpen, TrendingUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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

const formatDate = (dateStr) => {
  const date = parseDate(dateStr)
  if (!date) return '-'
  return date.toLocaleDateString('tr-TR')
}

const calculateDuration = (startDate, endDate) => {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end) return '-'

  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 30) return `${diffDays} gün`

  const months = Math.floor(diffDays / 30)
  const days = diffDays % 30

  if (days === 0) return `${months} ay`
  return `${months} ay ${days} gün`
}

export default function YetistirmePage() {
  const { cleanedData, availableYears } = useData()
  const { setPageHeader } = usePageHeader()
  const [year, setYear] = useState('ALL')
  const [company, setCompany] = useState('Nemport')
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)

  useEffect(() => {
    setPageHeader({
      title: "Yetiştirme Programları",
      description: "Personel yetiştirme ve beceri geliştirme programları analizi",
      icon: GraduationCap
    })
  }, [setPageHeader])

  // Filter only YETİŞTİRME trainings
  const yetistirmeData = useMemo(() => {
    return cleanedData.filter(row => {
      if (row.egitimTuru !== 'YETİŞTİRME') return false

      // Apply year filter
      if (year !== 'ALL') {
        const rowDate = parseDate(row.baslangic)
        if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      }

      // Apply company filter
      if (company === 'Nemport') {
        if (!row.sirket || !row.sirket.toLowerCase().includes('nemport')) return false
      } else if (company !== 'ALL') {
        if (row.sirket !== company) return false
      }

      return true
    })
  }, [cleanedData, year, company])

  // Calculate metrics
  const metrics = useMemo(() => {
    const uniqueEmployees = new Set(yetistirmeData.map(r => r.sicilNo)).size
    const totalTrainings = yetistirmeData.length
    const totalHours = yetistirmeData.reduce((sum, r) => sum + (r.sure || 0), 0)
    const avgHoursPerPerson = uniqueEmployees > 0 ? (totalHours / uniqueEmployees).toFixed(1) : 0

    return {
      uniqueEmployees,
      totalTrainings,
      totalHours: Math.round(totalHours),
      avgHoursPerPerson
    }
  }, [yetistirmeData])

  // Training programs breakdown
  const programsData = useMemo(() => {
    const programs = {}

    yetistirmeData.forEach(row => {
      // Remove TEORİK and UYGULAMA from program name to group them together
      let programName = row.egitimAdi || 'Bilinmeyen Program'
      programName = programName
        .replace(/\s*-?\s*TEORİK\s*/gi, '')
        .replace(/\s*-?\s*UYGULAMA\s*/gi, '')
        .replace(/\s*\(TEORİK\)\s*/gi, '')
        .replace(/\s*\(UYGULAMA\)\s*/gi, '')
        .trim()

      if (!programs[programName]) {
        programs[programName] = {
          name: programName,
          employees: new Set(),
          totalTrainings: 0,
          totalHours: 0
        }
      }

      programs[programName].employees.add(row.sicilNo)
      programs[programName].totalTrainings++
      programs[programName].totalHours += row.sure || 0
    })

    return Object.values(programs)
      .map(p => ({
        name: p.name,
        employees: p.employees.size,
        trainings: p.totalTrainings,
        hours: Math.round(p.totalHours)
      }))
      .sort((a, b) => b.employees - a.employees)
  }, [yetistirmeData])

  // Monthly timeline data
  const timelineData = useMemo(() => {
    const monthlyStats = {}
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

    yetistirmeData.forEach(row => {
      const startDate = parseDate(row.baslangic)
      const endDate = parseDate(row.bitis)

      if (startDate) {
        const startKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyStats[startKey]) {
          monthlyStats[startKey] = {
            month: startKey,
            monthLabel: `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`,
            started: 0,
            ended: 0
          }
        }
        monthlyStats[startKey].started++
      }

      if (endDate) {
        const endKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyStats[endKey]) {
          monthlyStats[endKey] = {
            month: endKey,
            monthLabel: `${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`,
            started: 0,
            ended: 0
          }
        }
        monthlyStats[endKey].ended++
      }
    })

    return Object.values(monthlyStats)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
  }, [yetistirmeData])

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

  if (yetistirmeData.length === 0) {
    return (
      <div className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Yıl</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tümü</SelectItem>
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
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-lg">Seçili filtrelerde YETİŞTİRME kaydı bulunamadı</p>
            <p className="text-muted-foreground text-sm">Farklı filtreler deneyin</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yıl</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tümü</SelectItem>
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
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eğitilen Personel</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.uniqueEmployees.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Benzersiz çalışan</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Eğitim</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalTrainings.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Yetiştirme programı</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Saat</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalHours.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Eğitim saati</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kişi Başı Ortalama</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgHoursPerPerson}</div>
            <p className="text-xs text-muted-foreground mt-1">Saat/kişi</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Programs Chart */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Yetiştirme Programları</CardTitle>
          <CardDescription>Program bazında eğitilen personel sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(400, programsData.length * 35)}>
            <BarChart data={programsData} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={240}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border border-border p-3 rounded-lg shadow-lg max-w-sm">
                        <p className="font-medium mb-2">{data.name}</p>
                        <p className="text-sm text-muted-foreground">Personel: {data.employees}</p>
                        <p className="text-sm text-muted-foreground">Toplam Eğitim: {data.trainings}</p>
                        <p className="text-sm text-muted-foreground">Toplam Saat: {data.hours}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Bar dataKey="employees" fill="#3b82f6" name="Eğitilen Personel" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      {timelineData.length > 0 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Aylık Zaman Çizelgesi</CardTitle>
            <CardDescription>Başlayan ve biten eğitimler (Son 12 ay)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="monthLabel"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                          <p className="font-medium mb-2">{data.monthLabel}</p>
                          <p className="text-sm text-green-600">Başlayan: {data.started}</p>
                          <p className="text-sm text-blue-600">Biten: {data.ended}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="started" fill="#10b981" name="Başlayan" />
                <Bar dataKey="ended" fill="#3b82f6" name="Biten" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Detaylı Kayıtlar</CardTitle>
          <CardDescription>Tüm yetiştirme programı kayıtları ({yetistirmeData.length} kayıt)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sicil No</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Program Adı</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead className="text-right">Saat</TableHead>
                  <TableHead>Bölüm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yetistirmeData.slice(0, 100).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{row.sicilNo}</TableCell>
                    <TableCell className="font-medium">{row.adi} {row.soyadi}</TableCell>
                    <TableCell className="max-w-xs">{row.egitimAdi}</TableCell>
                    <TableCell>{formatDate(row.baslangic)}</TableCell>
                    <TableCell>{formatDate(row.bitis)}</TableCell>
                    <TableCell>{calculateDuration(row.baslangic, row.bitis)}</TableCell>
                    <TableCell className="text-right">{row.sure} saat</TableCell>
                    <TableCell className="text-sm">{row.bolum}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {yetistirmeData.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              İlk 100 kayıt gösteriliyor. Tüm kayıtları görmek için Veri Tablosu sekmesini kullanın.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
