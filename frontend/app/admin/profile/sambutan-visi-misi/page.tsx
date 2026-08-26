'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, ScrollText, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import { profileService, type ProfileSection } from '@/lib/services';
import { handleApiError } from '@/lib/api';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';
import { useTranslations } from 'next-intl';

export default function SambutanVisiMisiPage() {
    const t = useTranslations('admin.sambutan');
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
            showError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: ProfileSection, field: string, value: string) => {
        showLoading(t('saving'));
        try {
            await profileService.updateSection(section.id, { [field]: value });
            await loadSections();
            closeLoading();
            showSuccess(t('save_success'));
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted rounded-2xl w-1/3" />
                    <div className="h-80 bg-muted rounded-2xl" />
                    <div className="h-80 bg-muted rounded-2xl" />
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
                            <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                            <p className="text-blue-100 text-sm">{t('page_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {sambutan && <SectionEditor section={sambutan} icon={ScrollText} title={t('section_sambutan')} onSave={handleSave} t={t} />}
            {visiMisi && <SectionEditor section={visiMisi} icon={Target} title={t('section_visi_misi')} onSave={handleSave} t={t} />}
        </div>
    );
}

function SectionEditor({
    section,
    icon: Icon,
    title,
    onSave,
    t,
}: {
    section: ProfileSection;
    icon: any;
    title: string;
    onSave: (section: ProfileSection, field: string, value: string) => void;
    t: any;
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
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-card-foreground">{title}</h2>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {t('last_updated_prefix')}{new Date(section.updated_at).toLocaleString('id-ID')}
                            </span>
                    </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md font-medium">
                    {section.key}
                </span>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_title')}</label>
                    <input
                        type="text"
                        value={sectionTitle}
                        onChange={e => setSectionTitle(e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-muted focus:bg-card transition-colors text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_content')}</label>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-muted focus:bg-card transition-colors text-sm font-mono leading-relaxed"
                    />
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{t('markdown_hint')}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>{content.length}{t('chars_suffix')}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Link
                        href="/admin/profile"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('back')}
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
                            hasChanges
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-200'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                    >
                        <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                        {saving ? t('saving') : t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
