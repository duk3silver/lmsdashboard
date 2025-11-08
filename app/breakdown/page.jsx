"use client"

import { useState, useEffect, useMemo } from 'react'
import { PieChart as PieChartIcon, BookOpen, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
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

const COLORS = [
  '#2563eb', // blue
  '#f59e0b', // amber
  '#10b981', // green
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
]

export default function BreakdownPage() {
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
      title: "Dağılım Analizi",
      description: "Eğitim saatlerinin tür, cinsiyet, departman ve statüye göre dağılımı",
      icon: PieChartIcon
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

  // Training Type Distribution (by hours)
  const trainingTypeData = useMemo(() => {
    const breakdown = {}
    filteredData.forEach(row => {
      const type = row.egitimTuru || 'Belirtilmemiş'
      if (!breakdown[type]) breakdown[type] = 0
      breakdown[type] += row.sure || 0
    })

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [filteredData])

  // Gender Distribution (by hours)
  const genderData = useMemo(() => {
    const breakdown = {}
    filteredData.forEach(row => {
      const g = row.cinsiyet || 'Belirtilmemiş'
      if (!breakdown[g]) breakdown[g] = 0
      breakdown[g] += row.sure || 0
    })

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [filteredData])

  // Department Distribution (by hours) - Top 10
  const departmentData = useMemo(() => {
    const breakdown = {}
    filteredData.forEach(row => {
      const dept = row.bolum || 'Belirtilmemiş'
      if (!breakdown[dept]) breakdown[dept] = 0
      breakdown[dept] += row.sure || 0
    })

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 departments
  }, [filteredData])

  // Personnel Status Distribution (by hours)
  const collarData = useMemo(() => {
    const breakdown = {}
    filteredData.forEach(row => {
      const c = row.personelStatu || 'Belirtilmemiş'
      if (!breakdown[c]) breakdown[c] = 0
      breakdown[c] += row.sure || 0
    })

    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
  }, [filteredData])

  // Average Hours Per Person by Gender
  const genderAverageData = useMemo(() => {
    const stats = {}
    filteredData.forEach(row => {
      const g = row.cinsiyet || 'Belirtilmemiş'
      if (!stats[g]) {
        stats[g] = {
          hours: 0,
          people: new Set()
        }
      }
      stats[g].hours += row.sure || 0
      stats[g].people.add(row.sicilNo)
    })

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        value: data.people.size > 0 ? parseFloat((data.hours / data.people.size).toFixed(2)) : 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filteredData])

  // Average Hours Per Person by Personnel Status
  const collarAverageData = useMemo(() => {
    const stats = {}
    filteredData.forEach(row => {
      const c = row.personelStatu || 'Belirtilmemiş'
      if (!stats[c]) {
        stats[c] = {
          hours: 0,
          people: new Set()
        }
      }
      stats[c].hours += row.sure || 0
      stats[c].people.add(row.sicilNo)
    })

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        value: data.people.size > 0 ? parseFloat((data.hours / data.people.size).toFixed(2)) : 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [filteredData])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = data.payload.totalValue || 0
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toLocaleString('tr-TR')} saat ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const AverageTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Kişi Başı: {data.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} saat
          </p>
          <p className="text-sm text-muted-foreground">
            Oran: {percentage}%
          </p>
        </div>
      )
    }
    return null
  }

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

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Training Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Eğitim Türü Dağılımı</CardTitle>
            <CardDescription>Toplam eğitim saatlerinin türlere göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={trainingTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trainingTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cinsiyet Dağılımı</CardTitle>
            <CardDescription>Toplam eğitim saatlerinin cinsiyete göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Average Hours Per Person */}
        <Card>
          <CardHeader>
            <CardTitle>Kişi Başı Ortalama (Cinsiyet)</CardTitle>
            <CardDescription>Cinsiyete göre kişi başı ortalama eğitim saatleri</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={genderAverageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderAverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<AverageTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Departman Dağılımı (İlk 10)</CardTitle>
            <CardDescription>En fazla eğitim alan departmanlar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.substring(0, 15)}...: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Personnel Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Personel Statü Dağılımı</CardTitle>
            <CardDescription>Toplam eğitim saatlerinin statüye göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={collarData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {collarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Personnel Status Average Hours Per Person */}
        <Card>
          <CardHeader>
            <CardTitle>Kişi Başı Ortalama (Personel Statüsü)</CardTitle>
            <CardDescription>Personel statüsüne göre kişi başı ortalama eğitim saatleri</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={collarAverageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {collarAverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<AverageTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
