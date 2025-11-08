# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Education Analytics Dashboard** - a Next.js-based web application for analyzing training and education data. The application processes Excel files containing employee training records and provides comprehensive analytics through various visualizations and reports.

**Key Purpose**: Upload Excel files with training data, manage employee headcount, and analyze training hours/metrics across different dimensions (time, department, training type, gender, personnel status).

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production (outputs to .next/ folder)
npm run build

# Start production server
npm run start
```

**Note**: This project uses Next.js 16 with React 19. There are no test scripts configured.

## Architecture & Data Flow

### State Management
The application uses React Context for global state management. The **main state** is managed through context providers:

- `DataProvider` (`src/components/providers/data-provider.jsx`) - Manages:
  - `rawData` - Unprocessed Excel data array
  - `cleanedData` - Processed/filtered data used by all pages
  - `headcounts` - Monthly employee counts by year/gender (persisted to localStorage)
- `PageHeaderProvider` (`src/components/providers/page-header-provider.jsx`) - Manages dynamic page titles, descriptions, and icons
- `ThemeProvider` (`src/components/providers/theme-provider.jsx`) - Manages dark/light theme

**Critical**: All pages consume data from context providers. Pages can update data through context setters (e.g., HeadcountPage can update headcounts).

### Data Processing Pipeline

1. **Upload** (`app/upload/page.jsx`): User drops Excel file → XLSX library parses → `cleanData()` function runs
2. **Cleaning** (in upload page):
   - Removes first 2 rows and duplicate headers
   - Filters out rows where `egitimTuru === 'EHLİYET-SERTİFİKA'` (certificates excluded from most analytics)
   - **EXCEPTION**: Data Table page (`app/data-table/page.jsx`) shows ALL data including certificates with NO filters
   - Normalizes training types to uppercase (special handling for Turkish 'İSG')
   - Maps Excel columns to JavaScript object properties
3. **Storage**: Cleaned data stored in DataProvider context → available to all pages
4. **Analysis**: Most pages apply additional filters (year, gender, department, etc.) and calculate metrics
   - **Data Table Page**: Shows ALL raw cleaned data with only search functionality (no filters, includes certificates)

### Special Data Handling

**YETİŞTİRME Training Type**: For trainings with type 'YETİŞTİRME', hours are distributed across multiple months based on start/end dates rather than counted in a single month. This is implemented in OverviewTab.jsx and other tabs that calculate monthly metrics.

**Date Parsing**: Excel stores dates as numbers (days since 1900). The `parseDate()` utility handles both Excel numeric dates and string dates:
```javascript
// Excel number: (dateNum - 25569) * 86400 * 1000
if (typeof dateStr === 'number') {
  return new Date((dateStr - 25569) * 86400 * 1000)
}
```

### Component Structure

```
app/                            # Next.js App Router directory
├── layout.jsx                  # Root layout with providers, sidebar, header
├── page.jsx                    # Home page with stats overview
├── globals.css                 # Global styles and Tailwind imports
├── upload/page.jsx             # Excel upload & data cleaning
├── overview/page.jsx           # Monthly charts, total metrics, filtering
├── monthly/page.jsx            # Session frequency counter
├── breakdown/page.jsx          # Pie/donut charts for distributions
├── data-table/page.jsx         # ALL data - searchable table with CSV export (NO FILTERS, includes certificates)
├── headcount/page.jsx          # Employee count manager with localStorage
├── department/page.jsx         # Department-specific analysis
└── top-trainings/page.jsx      # Top training courses by hours

src/
├── components/
│   ├── providers/
│   │   ├── data-provider.jsx        # Global data state (cleanedData, headcounts)
│   │   ├── page-header-provider.jsx # Dynamic page titles/descriptions
│   │   └── theme-provider.jsx       # Dark/light theme
│   ├── sidebar.jsx                  # Navigation sidebar
│   ├── header.jsx                   # Top header with dynamic page title
│   └── ui/                          # shadcn/ui components (Button, Card, Select, etc.)
└── lib/
    └── utils.js                     # Tailwind class merging utility
```

## Expected Excel File Format

The Excel file **must** have these columns (column letters match expected positions):

- **Column A**: Sicil Numarası (Employee ID)
- **Column B**: Adı (First Name)
- **Column C**: Soyadı (Last Name)
- **Column D**: Eğitim Kayıt No (Training Registration No)
- **Column E**: Eğitim Kodu (Training Code)
- **Column F**: Eğitim Adı (Training Name)
- **Column G**: Süre (Duration in hours)
- **Column H**: Başlangıç Tarihi (Start Date)
- **Column I**: Bitiş Tarihi (End Date)
- **Column J**: Eğitim Türü (Training Type)
- **Column K**: Cinsiyet (Gender)
- **Column L**: Şirket (Company)
- **Column M**: Bölüm (Department)
- **Column N**: Pozisyon (Position)
- **Column R**: Personel Statü (Personnel Status)

**Important**: The cleaning logic is tightly coupled to these column positions (array indices 0-17). Changing column order will break the parser.

## Key Dependencies

- **React 19**: UI library
- **Next.js 16**: React framework with App Router, server components, and Turbopack
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built components (built on Radix UI)
- **Recharts**: Charting library for all visualizations
- **XLSX**: Excel file parsing (`xlsx` package)
- **Sonner**: Toast notifications
- **Lucide React**: Icon library
- **next-themes**: Theme management for dark/light mode

## Import Alias

The project uses `@/` as an alias for the `src/` directory (configured in jsconfig.json):

```javascript
import { Button } from '@/components/ui/button'
// Resolves to: src/components/ui/button.jsx
```

## LocalStorage Usage

The application persists **headcount data** to localStorage:
- Key: `'education_headcounts'`
- Format: JSON object with structure `{ "2023": { men: [12 values], women: [12 values] }, ... }`
- Managed by: DataProvider context (`src/components/providers/data-provider.jsx`)

## Turkish Language Handling

This application uses **Turkish language** throughout. Key considerations:

- Month names: ["Ocak", "Şubat", "Mart", ...] (defined in app/overview/page.jsx)
- Training types are in Turkish: 'MESLEKİ', 'İSG', 'ÇEVRE', 'YETİŞTİRME', etc.
- **Case-sensitive**: Turkish has special uppercase rules (e.g., lowercase 'i' → uppercase 'İ')
- Use `.localeCompare(b, 'tr')` for Turkish-aware string sorting

## Data Table Page - Special Notes

The Data Table page (`app/data-table/page.jsx`) has unique behavior:
- **NO FILTERS**: Unlike other analytics pages, this page has NO year, company, gender, department, or training type filters
- **ALL DATA**: Shows ALL training records including 'EHLİYET-SERTİFİKA' (certificates) which are filtered out on other pages
- **SEARCH ONLY**: Only functionality is a search box that searches across: sicil no, name, training name, training type, department, company
- **PURPOSE**: Provides complete raw data view for auditing and CSV export

## Path Resolution Note

The project runs on **Windows** (working directory: C:\Users\Cibo\Desktop\Dashboard). However, Next.js and React tooling abstract path handling, so cross-platform compatibility is maintained through standard `/` separators in imports.
