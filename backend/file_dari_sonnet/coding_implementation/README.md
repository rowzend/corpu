# 💻 Coding Implementation Guide

**Panduan Implementasi Code untuk ASN CORPU Backend**

---

## 📋 Overview

Folder ini berisi **dokumentasi panduan** untuk implementasi code. **BUKAN template code** yang di-copy paste, tapi **panduan** yang menjelaskan cara buat code dari nol.

**Kenapa MD saja, bukan .py?**
- Lebih mudah dibaca & dipahami
- Tidak perlu copy-paste (langsung buat code baru)
- Dokumentasi tetap ada untuk referensi
- Tidak bikin bingung dengan banyak file .py

---

## 🗂️ Struktur Folder

```
coding_implementation/
├── README.md                    ← You are here!
├── 01_API_CRUD_GUIDE.md        ← Panduan buat API CRUD
└── 02_SEEDING_GUIDE.md         ← Panduan database seeding
```

---

## 🎯 Cara Pakai

### Scenario 1: Mau Buat API CRUD Baru

**Contoh:** Buat API untuk kategori_buku

**Langkah:**
1. Baca `01_API_CRUD_GUIDE.md`
2. Minta ke AI: "Buat API CRUD untuk kategori_buku"
3. AI akan buat code langsung (bukan pakai template)
4. Code langsung jadi di apps/books/

**Keuntungan:**
- Code fresh & sesuai kebutuhan
- Tidak perlu edit template
- Langsung jadi

### Scenario 2: Mau Seed Database

**Contoh:** Seed master data kategori_buku

**Langkah:**
1. Baca `02_SEEDING_GUIDE.md`
2. Minta ke AI: "Buat seeder untuk kategori_buku"
3. AI akan buat management command langsung
4. Run command untuk seed

---

## 📚 Dokumentasi Available

### 01_API_CRUD_GUIDE.md
Panduan lengkap buat API CRUD:
- Model structure
- Serializer validation
- ViewSet permissions
- URL routing
- Best practices

### 02_SEEDING_GUIDE.md
Panduan lengkap database seeding:
- Management command structure
- Seeding patterns (simple, bulk, import)
- Best practices
- Common scenarios

---

## 💡 Philosophy

**"Documentation, not Templates"**

- ✅ Dokumentasi panduan (MD) - Mudah dibaca & dipahami
- ✅ AI buat code fresh - Sesuai kebutuhan spesifik
- ❌ Template code (.py) - Bikin bingung, suka lupa

**Workflow:**
1. Baca dokumentasi (MD)
2. Minta AI buat code
3. AI buat code langsung
4. Code langsung jadi & tested

---

## 🔗 Related Documentation

- [012_BACKEND_FRONTEND_COMMUNICATION.md](../docs/012_BACKEND_FRONTEND_COMMUNICATION.md) - API communication
- [011_DJANGO_ADMIN_PANEL.md](../docs/011_DJANGO_ADMIN_PANEL.md) - Admin panel
- [CATATAN_DARI_PROGRAMMER.md](../CATATAN_DARI_PROGRAMMER.md) - Backend notes

---

**Last Updated:** April 24, 2026
