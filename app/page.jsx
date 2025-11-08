"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useData } from '@/components/providers/data-provider'
import { usePageHeader } from '@/components/providers/page-header-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  FileSpreadsheet,
  Home,
  PieChart,
  Building2,
  Award,
  FileText,
  GraduationCap
} from 'lucide-react'

export default function HomePage() {
  const { cleanedData } = useData()
  const { setPageHeader } = usePageHeader()
  const hasData = cleanedData && cleanedData.length > 0

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: 'Genel Bakış',
      description: 'Eğitim analiz sistemine genel bakış ve hızlı erişim',
      icon: Home
    })
  }, [])

  return (
    <div className="space-y-6">
      {!hasData ? (
        /* No Data State */
        <Card className="border-dashed border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Başlamak için veri yükleyin
            </CardTitle>
            <CardDescription>
              Excel dosyanızı yükleyerek eğitim analizlerine başlayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/upload">
              <Button size="lg" className="w-full sm:w-auto">
                Excel Dosyası Yükle
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Dashboard Summary Cards */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Analiz Section */}
          <Card className="border-border/40 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Analiz
                  </CardTitle>
                  <CardDescription>
                    Eğitim verilerinizi farklı boyutlardan inceleyin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/overview" className="font-medium hover:underline">
                      Genel Analiz
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Aylık eğitim saatleri, trendler ve kişi başı ortalamalar. Yıl, şirket, cinsiyet ve eğitim türüne göre filtreleme.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/monthly" className="font-medium hover:underline">
                      Aylık Analiz
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Aylık eğitim oturum sayıları ve sıklık dağılımları. Hangi eğitimler ne sıklıkla tekrarlanıyor?
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <PieChart className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/breakdown" className="font-medium hover:underline">
                      Dağılım Analizi
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Eğitim türü, cinsiyet, personel statüsü ve departman bazında pasta grafikleri ile dağılım görünümü.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <GraduationCap className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/yetistirme" className="font-medium hover:underline">
                      Yetiştirme Programları
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Personel yetiştirme ve beceri geliştirme programları. Program bazında analiz, zaman çizelgesi ve detaylı kayıtlar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/sertifikalar" className="font-medium hover:underline">
                      Sertifikalar
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Personel sertifika ve ehliyet analizi. Aylık dağılım, sertifika türlerine göre breakdown ve en popüler sertifikalar.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departman & Top Section */}
          <Card className="border-border/40 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-6 w-6 text-orange-600" />
                    Departman & Sıralamalar
                  </CardTitle>
                  <CardDescription>
                    Departman performansı ve popüler eğitimler
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Building2 className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/department" className="font-medium hover:underline">
                      Departman Analizi
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Departman bazında detaylı eğitim metrikleri. Her departmanın toplam saatleri, kişi başı ortalamaları ve eğitim dağılımları.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/top-trainings" className="font-medium hover:underline">
                      En İyi Eğitimler
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      En popüler 20 eğitim kursu. Toplam saat, katılımcı sayısı ve oturum sayısına göre sıralama.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veri & Kadro Section */}
          <Card className="border-border/40 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-6 w-6 text-indigo-600" />
                    Veri Yönetimi
                  </CardTitle>
                  <CardDescription>
                    Ham veri görüntüleme ve dışa aktarma
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/data-table" className="font-medium hover:underline">
                      Veri Tablosu
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Tüm eğitim kayıtlarını görüntüleyin. Filtre YOK - sertifikalar dahil tüm veriler. Arama ve CSV dışa aktarma.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/headcount" className="font-medium hover:underline">
                      Kadro Yönetimi
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Aylık personel mevcudiyetini yönetin. Erkek ve kadın çalışan sayılarını girerek kişi başı hesaplamaları yapın.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card className="border-border/40 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Upload className="h-6 w-6 text-green-600" />
                    Veri Yükleme
                  </CardTitle>
                  <CardDescription>
                    Yeni eğitim verilerini sisteme aktarın
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Link href="/upload" className="font-medium hover:underline">
                      Excel Yükle
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Eğitim kayıtlarını içeren Excel dosyanızı yükleyin. Sistem otomatik olarak verileri temizler ve analiz için hazırlar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/upload">
                  <Button className="w-full" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Yeni Veri Yükle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
