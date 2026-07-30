from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_simpeg', '0002_bupati'),
    ]

    operations = [
        migrations.AddField(
            model_name='pegawai',
            name='pas_foto',
            field=models.TextField(blank=True, null=True, verbose_name='Path Foto (ASNCorpu MinIO)'),
        ),
    ]
