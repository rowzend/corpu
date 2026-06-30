from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.models import BaseUserManager
from django.db import models
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """
    Custom user manager untuk User model tanpa is_staff & is_superuser
    """
    
    def create_user(self, username, email=None, password=None, **extra_fields):
        """Create and save a regular user"""
        if not username:
            raise ValueError('Username harus diisi')
        
        # Remove is_staff & is_superuser jika ada
        extra_fields.pop('is_staff', None)
        extra_fields.pop('is_superuser', None)
        
        # Default values
        extra_fields.setdefault('is_active', True)
        
        if email:
            email = self.normalize_email(email)
        
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_active', True)
        
        # Remove is_staff & is_superuser jika ada
        extra_fields.pop('is_staff', None)
        extra_fields.pop('is_superuser', None)
        
        return self.create_user(username, email, password, **extra_fields)


class UserProfile(models.Model):
    user = models.OneToOneField(
        'accounts.User', on_delete=models.CASCADE,
        related_name='profile', primary_key=True,
        verbose_name='User'
    )
    bio = models.TextField(null=True, blank=True, verbose_name='Bio/Deskripsi')
    no_hp_pribadi = models.CharField(max_length=50, null=True, blank=True, verbose_name='No HP Pribadi')
    alamat_domisili = models.TextField(null=True, blank=True, verbose_name='Alamat Domisili')
    nik = models.CharField(max_length=20, null=True, blank=True, verbose_name='NIK (KTP)')
    agama = models.CharField(max_length=50, null=True, blank=True, verbose_name='Agama')
    pendidikan_terakhir = models.CharField(max_length=100, null=True, blank=True, verbose_name='Pendidikan Terakhir')
    media_sosial = models.JSONField(null=True, blank=True, default=dict, verbose_name='Media Sosial')
    preferensi = models.JSONField(null=True, blank=True, default=dict, verbose_name='Preferensi')
    is_public = models.BooleanField(default=False, verbose_name='Profil Publik')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Dibuat')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Diperbarui')

    class Meta:
        app_label = 'accounts'
        db_table = 'user_profiles'
        verbose_name = 'Profil User'
        verbose_name_plural = 'Profil User'

    def __str__(self):
        return f'Profil {self.user.name or self.user.username}'


class User(AbstractBaseUser):
    """
    Custom User model - sesuai struktur users table
    
    Struktur Laravel:
    - id (auto)
    - id_pegawai (integer)
    - user_id_opd (integer, nullable)
    - name (string 191)
    - email (string 191, unique) → Di Django jadi username (bisa email/NIP/custom)
    - email_verified_at (timestamp, nullable)
    - password (string 191)
    - image (string 150)
    - remember_token
    - id_status (integer, default 1)
    - created_at, updated_at
    
    CATATAN:
    - username field digunakan untuk login
    - username bisa berisi: Email, NIP, atau Username custom
    - email field jadi optional (tidak wajib)
    - Role/permission management menggunakan sistem custom
    """
    
    # Laravel: name field (CharField 191)
    name = models.CharField(
        'name',
        max_length=191,
        help_text='Nama lengkap user (match Laravel)'
    )
    
    # Laravel: email unique (nullable)
    email = models.EmailField(
        'email',
        max_length=191,
        unique=True,
        null=True,
        blank=True,
        help_text='Email user (unique, nullable, match Laravel)'
    )
    
    # Username untuk login (bisa email atau NIP)
    username = models.CharField(
        'username',
        max_length=150,
        unique=True,
        help_text='Username untuk login (bisa berisi email, NIP, atau custom username)'
    )
    
    is_active = models.BooleanField(
        'active',
        default=True,
        help_text='Designates whether this user should be treated as active.'
    )
    
    date_joined = models.DateTimeField('date joined', default=timezone.now)
    
    # Foreign key to pegawai (match Laravel)
    id_pegawai = models.IntegerField(
        null=True, 
        blank=True,
        help_text='FK ke ms_pegawai (match Laravel)'
    )
    
    # OPD user ID (match Laravel)
    user_id_opd = models.IntegerField(
        null=True, 
        blank=True,
        help_text='ID OPD user (nullable)'
    )
    
    
    # Laravel: image field (match Laravel - string 150)
    image = models.CharField(
        max_length=150,
        default='',
        help_text='Path to profile image'
    )
    
    # email_verified_at already handled by AbstractUser's email field
    # remember_token handled by Django session framework
    # password already in AbstractUser
    # created_at, updated_at will be added via date_joined and custom field
    
    updated_at = models.DateTimeField(auto_now=True)
    
    # Django compatibility: groups and permissions
    # Add these for compatibility with Django admin and permission system
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="user_set",
        related_query_name="user",
    )
    
    # Required for authentication
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name']  # Fields required when creating superuser (besides username & password) - email optional
    
    objects = CustomUserManager()
    
    class Meta:
        app_label = 'accounts'
        db_table = 'users'  # Match Laravel table name
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.name if self.name else self.username
    
    @property
    def pegawai(self):
        """Get related pegawai data from ESIMPEG sync"""
        if self.id_pegawai:
            try:
                from apps.api_simpeg.models import Pegawai
                return Pegawai.objects.get(id_pegawai=self.id_pegawai)
            except Exception:
                return None
        return None
    
    def get_full_name(self):
        """Override to return name"""
        return self.name
    
    def get_short_name(self):
        """Override to return name or username"""
        return self.name or self.username
    
    def has_perm(self, perm, obj=None):
        """
        Override has_perm - permission di-handle oleh custom system
        """
        return self.is_active
    
    def has_module_perms(self, app_label):
        """
        Override has_module_perms - permission di-handle oleh custom system
        """
        return self.is_active
    
    @property
    def is_staff(self):
        """
        Property untuk kompatibilitas dengan Django Admin
        Admin users (berdasarkan role atau username) mendapat akses staff
        """
        # Check if user has admin role or specific username
        if hasattr(self, 'role') and self.role:
            # If role name contains 'admin' or 'superadmin'
            if 'admin' in self.role.name.lower() or 'superadmin' in self.role.name.lower():
                return True
        
        # Check specific admin usernames/emails
        admin_identifiers = ['admin', 'superadmin', 'Prakom@admin2025.com']
        if self.username in admin_identifiers or self.email in admin_identifiers:
            return True
            
        return False
    
    @property
    def is_superuser(self):
        """
        Property untuk kompatibilitas dengan permission system
        Superuser mendapat akses penuh tanpa permission check
        """
        # Check if user has superadmin role
        if hasattr(self, 'role') and self.role:
            if 'superadmin' in self.role.name.lower():
                return True
        
        # Check specific superadmin usernames/emails
        superadmin_identifiers = ['superadmin', 'Prakom@admin2025.com']
        if self.username in superadmin_identifiers or self.email in superadmin_identifiers:
            return True
        
        return False
        
        # Option 3: Check custom field atau id_status
        # return self.id_status == 99  # contoh
