from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0003_idpasn_jabatan_dasar_atau_alasan_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='idpasn',
            name='jabatan_dasar_atau_alasan',
        ),
    ]