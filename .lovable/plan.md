

# Sistem Langganan Eleanor Tracker

## Ringkasan
Membangun sistem langganan lengkap dengan halaman pricing, free trial 3 hari, promo Premium 1 tahun, kalkulator harga per anak, onboarding flow, dan admin override. Semua UI dalam Bahasa Indonesia dengan mobile-first design.

## Alur Pengguna

```text
Register/Login
    |
    v
[Sudah punya subscription aktif?]
    |           |
   Ya          Tidak
    |           |
    v           v
Dashboard    Halaman Pricing
              (pilih paket)
                  |
                  v
            Profil Anak
            (isi data anak)
                  |
                  v
            Undang Pengasuh
            (opsional, skip)
                  |
                  v
              Dashboard
```

---

## 1. Database Schema (4 tabel baru + 2 enum baru)

### Enum baru:
- `subscription_plan_type`: 'trial', 'standard', 'premium_promo'
- `subscription_billing_cycle`: 'monthly', 'quarterly'
- `subscription_status`: 'trial', 'active', 'expired', 'cancelled'
- `child_gender`: 'male', 'female'

### Tabel: `pricing_plans`
Referensi harga per anak. RLS: SELECT untuk semua authenticated users.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | serial PK | |
| plan_name | text | "Anak ke-1", dll |
| child_order | integer | 1-5 |
| monthly_price_idr | integer | Harga bulanan |
| discount_pct | integer | Diskon % dari harga base |
| quarterly_extra_discount_pct | integer | Diskon tambahan 15% |
| is_active | boolean | Default true |

Data seed: 5 baris sesuai spesifikasi (69000, 55000, 48000, 48000, 48000).

### Tabel: `subscriptions`
Langganan user. RLS: user hanya bisa SELECT/INSERT/UPDATE miliknya, admin bisa ALL.

| Kolom | Tipe |
|-------|------|
| id | uuid PK |
| user_id | uuid (NOT NULL) |
| plan_type | subscription_plan_type |
| billing_cycle | subscription_billing_cycle |
| number_of_children | integer |
| price_per_month | integer |
| price_per_quarter | integer (nullable) |
| trial_start_date | timestamptz (nullable) |
| trial_end_date | timestamptz (nullable) |
| subscription_start_date | timestamptz |
| subscription_end_date | timestamptz (nullable) |
| premium_promo_end_date | timestamptz (nullable) |
| status | subscription_status |
| admin_override | boolean DEFAULT false |
| admin_override_note | text (nullable) |
| created_at / updated_at | timestamptz |

### Tabel: `children_profiles`
Profil anak terkait subscription (berbeda dari tabel `children` yang sudah ada - ini khusus onboarding subscription).

| Kolom | Tipe |
|-------|------|
| id | uuid PK |
| user_id | uuid |
| subscription_id | uuid FK |
| name | text |
| date_of_birth | date |
| gender | child_gender |
| photo_url | text (nullable) |
| medical_notes | text (nullable) |
| routine_notes | text (nullable) |
| is_active | boolean DEFAULT true |
| created_at | timestamptz |

RLS: user hanya bisa CRUD miliknya, admin bisa SELECT all.

### Tabel: `family_invites`
Kode undangan pengasuh.

| Kolom | Tipe |
|-------|------|
| id | uuid PK |
| family_id | uuid (parent user_id) |
| invite_code | varchar(8) UNIQUE |
| invited_by | uuid |
| expires_at | timestamptz (7 hari) |
| used_by | uuid (nullable) |
| status | text DEFAULT 'pending' |
| created_at | timestamptz |

RLS: user hanya bisa CRUD yang dia buat, invited user bisa UPDATE (accept).

---

## 2. Halaman & Komponen Baru

### A. `src/pages/Pricing.tsx` - Halaman Pricing
Halaman utama setelah register, berisi:

1. **Promo Banner**: gradient gelap (navy-purple-coral), badge "PROMO TERBATAS", countdown timer (2 hari 11 jam 45 menit, hitung mundur real-time via `setInterval`), progress bar slot (mulai 76%, berkurang random tiap 15-45 detik, minimum 12 slot), stat boxes (Rp69rb / ~~Rp109rb~~ / 12 BULAN), highlight box emas.

2. **Billing Toggle**: 2 tombol "Bulanan" (default) dan "Per 3 Bulan" + badge "HEMAT 15%".

3. **Child Selector**: 4 tombol kotak (1-4 anak) + tombol "5+" untuk input manual. Default 1 anak.

4. **Price Calculator**: Real-time, menampilkan breakdown per anak (nama tier + harga), garis pemisah, total, dan hemat. Update otomatis saat toggle billing atau jumlah anak berubah. Logika:
   - Bulanan: jumlahkan harga per anak dari `pricing_plans`
   - Per 3 bulan: total bulanan x 0.85, bulatkan ke ratusan terdekat, x 3

5. **Tombol CTA**: "Mulai Coba GRATIS 3 Hari" (coral, full-width, sticky bottom). Klik -> buat subscription dengan status 'trial', trial_end = now + 3 hari, premium_promo_end = now + 1 tahun -> redirect ke onboarding profil anak.

### B. `src/pages/OnboardingChildren.tsx` - Profil Anak
Form untuk mengisi profil anak sesuai jumlah yang dipilih:
- Step indicator (Anak 1 dari N)
- Fields: nama, tanggal lahir, gender (select), foto (upload), catatan medis, catatan rutinitas
- Tombol "Lanjut" ke anak berikutnya atau "Selesai" di anak terakhir
- Data disimpan ke `children_profiles` dan juga ke tabel `children` yang sudah ada (agar kompatibel dengan fitur existing)

### C. `src/pages/OnboardingInvite.tsx` - Undang Pengasuh
- Generate kode undangan 8 karakter (alphanumeric)
- Tampilkan kode + tombol copy
- Tombol "Lewati" untuk skip
- Kode berlaku 7 hari
- Setelah selesai -> redirect ke dashboard

### D. `src/components/SubscriptionGuard.tsx` - Route Guard
Komponen wrapper yang mengecek status subscription:
- Jika belum punya subscription -> redirect ke `/pricing`
- Jika trial expired -> tampilkan modal "Trial Anda telah berakhir, silakan berlangganan"
- Jika subscription expired -> tampilkan modal upgrade
- Jika aktif -> render children

### E. Admin: Override Langganan (di `AdminUsers.tsx`)
Tambahkan di halaman AdminUsers:
- Tombol "Kelola Langganan" per user
- Dialog/modal untuk:
  - Set plan_type (trial/standard/premium_promo)
  - Set status (trial/active/expired/cancelled)
  - Set jumlah anak & billing cycle
  - Set tanggal mulai/akhir
  - Checkbox "Admin Override" + catatan
  - Tombol simpan -> upsert ke `subscriptions`

---

## 3. Modifikasi File Existing

### `src/App.tsx`
- Import halaman baru (Pricing, OnboardingChildren, OnboardingInvite)
- Tambah route: `/pricing`, `/onboarding/children`, `/onboarding/invite`
- Wrap route parent & babysitter dengan SubscriptionGuard

### `src/contexts/AuthContext.tsx`
- Tambah field `hasActiveSubscription` di `AppUser`
- Fetch subscription status saat login/refresh

### `src/hooks/use-subscription.ts` (baru)
- `useSubscription()`: fetch subscription aktif user
- `usePricingPlans()`: fetch pricing_plans
- `useCreateSubscription()`: mutation untuk buat subscription
- `useUpdateSubscription()`: mutation untuk admin override
- Helper: `calculatePrice(numChildren, billingCycle, plans)` -> hitung total

---

## 4. Detail Teknis

### Kalkulasi Harga
```text
function calculatePrice(numChildren, cycle, plans):
  total = 0
  for i = 1 to numChildren:
    plan = plans.find(p => p.child_order === min(i, 5))
    total += plan.monthly_price_idr
  
  if cycle === 'quarterly':
    total = Math.round(total * 0.85 / 100) * 100  // bulatkan ke ratusan
    return { perMonth: total, perQuarter: total * 3 }
  
  return { perMonth: total, perQuarter: null }
```

### Countdown Timer
- Simpan waktu target di `localStorage` saat pertama kali load
- `setInterval` setiap 1 detik update display
- Format: DD:HH:MM:SS dalam 4 box

### Slot Progress Bar
- Mulai 76% (47 slot dari ~62 total)
- `setInterval` random 15-45 detik, kurangi 1-2 slot
- Minimum 12 slot, simpan state di `localStorage`

### RLS Policies Summary
- `pricing_plans`: SELECT untuk authenticated
- `subscriptions`: SELECT/INSERT/UPDATE untuk owner (user_id = auth.uid()), ALL untuk admin
- `children_profiles`: CRUD untuk owner, SELECT ALL untuk admin
- `family_invites`: CRUD untuk creator, UPDATE untuk invited user

### File Baru
1. `supabase/migrations/[timestamp]_subscription_system.sql` - semua DDL + seed data
2. `src/pages/Pricing.tsx`
3. `src/pages/OnboardingChildren.tsx`
4. `src/pages/OnboardingInvite.tsx`
5. `src/components/SubscriptionGuard.tsx`
6. `src/hooks/use-subscription.ts`

### File Dimodifikasi
1. `src/App.tsx` - route baru + guard
2. `src/contexts/AuthContext.tsx` - subscription status
3. `src/pages/AdminUsers.tsx` - admin override UI

