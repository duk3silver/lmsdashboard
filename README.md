# 📚 Education Analytics Dashboard

A beautiful, professional React dashboard for analyzing training and education data with comprehensive filtering, visualization, and reporting capabilities.

## ✨ Features

### 📤 Upload & Process Data
- Drag & drop Excel file upload
- Automatic data cleaning and processing
- Real-time progress feedback
- Support for .xlsx and .xls formats

### 📊 Overview Analytics
- Real-time metrics (Total Hours, Sessions, Employees, Average per Person)
- Interactive monthly charts with dual-axis visualization
- Advanced filtering (Year, Training Type, Company, Gender, Personnel Status)
- Gender-specific headcount calculations

### 📈 Monthly Analysis
- Session frequency counter with descending sort
- Filter by year, month, and training type
- See exactly how many times each training occurred

### 🔍 Detailed Breakdown
- Training type distribution (Pie chart)
- Gender-based total hours (Donut chart)
- Gender-based average per person (Pie chart)
- Personnel status breakdown (Donut chart)
- Top 10 departments (Horizontal bar chart)
- Year-based filtering

### 📋 Data Table
- Search functionality with confirmation
- Lazy loading for performance (100 rows at a time)
- Export to CSV
- Clean, responsive table design
- Badge system for categories

### 👥 Headcount Manager
- Separate male/female employee count input
- Auto-calculated totals
- Year-based management (2023-2025)
- Import/Export JSON functionality
- LocalStorage persistence

## 🎨 Design Features

- **shadcn/ui components** for professional appearance
- **Gradient backgrounds** and modern color schemes
- **Responsive design** that works on all screen sizes
- **Smooth animations** and transitions
- **Toast notifications** for user feedback
- **Glassmorphism effects** with backdrop blur
- **Professional data visualizations** using Recharts

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd C:\Users\Desktop\Dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## 📦 Project Structure

```
Dashboard/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── tabs/            # Tab components
│   │       ├── UploadTab.jsx
│   │       ├── OverviewTab.jsx
│   │       ├── MonthlyTab.jsx
│   │       ├── BreakdownTab.jsx
│   │       ├── DataTableTab.jsx
│   │       └── HeadcountTab.jsx
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx              # Main application
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Radix UI** - Accessible primitives
- **Lucide React** - Icons
- **XLSX** - Excel file processing
- **Sonner** - Toast notifications

## 📝 Usage

1. **Upload Data**: Go to the Upload tab and drag/drop your Excel file
2. **Set Headcount**: Go to Headcount Manager and enter monthly employee numbers
3. **Analyze**: Use the Overview tab to see overall metrics
4. **Filter**: Use filters to drill down into specific training types, genders, etc.
5. **Monthly View**: Check Monthly tab for session frequency analysis
6. **Breakdown**: View detailed pie charts and bar charts in Breakdown tab
7. **Export**: Use Data Table tab to search and export CSV files

## 🎯 Key Features

- **Auto Data Cleaning**: First 2 rows and duplicate headers removed automatically
- **YETİŞTİRME Averaging**: Training hours distributed across months
- **EHLİYET-SERTİFİKA Filtering**: Certificate trainings excluded from analysis
- **Gender-Specific Calculations**: Separate tracking for men and women
- **LocalStorage Persistence**: Headcount data persists across sessions
- **Responsive Charts**: All charts adapt to screen size

## 🤝 Contributing

This is a private project. For questions or support, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
#
