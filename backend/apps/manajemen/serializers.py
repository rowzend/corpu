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
    MenuItem,
    AppSettings
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'email', 'image',
            'is_active', 'date_joined', 'updated_at',
            'id_pegawai', 'user_id_opd', 'role'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at']
    
    def get_role(self, obj):
        """Get user's primary role (first group)"""
        group = obj.groups.first()
        return group.name if group else None


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new user"""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'name', 'email', 'password', 'password_confirm',
            'image', 'is_active', 'id_pegawai', 'user_id_opd', 'role_id'
        ]
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role_id = validated_data.pop('role_id', None)
        
        user = User.objects.create_user(**validated_data)
        
        # Assign role if provided
        if role_id:
            try:
                group = Group.objects.get(id=role_id)
                user.groups.add(group)
            except Group.DoesNotExist:
                pass
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user"""
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    role_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'name', 'email', 'image', 'is_active',
            'id_pegawai', 'user_id_opd', 'password', 'role_id'
        ]
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        role_id = validated_data.pop('role_id', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update role if provided
        if role_id is not None:
            instance.groups.clear()
            try:
                group = Group.objects.get(id=role_id)
                instance.groups.add(group)
            except Group.DoesNotExist:
                pass
        
        return instance


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role (Group) model"""
    user_count = serializers.SerializerMethodField()
    permission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'user_count', 'permission_count']
    
    def get_user_count(self, obj):
        return obj.user_set.count()
    
    def get_permission_count(self, obj):
        return obj.permission_rules.count()


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
