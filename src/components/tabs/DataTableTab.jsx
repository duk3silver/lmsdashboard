import { useState, useMemo } from 'react'
import { Search, Download, RotateCcw, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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

const DataTableTab = ({ cleanedData }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRows, setFilteredRows] = useState([])
  const [isSearched, setIsSearched] = useState(false)

  const displayData = useMemo(() => {
    if (!isSearched) {
      return cleanedData.filter(row => row.egitimTuru !== 'EHLİYET-SERTİFİKA').slice(0, 100)
    }
    return filteredRows
  }, [cleanedData, filteredRows, isSearched])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.info('Please enter a search term')
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = cleanedData.filter(row => {
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false
      const searchString = `${row.adi} ${row.soyadi} ${row.egitimAdi} ${row.egitimTuru} ${row.bolum} ${row.pozisyon}`.toLowerCase()
      return searchString.includes(term)
    })

    setFilteredRows(filtered)
    setIsSearched(true)
    toast.success(`Found ${filtered.length} results`)
  }

  const handleReset = () => {
    setSearchTerm('')
    setFilteredRows([])
    setIsSearched(false)
    toast.info('Search cleared')
  }

  const handleExport = () => {
    let csv = '\uFEFF'
    csv += 'Ad Soyad,Eğitim Adı,Eğitim Türü,Süre (Saat),Başlangıç,Bitiş,Şirket,Bölüm,Pozisyon,Cinsiyet,Statü\n'

    cleanedData.forEach(row => {
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return

      const startDate = parseDate(row.baslangic)
      const endDate = parseDate(row.bitis)

      csv += `"${row.adi} ${row.soyadi}","${row.egitimAdi || '-'}","${row.egitimTuru || '-'}",${row.sure},`
      csv += `"${startDate ? startDate.toLocaleDateString('tr-TR') : '-'}","${endDate ? endDate.toLocaleDateString('tr-TR') : '-'}",`
      csv += `"${row.sirket || '-'}","${row.bolum || '-'}","${row.pozisyon || '-'}","${row.cinsiyet || '-'}","${row.personelStatu || '-'}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'egitim_verileri_' + new Date().toISOString().slice(0, 10) + '.csv'
    link.click()
    URL.revokeObjectURL(link.href)

    toast.success('Data exported successfully')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (cleanedData.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-muted-foreground text-lg">No data uploaded yet</p>
          <p className="text-muted-foreground text-sm">Please upload an Excel file in the Upload tab</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                {isSearched
                  ? `Showing ${filteredRows.length} search results`
                  : `Showing first 100 of ${cleanedData.filter(r => r.egitimTuru !== 'EHLİYET-SERTİFİKA').length} records`
                }
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, training, department, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border shadow-lg ">
        <CardContent className="p-0">
          <ScrollArea className="h-[700px]">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-100 z-10">
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Training</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Start</TableHead>
                  <TableHead className="font-semibold">End</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Position</TableHead>
                  <TableHead className="font-semibold">Gender</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, idx) => {
                    const startDate = parseDate(row.baslangic)
                    const endDate = parseDate(row.bitis)

                    return (
                      <TableRow key={idx} className="hover:bg-primary/5">
                        <TableCell className="font-medium">{row.adi} {row.soyadi}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.egitimAdi || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {row.egitimTuru || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.sure}h</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {startDate ? startDate.toLocaleDateString('tr-TR') : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {endDate ? endDate.toLocaleDateString('tr-TR') : '-'}
                        </TableCell>
                        <TableCell>{row.sirket || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.bolum || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.pozisyon || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={row.cinsiyet === 'Erkek' ? 'default' : 'secondary'}>
                            {row.cinsiyet || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.personelStatu || '-'}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataTableTab
