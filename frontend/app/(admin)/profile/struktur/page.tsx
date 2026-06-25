'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, LayoutList, Clock, Camera, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { profileService, type ProfileSection } from '@/lib/services';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';

function sectionImageUrl(path: string | null): string | null {
    if (!path) return null;
    const url = path.startsWith('http://') || path.startsWith('https://') ? new URL(path) : null;
    const relativePath = url ? url.pathname.replace(/^\/media\//, '') : path;
    const base = typeof window !== 'undefined' ? `${window.location.origin}/media` : '/media';
    return `${base}/${relativePath}`;
}

export default function StrukturPage() {
    const [section, setSection] = useState<ProfileSection | null>(null);
    const [content, setContent] = useState('');
    const [sectionTitle, setSectionTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadSection(); }, []);

    const loadSection = async () => {
        try {
            setLoading(true);
            const sections = await profileService.getSections();
            const s = sections.find(s => s.key === 'struktur_organisasi') || null;
            setSection(s);
            if (s) {
                setContent(s.content);
                setSectionTitle(s.title);
                if (s.image) setImagePreview(sectionImageUrl(s.image));
            }
        } catch (err) {
            console.error(err);
            showError('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!section) return;
        setSaving(true);
        showLoading('Menyimpan...');
        try {
            if (imageFile) {
                await profileService.updateSectionWithImage(section.id, { content, title: sectionTitle }, imageFile);
            } else {
                await profileService.updateSection(section.id, { content, title: sectionTitle });
            }
            await loadSection();
            closeLoading();
            showSuccess('Berhasil disimpan');
        } catch (err) {
            closeLoading();
            showError('Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded-2xl w-1/3" />
                    <div className="h-96 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!section) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Section struktur organisasi tidak ditemukan.</p>
                    <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-4 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Profile
                    </Link>
                </div>
            </div>
        );
    }

    const hasChanges = content !== section.content || sectionTitle !== section.title || imageFile !== null;

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <LayoutList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Struktur Organisasi</h1>
                            <p className="text-amber-100 text-sm">Kelola konten dan gambar struktur organisasi instansi</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                            <LayoutList className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Konten Struktur</h2>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                Terakhir diperbarui: {new Date(section.updated_at).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul</label>
                        <input
                            type="text"
                            value={sectionTitle}
                            onChange={e => setSectionTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Struktur Organisasi</label>
                        <div className="flex items-start gap-6">
                            <div
                                className="w-64 h-44 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 group cursor-pointer hover:border-amber-300 transition-colors relative flex-shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400">Klik untuk upload gambar struktur</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200"
                                >
                                    <Camera className="w-4 h-4" />
                                    {imagePreview ? 'Ganti Gambar' : 'Pilih Gambar'}
                                </button>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={() => { setImagePreview(section.image ? sectionImageUrl(section.image) : null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="block text-xs text-red-500 hover:text-red-600 font-medium"
                                    >
                                        Hapus Gambar
                                    </button>
                                )}
                                <p className="text-xs text-gray-400">Format: JPG, PNG, SVG. Maks 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Konten (Markdown)</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={10}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm font-mono leading-relaxed"
                        />
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Markdown supported</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{content.length} karakter</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Link
                            href="/profile"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
                                hasChanges
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
