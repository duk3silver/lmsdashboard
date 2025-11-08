"use client"

import { useState, useEffect, useMemo } from 'react'
import { Award, Users, TrendingUp, FileCheck, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
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

export default function SertifikalarPage() {
  const { cleanedData, rawData, availableYears } = useData()
  const { setPageHeader } = usePageHeader()
  const [year, setYear] = useState('ALL')
  const [company, setCompany] = useState('Nemport')
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)

  useEffect(() => {
    setPageHeader({
      title: "Sertifikalar",
      description: "Personel sertifika ve ehliyet analizi",
      icon: Award
    })
  }, [setPageHeader])

  // Process rawData to get all data including certificates
  const allData = useMemo(() => {
    if (!rawData || rawData.length === 0) return []

    // Clean the raw data (similar to upload logic)
    let data = rawData.slice(2)
    let dataRows = data.slice(1)

    dataRows = dataRows.filter(row => {
      return row[0] !== 'Sicil Numarası' && row[0] !== 'Eğitim Katılımcıları'
    })

    const cleaned = dataRows.map(row => {
      // Normalize training type to uppercase
      let trainingType = row[9] ? String(row[9]).toUpperCase() : row[9]

      // Special handling for Turkish uppercase İ
      if (trainingType === 'ISG' || trainingType === 'İSG') {
        trainingType = 'İSG'
      }
      if (trainingType === 'TEKNIK' || trainingType === 'TEKNİK') {
        trainingType = 'TEKNİK'
      }

      return {
        sicilNo: row[0],
        adi: row[1],
        soyadi: row[2],
        egitimKayitNo: row[3],
        egitimKodu: row[4],
        egitimAdi: row[5],
        sure: parseFloat(row[6]) || 0,
        baslangic: row[7],
        bitis: row[8],
        egitimTuru: trainingType,
        cinsiyet: row[10],
        sirket: row[11],
        bolum: row[12],
        pozisyon: row[13],
        personelStatu: row[17]
      }
    }).filter(row => row.sirket && row.sicilNo)

    return cleaned
  }, [rawData])

  // Filter certificate data from allData
  const certificateData = useMemo(() => {
    return allData.filter(row => {
      // Check if it's a certificate
      if (row.egitimTuru !== 'EHLİYET-SERTİFİKA') return false

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
  }, [allData, year, company])

  // Calculate metrics
  const metrics = useMemo(() => {
    const uniqueEmployees = new Set(certificateData.map(r => r.sicilNo)).size
    const totalCertificates = certificateData.length
    const certificateTypes = new Set(certificateData.map(r => r.egitimAdi)).size

    // Find most common certificate
    const certCounts = {}
    certificateData.forEach(row => {
      const certName = row.egitimAdi || 'Bilinmeyen'
      certCounts[certName] = (certCounts[certName] || 0) + 1
    })
    const mostCommon = Object.entries(certCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      uniqueEmployees,
      totalCertificates,
      certificateTypes,
      mostCommonCert: mostCommon ? mostCommon[0] : 'N/A',
      mostCommonCount: mostCommon ? mostCommon[1] : 0
    }
  }, [certificateData])

  // Monthly breakdown - all certificates per month
  const monthlyData = useMemo(() => {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const monthlyStats = {}
    const allCertTypes = new Set()

    certificateData.forEach(row => {
      const date = parseDate(row.baslangic)
      if (!date) return

      const monthKey = date.getMonth()
      const monthLabel = monthNames[monthKey]

      if (!monthlyStats[monthLabel]) {
        monthlyStats[monthLabel] = { month: monthLabel, monthIndex: monthKey }
      }

      const certName = row.egitimAdi || 'Bilinmeyen'
      allCertTypes.add(certName)
      monthlyStats[monthLabel][certName] = (monthlyStats[monthLabel][certName] || 0) + 1
    })

    return {
      data: Object.values(monthlyStats).sort((a, b) => a.monthIndex - b.monthIndex),
      certTypes: Array.from(allCertTypes)
    }
  }, [certificateData])

  // Overall certificate breakdown
  const overallBreakdown = useMemo(() => {
    const breakdown = {}

    certificateData.forEach(row => {
      const certName = row.egitimAdi || 'Bilinmeyen'
      if (!breakdown[certName]) {
        breakdown[certName] = {
          name: certName,
          count: 0,
          employees: new Set()
        }
      }
      breakdown[certName].count++
      breakdown[certName].employees.add(row.sicilNo)
    })

    return Object.values(breakdown)
      .map(b => ({
        name: b.name,
        count: b.count,
        employees: b.employees.size
      }))
      .sort((a, b) => b.count - a.count)
  }, [certificateData])

  // Generate colors for certificate types
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#a855f7']

  if (!rawData || rawData.length === 0 || allData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Award className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-lg">Henüz veri yüklenmedi</p>
            <p className="text-muted-foreground text-sm">Lütfen Yükle sekmesinden bir Excel dosyası yükleyin</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (certificateData.length === 0) {
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
            <Award className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-lg">Seçili filtrelerde sertifika kaydı bulunamadı</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Sertifika</CardTitle>
              <Award className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalCertificates.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Verilen sertifika</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sertifikalı Personel</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Sertifika Çeşidi</CardTitle>
              <FileCheck className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.certificateTypes.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Farklı sertifika türü</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Popüler</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={metrics.mostCommonCert}>
              {metrics.mostCommonCert.length > 20 ? metrics.mostCommonCert.substring(0, 20) + '...' : metrics.mostCommonCert}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.mostCommonCount} kez verildi</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stacked Chart */}
      {monthlyData.data.length > 0 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Aylık Sertifika Dağılımı</CardTitle>
            <CardDescription>Her ay verilen sertifikaların türlere göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
                      return (
                        <div className="bg-background border border-border p-3 rounded-lg shadow-lg max-w-sm">
                          <p className="font-medium mb-2">{label}</p>
                          <p className="text-sm font-semibold mb-1">Toplam: {total} sertifika</p>
                          {payload
                            .sort((a, b) => b.value - a.value)
                            .map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.value}
                              </p>
                            ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                {monthlyData.certTypes.slice(0, 10).map((certType, idx) => (
                  <Bar
                    key={certType}
                    dataKey={certType}
                    stackId="a"
                    fill={colors[idx % colors.length]}
                    name={certType.length > 30 ? certType.substring(0, 30) + '...' : certType}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {monthlyData.certTypes.length > 10 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                En popüler 10 sertifika gösteriliyor. Toplam {monthlyData.certTypes.length} farklı sertifika türü var.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Certificate Breakdown */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Sertifika Türleri</CardTitle>
          <CardDescription>Sertifika türlerine göre dağılım (En popüler 15)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(400, Math.min(overallBreakdown.length, 15) * 40)}>
            <BarChart data={overallBreakdown.slice(0, 15)} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={290}
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
                        <p className="text-sm text-muted-foreground">Toplam: {data.count} sertifika</p>
                        <p className="text-sm text-muted-foreground">Personel: {data.employees} kişi</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Sertifika Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
