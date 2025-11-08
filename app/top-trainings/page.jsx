"use client"

import { useState, useEffect, useMemo } from 'react'
import { Award, BookOpen, Users, Clock, ChevronDown } from 'lucide-react'
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

export default function TopTrainingsPage() {
  const { cleanedData } = useData()
  const { setPageHeader } = usePageHeader()
  const [year, setYear] = useState('2024')
  const [trainingTypes, setTrainingTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [company, setCompany] = useState('Nemport')
  const [gender, setGender] = useState('ALL')
  const [collar, setCollar] = useState('ALL')
  const [limit, setLimit] = useState('20')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    setPageHeader({
      title: "En Popüler 20 Eğitim",
      description: "Farklı metriklere göre sıralanmış en popüler eğitim kursları",
      icon: Award
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
      'TEKNİK': 6
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

  const trainingStats = useMemo(() => {
    const stats = {}

    filteredData.forEach(row => {
      const trainingName = row.egitimAdi || 'Belirtilmemiş'
      if (!stats[trainingName]) {
        stats[trainingName] = {
          name: trainingName,
          code: row.egitimKodu || '-',
          type: row.egitimTuru || '-',
          totalHours: 0,
          sessions: 0,
          participants: new Set()
        }
      }

      stats[trainingName].totalHours += row.sure || 0
      stats[trainingName].sessions++
      stats[trainingName].participants.add(row.sicilNo)
    })

    // Convert to array and calculate additional metrics
    const statsArray = Object.values(stats).map(training => ({
      ...training,
      participants: training.participants.size,
      avgHoursPerParticipant: training.participants.size > 0 ? (training.totalHours / training.participants.size).toFixed(1) : 0
    }))

    // Sort by total hours descending
    statsArray.sort((a, b) => b.totalHours - a.totalHours)

    return statsArray
  }, [filteredData])

  const topTrainings = trainingStats.slice(0, parseInt(limit))

  const chartData = topTrainings.slice(0, 10).map(training => ({
    name: training.name.length > 30 ? training.name.substring(0, 30) + '...' : training.name,
    'Toplam Saat': Math.round(training.totalHours),
    'Katılımcı': training.participants
  }))

  const metrics = useMemo(() => {
    const totalTrainings = trainingStats.length
    const totalHours = trainingStats.reduce((sum, t) => sum + t.totalHours, 0)
    const totalSessions = trainingStats.reduce((sum, t) => sum + t.sessions, 0)
    const totalParticipants = new Set(filteredData.map(r => r.sicilNo)).size

    return {
      totalTrainings,
      totalHours: Math.round(totalHours),
      totalSessions,
      totalParticipants
    }
  }, [trainingStats, filteredData])

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
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
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

          <div className="mt-4 space-y-2">
            <Label>Gösterilecek Eğitim Sayısı</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">İlk 10</SelectItem>
                <SelectItem value="20">İlk 20</SelectItem>
                <SelectItem value="50">İlk 50</SelectItem>
                <SelectItem value="100">İlk 100</SelectItem>
              </SelectContent>
            </Select>
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
              Toplam Eğitim Türü
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTrainings}</div>
            <p className="text-xs text-muted-foreground">Farklı eğitim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Saat
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalHours.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Saat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Oturum
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Oturum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Katılımcı
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalParticipants.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Kişi</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Chart */}
      <Card>
        <CardHeader>
          <CardTitle>En Popüler 10 Eğitim - {year}</CardTitle>
          <CardDescription>Toplam eğitim saati ve katılımcı sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={200} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="Toplam Saat" fill="#2563eb" radius={[0, 8, 8, 0]} />
              <Bar dataKey="Katılımcı" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eğitim Sıralaması - İlk {limit}</CardTitle>
          <CardDescription>Toplam saate göre sıralanmış eğitimler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">#</TableHead>
                  <TableHead className="font-bold">Eğitim Adı</TableHead>
                  <TableHead className="font-bold">Kod</TableHead>
                  <TableHead className="font-bold">Tür</TableHead>
                  <TableHead className="font-bold text-right">Toplam Saat</TableHead>
                  <TableHead className="font-bold text-right">Oturum</TableHead>
                  <TableHead className="font-bold text-right">Katılımcı</TableHead>
                  <TableHead className="font-bold text-right">Ort. Saat/Kişi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTrainings.map((training, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {idx < 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {idx + 1}
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-md">{training.name}</TableCell>
                    <TableCell className="font-mono text-sm">{training.code}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {training.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{Math.round(training.totalHours).toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{training.sessions.toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{training.participants.toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{training.avgHoursPerParticipant}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
