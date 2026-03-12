# Ellie — Caretaker Log

Aplikasi caretaker log harian — orang tua bisa pantau aktivitas anak yang dijaga babysitter.

## Stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (database + auth + storage)
- Vercel (deployment)
- Bun (package manager)

## Struktur
- `src/pages/` — halaman utama (ParentDashboard, BabysitterToday, dll)
- `src/components/` — komponen reusable
- `src/hooks/use-data.ts` — semua hooks untuk fetch data Supabase
- `src/types/` — type definitions
- `supabase/` — migrations dan edge functions

## Roles
- **Parent** → lihat dashboard, input data
- **Babysitter** → input harian (BabysitterToday)
- **Viewer** → read-only dashboard
- **Admin** → kelola semua user dan anak

## Dev
```bash
npm run dev      # jalankan di localhost:5173
npm run build    # build production
```

## GitHub
https://github.com/kedebuk/babysitterwatcher
