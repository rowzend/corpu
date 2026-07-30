# 🛠️ Management Tools - ASN CORPU Backend

**Database Management Tools untuk PostgreSQL**

---

## 📊 Available Tools

### ✅ pgAdmin (PostgreSQL)
- **URL:** http://localhost:5050
- **Email:** admin@example.com
- **Password:** admin
- **Status:** ✅ Running

### ⚠️ phpMyAdmin (MySQL) - Not Installed
- **Note:** Project sudah migrasi ke PostgreSQL
- **Alternative:** Gunakan pgAdmin untuk PostgreSQL

### 🔧 Adminer (Universal) - Optional
- **Support:** MySQL, PostgreSQL, SQLite, MS SQL, Oracle
- **Status:** Not installed (bisa ditambahkan jika perlu)

---

## 🚀 Quick Start - pgAdmin

### 1. Access pgAdmin
```
URL:      http://localhost:5050
Email:    admin@example.com
Password: admin
```

### 2. Add PostgreSQL Server

**Klik "Add New Server"** atau **"Create > Server"**

**Tab General:**
- Name: `ASNCORPU Backend`

**Tab Connection:**
- Host: `asncorpu-backend-postgres`
- Port: `5432`
- Maintenance database: `asncorpu_backend_db`
- Username: `asncorpu_user`
- Password: `asncorpu_secure_password_2026`
- Save password: ✅ Yes

**Klik "Save"**

### 3. Browse Database

Setelah connected, kamu bisa:
- ✅ Browse tables
- ✅ Run SQL queries
- ✅ View data
- ✅ Export/Import data
- ✅ Manage users & permissions
- ✅ Monitor performance

---

## 📋 Common Tasks

### View Tables
```
Servers > ASNCORPU Backend > Databases > asncorpu_backend_db > Schemas > public > Tables
```

### Run SQL Query
```sql
-- Klik kanan pada database > Query Tool
SELECT * FROM users;
SELECT * FROM menu_items;
SELECT COUNT(*) FROM users;
```

### Export Data
```
Klik kanan pada table > Import/Export Data
Format: CSV, JSON, SQL
```

### Backup Database
```
Klik kanan pada database > Backup
Format: Custom, Tar, Plain
```

### Restore Database
```
Klik kanan pada database > Restore
Select backup file
```

---

## 🔧 Alternative: Command Line (psql)

### Connect via Docker
```bash
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db
```

### Connect via localhost
```bash
psql -h localhost -p 5433 -U asncorpu_user -d asncorpu_backend_db
# Password: asncorpu_secure_password_2026
```

### Common psql Commands
```sql
\l              -- List databases
\dt             -- List tables
\d table_name   -- Describe table
\du             -- List users
\q              -- Quit

-- SQL queries
SELECT * FROM users;
SELECT COUNT(*) FROM menu_items;
```

---

## 🎯 Management Tools Comparison

### pgAdmin (PostgreSQL)
**Pros:**
- ✅ Official PostgreSQL tool
- ✅ Feature-rich GUI
- ✅ Query builder
- ✅ Visual explain plans
- ✅ Backup/restore tools
- ✅ User management

**Cons:**
- ❌ PostgreSQL only
- ❌ Heavier resource usage

**Best for:** PostgreSQL management, complex queries, production

### Adminer (Universal)
**Pros:**
- ✅ Support multiple databases
- ✅ Lightweight (single PHP file)
- ✅ Simple interface
- ✅ Fast

**Cons:**
- ❌ Less features than pgAdmin
- ❌ Basic UI

**Best for:** Quick access, multiple database types

### psql (Command Line)
**Pros:**
- ✅ Fast
- ✅ Scriptable
- ✅ No GUI overhead
- ✅ SSH-friendly

**Cons:**
- ❌ No visual interface
- ❌ Learning curve

**Best for:** Automation, scripts, SSH access

---

## 📦 Optional: Install Adminer

Jika kamu mau tool universal yang support MySQL & PostgreSQL:

### Add to docker-compose.yml
```yaml
  adminer:
    image: adminer:latest
    container_name: asncorpu-backend-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: asncorpu-backend-postgres
    networks:
      - default
```

### Start Adminer
```bash
docker compose up -d adminer
```

### Access
```
URL: http://localhost:8080
System: PostgreSQL
Server: asncorpu-backend-postgres
Username: asncorpu_user
Password: asncorpu_secure_password_2026
Database: asncorpu_backend_db
```

---

## 🔐 Security Notes

### Production Recommendations

1. **Change Default Passwords**
```yaml
# docker-compose.yml
PGADMIN_DEFAULT_EMAIL: your-email@company.com
PGADMIN_DEFAULT_PASSWORD: strong-password-here
```

2. **Restrict Access**
```yaml
# Only allow localhost
ports:
  - "127.0.0.1:5050:80"
```

3. **Use HTTPS**
```yaml
# Add SSL certificate
volumes:
  - ./certs:/certs
environment:
  PGADMIN_ENABLE_TLS: 'True'
```

4. **Firewall Rules**
```bash
# Only allow specific IPs
sudo ufw allow from 192.168.1.0/24 to any port 5050
```

---

## 📊 Current Setup

### Containers Running
```
✅ asncorpu-backend-postgres  (PostgreSQL 16)
✅ asncorpu-backend-redis      (Redis 7.4)
✅ asncorpu-backend-pgadmin    (pgAdmin 4)
✅ asncorpu_backend_app        (Django)
```

### Ports
```
8008  - Django Application
5050  - pgAdmin (PostgreSQL GUI)
5433  - PostgreSQL (external access)
6379  - Redis (internal only)
```

### Access URLs
```
Application:  http://localhost:8008/
pgAdmin:      http://localhost:5050/
Health Check: http://localhost:8008/health/
```

---

## 🎯 Quick Reference

### pgAdmin Login
```
URL:      http://localhost:5050
Email:    admin@example.com
Password: admin
```

### PostgreSQL Connection (pgAdmin)
```
Host:     asncorpu-backend-postgres
Port:     5432
Database: asncorpu_backend_db
User:     asncorpu_user
Password: asncorpu_secure_password_2026
```

### PostgreSQL Connection (External)
```
Host:     localhost
Port:     5433
Database: asncorpu_backend_db
User:     asncorpu_user
Password: asncorpu_secure_password_2026
```

---

## 🆘 Troubleshooting

### pgAdmin not loading
```bash
# Check logs
docker logs asncorpu-backend-pgadmin

# Restart
docker compose restart pgadmin

# Rebuild
docker compose down pgadmin
docker compose up -d pgadmin
```

### Can't connect to PostgreSQL
```bash
# Check PostgreSQL is running
docker exec asncorpu-backend-postgres pg_isready -U asncorpu_user

# Check network
docker network inspect asncorpu-backend-python_default

# Test connection
docker exec -it asncorpu-backend-postgres psql -U asncorpu_user -d asncorpu_backend_db
```

### Forgot pgAdmin password
```bash
# Reset by recreating container
docker compose down pgadmin
docker volume rm asncorpu-backend-python_pgadmin_data
docker compose up -d pgadmin
```

---

## 📚 Resources

### pgAdmin Documentation
- Official Docs: https://www.pgadmin.org/docs/
- Video Tutorials: https://www.youtube.com/results?search_query=pgadmin+tutorial

### PostgreSQL Documentation
- Official Docs: https://www.postgresql.org/docs/
- Tutorial: https://www.postgresqltutorial.com/

### Adminer
- Official Site: https://www.adminer.org/
- GitHub: https://github.com/vrana/adminer

---

**Last Updated:** April 24, 2026  
**Status:** ✅ pgAdmin Running  
**Access:** http://localhost:5050
