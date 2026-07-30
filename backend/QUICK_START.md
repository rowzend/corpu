# 🚀 QUICK START - ASNCORPU Backend Python

## ⚡ 5-Minute Setup

### 1️⃣ Start the Application
```bash
cd all-projects-darireal/projects/asncorpu-backend-python
docker compose up -d --build
```

### 2️⃣ Run Initial Setup
```bash
# Run database migrations
docker exec asncorpu_backend_app python manage.py migrate

# Create superuser (follow prompts)
docker exec -it asncorpu_backend_app python manage.py createsuperuser

# Seed menus and permissions
docker exec asncorpu_backend_app python manage.py seed_menus

# Collect static files
docker exec asncorpu_backend_app python manage.py collectstatic --noinput
```

### 3️⃣ Access the Application
- **Frontend:** http://localhost:8008/
- **Dashboard:** http://localhost:8008/dashboard/
- **Admin:** http://localhost:8008/admin/

### 4️⃣ Login
Use the superuser credentials you created in step 2.

---

## 🔧 Common Commands

### Container Management
```bash
# View logs
docker logs asncorpu_backend_app -f

# Restart application
docker compose restart

# Stop application
docker compose down

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Django Management
```bash
# Run any Django command
docker exec asncorpu_backend_app python manage.py <command>

# Examples:
docker exec asncorpu_backend_app python manage.py shell
docker exec asncorpu_backend_app python manage.py dbshell
docker exec asncorpu_backend_app python manage.py showmigrations
```

### Static Files
```bash
# Reload static files after changes
./reload-static.sh

# Or manually:
docker exec asncorpu_backend_app python manage.py collectstatic --noinput --clear
docker restart asncorpu_backend_app
```

---

## 📦 Project Structure

```
asncorpu-backend-python/
├── apps/                   # Your Django apps
│   ├── accounts/          # User management
│   ├── dashboard/         # Dashboard
│   ├── manajemen/         # Permissions
│   └── common/            # Shared code
├── core/                  # Django settings
├── templates/             # HTML templates
├── static/                # CSS, JS, images
├── docs/                  # Documentation
└── docker-compose.yml     # Docker config
```

---

## 🎯 Next Steps

### 1. Customize Configuration
Edit `.env` file:
```bash
APP_NAME=YourAppName
APP_LONG_NAME=Your Application Full Name
APP_INSTANSI=Your Organization
```

### 2. Create Your First App
```bash
docker exec asncorpu_backend_app python manage.py startapp your_app_name apps/your_app_name
```

Then add to `INSTALLED_APPS` in `core/settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'apps.your_app_name',
]
```

### 3. Create Models
Edit `apps/your_app_name/models.py`:
```python
from django.db import models

class YourModel(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'your_table_name'
```

### 4. Run Migrations
```bash
docker exec asncorpu_backend_app python manage.py makemigrations
docker exec asncorpu_backend_app python manage.py migrate
```

### 5. Create Views
Edit `apps/your_app_name/views.py`:
```python
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def your_view(request):
    return render(request, 'your_template.html')
```

### 6. Add URLs
Create `apps/your_app_name/urls.py`:
```python
from django.urls import path
from . import views

app_name = 'your_app_name'

urlpatterns = [
    path('', views.your_view, name='index'),
]
```

Include in `core/urls.py`:
```python
urlpatterns = [
    # ...
    path('your-path/', include('apps.your_app_name.urls')),
]
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs asncorpu_backend_app

# Check all containers
docker compose ps

# Rebuild
docker compose down -v
docker compose up -d --build
```

### Database connection error
```bash
# Check MySQL is running
docker ps | grep mysql

# Test connection
docker exec asncorpu_backend_app python manage.py dbshell
```

### Redis connection error
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec asncorpu-backend-redis redis-cli ping
```

### Static files not loading
```bash
# Collect static files
docker exec asncorpu_backend_app python manage.py collectstatic --noinput --clear

# Restart container
docker restart asncorpu_backend_app
```

### Permission denied errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

---

## 📚 Documentation

For detailed documentation, see:
- **[file_dari_sonnet/](file_dari_sonnet/)** - AI-generated setup & configuration docs
  - [00_START_HERE.md](file_dari_sonnet/00_START_HERE.md) - Navigation guide
  - [docs/002_PROJECT_SETUP_SUMMARY.md](file_dari_sonnet/docs/002_PROJECT_SETUP_SUMMARY.md) - Complete setup
  - [docs/004_DEPLOYMENT_CHECKLIST.md](file_dari_sonnet/docs/004_DEPLOYMENT_CHECKLIST.md) - Deployment guide
- **README.md** - Complete project overview
- **CHANGELOG.md** - Version history and changes
- **docs/** - Django documentation (deploy, database, etc.)
  - `docs/deploy/` - Deployment guides
  - `docs/database/` - Database guides
  - `docs/permissions/` - Permission system
  - `docs/api/` - API documentation
  - `docs/security/` - Security best practices

---

## 🆘 Need Help?

1. Check the logs: `docker logs asncorpu_backend_app -f`
2. Review documentation in `docs/` folder
3. Check Django documentation: https://docs.djangoproject.com/
4. Check Docker documentation: https://docs.docker.com/

---

**Happy Coding! 🎉**
