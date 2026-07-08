from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0018_alter_course_thumbnail'),
        ('knowledge', '0012_fix_source_lesson_cascade'),
    ]

    operations = [
        # Remove old constraint first
        migrations.RunSQL(
            sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Remove old field
        migrations.RemoveField(
            model_name='article',
            name='source_lesson',
        ),
        # Add new field pointing to Module
        migrations.AddField(
            model_name='article',
            name='source_module',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='synced_article',
                to='learning.module',
                verbose_name='Sumber Modul LMS',
            ),
        ),
    ]
