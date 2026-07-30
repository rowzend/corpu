# Article Detail Error Investigation

**Tanggal**: 8 Mei 2026  
**Status**: 🔍 UNDER INVESTIGATION  
**Issue**: NoReverseMatch for 'login' URL

---

## 🐛 PROBLEM

### Error Message
```
NoReverseMatch: Reverse for 'login' not found. 'login' is not a valid view function or pattern name.
```

### URL Affected
```
http://localhost:8008/knowledge/artikel/peraturan-tunjangan-kinerja-asn-2026/
```

### HTTP Status
- **Status Code**: 500 Internal Server Error
- **Expected**: 200 OK

---

## 🔍 INVESTIGATION STEPS

### 1. Template Fix ✅
**Issue**: Template had duplicate content (1132 lines)
**Action**: Removed duplicate content, reduced to 750 lines
**Result**: Template syntax fixed, but error persists

### 2. URL Configuration Check ✅
**Command**:
```bash
docker-compose exec asncorpu_backend python manage.py show_urls | grep login
```

**Result**: URL 'login' is registered
```
/login/     core.views.landing_page     login
```

**Verification**:
```bash
docker-compose exec asncorpu_backend python -c "from django.urls import reverse; print(reverse('login'))"
# Output: /login/
```

**Conclusion**: URL 'login' exists and can be reversed ✅

### 3. View Execution Test ✅
**Action**: Added debug prints to `article_detail` view
**Result**: View executes successfully
```
DEBUG: article_detail called for slug: peraturan-tunjangan-kinerja-asn-2026
DEBUG: Article found: Peraturan Tunjangan Kinerja ASN 2026
DEBUG: View tracked
DEBUG: User like status: None
```

**Conclusion**: View logic works, error occurs during/after rendering ❌

### 4. Template Isolation Test ❌
**Action**: Created minimal template without extending base
```html
<!DOCTYPE html>
<html>
<head><title>{{ article.title }}</title></head>
<body><h1>{{ article.title }}</h1></body>
</html>
```

**Result**: Error still occurs
**Conclusion**: Error is NOT in template rendering ❌

### 5. Middleware Investigation 🔍
**Checked**:
- ✅ `SessionInactivityMiddleware` - No reverse('login')
- ✅ `ForceChangePasswordMiddleware` - No reverse('login')
- ✅ `AdminAccessMiddleware` - Uses reverse('login') but only for `/admin/` paths
- ✅ `APILoggingMiddleware` - No reverse('login')

**Conclusion**: Middleware not the direct cause

---

## 🎯 ROOT CAUSE ANALYSIS

### Possible Causes

#### 1. **Form Rendering** (Most Likely)
`CommentForm()` or `RatingForm()` might have a field that tries to reverse 'login' URL.

**Evidence**:
- Error occurs after view execution
- Error occurs even with minimal template
- Forms are created in view context

**Next Steps**:
- Check `CommentForm` and `RatingForm` definitions
- Check if any form field uses `reverse('login')`
- Try removing forms from context

#### 2. **Context Processor**
A context processor might be trying to reverse 'login' for all requests.

**Evidence**:
- Error occurs for all templates (even minimal ones)
- Error is consistent across requests

**Next Steps**:
- Check `TEMPLATES['OPTIONS']['context_processors']` in settings
- Check custom context processors in `core/context_processors.py`

#### 3. **Signal or Post-Save Hook**
A signal might be triggered during view tracking that tries to reverse 'login'.

**Evidence**:
- View tracking (`increment_view_count`) executes before error
- Error might be in signal handler

**Next Steps**:
- Check signals in `apps/knowledge/signals.py`
- Check `increment_view_count` method

---

## 🔧 TEMPORARY WORKAROUNDS

### Option 1: Use Namespace
Change all `reverse('login')` to `reverse('accounts:login')` if accounts app has login URL.

### Option 2: Add URL Alias
Add explicit URL alias in `core/urls.py`:
```python
path('login/', views.landing_page, name='login'),
path('accounts/login/', include('apps.accounts.urls')),  # If this has 'login' name
```

### Option 3: Disable Problematic Feature
Temporarily disable the feature causing the reverse lookup:
- Remove forms from context
- Disable view tracking
- Disable middleware

---

## 📋 DEBUGGING CHECKLIST

### Completed ✅
- [x] Check template syntax
- [x] Verify URL registration
- [x] Test view execution
- [x] Test minimal template
- [x] Check middleware

### Pending 🔍
- [ ] Check form definitions (`CommentForm`, `RatingForm`)
- [ ] Check context processors
- [ ] Check signals
- [ ] Check `increment_view_count` method
- [ ] Check form field widgets
- [ ] Check model `__str__` methods (might use reverse)

---

## 🚀 RECOMMENDED NEXT STEPS

### Step 1: Check Forms
```bash
# Check CommentForm definition
grep -A 20 "class CommentForm" apps/knowledge/forms.py

# Check RatingForm definition
grep -A 20 "class RatingForm" apps/knowledge/forms.py
```

### Step 2: Test Without Forms
Temporarily remove forms from context:
```python
# In article_detail view
context = {
    'article': article,
    'tags': tags,
    'comments': comments,
    'related_articles': related_articles,
    # comment_form': comment_form,  # COMMENTED OUT
    # 'rating_form': rating_form,    # COMMENTED OUT
}
```

### Step 3: Check Context Processors
```bash
# Check settings
grep -A 10 "context_processors" core/settings.py

# Check custom context processors
cat core/context_processors.py
```

### Step 4: Check Signals
```bash
# Check if signals file exists
ls -la apps/knowledge/signals.py

# Check signal connections
grep -r "@receiver" apps/knowledge/
```

---

## 📊 ERROR TIMELINE

| Time | Action | Result |
|------|--------|--------|
| 13:24 | User reports error | TemplateSyntaxError |
| 13:25 | Fixed template duplication | Template syntax OK |
| 13:30 | Restart container | Error persists |
| 13:32 | Test with curl | 500 Error |
| 13:35 | Check URL registration | URL exists ✅ |
| 13:40 | Add debug prints | View executes ✅ |
| 13:45 | Test minimal template | Error persists ❌ |
| 13:50 | Check middleware | No obvious cause |
| 13:55 | Investigation ongoing | Root cause unknown |

---

## 💡 INSIGHTS

### What We Know
1. ✅ Template syntax is correct
2. ✅ URL 'login' is registered and can be reversed
3. ✅ View executes successfully
4. ✅ Error occurs during/after rendering
5. ✅ Error is NOT in template itself
6. ✅ Error is NOT in middleware (directly)

### What We Don't Know
1. ❓ Which component is calling `reverse('login')`
2. ❓ Why it can't find the URL despite it being registered
3. ❓ Why error occurs even with minimal template

### Hypothesis
The error might be caused by:
- **Form field widget** that tries to generate a login URL
- **Context processor** that adds login URL to all contexts
- **Signal handler** triggered by view tracking
- **Model method** (like `__str__` or `get_absolute_url`) that uses reverse

---

## 🔍 DEBUGGING COMMANDS

### Check Form Definitions
```bash
docker-compose exec asncorpu_backend python manage.py shell
>>> from apps.knowledge.forms import CommentForm, RatingForm
>>> form = CommentForm()
>>> print(form.as_p())
```

### Check Context Processors
```bash
docker-compose exec asncorpu_backend python manage.py shell
>>> from django.conf import settings
>>> print(settings.TEMPLATES[0]['OPTIONS']['context_processors'])
```

### Check Signals
```bash
docker-compose exec asncorpu_backend python manage.py shell
>>> from django.db.models import signals
>>> from apps.knowledge.models import Article
>>> print(signals.post_save.receivers)
```

---

## 📝 FILES MODIFIED

### Fixed
1. ✅ `templates/knowledge/articles/detail.html` - Removed duplicate content
2. ✅ `apps/knowledge/views.py` - Cleaned up debug prints

### Created
1. ✅ `templates/knowledge/articles/detail_test.html` - Test template (can be deleted)
2. ✅ `docs/061_ARTICLE_DETAIL_TEMPLATE_FIX.md` - Template fix documentation
3. ✅ `docs/062_ARTICLE_DETAIL_ERROR_INVESTIGATION.md` - This file

---

## ⚠️ CURRENT STATUS

**Status**: 🔴 BLOCKED - Article detail page returns 500 error

**Impact**:
- ❌ Users cannot view article details
- ✅ Other pages work normally
- ✅ Article list works
- ✅ Dashboard works

**Priority**: 🔴 HIGH - Core functionality broken

**Assigned**: Investigation ongoing

---

## 📞 NEED HELP?

If you encounter this error:

1. **Check the logs**:
```bash
docker-compose logs --tail=100 asncorpu_backend | grep "NoReverseMatch"
```

2. **Try accessing other pages** to confirm it's specific to article detail

3. **Check if you can reverse 'login'**:
```bash
docker-compose exec asncorpu_backend python -c "from django.urls import reverse; print(reverse('login'))"
```

4. **Report findings** with:
   - Full error traceback
   - Steps to reproduce
   - Any recent changes made

---

**Last Updated**: 8 Mei 2026, 13:55  
**Next Review**: Pending form/context processor investigation
