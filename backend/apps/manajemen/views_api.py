"""
Management API Views
Provides REST API endpoints for user, role, and permission management
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
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
    MenuCategory,
    ApiDocumentation,
    AppSettings,
    GroupProfile
)
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    RoleSerializer,
    PermissionFunctionSerializer,
    PermissionControlSerializer,
    PermissionModuleSerializer,
    PermissionModuleListSerializer,
    PermissionRuleSerializer,
    RoleRuleSerializer,
    MenuItemSerializer,
    MenuCategorySerializer,
    ApiDocumentationSerializer,
    AppSettingsSerializer
)
from apps.manajemen.helpers import check_permission


def require_permission(module, control, function):
    class HasPermission(BasePermission):
        def has_permission(self, request, view):
            return check_permission(request.user, module, control, function)
    return HasPermission


# ============================================
# USER MANAGEMENT
# ============================================

class UserListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/users/
    List all users with pagination and search
    """
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'manajemen_user', 'view')]
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
        
        # Filter by role
        role_id = self.request.query_params.get('role_id', None)
        if role_id:
            queryset = queryset.filter(groups__id=role_id)
        
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'manajemen_user', 'view')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_user', 'create')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_user', 'edit')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_user', 'delete')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_role', 'view')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_role', 'view')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_role', 'create')]
    serializer_class = RoleSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.save()
        return Response({
            'success': True,
            'message': 'Role created successfully',
            'data': self.get_serializer(role).data
        }, status=status.HTTP_201_CREATED)


class RoleUpdateAPIView(generics.UpdateAPIView):
    """
    PUT /apicorpu/1.0/roles/{id}/
    Update role
    """
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_role', 'edit')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_role', 'delete')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_module', 'view')]
    serializer_class = PermissionModuleListSerializer
    queryset = PermissionModule.objects.all()
    
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_rule', 'view')]
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
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_role', 'edit')]
    
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
        # Get root menu items (no parent) — frontend-only
        return MenuItem.objects.filter(
            parent__isnull=True,
            is_active=True,
            platform='frontend'
        ).order_by('category', 'order')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


# ============================================
# PERMISSION FUNCTION CRUD
# ============================================

class PermissionFunctionListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/management/permissions/functions/
    List all permission functions
    """
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_function', 'view')]
    serializer_class = PermissionFunctionSerializer
    queryset = PermissionFunction.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        search = request.query_params.get('search', None)

        if search:
            queryset = queryset.filter(
                Q(nama_fungsi__icontains=search) |
                Q(label_fungsi__icontains=search) |
                Q(deskripsi_fungsi__icontains=search)
            )

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = queryset[start:end]

        serializer = self.get_serializer(items, many=True)
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


class PermissionFunctionCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_function', 'create')]
    serializer_class = PermissionFunctionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'Function created successfully',
            'data': PermissionFunctionSerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class PermissionFunctionDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_function', 'view')]
    serializer_class = PermissionFunctionSerializer
    queryset = PermissionFunction.objects.all()


class PermissionFunctionUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_function', 'edit')]
    serializer_class = PermissionFunctionSerializer
    queryset = PermissionFunction.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Function updated successfully',
            'data': serializer.data
        })


class PermissionFunctionDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_function', 'delete')]
    queryset = PermissionFunction.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.label_fungsi
        instance.delete()
        return Response({
            'success': True,
            'message': f'Function "{name}" deleted successfully'
        })


# ============================================
# PERMISSION CONTROL CRUD
# ============================================

class PermissionControlListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/management/permissions/controls/
    List all permission controls
    """
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_control', 'view')]
    serializer_class = PermissionControlSerializer
    queryset = PermissionControl.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        search = request.query_params.get('search', None)

        if search:
            queryset = queryset.filter(
                Q(nama_kontrol__icontains=search) |
                Q(label_kontrol__icontains=search) |
                Q(deskripsi_kontrol__icontains=search)
            )

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = queryset[start:end]

        serializer = self.get_serializer(items, many=True)
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


class PermissionControlCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_control', 'create')]
    serializer_class = PermissionControlSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'Control created successfully',
            'data': PermissionControlSerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class PermissionControlDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_control', 'view')]
    serializer_class = PermissionControlSerializer
    queryset = PermissionControl.objects.all()


class PermissionControlUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_control', 'edit')]
    serializer_class = PermissionControlSerializer
    queryset = PermissionControl.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Control updated successfully',
            'data': serializer.data
        })


class PermissionControlDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_control', 'delete')]
    queryset = PermissionControl.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.label_kontrol
        instance.delete()
        return Response({
            'success': True,
            'message': f'Control "{name}" deleted successfully'
        })


# ============================================
# PERMISSION MODULE CRUD
# ============================================

class PermissionModuleCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_module', 'create')]
    serializer_class = PermissionModuleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'Module created successfully',
            'data': PermissionModuleSerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class PermissionModuleUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_module', 'edit')]
    serializer_class = PermissionModuleSerializer
    queryset = PermissionModule.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Module updated successfully',
            'data': serializer.data
        })


class PermissionModuleDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_module', 'delete')]
    queryset = PermissionModule.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.label_module
        instance.delete()
        return Response({
            'success': True,
            'message': f'Module "{name}" deleted successfully'
        })


# ============================================
# PERMISSION RULE CRUD
# ============================================

class PermissionRuleCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_rule', 'create')]
    serializer_class = PermissionRuleSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'Rule created successfully',
            'data': PermissionRuleSerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class PermissionRuleDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_rule', 'view')]
    serializer_class = PermissionRuleSerializer
    queryset = PermissionRule.objects.all()


class PermissionRuleUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_rule', 'edit')]
    serializer_class = PermissionRuleSerializer
    queryset = PermissionRule.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Rule updated successfully',
            'data': serializer.data
        })


class PermissionRuleDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'permission_rule', 'delete')]
    queryset = PermissionRule.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Rule deleted successfully'
        })


# ============================================
# MENU ITEM CRUD
# ============================================

class MenuItemCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'manajemen_menu', 'create')]
    serializer_class = MenuItemSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'Menu item created successfully',
            'data': MenuItemSerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class MenuItemDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'manajemen_menu', 'view')]
    serializer_class = MenuItemSerializer
    queryset = MenuItem.objects.all()


class MenuItemUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'manajemen_menu', 'edit')]
    serializer_class = MenuItemSerializer
    queryset = MenuItem.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Menu item updated successfully',
            'data': serializer.data
        })


class MenuItemDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'manajemen_menu', 'delete')]
    queryset = MenuItem.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        instance.delete()
        return Response({
            'success': True,
            'message': f'Menu item "{name}" deleted successfully'
        })


# ============================================
# MENU CATEGORY CRUD
# ============================================

class MenuCategoryListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/management/menu-categories/
    List all menu categories
    """
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'menu_category', 'view')]
    serializer_class = MenuCategorySerializer
    queryset = MenuCategory.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class MenuCategoryCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'menu_category', 'create')]
    serializer_class = MenuCategorySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'Menu category created successfully',
            'data': MenuCategorySerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class MenuCategoryDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'menu_category', 'view')]
    serializer_class = MenuCategorySerializer
    queryset = MenuCategory.objects.all()


class MenuCategoryUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'menu_category', 'edit')]
    serializer_class = MenuCategorySerializer
    queryset = MenuCategory.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Menu category updated successfully',
            'data': serializer.data
        })


class MenuCategoryDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'menu_category', 'delete')]
    queryset = MenuCategory.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        instance.delete()
        return Response({
            'success': True,
            'message': f'Menu category "{name}" deleted successfully'
        })


# ============================================
# API DOCUMENTATION CRUD
# ============================================

class ApiDocumentationListAPIView(generics.ListAPIView):
    """
    GET /apicorpu/1.0/management/api-documentation/
    List all API documentation entries
    """
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'api_documentation', 'view')]
    serializer_class = ApiDocumentationSerializer
    queryset = ApiDocumentation.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        search = request.query_params.get('search', None)
        method = request.query_params.get('method', None)

        if search:
            queryset = queryset.filter(
                Q(url__icontains=search) |
                Q(description__icontains=search)
            )
        if method:
            queryset = queryset.filter(method_type__iexact=method)

        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        items = queryset[start:end]

        serializer = self.get_serializer(items, many=True)
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


class ApiDocumentationCreateAPIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'api_documentation', 'create')]
    serializer_class = ApiDocumentationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response({
            'success': True,
            'message': 'API documentation created successfully',
            'data': ApiDocumentationSerializer(obj).data
        }, status=status.HTTP_201_CREATED)


class ApiDocumentationDetailAPIView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'api_documentation', 'view')]
    serializer_class = ApiDocumentationSerializer
    queryset = ApiDocumentation.objects.all()


class ApiDocumentationUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'api_documentation', 'edit')]
    serializer_class = ApiDocumentationSerializer
    queryset = ApiDocumentation.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'API documentation updated successfully',
            'data': serializer.data
        })


class ApiDocumentationDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, require_permission('pengaturan', 'api_documentation', 'delete')]
    queryset = ApiDocumentation.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'API documentation deleted successfully'
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

    Query params:
      - group_id: (optional) Filter permissions by specific group ID.
                  When provided, only permissions from that group are returned.
    """
    permission_classes = [IsAuthenticated]

    def serialize_group(self, g):
        """Serialize group with redirect_url from GroupProfile."""
        try:
            redirect_url = g.profile.redirect_url
        except:
            redirect_url = '/admin/dashboard'
        return {'id': g.id, 'name': g.name, 'redirect_url': redirect_url}

    def get(self, request):
        user = request.user
        group_id = request.GET.get('group_id')

        from apps.manajemen.helpers import is_superadmin
        from django.conf import settings

        # Superadmin bypass: return all active modules if override enabled
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
                        'groups': [self.serialize_group(g) for g in user.groups.all()] if not group_id else [self.serialize_group(g) for g in user.groups.filter(id=group_id)]
                    },
                    'modules': list(modules),
                    'permissions': all_permissions,
                    'is_superadmin': True
                }
            })

        # Non-superadmin: check user group permissions
        try:
            all_user_groups = user.groups.all()
            if not all_user_groups:
                return Response({
                    'success': True,
                    'data': {
                        'user': {
                            'groups': []
                        },
                        'modules': [],
                        'permissions': [],
                        'is_superadmin': False
                    }
                })

            # Optionally filter to a specific group (active role)
            if group_id:
                try:
                    groups = all_user_groups.filter(id=group_id)
                except (ValueError, TypeError):
                    groups = all_user_groups
            else:
                groups = all_user_groups

            if not groups:
                return Response({
                    'success': True,
                    'data': {
                        'user': {
                            'groups': [self.serialize_group(g) for g in all_user_groups]
                        },
                        'modules': [],
                        'permissions': [],
                        'is_superadmin': False
                    }
                })

            rules = RoleRule.objects.filter(
                role__in=groups
            ).select_related(
                'rule__module',
                'rule__function',
                'rule__control'
            )

            all_permissions = []
            modules = set()
            for role_rule in rules:
                perm = role_rule.rule
                if perm and perm.is_active:
                    modules.add(perm.module.nama_module)
                    all_permissions.append({
                        'module': perm.module.nama_module,
                        'function': perm.function.nama_fungsi,
                        'control': perm.control.nama_kontrol,
                        'permission_string': f"{perm.module.nama_module}.{perm.function.nama_fungsi}.{perm.control.nama_kontrol}"
                    })

            return Response({
                'success': True,
                'data': {
                    'user': {
                        'groups': [self.serialize_group(g) for g in all_user_groups],
                        'active_group': groups.first().id if groups.count() == 1 else None
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
