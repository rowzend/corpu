'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Save, Loader, Upload, X, ImageIcon, ShieldCheck, ShieldAlert,
    KeyRound, FileText, BookOpen, Award, Trash2, ToggleLeft, ToggleRight,
    Download, Search, Settings, ChevronDown, ChevronRight, Palette, Globe
} from 'lucide-react';
import { getCertificateSettings, updateCertificateSettings, generateTteCertificate, generateCourseTteCertificate, getCourses, updateCourse, getCertificates, deleteCertificate, toggleCertificateActive, downloadCertificate } from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showDeleteConfirm } from '@/lib/sweetalert';

interface CourseItem {
    id: number; title: string; slug: string;
    certificate_background: string | null; certificate_template: string | null;
    cert_institution_name: string;
    cert_logo: string | null;
    cert_signature_name: string;
    cert_signature_title: string;
    cert_signature_image: string | null;
    cert_show_course_hours: boolean | null;
    cert_tte_enabled: boolean;
    cert_tte_created_at: string | null;
}

export default function TemplatePage() {
    const router = useRouter();
    const [tab, setTab] = useState<'pengaturan' | 'template' | 'tte' | 'kelola'>('pengaturan');
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({ institution_name: '', signature_name: '', signature_title: '', show_course_hours: true, cert_number_prefix: 'CERT', cert_number_format: '{PREFIX}-{DATE}-{RANDOM}' });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const [sigPreview, setSigPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [sigFile, setSigFile] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [removeBg, setRemoveBg] = useState(false);
    const [removeSig, setRemoveSig] = useState(false);
    const [saving, setSaving] = useState(false);

    const logoRef = useRef<HTMLInputElement>(null);
    const bgRef = useRef<HTMLInputElement>(null);
    const sigRef = useRef<HTMLInputElement>(null);

    const [tteHasCert, setTteHasCert] = useState(false);
    const [tteCreatedAt, setTteCreatedAt] = useState<string | null>(null);
    const [ttePassphrase, setTtePassphrase] = useState('');
    const [tteGenerating, setTteGenerating] = useState(false);

    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [courseOverrides, setCourseOverrides] = useState<Record<number, any>>({});
    const [courseTmplFiles, setCourseTmplFiles] = useState<Record<number, { bg: File | null; tmpl: File | null; logo: File | null; sig: File | null }>>({});
    const [courseSaving, setCourseSaving] = useState<Record<number, boolean>>({});
    const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());

    const [certs, setCerts] = useState<any[]>([]);
    const [certSearch, setCertSearch] = useState('');
    const [actFilter, setActFilter] = useState('all');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [sData, cData] = await Promise.all([getCertificateSettings(), getCourses({ page_size: 100 })]);
            setForm({
                institution_name: sData.institution_name || '',
                signature_name: sData.signature_name || '',
                signature_title: sData.signature_title || '',
                show_course_hours: sData.show_course_hours ?? true,
                cert_number_prefix: sData.cert_number_prefix || 'CERT',
                cert_number_format: sData.cert_number_format || '{PREFIX}-{DATE}-{RANDOM}',
            });
            setLogoPreview(sData.logo);
            setBgPreview(sData.background);
            setSigPreview(sData.signature_image);
            setTteHasCert(sData.tte_has_certificate);
            setTteCreatedAt(sData.tte_created_at);
            const items = (cData.results || cData || []).map((c: any) => ({
                id: c.id, title: c.title, slug: c.slug,
                certificate_background: c.certificate_background || null,
                certificate_template: c.certificate_template || null,
                cert_institution_name: c.cert_institution_name || '',
                cert_logo: c.cert_logo || null,
                cert_signature_name: c.cert_signature_name || '',
                cert_signature_title: c.cert_signature_title || '',
                cert_signature_image: c.cert_signature_image || null,
                cert_show_course_hours: c.cert_show_course_hours,
                cert_tte_enabled: c.cert_tte_enabled || false,
                cert_tte_created_at: c.cert_tte_created_at || null,
            }));
            setCourses(items);
            const certData = await getCertificates();
            setCerts(certData.results || []);
        } catch (e) { showError(handleApiError(e), 'Gagal Load'); }
        finally { setLoading(false); }
    };

    const reloadCerts = async () => {
        try { const certData = await getCertificates(); setCerts(certData.results || []); } catch (_) {}
    };

    const handleFileSelect = (file: File | null, setFile: (f: File | null) => void, setPreview: (s: string | null) => void, setRemove: (b: boolean) => void) => {
        if (!file) { setFile(null); return; }
        setFile(file); setRemove(false);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };
    const handleRemoveFile = (setFile: (f: File | null) => void, setPreview: (s: null) => void, setRemove: (b: boolean) => void, ref: React.RefObject<HTMLInputElement | null>) => {
        setFile(null); setPreview(null); setRemove(true);
        if (ref.current) ref.current.value = '';
    };

    const handleSaveGlobal = async () => {
        if (!form.institution_name.trim()) { showError('Nama institusi harus diisi', 'Validasi'); return; }
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('institution_name', form.institution_name);
            fd.append('signature_name', form.signature_name);
            fd.append('signature_title', form.signature_title);
            fd.append('show_course_hours', form.show_course_hours.toString());
            fd.append('cert_number_prefix', form.cert_number_prefix);
            fd.append('cert_number_format', form.cert_number_format);
            if (logoFile) fd.append('logo', logoFile);
            else if (removeLogo) fd.append('logo', '');
            if (bgFile) fd.append('background', bgFile);
            else if (removeBg) fd.append('background', '');
            if (sigFile) fd.append('signature_image', sigFile);
            else if (removeSig) fd.append('signature_image', '');
            const result = await updateCertificateSettings(fd);
            setLogoPreview(result.logo); setBgPreview(result.background); setSigPreview(result.signature_image);
            setLogoFile(null); setBgFile(null); setSigFile(null);
            setRemoveLogo(false); setRemoveBg(false); setRemoveSig(false);
            showToast('Pengaturan disimpan!', 'success');
        } catch (e) { showError(handleApiError(e), 'Gagal Simpan'); }
        finally { setSaving(false); }
    };

    const handleGenerateTte = async () => {
        if (!ttePassphrase) { showError('Passphrase wajib diisi', 'Validasi'); return; }
        try {
            setTteGenerating(true);
            await generateTteCertificate(ttePassphrase);
            showToast('Sertifikat TTE berhasil dibuat!', 'success');
            setTtePassphrase('');
            const sData = await getCertificateSettings();
            setTteHasCert(sData.tte_has_certificate);
            setTteCreatedAt(sData.tte_created_at);
        } catch (e) { showError(handleApiError(e), 'Gagal Generate TTE'); }
        finally { setTteGenerating(false); }
    };

    const saveCourseTemplate = async (course: CourseItem) => {
        const overrides = courseOverrides[course.id] || {};
        const files = courseTmplFiles[course.id] || {};
        if (!Object.keys(overrides).length && !files.bg && !files.tmpl && !files.logo && !files.sig) return;
        try {
            setCourseSaving(s => ({ ...s, [course.id]: true }));
            const fd = new FormData();
            if (overrides.cert_institution_name !== undefined) fd.append('cert_institution_name', overrides.cert_institution_name);
            if (overrides.cert_signature_name !== undefined) fd.append('cert_signature_name', overrides.cert_signature_name);
            if (overrides.cert_signature_title !== undefined) fd.append('cert_signature_title', overrides.cert_signature_title);
            if (overrides.cert_number_prefix !== undefined) fd.append('cert_number_prefix', overrides.cert_number_prefix);
            if (overrides.cert_number_format !== undefined) fd.append('cert_number_format', overrides.cert_number_format);
            if (overrides.cert_show_course_hours !== undefined) fd.append('cert_show_course_hours', overrides.cert_show_course_hours);
            if (files.bg) fd.append('certificate_background', files.bg);
            if (files.tmpl) fd.append('certificate_template', files.tmpl);
            if (files.logo) fd.append('cert_logo', files.logo);
            if (files.sig) fd.append('cert_signature_image', files.sig);
            await updateCourse(course.slug, fd);
            setCourseOverrides(o => ({ ...o, [course.id]: {} }));
            setCourseTmplFiles(f => ({ ...f, [course.id]: { bg: null, tmpl: null, logo: null, sig: null } }));
            const cData = await getCourses({ page_size: 100 });
            const items = (cData.results || cData || []).map((c: any) => ({
                id: c.id, title: c.title, slug: c.slug,
                certificate_background: c.certificate_background || null,
                certificate_template: c.certificate_template || null,
                cert_institution_name: c.cert_institution_name || '',
                cert_logo: c.cert_logo || null,
                cert_signature_name: c.cert_signature_name || '',
                cert_signature_title: c.cert_signature_title || '',
                cert_signature_image: c.cert_signature_image || null,
                cert_show_course_hours: c.cert_show_course_hours,
            }));
            setCourses(items);
            showToast(`"${course.title}" tersimpan!`, 'success');
        } catch (e) { showError(handleApiError(e), 'Gagal Simpan'); }
        finally { setCourseSaving(s => ({ ...s, [course.id]: false })); }
    };

    const handleToggleCert = async (id: number) => {
        try {
            const res = await toggleCertificateActive(id);
            setCerts(certs.map(c => c.id === id ? { ...c, is_active: res.is_active } : c));
            showToast(res.is_active ? 'Diaktifkan' : 'Dinonaktifkan', 'success');
        } catch (e) { showError(handleApiError(e), 'Gagal'); }
    };
    const handleDeleteCert = async (id: number, label: string) => {
        const ok = await showDeleteConfirm(label, 'sertifikat');
        if (!ok) return;
        try { await deleteCertificate(id); setCerts(certs.filter(c => c.id !== id)); showToast('Dihapus', 'success'); }
        catch (e) { showError(handleApiError(e), 'Gagal Hapus'); }
    };
    const handleDownloadCert = async (id: number) => {
        try { const blob = await downloadCertificate(id); window.open(URL.createObjectURL(blob), '_blank'); }
        catch (e) { showError(handleApiError(e), 'Gagal Download'); }
    };

    const filteredCerts = certs.filter(c => {
        const q = certSearch.toLowerCase();
        const ms = !q || c.user_name?.toLowerCase().includes(q) || c.course_title?.toLowerCase().includes(q) || c.certificate_number?.toLowerCase().includes(q);
        const ma = actFilter === 'all' || (actFilter === 'active' && c.is_active) || (actFilter === 'inactive' && !c.is_active);
        return ms && ma;
    });

    const renderImgUpload = (label: string, preview: string | null, file: File | null, setFile: any, setPreview: any, setRemove: any, ref: any, remove: boolean) => (
        <div>
            <Label className="text-sm font-medium text-card-foreground">{label}</Label>
            <div className="mt-1.5 flex items-start gap-3">
                <div className="w-20 h-20 border border-border rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {preview && !remove ? <img src={preview} alt="" className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="space-y-1.5">
                    <input type="file" accept="image/*" ref={ref} className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setFile, setPreview, setRemove)} />
                    <button type="button" onClick={() => ref.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors">
                        <Upload className="w-3.5 h-3.5" />{file ? file.name : (preview && !remove ? 'Ganti' : 'Pilih')}
                    </button>
                    {(preview || file) && !remove && (
                        <button type="button" onClick={() => handleRemoveFile(setFile, setPreview as any, setRemove, ref)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-card border border-red-200 rounded-xl hover:bg-red-50 transition-colors ml-1">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const inputCls = "border-border focus:border-violet-500 focus:ring-violet-500";
    const selectCls = "w-full px-3 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-muted text-sm";

    const tabs = [
        { key: 'pengaturan', label: 'Pengaturan', icon: Settings },
        { key: 'template', label: 'Template', icon: FileText },
        { key: 'tte', label: 'TTE', icon: ShieldCheck },
        { key: 'kelola', label: 'Kelola', icon: Award },
    ] as const;

    if (loading) return (
        <div className="space-y-6">
            <div className="h-40 bg-muted rounded-2xl animate-pulse" />
            <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center gap-3">
                    <button onClick={() => router.push('/admin/learning/certificates/user')}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-2 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Template Sertifikat</h1>
                        <p className="text-violet-100 text-sm">Atur tampilan sertifikat, template per kursus, TTE, dan kelola sertifikat</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-1.5 flex gap-1">
                {tabs.map(t => {
                    const Icon = t.icon;
                    const isActive = tab === t.key;
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
                                isActive ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md' : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                            }`}>
                            <Icon className="w-4 h-4" />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab: Pengaturan Global */}
            {tab === 'pengaturan' && (
                <div className="space-y-5">
                    <div className="bg-card rounded-xl shadow-sm border border-border">
                        <div className="px-6 py-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-violet-600" />
                                <h2 className="text-lg font-semibold text-card-foreground">Informasi Institusi</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-card-foreground">Nama Institusi</Label>
                                <Input value={form.institution_name}
                                    onChange={(e) => setForm(f => ({ ...f, institution_name: e.target.value }))}
                                    className={inputCls} placeholder="Contoh: ASN CorpU" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {renderImgUpload('Logo', logoPreview, logoFile, setLogoFile, setLogoPreview, setRemoveLogo, logoRef, removeLogo)}
                                {renderImgUpload('Background', bgPreview, bgFile, setBgFile, setBgPreview, setRemoveBg, bgRef, removeBg)}
                                {renderImgUpload('Tanda Tangan', sigPreview, sigFile, setSigFile, setSigPreview, setRemoveSig, sigRef, removeSig)}
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-border">
                        <div className="px-6 py-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-violet-600" />
                                <h2 className="text-lg font-semibold text-card-foreground">Penandatangan</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-card-foreground">Nama</Label>
                                    <Input value={form.signature_name}
                                        onChange={(e) => setForm(f => ({ ...f, signature_name: e.target.value }))}
                                        className={inputCls} placeholder="Dr. H. Ahmad, M.Pd" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-card-foreground">Jabatan</Label>
                                    <Input value={form.signature_title}
                                        onChange={(e) => setForm(f => ({ ...f, signature_title: e.target.value }))}
                                        className={inputCls} placeholder="Kepala ASN CorpU" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-border">
                        <div className="p-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.show_course_hours}
                                    onChange={(e) => setForm(f => ({ ...f, show_course_hours: e.target.checked }))}
                                    className="w-4 h-4 text-violet-600 border-border rounded focus:ring-violet-500" />
                                <span className="text-sm text-card-foreground">Tampilkan durasi kursus (jam pelajaran) di sertifikat</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm border border-border">
                        <div className="px-6 py-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-violet-600" />
                                <h2 className="text-lg font-semibold text-card-foreground">Format Nomor Sertifikat</h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-card-foreground">Prefix</Label>
                                    <Input value={form.cert_number_prefix}
                                        onChange={(e) => setForm(f => ({ ...f, cert_number_prefix: e.target.value }))}
                                        className={inputCls} placeholder="CERT" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-card-foreground">Format</Label>
                                    <Input value={form.cert_number_format}
                                        onChange={(e) => setForm(f => ({ ...f, cert_number_format: e.target.value }))}
                                        className={inputCls} placeholder="{PREFIX}-{DATE}-{RANDOM}" />
                                </div>
                            </div>
                            <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground">
                                Variable: <code className="text-violet-600">{'{PREFIX}'}</code>, <code className="text-violet-600">{'{DATE}'}</code> (YYYYMMDD), <code className="text-violet-600">{'{RANDOM}'}</code>, <code className="text-violet-600">{'{YEAR}'}</code>, <code className="text-violet-600">{'{MONTH}'}</code>, <code className="text-violet-600">{'{DAY}'}</code>, <code className="text-violet-600">{'{COURSE_ID}'}</code>, <code className="text-violet-600">{'{USER_ID}'}</code>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSaveGlobal} disabled={saving}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Pengaturan
                        </button>
                    </div>
                </div>
            )}

            {/* Tab: Template Per Course */}
            {tab === 'template' && (
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-violet-600" />
                            <h2 className="text-lg font-semibold text-card-foreground">Template Per Kursus</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-5 text-sm text-violet-800">
                            <p className="font-medium mb-1">Variable untuk template HTML:</p>
                            <code className="text-xs text-violet-700">{'{{ institution_name }}, {{ user_name }}, {{ course_title }}, {{ certificate_number }}, {{ issued_at }}, {{ logo }} (base64), {{ signature_image }} (base64), {{ signature_name }}, {{ signature_title }}, {{ course_hours }}'}</code>
                            <p className="text-xs mt-1.5 text-violet-600">Kosongkan template → fallback ke layout default (ReportLab)</p>
                        </div>

                        {courses.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Belum ada kursus. Buat kursus dulu.</p>
                        ) : (
                            <div className="space-y-3">
                                {courses.map(course => {
                                    const files = courseTmplFiles[course.id] || { bg: null, tmpl: null, logo: null, sig: null };
                                    const overrides = courseOverrides[course.id] || {};
                                    const isSaving = courseSaving[course.id];
                                    const expanded = expandedCourses.has(course.id);
                                    const ov = (k: string) => overrides[k] !== undefined ? overrides[k] : (course as any)[k] || '';
                                    const setOv = (k: string, v: any) => setCourseOverrides(o => ({ ...o, [course.id]: { ...(o[course.id] || {}), [k]: v } }));
                                    const hasChanges = files.bg || files.tmpl || files.logo || files.sig || Object.keys(overrides).length > 0;

                                    return (
                                        <div key={course.id} className="border border-border rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted transition-colors"
                                                onClick={() => {
                                                    const s = new Set(expandedCourses);
                                                    s.has(course.id) ? s.delete(course.id) : s.add(course.id);
                                                    setExpandedCourses(s);
                                                }}>
                                                <div className="flex items-center gap-2.5">
                                                    {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                                    <Globe className="w-4 h-4 text-violet-500" />
                                                    <span className="font-medium text-sm text-card-foreground">{course.title}</span>
                                                </div>
                                                <div className="flex gap-1.5 text-xs">
                                                    {course.certificate_template && <Badge className="bg-green-100 text-green-700 border-0">HTML</Badge>}
                                                    {course.certificate_background && <Badge variant="outline" className="border-border">BG</Badge>}
                                                    {(course.cert_institution_name || course.cert_signature_name) && <Badge variant="outline" className="border-border">Custom</Badge>}
                                                    {!course.certificate_template && !course.certificate_background && !course.cert_institution_name && !course.cert_signature_name && !course.cert_number_prefix && !course.cert_number_format &&
                                                        <span className="text-muted-foreground text-xs">Global</span>}
                                                </div>
                                            </div>
                                            {expanded && (
                                                <div className="border-t border-border px-5 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Nama Institusi</Label>
                                                            <Input className={`text-sm ${inputCls}`} value={ov('cert_institution_name')}
                                                                onChange={(e) => setOv('cert_institution_name', e.target.value)}
                                                                placeholder="Kosongkan → pakai global" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Tampilkan Durasi</Label>
                                                            <select className={selectCls} value={ov('cert_show_course_hours') === null ? '' : String(ov('cert_show_course_hours'))}
                                                                onChange={(e) => setOv('cert_show_course_hours', e.target.value === '' ? null : e.target.value === 'true')}>
                                                                <option value="">Default (global)</option>
                                                                <option value="true">Ya</option>
                                                                <option value="false">Tidak</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Nama Penandatangan</Label>
                                                            <Input className={`text-sm ${inputCls}`} value={ov('cert_signature_name')}
                                                                onChange={(e) => setOv('cert_signature_name', e.target.value)}
                                                                placeholder="Kosongkan → pakai global" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Jabatan Penandatangan</Label>
                                                            <Input className={`text-sm ${inputCls}`} value={ov('cert_signature_title')}
                                                                onChange={(e) => setOv('cert_signature_title', e.target.value)}
                                                                placeholder="Kosongkan → pakai global" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Prefix Nomor</Label>
                                                            <Input className={`text-sm ${inputCls}`} value={ov('cert_number_prefix')}
                                                                onChange={(e) => setOv('cert_number_prefix', e.target.value)}
                                                                placeholder="Kosongkan → pakai global (CERT)" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Format Nomor</Label>
                                                            <Input className={`text-sm ${inputCls}`} value={ov('cert_number_format')}
                                                                onChange={(e) => setOv('cert_number_format', e.target.value)}
                                                                placeholder="Kosongkan → pakai global" />
                                                            <p className="text-xs text-muted-foreground">Variable: {'{PREFIX}'}, {'{DATE}'}, {'{RANDOM}'}, {'{YEAR}'}, {'{MONTH}'}, {'{DAY}'}, {'{COURSE_ID}'}, {'{USER_ID}'}</p>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Logo (gambar)</Label>
                                                            <div className="flex items-center gap-2">
                                                                <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                                                                    <Upload className="w-3.5 h-3.5" />{files.logo ? files.logo.name : 'Pilih file'}
                                                                    <input type="file" accept="image/*" className="hidden"
                                                                        onChange={(e) => setCourseTmplFiles(cf => ({ ...cf, [course.id]: { ...cf[course.id], logo: e.target.files?.[0] || null } }))} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Tanda Tangan (gambar)</Label>
                                                            <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                                                                <Upload className="w-3.5 h-3.5" />{files.sig ? files.sig.name : 'Pilih file'}
                                                                <input type="file" accept="image/*" className="hidden"
                                                                    onChange={(e) => setCourseTmplFiles(cf => ({ ...cf, [course.id]: { ...cf[course.id], sig: e.target.files?.[0] || null } }))} />
                                                            </label>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Background (gambar)</Label>
                                                            <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                                                                <Upload className="w-3.5 h-3.5" />{files.bg ? files.bg.name : 'Pilih file'}
                                                                <input type="file" accept="image/*" className="hidden"
                                                                    onChange={(e) => setCourseTmplFiles(cf => ({ ...cf, [course.id]: { ...cf[course.id], bg: e.target.files?.[0] || null } }))} />
                                                            </label>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-card-foreground">Template HTML</Label>
                                                            <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                                                                <Upload className="w-3.5 h-3.5" />{files.tmpl ? files.tmpl.name : 'Pilih file'}
                                                                <input type="file" accept=".html,.htm" className="hidden"
                                                                    onChange={(e) => setCourseTmplFiles(cf => ({ ...cf, [course.id]: { ...cf[course.id], tmpl: e.target.files?.[0] || null } }))} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-border pt-4 mt-4">
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-xs font-medium text-card-foreground">TTE Khusus Course</span>
                                                        </div>
                                                        {course.cert_tte_enabled && course.cert_tte_created_at ? (
                                                            <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5">
                                                                <span className="text-xs text-green-700 font-medium">Aktif (dibuat {new Date(course.cert_tte_created_at).toLocaleDateString('id-ID')})</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground mb-2">Gunakan TTE global atau buat khusus untuk course ini</p>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <Input type="password" className={`text-sm flex-1 ${inputCls}`} placeholder="Passphrase TTE khusus"
                                                                onChange={(e) => setCourseTmplFiles(cf => ({ ...cf, [course.id]: { ...cf[course.id], _ttePw: e.target.value } }))} />
                                                            <button disabled={!('_ttePw' in (courseTmplFiles[course.id] || {}))}
                                                                onClick={async () => {
                                                                    const pw = (courseTmplFiles[course.id] as any)?._ttePw;
                                                                    if (!pw) return;
                                                                    try { await generateCourseTteCertificate(course.id, pw); showToast('TTE khusus berhasil dibuat!', 'success'); await loadAll(); }
                                                                    catch (e) { showError(handleApiError(e), 'Gagal'); }
                                                                }}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50">
                                                                <KeyRound className="w-3.5 h-3.5" /> Generate
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {hasChanges && (
                                                        <div className="mt-4 flex justify-end border-t border-border pt-4">
                                                            <button disabled={isSaving} onClick={() => saveCourseTemplate(course)}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl hover:from-violet-700 hover:to-purple-800 transition-all shadow-md disabled:opacity-50">
                                                                {isSaving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: TTE */}
            {tab === 'tte' && (
                <div className="bg-card rounded-xl shadow-sm border border-border">
                    <div className="px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            {tteHasCert ? <ShieldCheck className="w-5 h-5 text-green-500" /> : <ShieldAlert className="w-5 h-5 text-muted-foreground" />}
                            <h2 className="text-lg font-semibold text-card-foreground">Tanda Tangan Elektronik</h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        {tteHasCert ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldCheck className="w-5 h-5 text-green-600" />
                                    <p className="font-medium text-green-800 text-sm">Sertifikat TTE aktif</p>
                                </div>
                                {tteCreatedAt && <p className="text-xs text-green-700 mt-1">Dibuat: {new Date(tteCreatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                                <p className="text-xs text-green-600 mt-1">Setiap PDF yang diunduh akan ditandatangani secara elektronik.</p>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                                    <p className="font-medium text-amber-800 text-sm">TTE belum diaktifkan</p>
                                </div>
                                <p className="text-xs text-amber-700 mt-1">Generate self-signed certificate untuk menandatangani PDF.</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-card-foreground">Passphrase</Label>
                            <div className="flex gap-2">
                                <Input type="password" value={ttePassphrase}
                                    onChange={(e) => setTtePassphrase(e.target.value)}
                                    placeholder="Passphrase untuk kunci privat" className={`flex-1 ${inputCls}`} />
                                <button disabled={!ttePassphrase || tteGenerating} onClick={handleGenerateTte}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50">
                                    {tteGenerating ? <Loader className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Generate
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">Passphrase melindungi kunci privat. Simpan dengan aman.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Kelola Sertifikat */}
            {tab === 'kelola' && (
                <div className="space-y-4">
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <Label className="text-xs font-medium text-card-foreground mb-1 block">Cari</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input type="text" placeholder="Nama, kursus, nomor..." value={certSearch}
                                        onChange={e => setCertSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-muted focus:bg-card transition-colors text-sm" />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-medium text-card-foreground mb-1 block">Status</Label>
                                <select value={actFilter} onChange={e => setActFilter(e.target.value)}
                                    className="px-4 py-2.5 border border-border rounded-xl bg-muted text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                                    <option value="all">Semua</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>
                            <button onClick={reloadCerts}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-card-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors">
                                <Loader className="w-3.5 h-3.5" /> Refresh
                            </button>
                        </div>
                    </div>
                    {filteredCerts.length === 0 ? (
                        <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 bg-violet-100 rounded-full flex items-center justify-center">
                                <Award className="w-7 h-7 text-violet-400" />
                            </div>
                            <p className="font-medium text-card-foreground">Tidak ada sertifikat</p>
                            <p className="text-muted-foreground text-sm mt-1">Sertifikat akan muncul setelah ada yang diterbitkan</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredCerts.map(cert => (
                                <div key={cert.id}
                                    className={`bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all ${!cert.is_active ? 'opacity-60' : ''}`}>
                                    <div className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cert.is_active ? 'bg-amber-100' : 'bg-muted'}`}>
                                                <Award className={`w-5 h-5 ${cert.is_active ? 'text-amber-600' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-card-foreground truncate">{cert.user_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{cert.course_title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{cert.certificate_number} &middot; {new Date(cert.issued_at).toLocaleDateString('id-ID')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <Badge className={cert.is_active ? 'bg-green-100 text-green-700 border-0' : 'bg-muted text-muted-foreground border-0'}>
                                                {cert.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                            <button onClick={() => handleDownloadCert(cert.id)}
                                                className="p-2 text-muted-foreground hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Download">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleToggleCert(cert.id)}
                                                className="p-2 rounded-lg transition-colors" title={cert.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                                {cert.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                                            </button>
                                            <button onClick={() => handleDeleteCert(cert.id, `${cert.certificate_number} - ${cert.user_name}`)}
                                                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
