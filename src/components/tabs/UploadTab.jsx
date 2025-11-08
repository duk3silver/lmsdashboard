import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

const UploadTab = ({ setRawData, setCleanedData }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [rowCount, setRowCount] = useState(0)

  const cleanData = (rawData) => {
    let data = rawData.slice(2)
    let dataRows = data.slice(1)

    dataRows = dataRows.filter(row => {
      return row[0] !== 'Sicil Numarası' && row[0] !== 'Eğitim Katılımcıları'
    })

    const cleaned = dataRows.map(row => {
      // Normalize training type to uppercase to avoid duplicates
      let trainingType = row[9] ? String(row[9]).toUpperCase() : row[9]

      // Special handling for İSG (Turkish uppercase İ)
      if (trainingType === 'ISG' || trainingType === 'İSG') {
        trainingType = 'İSG'
      }

      return {
        sicilNo: row[0],
        adi: row[1],
        soyadi: row[2],
        egitimKayitNo: row[3],
        egitimKodu: row[4],
        egitimAdi: row[5],
        sure: parseFloat(row[6]) || 0,
        baslangic: row[7],
        bitis: row[8],
        egitimTuru: trainingType,
        cinsiyet: row[10],
        sirket: row[11],
        bolum: row[12],
        pozisyon: row[13],
        personelStatu: row[17]
      }
    }).filter(row => row.sirket && row.sicilNo)

    return cleaned
  }

  const processFile = useCallback((file) => {
    if (!file) return

    setUploadStatus('loading')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        setRawData(raw)
        const cleaned = cleanData(raw)
        setCleanedData(cleaned)
        setRowCount(cleaned.length)
        setUploadStatus('success')

        toast.success('File uploaded successfully', {
          description: `${cleaned.length} rows processed`
        })
      } catch (error) {
        setUploadStatus('error')
        toast.error('Error processing file', {
          description: error.message
        })
      }
    }
    reader.readAsArrayBuffer(file)
  }, [setRawData, setCleanedData])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file)
    } else {
      toast.error('Invalid file type', {
        description: 'Please upload an Excel file (.xlsx or .xls)'
      })
    }
  }, [processFile])

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      processFile(file)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="flex flex-col items-center gap-4">
              <div className={`
                p-4 rounded-full transition-all duration-200
                ${isDragging
                  ? 'bg-primary scale-110'
                  : 'bg-primary/10'
                }
              `}>
                <Upload className={`w-10 h-10 ${isDragging ? 'text-primary-foreground' : 'text-primary'}`} />
              </div>

              <div>
                <p className="text-base font-medium text-foreground mb-1">
                  {isDragging ? 'Drop your file here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Excel files only (.xlsx, .xls)
                </p>
              </div>
            </div>
          </div>

          {uploadStatus === 'loading' && (
            <div className="mt-6 flex items-center gap-3 text-primary">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="font-medium">Processing file...</span>
            </div>
          )}

          {uploadStatus === 'success' && (
            <Alert className="mt-6 border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-900 dark:text-green-100">Success!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-200">
                File uploaded successfully. {rowCount.toLocaleString()} rows processed and ready for analysis.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && (
            <Alert className="mt-6 border-destructive/50 bg-destructive/10" variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to process the file. Please check the file format and try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">ℹ️ How it Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
            <p className="text-sm text-muted-foreground">Upload your Excel file (first 2 rows and duplicate headers are automatically cleaned)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
            <p className="text-sm text-muted-foreground">Data is automatically analyzed (YETİŞTİRME hours are distributed across months, EHLİYET-SERTİFİKA excluded)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
            <p className="text-sm text-muted-foreground">Use filters to view the data you want</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
            <p className="text-sm text-muted-foreground">Enter monthly headcount numbers (male/female) in the "Headcount Manager" tab</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadTab
