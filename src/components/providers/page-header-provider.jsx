"use client"

import { createContext, useContext, useState } from 'react'

const PageHeaderContext = createContext()

export function PageHeaderProvider({ children }) {
  const [pageHeader, setPageHeader] = useState({
    title: 'Eğitim Analiz Dashboard',
    description: 'Personel eğitim verilerini analiz edin ve raporlayın',
    icon: null
  })

  return (
    <PageHeaderContext.Provider value={{ pageHeader, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (!context) {
    throw new Error('usePageHeader must be used within PageHeaderProvider')
  }
  return context
}
