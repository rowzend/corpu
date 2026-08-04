# TODO: Quiz Cooldown & Certificate Validation (2026-06-12)

## 1. Quiz Retry Cooldown

### Backend Changes Required

**`backend/apps/learning/models.py` - Quiz model:**
```python
# Tambah field
retry_cooldown_minutes = models.IntegerField(
    default=0, 
    validators=[MinValueValidator(0)],
    verbose_name='Cooldown sebelum retry (menit)',
    help_text='0 = tidak ada cooldown. 1440 = 24 jam (jam yang sama besok)'
)

# Update can_user_attempt()
def can_user_attempt(self, user):
    if self.max_attempts == -1:
        return True
    attempts = QuizAttempt.objects.filter(quiz=self, user=user)
    attempts_count = attempts.count()
    if attempts_count >= self.max_attempts:
        return False
    
    # Cek cooldown dari attempt terakhir yang GAGAL
    if self.retry_cooldown_minutes > 0:
        last_failed = attempts.filter(passed=False).order_by('-completed_at').first()
        if last_failed:
            from django.utils import timezone
            from datetime import timedelta
            cooldown_end = last_failed.completed_at + timedelta(minutes=self.retry_cooldown_minutes)
            if timezone.now() < cooldown_end:
                return False
    return True
```

**`backend/apps/learning/serializers.py` - QuizDetailSerializer:**
```python
# Tambah field retry_cooldown_minutes
fields = [..., 'retry_cooldown_minutes']
```

**`backend/apps/learning/views_api.py` - attempt action:**
```python
# Error response tambah info cooldown
if not quiz.can_user_attempt(request.user):
    # Bisa return detail: "Tunggu 2 jam lagi" atau "Batas percobaan habis"
    return Response({'detail': '...'}, status=403)
```

### Frontend Changes
- `learning/quizzes/create/page.tsx` - Tambah input cooldown (minutes)
- `learning/quizzes/[id]/edit/page.tsx` - Same
- `learning/quizzes/[id]/take/page.tsx` - Tampilkan error cooldown dengan countdown

---

## 2. Certificate Only If Quiz Passed

### Option A: Quiz as Blocking Requirement for Lesson Completion

**`backend/apps/learning/models.py` - LessonProgress.mark_completed():**
```python
def mark_completed(self):
    # Cek apakah lesson punya quiz yang wajib lulus
    quiz = self.lesson.quizzes.first()
    if quiz:
        from django.utils import timezone
        attempt = QuizAttempt.objects.filter(
            quiz=quiz, 
            user=self.enrollment.user, 
            passed=True
        ).first()
        if not attempt:
            raise ValueError("Harus lulus kuis terlebih dahulu sebelum menyelesaikan pelajaran ini")
    
    self.is_completed = True
    self.completed_at = timezone.now()
    self.save(update_fields=['is_completed', 'completed_at'])
    self.enrollment.update_progress()
```

**Atau di `update_progress()` sebelum generate certificate:**
```python
def update_progress(self):
    # ... existing code ...
    
    if self.progress_percentage >= 100:
        # Cek semua quiz di course apakah sudah lulus
        course_quizzes = Quiz.objects.filter(lesson__module__course=self.course)
        for quiz in course_quizzes:
            if not QuizAttempt.objects.filter(quiz=quiz, user=self.user, passed=True).exists():
                # Belum lulus quiz ini - tidak generate certificate
                self.status = 'active'  # tetap active, bukan completed
                self.has_certificate = False
                self.save(update_fields=['progress_percentage', 'status', 'has_certificate'])
                return
        
        # Semua quiz lulus -> generate certificate
        # ... existing certificate logic ...
```

### Option B: Quiz as Separate Requirement (Certificate only if ALL quizzes passed)

**Add field to Enrollment:**
```python
all_quizzes_passed = models.BooleanField(default=False)
```

**Update di `QuizAttempt.calculate_score()` saat passed=True:**
```python
def calculate_score(self):
    # ... existing ...
    if self.passed:
        # Cek apakah semua quiz di course sudah lulus
        course_quizzes = Quiz.objects.filter(lesson__module__course=self.enrollment.course)
        all_passed = True
        for quiz in course_quizzes:
            if not QuizAttempt.objects.filter(quiz=quiz, user=self.user, passed=True).exists():
                all_passed = False
                break
        
        if all_passed and self.enrollment.progress_percentage >= 100:
            self.enrollment.has_certificate = True
            self.enrollment.status = 'completed'
            # generate certificate...
```

---

## 3. Priority Decision

| Task | Complexity | Impact |
|------|------------|--------|
| **Retry Cooldown** | Low | High (anti-cheat) |
| **Quiz Block Lesson** | Medium | Medium (pedagogical) |
| **Quiz Block Certificate** | Medium | High (integrity) |

**Recommendation:**
1. **Retry Cooldown** dulu (simple, standalone)
2. **Certificate only if quiz passed** - pakai Option B (lebih fleksibel, tidak block lesson completion)

---

## 4. Test Cases

### Retry Cooldown
- [ ] Quiz max_attempts=3, cooldown=60 → fail attempt 1 → wait 60 min → attempt 2 OK
- [ ] Quiz max_attempts=3, cooldown=1440 → fail → bisa retry besok jam yang sama
- [ ] Quiz max_attempts=3, cooldown=0 → instant retry (current behavior)
- [ ] Pass attempt → cooldown tidak apply (hanya untuk failed)

### Certificate Validation
- [ ] Course tanpa quiz → certificate normal
- [ ] Course dengan quiz, user lulus semua → certificate generate
- [ ] Course dengan quiz, user belum lulus 1 quiz → tidak generate certificate
- [ ] User lulus quiz belakangan → certificate auto-generate (via signal atau check di progress)

---

## 5. Files to Modify

| File | Task 1 (Cooldown) | Task 2 (Certificate) |
|------|-------------------|---------------------|
| `backend/apps/learning/models.py` | ✅ Quiz model | ✅ Enrollment/QuizAttempt |
| `backend/apps/learning/serializers.py` | ✅ QuizDetailSerializer | ✅ EnrollmentSerializer |
| `backend/apps/learning/views_api.py` | ✅ attempt action | - |
| `frontend/app/(admin)/learning/quizzes/create/page.tsx` | ✅ Input cooldown | - |
| `frontend/app/(admin)/learning/quizzes/[id]/edit/page.tsx` | ✅ Input cooldown | - |
| `frontend/app/(admin)/learning/quizzes/[id]/take/page.tsx` | ✅ Error display | - |

---

## 6. Migration

```bash
# After model changes
docker exec asncorpu_backend_app python manage.py makemigrations learning
docker exec asncorpu_backend_app python manage.py migrate
docker restart asncorpu_backend_app
```