# Timer Resume Fix — Lanjut Timer dari Nilai Tersimpan (2026-06-13)

## Ringkasan
Timer count-up di halaman learn sebelumnya selalu mulai dari `00:00` setiap refresh page. Sekarang timer melanjutkan dari `time_spent_minutes` yang tersimpan di database (`LessonProgress`).

## Perubahan

### Frontend — `frontend/app/(admin)/courses/[slug]/learn/page.tsx`

**Sebelum:**
```js
useEffect(() => {
  setElapsedSeconds(0);        // selalu mulai dari 0
  setTimerRunning(true);
}, [currentLessonIndex]);
```

**Sesudah:**
```js
useEffect(() => {
  const saved = currentLesson?.time_spent_minutes || 0;
  setElapsedSeconds(saved * 60);  // lanjut dari nilai DB (konversi menit→detik)
  setTimerRunning(true);
}, [currentLessonIndex]);
```

### Alur
1. Page load → `fetchData` → lesson punya `time_spent_minutes` dari API
2. `currentLessonIndex` berubah (initial mount atau pindah lesson) → `elapsedSeconds = time_spent_minutes * 60`
3. Timer count-up dari nilai tersebut
4. Klik "Tandai Selesai" → kirim total akumulasi (`elapsedSeconds / 60`) → API simpan
5. Refresh page → timer lanjut dari nilai DB lagi

### Tidak Ada Migrasi Database
Kolom `LessonProgress.time_spent_minutes` sudah ada sejak awal. Tidak perlu migrate.

## Perilaku
| Skenario | Hasil |
|----------|-------|
| Refresh page | Timer lanjut dari `time_spent_minutes` terakhir |
| Pindah lesson | Timer reset ke `time_spent_minutes` lesson baru |
| Tutup tab, buka lagi | Timer lanjut dari DB (tidak nambah selama pergi) |
| Pindah tab browser (page tetap terbuka) | Timer tetap jalan normal |
| Klik "Tandai Selesai" | API simpan total akumulasi (sesi lalu + sesi ini) |

## Update 2026-06-13: Auto-Save & Auto-Pause

### Fitur Baru

1. **Auto-Save Timer (setiap 30 detik)**
   - `time_spent_minutes` otomatis tersimpan ke database setiap 30 detik via API `POST /learning/lessons/{slug}/save_timer/`
   - Tidak perlu klik "Tandai Selesai" — data aman meskipun browser ditutup mendadak
   - Silent fail (tidak ganggu user) jika request gagal
   - Berhenti auto-save setelah lesson ditandai selesai

2. **Auto-Pause saat Pindah Tab**
   - Timer otomatis berhenti saat user pindah ke tab lain (`document.hidden = true`)
   - Timer otomatis lanjut saat user kembali (`document.hidden = false`)
   - Mencegah waktu belajar bertambah saat user tidak benar-benar belajar

### Detail Perubahan

**Backend** — `backend/apps/learning/views_api.py`:
- Method baru `save_timer` di `LessonViewSet`:
  - `POST /learning/lessons/{slug}/save_timer/`
  - Body: `{ "time_spent_minutes": number }`
  - Menyimpan `time_spent_minutes` ke `LessonProgress` tanpa mengubah `is_completed`

**Frontend API** — `frontend/lib/api/learning.ts`:
- Fungsi baru `saveTimerProgress(slug, timeSpentMinutes)`

**Frontend Learn Page** — `frontend/app/(admin)/courses/[slug]/learn/page.tsx`:
- `elapsedRef` (`useRef`) untuk akses nilai terkini `elapsedSeconds` di interval callback
- `useEffect` visibilitychange: pause/resume timer saat pindah/kembali tab
- `useEffect` interval 30 detik: auto-save `time_spent_minutes` selama lesson belum selesai

## Perilaku Lengkap
| Skenario | Hasil |
|----------|-------|
| Refresh page | Timer lanjut dari `time_spent_minutes` terakhir |
| Pindah lesson | Timer reset ke `time_spent_minutes` lesson baru |
| Tutup tab, buka lagi | Timer lanjut dari DB (tidak nambah selama pergi) |
| Pindah tab browser (page tetap terbuka) | Timer **berhenti** otomatis |
| Klik "Tandai Selesai" | API simpan total akumulasi (sesi lalu + sesi ini) |
| Browser crash/tutup mendadak | Auto-save setiap 30 detik → data aman (max rugi 30 detik) |

---

## Related MD Files
| File | Description |
|------|-------------|
| `MD/45-duration-remaining-sweetalert-zindex-fix.md` | Duration remaining, SweetAlert z-index, timer count-up awal |
| `MD/46-timer-resume-fix.md` | **This file** |
| `MD/00-INDEX.md` | Index |
