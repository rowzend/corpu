# Ratings Management - Knowledge Base

**Tanggal**: 11 Mei 2026  
**Status**: ✅ Selesai  
**URL**: `/knowledge/manage/ratings/`

## 📋 Overview

Fitur Ratings Management memungkinkan admin untuk melihat, moderasi, dan analisis rating artikel yang diberikan oleh user. Rating menggunakan skala 1-5 bintang (⭐) dengan optional text feedback.

## 🎯 Fitur Utama

### 1. **List & Filter Ratings**
- ✅ List semua ratings dengan pagination (25 items per page)
- ✅ Filter by:
  - Article (dropdown)
  - Rating value (1-5 stars)
  - Has feedback (yes/no/all)
  - Date range (from-to)
- ✅ Search by: Article title, username, feedback content

### 2. **Statistics Dashboard**
- ✅ Total Ratings
- ✅ Average Rating (overall)
- ✅ Ratings with Feedback count
- ✅ Ratings without Feedback count
- ✅ Rating Distribution (bar chart 1-5 stars)

### 3. **Analytics**
- ✅ **Most Active Raters**: Top 10 users yang paling banyak memberi rating
  - Shows: Username, total ratings, average rating given
- ✅ **Most Rated Articles**: Top 10 artikel yang paling banyak dirating
  - Shows: Article title, rating count, average rating

### 4. **Moderation Tools**
- ✅ View rating detail (article, user, rating, feedback, date)
- ✅ Delete specific rating
- ✅ Bulk delete selected ratings
- ✅ Link to article (view in new tab)

## 🗂️ Database Structure

### Table: `knowledge_ratings`
```sql
CREATE TABLE knowledge_ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,           -- 1-5
    feedback TEXT NULL,             -- Optional text feedback
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES knowledge_articles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_article (user_id, article_id)
);
```

**Constraints**:
- User hanya bisa memberi 1 rating per artikel
- Rating value: 1-5 (validated)
- Feedback optional (bisa kosong)

## 🔐 Permissions

### Permission Structure:
```
knowledge.rating.view   - View ratings list and details
knowledge.rating.delete - Delete ratings (moderation)
```

### Assigned to:
- ✅ Super Admin (full access)

## 📁 File Structure

### Backend:
```
apps/knowledge/
├── views.py
│   ├── rating_manage_list()      # List & filter ratings
│   ├── rating_delete()            # Delete confirmation
│   └── rating_bulk_delete()       # AJAX bulk delete
├── urls.py
│   ├── /manage/ratings/
│   ├── /manage/ratings/<id>/delete/
│   └── /ajax/ratings/bulk-delete/
└── management/commands/
    └── seed_knowledge_ratings_permissions.py
```

### Frontend:
```
templates/knowledge/ratings/
├── rating_list.html               # Main list page
└── rating_delete.html             # Delete confirmation
```

## 🎨 UI Components

### 1. Statistics Cards (Grid 4 Columns)
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ ⭐ Total    │ 📊 Avg      │ 💬 With     │ 🚫 Without  │
│ Ratings     │ Rating      │ Feedback    │ Feedback    │
│ 150         │ 4.2         │ 80          │ 70          │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### 2. Rating Distribution Bar Chart
```
5 ⭐ ████████████████████████████ 80
4 ⭐ ████████████████ 40
3 ⭐ ████████ 20
2 ⭐ ████ 8
1 ⭐ ██ 2
```

### 3. Filter Form (Grid 7 Columns)
- Search (2 cols)
- Article dropdown (1 col)
- Rating dropdown (1 col)
- Has Feedback dropdown (1 col)
- Date From (1 col)
- Date To (1 col)
- Buttons (7 cols span)

### 4. Data Table
| ☑ | Artikel | Pengguna | Rating | Feedback | Tanggal | Aksi |
|---|---------|----------|--------|----------|---------|------|
| ☑ | Artikel A | John | ⭐⭐⭐⭐⭐ | "Bagus!" | 10 Mei | 👁️ 🗑️ |

### 5. Analytics Cards (Grid 2 Columns)
- Most Active Raters (left)
- Most Rated Articles (right)

## 🔄 User Workflow

### Normal User (Public):
1. User buka artikel
2. Klik rating stars (1-5)
3. Optional: Tulis feedback
4. Submit → Rating tersimpan

### Admin (Management):
1. Login sebagai admin
2. Buka `/knowledge/manage/ratings/`
3. Lihat semua ratings dengan statistics
4. Filter/search jika perlu
5. Delete rating yang spam/inappropriate
6. Bulk delete jika banyak spam

## 📊 Statistics Calculation

### Average Rating:
```python
avg_rating = Rating.objects.aggregate(avg=Avg('rating'))['avg']
```

### Rating Distribution:
```python
for i in range(1, 6):
    rating_distribution[i] = Rating.objects.filter(rating=i).count()
```

### Most Active Raters:
```python
most_active_raters = Rating.objects.values(
    'user__username', 'user__name'
).annotate(
    total_ratings=Count('id'),
    avg_rating_given=Avg('rating')
).order_by('-total_ratings')[:10]
```

### Most Rated Articles:
```python
most_rated_articles = Article.objects.annotate(
    rating_count_calc=Count('ratings'),
    avg_rating_calc=Avg('ratings__rating')
).filter(rating_count_calc__gt=0).order_by('-rating_count_calc')[:10]
```

## 🎯 Use Cases

### 1. Moderasi Rating Spam
**Scenario**: User memberi rating 1 star dengan feedback spam
**Action**: Admin delete rating tersebut

### 2. Analisis Kualitas Artikel
**Scenario**: Ingin tahu artikel mana yang rating-nya paling tinggi
**Action**: Lihat "Most Rated Articles" section, sort by average rating

### 3. Identifikasi User Aktif
**Scenario**: Ingin tahu user mana yang paling aktif memberi rating
**Action**: Lihat "Most Active Raters" section

### 4. Bulk Cleanup
**Scenario**: Ada banyak rating spam dari bot
**Action**: Select multiple ratings → Bulk delete

## 🔍 Filter Examples

### Filter by Rating Value:
```
URL: /knowledge/manage/ratings/?rating=5
Result: Hanya tampilkan rating 5 bintang
```

### Filter by Has Feedback:
```
URL: /knowledge/manage/ratings/?has_feedback=yes
Result: Hanya tampilkan rating yang ada feedback-nya
```

### Filter by Date Range:
```
URL: /knowledge/manage/ratings/?date_from=2026-05-01&date_to=2026-05-11
Result: Rating dari 1-11 Mei 2026
```

### Combined Filters:
```
URL: /knowledge/manage/ratings/?article=5&rating=1&has_feedback=yes
Result: Rating 1 star dengan feedback untuk artikel ID 5
```

## 🚀 API Endpoints

### 1. List Ratings (GET)
```
GET /knowledge/manage/ratings/
Query params:
  - search: string
  - article: int
  - rating: 1-5
  - has_feedback: yes/no/all
  - date_from: YYYY-MM-DD
  - date_to: YYYY-MM-DD
  - page: int
```

### 2. Delete Rating (POST)
```
POST /knowledge/manage/ratings/<id>/delete/
Response: Redirect to list with success message
```

### 3. Bulk Delete (AJAX POST)
```
POST /ajax/ratings/bulk-delete/
Body: {
  rating_ids[]: [1, 2, 3, ...]
}
Response: {
  success: true,
  deleted_count: 3,
  message: "3 rating berhasil dihapus"
}
```

## 🎨 Styling (Tailwind CSS)

### Color Scheme:
- **Yellow**: Rating stars, total ratings card
- **Blue**: Average rating card
- **Green**: With feedback card
- **Red**: Without feedback card, delete buttons

### Components:
- Cards: `bg-white rounded-lg shadow p-6`
- Buttons: `bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700`
- Table: `w-full` with hover effects
- Stars: `text-yellow-400` (filled), `text-gray-300` (empty)

## ✅ Testing Checklist

- [x] List ratings displays correctly
- [x] Statistics cards show accurate data
- [x] Rating distribution chart works
- [x] Filter by article works
- [x] Filter by rating value works
- [x] Filter by has feedback works
- [x] Filter by date range works
- [x] Search functionality works
- [x] Pagination works
- [x] Delete single rating works
- [x] Bulk delete works
- [x] Analytics sections display correctly
- [x] Responsive design on mobile
- [x] Permissions enforced correctly

## 📝 Notes

1. **No Create/Edit Form**: Ratings dibuat otomatis oleh user dari halaman artikel, tidak perlu form manual
2. **One Rating Per User**: User hanya bisa memberi 1 rating per artikel (enforced by unique constraint)
3. **Optional Feedback**: Feedback text adalah optional, user bisa rating tanpa feedback
4. **Soft Delete**: Saat ini menggunakan hard delete, bisa diubah ke soft delete jika perlu audit trail
5. **Rating Range**: Rating value di-validate 1-5 di model level

## 🔗 Related Features

- **Article Detail**: User memberi rating dari halaman artikel
- **Article Management**: Admin bisa lihat average rating per artikel
- **User Profile**: Bisa ditambahkan "My Ratings" section (future)

## 📚 References

- Views: `apps/knowledge/views.py` (line ~1540-1680)
- URLs: `apps/knowledge/urls.py`
- Templates: `templates/knowledge/ratings/`
- Models: `apps/knowledge/models.py` (Rating model)
- Permissions: `seed_knowledge_ratings_permissions.py`
- Menu: `seed_knowledge_menus.py`

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
