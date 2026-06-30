# Backend Integration Guide - ASN Academy

## 📡 Backend Configuration

### Backend Server
- **Host**: 192.1.6.24
- **Port**: 8008
- **Base URL**: http://192.1.6.24:8008/api

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://192.1.6.24:8008/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

## 🔧 API Client

API client sudah dikonfigurasi di `lib/api.ts` dengan fitur:
- ✅ Automatic timeout handling
- ✅ Error handling & custom error class
- ✅ JSON serialization/deserialization
- ✅ TypeScript support

### Usage Example:
```typescript
import { api } from '@/lib/api';

// GET request
const data = await api.get('/endpoint');

// POST request
const result = await api.post('/endpoint', { data });

// PUT request
const updated = await api.put('/endpoint', { data });

// DELETE request
await api.delete('/endpoint');
```

## 📚 Available Services

### 1. Authentication Service (`lib/services/auth.service.ts`)

**Endpoints:**
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

**Usage:**
```typescript
import { authService } from '@/lib/services';

// Login
const response = await authService.login({
  username: 'user@example.com',
  password: 'password123'
});

// Register
await authService.register({
  username: 'newuser',
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  nip: '199001012020011001'
});
```

### 2. Course Service (`lib/services/course.service.ts`)

**Endpoints:**
- `GET /api/courses` - Get all courses (with filters)
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/latest` - Get latest courses
- `GET /api/courses/popular` - Get popular courses
- `POST /api/courses/:id/enroll` - Enroll to course
- `GET /api/courses/enrolled` - Get enrolled courses
- `GET /api/courses/:id/progress` - Get course progress
- `POST /api/courses/:id/progress` - Update progress

**Usage:**
```typescript
import { courseService } from '@/lib/services';

// Get courses with filter
const { data, total } = await courseService.getCourses({
  category: 'Manajemen',
  level: 'Pemula',
  search: 'kinerja',
  page: 1,
  limit: 10
});

// Enroll to course
await courseService.enrollCourse('course-id-123');
```

### 3. KMS Service (`lib/services/kms.service.ts`)

**Endpoints:**
- `GET /api/kms` - Get all knowledge items
- `GET /api/kms/:id` - Get knowledge by ID
- `POST /api/kms` - Create knowledge item
- `PUT /api/kms/:id` - Update knowledge item
- `DELETE /api/kms/:id` - Delete knowledge item
- `POST /api/kms/:id/like` - Like knowledge item
- `POST /api/kms/:id/comments` - Add comment
- `GET /api/kms/:id/comments` - Get comments

**Usage:**
```typescript
import { kmsService } from '@/lib/services';

// Get knowledge items
const { data, total } = await kmsService.getKnowledgeItems({
  category: 'Best Practice',
  search: 'inovasi',
  page: 1,
  limit: 10
});

// Create new knowledge
await kmsService.createKnowledge({
  title: 'Best Practice Baru',
  description: 'Deskripsi...',
  category: 'Best Practice',
  type: 'Artikel'
});
```

### 4. News Service (`lib/services/news.service.ts`)

**Endpoints:**
- `GET /api/news` - Get all news
- `GET /api/news/:id` - Get news by ID
- `GET /api/news/latest` - Get latest news
- `GET /api/news/category/:category` - Get news by category

**Usage:**
```typescript
import { newsService } from '@/lib/services';

// Get latest news
const latestNews = await newsService.getLatestNews(3);

// Get news by ID
const news = await newsService.getNewsById('news-id-123');
```

## 🔐 Authentication Flow

### 1. Login Process
```typescript
'use client';

import { useState } from 'react';
import { authService } from '@/lib/services';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.login(credentials);
      
      // Save token to localStorage or cookie
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login gagal!');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
    </form>
  );
}
```

### 2. Protected Routes
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*']
};
```

### 3. API Request with Token
```typescript
import { api } from '@/lib/api';

// Add token to request headers
const token = localStorage.getItem('token');

const data = await api.get('/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🚀 Integration Steps

### Step 1: Update Environment
```bash
# Update .env.local
NEXT_PUBLIC_API_URL=http://192.1.6.24:8008/api
```

### Step 2: Restart Container
```bash
docker restart asn-acad-frontend
```

### Step 3: Test API Connection
```typescript
// Test di browser console atau component
import { api } from '@/lib/api';

api.get('/health')
  .then(data => console.log('Backend connected:', data))
  .catch(error => console.error('Backend error:', error));
```

## 🔍 Error Handling

### Global Error Handler
```typescript
import { handleApiError } from '@/lib/api';

try {
  await courseService.getCourses();
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error(errorMessage);
  // Show error to user
}
```

### Custom Error Component
```typescript
'use client';

export default function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="error-container">
      <h2>Terjadi Kesalahan</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Muat Ulang
      </button>
    </div>
  );
}
```

## 📝 Backend Requirements

Backend harus menyediakan endpoints berikut:

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/logout`
- GET `/api/auth/profile`

### Courses
- GET `/api/courses`
- GET `/api/courses/:id`
- POST `/api/courses/:id/enroll`

### KMS
- GET `/api/kms`
- GET `/api/kms/:id`
- POST `/api/kms`

### News
- GET `/api/news`
- GET `/api/news/:id`
- GET `/api/news/latest`

## 🔧 CORS Configuration

Backend harus mengizinkan CORS dari:
- `http://192.1.6.6:3004` (Server IP)
- `http://192.168.1.12:3004` (Server WiFi IP)
- `http://localhost:3004` (Development)

### Express.js Example:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://192.1.6.6:3004',
    'http://192.168.1.12:3004',
    'http://localhost:3004'
  ],
  credentials: true
}));
```

## 📊 Response Format

Semua API response harus mengikuti format:

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🧪 Testing

### Test API Connection:
```bash
curl http://192.1.6.24:8008/api/health
```

### Test from Frontend:
```typescript
// In browser console
fetch('http://192.1.6.24:8008/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

**Status**: ✅ Ready for Integration
**Last Updated**: 2024
**Backend URL**: http://192.1.6.24:8008/api
