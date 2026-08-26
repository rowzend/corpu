'use client';

import { useEffect, useState } from 'react';

const PROBE_URL = '/media/minio/_probe/health.txt';
const CHECK_INTERVAL = 15000;

export default function DevMinioWarning() {
  const [unreachable, setUnreachable] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(PROBE_URL, { cache: 'no-store' });
        if (cancelled) return;
        setUnreachable(res.status === 503 || !res.ok);
      } catch {
        if (cancelled) return;
        setUnreachable(true);
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!checked || !unreachable) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white text-center text-sm font-medium px-4 py-2 shadow-lg">
      <span role="img" aria-label="warning">⚠️</span> MinIO tidak terjangkau
      ({PROBE_URL}) — gambar mungkin tidak muncul. Kemungkinan Anda sedang development di luar jaringan internal.
    </div>
  );
}
