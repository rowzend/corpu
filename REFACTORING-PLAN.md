# 🔄 ASNCORPU Refactoring Plan
## Tujuan: Django Pure API + Next.js Full UI

---

## 📊 Current State (Mixed Architecture)

### Django Backend:
- ✅ REST API endpoints (`/apicorpu/`)
- ❌ Django templates (dashboard, manajemen, knowledge)
- ❌ Django admin UI
- ❌ Server-side rendering views

### Next.js Frontend:
- ✅ Public pages (landing, courses, KMS)
- ✅ User dashboard (basic)
- ❌ Admin dashboard (belum ada)
- ❌ Management pages (belum ada)

---

## 🎯 Target State (Clean Separation)

### Django Backend (Pure API):
```
backend/
├── apps/
│   ├── accounts/          # User management API
│   ├── dashboard/         # Dashboard stats API
│   ├── hcdp/             # HCDP API
│   ├── knowledge/        # Knowledge API
│   └── manajemen/        # Management API
├── core/
│   ├── settings.py       # Django settings
│   └── urls.py          # API routes only
└── requirements.txt

❌ REMOVE: templates/ folder
❌ REMOVE: static/ folder (kecuali untuk Django admin)
❌ REMOVE: All render() views
✅ KEEP: API views & serializers
✅ KEEP: Django admin (optional, untuk emergency)
```

### Next.js Frontend (Full UI):
```
frontend/
├── app/
│   ├── (public)/         # Public pages
│   │   ├── page.tsx     # Landing
│   │   ├── kursus/      # Courses
│   │   └── kms/         # Knowledge base
│   ├── (auth)/          # Auth pages
│   │   └── login/
│   ├── (user)/          # User dashboard
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── courses/
│   └── (admin)/         # Admin dashboard
│       ├── dashboard/
│       ├── users/
│       ├── permissions/
│       ├── knowledge/
│       └── hcdp/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── admin/           # Admin-specific components
│   └── user/            # User-specific components
└── lib/
    ├── api/             # API client
    └── services/        # Service layer
```

---

## 🚀 Migration Steps

### Phase 1: Django API Completion (Priority: HIGH)

#### 1.1 Create Missing API Endpoints

**Dashboard API:**
```python
# apps/dashboard/urls_api.py
urlpatterns = [
    path('stats/', views.DashboardStatsAPIView.as_view()),
    path('activities/', views.RecentActivitiesAPIView.as_view()),
    path('system-status/', views.SystemStatusAPIView.as_view()),
]
```

**Manajemen API:**
```python
# apps/manajemen/urls_api.py
urlpatterns = [
    path('users/', views.UserListAPIView.as_view()),
    path('users/<int:pk>/', views.UserDetailAPIView.as_view()),
    path('roles/', views.RoleListAPIView.as_view()),
    path('permissions/', views.PermissionListAPIView.as_view()),
    path('modules/', views.ModuleListAPIView.as_view()),
]
```

**HCDP API:**
```python
# apps/hcdp/urls_api.py
urlpatterns = [
    path('programs/', views.ProgramListAPIView.as_view()),
    path('programs/<int:pk>/', views.ProgramDetailAPIView.as_view()),
    path('enrollments/', views.EnrollmentListAPIView.as_view()),
]
```

**Knowledge API (Already exists, verify completeness):**
```python
# apps/knowledge/urls_api.py - Already exists
# Verify all CRUD operations are available
```

#### 1.2 Update core/urls.py

```python
# core/urls.py - API Only
urlpatterns = [
    # Health check
    path('health/', views.health_check),
    
    # Django Admin (optional, untuk emergency)
    path('admin/', admin.site.urls),
    
    # API v1.0
    path('apicorpu/1.0/auth/', include('apps.accounts.urls_api')),
    path('apicorpu/1.0/dashboard/', include('apps.dashboard.urls_api')),
    path('apicorpu/1.0/users/', include('apps.manajemen.urls_api')),
    path('apicorpu/1.0/knowledge/', include('apps.knowledge.urls_api')),
    path('apicorpu/1.0/hcdp/', include('apps.hcdp.urls_api')),
    
    # Legacy support (deprecated)
    path('apicorpu/5.0/', include('apps.legacy.urls')),
]

# REMOVE all template-based routes:
# ❌ path('dashboard/', include('apps.dashboard.urls'))
# ❌ path('manajemen-aplikasi/', include('apps.manajemen.urls'))
# ❌ path('knowledge/', include('apps.knowledge.urls'))
```

#### 1.3 Create API Views & Serializers

**Example: Dashboard Stats API**
```python
# apps/dashboard/views_api.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class DashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Calculate stats
        stats = {
            'total_pegawai': 0,
            'pegawai_aktif': 0,
            'menuju_pensiun': 0,
            'last_sync_hours': 0,
            'pns_count': 0,
            'pppk_count': 0,
            'honorer_count': 0,
        }
        
        return Response({
            'success': True,
            'data': stats
        })

class RecentActivitiesAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get recent activities
        activities = [
            {
                'id': 1,
                'title': 'Data pegawai berhasil disinkronkan',
                'description': 'Sinkronisasi data dari SIASN',
                'type': 'success',
                'created_at': '2024-01-01T10:00:00Z'
            }
        ]
        
        return Response({
            'success': True,
            'data': activities
        })
```

---

### Phase 2: Next.js Admin Dashboard (Priority: HIGH)

#### 2.1 Create Admin Layout

```typescript
// app/(admin)/layout.tsx
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 2.2 Create Admin Dashboard

```typescript
// app/(admin)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { dashboardService } from '@/lib/services';
import StatsCard from '@/components/admin/StatsCard';
import ActivityList from '@/components/admin/ActivityList';
import SystemStatus from '@/components/admin/SystemStatus';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    const [statsData, activitiesData] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getActivities()
    ]);
    
    setStats(statsData);
    setActivities(activitiesData);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatsCard 
          title="Total Pegawai" 
          value={stats?.total_pegawai} 
          icon="users"
        />
        <StatsCard 
          title="Pegawai Aktif" 
          value={stats?.pegawai_aktif} 
          icon="user-check"
        />
        {/* More stats... */}
      </div>
      
      {/* Charts & Activities */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActivityList activities={activities} />
        </div>
        <div>
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}
```

#### 2.3 Create Admin Management Pages

```typescript
// app/(admin)/users/page.tsx
// app/(admin)/permissions/page.tsx
// app/(admin)/knowledge/page.tsx
// app/(admin)/hcdp/page.tsx
```

---

### Phase 3: API Services (Priority: HIGH)

#### 3.1 Create Dashboard Service

```typescript
// lib/services/dashboard.service.ts
import { api } from '@/lib/api';

export const dashboardService = {
  async getStats() {
    return api.get('/apicorpu/1.0/dashboard/stats/');
  },
  
  async getActivities() {
    return api.get('/apicorpu/1.0/dashboard/activities/');
  },
  
  async getSystemStatus() {
    return api.get('/apicorpu/1.0/dashboard/system-status/');
  }
};
```

#### 3.2 Create Management Service

```typescript
// lib/services/management.service.ts
import { api } from '@/lib/api';

export const managementService = {
  // Users
  async getUsers(params?: any) {
    return api.get('/apicorpu/1.0/users/', { params });
  },
  
  async getUserById(id: string) {
    return api.get(`/apicorpu/1.0/users/${id}/`);
  },
  
  async createUser(data: any) {
    return api.post('/apicorpu/1.0/users/', data);
  },
  
  async updateUser(id: string, data: any) {
    return api.put(`/apicorpu/1.0/users/${id}/`, data);
  },
  
  async deleteUser(id: string) {
    return api.delete(`/apicorpu/1.0/users/${id}/`);
  },
  
  // Roles
  async getRoles() {
    return api.get('/apicorpu/1.0/users/roles/');
  },
  
  // Permissions
  async getPermissions() {
    return api.get('/apicorpu/1.0/users/permissions/');
  }
};
```

---

### Phase 4: Cleanup Django (Priority: MEDIUM)

#### 4.1 Remove Templates

```bash
# Backup first
mv backend/templates backend/templates.backup

# Or selectively remove
rm -rf backend/templates/dashboard/
rm -rf backend/templates/manajemen/
rm -rf backend/templates/knowledge/
# Keep only error pages if needed
```

#### 4.2 Remove Template Views

```python
# apps/dashboard/views.py - BEFORE
@login_required
def dashboard(request):
    return render(request, 'dashboard/index.html', context)

# apps/dashboard/views.py - AFTER (Remove or comment out)
# This view is deprecated, use API instead
```

#### 4.3 Update Settings

```python
# core/settings.py

# Remove template settings (or keep minimal for Django admin)
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],  # Remove custom template dirs
        'APP_DIRS': True,  # Keep for Django admin
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# CORS for Next.js
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3004',
    'http://asncorpu.local:3000',
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

---

### Phase 5: Testing & Migration (Priority: HIGH)

#### 5.1 Test API Endpoints

```bash
# Test dashboard stats
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/apicorpu/1.0/dashboard/stats/

# Test users list
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/apicorpu/1.0/users/

# Test knowledge list
curl http://localhost:3000/apicorpu/1.0/knowledge/
```

#### 5.2 Test Next.js Pages

```bash
# Start Next.js dev
cd frontend
npm run dev

# Test pages:
# - http://localhost:3004/
# - http://localhost:3004/login
# - http://localhost:3004/dashboard (user)
# - http://localhost:3004/admin/dashboard (admin)
```

#### 5.3 Update Documentation

```markdown
# Update README.md with new architecture
# Update API documentation
# Create migration guide for users
```

---

## 📅 Timeline Estimate

### Week 1: Django API Completion
- Day 1-2: Dashboard API
- Day 3-4: Management API
- Day 5: HCDP API & Testing

### Week 2: Next.js Admin Dashboard
- Day 1-2: Admin layout & routing
- Day 3-4: Dashboard pages
- Day 5: Management pages

### Week 3: Integration & Testing
- Day 1-2: API services
- Day 3-4: End-to-end testing
- Day 5: Bug fixes & optimization

### Week 4: Cleanup & Documentation
- Day 1-2: Remove Django templates
- Day 3-4: Update documentation
- Day 5: Final testing & deployment

---

## ✅ Success Criteria

- [ ] All Django views return JSON (no HTML templates)
- [ ] All UI rendered by Next.js
- [ ] Admin dashboard fully functional in Next.js
- [ ] User dashboard fully functional in Next.js
- [ ] All CRUD operations work via API
- [ ] Authentication works (JWT)
- [ ] Authorization works (role-based)
- [ ] Documentation updated
- [ ] Tests passing

---

## 🎯 Benefits After Refactoring

1. **Clean Separation**: Backend = API, Frontend = UI
2. **Better DX**: React components vs Django templates
3. **Scalability**: Can scale frontend & backend independently
4. **Modern Stack**: Next.js 14+ with App Router
5. **Type Safety**: TypeScript for frontend
6. **Better Performance**: Client-side routing, code splitting
7. **Easier Maintenance**: Single responsibility per layer
8. **Mobile Ready**: Can reuse API for mobile app

---

## 📝 Notes

- Keep Django admin as fallback for emergency
- Backup templates before deletion
- Test thoroughly before removing old code
- Consider feature flags for gradual migration
- Document all API endpoints
- Create Postman/Insomnia collection for API testing

