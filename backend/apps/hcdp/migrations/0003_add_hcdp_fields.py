from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hcdp', '0002_alter_hcdpprogram_gambar'),
    ]

    operations = [
        migrations.AddField(
            model_name='hcdpprogram',
            name='durasi',
            field=models.CharField(blank=True, default='', help_text='Contoh: 3 hari, 2 minggu', max_length=100, verbose_name='Durasi'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='instruktur',
            field=models.CharField(blank=True, default='', help_text='Nama instruktur program', max_length=255, verbose_name='Instruktur'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='kategori',
            field=models.CharField(choices=[('Leadership', 'Leadership'), ('Technology', 'Technology'), ('Communication', 'Communication'), ('Management', 'Management'), ('Technical', 'Technical')], default='Leadership', help_text='Kategori program HCDP', max_length=50, verbose_name='Kategori'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='level',
            field=models.CharField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], default='beginner', help_text='Level kesulitan program', max_length=20, verbose_name='Level'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='lokasi',
            field=models.CharField(blank=True, default='', help_text='Lokasi pelaksanaan program', max_length=255, verbose_name='Lokasi'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='maks_peserta',
            field=models.PositiveIntegerField(default=0, help_text='Jumlah maksimal peserta', verbose_name='Maksimal Peserta'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='status',
            field=models.CharField(choices=[('upcoming', 'Upcoming'), ('ongoing', 'Ongoing'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='upcoming', help_text='Status program', max_length=20, verbose_name='Status'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='tags',
            field=models.TextField(blank=True, default='', help_text='Tags dipisahkan dengan koma', verbose_name='Tags'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='tanggal_mulai',
            field=models.DateField(blank=True, help_text='Tanggal mulai program', null=True, verbose_name='Tanggal Mulai'),
        ),
        migrations.AddField(
            model_name='hcdpprogram',
            name='tanggal_selesai',
            field=models.DateField(blank=True, help_text='Tanggal selesai program', null=True, verbose_name='Tanggal Selesai'),
        ),
    ]
