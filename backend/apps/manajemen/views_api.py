"""
Management API Views
Provides REST API endpoints for user, role, and permission management
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import Group
from django.db.models import Q, Count
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
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    RoleSerializer,
    PermissionFunctionSerializer,
    PermissionControlSerializer,
    PermissionModuleSerializer,
    PermissionRuleSerializer,
    RoleRuleSerializer,
    MenuItemSerializer,
    AppSettingsSerializer
)


# ============================================
# USER MANAGEMENT
# ============================================

class UserListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/users/
    List all users with pagination and search
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all().prefetch_related('groups')
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Filter by role(s)
        role_id = self.request.query_params.get('role_id', None)
        if role_id:
            queryset = queryset.filter(groups__id=role_id)
        
        # Filter by multiple role IDs (comma-separated)
        role_ids = self.request.query_params.get('role_ids', None)
        if role_ids:
            ids = [int(r) for r in role_ids.split(',') if r.strip().isdigit()]
            if ids:
                queryset = queryset.filter(groups__id__in=ids)
        
        # Filter by status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.distinct()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        users = queryset[start:end]
        
        serializer = self.get_serializer(users, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'total_pages': (total + page_size - 1) // page_size
            }
        })


class UserDetailAPIView(generics.RetrieveAPIView):
    """
    GET /apicorpu/1.0/users/{id}/
    Get user detail by ID
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class UserCreateAPIView(generics.CreateAPIView):
    """
    POST /apicorpu/1.0/users/
    Create new user
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserCreateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'success': True,
            'message': 'User created successfully',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class UserUpdateAPIView(generics.UpdateAPIView):
    """
    PUT /apicorpu/1.0/users/{id}/
    Update user
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserUpdateSerializer
    queryset = User.objects.all()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'success': True,
            'message': 'User updated successfully',
            'data': UserSerializer(user).data
        })


class UserDeleteAPIView(generics.DestroyAPIView):
    """
    DELETE /apicorpu/1.0/users/{id}/
    Delete user
    """
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        username = instance.username
        instance.delete()
        
        return Response({
            'success': True,
            'message': f'User {username} deleted successfully'
        })


# ============================================
# ROLE MANAGEMENT
# ============================================

class RoleListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/roles/
    List all roles
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RoleSerializer
    queryset = Group.objects.all().annotate(
        user_count=Count('user'),
        permission_count=Count('permission_rules')
    )
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'total': queryset.count()
        })


class RoleDetailAPIView(generics.RetrieveAPIView):
    """
    GET /apicorpu/1.0/roles/{id}/
    Get role detail with permissions
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RoleSerializer
    queryset = Group.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get role permissions
        role_rules = RoleRule.objects.filter(role=instance).select_related(
            'rule__module', 'rule__control', 'rule__function'
        )
        permissions = RoleRuleSerializer(role_rules, many=True).data
        
        data = serializer.data
        data['permissions'] = permissions
        
        return Response({
            'success': True,
            'data': data
        })


class RoleCreateAPIView(generics.CreateAPIView):
    """
    POST /apicorpu/1.0/roles/
    Create new role
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RoleSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Role created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


class RoleUpdateAPIView(generics.UpdateAPIView):
    """
    PUT /apicorpu/1.0/roles/{id}/
    Update role
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RoleSerializer
    queryset = Group.objects.all()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Role updated successfully',
            'data': serializer.data
        })


class RoleDeleteAPIView(generics.DestroyAPIView):
    """
    DELETE /apicorpu/1.0/roles/{id}/
    Delete role
    """
    permission_classes = [IsAuthenticated]
    queryset = Group.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        role_name = instance.name
        instance.delete()
        
        return Response({
            'success': True,
            'message': f'Role {role_name} deleted successfully'
        })


# ============================================
# PERMISSION MANAGEMENT
# ============================================

class PermissionModuleListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/permissions/modules/
    List all permission modules
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PermissionModuleSerializer
    queryset = PermissionModule.objects.filter(is_active=True)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class PermissionRuleListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/permissions/rules/
    List all permission rules
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PermissionRuleSerializer
    
    def get_queryset(self):
        queryset = PermissionRule.objects.filter(is_active=True).select_related(
            'module', 'control', 'function'
        )
        
        # Filter by module
        module_id = self.request.query_params.get('module_id', None)
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class RolePermissionUpdateAPIView(APIView):
    """
    POST /apicorpu/1.0/roles/{id}/permissions/
    Update role permissions
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            role = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Role not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        permission_ids = request.data.get('permission_ids', [])
        
        # Clear existing permissions
        RoleRule.objects.filter(role=role).delete()
        
        # Add new permissions
        for rule_id in permission_ids:
            try:
                rule = PermissionRule.objects.get(id=rule_id)
                RoleRule.objects.create(role=role, rule=rule)
            except PermissionRule.DoesNotExist:
                pass
        
        return Response({
            'success': True,
            'message': f'Permissions updated for role {role.name}',
            'total_permissions': len(permission_ids)
        })


# ============================================
# MENU MANAGEMENT
# ============================================

class MenuListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/menu/
    Get menu structure for current user
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MenuItemSerializer
    
    def get_queryset(self):
        # Get root menu items (no parent)
        return MenuItem.objects.filter(
            parent__isnull=True,
            is_active=True
        ).order_by('category', 'order')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


# ============================================
# APP SETTINGS
# ============================================

class AppSettingsListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/settings/
    Get app settings (public only for non-admin)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AppSettingsSerializer
    
    def get_queryset(self):
        # TODO: Check if user is admin
        # For now, return only public settings
        return AppSettings.objects.filter(is_public=True)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Return full array with metadata instead of just key-value dict
        # This allows frontend to access description, category, etc.
        return Response({
            'success': True,
            'data': serializer.data,
            'count': queryset.count()
        })


class AppSettingsUpdateAPIView(APIView):
    """
    PUT /apicorpu/1.0/settings/{key}/
    Update app setting
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, key):
        try:
            setting = AppSettings.objects.get(key=key)
        except AppSettings.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Setting not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        value = request.data.get('value')
        if value is not None:
            setting.value = str(value)
            setting.save()
        
        serializer = AppSettingsSerializer(setting)
        
        return Response({
            'success': True,
            'message': 'Setting updated successfully',
            'data': serializer.data
        })


class UserPermissionsAPIView(APIView):
    """
    GET /apicorpu/1.0/permissions/user/
    Get current user's permissions
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Superadmin bypass: return all active modules if override enabled
        from apps.manajemen.helpers import is_superadmin
        from django.conf import settings
        if getattr(settings, 'PERMISSIONS_SUPERADMIN_OVERRIDE', False) and is_superadmin(user):
            all_modules = PermissionModule.objects.filter(is_active=True)
            all_permissions = []
            modules = set()
            for module in all_modules:
                modules.add(module.nama_module)
                rules = PermissionRule.objects.filter(
                    module=module, is_active=True
                ).select_related('module', 'control', 'function')
                for rule in rules:
                    all_permissions.append({
                        'module': rule.module.nama_module,
                        'function': rule.function.nama_fungsi,
                        'control': rule.control.nama_kontrol,
                        'permission_string': f"{rule.module.nama_module}.{rule.function.nama_fungsi}.{rule.control.nama_kontrol}"
                    })
            return Response({
                'success': True,
                'data': {
                    'user': {
                        'groups': ['Super Admin']
                    },
                    'modules': list(modules),
                    'permissions': all_permissions,
                    'is_superadmin': True
                }
            })

        # Non-superadmin: check all user groups
        try:
            user_groups = user.groups.all()
            group_names = [g.name for g in user_groups]

            rules = RoleRule.objects.filter(
                role__in=user_groups
            ).select_related(
                'rule__module',
                'rule__function',
                'rule__control'
            )

            seen = set()
            all_permissions = []
            modules = set()
            for rule in rules:
                perm = rule.rule
                if perm and perm.is_active:
                    perm_key = f"{perm.module.nama_module}.{perm.function.nama_fungsi}.{perm.control.nama_kontrol}"
                    if perm_key not in seen:
                        seen.add(perm_key)
                        modules.add(perm.module.nama_module)
                        all_permissions.append({
                            'module': perm.module.nama_module,
                            'function': perm.function.nama_fungsi,
                            'control': perm.control.nama_kontrol,
                            'permission_string': perm_key
                        })

            return Response({
                'success': True,
                'data': {
                    'user': {
                        'groups': group_names
                    },
                    'modules': list(modules),
                    'permissions': all_permissions,
                    'is_superadmin': False
                }
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicSettingsListAPIView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = AppSettingsSerializer

    def get_queryset(self):
        return AppSettings.objects.filter(is_public=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = {item['key']: item['value'] for item in serializer.data}
        return Response({
            'success': True,
            'data': data
        })
