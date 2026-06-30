# 26. Fix Course Delete & Update Errors - IntegrityError & 400 Bad Request

**Tanggal:** 2026-06-12  
**Status:** ✅ Delete Fixed, ⚠️ Update Under Investigation  
**Model:** Claude Sonnet 4.5

---

## 📋 Problem Report

### Issues

**1. Delete Course Error (500 IntegrityError)**
```
Route: /learning/courses/asn-maju-smarter-2
Action: Delete course
Error: IntegrityError - violates foreign key constraint
```

**Error Detail:**
```
django.db.utils.IntegrityError: update or delete on table "learning_lessons" 
violates foreign key constraint "knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_" 
on table "knowledge_articles"

DETAIL: Key (id)=(69) is still referenced from table "knowledge_articles".
```

**2. Update Course Error (400 Bad Request)**
```
Route: /learning/courses/asn-maju-smarter-2
Action: Update course details
Error: 400 Bad Request - Request failed
```

---

## 🔍 Root Cause Analysis - Delete Error

### Database Relationship Issue

**Schema:**
```
learning_lessons (id: 69)
    ↑
    | FK constraint: knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_
    | ON DELETE: NO ACTION (❌ Wrong!)
    ↓
knowledge_articles (source_lesson_id: 69)
```

### Investigation Steps

#### 1. Check Foreign Key Constraint
```sql
SELECT conname, confdeltype,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'c' THEN 'CASCADE'
    END AS delete_action
FROM pg_constraint 
WHERE conname = 'knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_';
```

**Result:**
```
conname: knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_
confdeltype: a
delete_action: NO ACTION  ❌
```

#### 2. Check Migration Definition
File: `backend/apps/knowledge/migrations/0011_article_source_lesson.py`

```python
migrations.AddField(
    model_name='article',
    name='source_lesson',
    field=models.OneToOneField(
        blank=True,
        null=True,
        on_delete=django.db.models.deletion.SET_NULL,  # ✅ Defined as SET_NULL
        related_name='synced_article',
        to='learning.lesson',
    ),
),
```

**Migration says:** `SET_NULL`  
**Database has:** `NO ACTION`  
**Conclusion:** Migration was applied but constraint was not created correctly

---

## 🔧 Solution - Fix Delete Constraint

### File Created: `backend/apps/knowledge/migrations/0012_fix_source_lesson_cascade.py`

```python
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0013_add_course_category'),
        ('knowledge', '0011_article_source_lesson'),
    ]

    operations = [
        # Drop old constraint
        migrations.RunSQL(
            sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Re-add constraint with SET NULL on delete
        migrations.RunSQL(
            sql='''
                ALTER TABLE knowledge_articles 
                ADD CONSTRAINT knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_ 
                FOREIGN KEY (source_lesson_id) 
                REFERENCES learning_lessons(id) 
                ON DELETE SET NULL 
                DEFERRABLE INITIALLY DEFERRED;
            ''',
            reverse_sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_;',
        ),
    ]
```

### Apply Migration

```bash
docker exec asncorpu_backend_app python manage.py migrate knowledge
```

**Output:**
```
Operations to perform:
  Apply all migrations: knowledge
Running migrations:
  Applying knowledge.0012_fix_source_lesson_cascade... OK
```

### Verification

```sql
SELECT conname, confdeltype,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'c' THEN 'CASCADE'
    END AS delete_action
FROM pg_constraint 
WHERE conname = 'knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_';
```

**Result:**
```
conname: knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_
confdeltype: n
delete_action: SET NULL  ✅ FIXED!
```

---

## 📊 Delete Behavior - Before & After

### Before Fix

```
1. User deletes course "asn-maju-smarter-2"
2. Django tries to delete modules
3. Django tries to delete lessons (including ID 69)
4. Database checks FK constraint
5. ❌ ERROR: Lesson 69 is referenced by knowledge_articles
6. ❌ Transaction rolled back
7. ❌ Course not deleted
```

### After Fix

```
1. User deletes course "asn-maju-smarter-2"
2. Django tries to delete modules
3. Django tries to delete lessons (including ID 69)
4. Database checks FK constraint
5. ✅ Constraint: ON DELETE SET NULL
6. ✅ Database sets source_lesson_id = NULL in knowledge_articles
7. ✅ Lesson 69 deleted
8. ✅ Course deleted successfully
```

---

## 🔍 Root Cause Analysis - Update Error (400 Bad Request)

### Status: ⚠️ Under Investigation

**Error Message:**
```
PUT http://localhost:3000/apicorpu/1.0/learning/courses/asn-maju-smarter-2/ 400 (Bad Request)
Gagal Memperbarui Kursus
```

### Investigation Steps Done

#### 1. Check Backend Serializer
```python
# CourseListSerializer looks correct
class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySimpleSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=KnowledgeCategory.objects.filter(is_active=True),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
```
✅ Serializer OK

#### 2. Check Course Data
```python
course = Course.objects.get(slug='asn-maju-smarter-2')
# Current category: None
# Current category_id: None
```
✅ Course exists

#### 3. Backend Logs
```bash
docker logs asncorpu_backend_app | grep "PUT.*asn-maju-smarter-2"
```
❌ No PUT request logged with error

**Possible Causes:**
1. **Frontend validation error** before request sent
2. **Field value type mismatch** (string vs number for category_id)
3. **Missing required field** in form data
4. **File upload issue** (certificate background/template)
5. **Slug field readonly** but still sent in payload

### Next Steps for Debugging

1. **Check browser DevTools Network tab:**
   - View actual request payload
   - Check request headers
   - See response body for validation errors

2. **Check frontend FormData:**
   ```typescript
   // In page.tsx handleSubmit
   const fd = new FormData();
   Object.entries(formData).forEach(([k, v]) => {
       console.log(`${k}: ${v} (${typeof v})`);  // Add this
       if (k !== '_cert_bg_file' && k !== '_cert_tmpl_file') 
           fd.append(k, v as string);
   });
   ```

3. **Test via Postman/curl:**
   ```bash
   curl -X PUT http://localhost:3000/apicorpu/1.0/learning/courses/asn-maju-smarter-2/ \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Update",
       "description": "Test desc",
       "status": "draft"
     }'
   ```

---

## 📝 Files Modified

| File | Change | Status |
|------|--------|--------|
| `backend/apps/knowledge/migrations/0012_fix_source_lesson_cascade.py` | ✅ Created - Fix FK constraint to SET NULL | Done |
| Database constraint | ✅ Modified - ON DELETE NO ACTION → SET NULL | Done |

---

## ✅ Testing Results

### Test Case 1: Delete Course with Referenced Lessons

**Before Fix:**
```
DELETE /apicorpu/1.0/learning/courses/asn-maju-smarter-2/
Response: 500 IntegrityError
Result: ❌ Failed
```

**After Fix:**
```
DELETE /apicorpu/1.0/learning/courses/asn-maju-smarter-2/
Expected Response: 204 No Content
Expected Result: ✅ Course deleted, source_lesson_id set to NULL in articles
Status: 🧪 Ready to test
```

### Test Case 2: Update Course

**Current:**
```
PUT /apicorpu/1.0/learning/courses/asn-maju-smarter-2/
Response: 400 Bad Request
Result: ❌ Failed
Status: ⚠️ Under investigation
```

---

## 🔑 Key Points

### Foreign Key Constraint Types

| Type | Code | Behavior | Use Case |
|------|------|----------|----------|
| **CASCADE** | `c` | Delete parent → Delete child | Strong ownership (Order → OrderItems) |
| **SET NULL** | `n` | Delete parent → Set child FK to NULL | Optional reference (Article → Lesson) |
| **RESTRICT** | `r` | Prevent delete if child exists | Strict dependency |
| **NO ACTION** | `a` | Check at commit time | Default Django behavior |
| **SET DEFAULT** | `d` | Set to default value | Fallback value needed |

### Why SET NULL for source_lesson?

```
Knowledge Article (id: 123)
    source_lesson_id: 69  → Optional sync dengan LMS lesson

When lesson deleted:
  ✅ SET NULL → Article tetap ada, tapi tidak sync ke lesson lagi
  ❌ CASCADE → Article terhapus (data loss!)
  ❌ RESTRICT → Tidak bisa hapus lesson (blocked)
```

**Rationale:** Article adalah konten independent. Lesson adalah optional reference untuk sync. Jika lesson dihapus, article tetap valid.

---

## 📚 Related Issues

### Similar Problems in Other Models

Cek apakah ada FK lain yang perlu SET NULL:

```sql
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.confdeltype,
    CASE rc.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS delete_action
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN pg_constraint AS rc
  ON rc.conname = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name LIKE 'learning_%'
  AND tc.table_schema = 'public';
```

---

## 🚀 Next Steps

### For Delete Error ✅
- [x] Identify constraint issue
- [x] Create migration to fix constraint
- [x] Apply migration
- [x] Verify constraint updated
- [ ] Test delete course (ready for testing)

### For Update Error ⚠️
- [ ] Check browser DevTools for actual payload
- [ ] Add debug logging in frontend handleSubmit
- [ ] Test update via Postman/curl
- [ ] Check backend validation errors
- [ ] Fix identified issue
- [ ] Create documentation

---

## ✅ Status Summary

| Issue | Status | Solution | Test Status |
|-------|--------|----------|-------------|
| **Delete Course IntegrityError** | ✅ Fixed | Migration 0012 - SET NULL constraint | 🧪 Ready to test |
| **Update Course 400 Error** | ⚠️ Investigating | TBD - Need more debugging | 🔍 In progress |

---

**Session:** Kiro AI Assistant  
**Date:** Friday, June 12, 2026  
**Time:** ~04:35 - 04:45 WIB
