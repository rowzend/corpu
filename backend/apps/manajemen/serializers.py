"""
Management API Serializers
"""
from rest_framework import serializers
from django.contrib.auth.models import Group
from apps.accounts.models import User
from .models import (
    PermissionFunction,
    PermissionControl,
    PermissionModule,
    PermissionRule,
    RoleRule,
    GroupProfile,
    MenuItem,
    MenuCategory,
    ApiDocumentation,
    AppSettings
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    roles = serializers.SerializerMethodField()
    kategori_user_nama = serializers.CharField(source='kategori_user.nama', read_only=True, default=None)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'image',
            'is_active', 'date_joined', 'last_login', 'updated_at',
            'id_pegawai', 'user_id_opd', 'roles',
            'kategori_user', 'kategori_user_nama',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'updated_at']
    
    def get_roles(self, obj):
        """Get all user roles/groups"""
        return [{'id': g.id, 'name': g.name} for g in obj.groups.all()]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new user"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role_id = serializers.IntegerField(write_only=True, required=False)
    role_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'name', 'email', 'password', 'password_confirm',
            'image', 'is_active', 'id_pegawai', 'user_id_opd', 'role_id', 'role_ids',
            'kategori_user',
        ]
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role_id = validated_data.pop('role_id', None)
        role_ids = validated_data.pop('role_ids', None)
        
        user = User.objects.create_user(**validated_data)
        
        # Collect all role IDs from both fields
        all_ids = []
        if role_id:
            all_ids.append(role_id)
        if role_ids:
            all_ids.extend(role_ids)
        
        if all_ids:
            groups = Group.objects.filter(id__in=all_ids)
            user.groups.add(*groups)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user"""
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    role_id = serializers.IntegerField(write_only=True, required=False)
    role_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'name', 'email', 'image', 'is_active',
            'id_pegawai', 'user_id_opd', 'password', 'role_id', 'role_ids',
            'kategori_user',
        ]
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        role_id = validated_data.pop('role_id', None)
        role_ids = validated_data.pop('role_ids', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Collect all role IDs from both fields
        all_ids = []
        if role_id:
            all_ids.append(role_id)
        if role_ids:
            all_ids.extend(role_ids)
        
        # Update roles if provided
        if all_ids:
            groups = Group.objects.filter(id__in=all_ids)
            instance.groups.set(groups)
        
        return instance


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role (Group) model"""
    user_count = serializers.SerializerMethodField()
    permission_count = serializers.SerializerMethodField()
    redirect_url = serializers.SerializerMethodField()
    redirect_url_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'user_count', 'permission_count', 'redirect_url', 'redirect_url_input']
    
    def get_user_count(self, obj):
        return obj.user_set.count()
    
    def get_permission_count(self, obj):
        return obj.permission_rules.count()
    
    def get_redirect_url(self, obj):
        try:
            return obj.profile.redirect_url
        except GroupProfile.DoesNotExist:
            return '/admin/dashboard'
    
    def create(self, validated_data):
        redirect_url = validated_data.pop('redirect_url_input', None)
        group = Group.objects.create(**validated_data)
        if redirect_url is not None:
            GroupProfile.objects.update_or_create(
                group=group,
                defaults={'redirect_url': redirect_url or '/admin/dashboard'}
            )
        return group
    
    def update(self, instance, validated_data):
        redirect_url = validated_data.pop('redirect_url_input', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if redirect_url is not None:
            GroupProfile.objects.update_or_create(
                group=instance,
                defaults={'redirect_url': redirect_url or '/admin/dashboard'}
            )
        return instance


class PermissionFunctionSerializer(serializers.ModelSerializer):
    """Serializer for Permission Function"""
    class Meta:
        model = PermissionFunction
        fields = '__all__'


class PermissionControlSerializer(serializers.ModelSerializer):
    """Serializer for Permission Control"""
    class Meta:
        model = PermissionControl
        fields = '__all__'


class PermissionModuleSerializer(serializers.ModelSerializer):
    """Serializer for Permission Module"""

    class Meta:
        model = PermissionModule
        fields = '__all__'


class PermissionModuleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for permission module list"""
    name = serializers.CharField(source='label_module', read_only=True)
    description = serializers.CharField(source='deskripsi_module', read_only=True)

    class Meta:
        model = PermissionModule
        fields = ['id', 'name', 'description', 'is_active']


class PermissionRuleSerializer(serializers.ModelSerializer):
    """Serializer for Permission Rule"""
    module_name = serializers.CharField(source='module.label_module', read_only=True)
    control_name = serializers.CharField(source='control.label_kontrol', read_only=True)
    function_name = serializers.CharField(source='function.label_fungsi', read_only=True)
    
    class Meta:
        model = PermissionRule
        fields = [
            'id', 'module', 'control', 'function',
            'module_name', 'control_name', 'function_name',
            'permission_string', 'is_active', 'created_at'
        ]


class RoleRuleSerializer(serializers.ModelSerializer):
    """Serializer for Role Rule"""
    role_name = serializers.CharField(source='role.name', read_only=True)
    rule_detail = PermissionRuleSerializer(source='rule', read_only=True)
    
    class Meta:
        model = RoleRule
        fields = ['id', 'role', 'rule', 'role_name', 'rule_detail', 'created_at']


class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer for Menu Item"""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'permission_key', 'url_name', 'external_url',
            'icon', 'type', 'parent', 'order', 'category',
            'is_active', 'children'
        ]
    
    def get_children(self, obj):
        if obj.children.exists():
            return MenuItemSerializer(obj.children.filter(is_active=True), many=True).data
        return []


class MenuCategorySerializer(serializers.ModelSerializer):
    """Serializer for Menu Category"""

    class Meta:
        model = MenuCategory
        fields = '__all__'


class ApiDocumentationSerializer(serializers.ModelSerializer):
    """Serializer for API Documentation"""

    class Meta:
        model = ApiDocumentation
        fields = '__all__'


class AppSettingsSerializer(serializers.ModelSerializer):
    """Serializer for App Settings"""
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = AppSettings
        fields = [
            'id', 'key', 'value', 'typed_value', 'type',
            'category', 'description', 'is_public', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_typed_value(self, obj):
        """Return value with proper type"""
        return obj.get_value()
