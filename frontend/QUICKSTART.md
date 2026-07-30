# 🚀 Quick Start Guide

Panduan cepat untuk memulai development ASN Academy Frontend.

## ⚡ 5 Menit Setup

### 1. Install Dependencies
```bash
cd all-projects/projects/asn-acad-frontend
npm install
```

### 2. Setup Environment
```bash
# File .env.local sudah ada, edit jika perlu
# Default: http://localhost:3002/api (Backend)
# Frontend Port: 3004
```

### 3. Start Development Server

**Opsi 1: Langsung dengan npm**
```bash
npm run dev
```

**Opsi 2: Dengan Docker (Recommended)**
```bash
docker-compose up -d
docker-compose logs -f
```

Buka [http://localhost:3004](http://localhost:3004) 🎉

## 📁 File Penting

```
asn-acad-frontend/
├── app/
│   ├── page.tsx              # Homepage
│   ├── example/page.tsx      # Contoh integrasi API
│   └── layout.tsx            # Root layout
├── components/
│   ├── Button.tsx            # Reusable button component
│   └── Card.tsx              # Reusable card component
├── lib/
│   └── api.ts                # ⭐ API Client (PENTING!)
├── .env.local                # Environment variables
└── README.md                 # Dokumentasi lengkap
```

## 🔌 Cara Pakai API Client

### Import
```typescript
import { api, handleApiError } from '@/lib/api';
```

### GET Request
```typescript
const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    console.log(response.data);
  } catch (error) {
    console.error(handleApiError(error));
  }
};
```

### POST Request
```typescript
const createUser = async () => {
  try {
    const response = await api.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log(response.data);
  } catch (error) {
    console.error(handleApiError(error));
  }
};
```

### Dengan Authentication
```typescript
const token = localStorage.getItem('token');

const response = await api.get('/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🎨 Cara Pakai Components

### Button Component
```tsx
import Button from '@/components/Button';

<Button onClick={handleClick}>
  Click Me
</Button>

<Button variant="danger" size="lg" isLoading={loading}>
  Delete
</Button>
```

### Card Component
```tsx
import Card from '@/components/Card';

<Card 
  title="User Profile"
  footer={<Button>Save</Button>}
>
  <p>Card content here</p>
</Card>
```

## 📄 Buat Halaman Baru

### 1. Buat File di `app/`
```bash
# Contoh: app/users/page.tsx
```

```tsx
export default function UsersPage() {
  return (
    <div>
      <h1>Users Page</h1>
    </div>
  );
}
```

### 2. Akses di Browser
```
http://localhost:3004/users
```

## 🎯 Next Steps

### Untuk Frontend Developer:

1. **Baca Dokumentasi**
   - [ ] `README.md` - Overview project
   - [ ] `INTEGRATION-GUIDE.md` - Panduan integrasi
   - [ ] `BACKEND-REQUIREMENTS.md` - Requirement untuk backend

2. **Setup Development**
   - [ ] Install dependencies
   - [ ] Configure `.env.local`
   - [ ] Test development server
   - [ ] Explore example page

3. **Koordinasi dengan Backend**
   - [ ] Minta API documentation
   - [ ] Minta test credentials
   - [ ] Confirm API base URL
   - [ ] Test API endpoints

4. **Start Coding**
   - [ ] Buat halaman login
   - [ ] Buat halaman dashboard
   - [ ] Implement authentication
   - [ ] Integrate dengan backend API

### Untuk Backend Developer:

1. **Baca Requirements**
   - [ ] `BACKEND-REQUIREMENTS.md`
   - [ ] `INTEGRATION-GUIDE.md`

2. **Setup Backend**
   - [ ] Enable CORS
   - [ ] Implement response format
   - [ ] Create API documentation
   - [ ] Provide test data

3. **Koordinasi**
   - [ ] Share API documentation
   - [ ] Share test credentials
   - [ ] Confirm base URL
   - [ ] Schedule integration testing

## 🛠️ Useful Commands

```bash
# Development (Direct)
npm run dev              # Start dev server on port 3004
npm run build           # Build for production
npm start               # Start production server on port 3004

# Development (Docker)
npm run docker:build    # Build Docker image
npm run docker:up       # Start Docker container
npm run docker:down     # Stop Docker container
npm run docker:logs     # View Docker logs
npm run docker:restart  # Restart Docker container

# Code Quality
npm run lint            # Check linting
npm run lint:fix        # Fix linting issues
npm run type-check      # Check TypeScript types

# Maintenance
npm run clean           # Clean build files
```

## 🐛 Troubleshooting

### Port 3004 sudah dipakai
```bash
# Check port usage
lsof -i :3004

# Kill process
kill -9 <PID>

# Atau gunakan port lain
PORT=3005 npm run dev
```

### API Connection Error
1. Pastikan backend running di port 3002
2. Check `NEXT_PUBLIC_API_URL` di `.env.local`
3. Test endpoint dengan Postman/curl

### CORS Error
1. Minta backend developer enable CORS
2. Whitelist origin: `http://localhost:3004`

### Docker Issues
```bash
# Rebuild container
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Lihat DOCKER-SETUP.md untuk troubleshooting lengkap
```

## 📞 Need Help?

- **Frontend Issues**: [Your Contact]
- **Backend Issues**: [Backend Dev Contact]
- **Documentation**: Lihat `README.md` dan `INTEGRATION-GUIDE.md`

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

---

**Happy Coding! 🚀**
