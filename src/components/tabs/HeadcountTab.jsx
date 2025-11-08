import { useState, useEffect } from 'react'
import { Users, Save, Download, Upload as UploadIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

const HeadcountTab = ({ headcounts, setHeadcounts }) => {
  const [selectedYear, setSelectedYear] = useState('2024')
  const [tableData, setTableData] = useState([])

  useEffect(() => {
    loadTableData()
  }, [selectedYear, headcounts])

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
    toast.success('Headcount data saved successfully!')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(headcounts, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'headcounts_' + new Date().toISOString().slice(0, 10) + '.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Headcount data exported!')
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
        toast.success('Headcount data imported successfully!')
      } catch (error) {
        toast.error('Error importing file. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Users className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900 ml-2">
          <strong>How to use:</strong> Enter monthly headcount numbers separately for men and women.
          The total will be calculated automatically. Data is saved to localStorage and used in "Average per Person" calculations.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Select year and quick fill options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full md:w-64">
            <Label>Select Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
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

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
            <Button
              onClick={() => document.getElementById('headcountImport').click()}
              variant="outline"
              className="gap-2"
            >
              <UploadIcon className="w-4 h-4" />
              Import JSON
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

      {/* Headcount Table */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <CardTitle>Monthly Headcount - {selectedYear}</CardTitle>
          <CardDescription>Enter male and female employee counts for each month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <TableHead className="font-bold">Month</TableHead>
                  <TableHead className="font-bold">Men</TableHead>
                  <TableHead className="font-bold">Women</TableHead>
                  <TableHead className="font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-primary/5">
                    <TableCell className="font-semibold">{row.month}</TableCell>
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
                    <TableCell className="font-bold text-lg">{row.total}</TableCell>
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

export default HeadcountTab
