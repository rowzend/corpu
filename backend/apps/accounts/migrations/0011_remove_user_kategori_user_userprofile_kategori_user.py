# Generated manually - move kategori_user from User to UserProfile

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_userprofile_instansi_userprofile_jenis_kelamin_and_more'),
        ('referensi', '0005_mskategoriuser'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='kategori_user',
        ),
        migrations.AddField(
            model_name='userprofile',
            name='kategori_user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='referensi.mskategoriuser', verbose_name='Kategori User'),
        ),
    ]
