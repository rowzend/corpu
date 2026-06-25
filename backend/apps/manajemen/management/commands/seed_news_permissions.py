from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth.models import Group
from apps.manajemen.models import (
    PermissionModule, PermissionControl,
    PermissionFunction, PermissionRule, RoleRule,
)

MODULE_NAME = 'berita'
MODULE_LABEL = 'Berita'
MODULE_ICON = 'fas fa-newspaper'
MODULE_ORDER = 11

CONTROLS = [
    ('news_article', 'Artikel Berita'),
    ('news_category', 'Kategori Berita'),
]

FUNCTIONS = [
    ('view', 'Lihat'),
    ('create', 'Tambah'),
    ('edit', 'Ubah'),
    ('delete', 'Hapus'),
    ('publish', 'Publish'),
    ('unpublish', 'Unpublish'),
]


class Command(BaseCommand):
    help = 'Seed permissions for Berita (News) module'

    def handle(self, *args, **options):
        module, _ = PermissionModule.objects.get_or_create(
            nama_module=MODULE_NAME,
            defaults={
                'label_module': MODULE_LABEL,
                'icon': MODULE_ICON,
                'order': MODULE_ORDER,
                'is_active': True,
            },
        )

        control_objs = {}
        for name, label in CONTROLS:
            ctrl, _ = PermissionControl.objects.get_or_create(
                nama_kontrol=name,
                defaults={'label_kontrol': label},
            )
            control_objs[name] = ctrl

        func_objs = {}
        for name, label in FUNCTIONS:
            func, _ = PermissionFunction.objects.get_or_create(
                nama_fungsi=name,
                defaults={'label_fungsi': label},
            )
            func_objs[name] = func

        created_rules = 0
        for ctrl_name, ctrl in control_objs.items():
            for func_name, func in func_objs.items():
                _, created = PermissionRule.objects.get_or_create(
                    module=module,
                    control=ctrl,
                    function=func,
                    defaults={'is_active': True},
                )
                created_rules += int(created)
        self.stdout.write(f'  Rules created (new): {created_rules}')

        group_names = getattr(settings, 'SUPERADMIN_GROUPS', ['Super Admin'])
        if not isinstance(group_names, (list, tuple)):
            group_names = [str(group_names)]
        rules = PermissionRule.objects.filter(module=module, is_active=True)
        assigned = 0
        for gname in group_names:
            grp, _ = Group.objects.get_or_create(name=gname)
            for rule in rules:
                _, created = RoleRule.objects.get_or_create(role=grp, rule=rule)
                assigned += int(created)
        self.stdout.write(f'  Role assignments (new): {assigned}')

        self.stdout.write(self.style.SUCCESS('Berita permission seeding completed'))
