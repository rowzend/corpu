from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0017_quiz_attempt_draft_support'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='thumbnail',
            field=models.ImageField(blank=True, null=True, upload_to='courses/thumbnails/%Y/%m/', verbose_name='Thumbnail'),
        ),
    ]
