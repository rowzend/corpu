from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api_simpeg', '0006_remove_desainpembelajaranunit_kompetensi_teknis_and_more'),
    ]

    operations = [
        # fitur baru tanpa data produksi: bersihkan baris uji lama agar
        # penambahan FK non-null tidak bermasalah
        migrations.RunSQL(
            sql='DELETE FROM api_simpeg_tujuan_pembelajaran_unit',
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RemoveField(
            model_name='tujuanpembelajaranunit',
            name='desain',
        ),
        migrations.AddField(
            model_name='tujuanpembelajaranunit',
            name='kompetensi',
            field=models.ForeignKey(
                default=1,
                help_text='Kompetensi teknis pemilik tujuan pembelajaran ini',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='tujuan',
                to='api_simpeg.kompetensiteknisunit',
                verbose_name='Kompetensi Teknis',
            ),
            preserve_default=False,
        ),
    ]
