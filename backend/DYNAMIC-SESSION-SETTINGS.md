# Dynamic Session & Security Settings

## Overview
Session timeout dan security settings sekarang sudah dinamis dan dapat diatur melalui halaman Settings di frontend atau melalui database.

## Perubahan yang Dilakukan

### 1. Helper Functions untuk App Settings
**File**: `apps/manajemen/helpers.py`

Ditambahkan 3 helper functions baru:

#### `get_app_setting(key, default=None, as_type=None)`
Membaca single setting dari database dengan type conversion otomatis.

```python
from apps.manajemen.helpers import get_app_setting

# Get session timeout (dalam menit)
timeout = get_app_setting('session_timeout', default=30, as_type='int')

# Get maintenance mode
maintenance = get_app_setting('maintenance_mode', default=False, as_type='bool')
```

#### `get_app_settings(keys, defaults=None)`
Membaca multiple settings sekaligus.

```python
from apps.manajemen.helpers import get_app_settings

settings = get_app_settings(
    ['session_timeout', 'max_login_attempts'],
    defaults={'session_timeout': 30, 'max_login_attempts': 5}
)
```

#### `refresh_app_settings_cache()`
Refresh cache setelah update settings.

```python
from apps.manajemen.helpers import refresh_app_settings_cache
refresh_app_settings_cache()
```

### 2. Dynamic Session Timeout Middleware
**Files**: 
- `core/middleware/session.py`
- `core/middleware.py`

`SessionInactivityMiddleware` sekarang membaca `session_timeout` dari database secara dinamis:

**Sebelum:**
```python
self.timeout = getattr(settings, 'SESSION_INACTIVITY_TIMEOUT', 1800)  # Hardcoded
```

**Sesudah:**
```python
def get_session_timeout(self):
    """Get session timeout from database settings"""
    try:
        from apps.manajemen.helpers import get_app_setting
        # Get session_timeout from database (stored in minutes)
        timeout_minutes = get_app_setting('session_timeout', default=30, as_type='int')
        # Convert to seconds
        return timeout_minutes * 60
    except Exception:
        return self.default_timeout  # Fallback to 1800 seconds (30 minutes)
```

### 3. Frontend - Tab Contact
**File**: `frontend/app/(admin)/settings/page.tsx`

Ditambahkan tab "Contact" yang sebelumnya hilang, dengan fields:
- `contact_email` - Email kontak organisasi
- `contact_phone` - Nomor telepon
- `contact_fax` - Nomor fax
- `contact_address` - Alamat lengkap
- `contact_postal_code` - Kode pos
- `contact_website` - Website resmi

## Cara Menggunakan

### 1. Update Session Timeout
1. Login sebagai admin
2. Buka halaman **Settings** → **Security**
3. Ubah nilai **Session Timeout (menit)**
4. Klik **Simpan**
5. Session timeout akan langsung aktif untuk request berikutnya

### 2. Update Contact Information
1. Login sebagai admin
2. Buka halaman **Settings** → **Contact**
3. Isi informasi kontak organisasi
4. Klik **Simpan**

## Settings yang Sudah Dinamis

### Security Settings
- ✅ **session_timeout** - Session timeout dalam menit (default: 30)
- ⏳ **max_login_attempts** - Maksimal percobaan login (belum diimplementasi)
- ⏳ **password_min_length** - Panjang minimum password (belum diimplementasi)
- ⏳ **require_password_change** - Wajib ganti password (belum diimplementasi)

### General Settings
- ✅ **app_name** - Nama aplikasi
- ✅ **app_description** - Deskripsi aplikasi
- ✅ **app_version** - Versi aplikasi
- ✅ **maintenance_mode** - Mode maintenance
- ✅ **registration_enabled** - Registrasi user baru

### Contact Settings
- ✅ **contact_email** - Email kontak
- ✅ **contact_phone** - Nomor telepon
- ✅ **contact_fax** - Nomor fax
- ✅ **contact_address** - Alamat
- ✅ **contact_postal_code** - Kode pos
- ✅ **contact_website** - Website

### Email Settings
- ✅ **smtp_host** - SMTP host
- ✅ **smtp_port** - SMTP port
- ✅ **smtp_username** - SMTP username
- ✅ **smtp_password** - SMTP password
- ✅ **smtp_use_tls** - Use TLS

### Notification Settings
- ✅ **email_notifications** - Email notifications
- ✅ **sms_notifications** - SMS notifications

### Backup Settings
- ✅ **auto_backup** - Auto backup
- ✅ **backup_frequency** - Backup frequency

### Appearance Settings
- ✅ **default_theme** - Default theme
- ✅ **logo** - Logo aplikasi
- ✅ **favicon** - Favicon

## Testing

### Test Session Timeout
1. Set session timeout ke 1 menit di Settings
2. Login ke aplikasi
3. Tunggu 1 menit tanpa aktivitas
4. Refresh halaman atau klik menu
5. User akan otomatis logout dengan pesan "Session expired"

### Test Dynamic Update
1. Buka 2 browser/tab berbeda
2. Di tab 1: Login sebagai admin, set session timeout ke 2 menit
3. Di tab 2: Login sebagai user biasa
4. Tunggu 2 menit di tab 2
5. Tab 2 akan logout sesuai setting baru

## Catatan Penting

1. **Fallback Mechanism**: Jika database tidak bisa dibaca, sistem akan menggunakan default value (30 menit)
2. **Real-time**: Perubahan session timeout langsung aktif tanpa perlu restart server
3. **Per-Request**: Timeout dibaca setiap request, jadi perubahan langsung terasa
4. **Logging**: Auto-logout akan dicatat di `ms_log_data` dengan informasi durasi inactive

## Future Improvements

1. **Cache Settings**: Implementasi caching untuk mengurangi database queries
2. **Max Login Attempts**: Implementasi dynamic max login attempts
3. **Password Policy**: Implementasi dynamic password minimum length
4. **Notification**: Notifikasi ke user sebelum session expired (countdown)
5. **Admin Override**: Setting untuk bypass session timeout untuk admin

## Troubleshooting

### Session tidak expired sesuai setting
- Cek apakah middleware `SessionInactivityMiddleware` sudah terdaftar di `MIDDLEWARE` settings
- Cek log untuk error saat membaca database
- Pastikan setting `session_timeout` ada di database (jalankan seed command)

### Setting tidak tersimpan
- Cek permission user (harus admin)
- Cek log backend untuk error
- Pastikan database connection normal

### Frontend tidak menampilkan nilai setting
- Cek API response di browser console
- Pastikan backend sudah di-seed dengan command: `python manage.py seed_app_settings`
- Refresh halaman settings
