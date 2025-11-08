import { useState, useEffect, useMemo } from 'react'
import { Building2, Users, Clock, TrendingUp, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const parseDate = (dateStr) => {
  if (!dateStr) return null
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000)
  }
  const date = new Date(dateStr)
  if (!isNaN(date)) return date
  return null
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1']

const DepartmentTab = ({ cleanedData }) => {
  const [year, setYear] = useState('2024')
  const [selectedDepartment, setSelectedDepartment] = useState('ALL')

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

  // Get unique departments from data
  const departments = useMemo(() => {
    return [...new Set(cleanedData.map(r => r.bolum))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [cleanedData])

  // Filter data by year and department
  const filteredData = useMemo(() => {
    return cleanedData.filter(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false
      if (selectedDepartment !== 'ALL' && row.bolum !== selectedDepartment) return false
      return true
    })
  }, [cleanedData, year, selectedDepartment])

  // Calculate department metrics
  const metrics = useMemo(() => {
    const totalHours = filteredData.reduce((sum, row) => {
      if (row.egitimTuru === 'YETİŞTİRME') return sum
      return sum + row.sure
    }, 0)

    const uniqueEmployees = new Set(filteredData.map(r => r.sicilNo)).size
    const totalSessions = new Set(filteredData.map(r => r.egitimKayitNo)).size
    const avgPerEmployee = uniqueEmployees > 0 ? (totalHours / uniqueEmployees).toFixed(1) : 0

    return {
      totalHours: Math.round(totalHours),
      uniqueEmployees,
      totalSessions,
      avgPerEmployee
    }
  }, [filteredData])

  // Training type breakdown
  const trainingTypeData = useMemo(() => {
    const typeMap = {}
    filteredData.forEach(row => {
      if (row.egitimTuru && row.egitimTuru !== 'YETİŞTİRME') {
        if (!typeMap[row.egitimTuru]) {
          typeMap[row.egitimTuru] = { hours: 0, count: 0 }
        }
        typeMap[row.egitimTuru].hours += row.sure
        typeMap[row.egitimTuru].count += 1
      }
    })

    return Object.entries(typeMap)
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours),
        count: data.count
      }))
      .sort((a, b) => b.hours - a.hours)
  }, [filteredData])

  // All departments overview (when ALL is selected)
  const allDepartmentsData = useMemo(() => {
    if (selectedDepartment !== 'ALL') return []

    const deptMap = {}
    cleanedData.forEach(row => {
      const rowDate = parseDate(row.baslangic)
      if (!rowDate || rowDate.getFullYear() !== parseInt(year)) return
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA' || row.egitimTuru === 'YETİŞTİRME') return
      if (!row.bolum) return

      if (!deptMap[row.bolum]) {
        deptMap[row.bolum] = { hours: 0, employees: new Set() }
      }
      deptMap[row.bolum].hours += row.sure
      deptMap[row.bolum].employees.add(row.sicilNo)
    })

    return Object.entries(deptMap)
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours),
        employees: data.employees.size
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 15)
  }, [cleanedData, year, selectedDepartment])

  if (cleanedData.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="w-16 h-16 text-gray-300 mb-4" />
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
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDepartment === 'ALL' ? (
        /* All Departments Overview */
        <Card className="border shadow-lg ">
          <CardHeader>
            <CardTitle>Top 15 Departments by Training Hours - {year}</CardTitle>
            <CardDescription>Departments ranked by total training hours delivered</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={allDepartmentsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" width={200} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="hours" fill="#3b82f6" name="Total Hours" radius={[0, 4, 4, 0]} />
                <Bar dataKey="employees" fill="#8b5cf6" name="Employees Trained" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        /* Single Department Analysis */
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500 shadow-lg ">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Total Hours</CardTitle>
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics.totalHours.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Training hours</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-lg ">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Employees Trained</CardTitle>
                  <Users className="w-5 h-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics.uniqueEmployees}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique employees</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-lg ">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Total Sessions</CardTitle>
                  <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">Training sessions</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-lg ">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Avg Per Employee</CardTitle>
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics.avgPerEmployee}</div>
                <p className="text-xs text-muted-foreground mt-1">Hours/employee</p>
              </CardContent>
            </Card>
          </div>

          {/* Training Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="border shadow-lg ">
              <CardHeader>
                <CardTitle>Training Type Distribution</CardTitle>
                <CardDescription>Breakdown by training hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={trainingTypeData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {trainingTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="border shadow-lg ">
              <CardHeader>
                <CardTitle>Training Type Details</CardTitle>
                <CardDescription>Hours and session counts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={trainingTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="hours" fill="#3b82f6" name="Hours" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="count" fill="#8b5cf6" name="Sessions" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Training Type Summary Table */}
          <Card className="border shadow-lg ">
            <CardHeader>
              <CardTitle>Training Type Summary</CardTitle>
              <CardDescription>Detailed breakdown by training type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trainingTypeData.map((type, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-card border border rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-semibold text-foreground">{type.name}</span>
                    </div>
                    <div className="flex gap-6">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {type.hours} hours
                      </Badge>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {type.count} sessions
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default DepartmentTab
