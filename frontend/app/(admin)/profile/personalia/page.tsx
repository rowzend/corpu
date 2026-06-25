'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, Plus, Pencil, Trash2, X, Camera, Mail, Phone, Hash, Building2, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';
import { profileService, type Personalia } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';

function photoUrl(path: string | null): string | null {
    if (!path) return null;
    const url = path.startsWith('http://') || path.startsWith('https://') ? new URL(path) : null;
    const relativePath = url ? url.pathname.replace(/^\/media\//, '') : path;
    const base = typeof window !== 'undefined' ? `${window.location.origin}/media` : '/media';
    return `${base}/${relativePath}`;
}

const emptyForm = {
    name: '', nip: '', position: '', description: '',
    email: '', phone: '', unit_kerja: '', order: 0,
};

export default function PersonaliaPage() {
    const [data, setData] = useState<Personalia[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Personalia | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setData(await profileService.getPersonalia());
        } catch (err) {
            console.error(err);
            showError('Gagal memuat data personalia');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ ...emptyForm });
        setPhotoPreview(null);
        setPhotoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setEditing(null);
        setShowForm(false);
    };

    const openEdit = (item: Personalia) => {
        setForm({
            name: item.name, nip: item.nip || '', position: item.position,
            description: item.description || '', email: item.email || '',
            phone: item.phone || '', unit_kerja: item.unit_kerja || '', order: item.order,
        });
        setPhotoPreview(item.photo ? photoUrl(item.photo) : null);
        setPhotoFile(null);
        setEditing(item);
        setShowForm(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.position.trim()) {
            showError('Nama dan Jabatan wajib diisi');
            return;
        }
        showLoading(editing ? 'Memperbarui...' : 'Menambah...');
        try {
            if (editing) {
                await profileService.updatePersonalia(editing.id, form, photoFile);
            } else {
                await profileService.createPersonalia(form, photoFile);
            }
            await loadData();
            resetForm();
            closeLoading();
            showSuccess(editing ? 'Personalia berhasil diperbarui' : 'Personalia berhasil ditambahkan');
        } catch (err) {
            closeLoading();
            showError('Gagal menyimpan data');
        }
    };

    const handleDelete = async (item: Personalia) => {
        const confirmed = await showDeleteConfirm(item.name, 'personalia');
        if (!confirmed) return;
        showLoading('Menghapus...');
        try {
            await profileService.deletePersonalia(item.id);
            await loadData();
            closeLoading();
            showSuccess('Personalia berhasil dihapus');
        } catch (err) {
            closeLoading();
            showError('Gagal menghapus');
        }
    };

    const toggleActive = async (item: Personalia) => {
        showLoading('Memperbarui...');
        try {
            await profileService.updatePersonalia(item.id, { is_active: !item.is_active });
            await loadData();
            closeLoading();
        } catch (err) {
            closeLoading();
            showError('Gagal memperbarui');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Personalia</h1>
                            <p className="text-emerald-100 text-sm">Kelola data personalia dan pegawai instansi</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> Tambah Personalia
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {editing ? 'Edit Personalia' : 'Tambah Personalia Baru'}
                                    </h2>
                                    <p className="text-emerald-100 text-sm mt-0.5">
                                        {editing ? 'Perbarui data personalia' : 'Masukkan data personalia baru'}
                                    </p>
                                </div>
                                <button onClick={resetForm} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Photo */}
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 group cursor-pointer hover:border-emerald-300 transition-colors relative"
                                            onClick={() => fileInputRef.current?.click()}>
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-xs text-gray-400">Klik untuk upload foto</p>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        {photoPreview && (
                                            <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium">
                                                Hapus Foto
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Nama <span className="text-red-500">*</span>
                                        </label>
                                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="Nama lengkap" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <input type="text" value={form.nip} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="NIP" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Jabatan <span className="text-red-500">*</span>
                                            </label>
                                            <input type="text" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="Jabatan" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit Kerja</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <input type="text" value={form.unit_kerja} onChange={e => setForm(f => ({ ...f, unit_kerja: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="Unit kerja" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Urutan</label>
                                            <div className="relative">
                                                <ArrowUpDown className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="email@example.com" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telepon</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="No. telepon" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-colors text-sm resize-none"
                                            placeholder="Deskripsi atau bio singkat" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                                <button onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button onClick={handleSubmit}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-200">
                                    {editing ? 'Simpan Perubahan' : 'Tambah Personalia'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-48" />
                                    <div className="h-3 bg-gray-200 rounded w-32" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : data.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Personalia</h3>
                    <p className="text-gray-500 mb-6">Belum ada data personalia yang tersedia.</p>
                    <button onClick={() => { resetForm(); setShowForm(true); }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-200">
                        <Plus className="w-4 h-4" /> Tambah Personalia Pertama
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((item) => (
                        <div key={item.id}
                            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-4">
                            <div className="flex items-center gap-4">
                                {/* Photo */}
                                <div className="flex-shrink-0">
                                    {item.photo ? (
                                        <img src={photoUrl(item.photo) || ''} alt={item.name}
                                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                                            <span className="text-white text-lg font-bold">{item.name.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                        {item.nip && <p className="text-xs text-gray-500">NIP. {item.nip}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <p className="text-sm text-gray-600 truncate">{item.position}</p>
                                        {item.unit_kerja && <p className="text-xs text-gray-400 truncate">{item.unit_kerja}</p>}
                                    </div>
                                    <div className="hidden md:block">
                                        {item.email && <p className="text-xs text-gray-500 truncate">{item.email}</p>}
                                        {item.phone && <p className="text-xs text-gray-400">{item.phone}</p>}
                                    </div>
                                    <div className="hidden md:flex items-center gap-3">
                                        <button onClick={() => toggleActive(item)}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                                item.is_active
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {item.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => openEdit(item)}
                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {/* Mobile status */}
                            <div className="md:hidden flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                                <button onClick={() => toggleActive(item)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                                        item.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                </button>
                                {item.email && <span className="text-xs text-gray-400">{item.email}</span>}
                                {item.phone && <span className="text-xs text-gray-400">{item.phone}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
