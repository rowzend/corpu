'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Pencil, Trash2, X, ChevronRight, ChevronDown,
    CheckCircle, XCircle, Layers, FolderTree, Save
} from 'lucide-react';
import { profileService, type Position } from '@/lib/services';
import { handleApiError } from '@/lib/api';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useTranslations } from 'next-intl';

function flattenTree(positions: Position[], depth = 0): { pos: Position; depth: number }[] {
    const result: { pos: Position; depth: number }[] = [];
    for (const p of positions) {
        result.push({ pos: p, depth });
        if (p.children?.length) {
            result.push(...flattenTree(p.children, depth + 1));
        }
    }
    return result;
}

const emptyForm = { name: '', description: '', parent: null as number | null, order: 0, is_active: true };

export default function PositionPage() {
    const t = useTranslations('admin.position');
    const [tree, setTree] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Position | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setTree(await profileService.getPositions());
        } catch (err) {
            console.error(err);
            showError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const allFlat = useMemo(() => flattenTree(tree), [tree]);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const resetForm = () => {
        setForm({ ...emptyForm });
        setEditing(null);
        setShowForm(false);
    };

    const openAdd = () => {
        resetForm();
        setShowForm(true);
    };

    const openEdit = (pos: Position) => {
        setForm({
            name: pos.name,
            description: pos.description || '',
            parent: pos.parent,
            order: pos.order,
            is_active: pos.is_active,
        });
        setEditing(pos);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            showError('Nama jabatan harus diisi');
            return;
        }
        showLoading(editing ? 'Memperbarui...' : 'Menyimpan...');
        try {
            if (editing) {
                await profileService.updatePosition(editing.id, form);
                showSuccess('Jabatan berhasil diperbarui');
            } else {
                await profileService.createPosition(form);
                showSuccess('Jabatan berhasil ditambahkan');
            }
            await loadData();
            resetForm();
        } catch (err) {
            showError(handleApiError(err));
        } finally {
            closeLoading();
        }
    };

    const handleDelete = async (pos: Position) => {
        const confirmed = await showDeleteConfirm(pos.name, 'jabatan');
        if (!confirmed) return;
        showLoading('Menghapus...');
        try {
            await profileService.deletePosition(pos.id);
            await loadData();
            showSuccess('Jabatan berhasil dihapus');
        } catch (err) {
            showError(handleApiError(err));
        } finally {
            closeLoading();
        }
    };

    const renderNode = (pos: Position, depth: number = 0) => {
        const hasChildren = (pos.children?.length ?? 0) > 0;
        const isExpanded = expandedIds.has(pos.id);

        return (
            <div key={pos.id}>
                <div
                    className="group flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                    style={{ marginLeft: depth * 28 }}
                    onClick={() => toggleExpand(pos.id)}
                >
                    <button className="flex-shrink-0 text-muted-foreground">
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        ) : (
                            <span className="w-4 h-4 inline-block" />
                        )}
                    </button>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        depth === 0
                            ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                            : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                    }`}>
                        <Layers className="w-4 h-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground">{pos.name}</p>
                        {pos.description && (
                            <p className="text-xs text-muted-foreground truncate">{pos.description}</p>
                        )}
                    </div>

                    {hasChildren && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {pos.children?.length} sub
                        </span>
                    )}

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        pos.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}>
                        {pos.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {pos.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>

                    <button onClick={(e) => { e.stopPropagation(); openEdit(pos); }}
                        className="p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(pos); }}
                        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {isExpanded && hasChildren && (
                    <div className="border-l-2 border-emerald-200 ml-12 pl-4 mt-2 space-y-2">
                        {pos.children?.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8">
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <FolderTree className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Master Jabatan</h1>
                            <p className="text-indigo-100 text-sm">Kelola struktur jabatan organisasi</p>
                        </div>
                    </div>
                    <button onClick={openAdd}
                        className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg">
                        <Plus className="w-4 h-4" /> Tambah Jabatan
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">
                                    {editing ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}
                                </h2>
                                <button onClick={resetForm} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">
                                    Nama Jabatan <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-muted focus:bg-card"
                                    placeholder="Nama jabatan" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">
                                    Jabatan Induk
                                </label>
                                <select
                                    value={form.parent ?? ''}
                                    onChange={e => setForm(f => ({ ...f, parent: e.target.value ? Number(e.target.value) : null }))}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-muted focus:bg-card"
                                >
                                    <option value="">-- Root (Induk) --</option>
                                    {allFlat.filter(({ pos }) => pos.id !== editing?.id).map(({ pos, depth }) => (
                                        <option key={pos.id} value={pos.id}>
                                            {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '└ ' : ''}{pos.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Urutan</label>
                                    <input type="number" value={form.order}
                                        onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-muted focus:bg-card" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-card-foreground mb-1.5">Status</label>
                                    <select value={form.is_active ? 'true' : 'false'}
                                        onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-muted focus:bg-card">
                                        <option value="true">Aktif</option>
                                        <option value="false">Nonaktif</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-card-foreground mb-1.5">Deskripsi</label>
                                <textarea value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-muted focus:bg-card resize-none"
                                    placeholder="Deskripsi jabatan" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button onClick={resetForm}
                                    className="px-5 py-2.5 text-sm font-medium text-card-foreground bg-muted hover:bg-muted rounded-xl transition-colors">
                                    Batal
                                </button>
                                <button onClick={handleSubmit}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl transition-all shadow-lg">
                                    <Save className="w-4 h-4" />
                                    {editing ? 'Simpan Perubahan' : 'Tambah Jabatan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tree List */}
            {loading ? (
                <div className="space-y-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                            <div className="h-5 bg-muted rounded w-48" />
                        </div>
                    ))}
                </div>
            ) : tree.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-16 text-center">
                    <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">Belum Ada Jabatan</h3>
                    <p className="text-muted-foreground mb-6">Belum ada data jabatan yang tersedia.</p>
                    <button onClick={openAdd}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg">
                        <Plus className="w-4 h-4" /> Tambah Jabatan Pertama
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {tree.map(pos => renderNode(pos, 0))}
                </div>
            )}
        </div>
    );
}
