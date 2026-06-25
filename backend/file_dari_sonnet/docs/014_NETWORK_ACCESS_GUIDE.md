# 🌐 Network Access Guide

**Expose Localhost ke Network untuk Tim**

---

## 📋 Overview

Panduan ini menjelaskan cara expose aplikasi localhost agar bisa diakses oleh rekan kerja di network yang sama.

**Your IP:** `192.1.6.16`  
**Port:** `8008`

---

## ✅ Setup Complete! (Auto-Detect IP)

Aplikasi sudah dikonfigurasi untuk **otomatis accept semua IP**!

### 🎯 Keuntungan:

- ✅ **Ganti WiFi** → Tidak perlu setting ulang
- ✅ **Ganti LAN** → Tidak perlu setting ulang
- ✅ **IP berubah** → Tetap bisa diakses
- ✅ **Multiple network** → Semua bisa akses

### 🎯 URL Akses:

#### Untuk Kamu (Local):
```
http://localhost:8008/
http://127.0.0.1:8008/
```

#### Untuk Rekan Kerja (Network):
```
http://<YOUR_CURRENT_IP>:8008/
```

**Cara cek IP kamu saat ini:**
```bash
# Linux/Mac
ip addr show | grep "inet " | grep -v "127.0.0.1"

# Atau
ifconfig | grep "inet " | grep -v "127.0.0.1"
```

**Contoh:**
- WiFi Kantor: `http://192.1.6.16:8008/`
- LAN Kabel: `http://192.168.1.100:8008/`
- WiFi Rumah: `http://192.168.0.50:8008/`

**Semua otomatis work!** ✅

#### Admin Panel:
```
http://192.1.6.16:8008/admin/
Username: admin
Password: admin123
```

#### pgAdmin (Database Management):
```
http://192.1.6.16:5050/
Email: admin@example.com
Password: admin
```

---

## 🔧 Konfigurasi yang Sudah Dilakukan:

### 1. **ALLOWED_HOSTS = Wildcard (Auto-Accept All)**

**File:** `.env`
```env
ALLOWED_HOSTS=*
```

**Penjelasan:**
- `*` = Accept semua IP/hostname
- ✅ Ganti WiFi → Tetap work
- ✅ Ganti LAN → Tetap work
- ✅ IP berubah → Tetap work
- ✅ Tidak perlu setting ulang

**Alternative (Lebih Aman untuk Production):**
```env
# Development: Allow all
ALLOWED_HOSTS=*

# Production: Specific domains only
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
```

### 2. **Docker Port Binding**

**File:** `docker-compose.yml`
```yaml
ports:
  - "8008:8000"  # 0.0.0.0:8008 -> container:8000
```

**Penjelasan:**
- Port `8008` di host (komputer kamu) bind ke port `8000` di container
- Otomatis bind ke `0.0.0.0` (semua network interface)
- Rekan kerja bisa akses via `192.1.6.16:8008`

---

## 🎯 Cara Cek IP Kamu Saat Ini

### Method 1: Command Line (Recommended)

```bash
# Linux/Mac - Show all IPs
ip addr show | grep "inet " | grep -v "127.0.0.1"

# Output example:
# inet 192.1.6.16/24 brd 192.1.6.255 scope global dynamic eth0
#      ^^^^^^^^^^^^ Your IP!

# Simpler version
ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1
```

### Method 2: ifconfig (Alternative)

```bash
# Show network interfaces
ifconfig

# Or filter for IP only
ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}'
```

### Method 3: Web Browser

Buka browser dan akses:
```
http://localhost:8008/
```

Jika berhasil, berarti aplikasi running. Tinggal share IP kamu ke rekan kerja.

---

## 🔄 Scenario: Ganti Network

### Scenario 1: Ganti dari WiFi ke LAN

**Before (WiFi):**
```
IP: 192.1.6.16
URL: http://192.1.6.16:8008/
```

**After (LAN Kabel):**
```
IP: 192.168.1.100  (berubah otomatis)
URL: http://192.168.1.100:8008/  (pakai IP baru)
```

**Action Required:** ❌ **TIDAK PERLU APA-APA!**
- Aplikasi tetap jalan
- Cukup cek IP baru kamu
- Share IP baru ke rekan kerja

### Scenario 2: Ganti WiFi (Kantor → Rumah)

**Before (WiFi Kantor):**
```
IP: 192.1.6.16
URL: http://192.1.6.16:8008/
```

**After (WiFi Rumah):**
```
IP: 192.168.0.50  (berubah otomatis)
URL: http://192.168.0.50:8008/  (pakai IP baru)
```

**Action Required:** ❌ **TIDAK PERLU APA-APA!**
- Aplikasi tetap jalan
- Cukup cek IP baru kamu
- Share IP baru ke rekan kerja (jika di network yang sama)

### Scenario 3: Multiple Network Interfaces

**Jika kamu punya WiFi + LAN aktif bersamaan:**
```
WiFi: 192.1.6.16
LAN:  192.168.1.100
```

**Both work!**
```
http://192.1.6.16:8008/     ✅ Work
http://192.168.1.100:8008/  ✅ Work
```

Rekan kerja bisa pakai IP mana saja yang satu network dengan mereka.

---

### Test dari Komputer Kamu:

```bash
# Test localhost
curl http://localhost:8008/health/

# Test IP
curl http://192.1.6.16:8008/health/

# Expected response:
{"status": "healthy"}
```

### Test dari Komputer Rekan Kerja:

**Browser:**
```
http://192.1.6.16:8008/
```

**Command Line:**
```bash
curl http://192.1.6.16:8008/health/
```

**Expected:**
- ✅ Status 200 OK
- ✅ Halaman login tampil
- ✅ API response normal

---

## 🔥 Firewall Check

### Jika Rekan Kerja Tidak Bisa Akses:

#### 1. **Check Firewall (Linux)**

```bash
# Check if port 8008 is open
sudo ufw status

# Allow port 8008
sudo ufw allow 8008/tcp

# Reload firewall
sudo ufw reload
```

#### 2. **Check Firewall (macOS)**

```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow incoming connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

#### 3. **Check Docker Network**

```bash
# Check Docker is listening on 0.0.0.0
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Should show: 0.0.0.0:8008->8000/tcp
```

---

## 🌐 Network Requirements

### Untuk Rekan Kerja Bisa Akses:

1. **Same Network** ✅
   - Komputer kamu dan rekan kerja harus di network yang sama
   - Contoh: Sama-sama connect ke WiFi kantor

2. **No VPN Blocking** ✅
   - Pastikan tidak ada VPN yang block local network access

3. **Firewall Allow** ✅
   - Port 8008 harus open di firewall

4. **IP Reachable** ✅
   - Test ping: `ping 192.1.6.16`

---

## 📊 Troubleshooting

### Problem 1: "Connection Refused"

**Cause:** Port tidak open atau firewall block

**Solution:**
```bash
# Check if port is listening
netstat -an | grep 8008

# Should show: 0.0.0.0:8008 LISTEN

# If not, restart Docker
docker restart asncorpu_backend_app
```

### Problem 2: "DisallowedHost at /"

**Cause:** ALLOWED_HOSTS tidak include IP/hostname

**Solution:**
```bash
# Already fixed! ALLOWED_HOSTS=* accepts all
# No action needed

# If you want to be more specific:
# Edit .env
ALLOWED_HOSTS=localhost,127.0.0.1,your-ip-here

# Restart container
docker restart asncorpu_backend_app
```

**Note:** Dengan `ALLOWED_HOSTS=*`, error ini tidak akan muncul lagi!

### Problem 3: "Cannot reach host"

**Cause:** Network issue atau firewall

**Solution:**
```bash
# Test ping from rekan kerja
ping 192.1.6.16

# If ping fails, check network/firewall
```

### Problem 4: "Timeout"

**Cause:** Firewall blocking

**Solution:**
```bash
# Allow port in firewall
sudo ufw allow 8008/tcp

# Or disable firewall temporarily (testing only!)
sudo ufw disable
```

---

## 🔐 Security Notes

### Development Mode (Current):

**Current Setup:**
```env
DEBUG=True
ALLOWED_HOSTS=*  # Accept all IPs
```

**Keuntungan:**
- ✅ Ganti network → Tetap work
- ✅ Tidak perlu setting ulang
- ✅ Mudah untuk development & testing

**Risks:**
- ⚠️ Anyone di network bisa akses
- ⚠️ Debug info exposed
- ⚠️ No HTTPS
- ⚠️ Accept all hosts (potential security issue in production)

**OK untuk:**
- ✅ Development
- ✅ Testing dengan tim
- ✅ Demo internal
- ✅ Local network only

### Production Mode:

**Recommended Changes:**
```env
# .env (Production)
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
SECRET_KEY=<strong-random-key>

# Use strong passwords
# Enable HTTPS
# Use firewall rules
# Use VPN for remote access
# Specific ALLOWED_HOSTS (not wildcard)
```

**Why not `ALLOWED_HOSTS=*` in production?**
- ❌ Security risk (Host Header attacks)
- ❌ Anyone can point domain to your server
- ❌ No control over who accesses

**Production Best Practice:**
```env
# Specific domains only
ALLOWED_HOSTS=asncorpu.com,www.asncorpu.com,api.asncorpu.com,192.168.1.100
```

---

## 🎯 Common Scenarios

### Scenario 1: Demo ke Client

**Setup:**
```bash
# 1. Get your IP
ip addr show | grep "inet " | grep -v "127.0.0.1"

# 2. Share URL with client
http://192.1.6.16:8008/

# 3. Client access from browser
```

### Scenario 2: Frontend Developer Testing

**Frontend Developer:**
```javascript
// Frontend code
const API_URL = 'http://192.1.6.16:8008/api/v1';

// Test API
fetch(`${API_URL}/book-categories/`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### Scenario 3: Mobile App Testing

**Mobile App:**
```kotlin
// Android/iOS
val BASE_URL = "http://192.1.6.16:8008/api/v1/"

// Test from phone (same WiFi)
```

---

## 📱 Access from Mobile Device

### Same WiFi Network:

1. **Connect phone to same WiFi**
2. **Open browser on phone**
3. **Navigate to:** `http://192.1.6.16:8008/`
4. **Should work!** ✅

### Different Network:

**Options:**
1. **Use ngrok** (tunnel service)
2. **Deploy to VPS** (production)
3. **Use VPN** (secure access)

---

## 🚀 Advanced: ngrok (Optional)

### Untuk Akses dari Internet:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Expose port 8008
ngrok http 8008

# Get public URL
# Example: https://abc123.ngrok.io
```

**Keuntungan:**
- ✅ Akses dari mana saja (internet)
- ✅ HTTPS otomatis
- ✅ No firewall config needed

**Kekurangan:**
- ❌ URL berubah setiap restart (free plan)
- ❌ Slower (via tunnel)
- ❌ Not for production

---

## ✅ Summary

### Current Setup (Auto-Detect IP):

**Configuration:**
```env
ALLOWED_HOSTS=*  # Accept all IPs/hostnames
```

**Local Access:**
```
http://localhost:8008/
http://127.0.0.1:8008/
```

**Network Access (Rekan Kerja):**
```
http://<YOUR_CURRENT_IP>:8008/
```

**Keuntungan:**
- ✅ **Ganti WiFi** → Tidak perlu setting ulang
- ✅ **Ganti LAN** → Tidak perlu setting ulang  
- ✅ **IP berubah** → Tetap work
- ✅ **Multiple network** → Semua bisa akses
- ✅ **Zero configuration** → Plug and play

**Cara Pakai:**
1. **Cek IP kamu:** `ip addr show | grep "inet "`
2. **Share ke rekan kerja:** `http://<YOUR_IP>:8008/`
3. **Ganti network?** → Cukup cek IP baru, share lagi
4. **No restart needed!** → Aplikasi tetap jalan

### Requirements:

- ✅ Same network (WiFi/LAN yang sama)
- ✅ Port 8008 open
- ✅ Firewall allow (usually OK)
- ✅ Docker running

### Next Steps:

1. **Cek IP kamu saat ini**
2. **Share URL** ke rekan kerja: `http://<YOUR_IP>:8008/`
3. **Ganti network?** → Cek IP baru, share lagi
4. **For production** → Deploy to VPS dengan domain & HTTPS

**Aplikasi sudah siap diakses dari network mana pun!** 🎉

---

**Last Updated:** April 24, 2026  
**Configuration:** ALLOWED_HOSTS=* (Auto-accept all IPs)  
**Port:** 8008
