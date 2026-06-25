'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Building2, Clock } from 'lucide-react';
import Link from 'next/link';
import { profileService, type ProfileSection } from '@/lib/services';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';

export default function SejarahPage() {
    const [section, setSection] = useState<ProfileSection | null>(null);
    const [content, setContent] = useState('');
    const [sectionTitle, setSectionTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSection();
    }, []);

    const loadSection = async () => {
        try {
            setLoading(true);
            const sections = await profileService.getSections();
            const s = sections.find(s => s.key === 'sejarah') || null;
            setSection(s);
            if (s) {
                setContent(s.content);
                setSectionTitle(s.title);
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
            const data: Partial<ProfileSection> = { content };
            if (sectionTitle !== section.title) data.title = sectionTitle;
            await profileService.updateSection(section.id, data);
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
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Section sejarah tidak ditemukan.</p>
                    <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-4 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Profile
                    </Link>
                </div>
            </div>
        );
    }

    const hasChanges = content !== section.content || sectionTitle !== section.title;

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Sejarah CORPU</h1>
                            <p className="text-purple-100 text-sm">Kelola konten sejarah Corporate University</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Konten Sejarah</h2>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                Terakhir diperbarui: {new Date(section.updated_at).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul</label>
                        <input
                            type="text"
                            value={sectionTitle}
                            onChange={e => setSectionTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Konten</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={16}
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
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-200'
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
