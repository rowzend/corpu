from django.db import migrations


def seed_default_prioritas(apps, schema_editor):
    PrioritasPengembangan = apps.get_model('idp', 'PrioritasPengembangan')
    defaults = [
        {'tingkat_prioritas': 'Sangat Tinggi'},
        {'tingkat_prioritas': 'Tinggi'},
        {'tingkat_prioritas': 'Sedang'},
        {'tingkat_prioritas': 'Rendah'},
    ]
    for item in defaults:
        PrioritasPengembangan.objects.get_or_create(
            tingkat_prioritas=item['tingkat_prioritas'],
            defaults=item
        )


def reverse_seed_default_prioritas(apps, schema_editor):
    PrioritasPengembangan = apps.get_model('idp', 'PrioritasPengembangan')
    PrioritasPengembangan.objects.filter(
        tingkat_prioritas__in=['Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0008_prioritas_pengembangan_revert'),
    ]

    operations = [
        migrations.RunPython(
            seed_default_prioritas,
            reverse_seed_default_prioritas,
        ),
    ]