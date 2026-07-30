# ASN CORPU - ESIMPEG Fallback Authentication

## 📋 Overview

ASN CORPU Backend sekarang mendukung **fallback authentication** ke ESIMPEG Python. Jika user tidak ditemukan di database CORPU, sistem akan otomatis mencoba authenticate ke ESIMPEG Python dan membuat user baru di CORPU jika berhasil.

## 🔄 Authentication Flow

```
1. User login ke CORPU API
   ↓
2. Cek user di database CORPU
   ├─ ✅ Found → Authenticate locally
   └─ ❌ Not found → Continue to step 3
   ↓
3. Call ESIMPEG Python API
   ├─ ✅ Success → Create user in CORPU + Login
   └─ ❌ Failed → Authentication failed
```

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# ESIMPEG Integration Configuration
ESIMPEG_FALLBACK_ENABLED=True
ESIMPEG_API_URL=http://localhost:8005
ESIMPEG_API_TIMEOUT=10
```

### Settings (core/settings.py)
```python
# Authentication Backends - Support login dengan Username/Email/NIP + ESIMPEG Fallback
AUTHENTICATION_BACKENDS = [
    'apps.accounts.backends.FlexibleAuthBackend',  # Custom: username/email/NIP + ESIMPEG fallback
    'django.contrib.auth.backends.ModelBackend',   # Fallback: standard Django auth
]

# ESIMPEG Integration Settings
ESIMPEG_FALLBACK_ENABLED = config('ESIMPEG_FALLBACK_ENABLED', default=True, cast=bool)
ESIMPEG_API_URL = config('ESIMPEG_API_URL', default='http://localhost:8005')
ESIMPEG_API_TIMEOUT = config('ESIMPEG_API_TIMEOUT', default=10, cast=int)
```

## 🗄️ Database Changes

### New User Model Fields
```python
# NIP field for authentication
nip = models.CharField(
    'NIP',
    max_length=18,
    null=True,
    blank=True,
    unique=True,
    help_text='Nomor Induk Pegawai (18 digit)'
)

# ESIMPEG integration flag
is_esimpeg_user = models.BooleanField(
    'ESIMPEG User',
    default=False,
    help_text='User created from ESIMPEG fallback authentication'
)
```

### Migration Applied
```bash
# Migration: 0005_user_is_esimpeg_user_user_nip.py
+ Add field is_esimpeg_user to user
+ Add field nip to user
```

## 🔐 Authentication Backends

### FlexibleAuthBackend
- **Primary Backend**: Handles local + ESIMPEG fallback
- **Supports**: Username, Email, NIP login
- **Fallback**: Calls ESIMPEG API if user not found locally

### ESIMPEGOnlyBackend
- **Testing Backend**: Only checks ESIMPEG
- **Use Case**: Testing or specific scenarios

## 🧪 Testing

### Management Command
```bash
# Test local authentication only
docker exec asncorpu_backend_app python manage.py test_esimpeg_fallback admin admin123 --local-only

# Test with ESIMPEG fallback
docker exec asncorpu_backend_app python manage.py test_esimpeg_fallback testuser testpass
```

### API Testing
```bash
# Test login with existing CORPU user
curl -X POST http://localhost:8008/apicorpu/5.0/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test login with ESIMPEG user (if ESIMPEG running)
curl -X POST http://localhost:8008/apicorpu/5.0/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"esimpeg_user","password":"esimpeg_pass"}'
```

## 📊 User Creation from ESIMPEG

When ESIMPEG authentication succeeds, a new user is created in CORPU with:

```python
user = User.objects.create_user(
    username=username,
    email=user_data.get('email', f"{username}@esimpeg.local"),
    password=password,  # Store the password
    name=user_data.get('name', username),
    user_id_opd=user_data.get('user_id_opd', 0),
    is_active=True,
    is_esimpeg_user=True  # Mark as ESIMPEG user
)
```

## 🔗 ESIMPEG API Integration

### Endpoint Called
```
POST {ESIMPEG_API_URL}/apisimpeg/5.0/auth/login
```

### Request Format
```json
{
  "username": "user123",
  "password": "password123"
}
```

### Expected Response
```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 123,
      "username": "user123",
      "name": "User Name",
      "email": "user@example.com",
      "user_id_opd": 1
    }
  }
}
```

## 🚨 Error Handling

### Connection Errors
- **Timeout**: 10 seconds default
- **Connection Error**: ESIMPEG server not reachable
- **HTTP Errors**: Non-200 status codes

### Logging
```python
logger.info(f"Local authentication successful for: {username}")
logger.info(f"ESIMPEG fallback authentication successful for: {username}")
logger.warning(f"Authentication failed for: {username}")
logger.warning("ESIMPEG API timeout")
logger.warning("ESIMPEG API connection error")
```

## 🔧 Configuration Options

### Disable ESIMPEG Fallback
```bash
# In .env
ESIMPEG_FALLBACK_ENABLED=False
```

### Change ESIMPEG URL
```bash
# For production ESIMPEG server
ESIMPEG_API_URL=http://192.1.6.16:8005
```

### Adjust Timeout
```bash
# Increase timeout for slow networks
ESIMPEG_API_TIMEOUT=30
```

## 📝 Use Cases

### 1. **Unified Login System**
- Users can login to CORPU with their ESIMPEG credentials
- No need to create separate accounts in CORPU
- Automatic user provisioning

### 2. **Migration Scenario**
- Gradual migration from ESIMPEG to CORPU
- Users continue using existing credentials
- Data sync between systems

### 3. **Single Sign-On (SSO)**
- One set of credentials for multiple systems
- Centralized user management in ESIMPEG
- Distributed authentication

## 🔍 Monitoring

### Check ESIMPEG Users
```sql
SELECT username, name, email, is_esimpeg_user, date_joined 
FROM users 
WHERE is_esimpeg_user = true;
```

### Authentication Logs
```bash
# Check Django logs for authentication events
docker exec asncorpu_backend_app tail -f /app/logs/django.log | grep "authentication"
```

## 🚀 Production Deployment

### 1. Update Environment
```bash
# Production ESIMPEG URL
ESIMPEG_API_URL=http://esimpeg-production-server:8005
ESIMPEG_FALLBACK_ENABLED=True
```

### 2. Network Configuration
- Ensure CORPU can reach ESIMPEG server
- Configure firewall rules if needed
- Test connectivity between servers

### 3. Monitoring
- Monitor authentication success/failure rates
- Set up alerts for ESIMPEG connection issues
- Track user creation from ESIMPEG

## 📋 Checklist

- [x] ✅ Custom authentication backend implemented
- [x] ✅ User model updated with ESIMPEG fields
- [x] ✅ Migration applied successfully
- [x] ✅ Configuration added to settings
- [x] ✅ Environment variables configured
- [x] ✅ Testing command created
- [x] ✅ Local authentication tested
- [ ] 🔄 ESIMPEG fallback tested (requires ESIMPEG server)
- [ ] 🔄 Production deployment
- [ ] 🔄 Monitoring setup

---

**Created:** January 15, 2025  
**Status:** ✅ Implemented, Ready for Testing  
**Next Steps:** Test with running ESIMPEG server