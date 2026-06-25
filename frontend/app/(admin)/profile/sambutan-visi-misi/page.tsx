'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, ScrollText, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import { profileService, type ProfileSection } from '@/lib/services';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';

export default function SambutanVisiMisiPage() {
    const [sambutan, setSambutan] = useState<ProfileSection | null>(null);
    const [visiMisi, setVisiMisi] = useState<ProfileSection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            setLoading(true);
            const sections = await profileService.getSections();
            setSambutan(sections.find(s => s.key === 'sambutan') || null);
            setVisiMisi(sections.find(s => s.key === 'visi_misi') || null);
        } catch (err) {
            console.error(err);
            showError('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: ProfileSection, field: string, value: string) => {
        showLoading('Menyimpan...');
        try {
            await profileService.updateSection(section.id, { [field]: value });
            await loadSections();
            closeLoading();
            showSuccess('Berhasil disimpan');
        } catch (err) {
            closeLoading();
            showError('Gagal menyimpan');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded-2xl w-1/3" />
                    <div className="h-80 bg-gray-200 rounded-2xl" />
                    <div className="h-80 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <ScrollText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Sambutan & Visi Misi</h1>
                            <p className="text-blue-100 text-sm">Kelola konten sambutan kepala badan serta visi dan misi instansi</p>
                        </div>
                    </div>
                </div>
            </div>

            {sambutan && <SectionEditor section={sambutan} icon={ScrollText} title="Sambutan Kepala Badan" onSave={handleSave} />}
            {visiMisi && <SectionEditor section={visiMisi} icon={Target} title="Visi & Misi" onSave={handleSave} />}
        </div>
    );
}

function SectionEditor({
    section,
    icon: Icon,
    title,
    onSave,
}: {
    section: ProfileSection;
    icon: any;
    title: string;
    onSave: (section: ProfileSection, field: string, value: string) => void;
}) {
    const [content, setContent] = useState(section.content);
    const [sectionTitle, setSectionTitle] = useState(section.title);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setContent(section.content);
        setSectionTitle(section.title);
    }, [section]);

    const hasChanges = content !== section.content || sectionTitle !== section.title;

    const handleSave = async () => {
        setSaving(true);
        await onSave(section, 'content', content);
        if (sectionTitle !== section.title) {
            await onSave(section, 'title', sectionTitle);
        }
        setSaving(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">{title}</h2>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            Terakhir diperbarui: {new Date(section.updated_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md font-medium">
                    {section.key}
                </span>
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
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-sm font-mono leading-relaxed"
                    />
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Markdown supported: **bold**, *italic*, - list, ## heading</span>
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
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
