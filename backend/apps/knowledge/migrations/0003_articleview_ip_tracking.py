# Generated migration for IP-based view tracking

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('knowledge', '0002_article_content_type_article_external_url_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ArticleView',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip_address', models.GenericIPAddressField(help_text='IP address of the viewer', verbose_name='IP Address')),
                ('user_agent', models.TextField(blank=True, help_text='Browser/device information', null=True, verbose_name='User Agent')),
                ('viewed_at', models.DateTimeField(auto_now_add=True, verbose_name='Dilihat Pada')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='views', to='knowledge.article', verbose_name='Artikel')),
                ('user', models.ForeignKey(blank=True, help_text='User if logged in (optional)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='article_views', to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'verbose_name': 'Article View',
                'verbose_name_plural': 'Article Views',
                'db_table': 'knowledge_article_views',
                'ordering': ['-viewed_at'],
            },
        ),
        migrations.AddIndex(
            model_name='articleview',
            index=models.Index(fields=['article', 'ip_address'], name='knowledge_a_article_idx'),
        ),
        migrations.AddIndex(
            model_name='articleview',
            index=models.Index(fields=['viewed_at'], name='knowledge_a_viewed__idx'),
        ),
        migrations.AlterUniqueTogether(
            name='articleview',
            unique_together={('article', 'ip_address')},
        ),
    ]
