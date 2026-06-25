# 🗄️ pgAdmin Setup Guide - Cara Lihat Database PostgreSQL

**Date:** May 6, 2026  
**Status:** 📚 **SETUP GUIDE**

---

## 🎯 Overview

pgAdmin adalah tool seperti phpMyAdmin tapi untuk PostgreSQL. Anda sudah punya pgAdmin running di Docker, tinggal setup connection saja.

---

## 🔗 Connection Details

### pgAdmin Access:
```
URL: http://localhost:5050
Email: admin@example.com
Password: admin
```

### PostgreSQL Database:
```
Host: asncorpu-backend-postgres
Port: 5432
Database: asncorpu_backend_db
Username: asncorpu_user
Password: asncorpu_secure_password_2026
```

**⚠️ PENTING:** 
- Gunakan hostname `asncorpu-backend-postgres` (bukan `localhost`)
- Karena pgAdmin dan PostgreSQL sama-sama di Docker network

---

## 📋 Step-by-Step Setup

### Step 1: Buka pgAdmin

1. **Open browser**
2. **Go to:** `http://localhost:5050`
3. **Login:**
   - Email: `admin@example.com`
   - Password: `admin`

---

### Step 2: Add New Server

1. **Klik kanan** pada "Servers" di sidebar kiri
2. **Pilih:** "Register" → "Server..."
3. **Atau klik:** "Add New Server" button

---

### Step 3: General Tab

**Server Name:**
```
ASN Corpu Backend
```

**Description (optional):**
```
PostgreSQL database for ASN Corpu Backend application
```

---

### Step 4: Connection Tab

**Fill in these details:**

| Field | Value |
|-------|-------|
| **Host name/address** | `asncorpu-backend-postgres` |
| **Port** | `5432` |
| **Maintenance database** | `asncorpu_backend_db` |
| **Username** | `asncorpu_user` |
| **Password** | `asncorpu_secure_password_2026` |
| **Save password?** | ✅ Yes (check this) |

**⚠️ PENTING:**
- **JANGAN** gunakan `localhost` atau `127.0.0.1`
- **HARUS** gunakan `asncorpu-backend-postgres` (container name)
- Port: `5432` (internal port, bukan 5433)

---

### Step 5: Save

1. **Klik:** "Save" button
2. **Wait:** Connection akan dibuat
3. **Success:** Server akan muncul di sidebar

---

## 🎯 Navigasi Database

### Setelah Connected:

```
Servers
  └─ ASN Corpu Backend
      └─ Databases (1)
          └─ asncorpu_backend_db
              ├─ Schemas
              │   └─ public
              │       ├─ Tables (50+)
              │       │   ├─ accounts_user
              │       │   ├─ auth_group
              │       │   ├─ knowledge_categories
              │       │   ├─ knowledge_articles
              │       │   ├─ menu_items
              │       │   ├─ permission_modules
              │       │   ├─ permission_controls
              │       │   ├─ permission_functions
              │       │   ├─ permission_rules
              │       │   ├─ role_rules
              │       │   └─ ... (more tables)
              │       └─ Views
              └─ Extensions
```

---

## 📊 Cara Lihat Data

### Method 1: View Data (GUI)

1. **Expand:** Servers → ASN Corpu Backend → Databases → asncorpu_backend_db
2. **Expand:** Schemas → public → Tables
3. **Klik kanan** pada table (e.g., `knowledge_categories`)
4. **Pilih:** "View/Edit Data" → "All Rows"
5. **Result:** Data akan tampil di tab baru

---

### Method 2: Query Tool (SQL)

1. **Klik kanan** pada database `asncorpu_backend_db`
2. **Pilih:** "Query Tool"
3. **Write SQL:**
   ```sql
   SELECT * FROM knowledge_categories;
   ```
4. **Klik:** Execute button (▶️) atau press F5
5. **Result:** Data akan tampil di bawah

---

## 🔍 Useful Queries

### 1. Check Knowledge Base Tables

```sql
-- List all knowledge tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'knowledge_%'
ORDER BY table_name;
```

---

### 2. Check Categories

```sql
-- View all categories
SELECT 
    id,
    name,
    parent_id,
    is_active,
    order_index
FROM knowledge_categories
ORDER BY parent_id NULLS FIRST, order_index, name;
```

---

### 3. Check Permissions

```sql
-- View all knowledge permissions
SELECT 
    pr.id,
    pm.nama_module,
    pc.nama_kontrol,
    pf.nama_fungsi,
    pr.is_active
FROM permission_rules pr
JOIN permission_modules pm ON pr.module_id = pm.id
JOIN permission_controls pc ON pr.control_id = pc.id
JOIN permission_functions pf ON pr.function_id = pf.id
WHERE pm.nama_module = 'knowledge'
ORDER BY pc.nama_kontrol, pf.nama_fungsi;
```

---

### 4. Check Super Admin Permissions

```sql
-- View Super Admin's knowledge permissions
SELECT 
    g.name AS role_name,
    pm.nama_module,
    pc.nama_kontrol,
    pf.nama_fungsi
FROM role_rules rr
JOIN auth_group g ON rr.role_id = g.id
JOIN permission_rules pr ON rr.rule_id = pr.id
JOIN permission_modules pm ON pr.module_id = pm.id
JOIN permission_controls pc ON pr.control_id = pc.id
JOIN permission_functions pf ON pr.function_id = pf.id
WHERE g.name = 'Super Admin'
  AND pm.nama_module = 'knowledge'
ORDER BY pc.nama_kontrol, pf.nama_fungsi;
```

---

### 5. Check Menu Items

```sql
-- View Knowledge Base menu structure
SELECT 
    id,
    name,
    permission_key,
    type,
    parent_id,
    category,
    is_active
FROM menu_items
WHERE name LIKE '%Knowledge%' 
   OR parent_id IN (SELECT id FROM menu_items WHERE name LIKE '%Knowledge%')
ORDER BY parent_id NULLS FIRST, "order";
```

---

### 6. Check Users and Groups

```sql
-- View all users with their groups
SELECT 
    u.id,
    u.username,
    u.email,
    u.is_superuser,
    u.is_staff,
    STRING_AGG(g.name, ', ') AS groups
FROM accounts_user u
LEFT JOIN accounts_user_groups ug ON u.id = ug.user_id
LEFT JOIN auth_group g ON ug.group_id = g.id
GROUP BY u.id, u.username, u.email, u.is_superuser, u.is_staff
ORDER BY u.username;
```

---

## 🛠️ Troubleshooting

### Problem 1: "No rows for PC" (Empty)

**Cause:** Belum add server connection

**Solution:** Follow Step 2-5 above to add server

---

### Problem 2: Connection Failed

**Error:** "could not connect to server"

**Possible Causes:**

1. **Wrong hostname:**
   - ❌ `localhost` or `127.0.0.1`
   - ✅ `asncorpu-backend-postgres`

2. **Wrong port:**
   - ❌ `5433` (external port)
   - ✅ `5432` (internal port)

3. **Container not running:**
   ```bash
   docker ps | grep postgres
   # Should show: asncorpu-backend-postgres
   ```

4. **Wrong credentials:**
   - Check username: `asncorpu_user`
   - Check password: `asncorpu_secure_password_2026`

---

### Problem 3: Permission Denied

**Error:** "permission denied for database"

**Solution:** Make sure using correct username and password from docker-compose.yml

---

## 🔐 Security Notes

### Production:

**⚠️ IMPORTANT:** Change default pgAdmin credentials!

**File:** `docker-compose.yml`

```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: your-email@example.com  # Change this!
    PGADMIN_DEFAULT_PASSWORD: your-secure-password  # Change this!
```

**After changing:**
```bash
docker-compose down
docker-compose up -d
```

---

## 📊 Alternative: Command Line Access

### If you prefer psql (command line):

```bash
# Connect to PostgreSQL
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db

# List tables
\dt

# View table structure
\d knowledge_categories

# Run query
SELECT * FROM knowledge_categories;

# Exit
\q
```

---

## 🎯 Quick Reference

### pgAdmin Access:
```
URL: http://localhost:5050
Email: admin@example.com
Password: admin
```

### Add Server Settings:
```
Name: ASN Corpu Backend
Host: asncorpu-backend-postgres
Port: 5432
Database: asncorpu_backend_db
Username: asncorpu_user
Password: asncorpu_secure_password_2026
```

### Important Tables:
```
- knowledge_categories
- knowledge_articles
- knowledge_tags
- menu_items
- permission_modules
- permission_controls
- permission_functions
- permission_rules
- role_rules
- auth_group
- accounts_user
```

---

## 📚 Documentation

**Related Docs:**
```
file_dari_sonnet/docs/023_DATABASE_LOCATION.md  ← Database info
file_dari_sonnet/docs/035_PGADMIN_SETUP_GUIDE.md  ← This file
```

---

**🎉 SELESAI! Ikuti step-by-step di atas untuk setup pgAdmin!**

**Status:** 📚 **READY TO USE**  
**Date:** May 6, 2026  
**Created by:** Kiro AI Assistant

---

## 📞 Quick Start

**3 Steps to View Database:**

1. **Open:** http://localhost:5050
2. **Login:** admin@example.com / admin
3. **Add Server:**
   - Name: ASN Corpu Backend
   - Host: asncorpu-backend-postgres
   - Port: 5432
   - Database: asncorpu_backend_db
   - Username: asncorpu_user
   - Password: asncorpu_secure_password_2026

**Done!** You can now browse all tables like phpMyAdmin! 🎉
