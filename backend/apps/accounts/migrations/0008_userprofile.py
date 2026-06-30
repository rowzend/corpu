from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_remove_user_is_esimpeg_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='profile', serialize=False, to='accounts.user', verbose_name='User')),
                ('bio', models.TextField(blank=True, null=True, verbose_name='Bio/Deskripsi')),
                ('no_hp_pribadi', models.CharField(blank=True, max_length=50, null=True, verbose_name='No HP Pribadi')),
                ('alamat_domisili', models.TextField(blank=True, null=True, verbose_name='Alamat Domisili')),
                ('nik', models.CharField(blank=True, max_length=20, null=True, verbose_name='NIK (KTP)')),
                ('agama', models.CharField(blank=True, max_length=50, null=True, verbose_name='Agama')),
                ('pendidikan_terakhir', models.CharField(blank=True, max_length=100, null=True, verbose_name='Pendidikan Terakhir')),
                ('media_sosial', models.JSONField(blank=True, default=dict, null=True, verbose_name='Media Sosial')),
                ('preferensi', models.JSONField(blank=True, default=dict, null=True, verbose_name='Preferensi')),
                ('is_public', models.BooleanField(default=False, verbose_name='Profil Publik')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Dibuat')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Diperbarui')),
            ],
            options={
                'verbose_name': 'Profil User',
                'verbose_name_plural': 'Profil User',
                'db_table': 'user_profiles',
            },
        ),
    ]
