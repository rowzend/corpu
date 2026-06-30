# Generated manually: add platform field to MenuItem
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('manajemen_aplikasi', '0009_appsettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='platform',
            field=models.CharField(
                choices=[('backend', 'Backend (Django)'), ('frontend', 'Frontend (Next.js)')],
                default='backend',
                max_length=20,
            ),
        ),
    ]
