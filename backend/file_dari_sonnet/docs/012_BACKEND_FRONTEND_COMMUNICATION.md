# 🔄 Backend-Frontend Communication Guide

**Frontend WAJIB via API, JANGAN Langsung ke Database!**

---

## ❌ JANGAN: Frontend Langsung ke Database

### Kenapa TIDAK BOLEH?

```
┌──────────────┐
│   Frontend   │
│  (React/Vue) │
└──────┬───────┘
       │ ❌ LANGSUNG KE DATABASE
       │ (BAHAYA!)
       ▼
┌──────────────┐
│   Database   │
│ (PostgreSQL) │
└──────────────┘
```

**Masalah:**

#### 1. **Security Risk** 🔐
```javascript
// Frontend code (visible di browser!)
const db = new PostgreSQL({
  host: 'localhost',
  user: 'postgres',
  password: 'secret123',  // ❌ Password exposed!
  database: 'asncorpu_db'
});

// User bisa lihat credentials di browser console!
// Hacker bisa akses database langsung!
```

**Bahaya:**
- ❌ Database credentials exposed
- ❌ SQL injection attacks
- ❌ Unauthorized access
- ❌ Data breach
- ❌ No authentication/authorization

#### 2. **No Business Logic** 💼
```javascript
// Frontend langsung insert
db.query(`
  INSERT INTO book_categories (name, slug) 
  VALUES ('${name}', '${slug}')
`);

// ❌ Tidak ada validation
// ❌ Tidak ada duplicate check
// ❌ Tidak ada audit trail
// ❌ Tidak ada error handling
```

#### 3. **No Validation** ✅
```javascript
// Frontend bisa insert data invalid
db.query(`
  INSERT INTO book_categories (name) 
  VALUES ('')  -- ❌ Empty name
`);

db.query(`
  INSERT INTO book_categories (name) 
  VALUES ('A')  -- ❌ Too short
`);
```

#### 4. **Maintenance Nightmare** 😱
```javascript
// Jika struktur database berubah:
// - Harus update semua frontend code
// - Harus update mobile app
// - Harus update admin panel
// - Harus update third-party integrations

// Dengan API: Cukup update backend saja!
```

#### 5. **No Centralized Control** 🎯
```javascript
// Frontend A: Insert dengan format X
// Frontend B: Insert dengan format Y
// Mobile App: Insert dengan format Z

// ❌ Inconsistent data
// ❌ Hard to maintain
// ❌ Data integrity issues
```

---

## ✅ BENAR: Frontend via API

### Arsitektur yang Benar

```
┌──────────────┐
│   Frontend   │
│  (React/Vue) │
└──────┬───────┘
       │ ✅ HTTP Request (API)
       │ POST /api/v1/book-categories/
       ▼
┌──────────────┐
│   Backend    │
│   (Django)   │
│              │
│ - Validation │
│ - Auth       │
│ - Logic      │
│ - Security   │
└──────┬───────┘
       │ ✅ Controlled Access
       ▼
┌──────────────┐
│   Database   │
│ (PostgreSQL) │
└──────────────┘
```

---

## 🎯 Contoh: CRUD Kategori Buku

### Scenario: Frontend perlu CRUD kategori buku

### ✅ Cara yang BENAR

#### **Step 1: Backend (Kamu) - Buat API**

**1.1 Create Model**
```python
# apps/books/models.py
from django.db import models

class BookCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'book_categories'
        verbose_name = 'Book Category'
        verbose_name_plural = 'Book Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
```

**1.2 Create Serializer**
```python
# apps/books/serializers.py
from rest_framework import serializers
from .models import BookCategory

class BookCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCategory
        fields = ['id', 'name', 'slug', 'description', 'is_active', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate name"""
        if len(value) < 3:
            raise serializers.ValidationError(
                "Name must be at least 3 characters"
            )
        return value
    
    def validate_slug(self, value):
        """Validate slug"""
        if not value.replace('-', '').isalnum():
            raise serializers.ValidationError(
                "Slug can only contain letters, numbers, and hyphens"
            )
        return value
```

**1.3 Create ViewSet (API Endpoints)**
```python
# apps/books/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import BookCategory
from .serializers import BookCategorySerializer

class BookCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Book Categories
    
    list:    GET    /api/v1/book-categories/
    create:  POST   /api/v1/book-categories/
    retrieve: GET   /api/v1/book-categories/{id}/
    update:  PUT    /api/v1/book-categories/{id}/
    partial: PATCH  /api/v1/book-categories/{id}/
    destroy: DELETE /api/v1/book-categories/{id}/
    """
    queryset = BookCategory.objects.all()
    serializer_class = BookCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Create new category with validation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Business logic: Auto-generate slug if not provided
        if not serializer.validated_data.get('slug'):
            from django.utils.text import slugify
            serializer.validated_data['slug'] = slugify(
                serializer.validated_data['name']
            )
        
        self.perform_create(serializer)
        
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active categories"""
        active_categories = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_categories, many=True)
        return Response(serializer.data)
```

**1.4 Register URLs**
```python
# apps/books/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookCategoryViewSet

router = DefaultRouter()
router.register('book-categories', BookCategoryViewSet, basename='book-category')

urlpatterns = [
    path('', include(router.urls)),
]

# core/urls.py
urlpatterns = [
    path('api/v1/', include('apps.books.urls')),
]
```

**Backend Done! API Ready:**
```
GET    /api/v1/book-categories/          # List all
POST   /api/v1/book-categories/          # Create new
GET    /api/v1/book-categories/{id}/     # Get one
PUT    /api/v1/book-categories/{id}/     # Update (full)
PATCH  /api/v1/book-categories/{id}/     # Update (partial)
DELETE /api/v1/book-categories/{id}/     # Delete
GET    /api/v1/book-categories/active/   # Get active only
```

---

#### **Step 2: Frontend (Team Lain) - Consume API**

**2.1 Create API Service**
```javascript
// frontend/src/services/bookCategoryService.js
import axios from 'axios';

const API_URL = 'http://localhost:8008/api/v1';

// Get auth token from localStorage
const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

export const bookCategoryService = {
  // GET all categories
  getAll: async () => {
    const response = await axios.get(
      `${API_URL}/book-categories/`,
      getAuthHeader()
    );
    return response.data;
  },
  
  // GET one category
  getById: async (id) => {
    const response = await axios.get(
      `${API_URL}/book-categories/${id}/`,
      getAuthHeader()
    );
    return response.data;
  },
  
  // POST create category
  create: async (data) => {
    const response = await axios.post(
      `${API_URL}/book-categories/`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  
  // PUT update category
  update: async (id, data) => {
    const response = await axios.put(
      `${API_URL}/book-categories/${id}/`,
      data,
      getAuthHeader()
    );
    return response.data;
  },
  
  // DELETE category
  delete: async (id) => {
    await axios.delete(
      `${API_URL}/book-categories/${id}/`,
      getAuthHeader()
    );
  },
  
  // GET active categories
  getActive: async () => {
    const response = await axios.get(
      `${API_URL}/book-categories/active/`,
      getAuthHeader()
    );
    return response.data;
  }
};
```

**2.2 Use in Component**
```javascript
// frontend/src/components/BookCategoryList.jsx
import React, { useState, useEffect } from 'react';
import { bookCategoryService } from '../services/bookCategoryService';

function BookCategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await bookCategoryService.getAll();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Create category
  const handleCreate = async (formData) => {
    try {
      await bookCategoryService.create(formData);
      loadCategories(); // Reload list
      alert('Category created successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  // Update category
  const handleUpdate = async (id, formData) => {
    try {
      await bookCategoryService.update(id, formData);
      loadCategories(); // Reload list
      alert('Category updated successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  // Delete category
  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await bookCategoryService.delete(id);
        loadCategories(); // Reload list
        alert('Category deleted successfully!');
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Book Categories</h1>
      <button onClick={() => handleCreate({
        name: 'New Category',
        description: 'Description here'
      })}>
        Add Category
      </button>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.slug}</td>
              <td>{category.is_active ? 'Active' : 'Inactive'}</td>
              <td>
                <button onClick={() => handleUpdate(category.id, {
                  name: 'Updated Name'
                })}>
                  Edit
                </button>
                <button onClick={() => handleDelete(category.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BookCategoryList;
```

---

## 🎯 Keuntungan Pakai API

### 1. **Security** 🔐

```python
# Backend (Secure)
@permission_classes([IsAuthenticated])
class BookCategoryViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # ✅ Check authentication
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthorized'}, status=401)
        
        # ✅ Check permission
        if not request.user.has_perm('books.add_bookcategory'):
            return Response({'error': 'Forbidden'}, status=403)
        
        # ✅ Validate data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # ✅ Business logic
        # ... safe processing ...
        
        return Response(serializer.data, status=201)
```

**Frontend tidak perlu tahu:**
- Database credentials
- Database structure
- SQL queries
- Security logic

### 2. **Validation** ✅

```python
# Backend handles all validation
class BookCategorySerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        # ✅ Length check
        if len(value) < 3:
            raise ValidationError("Too short")
        
        # ✅ Duplicate check
        if BookCategory.objects.filter(name=value).exists():
            raise ValidationError("Already exists")
        
        # ✅ Format check
        if not value.replace(' ', '').isalpha():
            raise ValidationError("Invalid format")
        
        return value
```

**Frontend hanya perlu:**
```javascript
try {
  await bookCategoryService.create(data);
  // Success
} catch (error) {
  // Show error message from backend
  alert(error.response.data.name[0]);
}
```

### 3. **Business Logic** 💼

```python
# Backend handles complex logic
def create(self, request):
    # ✅ Auto-generate slug
    if not data.get('slug'):
        data['slug'] = slugify(data['name'])
    
    # ✅ Set default values
    data.setdefault('is_active', True)
    
    # ✅ Audit trail
    category = BookCategory.objects.create(
        **data,
        created_by=request.user
    )
    
    # ✅ Send notification
    send_notification(
        'New category created',
        category.name
    )
    
    # ✅ Log activity
    log_activity(
        user=request.user,
        action='create_category',
        object=category
    )
    
    return Response(serializer.data)
```

**Frontend simple:**
```javascript
// Just call API
await bookCategoryService.create({ name: 'Fiction' });
// Backend handles everything!
```

### 4. **Flexibility** 🔄

```python
# Jika database structure berubah:
# OLD: book_categories.name
# NEW: book_categories.category_name

# Backend update:
class BookCategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='category_name')
    # API response tetap sama!

# Frontend: NO CHANGES NEEDED! ✅
```

### 5. **Multiple Clients** 📱

```
┌──────────────┐
│   Web App    │──┐
└──────────────┘  │
                  │
┌──────────────┐  │  ┌──────────────┐
│  Mobile App  │──┼─→│   Backend    │
└──────────────┘  │  │     API      │
                  │  └──────────────┘
┌──────────────┐  │
│ Admin Panel  │──┘
└──────────────┘

All clients use same API!
```

---

## 📊 Comparison

| Aspect | Langsung DB ❌ | Via API ✅ |
|--------|---------------|-----------|
| **Security** | Exposed credentials | Secure, token-based |
| **Validation** | Frontend only (unreliable) | Backend (reliable) |
| **Business Logic** | Scattered | Centralized |
| **Maintenance** | Update all clients | Update backend only |
| **Audit Trail** | Manual | Automatic |
| **Error Handling** | Inconsistent | Consistent |
| **Testing** | Hard | Easy |
| **Scalability** | Poor | Excellent |
| **Multiple Clients** | Duplicate code | Reuse API |

---

## 🎯 Best Practices

### 1. **API Versioning**
```python
# Good: Versioned API
/api/v1/book-categories/
/api/v2/book-categories/  # Future version

# Bad: No version
/api/book-categories/  # Hard to update
```

### 2. **Consistent Response Format**
```python
# Success response
{
  "id": 1,
  "name": "Fiction",
  "slug": "fiction",
  "created_at": "2026-04-24T10:00:00Z"
}

# Error response
{
  "error": "Validation failed",
  "details": {
    "name": ["This field is required"],
    "slug": ["Already exists"]
  }
}
```

### 3. **Proper HTTP Status Codes**
```python
200 OK          # Success (GET, PUT, PATCH)
201 Created     # Success (POST)
204 No Content  # Success (DELETE)
400 Bad Request # Validation error
401 Unauthorized # Not logged in
403 Forbidden   # No permission
404 Not Found   # Resource not found
500 Server Error # Backend error
```

### 4. **Authentication**
```python
# Use JWT tokens
headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### 5. **Pagination**
```python
# For large datasets
GET /api/v1/book-categories/?page=1&page_size=20

Response:
{
  "count": 100,
  "next": "/api/v1/book-categories/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## ✅ Summary

### Frontend ke Backend: WAJIB via API

**Alasan:**
1. ✅ **Security** - Credentials aman
2. ✅ **Validation** - Data valid
3. ✅ **Business Logic** - Centralized
4. ✅ **Maintenance** - Easy update
5. ✅ **Scalability** - Multiple clients
6. ✅ **Audit Trail** - Automatic logging
7. ✅ **Error Handling** - Consistent
8. ✅ **Testing** - Easy to test

**Flow:**
```
Frontend → API Request → Backend → Validation → Business Logic → Database
                                                                    ↓
Frontend ← API Response ← Backend ← Result ← ← ← ← ← ← ← ← ← ← ← ←
```

**Kesimpulan:**
- ❌ **JANGAN** frontend langsung ke database
- ✅ **HARUS** frontend via API ke backend
- ✅ Backend yang handle database access
- ✅ Backend yang handle validation & logic
- ✅ Frontend hanya consume API

**Untuk ASN CORPU:**
- Kamu (Backend): Buat API endpoints
- Frontend Team: Consume API
- Mobile App: Consume API (same endpoints!)
- Admin Panel: Consume API (same endpoints!)

**One API, Multiple Clients!** 🎉

---

**Last Updated:** April 24, 2026


---

## 🔐 Authentication & Authorization

### Ya! Backend Bisa Cek Kewenangan User

Ini adalah salah satu keuntungan UTAMA pakai API!

### 1. **Authentication** - Siapa User Ini?

```python
# Backend check: Apakah user sudah login?
from rest_framework.permissions import IsAuthenticated

class BookCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]  # ✅ Harus login
    
    def list(self, request):
        # Jika tidak login → 401 Unauthorized
        # Jika login → lanjut
        pass
```

**Flow:**
```
Frontend → Request + Token → Backend
                              ↓
                         Check Token Valid?
                              ↓
                    Yes ✅        No ❌
                     ↓             ↓
                  Process      401 Unauthorized
```

### 2. **Authorization** - Apakah User Boleh Akses?

```python
# Backend check: Apakah user punya permission?
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions

class BookCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def create(self, request):
        # ✅ Check: Apakah user punya permission 'add_bookcategory'?
        if not request.user.has_perm('books.add_bookcategory'):
            return Response(
                {'error': 'You do not have permission to create category'},
                status=403  # Forbidden
            )
        
        # User punya permission → lanjut create
        pass
```

---

## 🎯 Contoh Lengkap: Permission System

### Scenario: Kategori Buku dengan Role-Based Access

**Roles:**
- **Admin** - Bisa semua (CRUD)
- **Editor** - Bisa create, read, update (tidak bisa delete)
- **Viewer** - Hanya bisa read
- **Guest** - Tidak bisa akses

### Backend Implementation

#### **1. Custom Permission Class**

```python
# apps/books/permissions.py
from rest_framework import permissions

class BookCategoryPermission(permissions.BasePermission):
    """
    Custom permission untuk Book Category
    - Admin: Full access (CRUD)
    - Editor: Create, Read, Update (no Delete)
    - Viewer: Read only
    - Guest: No access
    """
    
    def has_permission(self, request, view):
        # ❌ Guest (not authenticated) → No access
        if not request.user.is_authenticated:
            return False
        
        # ✅ Admin → Full access
        if request.user.role == 'admin':
            return True
        
        # ✅ Editor → Create, Read, Update
        if request.user.role == 'editor':
            if view.action in ['list', 'retrieve', 'create', 'update', 'partial_update']:
                return True
            return False  # ❌ No delete
        
        # ✅ Viewer → Read only
        if request.user.role == 'viewer':
            if view.action in ['list', 'retrieve']:
                return True
            return False  # ❌ No create, update, delete
        
        # ❌ Unknown role → No access
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Check permission untuk specific object
        Contoh: Editor hanya bisa edit category yang dia buat
        """
        # Admin → Full access
        if request.user.role == 'admin':
            return True
        
        # Editor → Hanya bisa edit milik sendiri
        if request.user.role == 'editor':
            if view.action in ['update', 'partial_update']:
                return obj.created_by == request.user
            return True
        
        # Viewer → Read only
        if request.user.role == 'viewer':
            return view.action in ['retrieve']
        
        return False
```

#### **2. Apply Permission di ViewSet**

```python
# apps/books/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import BookCategory
from .serializers import BookCategorySerializer
from .permissions import BookCategoryPermission

class BookCategoryViewSet(viewsets.ModelViewSet):
    queryset = BookCategory.objects.all()
    serializer_class = BookCategorySerializer
    permission_classes = [BookCategoryPermission]  # ✅ Apply custom permission
    
    def list(self, request):
        """GET /api/v1/book-categories/"""
        # Permission check otomatis oleh BookCategoryPermission
        # Admin, Editor, Viewer → ✅ Allowed
        # Guest → ❌ 401 Unauthorized
        
        categories = self.get_queryset()
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """POST /api/v1/book-categories/"""
        # Permission check otomatis
        # Admin, Editor → ✅ Allowed
        # Viewer, Guest → ❌ 403 Forbidden
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Save dengan created_by
        serializer.save(created_by=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, pk=None):
        """PUT /api/v1/book-categories/{id}/"""
        # Permission check otomatis
        # Admin → ✅ Allowed (semua category)
        # Editor → ✅ Allowed (hanya milik sendiri)
        # Viewer, Guest → ❌ 403 Forbidden
        
        category = self.get_object()  # has_object_permission dipanggil di sini
        serializer = self.get_serializer(category, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    def destroy(self, request, pk=None):
        """DELETE /api/v1/book-categories/{id}/"""
        # Permission check otomatis
        # Admin → ✅ Allowed
        # Editor, Viewer, Guest → ❌ 403 Forbidden
        
        category = self.get_object()
        category.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
```

---

## 🔑 Authentication Flow

### Step-by-Step: User Login & Access API

#### **1. User Login**

```python
# Backend: Login endpoint
from rest_framework_simplejwt.views import TokenObtainPairView

# POST /api/v1/auth/login/
{
  "username": "john@example.com",
  "password": "password123"
}

# Response:
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  # Token untuk API
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john@example.com",
    "role": "editor"
  }
}
```

#### **2. Frontend Save Token**

```javascript
// Frontend: Save token to localStorage
const login = async (username, password) => {
  const response = await axios.post('/api/v1/auth/login/', {
    username,
    password
  });
  
  // ✅ Save token
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
};
```

#### **3. Frontend Use Token untuk API Request**

```javascript
// Frontend: Include token in every request
const getCategories = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await axios.get('/api/v1/book-categories/', {
    headers: {
      'Authorization': `Bearer ${token}`  // ✅ Send token
    }
  });
  
  return response.data;
};
```

#### **4. Backend Validate Token & Check Permission**

```python
# Backend: Automatic validation
class BookCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [BookCategoryPermission]
    
    def list(self, request):
        # 1. ✅ Django REST Framework validate token
        # 2. ✅ Get user from token
        # 3. ✅ Check permission (BookCategoryPermission)
        # 4. ✅ If all pass → process request
        # 5. ❌ If fail → return 401/403
        
        print(f"User: {request.user.username}")  # john@example.com
        print(f"Role: {request.user.role}")      # editor
        
        # Process request...
        pass
```

---

## 📊 Permission Matrix

### Contoh: Book Category Permissions

| Action | Admin | Editor | Viewer | Guest |
|--------|-------|--------|--------|-------|
| **List** (GET /categories/) | ✅ | ✅ | ✅ | ❌ |
| **Detail** (GET /categories/{id}/) | ✅ | ✅ | ✅ | ❌ |
| **Create** (POST /categories/) | ✅ | ✅ | ❌ | ❌ |
| **Update** (PUT /categories/{id}/) | ✅ | ✅ (own) | ❌ | ❌ |
| **Delete** (DELETE /categories/{id}/) | ✅ | ❌ | ❌ | ❌ |

### Backend Implementation

```python
class BookCategoryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Guest (not authenticated)
        if not request.user.is_authenticated:
            return False  # ❌ All actions blocked
        
        # Admin
        if request.user.role == 'admin':
            return True  # ✅ All actions allowed
        
        # Editor
        if request.user.role == 'editor':
            allowed_actions = ['list', 'retrieve', 'create', 'update', 'partial_update']
            return view.action in allowed_actions
        
        # Viewer
        if request.user.role == 'viewer':
            allowed_actions = ['list', 'retrieve']
            return view.action in allowed_actions
        
        return False
```

---

## 🎯 Real-World Examples

### Example 1: Admin Only Endpoint

```python
# Hanya admin yang bisa akses
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_all_categories(request):
    """Dangerous operation - Admin only"""
    
    # ✅ Check if user is admin
    if request.user.role != 'admin':
        return Response(
            {'error': 'Only admin can perform this action'},
            status=403
        )
    
    # Admin confirmed → proceed
    BookCategory.objects.all().delete()
    return Response({'message': 'All categories deleted'})
```

### Example 2: Owner Only Access

```python
# User hanya bisa edit data milik sendiri
class BookCategoryViewSet(viewsets.ModelViewSet):
    def update(self, request, pk=None):
        category = self.get_object()
        
        # ✅ Check ownership
        if category.created_by != request.user and request.user.role != 'admin':
            return Response(
                {'error': 'You can only edit your own categories'},
                status=403
            )
        
        # Owner or admin → proceed
        serializer = self.get_serializer(category, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
```

### Example 3: Time-Based Access

```python
# User hanya bisa edit dalam 24 jam setelah create
from django.utils import timezone
from datetime import timedelta

class BookCategoryViewSet(viewsets.ModelViewSet):
    def update(self, request, pk=None):
        category = self.get_object()
        
        # ✅ Check time limit
        time_limit = category.created_at + timedelta(hours=24)
        if timezone.now() > time_limit and request.user.role != 'admin':
            return Response(
                {'error': 'You can only edit within 24 hours of creation'},
                status=403
            )
        
        # Within time limit or admin → proceed
        pass
```

### Example 4: Quota-Based Access

```python
# User hanya bisa create max 10 categories
class BookCategoryViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # ✅ Check quota
        user_categories = BookCategory.objects.filter(
            created_by=request.user
        ).count()
        
        if user_categories >= 10 and request.user.role != 'admin':
            return Response(
                {'error': 'You have reached the maximum limit of 10 categories'},
                status=403
            )
        
        # Under quota or admin → proceed
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        
        return Response(serializer.data, status=201)
```

---

## 🔒 Security Best Practices

### 1. **Always Validate Token**

```python
# ✅ Good: Require authentication
@permission_classes([IsAuthenticated])
class BookCategoryViewSet(viewsets.ModelViewSet):
    pass

# ❌ Bad: No authentication
class BookCategoryViewSet(viewsets.ModelViewSet):
    pass  # Anyone can access!
```

### 2. **Check Permission di Backend, Bukan Frontend**

```javascript
// ❌ Bad: Frontend only check
if (user.role === 'admin') {
  // Show delete button
  <button onClick={deleteCategory}>Delete</button>
}
// Problem: User bisa bypass dengan inspect element!
```

```python
# ✅ Good: Backend check
def destroy(self, request, pk=None):
    if request.user.role != 'admin':
        return Response({'error': 'Forbidden'}, status=403)
    # Proceed...
```

### 3. **Use HTTPS in Production**

```python
# settings.py (Production)
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 4. **Token Expiration**

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),   # Token expire after 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),   # Refresh token expire after 7 days
}
```

### 5. **Rate Limiting**

```python
# Prevent brute force attacks
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',   # Guest: 100 requests per hour
        'user': '1000/hour'   # Authenticated: 1000 requests per hour
    }
}
```

---

## ✅ Summary: Authentication & Authorization

### Keuntungan Pakai API untuk Permission Control

1. **Centralized** - Semua permission logic di backend
2. **Secure** - Frontend tidak bisa bypass
3. **Flexible** - Bisa custom permission sesuai kebutuhan
4. **Auditable** - Bisa log siapa akses apa
5. **Scalable** - Mudah tambah role/permission baru

### Flow Lengkap

```
1. User Login
   ↓
2. Backend validate credentials
   ↓
3. Backend generate token
   ↓
4. Frontend save token
   ↓
5. Frontend send request + token
   ↓
6. Backend validate token
   ↓
7. Backend check permission
   ↓
8. ✅ Allowed → Process request
   ❌ Denied → Return 401/403
```

### Permission Levels

- **401 Unauthorized** - User belum login (no token)
- **403 Forbidden** - User sudah login tapi tidak punya permission
- **200 OK** - User punya permission, request berhasil

### Untuk ASN CORPU

Kamu bisa implement permission system untuk:
- ✅ Admin - Full access
- ✅ Instructor - Manage own courses
- ✅ Student - View & enroll courses
- ✅ Guest - View public courses only

**Backend (kamu) yang kontrol semua permission!** 🔐

---

**Last Updated:** April 24, 2026
