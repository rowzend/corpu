# Generated migration for Like/Dislike system

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('knowledge', '0003_articleview_ip_tracking'),
    ]

    operations = [
        # Add like_count and dislike_count fields to Article
        migrations.AddField(
            model_name='article',
            name='like_count',
            field=models.IntegerField(default=0, verbose_name='Jumlah Like'),
        ),
        migrations.AddField(
            model_name='article',
            name='dislike_count',
            field=models.IntegerField(default=0, verbose_name='Jumlah Dislike'),
        ),
        
        # Create ArticleLike model
        migrations.CreateModel(
            name='ArticleLike',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_like', models.BooleanField(help_text='True = Like, False = Dislike', verbose_name='Is Like')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Dibuat Pada')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Diupdate Pada')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='knowledge.article', verbose_name='Artikel')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='article_likes', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Article Like/Dislike',
                'verbose_name_plural': 'Article Likes/Dislikes',
                'db_table': 'knowledge_article_likes',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='articlelike',
            index=models.Index(fields=['article', 'user'], name='knowledge_a_article_like_idx'),
        ),
        migrations.AddIndex(
            model_name='articlelike',
            index=models.Index(fields=['is_like'], name='knowledge_a_is_like_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='articlelike',
            unique_together={('article', 'user')},
        ),
    ]
