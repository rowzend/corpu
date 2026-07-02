'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gavel, Plus, Trash2, X, Search } from 'lucide-react';
import { managementService, type PermissionRule, type PermissionFunction, type PermissionControl, type PermissionModule } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function RulesPage() {
    const t = useTranslations('admin.manajemen_aplikasi');
    const { card } = useThemeColors();
    const [items, setItems] = useState<PermissionRule[]>([]);
    const [modules, setModules] = useState<PermissionModule[]>([]);
    const [controls, setControls] = useState<PermissionControl[]>([]);
    const [functions, setFunctions] = useState<PermissionFunction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterModule, setFilterModule] = useState<string>('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ module_id: '', control_id: '', function_id: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setIsLoading(true); setError(null);
            const res = await managementService.getRules();
            setItems(res || []);
            const m = await managementService.getModules();
            setModules(m || []);
            const cres = await managementService.getControls({ page_size: 999 });
            setControls(cres.data || []);
            const fres = await managementService.getFunctions({ page_size: 999 });
            setFunctions(fres.data || []);
        } catch { setError(t('load_error')); showError(t('load_error')); }
        finally { setIsLoading(false); }
    };

    const handleNew = () => { setForm({ module_id: '', control_id: '', function_id: '' }); setShowForm(true); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.module_id || !form.control_id || !form.function_id) { showError('Semua field harus diisi'); return; }
        try {
            setSaving(true); showLoading(t('saving'));
            await managementService.createRule({ module: parseInt(form.module_id), control: parseInt(form.control_id), function: parseInt(form.function_id) });
            setShowForm(false); await loadData(); closeLoading();
            showSuccess(t('create_success'));
        } catch { closeLoading(); showError(t('save_error')); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: PermissionRule) => {
        const confirmed = await showDeleteConfirm(item.permission_string, 'rule');
        if (!confirmed) return;
        try { showLoading(t('deleting')); await managementService.deleteRule(item.id); await loadData(); closeLoading(); showSuccess(t('delete_success')); }
        catch { closeLoading(); showError(t('delete_error')); }
    };

    const filtered = items.filter(i => {
        if (search && !i.permission_string.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterModule && i.module.toString() !== filterModule) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className={`relative overflow-hidden rounded-2xl ${card.bgClass} ${card.borderClass} border p-6`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Gavel className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-card-foreground">{t('manajemen_rules')}</h1>
                            <p className="text-sm text-muted-foreground">{t('manajemen_rules_desc')}</p>
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
                    <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
                        className="px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        <option value="">{t('all_modules')}</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.label_module}</option>)}
                    </select>
                </div>
                {isLoading ? <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
                : error ? <div className="text-center py-12 text-red-500">{error}</div>
                : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">{t('empty')}</div>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('module')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('control')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('function')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('permission_string')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">{t('action')}</th>
                    </tr></thead>
                    <tbody>{filtered.map(item => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-card-foreground">{item.module_name}</td>
                            <td className="py-3 px-4 text-card-foreground">{item.control_name}</td>
                            <td className="py-3 px-4 text-card-foreground">{item.function_name}</td>
                            <td className="py-3 px-4"><code className="px-2 py-0.5 bg-muted rounded text-xs font-mono text-card-foreground">{item.permission_string}</code></td>
                            <td className="py-3 px-4 text-right">
                                <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table></div>}
            </div>
            {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className={`${card.bgClass} ${card.borderClass} border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-card-foreground">{t('add')} {t('manajemen_rules')}</h2>
                        <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('module')}</label>
                            <select value={form.module_id} onChange={e => setForm(p => ({ ...p, module_id: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                <option value="">-- {t('select')} --</option>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.label_module}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('control')}</label>
                            <select value={form.control_id} onChange={e => setForm(p => ({ ...p, control_id: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                <option value="">-- {t('select')} --</option>
                                {controls.map(c => <option key={c.id} value={c.id}>{c.label_kontrol}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('function')}</label>
                            <select value={form.function_id} onChange={e => setForm(p => ({ ...p, function_id: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50" required>
                                <option value="">-- {t('select')} --</option>
                                {functions.map(f => <option key={f.id} value={f.id}>{f.label_fungsi}</option>)}
                            </select></div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors">{t('cancel')}</button>
                            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50">
                                {saving ? t('saving') : t('add')}</button>
                        </div>
                    </form>
                </div>
            </div>}
        </div>
    );
}
