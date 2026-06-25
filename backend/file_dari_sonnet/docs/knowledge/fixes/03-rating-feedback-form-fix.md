# Rating Feedback Form Fix - Article Detail

**Tanggal**: 11 Mei 2026  
**Status**: ✅ Selesai

## Masalah

Di halaman artikel detail, user hanya bisa memberi rating (1-5 bintang) **tanpa bisa menulis feedback text**, padahal di database ada field `feedback` yang optional.

### Before (Masalah):
```html
<!-- Hanya ada rating stars, tidak ada textarea feedback -->
<div class="flex items-center gap-2">
    <span>Rate:</span>
    <div class="rating-stars">
        <button onclick="rateArticle(slug, 1)">⭐</button>
        <button onclick="rateArticle(slug, 2)">⭐⭐</button>
        ...
    </div>
</div>
```

**Kekurangan**:
- ❌ User tidak bisa menulis feedback/komentar tentang rating
- ❌ Field `feedback` di database tidak terpakai
- ❌ Admin tidak bisa lihat alasan kenapa user memberi rating tertentu

## Solusi

Menambahkan **textarea feedback** dan **submit button** di bawah rating stars, sehingga user bisa:
1. Pilih rating (1-5 bintang)
2. Tulis feedback (optional)
3. Klik tombol "Kirim Rating" untuk submit

## Perubahan yang Dilakukan

### 1. File: `templates/knowledge/articles/detail.html`

#### A. Update HTML Form

**Sebelum:**
```html
<!-- Rating -->
<div class="flex items-center gap-2">
    <span class="text-sm text-gray-600 font-medium">Rate:</span>
    <div class="rating-stars" id="rating-stars">
        {% for i in "12345" %}
        <button onclick="rateArticle('{{ article.slug }}', {{ i }})" 
                class="rating-star">
            <i class="fas fa-star"></i>
        </button>
        {% endfor %}
    </div>
</div>
```

**Sesudah:**
```html
<!-- Rating -->
<div class="space-y-3">
    <!-- Rating Stars -->
    <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 font-medium">Rating:</span>
        <div class="rating-stars" id="rating-stars">
            {% for i in "12345" %}
            <button type="button" onclick="selectRating({{ i }})" 
                    class="rating-star"
                    data-rating="{{ i }}">
                <i class="fas fa-star"></i>
            </button>
            {% endfor %}
        </div>
        <span id="rating-value" class="text-sm text-gray-500">
            {% if user_rating %}({{ user_rating.rating }}/5){% else %}(Belum dirating){% endif %}
        </span>
    </div>
    
    <!-- Feedback Text (Optional) -->
    <div>
        <label for="rating-feedback" class="block text-sm text-gray-600 font-medium mb-1">
            Feedback (opsional):
        </label>
        <textarea id="rating-feedback" 
                  rows="3" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Tulis feedback Anda tentang artikel ini...">{% if user_rating %}{{ user_rating.feedback }}{% endif %}</textarea>
        <p class="text-xs text-gray-500 mt-1">
            <i class="fas fa-info-circle"></i> Feedback akan membantu penulis meningkatkan kualitas artikel
        </p>
    </div>
    
    <!-- Submit Button -->
    <div>
        <button type="button" 
                onclick="submitRating('{{ article.slug }}')" 
                id="submit-rating-btn"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <i class="fas fa-paper-plane mr-2"></i>
            {% if user_rating %}Update Rating{% else %}Kirim Rating{% endif %}
        </button>
    </div>
</div>
```

#### B. Update JavaScript Functions

**Sebelum:**
```javascript
// Rate Article - Langsung submit saat klik star
function rateArticle(slug, rating) {
    const formData = new FormData();
    formData.append('rating', rating);
    
    fetch(`/knowledge/ajax/articles/${slug}/rate/`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateStars(rating);
            // Show toast
        }
    });
}
```

**Sesudah:**
```javascript
// Select Rating (update stars visual only)
let selectedRating = {% if user_rating %}{{ user_rating.rating }}{% else %}0{% endif %};

function selectRating(rating) {
    selectedRating = rating;
    updateStars(rating);
    document.getElementById('rating-value').textContent = `(${rating}/5)`;
}

// Submit Rating with Feedback
function submitRating(slug) {
    // Validation
    if (selectedRating === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Perhatian',
            text: 'Silakan pilih rating terlebih dahulu (1-5 bintang)'
        });
        return;
    }
    
    // Get feedback text
    const feedback = document.getElementById('rating-feedback').value.trim();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('rating', selectedRating);
    formData.append('feedback', feedback);
    
    // Disable button
    const btn = document.getElementById('submit-rating-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';
    
    // Submit
    fetch(`/knowledge/ajax/articles/${slug}/rate/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Re-enable button
        btn.disabled = false;
        btn.innerHTML = originalText;
        
        if (data.success) {
            // Update star display
            updateStars(selectedRating);
            
            // Update button text
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Update Rating';
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `Rating ${selectedRating} bintang ${feedback ? 'dengan feedback ' : ''}berhasil disimpan!`,
                timer: 3000,
                showConfirmButton: false
            });
            
            // Reload page after 2 seconds to show updated rating stats
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            // Show error message
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.errors || 'Terjadi kesalahan saat menyimpan rating'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        btn.disabled = false;
        btn.innerHTML = originalText;
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Terjadi kesalahan saat mengirim rating'
        });
    });
}
```

## Fitur Baru

### 1. **Rating Stars Selection**
- User klik star untuk pilih rating (1-5)
- Visual feedback: Stars yang dipilih akan berwarna kuning
- Indicator: "(3/5)" menunjukkan rating yang dipilih

### 2. **Feedback Textarea**
- Optional: User bisa skip feedback
- Placeholder: "Tulis feedback Anda tentang artikel ini..."
- Helper text: "Feedback akan membantu penulis meningkatkan kualitas artikel"
- Pre-filled: Jika user sudah pernah rating, feedback lama akan muncul

### 3. **Submit Button**
- Text dinamis:
  - "Kirim Rating" (jika belum pernah rating)
  - "Update Rating" (jika sudah pernah rating)
- Loading state: "Mengirim..." dengan spinner saat submit
- Success state: "Update Rating" dengan checkmark setelah berhasil

### 4. **Validation**
- ✅ Rating wajib dipilih (1-5 bintang)
- ✅ Feedback optional (boleh kosong)
- ✅ Error handling jika submit gagal

### 5. **User Experience**
- ✅ Loading indicator saat submit
- ✅ Success message dengan SweetAlert2
- ✅ Auto reload page setelah 2 detik (untuk update stats)
- ✅ Button disabled saat submit (prevent double submit)

## User Flow

### Scenario 1: User Baru Memberi Rating
```
1. User buka artikel
2. Scroll ke section "Berikan Feedback"
3. Klik star (misal: 5 bintang) → Visual update
4. (Optional) Tulis feedback: "Artikel sangat membantu!"
5. Klik "Kirim Rating"
6. Loading... → Success message
7. Page reload → Rating tersimpan
```

### Scenario 2: User Update Rating yang Sudah Ada
```
1. User buka artikel (sudah pernah rating 4 bintang)
2. Lihat rating lama: 4 bintang + feedback lama (jika ada)
3. Klik star baru (misal: 5 bintang)
4. Edit feedback (atau hapus)
5. Klik "Update Rating"
6. Loading... → Success message
7. Page reload → Rating terupdate
```

## Backend (Tidak Perlu Diubah)

View `article_rate()` di `apps/knowledge/views.py` sudah support feedback:

```python
@login_required
def article_rate(request, slug):
    if request.method == 'POST':
        article = get_object_or_404(Article, slug=slug)
        form = RatingForm(request.POST, user=request.user, article=article)
        
        if form.is_valid():
            # Check if user already rated
            existing_rating = Rating.objects.filter(article=article, user=request.user).first()
            if existing_rating:
                # Update existing rating
                existing_rating.rating = form.cleaned_data['rating']
                existing_rating.feedback = form.cleaned_data['feedback']  # ✅ Sudah ada
                existing_rating.save()
                action = 'updated'
            else:
                # Create new rating
                form.save()
                action = 'created'
            
            return JsonResponse({
                'success': True,
                'action': action,
                'rating_avg': float(article.rating_avg),
                'rating_count': article.rating_count,
            })
```

**Kesimpulan**: Backend sudah siap, hanya frontend yang perlu ditambahkan form feedback.

## Testing

### Test Cases:
1. ✅ User baru memberi rating tanpa feedback
2. ✅ User baru memberi rating dengan feedback
3. ✅ User update rating yang sudah ada
4. ✅ User update feedback tanpa ubah rating
5. ✅ User hapus feedback (kosongkan textarea)
6. ✅ Validation: Submit tanpa pilih rating → Error
7. ✅ Loading state saat submit
8. ✅ Success message muncul
9. ✅ Page reload setelah success
10. ✅ Rating stats terupdate di artikel

### Browser Testing:
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers

## Hasil

### Before:
```
Rating: ⭐⭐⭐⭐⭐ (klik langsung submit, no feedback)
```

### After:
```
Rating: ⭐⭐⭐⭐⭐ (3/5)

Feedback (opsional):
┌─────────────────────────────────────────┐
│ Tulis feedback Anda tentang artikel ini │
│                                         │
│                                         │
└─────────────────────────────────────────┘
ℹ️ Feedback akan membantu penulis meningkatkan kualitas artikel

[Kirim Rating]
```

## Benefits

1. **User Experience**:
   - ✅ User bisa kasih feedback detail tentang artikel
   - ✅ Penulis bisa tahu alasan rating tinggi/rendah
   - ✅ Feedback membantu improve kualitas artikel

2. **Admin**:
   - ✅ Bisa lihat feedback di `/knowledge/manage/ratings/`
   - ✅ Filter rating yang ada feedback vs tanpa feedback
   - ✅ Analisis feedback untuk improve content

3. **Database**:
   - ✅ Field `feedback` sekarang terpakai
   - ✅ Data lebih lengkap dan berguna

## Container Status

```
✅ Container: asncorpu_backend_app
✅ Status: Up and healthy
✅ Port: http://localhost:8008
```

## URL untuk Testing

```
http://localhost:8008/knowledge/artikel/{slug}/
```

Scroll ke section "Berikan Feedback" untuk test rating + feedback form.

---

**Last Updated**: 11 Mei 2026  
**Version**: 1.1  
**Status**: Production Ready ✅
