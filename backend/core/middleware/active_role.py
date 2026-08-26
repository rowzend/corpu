"""
Active role middleware
Scope permission checks to the role currently selected by the user
(active_group_id cookie/header). When set, check_permission only
considers that role - no superadmin override, no union of all groups.
"""


class ActiveRoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from apps.manajemen.helpers import set_active_group_id, clear_active_group_id
        group_id = None
        raw = request.headers.get('X-Active-Group-Id') or request.COOKIES.get('active_group_id')
        if raw:
            try:
                group_id = int(raw)
            except (TypeError, ValueError):
                group_id = None
        set_active_group_id(group_id)
        try:
            return self.get_response(request)
        finally:
            clear_active_group_id()
