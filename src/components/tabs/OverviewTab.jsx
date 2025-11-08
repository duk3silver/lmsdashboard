import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Users, BookOpen, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'

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

const OverviewTab = ({ cleanedData, headcounts }) => {
  const [year, setYear] = useState('2024')
  const [trainingTypes, setTrainingTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [company, setCompany] = useState('Nemport')
  const [gender, setGender] = useState('ALL')
  const [collar, setCollar] = useState('ALL')

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

  const calculateMonthlyData = useMemo(() => {
    const filtered = cleanedData.filter(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false

      // Apply ALL filters
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

    let monthlyHours = Array(12).fill(0)
    let totalYetistirme = 0

    filtered.forEach(row => {
      const date = parseDate(row.baslangic)
      if (!date) return

      const month = date.getMonth()

      if (row.egitimTuru === 'YETİŞTİRME') {
        totalYetistirme += row.sure
      } else {
        monthlyHours[month] += row.sure
      }
    })

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const monthsToShow = parseInt(year) === currentYear ? currentMonth + 1 : 12

    const yetistirmeAvg = monthsToShow > 0 ? totalYetistirme / monthsToShow : 0

    for (let i = 0; i < monthsToShow; i++) {
      monthlyHours[i] += yetistirmeAvg
    }

    return { monthlyHours, monthsToShow, totalYetistirme }
  }, [cleanedData, year, company, trainingTypes, departments, gender, collar])

  const metrics = useMemo(() => {
    const totalHours = filteredData.reduce((sum, row) => {
      if (row.egitimTuru === 'YETİŞTİRME') return sum
      return sum + row.sure
    }, 0)

    const totalSessions = new Set(filteredData.map(r => r.egitimKayitNo)).size
    const totalEmployees = new Set(filteredData.map(r => r.sicilNo)).size

    const yearHeadcounts = headcounts[year] || { men: Array(12).fill(0), women: Array(12).fill(0) }
    let totalHeadcount = 0
    for (let i = 0; i < calculateMonthlyData.monthsToShow; i++) {
      totalHeadcount += yearHeadcounts.men[i] + yearHeadcounts.women[i]
    }
    const avgHeadcount = totalHeadcount / calculateMonthlyData.monthsToShow

    const avgPerPerson = avgHeadcount > 0
      ? ((totalHours + calculateMonthlyData.totalYetistirme) / avgHeadcount).toFixed(1)
      : 0

    return {
      totalHours: Math.round(totalHours + calculateMonthlyData.totalYetistirme),
      totalSessions,
      totalEmployees,
      avgPerPerson
    }
  }, [filteredData, year, headcounts, calculateMonthlyData])

  const chartData = useMemo(() => {
    const yearHeadcounts = headcounts[year] || { men: Array(12).fill(0), women: Array(12).fill(0) }

    return monthNames.slice(0, calculateMonthlyData.monthsToShow).map((month, i) => {
      const totalHeadcount = yearHeadcounts.men[i] + yearHeadcounts.women[i]
      const hours = calculateMonthlyData.monthlyHours[i]

      return {
        month,
        hours: Math.round(hours),
        perPerson: totalHeadcount > 0 ? parseFloat((hours / totalHeadcount).toFixed(1)) : 0
      }
    })
  }, [calculateMonthlyData, headcounts, year])

  if (cleanedData.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No data uploaded yet</p>
          <p className="text-gray-400 text-sm">Please upload an Excel file in the Upload tab</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <SelectItem value="ALL">Tüm Şirketler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
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
              <Label>Personnel Status</Label>
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
              <Label>Training Types (Multi-select)</Label>
              <MultiSelect
                options={availableTrainingTypes}
                selected={trainingTypes}
                onChange={setTrainingTypes}
                placeholder="Select training types..."
              />
            </div>

            <div className="space-y-2">
              <Label>Departments (Multi-select)</Label>
              <MultiSelect
                options={availableDepartments}
                selected={departments}
                onChange={setDepartments}
                placeholder="Select departments..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-lg ">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-card-foreground">Total Training Hours</CardTitle>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.totalHours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This year</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg ">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-card-foreground">Total Sessions</CardTitle>
              <BookOpen className="w-5 h-5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Sessions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg ">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-card-foreground">Trained Employees</CardTitle>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">People</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg ">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-card-foreground">Average Per Person</CardTitle>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.avgPerPerson}</div>
            <p className="text-xs text-muted-foreground mt-1">Hours/Person</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <CardTitle>Monthly Training Hours - {year}</CardTitle>
          <CardDescription>Total hours and per-person average by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" stroke="#2563eb" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="hours" fill="#2563eb" name="Total Hours" radius={[8, 8, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="perPerson"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 5 }}
                name="Hours per Person"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default OverviewTab
