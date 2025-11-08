import { useState, useEffect, useMemo } from 'react'
import { Award, Users, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const parseDate = (dateStr) => {
  if (!dateStr) return null
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000)
  }
  const date = new Date(dateStr)
  if (!isNaN(date)) return date
  return null
}

const TopTrainingsTab = ({ cleanedData }) => {
  const [year, setYear] = useState('2024')
  const [company, setCompany] = useState('Nemport')

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

  // Filter data
  const filteredData = useMemo(() => {
    return cleanedData.filter(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false

      if (company === 'Nemport') {
        if (!row.sirket || !row.sirket.toLowerCase().includes('nemport')) return false
      } else if (company !== 'ALL') {
        if (row.sirket !== company) return false
      }

      return true
    })
  }, [cleanedData, year, company])

  // Top trainings by sessions
  const topBySessionsData = useMemo(() => {
    const trainingMap = {}
    filteredData.forEach(row => {
      const name = row.egitimAdi || 'Unknown'
      if (!trainingMap[name]) {
        trainingMap[name] = {
          sessions: new Set(),
          hours: 0,
          employees: new Set()
        }
      }
      trainingMap[name].sessions.add(row.egitimKayitNo)
      trainingMap[name].hours += row.sure
      trainingMap[name].employees.add(row.sicilNo)
    })

    return Object.entries(trainingMap)
      .map(([name, data]) => ({
        name,
        sessions: data.sessions.size,
        hours: Math.round(data.hours),
        employees: data.employees.size
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20)
  }, [filteredData])

  // Top trainings by hours
  const topByHoursData = useMemo(() => {
    const trainingMap = {}
    filteredData.forEach(row => {
      const name = row.egitimAdi || 'Unknown'
      if (!trainingMap[name]) {
        trainingMap[name] = {
          sessions: new Set(),
          hours: 0,
          employees: new Set()
        }
      }
      trainingMap[name].sessions.add(row.egitimKayitNo)
      trainingMap[name].hours += row.sure
      trainingMap[name].employees.add(row.sicilNo)
    })

    return Object.entries(trainingMap)
      .map(([name, data]) => ({
        name,
        sessions: data.sessions.size,
        hours: Math.round(data.hours),
        employees: data.employees.size
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 20)
  }, [filteredData])

  // Top trainings by employees
  const topByEmployeesData = useMemo(() => {
    const trainingMap = {}
    filteredData.forEach(row => {
      const name = row.egitimAdi || 'Unknown'
      if (!trainingMap[name]) {
        trainingMap[name] = {
          sessions: new Set(),
          hours: 0,
          employees: new Set()
        }
      }
      trainingMap[name].sessions.add(row.egitimKayitNo)
      trainingMap[name].hours += row.sure
      trainingMap[name].employees.add(row.sicilNo)
    })

    return Object.entries(trainingMap)
      .map(([name, data]) => ({
        name,
        sessions: data.sessions.size,
        hours: Math.round(data.hours),
        employees: data.employees.size
      }))
      .sort((a, b) => b.employees - a.employees)
      .slice(0, 20)
  }, [filteredData])

  if (cleanedData.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Award className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No data uploaded yet</p>
          <p className="text-gray-400 text-sm">Please upload an Excel file in the Upload tab</p>
        </CardContent>
      </Card>
    )
  }

  const renderTrainingList = (data, primaryMetric, primaryLabel, icon, iconColor) => (
    <ScrollArea className="h-[700px] pr-4">
      <div className="space-y-3">
        {data.map((training, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between p-4 bg-card border border rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${iconColor} rounded-full flex items-center justify-center text-foreground font-bold`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base mb-2 break-words">{training.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {training.hours} hours
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    {training.sessions} sessions
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {training.employees} people
                  </Badge>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
              {icon}
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{training[primaryMetric]}</div>
                <div className="text-xs text-card-foreground">{primaryLabel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize your view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Company</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nemport">Nemport</SelectItem>
                  <SelectItem value="ALL">All Companies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different rankings */}
      <Card className="border shadow-lg ">
        <CardContent className="p-6">
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="sessions" className="gap-2">
                <Award className="w-4 h-4" />
                By Sessions
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-2">
                <Clock className="w-4 h-4" />
                By Hours
              </TabsTrigger>
              <TabsTrigger value="employees" className="gap-2">
                <Users className="w-4 h-4" />
                By Employees
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Ranked by Number of Sessions</h3>
                    <p className="text-sm text-muted-foreground">Training courses with the most occurrences</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Top 20
                  </Badge>
                </div>
                {renderTrainingList(
                  topBySessionsData,
                  'sessions',
                  'sessions',
                  <Award className="w-6 h-6 text-yellow-400" />,
                  'from-yellow-500 to-amber-600'
                )}
              </div>
            </TabsContent>

            <TabsContent value="hours">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Ranked by Total Hours</h3>
                    <p className="text-sm text-muted-foreground">Training courses with the most hours delivered</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Top 20
                  </Badge>
                </div>
                {renderTrainingList(
                  topByHoursData,
                  'hours',
                  'hours',
                  <Clock className="w-6 h-6 text-blue-400" />,
                  'from-blue-500 to-indigo-600'
                )}
              </div>
            </TabsContent>

            <TabsContent value="employees">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Ranked by Employees Trained</h3>
                    <p className="text-sm text-muted-foreground">Training courses that reached the most people</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Top 20
                  </Badge>
                </div>
                {renderTrainingList(
                  topByEmployeesData,
                  'employees',
                  'employees',
                  <Users className="w-6 h-6 text-green-400" />,
                  'from-green-500 to-emerald-600'
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default TopTrainingsTab
