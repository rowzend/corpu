'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Grid3X3, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { managementService, type PermissionModule } from '@/lib/services';
import { handleApiError } from '@/lib/api';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function ModulePage() {
    const t = useTranslations('admin.manajemen_aplikasi');
    const { card } = useThemeColors();
    const [items, setItems] = useState<PermissionModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<PermissionModule | null>(null);
    const [form, setForm] = useState({ nama_module: '', label_module: '', deskripsi_module: '', icon: 'fas fa-folder', order: 0, is_active: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setIsLoading(true); setError(null); const res = await managementService.getModules(); setItems(res || []); }
        catch (err) { const msg = handleApiError(err); setError(msg); showError(msg); }
        finally { setIsLoading(false); }
    };

    const handleNew = () => { setEditing(null); setForm({ nama_module: '', label_module: '', deskripsi_module: '', icon: 'fas fa-folder', order: 0, is_active: true }); setShowForm(true); };

    const handleEdit = (item: PermissionModule) => {
        setEditing(item);
        setForm({ nama_module: item.nama_module, label_module: item.label_module, deskripsi_module: item.deskripsi_module || '', icon: item.icon, order: item.order, is_active: item.is_active });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nama_module || !form.label_module) { showError('Nama module dan label harus diisi'); return; }
        try {
            setSaving(true); showLoading(t('saving'));
            if (editing) { await managementService.updateModule(editing.id, form); }
            else { await managementService.createModule(form); }
            setShowForm(false); await loadData(); closeLoading();
            showSuccess(editing ? t('update_success') : t('create_success'));
        } catch (err) { closeLoading(); showError(handleApiError(err)); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: PermissionModule) => {
        const confirmed = await showDeleteConfirm(item.label_module, 'module');
        if (!confirmed) return;
        try { showLoading(t('deleting')); await managementService.deleteModule(item.id); await loadData(); closeLoading(); showSuccess(t('delete_success')); }
        catch (err) { closeLoading(); showError(handleApiError(err)); }
    };

    const filtered = items.filter(i =>
        (i.nama_module || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.label_module || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className={`relative overflow-hidden rounded-2xl ${card.bgClass} ${card.borderClass} border p-6`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Grid3X3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-card-foreground">{t('manajemen_module')}</h1>
                            <p className="text-sm text-muted-foreground">{t('manajemen_module_desc')}</p>
                        </div>
                    </div>
                    <button onClick={handleNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"><Plus className="w-4 h-4" /> {t('add')}</button>
                </div>
            </div>
            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl p-4`}>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" />
                </div>
                {isLoading ? <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
                : error ? <div className="text-center py-12 text-red-500">{error}</div>
                : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">{t('empty')}</div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('nama_module')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('label_module')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('description')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">{t('active')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">{t('action')}</th>
                    </tr></thead>
                    <tbody>{filtered.map(item => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-card-foreground">{item.nama_module}</td>
                            <td className="py-3 px-4 text-card-foreground">{item.label_module}</td>
                            <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{item.deskripsi_module || '-'}</td>
                            <td className="py-3 px-4 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
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
                        <h2 className="text-lg font-bold text-card-foreground">{editing ? t('edit') : t('add')} {t('manajemen_module')}</h2>
                        <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('nama_module')}</label>
                            <input type="text" value={form.nama_module} onChange={e => setForm(p => ({ ...p, nama_module: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" required /></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('label_module')}</label>
                            <input type="text" value={form.label_module} onChange={e => setForm(p => ({ ...p, label_module: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" required /></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('description')}</label>
                            <textarea value={form.deskripsi_module} onChange={e => setForm(p => ({ ...p, deskripsi_module: e.target.value }))} rows={3}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('icon')}</label>
                                <input type="text" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                            <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('order')}</label>
                                <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                        </div>
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
