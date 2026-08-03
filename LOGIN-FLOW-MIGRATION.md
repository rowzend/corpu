# 🔄 Login Flow Migration Guide

## 📊 Current State: Mixed Dashboard

### **Alur Saat Ini (May 19, 2026)**

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT LOGIN FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. User akses: http://localhost:3000/
2. Django landing_page() → Login form (Django template)
3. POST login → Django session auth
4. SUCCESS → Redirect ke: http://localhost:3000/dashboard/ (Django template)

┌─────────────────────────────────────────────────────────────┐
│                   PARALLEL NEXT.JS FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. User akses: http://localhost:3004/
2. Next.js landing page → Login form (React)
3. POST login → Django JWT API
4. SUCCESS → Redirect ke: http://localhost:3004/dashboard (React)
```

---

## 🎯 Migration Strategy: Gradual Transition

### **Phase 1: Dual Dashboard (CURRENT)**

#### **Option A: Django Dashboard (Default)**
```
Login URL: http://localhost:3000/
After Login: http://localhost:3000/dashboard/ (Django template)
```

#### **Option B: Next.js Dashboard (New UI)**
```
Login URL: http://localhost:3000/?new_ui=true
After Login: http://localhost:3004/dashboard (React)

OR

Direct URL: http://localhost:3000/dashboard-new/
After Login: http://localhost:3004/dashboard (React)
```

### **Phase 2: Switch Default (Future)**
```
Login URL: http://localhost:3000/
After Login: http://localhost:3004/dashboard (React) ← NEW DEFAULT

Fallback URL: http://localhost:3000/dashboard-old/
After Login: http://localhost:3000/dashboard/ (Django) ← FALLBACK
```

### **Phase 3: Full Migration (Final)**
```
Login URL: http://localhost:3000/
After Login: http://localhost:3004/dashboard (React) ← ONLY OPTION

Django templates removed completely
```

---

## 🔧 Implementation Details

### **1. Modified Django Views**

#### **Updated `landing_page()` function:**
```python
def landing_page(request):
    # Redirect jika sudah login
    if request.user.is_authenticated:
        # Check if user wants new dashboard
        use_new_dashboard = request.GET.get('new_ui', 'false').lower() == 'true'
        
        if use_new_dashboard:
            return redirect('http://localhost:3004/dashboard')  # Next.js
        else:
            return redirect('/dashboard/')  # Django (default)
```

#### **New `redirect_to_nextjs_dashboard()` function:**
```python
def redirect_to_nextjs_dashboard(request):
    if not request.user.is_authenticated:
        return redirect('/login/')
    
    return redirect('http://localhost:3004/dashboard')
```

### **2. Updated URL Routing**

#### **Added new route in `core/urls.py`:**
```python
urlpatterns = [
    path('dashboard/', include('apps.dashboard.urls')),           # Django dashboard
    path('dashboard-new/', views.redirect_to_nextjs_dashboard),  # Next.js dashboard
    # ... other routes
]
```

---

## 🧪 How to Test Both Dashboards

### **Test Django Dashboard (Current)**
```bash
# 1. Login via Django
curl -X POST http://localhost:3000/login/ \
  -d "username=admin&password=your_password" \
  -c cookies.txt

# 2. Access Django dashboard
curl -b cookies.txt http://localhost:3000/dashboard/
```

### **Test Next.js Dashboard (New)**
```bash
# Option 1: Via query parameter
http://localhost:3000/?new_ui=true

# Option 2: Via direct URL
http://localhost:3000/dashboard-new/

# Option 3: Direct Next.js access
http://localhost:3004/dashboard
```

---

## 📋 User Experience

### **For End Users:**

#### **Current (Default) Experience:**
1. Visit: `http://localhost:3000/`
2. Login with username/password
3. Redirected to: `http://localhost:3000/dashboard/` (Django)
4. See Django-rendered dashboard with server-side templates

#### **New UI Experience:**
1. Visit: `http://localhost:3000/?new_ui=true`
2. Login with username/password
3. Redirected to: `http://localhost:3004/dashboard` (Next.js)
4. See React-rendered dashboard with modern UI

#### **Direct Next.js Experience:**
1. Visit: `http://localhost:3004/`
2. Login with username/password (calls Django API)
3. Stay on: `http://localhost:3004/dashboard` (Next.js)
4. Full SPA experience

---

## 🔄 Authentication Flow Comparison

### **Django Session Auth (Current)**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. POST /login/ (username, password)                       │
│ 2. Django authenticate() + login()                         │
│ 3. Session cookie created                                   │
│ 4. Redirect to /dashboard/                                  │
│ 5. Django template rendered server-side                    │
└─────────────────────────────────────────────────────────────┘
```

### **JWT API Auth (New)**
```
┌─────────────────────────────────────────────────────────────┐
│ 1. POST /apicorpu/auth/1.0/login (JSON)                   │
│ 2. Django authenticate() + JWT token                       │
│ 3. JWT token returned to client                            │
│ 4. Client stores token + redirects                         │
│ 5. React components rendered client-side                   │
│ 6. API calls with Authorization: Bearer <token>            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Migration Timeline

### **Week 1: Setup & Testing (DONE)**
- ✅ Create API endpoints
- ✅ Update login flow
- ✅ Add dual dashboard routing
- ✅ Test both flows

### **Week 2: Next.js Dashboard Development**
- ⏳ Build admin layout
- ⏳ Implement dashboard components
- ⏳ Connect to API endpoints
- ⏳ Test user management

### **Week 3: Feature Parity**
- ⏳ User management UI
- ⏳ Role management UI
- ⏳ Permission management UI
- ⏳ All CRUD operations

### **Week 4: Switch Default**
- ⏳ Change default to Next.js
- ⏳ Keep Django as fallback
- ⏳ User acceptance testing
- ⏳ Performance optimization

### **Week 5: Full Migration**
- ⏳ Remove Django templates
- ⏳ Update documentation
- ⏳ Production deployment
- ⏳ Monitor & fix issues

---

## 📝 Configuration Options

### **Environment Variables**

#### **Backend (.env)**
```env
# Dashboard routing
DEFAULT_DASHBOARD=django  # or 'nextjs'
NEXTJS_DASHBOARD_URL=http://localhost:3004/dashboard
DJANGO_DASHBOARD_URL=/dashboard/

# CORS for Next.js
CORS_ALLOWED_ORIGINS=http://localhost:3004,http://localhost:3000
```

#### **Frontend (.env.local)**
```env
# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000/apicorpu/1.0
NEXT_PUBLIC_AUTH_URL=http://localhost:3000/apicorpu/auth/1.0

# Dashboard URLs
NEXT_PUBLIC_DJANGO_DASHBOARD=http://localhost:3000/dashboard/
NEXT_PUBLIC_NEXTJS_DASHBOARD=http://localhost:3004/dashboard
```

---

## 🔍 Troubleshooting

### **Common Issues:**

#### **1. CORS Errors**
```bash
# Check CORS settings in Django
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3004',
    'http://localhost:3000',
]
```

#### **2. Authentication Issues**
```bash
# Check JWT token
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/apicorpu/1.0/dashboard/stats/
```

#### **3. Redirect Loops**
```bash
# Check login flow
# Make sure user is not redirected between Django and Next.js infinitely
```

#### **4. Session vs JWT Conflicts**
```bash
# Clear browser cookies and localStorage
# Test with incognito/private browsing
```

---

## 📊 Comparison: Django vs Next.js Dashboard

### **Django Dashboard (Current)**

#### **Pros:**
- ✅ Already working
- ✅ Server-side rendering
- ✅ Django admin integration
- ✅ No JavaScript required
- ✅ SEO friendly

#### **Cons:**
- ❌ Old-fashioned UI
- ❌ Page reloads on navigation
- ❌ Limited interactivity
- ❌ Harder to customize
- ❌ Mixed responsibilities

### **Next.js Dashboard (New)**

#### **Pros:**
- ✅ Modern React UI
- ✅ Single Page Application
- ✅ Fast client-side routing
- ✅ Rich interactivity
- ✅ TypeScript support
- ✅ Component reusability
- ✅ Better UX

#### **Cons:**
- ❌ Requires JavaScript
- ❌ More complex setup
- ❌ SEO considerations
- ❌ Additional build step
- ❌ Learning curve

---

## 🎯 Success Metrics

### **Technical Metrics:**
- ✅ Both dashboards accessible
- ⏳ API response time < 500ms
- ⏳ Page load time < 2s
- ⏳ Zero authentication errors
- ⏳ CORS properly configured

### **User Experience Metrics:**
- ⏳ User can switch between dashboards
- ⏳ No data loss during transition
- ⏳ Consistent functionality
- ⏳ Intuitive navigation
- ⏳ Mobile responsive

### **Business Metrics:**
- ⏳ Zero downtime during migration
- ⏳ User adoption of new UI
- ⏳ Reduced support tickets
- ⏳ Improved productivity
- ⏳ Future-proof architecture

---

## 💡 Recommendations

### **For Immediate Use:**
1. **Keep Django dashboard as default** (safe, proven)
2. **Test Next.js dashboard thoroughly** (new features)
3. **Train users gradually** (change management)
4. **Monitor both systems** (performance, errors)

### **For Migration:**
1. **Start with power users** (early adopters)
2. **Collect feedback actively** (user experience)
3. **Fix issues quickly** (maintain confidence)
4. **Document everything** (knowledge transfer)

### **For Long-term:**
1. **Invest in Next.js** (modern stack)
2. **Remove Django templates** (clean architecture)
3. **Mobile-first design** (future ready)
4. **API-first approach** (scalability)

---

## 🎉 Current Status

### **✅ COMPLETED:**
- Django API endpoints (22 endpoints)
- Dual dashboard routing
- Login flow modification
- Documentation

### **⏳ IN PROGRESS:**
- Next.js admin dashboard development
- API integration testing
- UI component creation

### **📅 NEXT STEPS:**
1. Build Next.js admin layout
2. Implement dashboard components
3. Connect API services
4. Test user management
5. Gradual user migration

---

**Ready to proceed with Next.js dashboard development!** 🚀
