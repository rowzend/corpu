# Fix: Error Autentikasi saat Menambah Kategori

## Masalah
Saat mencoba menambah kategori baru melalui frontend admin, muncul error:
- "Data autentikasi tidak diberikan" (401 Unauthorized)
- "Bad Request" (400) dengan pesan "slug field harus diisi"

## Penyebab
1. **Error 401**: Di file `frontend/lib/api/knowledge.ts`, fungsi `createCategory` memanggil `api.post()` dengan parameter `includeAuth=false`, sehingga token autentikasi tidak dikirim.

2. **Error 400**: Field `slug` di model Category memiliki constraint `unique=True` tanpa `blank=True`, sehingga Django REST Framework menganggapnya required, padahal seharusnya auto-generated dari `name`.

## Solusi

### 1. Perbaikan Autentikasi (Frontend)
File: `frontend/lib/api/knowledge.ts`

```typescript
// SEBELUM (salah)
export async function createCategory(data: {...}): Promise<{...}> {
    return api.post('/knowledge/categories/', data, false); // ❌ false = no auth
}

// SESUDAH (benar)  
export async function createCategory(data: {...}): Promise<{...}> {
    return api.post('/knowledge/categories/', data, true); // ✅ true = include auth
}
```

Fungsi yang diperbaiki:
- `createCategory()` 
- `updateCategory()`
- `deleteCategory()`
- `createTag()`
- `updateTag()`
- `deleteTag()`

### 2. Perbaikan Field Slug (Backend)
File: `backend/apps/knowledge/serializers.py`

```python
class CategorySerializer(serializers.ModelSerializer):
    # Tambahkan field slug sebagai optional
    slug = serializers.SlugField(required=False)  # ✅ Auto-generated jika kosong
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'parent',
            'order_index', 'is_active', 'article_count', 'full_path',
            'created_at', 'updated_at'
        ]
```

## Testing
Setelah perbaikan, test berhasil:

```bash
curl -X POST http://localhost:3000/apicorpu/1.0/knowledge/categories/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"name": "Test Category", "description": "Test description", "order_index": 0, "is_active": true}'

# Response: 200 OK
{
  "id": 1,
  "name": "Test Category", 
  "slug": "test-category",  # ✅ Auto-generated
  "description": "Test description",
  "parent": null,
  "order_index": 0,
  "is_active": true,
  "article_count": 0,
  "full_path": "Test Category",
  "created_at": "2026-05-19T17:32:31.763739",
  "updated_at": "2026-05-19T17:32:31.763752"
}
```

## Status
✅ **FIXED** - Sekarang admin dapat menambah kategori tanpa error autentikasi atau validasi.

## Restart Required
- Backend: ✅ Sudah di-restart untuk menerapkan perubahan serializer
- Frontend: Tidak perlu restart (hot reload otomatis)