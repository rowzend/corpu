from rest_framework import permissions
from apps.manajemen.helpers import check_permission


class LearningPermission(permissions.BasePermission):
    PERMISSION_MAP = {
        'course': {
            'list': ('learning', 'courses', 'view'),
            'retrieve': ('learning', 'courses', 'view'),
            'create': ('learning', 'courses', 'create'),
            'update': ('learning', 'courses', 'edit'),
            'partial_update': ('learning', 'courses', 'edit'),
            'destroy': ('learning', 'courses', 'delete'),
            'enroll': ('learning', 'courses', 'enroll'),
            'my_courses': ('learning', 'courses', 'view'),
            'my_teaching': ('learning', 'courses', 'view'),
            'featured': ('learning', 'courses', 'view'),
            'popular': ('learning', 'courses', 'view'),
            'progress': ('learning', 'courses', 'view'),
            'like': ('learning', 'courses', 'view'),
            'dislike': ('learning', 'courses', 'view'),
        },
        'module': {
            'list': ('learning', 'modules', 'view'),
            'retrieve': ('learning', 'modules', 'view'),
            'create': ('learning', 'modules', 'create'),
            'update': ('learning', 'modules', 'edit'),
            'partial_update': ('learning', 'modules', 'edit'),
            'destroy': ('learning', 'modules', 'delete'),
        },
        'lesson': {
            'list': ('learning', 'lessons', 'view'),
            'retrieve': ('learning', 'lessons', 'view'),
            'create': ('learning', 'lessons', 'create'),
            'update': ('learning', 'lessons', 'edit'),
            'partial_update': ('learning', 'lessons', 'edit'),
            'destroy': ('learning', 'lessons', 'delete'),
            'save_timer': ('learning', 'lessons', 'view'),
            'bypass_timer': ('learning', 'lessons', 'timer_bypass'),
        },
        'lesson_progress': {
            'list': ('learning', 'lesson_progress', 'view'),
            'retrieve': ('learning', 'lesson_progress', 'view'),
            'create': ('learning', 'lesson_progress', 'create'),
            'update': ('learning', 'lesson_progress', 'edit'),
            'partial_update': ('learning', 'lesson_progress', 'edit'),
            'destroy': ('learning', 'lesson_progress', 'delete'),
        },
        'enrollment': {
            'list': ('learning', 'enrollments', 'view'),
            'retrieve': ('learning', 'enrollments', 'view'),
            'create': ('learning', 'enrollments', 'create'),
            'update': ('learning', 'enrollments', 'edit'),
            'partial_update': ('learning', 'enrollments', 'edit'),
            'destroy': ('learning', 'enrollments', 'delete'),
        },
        'quiz': {
            'list': ('learning', 'quizzes', 'view'),
            'retrieve': ('learning', 'quizzes', 'view'),
            'create': ('learning', 'quizzes', 'create'),
            'update': ('learning', 'quizzes', 'edit'),
            'partial_update': ('learning', 'quizzes', 'edit'),
            'destroy': ('learning', 'quizzes', 'delete'),
            'attempt': ('learning', 'quizzes', 'attempt'),
            'my_attempts': ('learning', 'quizzes', 'view'),
            'stats': ('learning', 'quizzes', 'view'),
        },
        'certificate': {
            'list': ('learning', 'certificates', 'view'),
            'retrieve': ('learning', 'certificates', 'view'),
        },
        'rating': {
            'list': ('learning', 'ratings', 'view'),
            'retrieve': ('learning', 'ratings', 'view'),
            'create': ('learning', 'ratings', 'create'),
            'update': ('learning', 'ratings', 'edit'),
            'partial_update': ('learning', 'ratings', 'edit'),
            'destroy': ('learning', 'ratings', 'delete'),
        },
        'comment': {
            'list': ('learning', 'comments', 'view'),
            'retrieve': ('learning', 'comments', 'view'),
            'create': ('learning', 'comments', 'create'),
            'update': ('learning', 'comments', 'edit'),
            'partial_update': ('learning', 'comments', 'edit'),
            'destroy': ('learning', 'comments', 'delete'),
            'reply': ('learning', 'comments', 'create'),
            'like': ('learning', 'comments', 'edit'),
            'dislike': ('learning', 'comments', 'edit'),
        },
    }

    def _get_resource_name(self, view):
        basename = getattr(view, 'basename', None)
        if basename:
            resource_map = {
                'course': 'course', 'module': 'module', 'lesson': 'lesson',
                'enrollment': 'enrollment', 'lesson_progress': 'lesson_progress',
                'quiz': 'quiz', 'certificate': 'certificate',
                'rating': 'rating', 'comment': 'comment',
            }
            return resource_map.get(basename, None)
        return None

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        resource = self._get_resource_name(view)
        if resource and resource in self.PERMISSION_MAP:
            action = getattr(view, 'action', None)
            if action and action in self.PERMISSION_MAP[resource]:
                perm = self.PERMISSION_MAP[resource][action]
                if check_permission(request.user, perm[0], perm[1], perm[2]):
                    return True
                if resource in ['course', 'lesson', 'quiz'] and action in ['create', 'update', 'partial_update', 'destroy']:
                    return True
                return False
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsEnrolled(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'module') and hasattr(obj.module, 'course'):
            course = obj.module.course
            from .models import Enrollment
            return Enrollment.objects.filter(
                course=course,
                user=request.user,
                status__in=['active', 'completed']
            ).exists()
        return False


class IsInstructor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user
        return False
