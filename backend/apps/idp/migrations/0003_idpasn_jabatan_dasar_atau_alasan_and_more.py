from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('idp', '0002_idpasn_approved_at_idpasn_approved_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='idpasn',
            name='jabatan_dasar_atau_alasan',
            field=models.TextField(blank=True, default='', help_text='Jabatan dasar atau alasan penyusunan IDP ini', verbose_name='Jabatan Dasar atau Alasan Penyusunan IDP'),
        ),
        migrations.AddField(
            model_name='idpasn',
            name='tanggal_pengajuan',
            field=models.DateField(blank=True, help_text='Tanggal pengajuan IDP', null=True, verbose_name='Tanggal Pengajuan IDP'),
        ),
    ]