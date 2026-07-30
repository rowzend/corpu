'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, FolderTree } from 'lucide-react';
import { createCategory, getCategories, type Category } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';

export default function CreateCategoryPage() {
    const router = useRouter();
    const t = useTranslations('admin.knowledge_categories');
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent: null as number | null,
        order_index: 0,
        is_active: true,
    });

    useEffect(() => {
        fetchParentCategories();
    }, []);

    const fetchParentCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await getCategories();
            let categoriesData: Category[] = [];
            if (response?.results) categoriesData = response.results;
            else if (Array.isArray(response)) categoriesData = response;
            setParentCategories(categoriesData);
        } catch (error) {
            console.error('Failed to fetch categories:', handleApiError(error));
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'parent') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseInt(value) }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await createCategory(formData);
            showToast(t('create_success'), 'success');
            router.push('/admin/knowledge/categories');
        } catch (err) {
            const errorMsg = handleApiError(err);
            setError(errorMsg);
            showError(errorMsg, t('create_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-6">
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
                        <p className="text-violet-100 text-sm">{t('dialog_desc_create')}</p>
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
                                className="border-border focus:border-violet-500 focus:ring-violet-500"
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
                                className="border-border focus:border-violet-500 focus:ring-violet-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parent" className="text-sm font-medium text-card-foreground">{t('label_parent')}</Label>
                            <select
                                id="parent"
                                name="parent"
                                value={formData.parent || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-muted text-sm"
                                disabled={loadingCategories}
                            >
                                <option value="">{t('parent_none')}</option>
                                {parentCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.parent_name ? `${cat.parent_name} > ` : ''}{cat.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">{t('parent_help')}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="order_index" className="text-sm font-medium text-card-foreground">{t('label_order')}</Label>
                            <Input
                                id="order_index"
                                name="order_index"
                                type="number"
                                min="0"
                                value={formData.order_index}
                                onChange={handleChange}
                                className="border-border focus:border-violet-500 focus:ring-violet-500"
                            />
                            <p className="text-xs text-muted-foreground">{t('order_help')}</p>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-4 h-4 text-violet-600 border-border rounded focus:ring-violet-500"
                            />
                            <span className="text-sm font-medium text-card-foreground">{t('label_active')}</span>
                        </label>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
