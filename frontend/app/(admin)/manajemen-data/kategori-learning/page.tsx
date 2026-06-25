'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import {
    FolderTree, Plus, Search, Trash2,
    ChevronRight, ChevronDown, Folder, FolderOpen,
    Layers, GitFork, BookOpen, PlayCircle,
    Edit, Save, Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from '@/lib/api/knowledge';
import { api, handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';
import { renderHtml } from '@/lib/utils';

export default function KategoriLearningPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '', description: '', parent: null as number | null, order_index: 0, is_active: true,
    });
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data: Category[] = [];
            const res1: any = await api.get('knowledge/categories/', { page_size: 50 }, true);
            if (res1?.results) data.push(...res1.results);
            if (res1?.next) {
                const res2: any = await api.get('knowledge/categories/', { page: 2, page_size: 50 }, true);
                if (res2?.results) data.push(...res2.results);
            }
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', handleApiError(error));
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await showDeleteConfirm(name, 'kategori');
        if (!confirmed) return;
        try {
            await deleteCategory(id);
            showToast(`Kategori "${name}" berhasil dihapus!`, 'success');
            fetchCategories();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus Kategori');
        }
    };

    const buildCategoryPath = (cat: Category, allCategories: Category[]): string => {
        if (!cat.parent) return cat.name;
        const parent = allCategories.find(c => c.id === cat.parent);
        if (!parent) return cat.name;
        return `${buildCategoryPath(parent, allCategories)} > ${cat.name}`;
    };

    const sortCategoriesHierarchy = (cats: Category[]): Category[] => {
        const childrenMap = new Map<number | null, Category[]>();
        const catIds = new Set<number>();
        for (const cat of cats) {
            catIds.add(cat.id);
            const key = cat.parent ?? null;
            if (!childrenMap.has(key)) childrenMap.set(key, []);
            childrenMap.get(key)!.push(cat);
        }
        for (const [, children] of childrenMap) {
            children.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.name.localeCompare(b.name));
        }
        const result: Category[] = [];
        const visited = new Set<number>();
        const traverse = (parentId: number | null) => {
            const children = childrenMap.get(parentId);
            if (!children) return;
            for (const child of children) {
                if (visited.has(child.id)) continue;
                visited.add(child.id);
                result.push(child);
                traverse(child.id);
            }
        };
        traverse(null);
        // Include orphans whose parent is not in the result set
        for (const cat of cats) {
            if (!visited.has(cat.id)) {
                visited.add(cat.id);
                result.push(cat);
                traverse(cat.id);
            }
        }
        return result;
    };

    const fetchParentCategories = async (): Promise<{ value: string | number; label: string }[]> => {
        try {
            const allCats: Category[] = [];
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const res: any = await api.get('knowledge/categories/', { page, page_size: 100 }, true);
                if (res?.results) allCats.push(...res.results);
                hasMore = !!res?.next;
                page++;
            }
            const sorted = sortCategoriesHierarchy(allCats);
            return [
                { value: '', label: '-- Tidak Ada (Root) --' },
                ...sorted.map(cat => {
                    const fullPath = cat.full_path || buildCategoryPath(cat, categories);
                    const parts = fullPath.split(' > ');
                    const depth = parts.length - 1;
                    const indent = '\u00A0'.repeat(4 * depth);
                    const label = depth > 0 ? `${indent}\u2514\u2500\u2500\u2500\u2500 ${cat.name}` : cat.name;
                    return { value: cat.id, label };
                }),
            ];
        } catch {
            return [];
        }
    };

    const handleCreate = async () => {
        if (!newCategory.name.trim()) {
            showError('Nama kategori harus diisi', 'Validasi');
            return;
        }
        try {
            setSaving(true);
            await createCategory({
                name: newCategory.name,
                description: newCategory.description,
                parent: newCategory.parent || undefined,
                order_index: newCategory.order_index,
                is_active: newCategory.is_active,
            });
            showToast('Kategori berhasil dibuat!', 'success');
            setShowCreateForm(false);
            setNewCategory({ name: '', description: '', parent: null, order_index: 0, is_active: true });
            fetchCategories();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Membuat Kategori');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setNewCategory({
            name: category.name,
            description: category.description || '',
            parent: category.parent,
            order_index: category.order_index || 0,
            is_active: category.is_active !== false,
        });
        setShowCreateForm(true);
    };

    const handleUpdate = async () => {
        if (!editingCategory || !newCategory.name.trim()) {
            showError('Nama kategori harus diisi', 'Validasi');
            return;
        }
        try {
            setSaving(true);
            await updateCategory(editingCategory.id, {
                name: newCategory.name,
                description: newCategory.description,
                parent: newCategory.parent || undefined,
                order_index: newCategory.order_index,
                is_active: newCategory.is_active,
            });
            showToast('Kategori berhasil diperbarui!', 'success');
            setShowCreateForm(false);
            setEditingCategory(null);
            setNewCategory({ name: '', description: '', parent: null, order_index: 0, is_active: true });
            fetchCategories();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memperbarui Kategori');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setEditingCategory(null);
        setNewCategory({ name: '', description: '', parent: null, order_index: 0, is_active: true });
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedCategories(newExpanded);
    };

    const buildTree = (items: Category[]): Category[] => {
        const map = new Map<number, Category>();
        const roots: Category[] = [];
        items.forEach(item => map.set(item.id, { ...item, children: [] }));
        items.forEach(item => {
            const node = map.get(item.id)!;
            if (item.parent) {
                const parent = map.get(item.parent);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        });
        return roots;
    };

    const filteredCategories = categories.filter(cat => {
        if (!cat) return false;
        return (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const categoryTree = buildTree(filteredCategories);
    const totalCourses = categories.reduce((sum, c) => sum + (c.course_count || 0), 0);

    const renderCategory = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const courseCount = category.course_count || 0;

        return (
            <div key={category.id}>
                <div
                    className={`flex items-center justify-between p-3.5 rounded-lg transition-all group ${
                        level === 0 ? 'bg-gray-50/50 hover:bg-gray-100/80' : 'hover:bg-gray-50'
                    }`}
                    style={{ paddingLeft: `${level * 24 + 14}px` }}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(category.id)}
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5 rounded hover:bg-gray-200 transition-colors">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        ) : <div className="w-5" />}

                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${isExpanded ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                            {isExpanded ? <FolderOpen className="w-4 h-4 text-indigo-600" /> : <Folder className="w-4 h-4 text-gray-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium truncate ${level === 0 ? 'text-gray-900' : 'text-gray-800'}`}
                                    dangerouslySetInnerHTML={renderHtml(category.name)} />
                                <div className="flex gap-1.5">
                                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-0">
                                        <PlayCircle className="w-3 h-3 mr-1 inline" />{courseCount}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-0">
                                        <BookOpen className="w-3 h-3 mr-1 inline" />{category.article_count || 0}
                                    </Badge>
                                </div>
                                {!category.is_active && (
                                    <Badge className="bg-gray-200 text-gray-600 text-xs border-0">Inactive</Badge>
                                )}
                            </div>
                {category.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 truncate"><span dangerouslySetInnerHTML={renderHtml(category.description)} /></p>
                                )}
                        </div>
                    </div>

                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="outline" size="sm"
                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                            onClick={() => handleEdit(category)}>
                            <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleDelete(category.id, category.name)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="ml-3 border-l-2 border-indigo-100 pl-1">
                        {category.children!.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-40 bg-gray-200 rounded-2xl"></div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                    <div className="h-80 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <FolderTree className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Kategori Learning</h1>
                                <p className="text-indigo-100 text-sm">Kelola kategori untuk kursus dan artikel</p>
                            </div>
                        </div>
                        <button onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" /> Tambah Kategori
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Kategori', value: categories.length, icon: FolderTree, color: 'bg-indigo-400/20 text-indigo-200' },
                            { label: 'Kategori Utama', value: categories.filter(c => !c.parent).length, icon: Layers, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Sub Kategori', value: categories.filter(c => c.parent).length, icon: GitFork, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Total Kursus', value: totalCourses, icon: PlayCircle, color: 'bg-emerald-400/20 text-emerald-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-indigo-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={showCreateForm} onOpenChange={(open) => { if (!open) handleCancel(); }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Nama Kategori <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={newCategory.name}
                                onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))}
                                placeholder="Nama kategori"
                                className="border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
                            />
                            <p className="text-xs text-gray-400 italic">
                                Gunakan <code className="text-xs bg-gray-100 px-1 rounded">&lt;i&gt;teks asing&lt;/i&gt;</code> untuk tulisan miring (contoh: <span dangerouslySetInnerHTML={{__html: 'Materi <i>Framework</i>'}} />)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Parent Kategori</Label>
                            <RemoteSearchSelect
                                fetchFn={fetchParentCategories}
                                value={newCategory.parent ?? ''}
                                onChange={value => setNewCategory(p => ({ ...p, parent: value ? Number(value) : null }))}
                                placeholder="Cari parent kategori..."
                                searchPlaceholder="Ketik untuk mencari..."
                                emptyText="Kategori tidak ditemukan"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Urutan</Label>
                            <Input
                                type="number"
                                min="0"
                                value={newCategory.order_index}
                                onChange={e => setNewCategory(p => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
                                className="border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
                            />
                            <p className="text-xs text-gray-400">Semakin kecil semakin di atas</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Status</Label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newCategory.is_active}
                                    onChange={e => setNewCategory(p => ({ ...p, is_active: e.target.checked }))}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Kategori Aktif</span>
                            </label>
                        </div>
                    </div>
                    <div className="space-y-2 mb-4">
                        <Label className="text-sm font-medium text-gray-700">Deskripsi</Label>
                        <Textarea
                            value={newCategory.description}
                            onChange={e => setNewCategory(p => ({ ...p, description: e.target.value }))}
                            placeholder="Deskripsi kategori (opsional)"
                            rows={2}
                            className="border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancel} disabled={saving}>
                            Batal
                        </Button>
                        <Button onClick={editingCategory ? handleUpdate : handleCreate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : editingCategory ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    Perbarui
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Simpan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Cari kategori..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" />
                </div>
            </div>

            {/* Category Tree */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Kategori</h2>
                    <Badge variant="secondary" className="text-xs">
                        <Layers className="w-3 h-3 mr-1 inline" />{categories.length} total
                    </Badge>
                </div>
                <div className="p-4">
                    {categoryTree.length > 0 ? (
                        <div className="space-y-0.5">
                            {categoryTree.map(category => renderCategory(category))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                                <FolderTree className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchTerm ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan membuat kategori pertama Anda'}
                            </p>
                            <button onClick={() => setShowCreateForm(true)}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200">
                                <Plus className="w-4 h-4" /> Tambah Kategori
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
