from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('profile', '0004_position'),
    ]

    operations = [
        migrations.AlterField(
            model_name='personalia',
            name='position',
            field=models.CharField(
                blank=True, max_length=255, null=True,
                verbose_name='Jabatan'
            ),
        ),
    ]
