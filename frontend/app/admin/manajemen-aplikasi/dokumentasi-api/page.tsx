'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { managementService, type ApiDocumentation } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    POST: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    PUT: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    PATCH: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export default function ApiDocumentationPage() {
    const t = useTranslations('admin.manajemen_aplikasi');
    const { card } = useThemeColors();
    const [items, setItems] = useState<ApiDocumentation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ApiDocumentation | null>(null);
    const [form, setForm] = useState({ method_type: 'GET', url: '', description: '', is_active: true, parameters: null });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setIsLoading(true); setError(null); const res = await managementService.getApiDocs(); setItems(res.data || []); }
        catch { setError(t('load_error')); showError(t('load_error')); }
        finally { setIsLoading(false); }
    };

    const handleNew = () => { setEditing(null); setForm({ method_type: 'GET', url: '', description: '', is_active: true, parameters: null }); setShowForm(true); };

    const handleEdit = (item: ApiDocumentation) => {
        setEditing(item);
        setForm({ method_type: item.method_type, url: item.url, description: item.description || '', is_active: item.is_active, parameters: item.parameters });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.url) { showError('URL harus diisi'); return; }
        try {
            setSaving(true); showLoading(t('saving'));
            if (editing) { await managementService.updateApiDoc(editing.id, form); }
            else { await managementService.createApiDoc(form); }
            setShowForm(false); await loadData(); closeLoading();
            showSuccess(editing ? t('update_success') : t('create_success'));
        } catch { closeLoading(); showError(t('save_error')); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: ApiDocumentation) => {
        const confirmed = await showDeleteConfirm(item.url, 'API doc');
        if (!confirmed) return;
        try { showLoading(t('deleting')); await managementService.deleteApiDoc(item.id); await loadData(); closeLoading(); showSuccess(t('delete_success')); }
        catch { closeLoading(); showError(t('delete_error')); }
    };

    const filtered = items.filter(i => {
        if (search && !i.url.toLowerCase().includes(search.toLowerCase()) && !(i.description || '').toLowerCase().includes(search.toLowerCase())) return false;
        if (methodFilter && i.method_type !== methodFilter) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className={`relative overflow-hidden rounded-2xl ${card.bgClass} ${card.borderClass} border p-6`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-card-foreground">{t('dokumentasi_api')}</h1>
                            <p className="text-sm text-muted-foreground">{t('dokumentasi_api_desc')}</p>
                        </div>
                    </div>
                    <button onClick={handleNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"><Plus className="w-4 h-4" /> {t('add')}</button>
                </div>
            </div>
            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl p-4`}>
                <div className="flex gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" />
                    </div>
                    <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        <option value="">{t('all_methods')}</option>
                        <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option><option value="DELETE">DELETE</option>
                    </select>
                </div>
                {isLoading ? <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
                : error ? <div className="text-center py-12 text-red-500">{error}</div>
                : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">{t('empty')}</div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('method')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('url')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('description')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">{t('active')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">{t('action')}</th>
                    </tr></thead>
                    <tbody>{filtered.map(item => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[item.method_type] || 'bg-gray-100 text-gray-700'}`}>{item.method_type}</span></td>
                            <td className="py-3 px-4"><code className="text-card-foreground font-mono text-xs">{item.url}</code></td>
                            <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{item.description || '-'}</td>
                            <td className="py-3 px-4 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>{item.is_active ? 'Y' : 'N'}</span></td>
                            <td className="py-3 px-4 text-right">
                                <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table></div>}
            </div>
            {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className={`${card.bgClass} ${card.borderClass} border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-card-foreground">{editing ? t('edit') : t('add')} {t('dokumentasi_api')}</h2>
                        <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('method')}</label>
                            <select value={form.method_type} onChange={e => setForm(p => ({ ...p, method_type: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option><option value="DELETE">DELETE</option>
                            </select></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('url')}</label>
                            <input type="text" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" required /></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('description')}</label>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                                className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="is_active" className="text-sm text-card-foreground">{t('active')}</label>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors">{t('cancel')}</button>
                            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50">
                                {saving ? t('saving') : editing ? t('save') : t('add')}</button>
                        </div>
                    </form>
                </div>
            </div>}
        </div>
    );
}
