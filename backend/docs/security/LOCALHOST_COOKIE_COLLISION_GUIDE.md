# Panduan: Bentrok Login/Session di Localhost (Multi Django, Beda Port)

## Ringkasan Masalah

Jika Anda menjalankan **lebih dari 1 aplikasi Django** di **domain yang sama** (misalnya `localhost`) dengan **port berbeda** (misalnya `8005` dan `8006`), maka bisa terjadi:

- Login di app A membuat app B ikut terbaca “sudah login”
- Logout / session invalid menyebabkan app lain ikut terdampak
- Error CSRF (token ketimpa)

**Penyebab utama:** cookie browser bersifat **domain-based**, bukan port-based.

Artinya cookie untuk `localhost` akan ikut terkirim ke `http://localhost:8005` dan `http://localhost:8006`.

## Solusi Paling Sederhana (Disarankan)

Bedakan nama cookie di masing-masing project.

Tambahkan di `settings.py`:

```python
SESSION_COOKIE_NAME = "sessionid_nama_app_8005"
CSRF_COOKIE_NAME = "csrftoken_nama_app_8005"
```

Untuk app lain (port lain) gunakan nama yang berbeda:

```python
SESSION_COOKIE_NAME = "sessionid_nama_app_8006"
CSRF_COOKIE_NAME = "csrftoken_nama_app_8006"
```

## Solusi Tambahan (Jika Diperlukan)

Jika dua project juga memakai backend session/cache yang sama (Redis/DB), pastikan juga:

- menggunakan `KEY_PREFIX` berbeda
- atau DB index Redis berbeda

## Setelah Mengubah Setting

- Hapus cookies `localhost` di browser (Application/Storage → Cookies → localhost)
- Restart server/container
- Login ulang
