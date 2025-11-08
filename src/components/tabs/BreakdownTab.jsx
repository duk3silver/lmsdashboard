import { useState, useEffect, useMemo } from 'react'
import { PieChart, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const parseDate = (dateStr) => {
  if (!dateStr) return null
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000)
  }
  const date = new Date(dateStr)
  if (!isNaN(date)) return date
  return null
}

const COLORS = {
  type: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
  gender: ['#3b82f6', '#ec4899'],
  collar: ['hsl(var(--card))', '#6b7280', '#d1d5db']
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-blue-600">{`${payload[0].value.toLocaleString()} hours`}</p>
      </div>
    )
  }
  return null
}

const BreakdownTab = ({ cleanedData, headcounts }) => {
  const [year, setYear] = useState('2024')

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

  const filteredData = useMemo(() => {
    return cleanedData.filter(row => {
      const date = parseDate(row.baslangic)
      if (!date || date.getFullYear() !== parseInt(year)) return false
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return false
      return true
    })
  }, [cleanedData, year])

  // Training Type Data
  const typeData = useMemo(() => {
    const data = {}
    filteredData.forEach(row => {
      data[row.egitimTuru] = (data[row.egitimTuru] || 0) + row.sure
    })
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }))
  }, [filteredData])

  // Gender Total Hours
  const genderTotalData = useMemo(() => {
    const data = {}
    filteredData.forEach(row => {
      data[row.cinsiyet] = (data[row.cinsiyet] || 0) + row.sure
    })
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }))
  }, [filteredData])

  // Gender Average Per Person
  const genderAvgData = useMemo(() => {
    const yearHeadcounts = headcounts[year] || { men: Array(12).fill(0), women: Array(12).fill(0) }
    const totalMen = yearHeadcounts.men.reduce((a, b) => a + b, 0)
    const totalWomen = yearHeadcounts.women.reduce((a, b) => a + b, 0)

    const menHours = filteredData.filter(r => r.cinsiyet === 'Erkek').reduce((sum, r) => sum + r.sure, 0)
    const womenHours = filteredData.filter(r => r.cinsiyet === 'Kadın').reduce((sum, r) => sum + r.sure, 0)

    const avgMen = totalMen > 0 ? (menHours / totalMen * 12) : 0
    const avgWomen = totalWomen > 0 ? (womenHours / totalWomen * 12) : 0

    return [
      { name: 'Erkek (Per Person)', value: parseFloat(avgMen.toFixed(1)) },
      { name: 'Kadın (Per Person)', value: parseFloat(avgWomen.toFixed(1)) }
    ]
  }, [filteredData, headcounts, year])

  // Collar Data
  const collarData = useMemo(() => {
    const data = {}
    filteredData.forEach(row => {
      data[row.personelStatu] = (data[row.personelStatu] || 0) + row.sure
    })
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }))
  }, [filteredData])

  // Department Data (Top 10)
  const deptData = useMemo(() => {
    const data = {}
    filteredData.forEach(row => {
      data[row.bolum] = (data[row.bolum] || 0) + row.sure
    })
    return Object.entries(data)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filteredData])

  if (cleanedData.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <PieChart className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-muted-foreground text-lg">No data uploaded yet</p>
          <p className="text-muted-foreground text-sm">Please upload an Excel file in the Upload tab</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Year Filter */}
      <Card className="border shadow-lg ">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize your view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-64">
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
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Type */}
        <Card className="border shadow-lg ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              By Training Type
            </CardTitle>
            <CardDescription>Total hours distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.type[index % COLORS.type.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Total */}
        <Card className="border shadow-lg ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-pink-600" />
              By Gender (Total Hours)
            </CardTitle>
            <CardDescription>Total hours by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={genderTotalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}h`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderTotalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.gender[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Average */}
        <Card className="border shadow-lg ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Average Per Person (Gender)
            </CardTitle>
            <CardDescription>Average training hours per person by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={genderAvgData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name.split(' ')[0]}: ${value}h`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderAvgData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.gender[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collar Type */}
        <Card className="border shadow-lg ">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-gray-600" />
              By Personnel Status
            </CardTitle>
            <CardDescription>Blue collar vs White collar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={collarData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}h`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {collarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.collar[index % COLORS.collar.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Top 10 */}
        <Card className="border shadow-lg bg-white/80 backdrop-blur-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Top 10 Departments
            </CardTitle>
            <CardDescription>Departments with most training hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BreakdownTab
