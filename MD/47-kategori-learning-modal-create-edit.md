# 47. Kategori Learning — Modal Create/Edit Form

## Tanggal: 2026-06-13

## Ringkasan
Mengubah form create/edit kategori dari **inline form** (ditampilkan di bawah header) menjadi **modal dialog** menggunakan Radix UI Dialog (shadcn/ui).

---

## Perubahan

### File
`frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx`

### Detail Perubahan

**Sebelum:**
- Form create/edit muncul sebagai `<div>` inline di antara header dan daftar kategori
- Dikontrol oleh `{showCreateForm && (...)}` — form tampil di bawah header
- Tombol close manual (`X` dari lucide-react)

**Sesudah:**
- Form dibungkus dalam `<Dialog>` component dari shadcn/ui
- Dikontrol oleh `open={showCreateForm}` dan `onOpenChange`
- Menggunakan `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>`, `<DialogFooter>`
- Tombol close otomatis dari `DialogContent` (Radix UI)

### Import Berubah
```tsx
// Sebelum
import { Edit, Save, Loader2, X } from 'lucide-react';

// Sesudah
import { Edit, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
```

### Struktur Baru
```tsx
<Dialog open={showCreateForm} onOpenChange={(open) => { if (!open) handleCancel(); }}>
    <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
        </DialogHeader>
        {/* form fields — tidak berubah */}
        <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Batal</Button>
            <Button onClick={...}>Simpan/Perbarui</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

### Perilaku
| Skenario | Hasil |
|----------|-------|
| Klik "Tambah Kategori" | Modal terbuka |
| Klik tombol Edit di row kategori | Modal terbuka dengan data terisi |
| Klik Batal / klik luar modal / tekan Escape | Modal tertutup, form di-reset via `handleCancel()` |
| Submit sukses | Modal tertutup otomatis, toast sukses |
| SweetAlert (error/konfirmasi) | Tidak terblokir — sudah di-handle oleh `disableDialogOverlay` di `sweetalert.ts` |

### Catatan
- Tidak ada perubahan pada logika CRUD (handleCreate, handleUpdate, handleDelete tetap sama)
- Tidak ada perubahan pada backend
- Tidak ada perubahan pada tampilan daftar kategori (tree view)
- Form fields tetap sama: name, parent (RemoteSearchSelect), order_index, is_active, description

---

## File Terkait
| File | Perubahan |
|------|-----------|
| `frontend/app/(admin)/manajemen-data/kategori-learning/page.tsx` | ✅ Ganti inline form → modal dialog |

---

## Status Final
| Item | Status |
|------|--------|
| Inline form → Modal dialog | ✅ Done |
| Create via modal | ✅ Done |
| Edit via modal | ✅ Done |
| Dialog close (luar/escape) reset form | ✅ Done |
| SweetAlert kompatibel | ✅ Sudah dari sebelumnya |
