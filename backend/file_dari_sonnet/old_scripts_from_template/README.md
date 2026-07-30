# 📦 Old Scripts from dasar-python Template

## 📋 Overview

Folder ini berisi script dan file utility dari template **dasar-python** yang tidak langsung diperlukan untuk project **ASNCORPU Backend Python**. File-file ini dipindahkan ke sini untuk referensi jika diperlukan.

**Source:** dasar-python template  
**Moved:** April 24, 2026  
**Reason:** Optional utility scripts, not core functionality  

---

## 📁 Files in This Folder

### Python Scripts (4 files)
| File | Purpose | Keep? |
|------|---------|-------|
| `debug_hasher.py` | Debug password hashing | Reference only |
| `debug_verify.py` | Debug password verification | Reference only |
| `fix_password_format.py` | Fix password format migration | Reference only |
| `SIMPLE_USAGE_EXAMPLE.py` | Example code | Reference only |

### SQL Scripts (2 files)
| File | Purpose | Keep? |
|------|---------|-------|
| `fresh_database.sql` | Fresh database template | Reference only |
| `reset_migrations.sql` | Reset migrations script | Reference only |

---

## 🎯 Why These Files Were Moved

These files are utility scripts from the template that:
- Are not part of core functionality
- May not be needed for ASNCORPU
- Can be referenced if similar functionality is needed
- Are specific to template setup/debugging

---

## ✅ Core Scripts (Still in Root)

These essential scripts remain in project root:

### Shell Scripts
- ✅ `entrypoint.sh` - Docker entrypoint (REQUIRED)
- ✅ `reload-static.sh` - Reload static files (USEFUL)
- ✅ `tailwind-start.sh` - Start Tailwind (USEFUL)
- ✅ `tailwind-stop.sh` - Stop Tailwind (USEFUL)
- ✅ `tailwind-watch.sh` - Watch Tailwind (USEFUL)

### Python Scripts
- ✅ `manage.py` - Django management (REQUIRED)
- ✅ `gunicorn.conf.py` - Gunicorn config (REQUIRED)

---

## 🔍 When to Use These Files

### debug_hasher.py & debug_verify.py
**Use when:**
- Debugging password hashing issues
- Testing password verification
- Migrating from Laravel passwords

**Example:**
```bash
python debug_hasher.py
python debug_verify.py
```

### fix_password_format.py
**Use when:**
- Migrating passwords from Laravel
- Fixing password format issues
- Bulk password updates

**Example:**
```bash
python fix_password_format.py
```

### SIMPLE_USAGE_EXAMPLE.py
**Use when:**
- Learning Django patterns
- Need code examples
- Reference implementation

### fresh_database.sql
**Use when:**
- Need fresh database template
- Resetting database structure
- Reference for schema

### reset_migrations.sql
**Use when:**
- Resetting migrations
- Cleaning up migration history
- Database troubleshooting

---

## 🗑️ Can These Be Deleted?

**Yes, these files can be safely deleted if:**
- ✅ You don't need password migration from Laravel
- ✅ You don't need debug utilities
- ✅ You have your own database setup
- ✅ You don't need example code

**Keep them if:**
- ❓ You might migrate from Laravel
- ❓ You need debugging tools
- ❓ You want reference examples
- ❓ You're new to Django

---

## 💡 Recommendation

**For ASNCORPU Backend Python:**
- These files are **NOT REQUIRED** for normal operation
- Keep them as **REFERENCE ONLY**
- Can be **DELETED** if you're sure you won't need them
- Consider **ARCHIVING** to separate backup location

---

## 📚 Alternative Solutions

Instead of using these scripts, consider:

### For Password Debugging
```python
# Use Django shell
python manage.py shell
from django.contrib.auth.hashers import make_password, check_password
```

### For Database Reset
```bash
# Use Django commands
python manage.py flush
python manage.py migrate
```

### For Examples
- Check Django documentation
- Review apps/ folder for patterns
- Use Django tutorial examples

---

## 🔄 Migration Guide

If you need functionality from these scripts:

### Password Hashing
```python
# In your code
from django.contrib.auth.hashers import make_password
password = make_password('your_password')
```

### Database Reset
```bash
# Using Django
python manage.py flush --noinput
python manage.py migrate
```

### Debug Tools
```python
# Use Django shell
python manage.py shell
# Or use Django debug toolbar
```

---

## 📊 File Status

| File | Size | Last Modified | Status |
|------|------|---------------|--------|
| debug_hasher.py | ~1KB | Template | Archived |
| debug_verify.py | ~1KB | Template | Archived |
| fix_password_format.py | ~1KB | Template | Archived |
| SIMPLE_USAGE_EXAMPLE.py | ~1KB | Template | Archived |
| fresh_database.sql | ~1KB | Template | Archived |
| reset_migrations.sql | ~1KB | Template | Archived |

---

## 🎯 Action Items

**Immediate:**
- ✅ Files archived for reference
- ✅ Core scripts remain in root
- ✅ No action required

**Optional:**
- 🔲 Review if you need any of these
- 🔲 Delete if not needed
- 🔲 Move to separate backup if preferred

---

**Last Updated:** April 24, 2026  
**Status:** Archived for reference  
**Action Required:** None (optional reference material)
