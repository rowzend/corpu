"""
Knowledge Base Permissions
Custom permission classes for DRF API
"""
from rest_framework import permissions
from apps.manajemen.helpers import check_permission


class KnowledgeBasePermission(permissions.BasePermission):
    """
    Custom permission class for Knowledge Base API
    Checks granular permissions based on module.control.function
    """
    
    # Permission mapping for different actions
    PERMISSION_MAP = {
        # Articles
        'articles': {
            'list': ('knowledge', 'knowledge_article', 'view'),
            'retrieve': ('knowledge', 'knowledge_article', 'view'),
            'create': ('knowledge', 'knowledge_article', 'create'),
            'update': ('knowledge', 'knowledge_article', 'edit'),
            'partial_update': ('knowledge', 'knowledge_article', 'edit'),
            'destroy': ('knowledge', 'knowledge_article', 'delete'),
            'submit_for_approval': ('knowledge', 'knowledge_article', 'create'),
            'approve': ('knowledge', 'knowledge_article', 'edit'),
            'reject': ('knowledge', 'knowledge_article', 'edit'),
            'publish': ('knowledge', 'knowledge_article', 'publish'),
            'pending_approval': ('knowledge', 'knowledge_article', 'view'),
            'my_articles': ('knowledge', 'knowledge_article', 'view'),
        },
        
        # Categories
        'categories': {
            'list': ('knowledge', 'knowledge_category', 'view'),
            'retrieve': ('knowledge', 'knowledge_category', 'view'),
            'create': ('knowledge', 'knowledge_category', 'create'),
            'update': ('knowledge', 'knowledge_category', 'edit'),
            'partial_update': ('knowledge', 'knowledge_category', 'edit'),
            'destroy': ('knowledge', 'knowledge_category', 'delete'),
        },
        
        # Tags
        'tags': {
            'list': ('knowledge', 'knowledge_tag', 'view'),
            'retrieve': ('knowledge', 'knowledge_tag', 'view'),
            'create': ('knowledge', 'knowledge_tag', 'create'),
            'update': ('knowledge', 'knowledge_tag', 'edit'),
            'partial_update': ('knowledge', 'knowledge_tag', 'edit'),
            'destroy': ('knowledge', 'knowledge_tag', 'delete'),
        },
        
        # Comments
        'comments': {
            'list': ('knowledge', 'knowledge_comment', 'view'),
            'retrieve': ('knowledge', 'knowledge_comment', 'view'),
            'create': ('knowledge', 'knowledge_comment', 'create'),
            'update': ('knowledge', 'knowledge_comment', 'edit'),
            'partial_update': ('knowledge', 'knowledge_comment', 'edit'),
            'destroy': ('knowledge', 'knowledge_comment', 'delete'),
        },
        
        # Ratings
        'ratings': {
            'list': ('knowledge', 'knowledge_rating', 'view'),
            'retrieve': ('knowledge', 'knowledge_rating', 'view'),
            'create': ('knowledge', 'knowledge_rating', 'create'),
            'update': ('knowledge', 'knowledge_rating', 'edit'),
            'partial_update': ('knowledge', 'knowledge_rating', 'edit'),
            'destroy': ('knowledge', 'knowledge_rating', 'delete'),
        },
    }
    
    def has_permission(self, request, view):
        """
        Check if user has permission for the requested action
        """
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"=== PERMISSION CHECK START ===")
        logger.info(f"User: {request.user}")
        logger.info(f"Authenticated: {request.user.is_authenticated}")
        logger.info(f"Basename: {getattr(view, 'basename', None)}")
        logger.info(f"Action: {getattr(view, 'action', None)}")
        
        # Allow unauthenticated users for read-only actions on public endpoints
        if not request.user.is_authenticated:
            logger.info("User not authenticated, checking public access")
            # Public read access for articles, categories, tags
            if view.basename in ['article', 'category', 'tag'] and view.action in ['list', 'retrieve']:
                logger.info("Public read access granted")
                return True
            # Public read access for comments (viewing only)
            if view.basename == 'comment' and view.action in ['list', 'retrieve']:
                return True
            # Public access for article interactions (like checking user action)
            if view.basename == 'article' and view.action in ['user_action', 'who_liked', 'who_disliked', 'share']:
                return True
            logger.info("Public access denied")
            return False
        
        # Get permission mapping for this viewset
        viewset_name = getattr(view, 'basename', None)
        if not viewset_name:
            return False
        
        # Map basename to permission key
        permission_key_map = {
            'article': 'articles',
            'category': 'categories', 
            'tag': 'tags',
            'comment': 'comments',
            'rating': 'ratings',
            'articlelike': 'articles',
            'commentlike': 'comments',
        }
        
        permission_key = permission_key_map.get(viewset_name)
        if not permission_key:
            return False
        
        # Get action
        action = view.action
        if not action:
            return False
        
        # Get permission tuple for this action
        permission_map = self.PERMISSION_MAP.get(permission_key, {})
        permission_tuple = permission_map.get(action)
        
        if not permission_tuple:
            # Default to view permission for unknown actions
            permission_tuple = permission_map.get('list') or permission_map.get('retrieve')
        
        if not permission_tuple:
            return False
        
        module, control, function = permission_tuple

        # Check granular permission from RoleRule (module.control.function)
        logger.info(f"Checking permission: {module}.{control}.{function}")
        return check_permission(request.user, module, control, function)
    
    def has_object_permission(self, request, view, obj):
        """
        Check object-level permissions
        """
        # Allow unauthenticated users for read-only access
        if not request.user.is_authenticated:
            if view.action in ['retrieve', 'user_action', 'who_liked', 'who_disliked']:
                return True
            return False
        
        # For articles: author can edit their own articles
        if hasattr(obj, 'author') and view.action in ['update', 'partial_update', 'destroy']:
            if obj.author == request.user:
                return True
        
        # For comments: author can edit their own comments
        if hasattr(obj, 'user') and view.action in ['update', 'partial_update', 'destroy']:
            if obj.user == request.user:
                return True
        
        # Staff can delete any comment
        if hasattr(obj, 'user') and view.action == 'destroy' and view.basename == 'comment':
            if check_permission(request.user, 'knowledge', 'knowledge_comment', 'delete'):
                return True
        
        # Check general permission
        return self.has_permission(request, view)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        if hasattr(obj, 'author'):
            return obj.author == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow staff to edit.
    """
    
    def has_permission(self, request, view):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions - check granular permission
        if not request.user.is_authenticated:
            return False
        
        # Check if user has any write permission for knowledge base
        return check_permission(request.user, 'knowledge', 'knowledge_article', 'create')


class ApprovalPermission(permissions.BasePermission):
    """
    Permission for approval actions (approve/reject)
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if user has approval permission
        if view.action in ['approve', 'reject']:
            return check_permission(request.user, 'knowledge', 'knowledge_article', 'approve')
        
        return True