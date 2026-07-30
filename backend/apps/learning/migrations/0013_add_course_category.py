# Generated manually for category field

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge', '0011_article_source_lesson'),
        ('learning', '0012_quiz_time_limit_minutes_quizattempt_time_spent'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='courses',
                to='knowledge.category',
                verbose_name='Kategori Learning'
            ),
        ),
    ]
