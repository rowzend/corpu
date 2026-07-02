'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Save, Loader2, MapPin, BookOpen, Building2, Phone, Users } from 'lucide-react';
import { userProfileService, type UserProfile } from '@/lib/services/user-profile.service';
import { referensiService } from '@/lib/services/referensi.service';
import { LazySearchSelect } from '@/components/ui/lazy-search-select';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';

export default function DataDiriPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<Record<string, any>>({});

    const agamaOptions = [
        { value: 'Islam', label: 'Islam' },
        { value: 'Kristen Protestan', label: 'Kristen Protestan' },
        { value: 'Kristen Katolik', label: 'Kristen Katolik' },
        { value: 'Hindu', label: 'Hindu' },
        { value: 'Buddha', label: 'Buddha' },
        { value: 'Konghucu', label: 'Konghucu' },
        { value: 'Lainnya', label: 'Lainnya' },
    ];

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await userProfileService.getProfile();
            setProfile(data);
            setForm({
                nik: data.nik,
                tempat_lahir: data.tempat_lahir,
                tanggal_lahir: data.tanggal_lahir,
                jenis_kelamin: data.jenis_kelamin,
                agama: data.agama,
                no_hp_pribadi: data.no_hp_pribadi,
                bio: data.bio,
                provinsi: data.provinsi,
                kabupaten: data.kabupaten,
                kecamatan: data.kecamatan,
                kelurahan: data.kelurahan,
                alamat_domisili: data.alamat_domisili,
                perguruan_tinggi: data.perguruan_tinggi,
                program_studi: data.program_studi,
                pendidikan_terakhir: data.pendidikan_terakhir,
                instansi: data.instansi,
                is_public: data.is_public,
            });
        } catch (err) {
            console.error(err);
            showError('Gagal memuat data diri');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Lazy fetch functions for wilayah cascading
    const fetchProvinsi = useCallback(async (q: string) => {
        const res = await referensiService.getProvinsiList({ search: q, all: 'true', page_size: '9999' as any });
        return res.data.map(p => ({ value: p.id, label: p.nama }));
    }, []);

    const fetchKabupaten = useCallback(async (q: string) => {
        if (!form.provinsi) return [];
        const res = await referensiService.getKabupatenList({ search: q, all: 'true', provinsi_id: String(form.provinsi), page_size: '9999' as any });
        return res.data.map(k => ({ value: k.id, label: k.nama }));
    }, [form.provinsi]);

    const fetchKecamatan = useCallback(async (q: string) => {
        if (!form.kabupaten) return [];
        const res = await referensiService.getKecamatanList({ search: q, all: 'true', kabupaten_id: String(form.kabupaten), page_size: '9999' as any });
        return res.data.map(k => ({ value: k.id, label: k.nama }));
    }, [form.kabupaten]);

    const fetchKelurahan = useCallback(async (q: string) => {
        if (!form.kecamatan) return [];
        const res = await referensiService.getKelurahanList({ search: q, all: 'true', kecamatan_id: String(form.kecamatan), page_size: '9999' as any });
        return res.data.map(k => ({ value: k.id, label: k.nama }));
    }, [form.kecamatan]);

    const fetchPT = useCallback(async (q: string) => {
        const res = await referensiService.getPerguruanTinggiList({ search: q, page_size: '9999' as any });
        return res.data.map(p => ({ value: p.id, label: p.nama_pt }));
    }, []);

    const fetchProdi = useCallback(async (q: string) => {
        if (!form.perguruan_tinggi) return [];
        const res = await referensiService.getProgramStudiList({ search: q, page_size: '9999' as any, perguruan_tinggi_id: String(form.perguruan_tinggi) });
        return res.data.map(p => ({ value: p.id, label: `${p.nama_prodi} (${p.jenjang || ''})` }));
    }, [form.perguruan_tinggi]);

    const fetchInstansi = useCallback(async (q: string) => {
        const res = await referensiService.getInstansiList({ search: q, page_size: '9999' as any });
        return res.data.map(i => ({ value: i.id, label: i.nama_instansi }));
    }, []);

    const handleSubmit = async () => {
        setSaving(true);
        showLoading('Menyimpan data diri...');
        try {
            await userProfileService.updateProfile(form as any);
            await loadProfile();
            closeLoading();
            showSuccess('Data diri berhasil diperbarui');
        } catch (err) {
            closeLoading();
            showError('Gagal menyimpan data diri');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8">
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Data Diri</h1>
                        <p className="text-blue-100 text-sm">Kelengkapan data diri Anda</p>
                    </div>
                </div>
            </div>

            {/* Kategori User */}
            {profile?.kategori_user_nama && (
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground">Kategori User:</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                            {profile.kategori_user_nama}
                        </span>
                    </div>
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                {/* Data Pribadi */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <User className="w-5 h-5" /> Data Pribadi
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">NIK (KTP)</label>
                                <input type="text" value={form.nik || ''} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm" placeholder="Masukkan NIK" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Tempat Lahir</label>
                                <input type="text" value={form.tempat_lahir || ''} onChange={e => setForm(f => ({ ...f, tempat_lahir: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm" placeholder="Tempat lahir" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Tanggal Lahir</label>
                                <input type="date" value={form.tanggal_lahir || ''} onChange={e => setForm(f => ({ ...f, tanggal_lahir: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Jenis Kelamin</label>
                                <LazySearchSelect
                                    fetchFn={async (q) => [
                                        { value: 'L', label: 'Laki-laki' },
                                        { value: 'P', label: 'Perempuan' },
                                    ].filter(o => o.label.toLowerCase().includes(q.toLowerCase()))}
                                    value={form.jenis_kelamin || null}
                                    onChange={(v) => setForm(f => ({ ...f, jenis_kelamin: v }))}
                                    placeholder="Pilih Jenis Kelamin"
                                    minChars={1}
                                    searchPlaceholder="Ketik untuk mencari..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Agama</label>
                                <LazySearchSelect
                                    fetchFn={async (q) => agamaOptions.filter(o =>
                                        o.label.toLowerCase().includes(q.toLowerCase()))}
                                    value={form.agama || null}
                                    onChange={(v) => setForm(f => ({ ...f, agama: v }))}
                                    placeholder="Pilih Agama"
                                    minChars={1}
                                    searchPlaceholder="Ketik untuk mencari..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">No. HP Pribadi</label>
                                <input type="text" value={form.no_hp_pribadi || ''} onChange={e => setForm(f => ({ ...f, no_hp_pribadi: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm" placeholder="No. HP" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1.5">Bio / Deskripsi</label>
                            <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                rows={3} className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm resize-none"
                                placeholder="Deskripsi singkat tentang Anda" />
                        </div>
                    </div>
                </div>

                {/* Alamat Domisili */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Alamat Domisili
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Provinsi</label>
                                <LazySearchSelect
                                    fetchFn={fetchProvinsi}
                                    value={form.provinsi}
                                    onChange={(v) => {
                                        setForm(f => ({ ...f, provinsi: v, kabupaten: null, kecamatan: null, kelurahan: null }));
                                    }}
                                    placeholder="Pilih Provinsi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Kabupaten/Kota</label>
                                <LazySearchSelect
                                    fetchFn={fetchKabupaten}
                                    value={form.kabupaten}
                                    onChange={(v) => {
                                        setForm(f => ({ ...f, kabupaten: v, kecamatan: null, kelurahan: null }));
                                    }}
                                    placeholder={form.provinsi ? 'Pilih Kabupaten/Kota' : 'Pilih provinsi terlebih dahulu'}
                                    disabled={!form.provinsi}
                                    disabledLabel="Pilih provinsi terlebih dahulu"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Kecamatan</label>
                                <LazySearchSelect
                                    fetchFn={fetchKecamatan}
                                    value={form.kecamatan}
                                    onChange={(v) => {
                                        setForm(f => ({ ...f, kecamatan: v, kelurahan: null }));
                                    }}
                                    placeholder={form.kabupaten ? 'Pilih Kecamatan' : 'Pilih kabupaten terlebih dahulu'}
                                    disabled={!form.kabupaten}
                                    disabledLabel="Pilih kabupaten terlebih dahulu"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Kelurahan/Desa</label>
                                <LazySearchSelect
                                    fetchFn={fetchKelurahan}
                                    value={form.kelurahan}
                                    onChange={(v) => setForm(f => ({ ...f, kelurahan: v }))}
                                    placeholder={form.kecamatan ? 'Pilih Kelurahan/Desa' : 'Pilih kecamatan terlebih dahulu'}
                                    disabled={!form.kecamatan}
                                    disabledLabel="Pilih kecamatan terlebih dahulu"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1.5">Detail Alamat</label>
                            <textarea value={form.alamat_domisili || ''} onChange={e => setForm(f => ({ ...f, alamat_domisili: e.target.value }))}
                                rows={3} className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm resize-none"
                                placeholder="RT/RW, Nama Jalan, Nomor Rumah, dll." />
                        </div>
                    </div>
                </div>

                {/* Pendidikan */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-600 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5" /> Pendidikan
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Perguruan Tinggi</label>
                                <LazySearchSelect
                                    fetchFn={fetchPT}
                                    value={form.perguruan_tinggi}
                                    onChange={(v) => {
                                        setForm(f => ({ ...f, perguruan_tinggi: v, program_studi: null }));
                                    }}
                                    placeholder="Pilih Perguruan Tinggi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Program Studi</label>
                                <LazySearchSelect
                                    fetchFn={fetchProdi}
                                    value={form.program_studi}
                                    onChange={(v) => setForm(f => ({ ...f, program_studi: v }))}
                                    placeholder={form.perguruan_tinggi ? 'Pilih Program Studi' : 'Pilih PT terlebih dahulu'}
                                    disabled={!form.perguruan_tinggi}
                                    disabledLabel="Pilih perguruan tinggi terlebih dahulu"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1.5">Pendidikan Terakhir (text)</label>
                            <input type="text" value={form.pendidikan_terakhir || ''} onChange={e => setForm(f => ({ ...f, pendidikan_terakhir: e.target.value }))}
                                className="w-full px-4 py-3 border-2 border-border rounded-lg bg-card focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm" placeholder="S1/S2/S3/D3/dll" />
                        </div>
                    </div>
                </div>

                {/* Instansi */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5" /> Instansi / Unit Kerja
                        </h2>
                    </div>
                    <div className="p-6">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1.5">Instansi</label>
                            <LazySearchSelect
                                fetchFn={fetchInstansi}
                                value={form.instansi}
                                onChange={(v) => setForm(f => ({ ...f, instansi: v }))}
                                placeholder="Pilih Instansi"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end">
                    <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Data Diri
                    </button>
                </div>
            </form>
        </div>
    );
}
