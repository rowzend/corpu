# Self-register ala SIMPEL (Opsi A): status pendaftaran di user lokal.
# User lama hasil sync ESIMPEG/seed semuanya default 'approved' (tidak berubah perilaku).
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_remove_user_kategori_user_userprofile_kategori_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='registration_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Menunggu Persetujuan'),
                    ('approved', 'Disetujui'),
                    ('rejected', 'Ditolak'),
                ],
                default='approved',
                help_text='Status pendaftaran self-register (pending/approved/rejected)',
                max_length=20,
                verbose_name='registration status',
            ),
        ),
    ]
