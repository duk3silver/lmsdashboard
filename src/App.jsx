import { useState, useEffect } from 'react'
import { GraduationCap, FileSpreadsheet, TrendingUp, Calendar, PieChart, FileText, Users, Building2, Award } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from './components/theme-toggle'
import UploadTab from './components/tabs/UploadTab'
import OverviewTab from './components/tabs/OverviewTab'
import MonthlyTab from './components/tabs/MonthlyTab'
import BreakdownTab from './components/tabs/BreakdownTab'
import DataTableTab from './components/tabs/DataTableTab'
import HeadcountTab from './components/tabs/HeadcountTab'
import DepartmentTab from './components/tabs/DepartmentTab'
import TopTrainingsTab from './components/tabs/TopTrainingsTab'

// Tab metadata configuration
const TAB_METADATA = {
  upload: {
    icon: FileSpreadsheet,
    title: 'Upload Training Data',
    description: 'Upload your Excel file containing training records'
  },
  overview: {
    icon: TrendingUp,
    title: 'General Overview',
    description: 'Monthly training hours and trend analysis'
  },
  monthly: {
    icon: Calendar,
    title: 'Monthly Analysis',
    description: 'Training session frequency and monthly breakdown'
  },
  breakdown: {
    icon: PieChart,
    title: 'Distribution Analysis',
    description: 'Training hours breakdown by type, gender, department, and status'
  },
  departments: {
    icon: Building2,
    title: 'Department Analytics',
    description: 'Analyze training metrics by department'
  },
  trainings: {
    icon: Award,
    title: 'Top 20 Training Courses',
    description: 'Most popular training courses ranked by different metrics'
  },
  data: {
    icon: FileText,
    title: 'Training Data',
    description: 'Searchable table of all training records with export functionality'
  },
  headcount: {
    icon: Users,
    title: 'Headcount Management',
    description: 'Manage monthly employee headcount data'
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [rawData, setRawData] = useState([])
  const [cleanedData, setCleanedData] = useState([])
  const [headcounts, setHeadcounts] = useState({
    "2023": { men: Array(12).fill(0), women: Array(12).fill(0) },
    "2024": { men: Array(12).fill(0), women: Array(12).fill(0) },
    "2025": { men: Array(12).fill(0), women: Array(12).fill(0) }
  })

  // Load headcounts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('education_headcounts')
    if (saved) {
      setHeadcounts(JSON.parse(saved))
    }
  }, [])

  // Save headcounts to localStorage whenever they change
  useEffect(() => {
    if (headcounts) {
      localStorage.setItem('education_headcounts', JSON.stringify(headcounts))
    }
  }, [headcounts])

  // Get current tab metadata
  const currentTabMeta = TAB_METADATA[activeTab] || TAB_METADATA.upload
  const TabIcon = currentTabMeta.icon

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <div className="relative p-3 bg-gradient-to-br from-primary via-primary to-accent rounded-2xl shadow-lg">
                  <GraduationCap className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Education Analytics</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="pb-8 pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <TabIcon className="w-8 h-8" />
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {currentTabMeta.title}
                </h2>
              </div>
              <p className="text-base text-muted-foreground max-w-3xl">
                {currentTabMeta.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
        {/* Main Tabs */}
        <Tabs defaultValue="upload" className="w-full" onValueChange={setActiveTab}>
          <div className="mb-8">
            <TabsList className="inline-flex h-auto items-center justify-center rounded-lg bg-muted/50 p-1 text-muted-foreground w-auto">
              <TabsTrigger value="upload" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                📤 Upload
              </TabsTrigger>
              <TabsTrigger value="overview" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                📊 Overview
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                📈 Monthly
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                🔍 Breakdown
              </TabsTrigger>
              <TabsTrigger value="departments" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                🏢 Departments
              </TabsTrigger>
              <TabsTrigger value="trainings" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                🏆 Top Trainings
              </TabsTrigger>
              <TabsTrigger value="data" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                📋 Data
              </TabsTrigger>
              <TabsTrigger value="headcount" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                👥 Headcount
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upload" className="mt-0 space-y-4">
            <UploadTab
              setRawData={setRawData}
              setCleanedData={setCleanedData}
            />
          </TabsContent>

          <TabsContent value="overview" className="mt-0 space-y-4">
            <OverviewTab
              cleanedData={cleanedData}
              headcounts={headcounts}
            />
          </TabsContent>

          <TabsContent value="monthly" className="mt-0 space-y-4">
            <MonthlyTab cleanedData={cleanedData} />
          </TabsContent>

          <TabsContent value="breakdown" className="mt-0 space-y-4">
            <BreakdownTab
              cleanedData={cleanedData}
              headcounts={headcounts}
            />
          </TabsContent>

          <TabsContent value="departments" className="mt-0 space-y-4">
            <DepartmentTab cleanedData={cleanedData} />
          </TabsContent>

          <TabsContent value="trainings" className="mt-0 space-y-4">
            <TopTrainingsTab cleanedData={cleanedData} />
          </TabsContent>

          <TabsContent value="data" className="mt-0 space-y-4">
            <DataTableTab cleanedData={cleanedData} />
          </TabsContent>

          <TabsContent value="headcount" className="mt-0 space-y-4">
            <HeadcountTab
              headcounts={headcounts}
              setHeadcounts={setHeadcounts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
