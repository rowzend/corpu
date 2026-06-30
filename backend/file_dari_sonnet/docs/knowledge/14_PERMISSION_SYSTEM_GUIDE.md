# 🔐 Knowledge Base - Permission System Guide

**Complete Permission System dengan Granular Access Control**

---

## 📋 Overview

Knowledge Base menggunakan **5-Layer Granular Permission System** yang terintegrasi dengan sistem permission ASN Corpu. Sistem ini memberikan kontrol akses yang sangat detail untuk setiap fitur.

**Permission Structure:** `Module.Control.Function`

---

## 🏗️ Permission Architecture

### 5-Layer System:

1. **Module** - Knowledge Base
2. **Control** - Articles, Categories, Tags, Comments, Ratings, Analytics
3. **Function** - view, create, edit, delete, approve, reject, publish, export, analytics
4. **Rule** - Kombinasi Module + Control + Function
5. **Role** - Assignment Rule ke User Groups

### Permission String Format:
```
knowledge.articles.view
knowledge.articles.create
knowledge.articles.edit
knowledge.articles.delete
knowledge.articles.approve
knowledge.categories.view
knowledge.tags.create
...
```

---

## 📊 Complete Permission Matrix

### 1. **Articles Permissions**

| Permission | Description | Who Can Access |
|------------|-------------|----------------|
| `knowledge.articles.view` | Melihat artikel | Public (no auth) |
| `knowledge.articles.create` | Membuat artikel baru | Authenticated users |
| `knowledge.articles.edit` | Edit artikel | Author + Staff |
| `knowledge.articles.delete` | Hapus artikel | Author + Staff |
| `knowledge.articles.approve` | Approve artikel | Staff only |
| `knowledge.articles.reject` | Reject artikel | Staff only |
| `knowledge.articles.publish` | Publish artikel | Author + Staff |

### 2. **Categories Permissions**

| Permission | Description | Who Can Access |
|------------|-------------|----------------|
| `knowledge.categories.view` | Melihat kategori | Public (no auth) |
| `knowledge.categories.create` | Buat kategori baru | Staff only |
| `knowledge.categories.edit` | Edit kategori | Staff only |
| `knowledge.categories.delete` | Hapus kategori | Staff only |

### 3. **Tags Permissions**

| Permission | Description | Who Can Access |
|------------|-------------|----------------|
| `knowledge.tags.view` | Melihat tags | Public (no auth) |
| `knowledge.tags.create` | Buat tag baru | Staff only |
| `knowledge.tags.edit` | Edit tag | Staff only |
| `knowledge.tags.delete` | Hapus tag | Staff only |

### 4. **Comments Permissions**

| Permission | Description | Who Can Access |
|------------|-------------|----------------|
| `knowledge.comments.view` | Melihat komentar | Public (no auth) |
| `knowledge.comments.create` | Buat komentar/reply | Authenticated users |
| `knowledge.comments.edit` | Edit komentar | Author only |
| `knowledge.comments.delete` | Hapus komentar | Author + Staff |

### 5. **Ratings Permissions**

| Permission | Description | Who Can Access |
|------------|-------------|----------------|
| `knowledge.ratings.view` | Melihat rating | Public (no auth) |
| `knowledge.ratings.create` | Beri rating | Authenticated users |
| `knowledge.ratings.edit` | Edit rating | Author only |
| `knowledge.ratings.delete` | Hapus rating | Author + Staff |

### 6. **Analytics Permissions**

| Permission | Description | Who Can Access |
|------------|-------------|----------------|
| `knowledge.analytics.view` | Lihat analytics | Staff only |
| `knowledge.analytics.export` | Export laporan | Staff only |

---

## 🚀 Setup Permission System

### 1. **Seed Permissions**

```bash
# Create all Knowledge Base permissions
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions

# Output:
# ✅ Created module: Knowledge Base
# ✅ Created control: Artikel
# ✅ Created rule: knowledge.articles.view
# ✅ Created rule: knowledge.articles.create
# ... (48 total permissions)
```

### 2. **Seed Sidebar Menus**

```bash
# Create sidebar menu structure
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus

# Output:
# ✅ Created parent menu: Knowledge Base
# ✅ Created child menu: Artikel (knowledge.articles.view)
# ✅ Created child menu: Kategori (knowledge.categories.view)
# ...
```

### 3. **Assign to Super Admin**

```bash
# Assign all permissions to Super Admin group
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access

# Output:
# ✅ Super Admin full access assigned. New assignments: 48
```

---

## 🎯 Permission Usage Examples

### 1. **Web Views (Django Templates)**

```python
# views.py
from apps.manajemen.decorators import permission_required

@permission_required('knowledge', 'articles', 'view')
def article_list(request):
    """Only users with knowledge.articles.view can access"""
    articles = Article.objects.filter(status='published')
    return render(request, 'knowledge/article_list.html', {'articles': articles})

@permission_required('knowledge', 'articles', 'create')
def article_create(request):
    """Only users with knowledge.articles.create can access"""
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'knowledge/article_form.html')

@permission_required('knowledge', 'articles', 'approve')
def article_approve(request, slug):
    """Only users with knowledge.articles.approve can access"""
    article = get_object_or_404(Article, slug=slug)
    article.approve(request.user)
    return redirect('knowledge:article_detail', slug=slug)
```

### 2. **API Views (DRF)**

```python
# API automatically uses KnowledgeBasePermission
# No additional code needed - permissions are handled automatically

# Example API calls:
GET /knowledge/api/articles/          # Public access
POST /knowledge/api/articles/         # Requires: knowledge.articles.create
PUT /knowledge/api/articles/{slug}/   # Requires: knowledge.articles.edit + ownership
DELETE /knowledge/api/articles/{slug}/ # Requires: knowledge.articles.delete + ownership
POST /knowledge/api/articles/{slug}/approve/ # Requires: knowledge.articles.approve
```

### 3. **Template Permission Checks**

```html
<!-- article_list.html -->
{% load permission_tags %}

<div class="article-actions">
    {% if user|has_permission:"knowledge,articles,create" %}
        <a href="{% url 'knowledge:article_create' %}" class="btn btn-primary">
            <i class="fas fa-plus"></i> Buat Artikel
        </a>
    {% endif %}
    
    {% if user|has_permission:"knowledge,articles,approve" %}
        <a href="{% url 'knowledge:pending_approval' %}" class="btn btn-warning">
            <i class="fas fa-clock"></i> Pending Approval
        </a>
    {% endif %}
</div>

<!-- article_detail.html -->
<div class="article-actions">
    {% if article.author == user or user|has_permission:"knowledge,articles,edit" %}
        <a href="{% url 'knowledge:article_edit' article.slug %}" class="btn btn-secondary">
            <i class="fas fa-edit"></i> Edit
        </a>
    {% endif %}
    
    {% if article.author == user or user|has_permission:"knowledge,articles,delete" %}
        <a href="{% url 'knowledge:article_delete' article.slug %}" class="btn btn-danger">
            <i class="fas fa-trash"></i> Hapus
        </a>
    {% endif %}
    
    {% if user|has_permission:"knowledge,articles,approve" and article.status == 'pending' %}
        <button class="btn btn-success" onclick="approveArticle('{{ article.slug }}')">
            <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-danger" onclick="rejectArticle('{{ article.slug }}')">
            <i class="fas fa-times"></i> Reject
        </button>
    {% endif %}
</div>
```

### 4. **JavaScript Permission Checks**

```javascript
// Check permissions via API
const checkPermission = async (module, control, func) => {
    const response = await fetch('/api/auth/check-permission/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            module: module,
            control: control,
            function: func
        })
    });
    const data = await response.json();
    return data.has_permission;
};

// Usage
const canCreateArticle = await checkPermission('knowledge', 'articles', 'create');
if (canCreateArticle) {
    document.getElementById('create-btn').style.display = 'block';
}

const canApprove = await checkPermission('knowledge', 'articles', 'approve');
if (canApprove) {
    document.getElementById('approve-btn').style.display = 'block';
}
```

---

## 👥 User Role Examples

### 1. **Reader Role** (Basic User)

**Permissions:**
- `knowledge.articles.view` ✅
- `knowledge.categories.view` ✅
- `knowledge.tags.view` ✅
- `knowledge.comments.view` ✅
- `knowledge.comments.create` ✅
- `knowledge.ratings.view` ✅
- `knowledge.ratings.create` ✅

**Can Do:**
- ✅ Browse and read articles
- ✅ View categories and tags
- ✅ Comment on articles
- ✅ Rate articles
- ✅ Like/dislike articles and comments

**Cannot Do:**
- ❌ Create articles
- ❌ Edit any content
- ❌ Approve/reject articles
- ❌ Manage categories/tags

### 2. **Author Role** (Content Creator)

**Permissions:** Reader permissions + 
- `knowledge.articles.create` ✅
- `knowledge.articles.edit` ✅ (own articles)
- `knowledge.articles.publish` ✅ (own articles)

**Can Do:**
- ✅ All Reader capabilities
- ✅ Create new articles
- ✅ Edit own articles
- ✅ Submit articles for approval
- ✅ Publish approved articles

**Cannot Do:**
- ❌ Edit other users' articles
- ❌ Approve/reject articles
- ❌ Manage categories/tags
- ❌ View analytics

### 3. **Editor Role** (Content Manager)

**Permissions:** Author permissions +
- `knowledge.articles.edit` ✅ (all articles)
- `knowledge.articles.delete` ✅
- `knowledge.categories.create` ✅
- `knowledge.categories.edit` ✅
- `knowledge.tags.create` ✅
- `knowledge.tags.edit` ✅

**Can Do:**
- ✅ All Author capabilities
- ✅ Edit any article
- ✅ Delete articles
- ✅ Manage categories and tags
- ✅ Moderate comments

**Cannot Do:**
- ❌ Approve/reject articles
- ❌ View detailed analytics

### 4. **Admin Role** (Full Access)

**Permissions:** All permissions ✅

**Can Do:**
- ✅ Everything
- ✅ Approve/reject articles
- ✅ View analytics and reports
- ✅ Export data
- ✅ Manage all content
- ✅ User management

---

## 🔧 Custom Permission Setup

### 1. **Create Custom Role**

```python
# Create custom role via Django admin or management command
from django.contrib.auth.models import Group
from apps.manajemen.models import PermissionRule, RoleRule

# Create "Content Moderator" role
moderator_group = Group.objects.create(name='Content Moderator')

# Assign specific permissions
permissions = [
    'knowledge.articles.view',
    'knowledge.articles.edit',
    'knowledge.articles.approve',
    'knowledge.comments.view',
    'knowledge.comments.delete',
]

for permission_string in permissions:
    module, control, function = permission_string.split('.')
    rule = PermissionRule.objects.get(
        module__nama_module=module,
        control__nama_kontrol=control,
        function__nama_fungsi=function
    )
    RoleRule.objects.create(role=moderator_group, rule=rule)
```

### 2. **Assign User to Role**

```python
# Assign user to role
user = User.objects.get(username='moderator1')
moderator_group = Group.objects.get(name='Content Moderator')
user.groups.add(moderator_group)
```

### 3. **Check Permission in Code**

```python
from apps.manajemen.helpers import check_permission

# Check if user can approve articles
if check_permission(request.user, 'knowledge', 'articles', 'approve'):
    # User can approve
    article.approve(request.user)
else:
    # No permission
    return HttpResponseForbidden("You don't have permission to approve articles")
```

---

## 🎛️ Admin Interface

### Permission Management via Django Admin

1. **Navigate to:** `/admin/manajemen/`

2. **Available Sections:**
   - **Permission Modules** - Manage modules (Knowledge Base, etc.)
   - **Permission Controls** - Manage controls (articles, categories, etc.)
   - **Permission Functions** - Manage functions (view, create, etc.)
   - **Permission Rules** - View all permission combinations
   - **Role Rules** - Assign permissions to groups

3. **Bulk Operations:**
   - Assign multiple permissions to a role
   - Create new custom roles
   - View permission usage statistics

---

## 🔍 Permission Debugging

### 1. **Check User Permissions**

```python
# In Django shell
from apps.manajemen.helpers import get_user_rules

user = User.objects.get(username='testuser')
rules = get_user_rules(user)

print("User permissions:")
for rule in rules:
    print(f"- {rule.permission_string}")
```

### 2. **Debug Permission Check**

```python
from apps.manajemen.helpers import check_permission

user = User.objects.get(username='testuser')
has_permission = check_permission(user, 'knowledge', 'articles', 'create')

print(f"Can create articles: {has_permission}")

# Debug: Check user's groups
print(f"User groups: {[g.name for g in user.groups.all()]}")

# Debug: Check available rules for this permission
from apps.manajemen.models import PermissionRule
rule = PermissionRule.objects.filter(
    module__nama_module='knowledge',
    control__nama_kontrol='articles',
    function__nama_fungsi='create'
).first()

if rule:
    print(f"Rule exists: {rule.permission_string}")
    # Check if user's groups have this rule
    role_rules = rule.role_assignments.filter(role__in=user.groups.all())
    print(f"User has access via groups: {[rr.role.name for rr in role_rules]}")
```

### 3. **API Permission Testing**

```bash
# Test API endpoints with different users

# Test as anonymous user (should work for read-only)
curl http://localhost:8000/knowledge/api/articles/

# Test as authenticated user without permission (should fail)
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:8000/knowledge/api/articles/ \
     -d '{"title": "Test", "content": "Test content"}'

# Test as user with permission (should work)
curl -H "Authorization: Bearer <admin-token>" \
     -X POST http://localhost:8000/knowledge/api/articles/ \
     -d '{"title": "Test", "content": "Test content"}'
```

---

## 🎯 Best Practices

### 1. **Principle of Least Privilege**
- Give users only the minimum permissions they need
- Start with basic permissions and add more as needed
- Regular permission audits

### 2. **Role-Based Access Control**
- Use groups/roles instead of individual user permissions
- Create logical role hierarchies (Reader → Author → Editor → Admin)
- Document role responsibilities

### 3. **Permission Naming Convention**
- Use clear, descriptive permission names
- Follow the module.control.function pattern
- Keep function names consistent across modules

### 4. **Security Considerations**
- Always check permissions in both frontend and backend
- Use object-level permissions for ownership checks
- Log permission-related actions for audit trails

### 5. **Testing**
- Test all permission combinations
- Verify both positive and negative cases
- Include permission tests in CI/CD pipeline

---

## 📊 Permission Statistics

After seeding, you'll have:

- **1 Module:** Knowledge Base
- **6 Controls:** Articles, Categories, Tags, Comments, Ratings, Analytics
- **9 Functions:** view, create, edit, delete, approve, reject, publish, export, analytics
- **48 Permission Rules:** All combinations
- **5 Menu Items:** Sidebar navigation with permission checks

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `apps/manajemen/models.py` | Permission models |
| `apps/manajemen/helpers.py` | Permission checking functions |
| `apps/manajemen/decorators.py` | View decorators |
| `apps/knowledge/permissions.py` | DRF permission classes |
| `apps/knowledge/management/commands/seed_knowledge_permissions.py` | Permission seeder |
| `apps/knowledge/management/commands/seed_knowledge_menus.py` | Menu seeder |

---

## 🎉 Summary

### ✅ **Complete Permission System Ready**

**Features:**
- ✅ **Granular Control** - 48 specific permissions
- ✅ **Role-Based** - Group-based permission assignment
- ✅ **API Integration** - Automatic DRF permission checking
- ✅ **Web Integration** - Template tags and decorators
- ✅ **Object-Level** - Ownership-based permissions
- ✅ **Public Access** - Read-only access for anonymous users
- ✅ **Admin Interface** - Full management via Django admin

**Setup Commands:**
```bash
# Complete permission setup (3 commands)
docker exec asncorpu_backend_app python manage.py seed_knowledge_permissions
docker exec asncorpu_backend_app python manage.py seed_knowledge_menus
docker exec asncorpu_backend_app python manage.py seed_superadmin_full_access
```

**Result:** Production-ready permission system with granular access control for all Knowledge Base features!

---

**Last Updated:** 2026-05-07  
**Version:** 2.2  
**Status:** ✅ Production Ready