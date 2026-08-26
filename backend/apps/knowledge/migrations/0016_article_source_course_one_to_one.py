from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge', '0015_article_per_lesson_structure'),
    ]

    operations = [
        migrations.AlterField(
            model_name='Article',
            name='source_course',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='knowledge_article', to='learning.course', verbose_name='Sumber Course LMS'),
        ),
    ]
