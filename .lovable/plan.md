

## Rencana: Invite Multi-Role (Parent Tambahan) + Foto Attachment Event

Ada 2 fitur yang akan ditambahkan:

### Fitur 1: Invite Orang Lain sebagai Parent Tambahan

Saat ini sistem invite hanya untuk babysitter. Kita akan memperluas agar parent bisa mengundang orang lain (ayah, ibu, kakak, dll) sebagai **parent tambahan** yang juga bisa melihat dashboard anak.

**Cara kerja:**
- Di halaman "Anak Saya", tombol "Undang" akan membuka dialog dengan pilihan role: **Babysitter** atau **Parent (keluarga)**
- Jika role = parent: orang yang diundang bisa melihat dashboard anak (read-only, sama seperti parent utama)
- Pending invite juga mendukung role parent, sehingga saat orang tersebut mendaftar, otomatis terhubung
- Di kartu anak, akan tampil daftar semua orang yang terhubung (babysitter + parent tambahan) beserta jumlahnya

**Perubahan:**
- Tambah kolom `role` (text, default 'babysitter') di tabel `pending_invites` untuk membedakan undangan parent vs babysitter
- Tambah tabel baru `child_viewers` untuk menyimpan parent tambahan yang bisa melihat data anak (terpisah dari `assignments` yang khusus babysitter)
- RLS: parent tambahan (viewer) bisa SELECT pada children, daily_logs, events
- Update trigger `resolve_pending_invites` agar juga handle role parent
- Update UI dialog invite dengan pilihan role
- Tampilkan jumlah total orang yang diundang/terhubung per anak

### Fitur 2: Foto Attachment pada Event (Babysitter Input)

Babysitter bisa melampirkan foto sebagai bukti aktivitas (misal foto snack, foto anak tidur, dll).

**Cara kerja:**
- Setiap event card di form input akan punya tombol kamera/attachment opsional
- Foto diupload ke storage bucket `event-photos`
- URL foto disimpan di kolom baru `photo_url` pada tabel `events`
- Parent bisa melihat foto di dashboard timeline
- Foto ditampilkan sebagai thumbnail kecil di event card

**Perubahan:**
- Tambah kolom `photo_url` (text, nullable) di tabel `events`
- Buat storage bucket `event-photos` (public) dengan RLS policy
- Update `BabysitterToday.tsx`: tambah tombol upload foto per event row + preview thumbnail
- Update `ParentDashboard.tsx`: tampilkan foto di timeline event
- Update `useCreateEvent` hook untuk meng-handle upload foto

---

### Detail Teknis

**Migrasi Database (1 migrasi):**

```text
1. Tabel child_viewers:
   - id (uuid, PK)
   - child_id (uuid, FK -> children)
   - viewer_user_id (uuid, NOT NULL)
   - created_at (timestamptz)
   - UNIQUE(child_id, viewer_user_id)

2. Kolom baru pending_invites:
   - invite_role (text, default 'babysitter')

3. Kolom baru events:
   - photo_url (text, nullable)

4. Storage bucket: event-photos (public)

5. RLS policies:
   - child_viewers: parent bisa manage, viewer bisa SELECT
   - Update children/daily_logs/events SELECT policies agar viewer juga bisa akses
   - Storage: babysitter bisa upload, semua authenticated bisa view

6. Update fungsi resolve_pending_invites untuk handle invite_role = 'parent'
   -> insert ke child_viewers bukan assignments

7. Fungsi baru: is_viewer_of_child(_user_id, _child_id)
```

**File yang diubah:**
1. `src/pages/ParentChildren.tsx` - Dialog invite dengan pilihan role, tampilkan viewers + jumlah total
2. `src/pages/BabysitterToday.tsx` - Tombol upload foto per event, preview thumbnail
3. `src/pages/ParentDashboard.tsx` - Tampilkan foto di timeline
4. `src/hooks/use-data.ts` - Update createEvent untuk handle photo upload
5. `src/pages/BabysitterHistory.tsx` - Tampilkan foto di riwayat (opsional)

