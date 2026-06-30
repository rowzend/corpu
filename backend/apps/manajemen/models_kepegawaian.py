from django.db import models
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _md_pangkat_order_index_map():
    from apps.master_data.models import MdPangkat

    ids = list(MdPangkat.objects.order_by('id').values_list('id', flat=True))
    return {pid: idx + 1 for idx, pid in enumerate(ids)}


# MsPegawai dihapus — pindah ke apps.api_simpeg.models.Pegawai
