from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone

from .models import UnitKerja, DesainPembelajaranUnit


@receiver(pre_delete, sender=UnitKerja)
def archive_desain_on_unit_delete(sender, instance, **kwargs):
    """Saat UnitKerja dihapus, jangan hapus desain pembelajarannya.

    Simpan snapshot identitas unit dan tandai desain sebagai riwayat agar
    kompetensi teknis & tujuan pembelajarannya tetap bisa dilacak.
    (unit_kerja akan di-SET_NULL otomatis oleh on_delete.)
    """
    desains = DesainPembelajaranUnit.objects.filter(unit_kerja=instance)
    if not desains.exists():
        return
    desains.update(
        unit_kerja_nm_opd=instance.nm_opd or '',
        unit_kerja_id_opd=instance.id_opd,
        is_riwayat=True,
        archived_at=timezone.now(),
    )
