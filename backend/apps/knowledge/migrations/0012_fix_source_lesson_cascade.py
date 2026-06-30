# Generated manually to fix source_lesson foreign key constraint
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0013_add_course_category'),
        ('knowledge', '0011_article_source_lesson'),
    ]

    operations = [
        # Drop old constraint
        migrations.RunSQL(
            sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_;',
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Re-add constraint with SET NULL on delete
        migrations.RunSQL(
            sql='''
                ALTER TABLE knowledge_articles 
                ADD CONSTRAINT knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_ 
                FOREIGN KEY (source_lesson_id) 
                REFERENCES learning_lessons(id) 
                ON DELETE SET NULL 
                DEFERRABLE INITIALLY DEFERRED;
            ''',
            reverse_sql='ALTER TABLE knowledge_articles DROP CONSTRAINT IF EXISTS knowledge_articles_source_lesson_id_6c2b9e83_fk_learning_;',
        ),
    ]
