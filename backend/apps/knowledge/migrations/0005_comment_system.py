# Generated migration for Comment system with nested replies

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('knowledge', '0004_articlelike_system'),
    ]

    operations = [
        # Create Comment model
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(verbose_name='Konten Komentar')),
                ('like_count', models.IntegerField(default=0, verbose_name='Jumlah Like')),
                ('dislike_count', models.IntegerField(default=0, verbose_name='Jumlah Dislike')),
                ('is_edited', models.BooleanField(default=False, verbose_name='Sudah Diedit')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='knowledge.article', verbose_name='Artikel')),
                ('parent', models.ForeignKey(blank=True, help_text='Null = top-level comment, Not null = reply to another comment', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='knowledge.comment', verbose_name='Parent Comment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='article_comments', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Comment',
                'verbose_name_plural': 'Comments',
                'db_table': 'knowledge_comments',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='comment',
            index=models.Index(fields=['article', 'parent'], name='knowledge_c_article_parent_idx'),
        ),
        migrations.AddIndex(
            model_name='comment',
            index=models.Index(fields=['user'], name='knowledge_c_user_idx'),
        ),
        migrations.AddIndex(
            model_name='comment',
            index=models.Index(fields=['created_at'], name='knowledge_c_created_idx'),
        ),
        
        # Create CommentLike model
        migrations.CreateModel(
            name='CommentLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_like', models.BooleanField(help_text='True = Like, False = Dislike', verbose_name='Is Like')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')),
                ('comment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_likes', to='knowledge.comment', verbose_name='Comment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_likes', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Comment Like/Dislike',
                'verbose_name_plural': 'Comment Likes/Dislikes',
                'db_table': 'knowledge_comment_likes',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='commentlike',
            index=models.Index(fields=['comment', 'user'], name='knowledge_c_comment_user_idx'),
        ),
        migrations.AddIndex(
            model_name='commentlike',
            index=models.Index(fields=['is_like'], name='knowledge_c_is_like_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='commentlike',
            unique_together={('comment', 'user')},
        ),
    ]
