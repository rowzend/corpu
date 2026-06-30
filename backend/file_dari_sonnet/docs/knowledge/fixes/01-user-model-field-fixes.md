# User Model Field Fixes - Article & Comment Likes Management

**Tanggal**: 11 Mei 2026  
**Status**: ✅ Selesai

## Masalah

Error `FieldError: Cannot resolve keyword 'first_name' into field` terjadi saat mengakses halaman manajemen likes karena User model tidak memiliki field `first_name` dan `last_name`, melainkan hanya field `name`.

## Struktur User Model

```python
class User(AbstractBaseUser):
    name = models.CharField(max_length=191)  # ✅ Field yang ada
    email = models.EmailField(max_length=191, unique=True, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True)
    # ❌ TIDAK ADA: first_name, last_name
```

## Perubahan yang Dilakukan

### 1. File: `apps/knowledge/views.py`

#### Fungsi: `article_like_manage_list()` (Line ~1253)
**Sebelum:**
```python
if search:
    likes = likes.filter(
        Q(article__title__icontains=search) |
        Q(user__username__icontains=search) |
        Q(user__first_name__icontains=search) |  # ❌ Error
        Q(user__last_name__icontains=search)     # ❌ Error
    )
```

**Sesudah:**
```python
if search:
    likes = likes.filter(
        Q(article__title__icontains=search) |
        Q(user__username__icontains=search) |
        Q(user__name__icontains=search)  # ✅ Fixed
    )
```

#### Fungsi: `comment_like_manage_list()` (Line ~1372)
**Sebelum:**
```python
if search:
    likes = likes.filter(
        Q(comment__content__icontains=search) |
        Q(comment__article__title__icontains=search) |
        Q(user__username__icontains=search) |
        Q(user__first_name__icontains=search) |  # ❌ Error
        Q(user__last_name__icontains=search)     # ❌ Error
    )
```

**Sesudah:**
```python
if search:
    likes = likes.filter(
        Q(comment__content__icontains=search) |
        Q(comment__article__title__icontains=search) |
        Q(user__username__icontains=search) |
        Q(user__name__icontains=search)  # ✅ Fixed
    )
```

### 2. File: `templates/knowledge/likes/article_likes_list.html`

#### Most Active Users Section
**Sebelum:**
```html
<strong>{{ user.user__first_name }} {{ user.user__last_name|default:user.user__username }}</strong>
```

**Sesudah:**
```html
<strong>{{ user.user__name|default:user.user__username }}</strong>
```

#### User Display in Table
**Sebelum:**
```html
<div>{{ like.user.get_full_name|default:like.user.username }}</div>
```

**Sesudah:**
```html
<div>{{ like.user.name|default:like.user.username }}</div>
```

### 3. File: `templates/knowledge/likes/comment_likes_list.html`

#### Most Active Users Section
**Sebelum:**
```html
<strong>{{ user.user__first_name }} {{ user.user__last_name|default:user.user__username }}</strong>
<span class="badge bg-primary rounded-pill">{{ user.total_actions }} actions</span>
```

**Sesudah:**
```html
<strong>{{ user.user__name|default:user.user__username }}</strong>
<span class="badge bg-primary rounded-pill">{{ user.total_actions }} aksi</span>
```

#### User Display in Table
**Sebelum:**
```html
<div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
    {{ like.user.get_full_name.0|default:like.user.username.0|upper }}
</div>
<div>
    <div>{{ like.user.get_full_name|default:like.user.username }}</div>
    <small class="text-muted">@{{ like.user.username }}</small>
</div>
```

**Sesudah:**
```html
<div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
    {{ like.user.name.0|default:like.user.username.0|upper }}
</div>
<div>
    <div>{{ like.user.name|default:like.user.username }}</div>
    <small class="text-muted">@{{ like.user.username }}</small>
</div>
```

## Perubahan Tambahan: Terjemahan ke Bahasa Indonesia

Semua label dan teks di template `comment_likes_list.html` telah diterjemahkan ke Bahasa Indonesia:

- "Total Likes" → "Total Suka"
- "Total Dislikes" → "Total Tidak Suka"
- "Suspicious Users" → "Pengguna Mencurigakan"
- "Suspicious Activity Detected!" → "Aktivitas Mencurigakan Terdeteksi!"
- "Most Active Users" → "Pengguna Paling Aktif"
- "Most Liked Comments" → "Komentar Paling Disukai"
- "Search" → "Cari"
- "Article" → "Artikel"
- "Action" → "Aksi"
- "Date From" → "Tanggal Dari"
- "Date To" → "Tanggal Sampai"
- "Delete Selected" → "Hapus Terpilih"
- "actions" → "aksi"
- "likes" → "suka"

## Testing

### URL yang Diperbaiki:
1. ✅ `/knowledge/manage/article-likes/` - Article Likes Management
2. ✅ `/knowledge/manage/comment-likes/` - Comment Likes Management

### Fitur yang Ditest:
- ✅ Search by username (menggunakan `user__name`)
- ✅ Display user name di tabel
- ✅ Display user name di "Most Active Users"
- ✅ Avatar initial dari user name
- ✅ Semua label dalam Bahasa Indonesia

## Catatan Penting

### User Model Method `get_full_name()`
User model memiliki method `get_full_name()` yang return `self.name`:

```python
def get_full_name(self):
    """Override to return name"""
    return self.name
```

Namun, untuk konsistensi dan menghindari kebingungan, lebih baik langsung menggunakan field `name` di template dan query.

### Field yang Tersedia di User Model:
- ✅ `name` - Nama lengkap user
- ✅ `username` - Username untuk login
- ✅ `email` - Email (nullable)
- ✅ `id_pegawai` - FK ke ms_pegawai
- ✅ `user_id_opd` - ID OPD user
- ✅ `image` - Path to profile image
- ❌ `first_name` - TIDAK ADA
- ❌ `last_name` - TIDAK ADA

## Hasil

Semua error `FieldError: Cannot resolve keyword 'first_name'` telah diperbaiki dan halaman manajemen likes dapat diakses dengan normal. Container telah direstart dan berjalan dengan status healthy.

## Referensi

- User Model: `apps/accounts/models.py`
- Views: `apps/knowledge/views.py`
- Templates: 
  - `templates/knowledge/likes/article_likes_list.html`
  - `templates/knowledge/likes/comment_likes_list.html`
