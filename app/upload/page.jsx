"use client"

import { useState, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useData } from '@/components/providers/data-provider'
import { usePageHeader } from '@/components/providers/page-header-provider'

const cleanData = (rawData) => {
  let data = rawData.slice(2)
  let dataRows = data.slice(1)

  dataRows = dataRows.filter(row => {
    return row[0] !== 'Sicil Numarası' && row[0] !== 'Eğitim Katılımcıları'
  })

  const cleaned = dataRows.map(row => {
    // Normalize training type to uppercase to avoid duplicates
    let trainingType = row[9] ? String(row[9]).toUpperCase() : row[9]

    // Special handling for Turkish uppercase İ
    if (trainingType === 'ISG' || trainingType === 'İSG') {
      trainingType = 'İSG'
    }
    if (trainingType === 'TEKNIK' || trainingType === 'TEKNİK') {
      trainingType = 'TEKNİK'
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

export default function UploadPage() {
  const { setRawData, setCleanedData } = useData()
  const { setPageHeader } = usePageHeader()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [rowCount, setRowCount] = useState(0)

  useEffect(() => {
    setPageHeader({
      title: "Eğitim Verilerini Yükle",
      description: "Eğitim kayıtlarını içeren Excel dosyanızı yükleyin",
      icon: Upload
    })
  }, [setPageHeader])

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

        toast.success('Dosya başarıyla yüklendi', {
          description: `${cleaned.length.toLocaleString('tr-TR')} kayıt işlendi`
        })
      } catch (error) {
        setUploadStatus('error')
        toast.error('Dosya işlenirken hata oluştu', {
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
      toast.error('Geçersiz dosya türü', {
        description: 'Lütfen Excel dosyası (.xlsx veya .xls) yükleyin'
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Excel Dosyası Yükle</CardTitle>
          <CardDescription>
            Eğitim verilerinizi sisteme aktarmak için Excel dosyanızı yükleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-16 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragging
                ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
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

            <div className="flex flex-col items-center gap-6">
              <div className={`
                p-6 rounded-full transition-all duration-300
                ${isDragging
                  ? 'bg-primary scale-110 shadow-lg'
                  : 'bg-primary/10'
                }
              `}>
                <Upload className={`w-12 h-12 ${isDragging ? 'text-primary-foreground animate-bounce' : 'text-primary'}`} />
              </div>

              <div className="space-y-2">
                <p className="text-xl font-semibold text-foreground">
                  {isDragging ? '📥 Dosyayı buraya bırakın' : 'Dosya yüklemek için tıklayın veya sürükleyin'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sadece Excel dosyaları (.xlsx, .xls)
                </p>
              </div>
            </div>
          </div>

          {uploadStatus === 'loading' && (
            <div className="mt-6 flex items-center justify-center gap-3 text-primary">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="font-semibold text-lg">Dosya işleniyor...</span>
            </div>
          )}

          {uploadStatus === 'success' && (
            <Alert className="mt-6 border-green-500/30 bg-green-500/10 shadow-md">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-900 dark:text-green-100 font-semibold">Başarılı!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-200">
                Dosya başarıyla yüklendi. <span className="font-bold">{rowCount.toLocaleString('tr-TR')}</span> kayıt işlendi ve analiz için hazır.
              </AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'error' && (
            <Alert className="mt-6 border-destructive/50 bg-destructive/10" variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Hata</AlertTitle>
              <AlertDescription>
                Dosya işlenirken bir hata oluştu. Lütfen dosya formatını kontrol edip tekrar deneyin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">1</div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium mb-1">Excel dosyanızı yükleyin</p>
              <p className="text-sm text-muted-foreground">İlk 2 satır ve tekrar eden başlıklar otomatik olarak temizlenir</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">2</div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium mb-1">Veriler otomatik olarak analiz edilir</p>
              <p className="text-sm text-muted-foreground">YETİŞTİRME saatleri aylara dağıtılır, EHLİYET-SERTİFİKA hariç tutulur</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">3</div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium mb-1">Filtreleri kullanın</p>
              <p className="text-sm text-muted-foreground">Görmek istediğiniz verileri seçmek için filtreleri kullanın</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">4</div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium mb-1">Aylık kadro sayılarını girin</p>
              <p className="text-sm text-muted-foreground">"Kadro Yönetimi" sayfasından aylık personel sayılarını (erkek/kadın) girin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
