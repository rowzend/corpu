# Generated manually for draft support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('learning', '0016_alter_lessonprogress_time_spent_minutes'),
    ]

    operations = [
        migrations.AddField(
            model_name='quizattempt',
            name='status',
            field=models.CharField(choices=[('draft', 'Draft'), ('completed', 'Completed')], default='draft', max_length=20, verbose_name='Status'),
        ),
        migrations.AddField(
            model_name='quizattempt',
            name='draft_answers',
            field=models.JSONField(blank=True, default=list, null=True, verbose_name='Jawaban Draft'),
        ),
    ]
