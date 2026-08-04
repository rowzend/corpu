# KMS Filter + Healthcheck + Deploy Sync (2026-06-12)

## 1. Healthcheck Frontend

**Masalah:** Container `asncorpu-frontend-nextjs` tidak punya healthcheck → status cuma "Up" tanpa "(healthy)"
**Penyebab:** Service `asncorpu-frontend` di `docker-compose.prod.yml` & `docker-compose.local.yml` tidak ada `healthcheck:`
**Bug:** `localhost` resolve ke IPv6 di container Alpine, server cuma listen di IPv4

**Fix:**
- Tambah healthcheck di `docker-compose.prod.yml` & `docker-compose.local.yml`
- Pake `127.0.0.1` bukan `localhost` (karena localhost → IPv6 di Alpine)
- `wget --spider -q http://127.0.0.1:3004/`

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:3004/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 2. KMS Filter: Pemisahan KMS vs LMS

**Masalah:** Sidebar `/kms` menampilkan semua kategori termasuk "Materi LMS" (id=38) yang seharusnya untuk LMS
**Kebingungan user:** Article count di badge (misal angka 2, 1) membingungkan karena campur KMS dan LMS

**Fix:**
- Filter kategori di `frontend/app/(main)/kms/page.tsx`
- Exclude `LMS_CATEGORY_IDS = [38]` (Materi LMS) dari sidebar KMS
- Stats "Kategori" juga pake `kmsCategories.length` bukan `categories.length`

```typescript
const KMS_ONLY_CATEGORY_IDS = [38];
const kmsCategories = categories.filter(c => !KMS_ONLY_CATEGORY_IDS.includes(c.id));
const categoryTree = buildCategoryTree(kmsCategories);
```

**Struktur Kategori:**
- **KMS** (Knowledge Management System): KOMPETENSI UMUM (id=3), KOMPETENSI TEKNIS (id=7)
- **LMS** (Learning Management System): Materi LMS (id=38)
- Semua 58 artikel saat ini ada di **Materi LMS**, belum ada artikel di kategori KMS

## 3. Artikel Migration (Revert)

**Awal:** 58 artikel di Materi LMS (id=38) — semua artikel
**Tindakan:** Pindahkan 43 artikel ke kategori KMS sesuai judul via script `migrate_kms.py`
**Revert:** User minta kembali → semua 58 artikel dikembalikan ke Materi LMS (id=38)

Caranya:
```bash
# Pindah semua artikel ke Materi LMS
docker exec asncorpu_backend_app python3 manage.py shell -c "
from apps.knowledge.models import Article, Category
lms = Category.objects.get(id=38)
Article.objects.exclude(category=lms).update(category=lms)
"
```

## 4. Deployment ke VPS

```bash
# Rsync semua source (exclude node_modules, .next, __pycache__, .git)
rsync -avz --progress --delete \
  --exclude=node_modules --exclude=.next --exclude=__pycache__ \
  --exclude=venv --exclude=.venv --exclude=.git \
  -e "sshpass -p '5406@Admin' ssh -o StrictHostKeyChecking=no" \
  /home/prakom/project-docker/all-projects-darireal/projects/asncorpu/ \
  admin@103.143.152.139:/tmp/asncorpu-sync/

# Rebuild & deploy
ssh admin@103.143.152.139 "echo '5406@Admin' | sudo -S docker compose \
  -f /tmp/asncorpu-sync/docker-compose.prod.yml up -d --build"
```

## File yang Diubah
| File | Perubahan |
|------|-----------|
| `frontend/app/(main)/kms/page.tsx` | Tambah filter LMS_CATEGORY_IDS, pakai kmsCategories untuk tree display |
| `docker-compose.prod.yml` | Tambah healthcheck frontend (127.0.0.1) |
| `docker-compose.local.yml` | Tambah healthcheck frontend (127.0.0.1) |
| `MD/07-server-vps.md` | Update status container, tambah section KMS vs LMS |

## Catatan
- Untuk isi KMS, perlu bikin artikel baru di kategori KOMPETENSI UMUM / KOMPETENSI TEKNIS
- Container di VPS sudah `(healthy)` untuk semua service asncorpu
