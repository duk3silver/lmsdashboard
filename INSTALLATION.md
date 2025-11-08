# 🚀 Installation Guide

## Quick Start

Follow these steps to get your Education Analytics Dashboard up and running:

### 1. Install Dependencies

Open your terminal in the Dashboard folder and run:

```bash
npm install
```

This will install all required packages including:
- React 18
- Vite
- Tailwind CSS
- shadcn/ui components
- Recharts
- XLSX parser
- And all other dependencies

### 2. Start Development Server

```bash
npm run dev
```

Your dashboard will be available at: **http://localhost:5173**

### 3. First Time Setup

1. Open the dashboard in your browser
2. Go to the "Headcount Manager" tab
3. Enter your monthly employee counts (male/female separate)
4. Click "Save Changes"
5. Go to the "Upload" tab
6. Drag and drop your Excel file

That's it! You're ready to analyze your training data.

## 🎯 Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🔧 Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port. Check your terminal output for the correct URL.

### Installation Errors

If you encounter errors during installation:

1. Delete `node_modules` folder
2. Delete `package-lock.json` file
3. Run `npm install` again

### Missing Dependencies

If you see errors about missing packages:

```bash
npm install --force
```

## 📱 Browser Compatibility

This dashboard works best on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 💾 Data Persistence

- Headcount data is saved to your browser's localStorage
- Data persists even after closing the browser
- Export your data regularly as a backup using the "Export JSON" button

## 🎨 Customization

The dashboard uses Tailwind CSS. To customize colors, fonts, or styles:

1. Edit `tailwind.config.js` for theme changes
2. Edit `src/index.css` for global styles
3. Component-specific styles are in each component file

## 📊 Excel File Format

Your Excel file should have these columns:
- Column A: Sicil Numarası (Employee ID)
- Column B: Adı (First Name)
- Column C: Soyadı (Last Name)
- Column D: Eğitim Kayıt No (Training Registration No)
- Column E: Eğitim Kodu (Training Code)
- Column F: Eğitim Adı (Training Name)
- Column G: Süre (Duration in hours)
- Column H: Başlangıç Tarihi (Start Date)
- Column I: Bitiş Tarihi (End Date)
- Column J: Eğitim Türü (Training Type)
- Column K: Cinsiyet (Gender)
- Column L: Şirket (Company)
- Column M: Bölüm (Department)
- Column N: Pozisyon (Position)
- Column R: Personel Statü (Personnel Status)

The system automatically:
- Removes first 2 rows
- Cleans duplicate headers
- Filters out EHLİYET-SERTİFİKA entries
- Distributes YETİŞTİRME hours across months

## 🆘 Need Help?

If you encounter any issues:

1. Check the browser console (F12) for error messages
2. Verify your Excel file format matches the expected structure
3. Make sure all dependencies are installed
4. Try clearing your browser cache and localStorage

## 🎉 You're All Set!

Your beautiful, professional education analytics dashboard is ready to use. Upload your data and start analyzing!
