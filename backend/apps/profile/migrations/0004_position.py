from django.db import migrations, models
import django.db.models.deletion


def create_positions_from_personalia(apps, schema_editor):
    Personalia = apps.get_model('profile', 'Personalia')
    Position = apps.get_model('profile', 'Position')

    unique_positions = Personalia.objects.values_list(
        'position', flat=True
    ).distinct().exclude(position__isnull=True).exclude(position__exact='')

    position_map = {}
    for i, pos_name in enumerate(unique_positions):
        pos, _ = Position.objects.get_or_create(
            name=pos_name,
            defaults={'order': i}
        )
        position_map[pos_name] = pos

    for person in Personalia.objects.all():
        if person.position and person.position in position_map:
            person.position_fk = position_map[person.position]
            person.save(update_fields=['position_fk'])


class Migration(migrations.Migration):
    dependencies = [
        ('profile', '0003_alter_brand_image_alter_personalia_photo_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Position',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True,
                    serialize=False, verbose_name='ID'
                )),
                ('name', models.CharField(
                    max_length=255, verbose_name='Jabatan'
                )),
                ('description', models.TextField(
                    blank=True, null=True, verbose_name='Deskripsi'
                )),
                ('order', models.IntegerField(
                    default=0, verbose_name='Urutan'
                )),
                ('is_active', models.BooleanField(
                    default=True, verbose_name='Aktif'
                )),
                ('created_at', models.DateTimeField(
                    auto_now_add=True
                )),
                ('updated_at', models.DateTimeField(
                    auto_now=True
                )),
            ],
            options={
                'db_table': 'profile_positions',
                'verbose_name': 'Jabatan',
                'verbose_name_plural': 'Jabatan',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.AddField(
            model_name='personalia',
            name='position_fk',
            field=models.ForeignKey(
                null=True, blank=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='profile.Position',
                verbose_name='Jabatan (Master)'
            ),
        ),
        migrations.RunPython(
            create_positions_from_personalia,
            reverse_code=migrations.RunPython.noop
        ),
    ]
