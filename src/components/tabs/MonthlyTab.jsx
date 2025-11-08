import { useState, useEffect, useMemo } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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

const MonthlyTab = ({ cleanedData }) => {
  const [year, setYear] = useState('2024')
  const [month, setMonth] = useState('ALL')
  const [trainingType, setTrainingType] = useState('ALL')

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

  const trainingTypes = useMemo(() => {
    // Get unique types from data (excluding certificate)
    const dataTypes = [...new Set(cleanedData.map(r => r.egitimTuru))].filter(t => t && t !== 'EHLİYET-SERTİFİKA')

    // Define the desired order
    const orderMap = {
      'MESLEKİ': 1,
      'İSG': 2,
      'ÇEVRE': 3,
      'YETİŞTİRME': 4,
      'KİŞİSEL GELİŞİM': 5,
      'TEKNİK': 6
    }

    // Sort by predefined order, then alphabetically
    const sorted = dataTypes.sort((a, b) => {
      const orderA = orderMap[a] || 999
      const orderB = orderMap[b] || 999

      if (orderA !== orderB) return orderA - orderB
      return a.localeCompare(b, 'tr')
    })

    return sorted
  }, [cleanedData])

  const sessionCounts = useMemo(() => {
    const filtered = cleanedData.filter(row => {
      const date = parseDate(row.baslangic)
      if (!date || date.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false

      if (month !== 'ALL' && date.getMonth() !== parseInt(month)) return false
      if (trainingType !== 'ALL' && row.egitimTuru !== trainingType) return false

      return true
    })

    const sessionCounts = {}
    filtered.forEach(row => {
      const key = row.egitimAdi || 'Bilinmeyen'
      if (!sessionCounts[key]) {
        sessionCounts[key] = { count: 0, sessions: new Set() }
      }
      sessionCounts[key].sessions.add(row.egitimKayitNo)
    })

    return Object.entries(sessionCounts)
      .map(([name, data]) => ({
        name,
        count: data.sessions.size
      }))
      .sort((a, b) => b.count - a.count)
  }, [cleanedData, year, month, trainingType])

  if (cleanedData.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-muted-foreground text-lg">No data uploaded yet</p>
          <p className="text-muted-foreground text-sm">Please upload an Excel file in the Upload tab</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize your view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
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
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Yıl</SelectItem>
                  {monthNames.map((name, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Training Type</Label>
              <Select value={trainingType} onValueChange={setTrainingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  {trainingTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Counts */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Training Sessions
              </CardTitle>
              <CardDescription>Number of occurrences (sorted by frequency)</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {sessionCounts.length} Unique
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sessionCounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data found for selected filters</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {sessionCounts.map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/20 to-background border rounded-lg hover:shadow-md transition-all duration-200 hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-foreground font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{session.name}</p>
                      </div>
                    </div>
                    <Badge className="ml-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-foreground text-base px-4 py-2">
                      {session.count}×
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MonthlyTab
