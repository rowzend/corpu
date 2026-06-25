# Fix: HCDP Landing Page Bentrok dengan HCDP Admin

## Masalah
Landing page HCDP public (`/hcdp`) meminta login ketika diakses dari navbar, padahal seharusnya bisa diakses tanpa login.

## Penyebab
Di `middleware.ts`, route `/hcdp` dimasukkan ke dalam `protectedRoutes` dan `matcher`, sehingga **semua halaman HCDP** (termasuk landing page public) memerlukan authentication.

## Struktur Route
```
/hcdp                    → Public landing page (app/(main)/hcdp/)
/dashboard/hcdp          → Admin HCDP page (app/(admin)/dashboard/hcdp/)
```

## Solusi
Menghapus `/hcdp` dari:
1. Array `protectedRoutes` di middleware
2. Config `matcher` di middleware

Dengan begitu:
- `/hcdp` → **Tidak perlu login** (public access)
- `/dashboard/hcdp` → **Perlu login** (protected via `/dashboard` route)

## Perubahan di `middleware.ts`

### Before
```typescript
const protectedRoutes = ['/dashboard', '/users', '/roles', '/settings', '/knowledge', '/hcdp'];

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/roles/:path*',
    '/settings/:path*',
    '/knowledge/:path*',
    '/hcdp/:path*',  // ❌ Ini yang bikin bentrok
    '/login'
  ]
};
```

### After
```typescript
const protectedRoutes = ['/dashboard', '/users', '/roles', '/settings', '/knowledge'];

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/roles/:path*',
    '/settings/:path*',
    '/knowledge/:path*',
    '/login'
  ]
};
```

## Testing
1. Akses `/hcdp` dari navbar → ✅ Langsung tampil tanpa login
2. Akses `/dashboard/hcdp` → ✅ Redirect ke login jika belum login
3. Login lalu akses `/dashboard/hcdp` → ✅ Tampil halaman admin HCDP

## Catatan
- Route group `(main)` untuk public pages (tidak perlu auth)
- Route group `(admin)` untuk admin pages (perlu auth)
- Middleware hanya protect route `/dashboard/*`, bukan `/hcdp/*`
- HCDP admin tetap aman karena berada di `/dashboard/hcdp`

---
**Fixed**: 2026-05-19
**Status**: ✅ Resolved
