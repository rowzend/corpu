'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import { ArrowLeft, Save, Loader, BookOpen, GraduationCap, Clock, Image as ImageIcon, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { createCourse } from '@/lib/api/learning';
import { api, handleApiError } from '@/lib/api';
import { showToast, showError } from '@/lib/sweetalert';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const sortCategoriesHierarchy = (cats: any[]): any[] => {
    const childrenMap = new Map<number | null, any[]>();
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
    const result: any[] = [];
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
    for (const cat of cats) {
        if (!visited.has(cat.id)) {
            visited.add(cat.id);
            result.push(cat);
            traverse(cat.id);
        }
    }
    return result;
};

const buildCategoryPath = (cat: any, allCats: any[]): string => {
    if (!cat.parent) return cat.name;
    const parent = allCats.find((c: any) => c.id === cat.parent);
    if (!parent) return cat.name;
    return `${buildCategoryPath(parent, allCats)} > ${cat.name}`;
};

export default function CreateCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        short_description: '',
        level: 'beginner',
        duration_minutes: 60,
        status: 'draft',
        thumbnail: '',
        category_id: null as number | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'title') {
            const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            setFormData(prev => ({ ...prev, [name]: value, slug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { showError('Judul kursus harus diisi', 'Validasi'); return; }
        if (!formData.description.trim()) { showError('Deskripsi harus diisi', 'Validasi'); return; }
        if (!formData.slug.trim()) { showError('Slug harus diisi', 'Validasi'); return; }
        try {
            setLoading(true);
            await createCourse(formData);
            showToast('Kursus berhasil dibuat!', 'success');
            router.push('/learning/courses');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Membuat Kursus');
        } finally { setLoading(false); }
    };

    // Fetch categories dengan hirarki untuk dropdown (sama seperti knowledge/create)
    const fetchCategories = useCallback(async (): Promise<{ value: string | number; label: string }[]> => {
        try {
            const allCats: any[] = [];
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const res: any = await api.get('knowledge/categories/', { page, page_size: 100 }, true);
                if (res?.results) allCats.push(...res.results);
                hasMore = !!res?.next;
                page++;
            }
            
            const active = allCats.filter((c: any) => c.is_active);
            const sorted = sortCategoriesHierarchy(active);
            
            return [
                { value: '', label: '-- Pilih Kategori (Opsional) --' },
                ...sorted.map(cat => {
                    const fullPath = cat.full_path || buildCategoryPath(cat, allCats);
                    const parts = fullPath.split(' > ');
                    const depth = parts.length - 1;
                    const indent = '\u00A0'.repeat(4 * depth);
                    const label = depth > 0 ? `${indent}\u2514\u2500\u2500\u2500\u2500 ${cat.name}` : cat.name;
                    return { value: cat.id, label };
                }),
            ];
        } catch {
            return [{ value: '', label: '-- Pilih Kategori (Opsional) --' }];
        }
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button onClick={() => router.back()} disabled={loading}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Buat Kursus Baru</h1>
                        <p className="text-indigo-100 text-sm">Isi formulir di bawah untuk membuat kursus baru</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Dasar</h2>
                    </div>
                    <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-medium text-gray-700">Judul Kursus <span className="text-red-500">*</span></Label>
                                <Input id="title" name="title" placeholder="Contoh: Python untuk Pemula" value={formData.title}
                                    onChange={handleInputChange} className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    URL Slug
                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Akan dibuat otomatis</span>
                                </Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="slug"
                                        value={`/courses/[auto-generated-from-title]`}
                                        readOnly
                                        className="pl-10 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                    Slug dibuat otomatis saat submit dari judul. Tidak bisa diubah setelah publish.
                                </p>
                            </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori Kursus</Label>
                            <RemoteSearchSelect
                                fetchFn={fetchCategories}
                                value={formData.category_id ?? ''}
                                onChange={value => setFormData(p => ({ ...p, category_id: value ? Number(value) : null }))}
                                placeholder="Pilih kategori kursus..."
                                searchPlaceholder="Ketik untuk mencari kategori..."
                                emptyText="Kategori tidak ditemukan"
                            />
                            <p className="text-xs text-gray-400">Pilih kategori untuk mengorganisir kursus (opsional)</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="short_description" className="text-sm font-medium text-gray-700">Deskripsi Singkat</Label>
                            <textarea id="short_description" name="short_description" placeholder="Deskripsi singkat kursus (opsional)"
                                value={formData.short_description} onChange={handleInputChange}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm"
                                rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi Lengkap <span className="text-red-500">*</span></Label>
                            <div className="[&_.ql-editor]:min-h-[300px] [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:rounded-b-xl [&_.ql-container]:border-gray-200 [&_.ql-toolbar]:border-gray-200">
                                <ReactQuill
                                    value={formData.description}
                                    onChange={value => setFormData(p => ({ ...p, description: value }))}
                                    placeholder="Deskripsi lengkap kursus, apa yang akan dipelajari, persyaratan, dll"
                                    modules={{
                                        toolbar: [
                                            [{ header: [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ list: 'ordered' }, { list: 'bullet' }],
                                            ['blockquote', 'code-block'],
                                            [{ align: [] }],
                                            ['link'],
                                            [{ color: [] }, { background: [] }],
                                            ['clean'],
                                        ],
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan Kursus</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="level" className="text-sm font-medium text-gray-700">Level Kursus</Label>
                                <select id="level" name="level" value={formData.level} onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm">
                                    <option value="beginner">Pemula</option>
                                    <option value="intermediate">Menengah</option>
                                    <option value="advanced">Lanjutan</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration_minutes" className="text-sm font-medium text-gray-700">Durasi (Menit)</Label>
                                <Input id="duration_minutes" name="duration_minutes" type="number" min="1" max="99999"
                                    value={formData.duration_minutes} onChange={handleInputChange}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                                <select id="status" name="status" value={formData.status} onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm">
                                    <option value="draft">Draft</option>
                                    <option value="published">Dipublikasikan</option>
                                    <option value="archived">Diarsipkan</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="thumbnail" className="text-sm font-medium text-gray-700">URL Thumbnail (Opsional)</Label>
                                <Input id="thumbnail" name="thumbnail" type="url" placeholder="https://example.com/image.jpg"
                                    value={formData.thumbnail} onChange={handleInputChange}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Pratinjau</h2>
                    </div>
                    <div className="p-6">
                        <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                            <div className="flex gap-5">
                                {formData.thumbnail ? (
                                    <img src={formData.thumbnail} alt="preview" className="w-32 h-32 object-cover rounded-xl"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                    <div className="w-32 h-32 rounded-xl bg-gray-200 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">{formData.title || 'Judul Kursus'}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {formData.short_description || formData.description?.substring(0, 100) || 'Deskripsi kursus'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Badge className="bg-indigo-100 text-indigo-700 border-0 capitalize">
                                            <GraduationCap className="w-3 h-3 mr-1" />{formData.level}
                                        </Badge>
                                        <Badge variant="secondary">
                                            <Clock className="w-3 h-3 mr-1" />{formData.duration_minutes} menit
                                        </Badge>
                                        <Badge className={formData.status === 'published' ? 'bg-green-100 text-green-700 border-0' : 'bg-yellow-100 text-yellow-700 border-0'}>
                                            {formData.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => router.back()}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        Batal
                    </button>
                    <button type="submit" disabled={loading}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-36">
                        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Membuat...</> : <><Save className="w-4 h-4" /> Buat Kursus</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
