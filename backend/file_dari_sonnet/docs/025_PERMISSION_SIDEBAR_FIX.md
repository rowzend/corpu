# 🔧 Permission & Sidebar Menu Fix

**Date:** May 6, 2026  
**Status:** 🔄 **IN PROGRESS**

---

## 🐛 Issues Reported

### Issue 1: Sidebar Menu Masih Tampil Tanpa Permission

**Problem:**
- User tidak memiliki permission untuk Knowledge Base
- Tapi menu "Knowledge Base" masih muncul di sidebar
- Seharusnya menu tersembunyi jika user tidak punya akses

**Expected Behavior:**
```
✅ User PUNYA permission → Menu tampil
❌ User TIDAK PUNYA permission → Menu TIDAK tampil
```

**Current Behavior:**
```
❌ User TIDAK PUNYA permission → Menu TETAP tampil
```

---

### Issue 2: Redirect ke URL yang Salah

**Problem:**
- Ketika user tidak punya permission dan klik menu
- Redirect ke: `http://localhost:8008/manajemen-aplikasi/akses-granular/`
- Seharusnya redirect ke: Dashboard atau error 403/405

**Expected Behavior:**
```
✅ Redirect ke: http://localhost:8008/dashboard/
ATAU
✅ Show error: 403 Forbidden
```

**Current Behavior:**
```
❌ Redirect ke: http://localhost:8008/manajemen-aplikasi/akses-granular/
```

---

## 🔍 Root Cause Analysis

### 1. Context Processor Analysis

**File:** `apps/manajemen/context_processors.py`

**Function:** `_user_has_permission_for_key(user, permission_key)`

**Current Logic:**
```python
def _user_has_permission_for_key(user, permission_key: str) -> bool:
    """Evaluate permission string against current user."""
    if not user.is_authenticated:
        return False
    if is_superadmin(user):
        return True

    module, control, function = _parse_permission_key(permission_key)
    
    # No key means no direct permission
    if not module:
        return False

    # module only
    if module and not control and not function:
        return has_any_permission(user, module)

    # module + control
    if module and control and not function:
        user_roles = user.groups.all()
        return RoleRule.objects.filter(
            role__in=user_roles,
            rule__module__nama_module=module,
            rule__control__nama_kontrol=control,
            rule__is_active=True,
            rule__module__is_active=True,
        ).exists()

    # module + control + function
    if module and control and function:
        return check_permission(user, module, control, function)

    return False
```

**Analysis:**
✅ Logic looks correct
✅ Checks permission properly
✅ Returns False if no permission

**Function:** `build_visible(node)`

```python
def build_visible(node: MenuItem):
    # Build visible children first
    child_nodes = []
    for ch in children_map.get(node.id, []):
        built = build_visible(ch)
        if built is not None:
            child_nodes.append(built)

    # Check own permission
    if node.permission_key:
        has_perm = _user_has_permission_for_key(user, node.permission_key)
    else:
        has_perm = node.type != 'menuItem'
    
    # Parent-only items (type menuItem) become visible if any child visible
    if node.type == 'menuItem':
        visible = len(child_nodes) > 0 or has_perm
    else:
        visible = has_perm or len(child_nodes) > 0

    if not visible:
        return None

    return _serialize(node, request, child_nodes)
```

**Analysis:**
⚠️ **POTENTIAL ISSUE FOUND!**

**Problem:** Parent menu (type='menuItem') becomes visible if ANY child is visible:
```python
if node.type == 'menuItem':
    visible = len(child_nodes) > 0 or has_perm
```

**Scenario:**
1. Parent: "Knowledge Base" (permission_key='knowledge')
2. Child 1: "Kategori Artikel" (permission_key='knowledge.category.view')
3. Child 2: "Artikel" (permission_key='knowledge.article.view')
4. Child 3: "Tag" (permission_key='knowledge.tag.view')

**If user has NO permission:**
- `has_perm` for parent = False
- `child_nodes` = [] (all children filtered out)
- `visible` = len([]) > 0 or False = False
- Parent should NOT be visible ✅

**This logic seems correct!**

---

### 2. Decorator Analysis

**File:** `apps/manajemen/decorators.py`

**Function:** `permission_required()`

```python
def permission_required(module_name, control_name, function_name, redirect_url='dashboard'):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                messages.error(request, 'Anda harus login terlebih dahulu.')
                return redirect('login')
            
            if check_permission(request.user, module_name, control_name, function_name):
                return view_func(request, *args, **kwargs)
            
            # No permission
            messages.error(request, f'Anda tidak memiliki akses untuk {function_name} {control_name}.')
            return redirect(redirect_url)
        
        return wrapper
    return decorator
```

**Analysis:**
⚠️ **ISSUE FOUND!**

**Problem:** `redirect_url='dashboard'` is a URL NAME, not a URL path

**Current behavior:**
```python
return redirect('dashboard')  # ❌ Tries to find URL named 'dashboard'
```

**Django tries to resolve:**
1. `reverse('dashboard')` → Not found
2. Falls back to treating it as a path
3. Redirects to `/dashboard/` → Not found
4. Django redirects to some default error handler
5. Ends up at `/manajemen-aplikasi/akses-granular/` (probably a catch-all route)

**Solution:**
```python
return redirect('manajemen_aplikasi:dashboard')  # ✅ Correct namespace
```

**But wait!** In `apps/knowledge/views.py`, we already fixed this:
```python
@permission_required('knowledge', 'category', 'view', redirect_url='manajemen_aplikasi:dashboard')
```

**So why is it still redirecting wrong?**

---

### 3. URL Configuration Analysis

Let me check the URL configuration to understand the redirect behavior.

**Hypothesis:**
- The redirect URL might be correct in views
- But there might be a middleware or URL pattern catching the request
- Or the error is happening at a different level

---

## 🔧 Fixes to Implement

### Fix 1: Verify Permission Keys in Database

**Check if menu items have correct permission_key:**

```sql
SELECT 
    id, 
    name, 
    permission_key, 
    type, 
    parent_id,
    is_active
FROM menu_items 
WHERE name LIKE '%Knowledge%' OR parent_id IN (
    SELECT id FROM menu_items WHERE name LIKE '%Knowledge%'
)
ORDER BY parent_id, order;
```

**Expected:**
```
Parent: Knowledge Base
  - permission_key: 'knowledge'
  - type: 'menuItem'
  
Child: Kategori Artikel
  - permission_key: 'knowledge.category.view'
  - type: 'module'
  
Child: Artikel
  - permission_key: 'knowledge.article.view'
  - type: 'module'
  
Child: Tag
  - permission_key: 'knowledge.tag.view'
  - type: 'module'
```

---

### Fix 2: Update Decorator Default Redirect

**File:** `apps/manajemen/decorators.py`

**Change:**
```python
# Before
def permission_required(module_name, control_name, function_name, redirect_url='dashboard'):

# After
def permission_required(module_name, control_name, function_name, redirect_url='manajemen_aplikasi:dashboard'):
```

**This ensures ALL views using this decorator redirect correctly by default.**

---

### Fix 3: Add 403 Error Page Option

**Create a better user experience for permission denied:**

**Option A: Redirect to Dashboard (Current)**
```python
return redirect('manajemen_aplikasi:dashboard')
```

**Option B: Show 403 Error Page (Better UX)**
```python
return render(request, '403.html', {
    'forbidden_title': 'Tidak Memiliki Akses',
    'forbidden_message': f'Anda tidak memiliki permission untuk {function_name} pada {control_name}.',
}, status=403)
```

**Recommendation:** Use Option B for better UX

---

### Fix 4: Debug Sidebar Visibility

**Add debug logging to context processor:**

```python
def build_visible(node: MenuItem):
    # ... existing code ...
    
    # DEBUG: Log permission check
    if node.permission_key:
        has_perm = _user_has_permission_for_key(user, node.permission_key)
        print(f"DEBUG: {node.name} | permission_key={node.permission_key} | has_perm={has_perm}")
    else:
        has_perm = node.type != 'menuItem'
        print(f"DEBUG: {node.name} | no permission_key | has_perm={has_perm}")
    
    # ... rest of code ...
```

---

## 📋 Implementation Plan

### Step 1: Verify Database
```bash
docker exec asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db -c "
SELECT id, name, permission_key, type, parent_id, is_active 
FROM menu_items 
WHERE name LIKE '%Knowledge%' OR parent_id IN (
    SELECT id FROM menu_items WHERE name LIKE '%Knowledge%'
)
ORDER BY parent_id, \"order\";
"
```

### Step 2: Update Decorator Default
- Edit `apps/manajemen/decorators.py`
- Change default `redirect_url='dashboard'` to `redirect_url='manajemen_aplikasi:dashboard'`

### Step 3: Test Permission Check
- Create test user without Knowledge Base permission
- Login as test user
- Verify menu is hidden
- Try to access URL directly
- Verify redirect to dashboard

### Step 4: Implement 403 Error Page (Optional)
- Create `permission_required_403` decorator variant
- Use for sensitive operations
- Show proper error message

---

## 🧪 Testing Checklist

### Test Case 1: User WITHOUT Permission
```
✅ Sidebar menu "Knowledge Base" TIDAK tampil
✅ Direct URL access redirects to dashboard
✅ Error message shown: "Anda tidak memiliki akses..."
```

### Test Case 2: User WITH Permission
```
✅ Sidebar menu "Knowledge Base" tampil
✅ Can access all child menus
✅ CRUD operations work
```

### Test Case 3: Superadmin
```
✅ All menus visible
✅ All operations allowed
```

---

## 📊 Current Status

### ✅ Completed:
- [x] Root cause analysis
- [x] Identified decorator issue
- [x] Identified potential sidebar issue
- [x] Created fix plan

### 🔄 In Progress:
- [ ] Verify database permission_key values
- [ ] Update decorator default redirect
- [ ] Test with user without permission
- [ ] Verify sidebar hiding works

### 📝 Next Steps:
1. Check database for permission_key values
2. Update decorator if needed
3. Test with restricted user
4. Document results

---

**Created by:** Kiro AI Assistant  
**Date:** May 6, 2026  
**Status:** 🔄 **ANALYSIS COMPLETE, FIXES IN PROGRESS**
