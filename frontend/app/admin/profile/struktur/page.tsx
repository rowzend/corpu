'use client';

import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Save, LayoutList, Clock, Camera, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { profileService, type ProfileSection } from '@/lib/services';
import { showSuccess, showError, showLoading, closeLoading } from '@/lib/sweetalert';
import { useTranslations } from 'next-intl';

function sectionImageUrl(path: string | null): string | null {
    if (!path) return null;
    const url = path.startsWith('http://') || path.startsWith('https://') ? new URL(path) : null;
    const relativePath = url ? url.pathname.replace(/^\/media\//, '') : path;
    const base = typeof window !== 'undefined' ? `${window.location.origin}/media` : '/media';
    return `${base}/${relativePath}`;
}

export default function StrukturPage() {
    const t = useTranslations('admin.struktur');
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
            showError(t('load_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!section) return;
        setSaving(true);
        showLoading(t('saving'));
        try {
            if (imageFile) {
                await profileService.updateSectionWithImage(section.id, { content, title: sectionTitle }, imageFile);
            } else {
                await profileService.updateSection(section.id, { content, title: sectionTitle });
            }
            await loadSection();
            closeLoading();
            showSuccess(t('save_success'));
        } catch (err) {
            closeLoading();
            showError(t('save_error'));
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
                    <div className="h-10 bg-muted rounded-2xl w-1/3" />
                    <div className="h-96 bg-muted rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!section) {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-16 text-center">
                    <LayoutList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{t('not_found')}</p>
                    <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-4 font-medium">
                        <ArrowLeft className="w-4 h-4" /> {t('back_to_profile')}
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
                            <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                            <p className="text-amber-100 text-sm">{t('page_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                            <LayoutList className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-card-foreground">{t('section_title')}</h2>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {t('last_updated_prefix')}{new Date(section.updated_at).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_title')}</label>
                        <input
                            type="text"
                            value={sectionTitle}
                            onChange={e => setSectionTitle(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-muted focus:bg-card transition-colors text-sm"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">{t('label_image')}</label>
                        <div className="flex items-start gap-6">
                            <div
                                className="w-64 h-44 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted group cursor-pointer hover:border-amber-300 transition-colors relative flex-shrink-0"
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
                                        <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">{t('upload_hint')}</p>
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
                                    {imagePreview ? t('change_image') : t('select_image')}
                                </button>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={() => { setImagePreview(section.image ? sectionImageUrl(section.image) : null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="block text-xs text-red-500 hover:text-red-600 font-medium"
                                    >
                                        {t('remove_image')}
                                    </button>
                                )}
                                <p className="text-xs text-muted-foreground">{t('format_hint')}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_content')}</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={10}
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
                            href="/profile"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> {t('back')}
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
                                hasChanges
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-200'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                            {saving ? t('saving') : t('save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
