'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Save, Loader2, GraduationCap, Upload,
    Clock, MapPin, Users
} from 'lucide-react';
import { createHCDPProgram } from '@/lib/api/hcdp';
import { showToast, showError } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';

export default function CreateHCDPPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Leadership',
        instructor: '',
        start_date: '',
        end_date: '',
        duration: '',
        location: '',
        max_participants: 30,
        status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
        level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        tags: '',
        is_active: true,
        is_published: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim()) {
            showError('Judul dan deskripsi harus diisi', 'Validasi');
            return;
        }
        setSaving(true);
        try {
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            await createHCDPProgram({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                instructor: formData.instructor,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                duration: formData.duration,
                location: formData.location,
                max_participants: formData.max_participants,
                status: formData.status,
                level: formData.level,
                tags: tagsArray,
                is_active: formData.is_active,
                is_published: formData.is_published,
            });
            showToast('Program berhasil dibuat!', 'success');
            router.push('/dashboard/hcdp');
        } catch (error) {
            showError(handleApiError(error), 'Gagal Membuat Program');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        disabled={saving}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Buat Program HCDP</h1>
                        <p className="text-amber-100 text-sm">Isi formulir di bawah untuk membuat program baru</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informasi Dasar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Dasar</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                                Judul Program <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title" name="title"
                                value={formData.title} onChange={handleChange}
                                placeholder="Contoh: Leadership Development Program"
                                required
                                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                Deskripsi <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description" name="description"
                                value={formData.description} onChange={handleChange}
                                placeholder="Jelaskan tujuan dan manfaat program..."
                                rows={4} required
                                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Detail Program */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Detail Program</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Kategori</Label>
                                <select
                                    id="category" name="category"
                                    value={formData.category} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm"
                                >
                                    <option value="Leadership">Leadership</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Communication">Communication</option>
                                    <option value="Management">Management</option>
                                    <option value="Technical">Technical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level" className="text-sm font-medium text-gray-700">Level</Label>
                                <select
                                    id="level" name="level"
                                    value={formData.level} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instructor" className="text-sm font-medium text-gray-700">Instruktur</Label>
                                <Input
                                    id="instructor" name="instructor"
                                    value={formData.instructor} onChange={handleChange}
                                    placeholder="Nama instruktur"
                                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">Durasi</Label>
                                <Input
                                    id="duration" name="duration"
                                    value={formData.duration} onChange={handleChange}
                                    placeholder="Contoh: 3 hari, 2 minggu"
                                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">Tanggal Mulai</Label>
                                <Input
                                    id="start_date" name="start_date" type="date"
                                    value={formData.start_date} onChange={handleChange}
                                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date" className="text-sm font-medium text-gray-700">Tanggal Selesai</Label>
                                <Input
                                    id="end_date" name="end_date" type="date"
                                    value={formData.end_date} onChange={handleChange}
                                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Lokasi</Label>
                                <Input
                                    id="location" name="location"
                                    value={formData.location} onChange={handleChange}
                                    placeholder="Jakarta, Online, dll"
                                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_participants" className="text-sm font-medium text-gray-700">Maksimal Peserta</Label>
                                <Input
                                    id="max_participants" name="max_participants" type="number" min="1"
                                    value={formData.max_participants} onChange={handleChange}
                                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">Tags</Label>
                            <Input
                                id="tags" name="tags"
                                value={formData.tags} onChange={handleChange}
                                placeholder="Pisahkan dengan koma: leadership, soft skills, management"
                                className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-400">Pisahkan setiap tag dengan koma</p>
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Thumbnail (Opsional)</h2>
                    </div>
                    <div className="p-6">
                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-sm text-gray-500">Upload gambar program</span>
                            <span className="text-xs text-gray-400">PNG, JPG, WebP</span>
                            <input type="file" accept="image/*" className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Pengaturan */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Pengaturan</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                                <select
                                    id="status" name="status"
                                    value={formData.status} onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm"
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center gap-6 mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox" name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-700">Program Aktif</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox" name="is_published"
                                            checked={formData.is_published}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-700">Publikasikan</span>
                                    </label>
                                </div>
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
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="w-full sm:w-32 h-32 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                                    <GraduationCap className="w-10 h-10 text-orange-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 truncate">
                                        {formData.title || 'Judul Program'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {formData.description || 'Deskripsi program akan tampil di sini'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.category && (
                                            <Badge className="bg-amber-100 text-amber-700 border-0">
                                                {formData.category}
                                            </Badge>
                                        )}
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 capitalize">
                                            {formData.level}
                                        </Badge>
                                        <Badge className={
                                            formData.status === 'upcoming' ? 'bg-blue-100 text-blue-700 border-0' :
                                            formData.status === 'ongoing' ? 'bg-green-100 text-green-700 border-0' :
                                            formData.status === 'completed' ? 'bg-gray-100 text-gray-700 border-0' :
                                            'bg-red-100 text-red-700 border-0'
                                        }>
                                            {formData.status}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                                        {formData.duration && (
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formData.duration}</span>
                                        )}
                                        {formData.location && (
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {formData.location}</span>
                                        )}
                                        {formData.max_participants > 0 && (
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formData.max_participants} peserta</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-36"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Simpan Program</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
