# Duration Remaining, Validasi Durasi & SweetAlert Z-Index Fix (2026-06-13)

## Ringkasan

Tiga perubahan utama:
1. **Sisa Waktu Durasi** — tampilkan sisa menit di halaman learn, my-progress, my-courses
2. **Validasi Durasi via SweetAlert** — peringatan jika total durasi lesson > durasi kursus
3. **SweetAlert Z-Index Fix** — SweetAlert tidak bisa diklik saat modal Radix UI Dialog terbuka

---

## 1. Sisa Waktu Durasi (Remaining Duration)

### Backend

| File | Perubahan |
|------|-----------|
| `backend/apps/learning/views_api.py` | Progress API return `total_duration_minutes`, `completed_duration_minutes`, `remaining_duration_minutes` |
| `backend/apps/learning/serializers.py` | `EnrollmentSerializer` tambah 3 field via `SerializerMethodField` |

**Logic:**
```
total_duration        = SUM semua lesson.duration_minutes di course
completed_duration    = SUM lesson.duration_minutes yang sudah selesai
remaining_duration    = total_duration - completed_duration
```

**Auto-hide:** Jika semua lesson belum diisi `duration_minutes` (total = 0), baris durasi tidak tampil.

### Frontend

| Halaman | File | Tampilan |
|---------|------|----------|
| **Learn Page** (sidebar) | `frontend/app/(admin)/courses/[slug]/learn/page.tsx` | `🕐 Sisa X menit · Total Y menit` |
| **My Progress** (per kartu) | `frontend/app/(admin)/courses/my-progress/page.tsx` | `Xm selesai · Sisa Ym · Total Zm` |
| **My Courses** (per kartu) | `frontend/app/(admin)/courses/my-courses/page.tsx` | `Xm selesai · Sisa Ym · Total Zm` |

---

## 2. Validasi Durasi via SweetAlert

### File: `frontend/app/(admin)/learning/courses/[slug]/page.tsx`

#### Saat Simpan Pelajaran (`handleLessonSubmit`)
- Hitung total durasi semua lesson dari `modules` state
- Jika edit lesson, kurangi durasi lama
- Jika **newTotal > courseDuration** → muncul `showConfirm`:
  > "Total durasi semua pelajaran (X menit) melebihi durasi kursus (Y menit). Apakah Anda tetap ingin menyimpan?"
- Pilihan: **Tetap Simpan** atau **Perbaiki Durasi**

#### Saat Simpan Kursus (`handleSubmit`)
- Jika **courseDuration < totalLessonDuration** → muncul `showConfirm`:
  > "Durasi kursus (X menit) lebih kecil dari total durasi semua pelajaran (Y menit). Apakah Anda tetap ingin menyimpan?"
- Pilihan: **Tetap Simpan** atau **Perbaiki Durasi**

---

## 3. SweetAlert Z-Index Fix + CDN Cleanup

### Masalah
Saat **Radix UI Dialog** (modal) terbuka, lalu SweetAlert dipanggil:
- SweetAlert tampil secara visual (z-index tinggi) ✅
- Tapi **tidak bisa diklik** — klik tertangkap oleh `DialogOverlay` ❌
- **ESC** tidak bisa nutup SweetAlert, harus nutup modal dulu ❌

### Root Cause
`DialogOverlay` punya `pointer-events: auto` yang menutupi seluruh layar. Meskipun SweetAlert punya z-index 99999, Radix UI menangkap semua pointer events dan fokus.

### Fix

#### File 1: `frontend/components/ui/dialog.tsx`
```tsx
<DialogPrimitive.Overlay
  ref={ref}
  data-radix-dialog-overlay  // ← TAMBAH: selector untuk JavaScript
  ...
/>
```

#### File 2: `frontend/lib/sweetalert.ts`
- Tambah fungsi `disableDialogOverlay(disable)` — set `pointer-events: none` pada semua `[data-radix-dialog-overlay]`
- Tambah `swalBase(extra)` — wrapper yang otomatis panggil `disableDialogOverlay(true)` di `willOpen` dan `false` di `didClose`
- Semua fungsi (`showSuccess`, `showError`, `showConfirm`, `showDeleteConfirm`, `showWarning`, `showInfo`, `showInput`, `showCustom`, `showLoading`) sudah pakai `swalBase`

**Alur:**
1. SweetAlert `willOpen` → overlay dialog di-set `pointer-events: none`
2. User klik SweetAlert → berfungsi (tidak tertangkap overlay)
3. SweetAlert `didClose` → `pointer-events` overlay dikembalikan

---

## 4. CDN Cleanup — Hapus Semua Dependency Eksternal

### Masalah
Ditemukan 2 file masih pakai CDN `cdn.tailwindcss.com`:
- `backend/templates/404.html`
- `backend/templates/500.html`

### Fix
Diganti dengan **inline CSS** murni (tanpa eksternal script), jadi halaman error tetap tampil rapi **tanpa perlu koneksi internet**.

### File Lain (Aman — Bukan CDN)
| File | Temuan | Status |
|------|--------|--------|
| `backend/static/vendor/amcharts5/themes/Spiral.js` | Referensi `cloudflare.com/favicon.ico` di komentar | ✅ Bukan CDN |
| `backend/static/js/icon-picker.js` | Nama class `fa-cloudflare` di array FontAwesome | ✅ Bukan CDN |
| `frontend/package.json` | Semua dependency via npm lokal | ✅ Aman |

**Hasil:** Proyek **zero CDN dependency** — bisa jalan fully offline.

---

## 5. Pengecekan Semua SweetAlert di Seluruh Project

### Masalah
`frontend/app/(admin)/profile/brand/page.tsx` masih panggil **`Swal.fire()` langsung** dari `sweetalert2`, bukan lewat wrapper → tidak kena fix z-index.

### Fix
Ganti 10+ panggilan `Swal.fire()` jadi `showSuccess()`, `showError()`, `showConfirm()` dari `@/lib/sweetalert`.

### Verifikasi
```
Sebelum: 1 file import Swal langsung (brand/page.tsx)
Sesudah: ✅ 0 file — cuma sweetalert.ts sendiri yang pake Swal
         ✅ Semua fungsi sweetalert.ts sudah pakai swalBase()
         ✅ Semua file lain cuma pake wrapper (showSuccess, showError, dll)
```

**Kesimpulan:** Tidak ada lagi SweetAlert yang bypass fix z-index.

---

## Files Modified Summary

### Backend (Django)
```
backend/apps/learning/
├── views_api.py          # Progress API: total_duration_minutes, completed, remaining
├── serializers.py        # EnrollmentSerializer: 3 field durasi baru
```

### Frontend (Next.js)
```
frontend/
├── components/
│   └── ui/
│       └── dialog.tsx    # Tambah data-radix-dialog-overlay attribute
├── lib/
│   └── sweetalert.ts     # swalBase() + disableDialogOverlay() fix
├── app/(admin)/
│   └── courses/
│       ├── [slug]/learn/page.tsx          # Sisa menit di sidebar
│       ├── my-progress/page.tsx           # Duration per enrollment
│       └── my-courses/page.tsx            # Duration per kartu
│   └── learning/courses/
│       └── [slug]/page.tsx                # Validasi durasi + import showConfirm
├── app/(admin)/profile/brand/
│   └── page.tsx                           # Ganti Swal.fire() → wrapper
└── backend/templates/
    ├── 404.html                           # CDN tailwind → inline CSS
    └── 500.html                           # CDN tailwind → inline CSS
```

## Update 2026-06-13: Timer Prerequisite untuk Quiz

### Deskripsi
Sekarang quiz hanya bisa diakses jika **semua lesson sebelumnya** sudah memiliki `time_spent_minutes >= duration_minutes`. Ini memastikan user benar-benar belajar minimal sesuai durasi yang ditetapkan sebelum bisa mengerjakan quiz.

### Perubahan

**Backend** — `backend/apps/learning/views_api.py`:
- Kedua endpoint progress (`enrollment_detail`, `course_progress`) menambahkan variabel `all_prev_timer_done`
- Setiap lesson mengirim `time_spent_minutes` dari `LessonProgress`
- Untuk lesson tipe `quiz`, `is_unlocked = all_prev_completed AND all_prev_timer_done`
- `timer_done` = `true` jika `time_spent_minutes >= duration_minutes` atau lesson tidak punya durasi

**Frontend** — `frontend/app/(admin)/courses/[slug]/learn/page.tsx`:
- Tombol "Tandai Selesai" sekarang **diblokir** (hard-block via `showWarning`) jika `timeSpent < currentLesson.duration_minutes`
- Pesan: "Kamu baru belajar X menit. Selesaikan minimal Y menit sebelum menandai selesai."

### Alur
1. User buka lesson → timer count-up berjalan
2. Timer belum mencapai `duration_minutes` → tombol "Tandai Selesai" tidak bisa diklik (showWarning)
3. Timer sudah mencapai/melampaui `duration_minutes` → tombol bisa diklik
4. Lesson ditandai selesai → lesson berikutnya ter-unlock
5. Semua lesson sebelum quiz selesai + timer-nya terpenuhi → quiz ter-unlock

### Catatan
- Quiz-type lessons tidak punya tombol "Tandai Selesai" (selesai via passing quiz)
- Timer count-up per lesson tidak perlu mencapai durasi penuh jika admin ingin mengubah setting (hapus `duration_minutes` atau set 0)
- Backend tetap mengirim `is_unlocked` berdasarkan `all_prev_completed` untuk non-quiz lessons (tidak berubah)

---

## Related MD Files
| File | Description |
|------|-------------|
| `MD/33-duration-minutes-permission-granular-fix.md` | Duration minutes awal |
| `MD/36-lesson-link-fix-and-sweetalert-zindex.md` | SweetAlert z-index issue sebelumnya |
| `MD/37-fix-summary-lesson-link-sweetalert.md` | Summary fix sebelumnya |
| `MD/44-comprehensive-changes-summary.md` | Comprehensive summary |
| `MD/45-duration-remaining-sweetalert-zindex-fix.md` | **This file** |
