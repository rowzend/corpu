from apps.manajemen.helpers import check_permission
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.get(username="Prakom@admin2025.com")
print("courses.view:", check_permission(u, "learning", "courses", "view"))
print("quizzes.create:", check_permission(u, "learning", "quizzes", "create"))
print("quizzes.edit:", check_permission(u, "learning", "quizzes", "edit"))
print("certificates.edit:", check_permission(u, "learning", "certificates", "edit"))
print("is_superadmin:", u.groups.filter(name="Super Admin").exists())
