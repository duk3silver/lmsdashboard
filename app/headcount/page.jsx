"use client"

import { useState, useEffect, useMemo } from 'react'
import { Users, Save, Download, Upload as UploadIcon, Sparkles, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useData } from '@/components/providers/data-provider'
import { usePageHeader } from '@/components/providers/page-header-provider'

const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

export default function HeadcountPage() {
  const { headcounts, setHeadcounts, availableYears } = useData()
  const { setPageHeader } = usePageHeader()
  const [selectedYear, setSelectedYear] = useState('2024')
  const [tableData, setTableData] = useState([])
  const [newYear, setNewYear] = useState('')

  useEffect(() => {
    setPageHeader({
      title: "Mevcudiyet Yönetimi",
      description: "Aylık çalışan mevcudiyet verilerini yönetin",
      icon: Users
    })
  }, [setPageHeader])

  useEffect(() => {
    loadTableData()
  }, [selectedYear, headcounts])

  // Get all available years from headcounts and training data
  const manageableYears = useMemo(() => {
    const yearsSet = new Set()

    // Add years from headcounts
    Object.keys(headcounts).forEach(year => yearsSet.add(year))

    // Add years from training data
    availableYears.forEach(year => yearsSet.add(String(year)))

    // Convert to array and sort descending
    return Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a))
  }, [headcounts, availableYears])

  const loadTableData = () => {
    const yearData = headcounts[selectedYear] || { men: Array(12).fill(0), women: Array(12).fill(0) }
    const data = monthNames.map((month, idx) => ({
      month,
      men: yearData.men[idx] || 0,
      women: yearData.women[idx] || 0,
      total: (yearData.men[idx] || 0) + (yearData.women[idx] || 0)
    }))
    setTableData(data)
  }

  const handleValueChange = (index, field, value) => {
    const newTableData = [...tableData]
    newTableData[index][field] = parseInt(value) || 0
    newTableData[index].total = newTableData[index].men + newTableData[index].women
    setTableData(newTableData)
  }

  const handleSave = () => {
    const newHeadcounts = { ...headcounts }
    newHeadcounts[selectedYear] = {
      men: tableData.map(row => row.men),
      women: tableData.map(row => row.women)
    }
    setHeadcounts(newHeadcounts)
    toast.success('Kadro verileri başarıyla kaydedildi!')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(headcounts, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'kadro_verileri_' + new Date().toISOString().slice(0, 10) + '.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Kadro verileri dışa aktarıldı!')
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        setHeadcounts(imported)
        loadTableData()
        toast.success('Kadro verileri başarıyla içe aktarıldı!')
      } catch (error) {
        toast.error('Dosya içe aktarılırken hata oluştu. Lütfen dosya formatını kontrol edin.')
      }
    }
    reader.readAsText(file)
  }

  const handleAddYear = () => {
    const year = newYear.trim()
    if (!year) {
      toast.error('Lütfen bir yıl girin')
      return
    }

    const yearNum = parseInt(year)
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      toast.error('Geçerli bir yıl girin (2000-2100)')
      return
    }

    if (manageableYears.includes(String(yearNum))) {
      toast.error('Bu yıl zaten mevcut')
      return
    }

    // Add empty data for the new year
    const newHeadcounts = { ...headcounts }
    newHeadcounts[String(yearNum)] = {
      men: Array(12).fill(0),
      women: Array(12).fill(0)
    }
    setHeadcounts(newHeadcounts)
    setSelectedYear(String(yearNum))
    setNewYear('')
    toast.success(`${yearNum} yılı eklendi`)
  }

  const handleDeleteYear = (year) => {
    if (!confirm(`${year} yılını ve tüm verilerini silmek istediğinizden emin misiniz?`)) {
      return
    }

    const newHeadcounts = { ...headcounts }
    delete newHeadcounts[year]
    setHeadcounts(newHeadcounts)

    // Switch to a different year if the current one is deleted
    if (selectedYear === year) {
      const remainingYears = manageableYears.filter(y => y !== year)
      setSelectedYear(remainingYears.length > 0 ? remainingYears[0] : '2024')
    }

    toast.success(`${year} yılı silindi`)
  }

  const totalMen = tableData.reduce((sum, row) => sum + row.men, 0)
  const totalWomen = tableData.reduce((sum, row) => sum + row.women, 0)
  const totalAll = totalMen + totalWomen
  const avgMen = (totalMen / 12).toFixed(1)
  const avgWomen = (totalWomen / 12).toFixed(1)
  const avgTotal = (totalAll / 12).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="border-primary/30 bg-primary/5">
        <Sparkles className="h-5 w-5 text-primary" />
        <AlertDescription className="ml-2">
          <strong>Nasıl kullanılır:</strong> Her ay için erkek ve kadın personel sayılarını ayrı ayrı girin.
          Toplam otomatik olarak hesaplanır. Veriler localStorage'a kaydedilir ve "Kişi Başı Ortalama" hesaplamalarında kullanılır.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Kadro Kontrolü</CardTitle>
          <CardDescription>Aylık çalışan sayılarını düzenleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full md:w-64">
            <Label htmlFor="year-select" className="text-base font-medium">Yıl Seçin</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {manageableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-year" className="text-base font-medium">Yeni Yıl Ekle</Label>
            <div className="flex gap-2">
              <Input
                id="new-year"
                type="number"
                min="2000"
                max="2100"
                placeholder="Örn: 2026"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddYear()}
                className="w-32"
              />
              <Button onClick={handleAddYear} variant="outline" size="default" className="gap-2">
                <Plus className="w-4 h-4" />
                Ekle
              </Button>
              {manageableYears.includes(selectedYear) && headcounts[selectedYear] && (
                <Button
                  onClick={() => handleDeleteYear(selectedYear)}
                  variant="destructive"
                  size="default"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedYear} Yılını Sil
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} className="gap-2 shadow-md" size="lg">
              <Save className="w-4 h-4" />
              Değişiklikleri Kaydet
            </Button>
            <Button onClick={handleExport} variant="outline" className="gap-2" size="lg">
              <Download className="w-4 h-4" />
              JSON Dışa Aktar
            </Button>
            <Button
              onClick={() => document.getElementById('headcountImport').click()}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <UploadIcon className="w-4 h-4" />
              JSON İçe Aktar
            </Button>
            <input
              id="headcountImport"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ortalama Erkek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMen}</div>
            <p className="text-xs text-muted-foreground">kişi/ay</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ortalama Kadın
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWomen}</div>
            <p className="text-xs text-muted-foreground">kişi/ay</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ortalama Toplam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTotal}</div>
            <p className="text-xs text-muted-foreground">kişi/ay</p>
          </CardContent>
        </Card>
      </div>

      {/* Headcount Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Kadro - {selectedYear}</CardTitle>
          <CardDescription>Her ay için erkek ve kadın çalışan sayılarını girin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-primary/10 to-accent/10">
                  <TableHead className="font-bold text-base">Ay</TableHead>
                  <TableHead className="font-bold text-base">Erkek</TableHead>
                  <TableHead className="font-bold text-base">Kadın</TableHead>
                  <TableHead className="font-bold text-base">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-accent/50">
                    <TableCell className="font-semibold text-base">{row.month}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={row.men}
                        onChange={(e) => handleValueChange(idx, 'men', e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={row.women}
                        onChange={(e) => handleValueChange(idx, 'women', e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-lg">{row.total.toLocaleString('tr-TR')}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell className="text-base">TOPLAM</TableCell>
                  <TableCell className="text-lg">{totalMen.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-lg">{totalWomen.toLocaleString('tr-TR')}</TableCell>
                  <TableCell className="text-xl text-primary">{totalAll.toLocaleString('tr-TR')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
