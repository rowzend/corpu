from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0018_alter_course_thumbnail'),
        ('knowledge', '0014_articledocument'),
    ]

    operations = [
        # source_course / source_module columns already exist in the DB (added
        # without a migration) as OneToOne. Drop their UNIQUE constraints so a
        # course/module can map to many articles, and register the fields in the
        # migration state as ForeignKey.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='article',
                    name='source_course',
                    field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='knowledge_articles', to='learning.course', verbose_name='Sumber Course LMS'),
                ),
                migrations.AddField(
                    model_name='article',
                    name='source_module',
                    field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='knowledge_articles', to='learning.module', verbose_name='Sumber Modul LMS'),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_course_id_key;',
                    reverse_sql=migrations.RunSQL.noop,
                ),
                migrations.RunSQL(
                    sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_module_id_key;',
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
        ),
        migrations.AddField(
            model_name='article',
            name='source_lesson',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='knowledge_article', to='learning.lesson', verbose_name='Sumber Lesson LMS'),
        ),
        migrations.AddField(
            model_name='article',
            name='order',
            field=models.IntegerField(default=0, verbose_name='Urutan (dari LMS)'),
        ),
    ]
