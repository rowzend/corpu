# Backend Requirements

Dokumen ini berisi requirement yang dibutuhkan dari backend developer untuk integrasi yang smooth.

## 🔧 Technical Requirements

### 1. CORS Configuration

Backend harus enable CORS untuk origin:
- Development: `http://localhost:3004`
- Production: `https://your-domain.com` (sesuaikan)

### 2. Response Format

Semua API endpoint harus return format JSON yang konsisten:

#### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

#### Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### 3. HTTP Status Codes

Gunakan status code yang sesuai:
- `200` - OK (GET, PUT success)
- `201` - Created (POST success)
- `204` - No Content (DELETE success)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

### 4. Authentication

Jika menggunakan JWT:
- Token dikirim via header: `Authorization: Bearer <token>`
- Token expiry: recommended 24 hours
- Refresh token mechanism (optional tapi recommended)

## 📋 Required Endpoints

### Authentication Endpoints

```
POST /api/auth/login
Body: { email: string, password: string }
Response: { success: true, data: { token: string, user: {...} } }

POST /api/auth/register
Body: { name: string, email: string, password: string }
Response: { success: true, data: { token: string, user: {...} } }

GET /api/auth/me
Headers: { Authorization: Bearer <token> }
Response: { success: true, data: { user: {...} } }

POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: true, message: "Logged out successfully" }
```

### Example Resource Endpoints

```
GET /api/users
Query: ?page=1&limit=10&search=keyword
Response: { 
  success: true, 
  data: { 
    users: [...],
    pagination: { page, limit, total, totalPages }
  } 
}

GET /api/users/:id
Response: { success: true, data: { user: {...} } }

POST /api/users
Body: { name: string, email: string, ... }
Response: { success: true, data: { user: {...} } }

PUT /api/users/:id
Body: { name: string, email: string, ... }
Response: { success: true, data: { user: {...} } }

DELETE /api/users/:id
Response: { success: true, message: "User deleted" }
```

## 📝 API Documentation

Backend developer harus menyediakan:

### 1. Swagger/OpenAPI Documentation
- URL: `http://localhost:3001/api-docs` (recommended)
- Include semua endpoints, request/response schemas
- Include authentication requirements

### 2. Postman Collection
- Export Postman collection
- Include example requests
- Include environment variables

### 3. README Backend
- Setup instructions
- Environment variables
- Database schema
- Seeding data (jika ada)

## 🔐 Security Requirements

### 1. Input Validation
- Validate semua input dari client
- Sanitize input untuk prevent SQL injection
- Validate file uploads (jika ada)

### 2. Rate Limiting
- Implement rate limiting untuk prevent abuse
- Recommended: 100 requests per 15 minutes per IP

### 3. Password Security
- Hash password dengan bcrypt (min 10 rounds)
- Never return password di response
- Implement password strength validation

### 4. JWT Security
- Use strong secret key
- Set appropriate expiry time
- Implement token refresh mechanism

## 📊 Data Requirements

### Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Filtering & Sorting
```
GET /api/users?page=1&limit=10&sort=name&order=asc&search=john
```

### Date Format
- Use ISO 8601 format: `2024-01-15T10:30:00Z`
- Always use UTC timezone

## 🧪 Testing Requirements

### 1. Provide Test Data
- Seeding script untuk development
- Sample users dengan berbagai roles
- Sample data untuk testing

### 2. Test Endpoints
- Semua endpoints harus tested
- Provide test credentials
- Document test scenarios

## 📞 Communication Protocol

### 1. API Changes
- Notify frontend developer sebelum breaking changes
- Provide migration guide jika ada perubahan major
- Use semantic versioning untuk API

### 2. Bug Reports
- Include request/response examples
- Include error messages
- Include steps to reproduce

### 3. New Features
- Discuss API design sebelum implementation
- Provide ETA untuk new endpoints
- Update documentation

## 🚀 Deployment

### 1. Environment Variables
Provide list environment variables yang dibutuhkan:
```env
DATABASE_URL=
JWT_SECRET=
API_PORT=
CORS_ORIGIN=
```

### 2. Health Check Endpoint
```
GET /api/health
Response: { success: true, status: "ok", timestamp: "..." }
```

### 3. Database Migrations
- Provide migration scripts
- Document migration steps
- Backup strategy

## 📚 Example Backend Stack

Recommended stack (pilih salah satu):

### Option 1: Express.js + PostgreSQL
```
- Express.js
- PostgreSQL + Prisma/TypeORM
- JWT authentication
- Express-validator
```

### Option 2: Fastify + PostgreSQL
```
- Fastify
- PostgreSQL + Prisma
- JWT authentication
- Fastify-validator
```

### Option 3: NestJS + PostgreSQL
```
- NestJS
- PostgreSQL + TypeORM/Prisma
- Passport JWT
- Class-validator
```

## ✅ Checklist untuk Backend Developer

Sebelum integrasi, pastikan:

- [ ] CORS sudah dikonfigurasi
- [ ] Response format konsisten
- [ ] Authentication working
- [ ] API documentation tersedia
- [ ] Test data tersedia
- [ ] Error handling proper
- [ ] Validation implemented
- [ ] Rate limiting active
- [ ] Health check endpoint ready
- [ ] Environment variables documented

## 📞 Contact

Jika ada pertanyaan atau butuh klarifikasi:
- Frontend Developer: [Your Name/Contact]
- Backend Developer: [Backend Dev Name/Contact]
