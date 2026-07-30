'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { managementService, type MenuItem, type MenuCategory } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

export default function MenuPage() {
    const t = useTranslations('admin.manajemen_aplikasi');
    const { card } = useThemeColors();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<MenuItem | null>(null);
    const [form, setForm] = useState({ name: '', type: 'module', icon: 'fas fa-folder', external_url: '', url_name: '', permission_key: '', category: '', parent: '', order: 0, is_active: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setIsLoading(true); setError(null);
            const res = await managementService.getMenuItems();
            setItems(res || []);
            const c = await managementService.getMenuCategories();
            setCategories(c || []);
        } catch { setError(t('load_error')); showError(t('load_error')); }
        finally { setIsLoading(false); }
    };

    const handleNew = () => { setEditing(null); setForm({ name: '', type: 'module', icon: 'fas fa-folder', external_url: '', url_name: '', permission_key: '', category: '', parent: '', order: 0, is_active: true }); setShowForm(true); };

    const handleEdit = (item: MenuItem) => {
        setEditing(item);
        setForm({ name: item.name, type: item.type, icon: item.icon, external_url: item.external_url || '', url_name: item.url_name || '', permission_key: item.permission_key || '', category: item.category.toString(), parent: item.parent?.toString() || '', order: item.order, is_active: item.is_active });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) { showError('Nama menu harus diisi'); return; }
        try {
            setSaving(true); showLoading(t('saving'));
            const data: any = { name: form.name, type: form.type, icon: form.icon, external_url: form.external_url || null, url_name: form.url_name || null, permission_key: form.permission_key || null, category: parseInt(form.category) || 0, order: form.order, is_active: form.is_active };
            if (form.parent) data.parent = parseInt(form.parent);
            else data.parent = null;
            if (editing) { await managementService.updateMenuItem(editing.id, data); }
            else { await managementService.createMenuItem(data); }
            setShowForm(false); await loadData(); closeLoading();
            showSuccess(editing ? t('update_success') : t('create_success'));
        } catch { closeLoading(); showError(t('save_error')); }
        finally { setSaving(false); }
    };

    const handleDelete = async (item: MenuItem) => {
        const confirmed = await showDeleteConfirm(item.name, 'menu');
        if (!confirmed) return;
        try { showLoading(t('deleting')); await managementService.deleteMenuItem(item.id); await loadData(); closeLoading(); showSuccess(t('delete_success')); }
        catch { closeLoading(); showError(t('delete_error')); }
    };

    const flattenItems = (menuItems: MenuItem[], level = 0): (MenuItem & { level: number })[] => {
        let result: (MenuItem & { level: number })[] = [];
        for (const item of menuItems) {
            result.push({ ...item, level });
            if (item.children?.length) result = result.concat(flattenItems(item.children, level + 1));
        }
        return result;
    };

    const allItems = flattenItems(items);
    const filtered = allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className={`relative overflow-hidden rounded-2xl ${card.bgClass} ${card.borderClass} border p-6`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Menu className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-card-foreground">{t('manajemen_menu')}</h1>
                            <p className="text-sm text-muted-foreground">{t('manajemen_menu_desc')}</p>
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
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('name')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('type')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('url')}</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('category')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">{t('active')}</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">{t('action')}</th>
                    </tr></thead>
                    <tbody>{filtered.map(item => {
                        const cat = categories.find(c => c.code === item.category);
                        return (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4" style={{ paddingLeft: `${16 + item.level * 20}px` }}>
                                <span className="font-medium text-card-foreground">{item.name}</span>
                                {item.type === 'menuItem' && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-medium">group</span>}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">{item.type}</td>
                            <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{item.external_url || item.url_name || '-'}</td>
                            <td className="py-3 px-4 text-muted-foreground">{cat?.name || item.category}</td>
                            <td className="py-3 px-4 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>{item.is_active ? 'Y' : 'N'}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                                <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                            </td>
                        </tr>);
                    })}</tbody>
                </table></div>}
            </div>
            {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className={`${card.bgClass} ${card.borderClass} border rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-card-foreground">{editing ? t('edit') : t('add')} {t('manajemen_menu')}</h2>
                        <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('name')}</label>
                            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('type')}</label>
                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                    <option value="module">module</option><option value="menuItem">menuItem</option>
                                </select></div>
                            <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('icon')}</label>
                                <input type="text" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('external_url')}</label>
                            <input type="text" value={form.external_url} onChange={e => setForm(p => ({ ...p, external_url: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('category')}</label>
                                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                    <option value="">-- {t('select')} --</option>
                                    {categories.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('order')}</label>
                                <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-card-foreground" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('parent')}</label>
                            <select value={form.parent} onChange={e => setForm(p => ({ ...p, parent: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value="">-- {t('none')} --</option>
                                {items.filter(i => i.type === 'menuItem').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select></div>
                        <div><label className="block text-sm font-medium text-card-foreground mb-1">{t('permission_key')}</label>
                            <input type="text" value={form.permission_key} onChange={e => setForm(p => ({ ...p, permission_key: e.target.value }))}
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
