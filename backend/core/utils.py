from pathlib import Path


def clean_filename(filename):
    """Remove multiple extensions, keep only the last one."""
    p = Path(filename)
    if len(p.suffixes) > 1:
        stem = p.stem
        while Path(stem).suffix:
            stem = Path(stem).stem
        return stem + p.suffixes[-1]
    return filename
