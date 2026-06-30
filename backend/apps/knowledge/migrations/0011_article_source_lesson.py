from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0012_quiz_time_limit_minutes_quizattempt_time_spent'),
        ('knowledge', '0010_alter_article_file_upload_alter_article_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='source_lesson',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='synced_article',
                to='learning.lesson',
                verbose_name='Sumber Pelajaran LMS',
            ),
        ),
    ]
