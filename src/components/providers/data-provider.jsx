"use client"

import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const DataContext = createContext(null)

const parseDate = (dateStr) => {
  if (!dateStr) return null
  if (typeof dateStr === 'number') {
    return new Date((dateStr - 25569) * 86400 * 1000)
  }
  const date = new Date(dateStr)
  if (!isNaN(date)) return date
  return null
}

export function DataProvider({ children }) {
  const [rawData, setRawData] = useState([])
  const [cleanedData, setCleanedData] = useState([])
  const [headcounts, setHeadcounts] = useState({})

  // Load headcounts from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('education_headcounts')
        if (stored) {
          setHeadcounts(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Failed to load headcounts:', error)
      }
    }
  }, [])

  // Save headcounts to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(headcounts).length > 0) {
      try {
        localStorage.setItem('education_headcounts', JSON.stringify(headcounts))
      } catch (error) {
        console.error('Failed to save headcounts:', error)
      }
    }
  }, [headcounts])

  // Dynamically get available years from data (excluding certificates)
  const availableYears = useMemo(() => {
    const years = new Set()

    cleanedData.forEach(row => {
      // Skip certificates - they can be from old years like 1996
      if (row.egitimTuru === 'EHLİYET-SERTİFİKA') return

      const date = parseDate(row.baslangic)
      if (date) {
        years.add(date.getFullYear())
      }
    })

    // Convert to array and sort descending (newest first)
    return Array.from(years).sort((a, b) => b - a)
  }, [cleanedData])

  const value = {
    rawData,
    setRawData,
    cleanedData,
    setCleanedData,
    headcounts,
    setHeadcounts,
    availableYears,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
