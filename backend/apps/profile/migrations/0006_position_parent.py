from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('profile', '0005_alter_personalia_position'),
    ]

    operations = [
        migrations.AddField(
            model_name='position',
            name='parent',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='children',
                to='profile.Position',
                verbose_name='Parent Jabatan'
            ),
        ),
    ]
