# Login Implementation & Testing Guide

## ✅ Implementasi Selesai!

Login sudah terintegrasi dengan backend Python di `http://192.1.6.24:8008/api`

### 📁 Files yang Diupdate:

1. **`app/login/page.tsx`** - Halaman login dengan integrasi backend
2. **`lib/services/auth.service.ts`** - Service untuk authentication
3. **`app/(main)/dashboard/page.tsx`** - Dashboard setelah login
4. **`.env.local`** - Environment variables backend
5. **`docker-compose.yml`** - Docker environment config

## 🔧 Fitur Login:

### ✨ Features:
- ✅ Form validation
- ✅ Error handling & display
- ✅ Loading state
- ✅ Show/hide password toggle
- ✅ Remember me functionality
- ✅ Token storage (localStorage + cookie)
- ✅ Auto redirect to dashboard
- ✅ Logout functionality
- ✅ Protected routes
- ✅ Responsive design
- ✅ Animated background

### 🔐 Authentication Flow:

```
1. User mengisi username & password
2. Frontend kirim POST ke: http://192.1.6.24:8008/api/auth/login
3. Backend Python validasi credentials
4. Backend return: { success: true, data: { token, user }, message }
5. Frontend save token ke localStorage & cookie
6. Redirect ke /dashboard
7. Dashboard cek token, jika tidak ada redirect ke /login
```

## 🧪 Cara Testing:

### 1. **Akses Halaman Login**
```
http://192.1.6.6:3004/login
atau
http://localhost:3004/login
```

### 2. **Test Login dengan Backend Python**

Pastikan backend Python sudah running di `192.1.6.24:8008`

**Request yang dikirim:**
```json
POST http://192.1.6.24:8008/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Response dari Backend:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "username": "testuser",
      "name": "Test User",
      "email": "test@example.com",
      "role": "user"
    }
  },
  "message": "Login berhasil"
}
```

### 3. **Test dengan Browser Console**

Buka browser console (F12) dan test API:

```javascript
// Test koneksi backend
fetch('http://192.1.6.24:8008/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 4. **Test Login Flow**

1. Buka http://192.1.6.6:3004/login
2. Masukkan credentials yang valid dari backend Python
3. Klik "Masuk"
4. Jika berhasil:
   - Token tersimpan di localStorage
   - Redirect ke /dashboard
   - Dashboard menampilkan info user
5. Jika gagal:
   - Error message ditampilkan
   - Form tetap di halaman login

### 5. **Test Logout**

1. Di dashboard, klik tombol "Logout"
2. Token dihapus dari localStorage & cookie
3. Redirect ke homepage

### 6. **Test Protected Route**

1. Logout terlebih dahulu
2. Coba akses http://192.1.6.6:3004/dashboard
3. Seharusnya auto redirect ke /login

## 🔍 Debugging:

### Cek Token di Browser:

```javascript
// Di browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

### Cek Request di Network Tab:

1. Buka DevTools (F12)
2. Tab "Network"
3. Filter: "Fetch/XHR"
4. Login
5. Lihat request ke `/api/auth/login`
6. Cek Request Headers, Request Payload, dan Response

### Common Issues:

**1. CORS Error**
```
Access to fetch at 'http://192.1.6.24:8008/api/auth/login' from origin 'http://192.1.6.6:3004' has been blocked by CORS policy
```

**Solution:** Backend Python harus enable CORS:
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    'http://192.1.6.6:3004',
    'http://192.168.1.12:3004',
    'http://localhost:3004'
])
```

**2. Network Error**
```
TypeError: Failed to fetch
```

**Solution:** 
- Pastikan backend running
- Cek firewall
- Test dengan curl: `curl http://192.1.6.24:8008/api/health`

**3. Invalid Response Format**

Frontend expect response format:
```json
{
  "success": boolean,
  "data": {
    "token": string,
    "user": object
  },
  "message": string
}
```

Pastikan backend Python return format yang sama!

## 📝 Backend Requirements:

### Endpoint: POST `/api/auth/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "username": "username",
      "name": "Full Name",
      "email": "email@example.com",
      "role": "user|admin"
    }
  },
  "message": "Login berhasil"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Username atau password salah",
  "message": "Login gagal"
}
```

## 🔐 Token Usage:

Setelah login, token bisa digunakan untuk request lain:

```typescript
import { api } from '@/lib/api';

// Get token from localStorage
const token = localStorage.getItem('token');

// Use in API request
const data = await api.get('/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📊 Testing Checklist:

- [ ] Backend Python running di 192.1.6.24:8008
- [ ] CORS enabled di backend
- [ ] Endpoint `/api/auth/login` tersedia
- [ ] Response format sesuai
- [ ] Frontend bisa akses http://192.1.6.6:3004/login
- [ ] Form validation bekerja
- [ ] Error handling bekerja
- [ ] Token tersimpan setelah login
- [ ] Redirect ke dashboard setelah login
- [ ] Dashboard menampilkan user info
- [ ] Logout menghapus token
- [ ] Protected route redirect ke login

## 🚀 Next Steps:

1. **Test dengan credentials real dari backend Python**
2. **Implement register page** (jika diperlukan)
3. **Implement forgot password** (jika diperlukan)
4. **Add middleware untuk protected routes**
5. **Implement token refresh**
6. **Add user profile page**

---

**Status**: ✅ Ready for Testing
**Backend**: http://192.1.6.24:8008/api
**Frontend**: http://192.1.6.6:3004
**Login Page**: http://192.1.6.6:3004/login
