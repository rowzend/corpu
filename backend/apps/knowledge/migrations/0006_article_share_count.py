# Generated migration for share count tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge', '0005_comment_system'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='share_count',
            field=models.IntegerField(default=0, verbose_name='Jumlah Share'),
        ),
    ]
