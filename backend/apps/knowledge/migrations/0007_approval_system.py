# Generated migration for Approval/Validation system

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('knowledge', '0006_article_share_count'),
    ]

    operations = [
        # Update Article status choices
        migrations.AlterField(
            model_name='article',
            name='status',
            field=models.CharField(
                choices=[
                    ('draft', 'Draft'),
                    ('pending', 'Pending Approval'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('published', 'Published'),
                    ('archived', 'Archived')
                ],
                default='draft',
                max_length=20,
                verbose_name='Status'
            ),
        ),
        
        # Add approval fields to Article
        migrations.AddField(
            model_name='article',
            name='submitted_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Diajukan Pada'),
        ),
        migrations.AddField(
            model_name='article',
            name='approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_articles',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Disetujui Oleh'
            ),
        ),
        migrations.AddField(
            model_name='article',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Disetujui Pada'),
        ),
        migrations.AddField(
            model_name='article',
            name='rejection_reason',
            field=models.TextField(blank=True, null=True, verbose_name='Alasan Ditolak'),
        ),
        migrations.AddField(
            model_name='article',
            name='rejection_count',
            field=models.IntegerField(default=0, verbose_name='Jumlah Ditolak'),
        ),
        
        # Create ApprovalHistory model
        migrations.CreateModel(
            name='ApprovalHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(
                    choices=[
                        ('submitted', 'Submitted for Approval'),
                        ('approved', 'Approved'),
                        ('rejected', 'Rejected'),
                        ('published', 'Published')
                    ],
                    max_length=20,
                    verbose_name='Aksi'
                )),
                ('reason', models.TextField(
                    blank=True,
                    help_text='Alasan ditolak atau catatan approval',
                    null=True,
                    verbose_name='Alasan/Keterangan'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Tanggal')),
                ('actor', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='approval_actions',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Dilakukan Oleh'
                )),
                ('article', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='approval_history',
                    to='knowledge.article',
                    verbose_name='Artikel'
                )),
            ],
            options={
                'verbose_name': 'Approval History',
                'verbose_name_plural': 'Approval Histories',
                'db_table': 'knowledge_approval_history',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='approvalhistory',
            index=models.Index(fields=['article', 'action'], name='knowledge_a_article_action_idx'),
        ),
        migrations.AddIndex(
            model_name='approvalhistory',
            index=models.Index(fields=['created_at'], name='knowledge_a_created_history_idx'),
        ),
    ]
