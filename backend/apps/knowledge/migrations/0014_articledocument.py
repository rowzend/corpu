from django.db import migrations, models
import django.db.models.deletion
import apps.knowledge.models


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0018_alter_course_thumbnail'),
        ('knowledge', '0013_remove_source_lesson_add_source_module'),
    ]

    operations = [
        migrations.CreateModel(
            name='ArticleDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to=apps.knowledge.models.knowledge_document_upload_to, verbose_name='File')),
                ('file_name', models.CharField(blank=True, max_length=255, verbose_name='Nama File')),
                ('file_size', models.BigIntegerField(blank=True, null=True, verbose_name='Ukuran File (bytes)')),
                ('file_type', models.CharField(blank=True, max_length=50, null=True, verbose_name='Tipe File')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='knowledge.article', verbose_name='Artikel')),
                ('source_lesson', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='article_documents', to='learning.lesson', verbose_name='Sumber Lesson LMS')),
            ],
            options={
                'verbose_name': 'Dokumen Artikel',
                'verbose_name_plural': 'Dokumen Artikel',
                'db_table': 'knowledge_article_documents',
                'ordering': ['created_at', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='articledocument',
            index=models.Index(fields=['article'], name='knowledge_articledoc_article_idx'),
        ),
        migrations.AddIndex(
            model_name='articledocument',
            index=models.Index(fields=['source_lesson'], name='knowledge_articledoc_lesson_idx'),
        ),
    ]
