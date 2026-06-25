# ASN CORPU API Documentation

## Base URL
```
http://localhost:3000/apicorpu/1.0
```

## Authentication
All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /apicorpu/auth/1.0/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "Administrator",
      "email": "admin@example.com"
    }
  }
}
```

### Verify Token
```http
POST /apicorpu/auth/1.0/verify
Content-Type: application/json

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Token
```http
POST /apicorpu/auth/1.0/refresh
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 📊 Dashboard API

### Get Dashboard Stats
```http
GET /apicorpu/1.0/dashboard/stats/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_pegawai": 170,
    "pegawai_aktif": 165,
    "menuju_pensiun": 5,
    "last_sync_hours": 2,
    "pns_count": 140,
    "cpns_count": 10,
    "pppk_count": 15,
    "honorer_count": 5,
    "pns_percentage": 82.35,
    "pppk_percentage": 8.82,
    "honorer_percentage": 2.94
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Recent Activities
```http
GET /apicorpu/1.0/dashboard/activities/?limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Data pegawai berhasil disinkronkan",
      "description": "Sinkronisasi data dari SIASN berhasil untuk 25 pegawai",
      "icon": "fas fa-sync-alt",
      "type": "success",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5
}
```

### Get System Status
```http
GET /apicorpu/1.0/dashboard/system-status/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "online",
      "message": "Database connected",
      "icon": "check-circle",
      "class": "success"
    },
    "cache": {
      "status": "online",
      "message": "Cache active",
      "icon": "check-circle",
      "class": "success"
    },
    "siasn": {
      "status": "disconnected",
      "message": "SIASN API not configured",
      "icon": "exclamation-triangle",
      "class": "warning"
    },
    "overall": "healthy"
  }
}
```

### Get Dashboard Charts Data
```http
GET /apicorpu/1.0/dashboard/charts/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "golongan_distribution": {
      "labels": ["Gol I", "Gol II", "Gol III", "Gol IV"],
      "values": [15, 45, 85, 25],
      "colors": ["#3B82F6", "#10B981", "#F59E0B", "#6366F1"]
    },
    "monthly_trend": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "datasets": [
        {
          "label": "PNS",
          "data": [120, 125, 130, 128, 135, 140],
          "color": "#3B82F6"
        }
      ]
    }
  }
}
```

---

## 👥 User Management API

### List Users
```http
GET /apicorpu/1.0/management/users/?page=1&page_size=20&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20)
- `search` (optional): Search by username, name, or email
- `role_id` (optional): Filter by role ID
- `is_active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john.doe",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "",
      "is_active": true,
      "date_joined": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "id_pegawai": null,
      "user_id_opd": null,
      "role": "Admin"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

### Get User Detail
```http
GET /apicorpu/1.0/management/users/1/
Authorization: Bearer <token>
```

### Create User
```http
POST /apicorpu/1.0/management/users/create/
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "jane.doe",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "is_active": true,
  "role_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "username": "jane.doe",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "is_active": true,
    "role": "Staff"
  }
}
```

### Update User
```http
PUT /apicorpu/1.0/management/users/2/update/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "is_active": true,
  "role_id": 3
}
```

### Delete User
```http
DELETE /apicorpu/1.0/management/users/2/delete/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User jane.doe deleted successfully"
}
```

---

## 🔑 Role Management API

### List Roles
```http
GET /apicorpu/1.0/management/roles/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "user_count": 5,
      "permission_count": 50
    },
    {
      "id": 2,
      "name": "Staff",
      "user_count": 20,
      "permission_count": 25
    }
  ],
  "total": 2
}
```

### Get Role Detail
```http
GET /apicorpu/1.0/management/roles/1/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin",
    "user_count": 5,
    "permission_count": 50,
    "permissions": [
      {
        "id": 1,
        "role": 1,
        "rule": 1,
        "role_name": "Admin",
        "rule_detail": {
          "id": 1,
          "module": 1,
          "control": 1,
          "function": 1,
          "module_name": "Dashboard",
          "control_name": "Dashboard View",
          "function_name": "View",
          "permission_string": "dashboard.dashboard_view.view",
          "is_active": true
        }
      }
    ]
  }
}
```

### Create Role
```http
POST /apicorpu/1.0/management/roles/create/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Manager"
}
```

### Update Role
```http
PUT /apicorpu/1.0/management/roles/1/update/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Super Admin"
}
```

### Delete Role
```http
DELETE /apicorpu/1.0/management/roles/3/delete/
Authorization: Bearer <token>
```

### Update Role Permissions
```http
POST /apicorpu/1.0/management/roles/1/permissions/
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission_ids": [1, 2, 3, 5, 8, 13]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permissions updated for role Admin",
  "total_permissions": 6
}
```

---

## 🔐 Permission Management API

### List Permission Modules
```http
GET /apicorpu/1.0/management/permissions/modules/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_module": "dashboard",
      "label_module": "Dashboard",
      "deskripsi_module": "Dashboard module",
      "icon": "fas fa-tachometer-alt",
      "order": 1,
      "is_active": true
    }
  ]
}
```

### List Permission Rules
```http
GET /apicorpu/1.0/management/permissions/rules/?module_id=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "module": 1,
      "control": 1,
      "function": 1,
      "module_name": "Dashboard",
      "control_name": "Dashboard View",
      "function_name": "View",
      "permission_string": "dashboard.dashboard_view.view",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 📋 Menu API

### Get Menu Structure
```http
GET /apicorpu/1.0/management/menu/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Dashboard",
      "permission_key": "dashboard.view",
      "url_name": "dashboard:index",
      "external_url": null,
      "icon": "fas fa-tachometer-alt",
      "type": "module",
      "parent": null,
      "order": 1,
      "category": 1,
      "is_active": true,
      "children": []
    },
    {
      "id": 2,
      "name": "Manajemen",
      "permission_key": null,
      "url_name": null,
      "external_url": null,
      "icon": "fas fa-cogs",
      "type": "module",
      "parent": null,
      "order": 2,
      "category": 1,
      "is_active": true,
      "children": [
        {
          "id": 3,
          "name": "Users",
          "permission_key": "manajemen.users.view",
          "url_name": "manajemen:users",
          "external_url": null,
          "icon": "fas fa-users",
          "type": "submenu",
          "parent": 2,
          "order": 1,
          "category": 1,
          "is_active": true,
          "children": []
        }
      ]
    }
  ]
}
```

---

## ⚙️ App Settings API

### Get App Settings
```http
GET /apicorpu/1.0/management/settings/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "app_name": "ASN CORPU",
    "app_description": "Sistem Manajemen ASN",
    "contact_email": "admin@asncorpu.com",
    "contact_phone": "+62 123 4567 890",
    "logo_url": "/media/logo.png"
  }
}
```

### Update App Setting
```http
PUT /apicorpu/1.0/management/settings/app_name/
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "ASN CORPU v2"
}
```

---

## 📝 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "username": ["This field is required"],
    "password": ["Passwords do not match"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/apicorpu/auth/1.0/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/apicorpu/1.0/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### List Users
```bash
curl -X GET "http://localhost:3000/apicorpu/1.0/management/users/?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create User
```bash
curl -X POST http://localhost:3000/apicorpu/1.0/management/users/create/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "is_active": true
  }'
```

---

## 📚 Next Steps

1. ✅ API Backend sudah siap
2. ⏳ Buat Next.js Admin Dashboard
3. ⏳ Buat API Services di Next.js
4. ⏳ Implementasi UI Components
5. ⏳ Testing & Integration

