"use client"

import { useState, useEffect, useMemo } from 'react'
import { Building2, BookOpen, TrendingUp, ChevronDown } from 'lucide-react'
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

export default function DepartmentPage() {
  const { cleanedData, availableYears } = useData()
  const { setPageHeader } = usePageHeader()
  const [year, setYear] = useState('2024')
  const [trainingTypes, setTrainingTypes] = useState([])
  const [company, setCompany] = useState('Nemport')
  const [gender, setGender] = useState('ALL')
  const [collar, setCollar] = useState('ALL')
  const [sortBy, setSortBy] = useState('hours') // hours, employees, sessions
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    setPageHeader({
      title: "Departman Analitiği",
      description: "Departmanlara göre eğitim metriklerini analiz edin",
      icon: Building2
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

  const filteredData = useMemo(() => {
    return cleanedData.filter(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false

      if (trainingTypes.length > 0 && !trainingTypes.includes(row.egitimTuru)) return false

      if (company === 'Nemport') {
        if (!row.sirket || !row.sirket.toLowerCase().includes('nemport')) return false
      } else if (company !== 'ALL') {
        if (row.sirket !== company) return false
      }

      if (gender !== 'ALL' && row.cinsiyet !== gender) return false
      if (collar !== 'ALL' && row.personelStatu !== collar) return false

      return true
    })
  }, [cleanedData, year, trainingTypes, company, gender, collar])

  const departmentStats = useMemo(() => {
    const stats = {}

    filteredData.forEach(row => {
      const dept = row.bolum || 'Belirtilmemiş'
      if (!stats[dept]) {
        stats[dept] = {
          department: dept,
          hours: 0,
          sessions: 0,
          employees: new Set(),
          trainingTypes: {}
        }
      }

      stats[dept].hours += row.sure || 0
      stats[dept].sessions++
      stats[dept].employees.add(row.sicilNo)

      const type = row.egitimTuru || 'Diğer'
      stats[dept].trainingTypes[type] = (stats[dept].trainingTypes[type] || 0) + (row.sure || 0)
    })

    // Convert to array and calculate additional metrics
    const statsArray = Object.values(stats).map(dept => ({
      ...dept,
      employees: dept.employees.size,
      avgHoursPerEmployee: dept.employees.size > 0 ? (dept.hours / dept.employees.size).toFixed(1) : 0,
      avgHoursPerSession: dept.sessions > 0 ? (dept.hours / dept.sessions).toFixed(1) : 0
    }))

    // Sort based on selected criteria
    statsArray.sort((a, b) => {
      if (sortBy === 'hours') return b.hours - a.hours
      if (sortBy === 'employees') return b.employees - a.employees
      if (sortBy === 'sessions') return b.sessions - a.sessions
      return 0
    })

    return statsArray
  }, [filteredData, sortBy])

  const topDepartments = departmentStats.slice(0, 10)

  const chartData = topDepartments.map(dept => ({
    name: dept.department.length > 20 ? dept.department.substring(0, 20) + '...' : dept.department,
    'Toplam Saat': Math.round(dept.hours),
    'Çalışan Sayısı': dept.employees
  }))

  const metrics = useMemo(() => {
    const totalDepartments = departmentStats.length
    const totalHours = departmentStats.reduce((sum, d) => sum + d.hours, 0)
    const totalEmployees = new Set(filteredData.map(r => r.sicilNo)).size
    const avgHoursPerDept = totalDepartments > 0 ? (totalHours / totalDepartments).toFixed(1) : 0

    return {
      totalDepartments,
      totalHours: Math.round(totalHours),
      totalEmployees,
      avgHoursPerDept
    }
  }, [departmentStats, filteredData])

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
              <Label>Sıralama Kriteri</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Toplam Saat</SelectItem>
                  <SelectItem value="employees">Çalışan Sayısı</SelectItem>
                  <SelectItem value="sessions">Oturum Sayısı</SelectItem>
                </SelectContent>
              </Select>
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
              Toplam Departman
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Departman</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Eğitim Saati
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalHours.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Saat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Çalışan
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEmployees.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Kişi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ort. Saat/Departman
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgHoursPerDept}</div>
            <p className="text-xs text-muted-foreground">Saat</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Chart */}
      <Card>
        <CardHeader>
          <CardTitle>En Aktif 10 Departman - {year}</CardTitle>
          <CardDescription>Toplam eğitim saati ve çalışan sayısı</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={100}
              />
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
              <Bar dataKey="Toplam Saat" fill="#2563eb" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Çalışan Sayısı" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Departmanlar - Detaylı İstatistikler</CardTitle>
          <CardDescription>{departmentStats.length} departman listeleniyor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">#</TableHead>
                  <TableHead className="font-bold">Departman</TableHead>
                  <TableHead className="font-bold text-right">Toplam Saat</TableHead>
                  <TableHead className="font-bold text-right">Oturum</TableHead>
                  <TableHead className="font-bold text-right">Çalışan</TableHead>
                  <TableHead className="font-bold text-right">Ort. Saat/Çalışan</TableHead>
                  <TableHead className="font-bold text-right">Ort. Saat/Oturum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentStats.map((dept, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium max-w-xs">{dept.department}</TableCell>
                    <TableCell className="text-right">{Math.round(dept.hours).toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{dept.sessions.toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{dept.employees.toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-right">{dept.avgHoursPerEmployee}</TableCell>
                    <TableCell className="text-right">{dept.avgHoursPerSession}</TableCell>
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
