# Seed rule permission approve/reject pendaftaran (Opsi A register).
#
# Endpoint RegistrationActionAPIView memakai permission
# ('pengaturan', 'manajemen_user', 'edit') — rule ini TIDAK ADA untuk role
# mana pun (hanya 'view' yang pernah di-seed), sehingga approve/reject selalu
# 403 "Anda tidak memiliki izin".
#
# Strategi: siapa pun yang sudah punya akses VIEW manajemen_user otomatis
# mendapat EDIT-nya juga (di-assign ke role yang sama); bila tak ada role
# sama sekali, fallback ke group 'Super Admin'. Idempoten — aman dijalankan
# berulang atau bila rule sudah ditambal manual di DB.
from django.db import migrations


def seed_manajemen_user_edit_rule(apps, schema_editor):
    PermissionModule = apps.get_model('manajemen_aplikasi', 'PermissionModule')
    PermissionControl = apps.get_model('manajemen_aplikasi', 'PermissionControl')
    PermissionFunction = apps.get_model('manajemen_aplikasi', 'PermissionFunction')
    PermissionRule = apps.get_model('manajemen_aplikasi', 'PermissionRule')
    RoleRule = apps.get_model('manajemen_aplikasi', 'RoleRule')
    Group = apps.get_model('auth', 'Group')

    try:
        module = PermissionModule.objects.get(nama_module='pengaturan')
        control = PermissionControl.objects.get(nama_kontrol='manajemen_user')
    except (PermissionModule.DoesNotExist, PermissionControl.DoesNotExist):
        # Master permission belum terisi (di-seed oleh command terpisah) —
        # dilewati; rule akan menyusul saat master terisi + migrate ulang.
        return

    edit_fn, _ = PermissionFunction.objects.get_or_create(
        nama_fungsi='edit',
        defaults={'label_fungsi': 'Edit'},
    )
    rule, _ = PermissionRule.objects.get_or_create(
        module=module,
        control=control,
        function=edit_fn,
        defaults={'is_active': True},
    )

    # Role yang sudah boleh VIEW manajemen_user → beri EDIT juga
    role_ids = []
    view_fn = PermissionFunction.objects.filter(nama_fungsi='view').first()
    if view_fn:
        view_rule = PermissionRule.objects.filter(
            module=module, control=control, function=view_fn,
        ).first()
        if view_rule:
            role_ids = list(
                RoleRule.objects.filter(rule=view_rule)
                .values_list('role_id', flat=True)
            )

    # Fallback: Super Admin (rule view aslinya memang untuk role ini)
    if not role_ids:
        role_ids = list(
            Group.objects.filter(name='Super Admin')
            .values_list('id', flat=True)
        )

    for role_id in role_ids:
        RoleRule.objects.get_or_create(role_id=role_id, rule=rule)


def unseed_manajemen_user_edit_rule(apps, schema_editor):
    """Hapus rule yang dibuat seed ini — role lain bisa punya rule sendiri."""
    PermissionModule = apps.get_model('manajemen_aplikasi', 'PermissionModule')
    PermissionControl = apps.get_model('manajemen_aplikasi', 'PermissionControl')
    PermissionFunction = apps.get_model('manajemen_aplikasi', 'PermissionFunction')
    PermissionRule = apps.get_model('manajemen_aplikasi', 'PermissionRule')

    module = PermissionModule.objects.filter(nama_module='pengaturan').first()
    control = PermissionControl.objects.filter(nama_kontrol='manajemen_user').first()
    edit_fn = PermissionFunction.objects.filter(nama_fungsi='edit').first()
    if module and control and edit_fn:
        # Hanya hapus bila rule itu TIDAK dipakai role lain di luar seed —
        # pendekatan sederhana: biarkan rule (migrasi ini minor); cukup tandai
        # tidak aktif agar perubahan terbalik dengan aman tanpa memutus role.
        PermissionRule.objects.filter(
            module=module, control=control, function=edit_fn,
        ).update(is_active=False)


class Migration(migrations.Migration):

    dependencies = [
        ('manajemen_aplikasi', '0011_groupprofile'),
    ]

    operations = [
        migrations.RunPython(
            seed_manajemen_user_edit_rule,
            unseed_manajemen_user_edit_rule,
        ),
    ]
