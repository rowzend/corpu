# 🔌 API CRUD Implementation Guide

**Panduan Lengkap Implementasi API CRUD**

---

## 📋 Overview

Panduan ini menjelaskan cara membuat API CRUD dari nol. **Bukan template**, tapi **panduan** yang bisa kamu ikuti atau minta AI untuk implementasi.

---

## 🎯 Struktur API CRUD

### File yang Dibutuhkan:

```
apps/your_app/
├── models.py           ← Model (database table)
├── serializers.py      ← Serializer (validation & JSON)
├── views.py            ← ViewSet (API endpoints)
├── urls.py             ← URL routing
└── permissions.py      ← Custom permissions (optional)
```

---

## 📝 Step-by-Step Implementation

### Step 1: Model (Database Table)

**File:** `apps/your_app/models.py`

**Struktur Umum:**
```python
class YourModel(models.Model):
    # Required fields
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    
    # Optional fields
    description = models.TextField(blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'your_table_name'
        ordering = ['name']
    
    def __str__(self):
        return self.name
```

**Contoh: Kategori Buku**
```python
class BookCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'book_categories'
        ordering = ['name']
```

### Step 2: Serializer (Validation)

**File:** `apps/your_app/serializers.py`

**Struktur Umum:**
```python
class YourModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = YourModel
        fields = ['id', 'name', 'slug', 'description', 'is_active', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Name too short")
        return value
```

### Step 3: ViewSet (API Endpoints)

**File:** `apps/your_app/views.py`

**Struktur Umum:**
```python
class YourModelViewSet(viewsets.ModelViewSet):
    queryset = YourModel.objects.all()
    serializer_class = YourModelSerializer
    permission_classes = [IsAuthenticated]
    
    # Optional: Custom actions
    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

### Step 4: URLs (Routing)

**File:** `apps/your_app/urls.py`

**Struktur Umum:**
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import YourModelViewSet

router = DefaultRouter()
router.register('your-endpoint', YourModelViewSet, basename='your-model')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Include di core/urls.py:**
```python
urlpatterns = [
    path('api/v1/', include('apps.your_app.urls')),
]
```

### Step 5: Migrations

```bash
# Create migrations
docker exec asncorpu_backend_app python manage.py makemigrations

# Run migrations
docker exec asncorpu_backend_app python manage.py migrate
```

---

## 🔐 Authentication & Permissions

### Basic: IsAuthenticated

```python
permission_classes = [IsAuthenticated]
# User harus login
```

### Custom: Role-Based

```python
class YourModelPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.role == 'admin':
            return True
        if request.user.role == 'editor':
            return view.action in ['list', 'retrieve', 'create', 'update']
        if request.user.role == 'viewer':
            return view.action in ['list', 'retrieve']
        return False
```

---

## 📊 Generated API Endpoints

Setelah setup, otomatis dapat endpoints:

```
GET    /api/v1/your-endpoint/          # List all
POST   /api/v1/your-endpoint/          # Create new
GET    /api/v1/your-endpoint/{id}/     # Get one
PUT    /api/v1/your-endpoint/{id}/     # Update (full)
PATCH  /api/v1/your-endpoint/{id}/     # Update (partial)
DELETE /api/v1/your-endpoint/{id}/     # Delete
```

Plus custom actions:
```
GET    /api/v1/your-endpoint/active/   # Custom action
```

---

## ✅ Best Practices

1. **Always use serializers** - Validation otomatis
2. **Use ViewSets** - CRUD otomatis
3. **Add permissions** - Security
4. **Add validation** - Data integrity
5. **Use transactions** - Atomic operations
6. **Add filtering** - Search & filter
7. **Document API** - Swagger/OpenAPI

---

## 🎯 Contoh Lengkap: Kategori Buku

### Request ke AI:

"Buat API CRUD untuk kategori_buku dengan fields: name, slug, description, is_active"

### AI akan buat:

1. Model di `apps/books/models.py`
2. Serializer di `apps/books/serializers.py`
3. ViewSet di `apps/books/views.py`
4. URLs di `apps/books/urls.py`
5. Run migrations
6. Test API

### Result:

```
GET    /api/v1/book-categories/
POST   /api/v1/book-categories/
GET    /api/v1/book-categories/{id}/
PUT    /api/v1/book-categories/{id}/
PATCH  /api/v1/book-categories/{id}/
DELETE /api/v1/book-categories/{id}/
GET    /api/v1/book-categories/active/
```

---

## 🔗 Related Documentation

- [012_BACKEND_FRONTEND_COMMUNICATION.md](../docs/012_BACKEND_FRONTEND_COMMUNICATION.md) - Complete API guide
- [011_DJANGO_ADMIN_PANEL.md](../docs/011_DJANGO_ADMIN_PANEL.md) - Admin panel

---

**Last Updated:** April 24, 2026
