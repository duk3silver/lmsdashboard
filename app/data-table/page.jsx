"use client"

import { useState, useEffect, useMemo } from 'react'
import { FileText, Download, Search, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useData } from '@/components/providers/data-provider'
import { usePageHeader } from '@/components/providers/page-header-provider'
import { toast } from 'sonner'

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

export default function DataTablePage() {
  const { cleanedData } = useData()
  const { setPageHeader } = usePageHeader()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  useEffect(() => {
    setPageHeader({
      title: "Eğitim Verileri",
      description: "Tüm eğitim kayıtları - sertifikalar dahil, filtre yok, sadece arama",
      icon: FileText
    })
  }, [setPageHeader])

  // Filter data only by search term - NO other filters, includes ALL training types including certificates
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return cleanedData // Return ALL data if no search term
    }

    const search = searchTerm.toLocaleLowerCase('tr').trim()
    return cleanedData.filter(row => {
      // Combine first and last name for full name search
      const fullName = `${row.adi || ''} ${row.soyadi || ''}`.toLocaleLowerCase('tr')

      return (
        (row.sicilNo && String(row.sicilNo).toLocaleLowerCase('tr').includes(search)) ||
        (row.adi && row.adi.toLocaleLowerCase('tr').includes(search)) ||
        (row.soyadi && row.soyadi.toLocaleLowerCase('tr').includes(search)) ||
        fullName.includes(search) || // Search in full name
        (row.egitimAdi && row.egitimAdi.toLocaleLowerCase('tr').includes(search)) ||
        (row.egitimTuru && row.egitimTuru.toLocaleLowerCase('tr').includes(search)) ||
        (row.bolum && row.bolum.toLocaleLowerCase('tr').includes(search)) ||
        (row.sirket && row.sirket.toLocaleLowerCase('tr').includes(search))
      )
    })
  }, [cleanedData, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('Dışa aktarılacak veri yok')
      return
    }

    // Create CSV header
    const headers = [
      'Sicil No',
      'Ad',
      'Soyad',
      'Eğitim Adı',
      'Süre (Saat)',
      'Başlangıç',
      'Bitiş',
      'Eğitim Türü',
      'Cinsiyet',
      'Şirket',
      'Bölüm',
      'Pozisyon',
      'Personel Statü'
    ]

    // Create CSV rows
    const rows = filteredData.map(row => [
      row.sicilNo || '',
      row.adi || '',
      row.soyadi || '',
      row.egitimAdi || '',
      row.sure || 0,
      formatDate(row.baslangic),
      formatDate(row.bitis),
      row.egitimTuru || '',
      row.cinsiyet || '',
      row.sirket || '',
      row.bolum || '',
      row.pozisyon || '',
      row.personelStatu || ''
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `egitim_kayitlari_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('CSV dosyası başarıyla dışa aktarıldı!', {
      description: `${filteredData.length} kayıt dışa aktarıldı`
    })
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
      {/* Search Only */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Arama</CardTitle>
          <CardDescription>Sicil no, ad, soyad, eğitim adı, tür, departman veya şirket ara</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Arama yapın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Toplam <span className="font-bold">{filteredData.length.toLocaleString('tr-TR')}</span> kayıt bulundu
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          CSV Olarak Dışa Aktar
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eğitim Kayıtları</CardTitle>
          <CardDescription>
            Sayfa {currentPage} / {totalPages} ({paginatedData.length} kayıt gösteriliyor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Sicil No</TableHead>
                  <TableHead className="font-bold">Ad Soyad</TableHead>
                  <TableHead className="font-bold">Eğitim Adı</TableHead>
                  <TableHead className="font-bold text-right">Süre</TableHead>
                  <TableHead className="font-bold">Başlangıç</TableHead>
                  <TableHead className="font-bold">Eğitim Türü</TableHead>
                  <TableHead className="font-bold">Bölüm</TableHead>
                  <TableHead className="font-bold">Cinsiyet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{row.sicilNo}</TableCell>
                    <TableCell className="font-medium">{row.adi} {row.soyadi}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.egitimAdi}</TableCell>
                    <TableCell className="text-right">{row.sure} saat</TableCell>
                    <TableCell>{formatDate(row.baslangic)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {row.egitimTuru}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{row.bolum}</TableCell>
                    <TableCell>{row.cinsiyet}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Label>Sayfa başına kayıt:</Label>
              <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                İlk
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Son
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
