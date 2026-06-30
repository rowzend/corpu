'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Palette, Tag } from 'lucide-react';
import { createTag } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';

const PRESET_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280',
];

export default function CreateTagPage() {
    const router = useRouter();
    const t = useTranslations('admin.knowledge_tags');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleColorSelect = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await createTag(formData);
            router.push('/admin/knowledge/tags');
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-700 to-red-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">{t('dialog_title_add')}</h1>
                        <p className="text-orange-100 text-sm">{t('dialog_desc_create')}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-card-foreground">{t('section_info')}</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-card-foreground">
                                {t('label_name')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t('name_placeholder')}
                                required
                                className="border-border focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-card-foreground">{t('label_description')}</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t('desc_placeholder')}
                                rows={3}
                                className="border-border focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-card-foreground">{t('label_color')}</Label>

                            <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-muted">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                    style={{ backgroundColor: formData.color }}
                                >
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'T'}
                                </div>
                                <div>
                                    <span
                                        className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                                        style={{ backgroundColor: `${formData.color}20`, color: formData.color }}
                                    >
                                        {formData.name || t('preview_fallback')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">{t('preset_colors')}</Label>
                                <div className="grid grid-cols-10 gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => handleColorSelect(color)}
                                            className={`w-8 h-8 rounded-xl transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="color" className="text-xs text-muted-foreground mb-2 block">{t('custom_color')}</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        id="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        className="w-12 h-10 border border-border rounded-xl cursor-pointer"
                                    />
                                    <Input
                                        value={formData.color}
                                        onChange={handleChange}
                                        name="color"
                                        placeholder={t('color_placeholder')}
                                        className="flex-1 border-border focus:border-orange-500 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-4 h-4 text-orange-600 border-border rounded focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-card-foreground">{t('label_active')}</span>
                        </label>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
                                ) : (
                                    <><Save className="w-4 h-4" /> {t('submit_add')}</>
                                )}
                            </button>
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                                {t('cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
