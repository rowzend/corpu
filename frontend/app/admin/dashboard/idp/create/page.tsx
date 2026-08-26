'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LazySearchSelect } from '@/components/ui/lazy-search-select';
import { DatePicker } from '@/components/ui/date-picker';
import {
    ArrowLeft, Save, Loader2, FileText
} from 'lucide-react';
import { createIdp } from '@/lib/api/idp';
import { simpegService } from '@/lib/services/simpeg.service';
import { showToast, showError } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';

export default function CreateIdpPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        asn_id: null as number | null,
        atasan_langsung_id: null as number | null,
        periode_dari: null as string | null,
        periode_sampai: null as string | null,
        dasar_penyusunan_idp: '',
        tanggal_pengajuan: null as string | null,
    });

    const fetchAsnOptions = useCallback(async (query: string) => {
        const res = await simpegService.getPegawaiList({ search: query, per_page: 20 });
        return res.data.map(p => ({
            value: p.id,
            label: `${p.nama_pegawai} (${p.nip_baru || p.nip_lama || '-'}) - ${p.nama_jabatan || ''} - ${p.nm_opd || ''}`,
        }));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.asn_id) {
            showError('Silakan pilih ASN terlebih dahulu', 'Validasi');
            return;
        }
        if (!formData.periode_dari || !formData.periode_sampai) {
            showError('Periode IDP (dari dan sampai) harus diisi', 'Validasi');
            return;
        }
        if (new Date(formData.periode_sampai) < new Date(formData.periode_dari)) {
            showError('Periode sampai tidak boleh sebelum periode dari', 'Validasi');
            return;
        }
        setSaving(true);
        try {
            await createIdp({
                asn_id: formData.asn_id,
                atasan_langsung_id: formData.atasan_langsung_id,
                periode_dari: formData.periode_dari,
                periode_sampai: formData.periode_sampai,
                dasar_penyusunan_idp: formData.dasar_penyusunan_idp,
                tanggal_pengajuan: formData.tanggal_pengajuan,
                status: 'draft',
            });
            showToast('IDP berhasil dibuat!', 'success');
            router.push('/admin/dashboard/idp');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Membuat IDP');
        } finally {
            setSaving(false);
        }
    };

    const sectionHeader = (Icon: React.ElementType, title: string, desc: string) => (
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
                <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        disabled={saving}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Buat IDP ASN</h1>
                        <p className="text-teal-100 text-sm">Isi formulir di bawah untuk membuat Individual Development Plan</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pegawai */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    {sectionHeader(UserIcon, 'Pegawai', 'Pilih ASN dan atasan langsung yang terkait')}
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Pilih ASN <span className="text-red-500">*</span>
                            </Label>
                            <LazySearchSelect
                                fetchFn={fetchAsnOptions}
                                value={formData.asn_id}
                                onChange={(v) => setFormData(prev => ({ ...prev, asn_id: v !== null ? Number(v) : null }))}
                                placeholder="Cari ASN berdasarkan nama, NIP, atau jabatan..."
                                searchPlaceholder="Ketik minimal 3 karakter untuk mencari ASN..."
                                minChars={3}
                            />
                            <p className="text-xs text-muted-foreground">ASN yang akan disusun IDP-nya</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                                Pilih Atasan Langsung
                            </Label>
                            <LazySearchSelect
                                fetchFn={fetchAsnOptions}
                                value={formData.atasan_langsung_id}
                                onChange={(v) => setFormData(prev => ({ ...prev, atasan_langsung_id: v !== null ? Number(v) : null }))}
                                placeholder="Cari atasan langsung..."
                                searchPlaceholder="Ketik minimal 3 karakter untuk mencari atasan..."
                                minChars={3}
                            />
                            <p className="text-xs text-muted-foreground">Atasan langsung dari ASN yang bersangkutan (opsional)</p>
                        </div>
                    </div>
                </div>

                {/* Periode IDP */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    {sectionHeader(CalendarIcon, 'Periode IDP', 'Tentukan periode berlakunya IDP')}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="periode_dari" className="text-sm font-medium text-foreground">
                                    Periode IDP - Dari <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.periode_dari}
                                    onChange={(v) => setFormData(prev => ({ ...prev, periode_dari: v }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Format: dd-mm-yyyy</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="periode_sampai" className="text-sm font-medium text-foreground">
                                    Periode IDP - Sampai <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.periode_sampai}
                                    onChange={(v) => setFormData(prev => ({ ...prev, periode_sampai: v }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Format: dd-mm-yyyy</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_pengajuan" className="text-sm font-medium text-foreground">
                                    Tanggal Pengajuan IDP
                                </Label>
                                <DatePicker
                                    value={formData.tanggal_pengajuan}
                                    onChange={(v) => setFormData(prev => ({ ...prev, tanggal_pengajuan: v }))}
                                    placeholder="Pilih tanggal (dd-mm-yyyy)"
                                />
                                <p className="text-xs text-muted-foreground">Format: dd-mm-yyyy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Konten IDP */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    {sectionHeader(FileText, 'Konten IDP', 'Isi dasar penyusunan IDP')}
                    <div className="p-6">
                        <div className="space-y-2">
                            <Label htmlFor="dasar_penyusunan_idp" className="text-sm font-medium text-foreground">
                                Dasar Penyusunan IDP
                            </Label>
                            <p className="text-xs text-muted-foreground">Jabatan dasar atau alasan penyusunan IDP ini</p>
                            <Textarea
                                id="dasar_penyusunan_idp" name="dasar_penyusunan_idp"
                                value={formData.dasar_penyusunan_idp} onChange={handleChange}
                                placeholder="Tuliskan dasar atau acuan dalam penyusunan IDP ini..."
                                rows={5}
                                className="border-border focus:border-teal-500 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-36"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Simpan IDP</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
