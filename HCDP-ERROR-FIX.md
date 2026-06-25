# Fix: Cannot read properties of undefined (reading 'title')

## Error
```
Cannot read properties of undefined (reading 'title')
```

## Root Cause
Data program belum selesai di-load dari API, tapi sudah diakses di render atau filter function.

## Files Fixed

### 1. Edit Page (`app/(admin)/dashboard/hcdp/[id]/page.tsx`)

**Problem**: 
- `response.data` bisa undefined
- `program.tags` bisa undefined saat `.join()`
- Tidak ada validasi ID

**Solution**:
```typescript
// Before
const program = response.data;
tags: program.tags.join(', ')

// After
const program = response?.data || response;
if (!program) throw new Error('Program tidak ditemukan');
tags: Array.isArray(program.tags) ? program.tags.join(', ') : ''

// Add ID validation
if (id && !isNaN(id)) {
    fetchProgram();
} else {
    setError('ID program tidak valid');
}
```

**Added Error State**:
```typescript
if (error && !formData.title) {
    return (
        <Card>Error message with back button</Card>
    );
}
```

### 2. Public HCDP Page (`app/(main)/hcdp/page.tsx`)

**Problem**:
- Filter function tidak cek null/undefined
- `program.title` dan `program.description` bisa undefined

**Solution**:
```typescript
// Before
programs.filter(p => p.is_published && p.is_active)
const matchesSearch = program.title.toLowerCase()...

// After
programs.filter(p => p && p.is_published && p.is_active)
const matchesSearch = (program.title || '').toLowerCase()...
```

### 3. Admin Dashboard (`app/(admin)/dashboard/hcdp/page.tsx`)

**Problem**:
- Filter function tidak cek null/undefined

**Solution**:
```typescript
// Before
const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase()...
})

// After
const filteredPrograms = programs.filter(program => {
    if (!program) return false;
    const matchesSearch = (program.title || '').toLowerCase()...
})
```

## Safe Guards Added

### 1. Null/Undefined Checks
- ✅ Check if program exists before accessing properties
- ✅ Use optional chaining (`?.`)
- ✅ Provide default values with `||`

### 2. Array Checks
- ✅ Use `Array.isArray()` before calling array methods
- ✅ Provide empty array as fallback

### 3. Loading States
- ✅ Show loading skeleton while fetching
- ✅ Show error state if fetch fails
- ✅ Prevent render until data is ready

### 4. ID Validation
- ✅ Check if ID is valid number
- ✅ Show error if ID is invalid

## Testing Checklist

- [ ] Edit page with valid ID
- [ ] Edit page with invalid ID
- [ ] Edit page when API returns error
- [ ] Public page when no programs exist
- [ ] Public page when API returns error
- [ ] Dashboard when no programs exist
- [ ] Dashboard when API returns error
- [ ] Search/filter with empty results

## Best Practices Applied

1. **Defensive Programming**: Always check if data exists before accessing
2. **Graceful Degradation**: Show meaningful error messages
3. **Type Safety**: Use TypeScript optional chaining
4. **User Experience**: Show loading states and error states

---
**Fixed**: 2026-05-19
**Status**: ✅ Resolved
