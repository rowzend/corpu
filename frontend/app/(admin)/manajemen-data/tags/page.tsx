'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tags, Plus, Search, Edit, Trash2,
    Palette, BookOpen, PlayCircle, Hash
} from 'lucide-react';
import { getTags, createTag, updateTag, deleteTag, type Tag } from '@/lib/api/knowledge';
import { handleApiError } from '@/lib/api';
import { showDeleteConfirm, showToast, showError } from '@/lib/sweetalert';
import { renderHtml } from '@/lib/utils';

const PRESET_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

export default function ManajemenTagsPage() {
    const router = useRouter();
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', color: '#3B82F6', is_active: true,
    });

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const response = await getTags();
            let data: Tag[] = [];
            if (response?.results) data = response.results;
            else if ((response as any)?.data) data = (response as any).data;
            else if (Array.isArray(response)) data = response;
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch tags:', handleApiError(error));
            setTags([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTags = tags.filter(tag => {
        const term = searchTerm.toLowerCase();
        return (tag.name || '').toLowerCase().includes(term) ||
            (tag.description || '').toLowerCase().includes(term);
    });

    const totalCourses = tags.reduce((sum, t) => sum + ((t as any).course_count || 0), 0);
    const totalArticles = tags.reduce((sum, t) => sum + (t.article_count || 0), 0);

    const openCreate = () => {
        setEditingTag(null);
        setFormData({ name: '', description: '', color: '#3B82F6', is_active: true });
        setShowCreateForm(true);
    };

    const openEdit = (tag: Tag) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            description: tag.description || '',
            color: tag.color || '#3B82F6',
            is_active: tag.is_active,
        });
        setShowCreateForm(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showError('Nama tag harus diisi', 'Validasi');
            return;
        }
        try {
            setSaving(true);
            if (editingTag) {
                await updateTag(editingTag.id, formData);
                showToast(`Tag "${formData.name}" berhasil diupdate!`, 'success');
            } else {
                await createTag(formData);
                showToast('Tag berhasil dibuat!', 'success');
            }
            setShowCreateForm(false);
            setEditingTag(null);
            fetchTags();
        } catch (error) {
            showError(handleApiError(error), editingTag ? 'Gagal Mengupdate Tag' : 'Gagal Membuat Tag');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const confirmed = await showDeleteConfirm(name, 'tag');
        if (!confirmed) return;
        try {
            await deleteTag(id);
            showToast(`Tag "${name}" berhasil dihapus!`, 'success');
            fetchTags();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus Tag');
        }
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-700 p-8">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                                <Tags className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Tags</h1>
                                <p className="text-orange-100 text-sm">Kelola tag untuk artikel dan kursus</p>
                            </div>
                        </div>
                        <button onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
                            <Plus className="w-4 h-4" /> Tambah Tag
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Tags', value: tags.length, icon: Tags, color: 'bg-orange-400/20 text-orange-200' },
                            { label: 'Aktif', value: tags.filter(t => t.is_active).length, icon: Hash, color: 'bg-green-400/20 text-green-200' },
                            { label: 'Total Artikel', value: totalArticles, icon: BookOpen, color: 'bg-blue-400/20 text-blue-200' },
                            { label: 'Total Kursus', value: totalCourses, icon: PlayCircle, color: 'bg-emerald-400/20 text-emerald-200' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-orange-200">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create/Edit Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingTag ? 'Edit Tag' : 'Tambah Tag Baru'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nama Tag <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                placeholder="Nama tag" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Warna</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <button key={c} type="button"
                                        onClick={() => setFormData(p => ({ ...p, color: c }))}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: c }} />
                                ))}
                                <input type="color" value={formData.color}
                                    onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                            placeholder="Deskripsi tag (opsional)" rows={2}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="tag-is-active" checked={formData.is_active}
                            onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <label htmlFor="tag-is-active" className="text-sm text-gray-700">Aktif</label>

                        {formData.name && (
                            <Badge className="ml-auto text-xs" style={{ backgroundColor: formData.color, color: '#fff' }}
                                dangerouslySetInnerHTML={renderHtml(formData.name)} />
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => { setShowCreateForm(false); setEditingTag(null); }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                            Batal
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-xl font-semibold text-sm">
                            {saving ? 'Menyimpan...' : editingTag ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Cari tag..." value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white transition-colors text-sm" />
                </div>
            </div>

            {/* Tag Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Tag</h2>
                    <Badge variant="secondary" className="text-xs">
                        <Hash className="w-3 h-3 mr-1 inline" />{tags.length} total
                    </Badge>
                </div>
                <div className="p-6">
                    {filteredTags.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTags.map(tag => {
                                const courseCount = (tag as any).course_count || 0;
                                return (
                                    <div key={tag.id}
                                        className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-orange-200 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                                    style={{ backgroundColor: tag.color || '#3B82F6' }}>
                                                    {tag.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900" dangerouslySetInnerHTML={renderHtml(tag.name)} />
                                                    <p className="text-xs text-gray-400">#{tag.slug}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                                                    onClick={() => openEdit(tag)}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="outline" size="sm"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                    onClick={() => handleDelete(tag.id, tag.name)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {tag.description && (
                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2"><span dangerouslySetInnerHTML={renderHtml(tag.description)} /></p>
                                        )}

                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-0">
                                                <BookOpen className="w-3 h-3 mr-1 inline" />{tag.article_count || 0} Artikel
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-0">
                                                <PlayCircle className="w-3 h-3 mr-1 inline" />{courseCount} Kursus
                                            </Badge>
                                            {!tag.is_active && (
                                                <Badge className="bg-gray-200 text-gray-600 text-xs border-0">Inactive</Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                                <Tags className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchTerm ? 'Tag tidak ditemukan' : 'Belum ada tag'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan membuat tag pertama Anda'}
                            </p>
                            <button onClick={openCreate}
                                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-200">
                                <Plus className="w-4 h-4" /> Tambah Tag
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
