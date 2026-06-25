'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RemoteSearchSelect } from '@/components/ui/remote-search-select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft, Save, Loader, Trash2, Plus, Edit,
    FileText, Video, Link as LinkIcon, File,
    HelpCircle, ChevronDown, ChevronRight, BookOpen,
    GraduationCap, Clock, Image as ImageIcon, Layers, AlertCircle
} from 'lucide-react';
import {
    getCourse, updateCourse, deleteCourse,
    getModules, createModule, updateModule, deleteModule,
    createLesson, updateLesson, deleteLesson,
} from '@/lib/api/learning';
import type { Module, Lesson } from '@/lib/api/learning';
import { api, handleApiError } from '@/lib/api';
import { showToast, showError, showWarning, showConfirm, showDeleteConfirm } from '@/lib/sweetalert';

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

interface ModuleFormData { title: string; description: string; order_index: number }
interface LessonFormData {
    title: string; content_type: 'article' | 'video' | 'document' | 'link' | 'quiz';
    content: string; video_url: string; video_embed_id: string;
    file_url: string; external_url: string; duration_minutes: number; is_free: boolean; order_index: number;
}

const initialLessonForm: LessonFormData = {
    title: '', content_type: 'article', content: '', video_url: '', video_embed_id: '',
    file_url: '', external_url: '', duration_minutes: 10, is_free: false, order_index: 1,
};

const contentTypeLabels: Record<string, string> = {
    article: 'Artikel', video: 'Video', document: 'Dokumen', link: 'Link', quiz: 'Kuis',
};
const contentTypeIcons: Record<string, any> = {
    article: FileText, video: Video, document: File, link: LinkIcon, quiz: HelpCircle,
};
const contentTypeColors: Record<string, string> = {
    article: 'bg-blue-100 text-blue-800', video: 'bg-purple-100 text-purple-800',
    document: 'bg-green-100 text-green-800', link: 'bg-orange-100 text-orange-800', quiz: 'bg-amber-100 text-amber-800',
};

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'informasi' | 'modul'>('informasi');

    const [formData, setFormData] = useState({
        title: '', slug: '', description: '', short_description: '',
        level: 'beginner', duration_minutes: 60, status: 'draft', thumbnail: '',
        category_id: null as number | null,
        certificate_background: '', certificate_template: '',
        _cert_bg_file: null as File | null, _cert_tmpl_file: null as File | null,
    });

    const [courseId, setCourseId] = useState<number>(0);
    const [modules, setModules] = useState<Module[]>([]);
    const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [moduleForm, setModuleForm] = useState<ModuleFormData>({ title: '', description: '', order_index: 1 });
    const [moduleSaving, setModuleSaving] = useState(false);

    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [lessonModuleId, setLessonModuleId] = useState<number | null>(null);
    const [lessonForm, setLessonForm] = useState<LessonFormData>(initialLessonForm);
    const [lessonSaving, setLessonSaving] = useState(false);

    useEffect(() => { fetchCourse(); }, [slug]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const course: any = await getCourse(slug);
            setCourseId(course.id);
            setFormData({
                title: course.title, slug: course.slug, description: course.description,
                short_description: course.short_description || '', level: course.level,
                duration_minutes: course.duration_minutes, status: course.status,
                thumbnail: course.thumbnail || '',
                category_id: course.category?.id || null,
                certificate_background: course.certificate_background || '',
                certificate_template: course.certificate_template || '',
                _cert_bg_file: null, _cert_tmpl_file: null,
            });
            const courseModules = await getModules(slug);
            setModules(courseModules.results);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Kursus');
            router.push('/learning/courses');
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

    const loadModules = async () => {
        try {
            const courseModules = await getModules(slug);
            setModules(courseModules.results);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Modul');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { showError('Judul kursus harus diisi', 'Validasi'); return; }
        if (!formData.description.trim()) { showError('Deskripsi harus diisi', 'Validasi'); return; }
        
        // Validasi durasi kursus terhadap total durasi pelajaran
        const totalLessonDuration = modules.reduce((sum, mod) =>
            sum + mod.lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0), 0
        );
        const newCourseDuration = formData.duration_minutes || 0;
        if (newCourseDuration > 0 && totalLessonDuration > 0 && newCourseDuration < totalLessonDuration) {
            showWarning(
                `Durasi kursus (${newCourseDuration} menit) lebih kecil dari total durasi semua pelajaran (${totalLessonDuration} menit).\n\nTambah durasi kursus atau kurangi durasi pelajaran.`,
                'Durasi Kursus Kurang'
            );
            return;
        }
        
        try {
            setSaving(true);
            const fd = new FormData();
            Object.entries(formData).forEach(([k, v]) => {
                // Skip internal file fields, slug (readonly), and null values
                if (k === '_cert_bg_file' || k === '_cert_tmpl_file' || k === 'slug') return;
                if (v === null) return;
                
                // Convert to string for FormData
                fd.append(k, String(v));
            });
            
            // Add file uploads if present
            if (formData._cert_bg_file) fd.append('certificate_background', formData._cert_bg_file);
            if (formData._cert_tmpl_file) fd.append('certificate_template', formData._cert_tmpl_file);
            
            await updateCourse(slug, fd);
            showToast('Kursus berhasil diperbarui!', 'success');
            router.push('/learning/courses');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memperbarui Kursus');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        const confirmed = await showDeleteConfirm(formData.title, 'kursus');
        if (!confirmed) return;
        try {
            setSaving(true);
            await deleteCourse(slug);
            showToast('Kursus berhasil dihapus!', 'success');
            router.push('/learning/courses');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus Kursus');
            setSaving(false);
        }
    };

    const openAddModuleDialog = () => {
        const maxOrder = modules.length > 0 ? Math.max(...modules.map(m => m.order_index)) : 0;
        setModuleForm({ title: '', description: '', order_index: maxOrder + 1 });
        setEditingModule(null);
        setModuleDialogOpen(true);
    };

    const openEditModuleDialog = (mod: Module) => {
        setModuleForm({ title: mod.title, description: mod.description || '', order_index: mod.order_index });
        setEditingModule(mod);
        setModuleDialogOpen(true);
    };

    const handleModuleSubmit = async () => {
        if (!moduleForm.title.trim()) { showError('Judul modul harus diisi', 'Validasi'); return; }
        try {
            setModuleSaving(true);
            if (editingModule) {
                // Include course ID when updating
                await updateModule(editingModule.id, { ...moduleForm, course: courseId });
                showToast('Modul berhasil diperbarui!', 'success');
            } else {
                await createModule({ ...moduleForm, course: courseId });
                showToast('Modul berhasil ditambahkan!', 'success');
            }
            setModuleDialogOpen(false);
            await loadModules();
        } catch (error) {
            showError(handleApiError(error), editingModule ? 'Gagal Memperbarui Modul' : 'Gagal Menambahkan Modul');
        } finally { setModuleSaving(false); }
    };

    const handleModuleDelete = async (mod: Module) => {
        const confirmed = await showDeleteConfirm(mod.title, 'modul');
        if (!confirmed) return;
        try {
            await deleteModule(mod.id);
            showToast('Modul berhasil dihapus!', 'success');
            await loadModules();
        } catch (error) { showError(handleApiError(error), 'Gagal Menghapus Modul'); }
    };

    const openAddLessonDialog = (moduleId: number) => {
        const mod = modules.find(m => m.id === moduleId);
        const maxOrder = mod && mod.lessons.length > 0 ? Math.max(...mod.lessons.map(l => l.order_index)) : 0;
        setLessonForm({ ...initialLessonForm, order_index: maxOrder + 1 });
        setEditingLesson(null);
        setLessonModuleId(moduleId);
        setLessonDialogOpen(true);
    };

    const openEditLessonDialog = (lesson: Lesson) => {
        console.log('Opening edit dialog for lesson:', lesson);
        console.log('Lesson data:', {
            title: lesson.title,
            content_type: lesson.content_type,
            external_url: lesson.external_url,
            video_url: lesson.video_url,
            file_url: lesson.file_url,
            content: lesson.content?.substring(0, 50)
        });
        setLessonForm({
            title: lesson.title, 
            content_type: lesson.content_type as any,
            content: lesson.content || '', 
            video_url: lesson.video_url || '',
            video_embed_id: lesson.video_embed_id || '', 
            file_url: lesson.file_url || '',
            external_url: lesson.external_url || '', 
            duration_minutes: lesson.duration_minutes,
            is_free: lesson.is_free, 
            order_index: lesson.order_index,
        });
        setEditingLesson(lesson);
        setLessonModuleId(lesson.module);
        setLessonDialogOpen(true);
    };

    const handleLessonSubmit = async () => {
        if (!lessonForm.title.trim()) { showError('Judul pelajaran harus diisi', 'Validasi'); return; }
        
        // Validasi durasi: total lesson duration tidak boleh melebihi durasi kursus
        const currentTotal = modules.reduce((sum, mod) =>
            sum + mod.lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0), 0
        );
        const oldDuration = editingLesson ? (editingLesson.duration_minutes || 0) : 0;
        const newTotal = currentTotal - oldDuration + (lessonForm.duration_minutes || 0);
        const courseDuration = formData.duration_minutes || 0;
        if (courseDuration > 0 && newTotal > courseDuration) {
            showWarning(
                `Total durasi semua pelajaran (${newTotal} menit) melebihi durasi kursus (${courseDuration} menit).\n\nKurangi durasi pelajaran agar total tidak melebihi ${courseDuration} menit.`,
                'Durasi Melebihi Batas'
            );
            return;
        }
        
        // Validasi URL untuk tipe link
        if (lessonForm.content_type === 'link') {
            if (!lessonForm.external_url.trim()) {
                showError('URL eksternal harus diisi untuk tipe konten link', 'Validasi URL Link');
                return;
            }
            // Validasi format URL
            try {
                new URL(lessonForm.external_url);
                if (!lessonForm.external_url.startsWith('http://') && !lessonForm.external_url.startsWith('https://')) {
                    showError('URL harus dimulai dengan http:// atau https://', 'Validasi URL Link');
                    return;
                }
            } catch {
                showError('Format URL tidak valid. Contoh: https://example.com/artikel', 'Validasi URL Link');
                return;
            }
        }
        
        // Validasi URL untuk tipe document
        if (lessonForm.content_type === 'document') {
            if (!lessonForm.file_url.trim()) {
                showError('URL file dokumen harus diisi', 'Validasi URL Dokumen');
                return;
            }
            // Validasi format URL
            try {
                new URL(lessonForm.file_url);
                if (!lessonForm.file_url.startsWith('http://') && !lessonForm.file_url.startsWith('https://')) {
                    showError('URL harus dimulai dengan http:// atau https://', 'Validasi URL Dokumen');
                    return;
                }
            } catch {
                showError('Format URL tidak valid. Contoh: https://example.com/dokumen.pdf', 'Validasi URL Dokumen');
                return;
            }
        }
        
        // Validasi URL untuk tipe video
        if (lessonForm.content_type === 'video') {
            if (!lessonForm.video_url.trim() && !lessonForm.video_embed_id.trim()) {
                showError('URL video atau Embed ID harus diisi', 'Validasi Video');
                return;
            }
            if (lessonForm.video_url.trim()) {
                try {
                    new URL(lessonForm.video_url);
                } catch {
                    showError('Format URL video tidak valid', 'Validasi URL Video');
                    return;
                }
            }
        }
        
        try {
            setLessonSaving(true);
            const data: any = {
                title: lessonForm.title, content_type: lessonForm.content_type,
                duration_minutes: lessonForm.duration_minutes, is_free: lessonForm.is_free,
                order_index: lessonForm.order_index,
            };
            if (lessonForm.content_type === 'article') data.content = lessonForm.content;
            else if (lessonForm.content_type === 'video') { data.video_url = lessonForm.video_url; data.video_embed_id = lessonForm.video_embed_id; }
            else if (lessonForm.content_type === 'document') {
                // For document type, use external_url instead of file_url (FileField)
                // file_url is for file upload, external_url is for URL string
                if (lessonForm.file_url) {
                    data.external_url = lessonForm.file_url;
                }
            }
            else if (lessonForm.content_type === 'link') data.external_url = lessonForm.external_url;

            if (editingLesson) {
                // Include module ID when updating
                await updateLesson(editingLesson.slug, { ...data, module: lessonModuleId });
                showToast('Pelajaran berhasil diperbarui!', 'success');
            } else {
                await createLesson({ ...data, module: lessonModuleId });
                showToast('Pelajaran berhasil ditambahkan!', 'success');
            }
            setLessonDialogOpen(false);
            await loadModules();
        } catch (error) {
            showError(handleApiError(error), editingLesson ? 'Gagal Memperbarui Pelajaran' : 'Gagal Menambahkan Pelajaran');
        } finally { setLessonSaving(false); }
    };

    const handleLessonDelete = async (lesson: Lesson) => {
        const confirmed = await showDeleteConfirm(lesson.title, 'pelajaran');
        if (!confirmed) return;
        try {
            await deleteLesson(lesson.slug);
            showToast('Pelajaran berhasil dihapus!', 'success');
            await loadModules();
        } catch (error) { showError(handleApiError(error), 'Gagal Menghapus Pelajaran'); }
    };

    const toggleModuleExpand = (moduleId: number) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-36 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} disabled={saving}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">Edit Kursus</h1>
                            <p className="text-indigo-100 text-sm">{formData.title}</p>
                        </div>
                    </div>
                    <button onClick={handleDelete} disabled={saving}
                        className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-medium transition-all">
                        <Trash2 className="w-4 h-4" /> Hapus
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                {(['informasi', 'modul'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all ${
                            activeTab === tab
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}>
                        {tab === 'informasi' ? 'Informasi Kursus' : 'Modul & Pelajaran'}
                    </button>
                ))}
            </div>

            {activeTab === 'informasi' && (
                <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Tidak bisa diubah</span>
                                </Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="slug"
                                        value={`/courses/${formData.slug}`}
                                        readOnly
                                        className="pl-10 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                    Slug dibuat saat create. Tidak berubah meski judul diedit (untuk SEO & link sharing).
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
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" rows={2} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Deskripsi Lengkap <span className="text-red-500">*</span></Label>
                                <textarea id="description" name="description" placeholder="Deskripsi lengkap kursus, apa yang akan dipelajari, persyaratan, dll"
                                    value={formData.description} onChange={handleInputChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" rows={6} required />
                            </div>
                        </div>
                    </div>

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
                                    <Label htmlFor="thumbnail" className="text-sm font-medium text-gray-700">URL Thumbnail</Label>
                                    <Input id="thumbnail" name="thumbnail" type="url" placeholder="https://example.com/image.jpg"
                                        value={formData.thumbnail} onChange={handleInputChange}
                                        className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>

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
                                        <div className="w-32 h-32 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
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
                                                <GraduationCap className="w-3 h-3 mr-1" />{formData.level === 'beginner' ? 'Pemula' : formData.level === 'intermediate' ? 'Menengah' : 'Lanjutan'}
                                            </Badge>
                                            <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{formData.duration_minutes} menit</Badge>
                                            <Badge className={formData.status === 'published' ? 'bg-green-100 text-green-700 border-0' : 'bg-yellow-100 text-yellow-700 border-0'}>
                                                {formData.status === 'published' ? 'Dipublikasikan' : formData.status === 'draft' ? 'Draft' : 'Diarsipkan'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Certificate Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Sertifikat (Opsional)</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Background Sertifikat</Label>
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setFormData(f => ({ ...f, _cert_bg_file: file }));
                                }} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                {formData.certificate_background && !formData._cert_bg_file && (
                                    <p className="text-xs text-gray-500 mt-1">Sudah ada: {formData.certificate_background}</p>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Template Sertifikat HTML</Label>
                                <input type="file" accept=".html,.htm" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setFormData(f => ({ ...f, _cert_tmpl_file: file }));
                                }} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                                {formData.certificate_template && !formData._cert_tmpl_file && (
                                    <p className="text-xs text-gray-500 mt-1">Sudah ada template</p>
                                )}
                                {!formData.certificate_template && !formData._cert_tmpl_file && (
                                    <p className="text-xs text-gray-400 mt-1">Fallback ke layout default (ReportLab)</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => router.back()}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                        <button type="submit" disabled={saving}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-36">
                            {saving ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'modul' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Daftar Modul</h2>
                            <span className="text-sm text-gray-500">({modules.length} modul)</span>
                        </div>
                        <button onClick={openAddModuleDialog}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md">
                            <Plus className="w-4 h-4" /> Tambah Modul
                        </button>
                    </div>

                    {(!modules || modules.length === 0) ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Layers className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada modul</h3>
                            <p className="text-gray-500 mb-6">Klik "Tambah Modul" untuk mulai membuat struktur kursus.</p>
                            <button onClick={openAddModuleDialog}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200">
                                <Plus className="w-4 h-4" /> Tambah Modul Pertama
                            </button>
                        </div>
                    ) : (
                        [...modules].sort((a, b) => a.order_index - b.order_index).map((mod) => (
                            <div key={mod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => toggleModuleExpand(mod.id)}>
                                            <div className="mt-0.5">
                                                {expandedModules.has(mod.id) ? (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-400">#{mod.order_index}</span>
                                                    <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                                                    <Badge variant="secondary" className="text-xs">{mod.lessons.length} Pelajaran</Badge>
                                                </div>
                                                {mod.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{mod.description.length > 100 ? `${mod.description.substring(0, 100)}...` : mod.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 ml-4 flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); openEditModuleDialog(mod); }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleModuleDelete(mod); }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedModules.has(mod.id) && (
                                        <div className="mt-4 pl-9 space-y-2">
                                            {mod.lessons.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic">Belum ada pelajaran</p>
                                            ) : (
                                                mod.lessons.sort((a, b) => a.order_index - b.order_index).map((lesson) => {
                                                    const IconComp = contentTypeIcons[lesson.content_type] || FileText;
                                                    return (
                                                        <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition-all group">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <span className="text-xs font-medium text-gray-400 w-4">{lesson.order_index}.</span>
                                                                <span className="text-sm font-medium text-gray-900 truncate">{lesson.title}</span>
                                                                <Badge className={`text-xs whitespace-nowrap border-0 ${contentTypeColors[lesson.content_type] || 'bg-gray-100 text-gray-800'}`}>
                                                                    <IconComp className="w-3 h-3 mr-1 inline" />{contentTypeLabels[lesson.content_type] || lesson.content_type}
                                                                </Badge>
                                                                <span className="text-xs text-gray-400 whitespace-nowrap">{lesson.duration_minutes} mnt</span>
                                                                {lesson.is_free && <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 whitespace-nowrap">Gratis</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {lesson.content_type === 'quiz' && (
                                                                    <button onClick={() => {
                                                                        if (lesson.quiz_id) router.push(`/learning/quizzes/${lesson.quiz_id}/edit`);
                                                                        else router.push(`/learning/quizzes/create?course_slug=${slug}&lesson_id=${lesson.id}&module_id=${mod.id}`);
                                                                    }} className="px-2 py-1 text-xs text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                                                                        {lesson.quiz_id ? 'Edit Quiz' : 'Buat Quiz'}
                                                                    </button>
                                                                )}
                                                                <button onClick={() => openEditLessonDialog(lesson)}
                                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors">
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => handleLessonDelete(lesson)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                            <button onClick={() => openAddLessonDialog(mod.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium">
                                                <Plus className="w-3.5 h-3.5" /> Tambah Pelajaran
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Module Dialog */}
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">{editingModule ? 'Edit Modul' : 'Tambah Modul'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Judul Modul <span className="text-red-500">*</span></Label>
                            <Input placeholder="Contoh: Bab 1: Pengertian Administrasi" value={moduleForm.title}
                                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Deskripsi</Label>
                            <Textarea placeholder="Deskripsi modul (opsional)" value={moduleForm.description}
                                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Urutan</Label>
                            <Input type="number" min="1" value={moduleForm.order_index}
                                onChange={(e) => setModuleForm({ ...moduleForm, order_index: parseInt(e.target.value) || 1 })}
                                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setModuleDialogOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                            <button onClick={handleModuleSubmit} disabled={moduleSaving}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                                {moduleSaving ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> {editingModule ? 'Simpan' : 'Tambah'}</>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">{editingLesson ? 'Edit Pelajaran' : 'Tambah Pelajaran'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Judul Pelajaran <span className="text-red-500">*</span></Label>
                            <Input placeholder="Contoh: Pengertian Administrasi Negara" value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Tipe Konten</Label>
                            <select value={lessonForm.content_type}
                                onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value as any })}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm">
                                <option value="article">Artikel</option>
                                <option value="video">Video</option>
                                <option value="document">Dokumen</option>
                                <option value="link">Link</option>
                                <option value="quiz">Kuis</option>
                            </select>
                        </div>

                        {lessonForm.content_type === 'article' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Konten</Label>
                                <Textarea placeholder="Tulis konten artikel di sini..." value={lessonForm.content}
                                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" rows={6} />
                            </div>
                        )}

                        {lessonForm.content_type === 'video' && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">URL Video</Label>
                                    <Input placeholder="https://www.youtube.com/watch?v=..." value={lessonForm.video_url}
                                        onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                                        className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Embed ID</Label>
                                    <Input placeholder="YouTube video ID (contoh: dQw4w9WgXcQ)" value={lessonForm.video_embed_id}
                                        onChange={(e) => setLessonForm({ ...lessonForm, video_embed_id: e.target.value })}
                                        className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                                </div>
                            </>
                        )}

                        {lessonForm.content_type === 'document' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">URL File</Label>
                                <Input placeholder="https://example.com/dokumen.pdf" value={lessonForm.file_url}
                                    onChange={(e) => setLessonForm({ ...lessonForm, file_url: e.target.value })}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        )}

                        {lessonForm.content_type === 'link' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">URL Eksternal</Label>
                                <Input placeholder="https://example.com/artikel" value={lessonForm.external_url}
                                    onChange={(e) => setLessonForm({ ...lessonForm, external_url: e.target.value })}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Durasi (Menit)</Label>
                                <Input type="number" min="1" value={lessonForm.duration_minutes}
                                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 1 })}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Urutan</Label>
                                <Input type="number" min="1" value={lessonForm.order_index}
                                    onChange={(e) => setLessonForm({ ...lessonForm, order_index: parseInt(e.target.value) || 1 })}
                                    className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={lessonForm.is_free}
                                onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">Pelajaran Gratis (dapat diakses tanpa login)</span>
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setLessonDialogOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                            <button onClick={handleLessonSubmit} disabled={lessonSaving}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                                {lessonSaving ? <><Loader className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> {editingLesson ? 'Simpan' : 'Tambah'}</>}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
