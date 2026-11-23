'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function VerifyContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status') || 'invalid';

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResend = async () => {
        setError('');
        setMessage('');
        if (!email.trim()) { setError('Email wajib diisi.'); return; }
        setLoading(true);
        try {
            await api.resendVerification(email.trim());
            setMessage('Tautan verifikasi sudah dikirim ulang. Periksa kotak masuk (dan folder spam) Anda.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mengirim ulang email verifikasi.');
        } finally {
            setLoading(false);
        }
    };

    const isOk = status === 'ok';
    const isExpired = status === 'expired';

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border/50 p-6 text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${isOk ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                    <span className="text-2xl">{isOk ? '✅' : isExpired ? '⌛' : '⚠️'}</span>
                </div>

                <h1 className="text-base font-bold text-foreground mb-1">
                    {isOk ? 'Email Berhasil Diverifikasi' : isExpired ? 'Tautan Kedaluwarsa' : 'Tautan Tidak Sah'}
                </h1>
                <p className="text-xs text-muted-foreground mb-4">
                    {isOk
                        ? 'Terima kasih. Email Anda sudah terbukti — pendaftaran kini menunggu persetujuan administrator.'
                        : isExpired
                            ? 'Tautan verifikasi sudah kedaluwarsa atau dibatalkan oleh pengiriman yang lebih baru. Kirim ulang di bawah ini.'
                            : 'Tautan verifikasi tidak dikenali. Minta tautan baru lewat tombol di bawah ini.'}
                </p>

                {!isOk && (
                    <div className="text-left mb-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            placeholder="Email yang Anda daftarkan"
                            className="w-full px-3.5 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground mb-2"
                            disabled={loading}
                        />
                        {message && <p className="text-xs text-green-600 mb-2">{message}</p>}
                        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            className="w-full font-semibold py-2.5 rounded-xl border border-input text-xs hover:bg-muted/50 transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Mengirim...' : 'Kirim ulang email verifikasi'}
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <Link href="/login" className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-xs hover:bg-primary/90 transition-colors">
                        {isOk ? 'Ke Halaman Masuk' : 'Coba Masuk'}
                    </Link>
                    <Link href="/login?tab=status" className="flex-1 px-4 py-2.5 border border-input rounded-xl font-semibold text-xs hover:bg-muted/50 transition-colors">
                        Cek Status
                    </Link>
                </div>

                <Link href="/" className="inline-block mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <VerifyContent />
        </Suspense>
    );
}
