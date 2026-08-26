'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
    Users, Plus, Pencil, Trash2, X, Camera, Mail, Phone,
    Hash, Building2, ArrowUpDown, CheckCircle, XCircle,
    ChevronRight, ChevronDown, UserPlus, FolderTree, Layers,
    Database, UserCheck
} from 'lucide-react';
import { profileService, simpegService, type Personalia, type Position, type BupatiItem } from '@/lib/services';
import { showSuccess, showError, showDeleteConfirm, showLoading, closeLoading } from '@/lib/sweetalert';
import { useTranslations } from 'next-intl';
import { LazySearchSelect } from '@/components/ui/lazy-search-select';
import { SearchSelect } from '@/components/ui/search-select';
import { ESIMPEG_MEDIA_URL, handleApiError } from '@/lib/api';

function photoUrl(path: string | null): string | null {
    if (!path) return null;
    const url = path.startsWith('http://') || path.startsWith('https://') ? new URL(path) : null;
    const relativePath = url ? url.pathname.replace(/^\/media\//, '') : path;
    const base = typeof window !== 'undefined' ? `${window.location.origin}/media` : '/media';
    return `${base}/${relativePath}`;
}

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

const emptyForm = {
    name: '', nip: '', description: '',
    email: '', phone: '', unit_kerja: '', order: 0,
};

interface FormState {
    name: string;
    nip: string;
    description: string;
    email: string;
    phone: string;
    unit_kerja: string;
    order: number;
}

export default function PersonaliaPage() {
    const t = useTranslations('admin.personalia');
    const [tree, setTree] = useState<Position[]>([]);
    const [personalia, setPersonalia] = useState<Personalia[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Personalia | null>(null);
    const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [dataSource, setDataSource] = useState<'manual' | 'pegawai' | 'bupati'>('manual');
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [bupatiOpts, setBupatiOpts] = useState<{ value: number; label: string }[]>([]);
    const [bupatiDataMap, setBupatiDataMap] = useState<Map<number, BupatiItem>>(new Map());

    // New position inline form
    const [showNewPosition, setShowNewPosition] = useState(false);
    const [newPositionName, setNewPositionName] = useState('');
    const [newPositionParent, setNewPositionParent] = useState<number | null>(null);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (dataSource === 'bupati' && bupatiOpts.length === 0) {
            simpegService.getBupatiList({ per_page: 100 })
                .then(res => {
                    setBupatiOpts(res.data.map(b => ({
                        value: b.id_bupati,
                        label: `${b.gelar_depan || ''} ${b.nama} ${b.gelar_belakang || ''} - ${b.nama_jabatan || ''}`.trim(),
                    })));
                    const map = new Map<number, BupatiItem>();
                    res.data.forEach(b => map.set(b.id_bupati, b));
                    setBupatiDataMap(map);
                })
                .catch(() => {});
        }
    }, [dataSource]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [posData, perData] = await Promise.all([
                profileService.getPositions(),
                profileService.getPersonalia(),
            ]);
            setTree(posData);
            setPersonalia(perData);
        } catch (err) {
            console.error(err);
            showError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const allPositionsFlat = useMemo(() => flattenTree(tree), [tree]);

    const fetchPegawaiOptions = useCallback(async (query: string) => {
        const res = await simpegService.getPegawaiList({ search: query, per_page: 20 });
        return res.data.map(p => ({
            value: p.id_pegawai,
            label: `${p.nama_pegawai} (${p.nip_baru || p.nip_lama || '-'}) - ${p.nama_jabatan || ''}`,
        }));
    }, []);

    const handlePegawaiSelect = async (id: string | number | null) => {
        const numId = id !== null ? Number(id) : null;
        setSelectedSourceId(numId);
        if (!numId) return;
        showLoading('Mengambil data pegawai...');
        try {
            const res = await simpegService.getPegawaiDetail(numId);
            const p = res.data;
            setForm({
                name: p.nama_pegawai,
                nip: p.nip_baru || p.nip_lama || '',
                description: '',
                email: '',
                phone: p.no_hp || '',
                unit_kerja: p.nm_opd || p.nm_sub_opd || '',
                order: 0,
            });
            if (p.nama_jabatan) {
                const match = allPositionsFlat.find(
                    ({ pos }) => pos.name.toLowerCase() === p.nama_jabatan!.toLowerCase()
                );
                if (match) setSelectedPositionId(match.pos.id);
            }
            if (p.pas_foto) {
                setPhotoPreview(`${ESIMPEG_MEDIA_URL}/${p.pas_foto}`);
                setPhotoFile(null);
            }
            closeLoading();
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    const handleBupatiSelect = (id: string | number | null) => {
        const numId = id !== null ? Number(id) : null;
        setSelectedSourceId(numId);
        if (!numId) return;
        const b = bupatiDataMap.get(numId);
        if (!b) return;
        setForm({
            name: `${b.gelar_depan || ''} ${b.nama} ${b.gelar_belakang || ''}`.trim(),
            nip: b.nik || '',
            description: '',
            email: '',
            phone: '',
            unit_kerja: '',
            order: 0,
        });
        if (b.nama_jabatan) {
            const match = allPositionsFlat.find(
                ({ pos }) => pos.name.toLowerCase() === b.nama_jabatan!.toLowerCase()
            );
            if (match) setSelectedPositionId(match.pos.id);
        }
        if (b.foto) {
            setPhotoPreview(`${ESIMPEG_MEDIA_URL}/${b.foto}`);
            setPhotoFile(null);
        }
    };

    const handleDataSourceChange = (source: 'manual' | 'pegawai' | 'bupati') => {
        setDataSource(source);
        setSelectedSourceId(null);
        if (source === 'manual') {
            setForm({ ...emptyForm });
            setSelectedPositionId(null);
        }
    };

    const grouped = useMemo(() => {
        const map = new Map<number, Personalia[]>();
        const ungrouped: Personalia[] = [];
        for (const p of personalia) {
            if (p.position_fk != null) {
                const arr = map.get(p.position_fk) || [];
                arr.push(p);
                map.set(p.position_fk, arr);
            } else {
                ungrouped.push(p);
            }
        }
        return { grouped: map, ungrouped };
    }, [personalia]);

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
        setSelectedPositionId(null);
        setPhotoPreview(null);
        setPhotoFile(null);
        setRemovePhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setEditing(null);
        setShowForm(false);
        setShowNewPosition(false);
        setNewPositionName('');
        setNewPositionParent(null);
        setDataSource('manual');
        setSelectedSourceId(null);
    };

    const openAdd = (positionId?: number) => {
        resetForm();
        setSelectedPositionId(positionId ?? null);
        setShowForm(true);
    };

    const openEdit = (item: Personalia) => {
        setForm({
            name: item.name,
            nip: item.nip || '',
            description: item.description || '',
            email: item.email || '',
            phone: item.phone || '',
            unit_kerja: item.unit_kerja || '',
            order: item.order,
        });
        setSelectedPositionId(item.position_fk);
        setPhotoPreview(item.photo ? photoUrl(item.photo) : null);
        setPhotoFile(null);
        setRemovePhoto(false);
        setEditing(item);
        setShowForm(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setRemovePhoto(false);
        }
    };

    const handleAddNewPosition = async () => {
        const name = newPositionName.trim();
        if (!name) {
            showError('Nama jabatan harus diisi');
            return;
        }
        showLoading('Menyimpan jabatan...');
        try {
            const pos = await profileService.createPosition({
                name,
                parent: newPositionParent,
                order: allPositionsFlat.length,
            });
            await loadData();
            setSelectedPositionId(pos.id);
            setShowNewPosition(false);
            setNewPositionName('');
            setNewPositionParent(null);
            closeLoading();
            showSuccess('Jabatan berhasil ditambahkan');
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            showError('Nama harus diisi');
            return;
        }
        if (selectedPositionId == null) {
            showError('Jabatan harus dipilih');
            return;
        }
        const flatPos = allPositionsFlat.find(p => p.pos.id === selectedPositionId);
        const positionName = flatPos?.pos.name || '';
        showLoading(editing ? t('saving_edit') : t('saving_add'));
        try {
            const payload: Record<string, any> = {
                ...form,
                position: positionName,
                position_fk: selectedPositionId,
            };
            if (!editing && !photoFile && dataSource === 'bupati' && selectedSourceId) {
                payload.source_bupati_id = selectedSourceId;
            } else if (!editing && !photoFile && dataSource === 'pegawai' && selectedSourceId) {
                payload.source_pegawai_id = selectedSourceId;
            }
            if (editing) {
                if (removePhoto) {
                    await profileService.updatePersonalia(editing.id, { ...payload, photo: '' });
                } else {
                    await profileService.updatePersonalia(editing.id, payload, photoFile);
                }
            } else {
                await profileService.createPersonalia(payload, photoFile);
            }
            await loadData();
            resetForm();
            closeLoading();
            showSuccess(editing ? t('save_success') : t('create_success'));
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    const handleDelete = async (item: Personalia) => {
        const confirmed = await showDeleteConfirm(item.name, t('delete_confirm_name'));
        if (!confirmed) return;
        showLoading(t('deleting'));
        try {
            await profileService.deletePersonalia(item.id);
            await loadData();
            closeLoading();
            showSuccess(t('delete_success'));
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    const toggleActive = async (item: Personalia) => {
        showLoading(t('updating'));
        try {
            await profileService.updatePersonalia(item.id, { is_active: !item.is_active });
            await loadData();
            closeLoading();
        } catch (err) {
            closeLoading();
            showError(handleApiError(err));
        }
    };

    const countPersonalia = (posId: number): number => {
        return (grouped.grouped.get(posId) || []).length;
    };

    const renderPersonCard = (item: Personalia) => (
        <div key={item.id}
            className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 p-4">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                    {item.photo ? (
                        <img src={photoUrl(item.photo) || ''} alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                            <span className="text-white text-lg font-bold">{item.name.charAt(0)}</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground truncate">{item.name}</p>
                        {item.nip && <p className="text-xs text-muted-foreground">{t('nip_prefix')}{item.nip}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground truncate">{item.position_name || item.position}</p>
                        {item.unit_kerja && <p className="text-xs text-muted-foreground truncate">{item.unit_kerja}</p>}
                    </div>
                    <div className="hidden md:block">
                        {item.email && <p className="text-xs text-muted-foreground truncate">{item.email}</p>}
                        {item.phone && <p className="text-xs text-muted-foreground">{item.phone}</p>}
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button onClick={() => toggleActive(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                item.is_active
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {item.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {item.is_active ? t('active') : t('inactive')}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(item)}
                        className="p-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title={t('edit_tooltip')}>
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title={t('delete_tooltip')}>
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="md:hidden flex items-center gap-3 mt-3 pt-3 border-t border-border">
                <button onClick={() => toggleActive(item)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                        item.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {item.is_active ? t('active') : t('inactive')}
                </button>
                {item.email && <span className="text-xs text-muted-foreground">{item.email}</span>}
                {item.phone && <span className="text-xs text-muted-foreground">{item.phone}</span>}
            </div>
        </div>
    );

    const renderPositionNode = (pos: Position, depth: number = 0) => {
        const people = grouped.grouped.get(pos.id) || [];
        const hasChildren = (pos.children?.length ?? 0) > 0;
        const isExpanded = expandedIds.has(pos.id);
        const totalPeople = people.length + (pos.children || []).reduce((sum, c) => sum + (grouped.grouped.get(c.id) || []).length, 0);

        return (
            <div key={pos.id} className="space-y-2">
                <div
                    className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer"
                    style={{ marginLeft: depth * 24 }}
                    onClick={() => toggleExpand(pos.id)}
                >
                    <div className="flex items-center gap-3">
                        <button className="flex-shrink-0 text-muted-foreground hover:text-card-foreground transition-colors">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                            depth === 0
                                ? 'bg-gradient-to-br from-emerald-400 to-green-600'
                                : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                        }`}>
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-card-foreground">{pos.name}</p>
                            <p className="text-xs text-muted-foreground">{totalPeople} orang</p>
                        </div>
                        {hasChildren && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {pos.children?.length} sub
                            </span>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); openAdd(pos.id); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                        >
                            <UserPlus className="w-3.5 h-3.5" /> Tambah
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-l-2 border-emerald-200 ml-12 pl-4 space-y-2">
                        {pos.children?.map(child => renderPositionNode(child, depth + 1))}
                        {people.length > 0 && pos.children?.length > 0 && (
                            <div className="border-t border-border my-2" />
                        )}
                        {people.map(renderPersonCard)}
                        {people.length === 0 && (!pos.children || pos.children.length === 0) && (
                            <p className="text-sm text-muted-foreground italic py-2">Belum ada personalia</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <FolderTree className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{t('page_title')}</h1>
                            <p className="text-emerald-100 text-sm">{t('page_desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openAdd()}
                        className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> {t('add')}
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {editing ? t('dialog_title_edit') : t('dialog_title_add')}
                                    </h2>
                                    <p className="text-emerald-100 text-sm mt-0.5">
                                        {editing ? t('dialog_desc_edit') : t('dialog_desc_add')}
                                    </p>
                                </div>
                                <button onClick={resetForm} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Data Source Selector */}
                            {!editing && (
                                <div className="mb-6 p-4 bg-muted rounded-xl border border-border">
                                    <label className="block text-sm font-medium text-card-foreground mb-3">
                                        <Database className="w-4 h-4 inline mr-1.5" />
                                        Sumber Data
                                    </label>
                                    <div className="flex gap-2">
                                        {(['manual', 'pegawai', 'bupati'] as const).map(source => (
                                            <button
                                                key={source}
                                                type="button"
                                                onClick={() => handleDataSourceChange(source)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                                                    dataSource === source
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-500 shadow-sm'
                                                        : 'bg-card text-muted-foreground border-border hover:border-emerald-300 hover:text-card-foreground'
                                                }`}
                                            >
                                                {source === 'manual' ? <Users className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                {source === 'manual' ? 'Manual' : source === 'pegawai' ? 'Dari Pegawai' : 'Dari Bupati'}
                                            </button>
                                        ))}
                                    </div>
                                    {dataSource === 'pegawai' && (
                                        <div className="mt-3">
                                            <LazySearchSelect
                                                fetchFn={fetchPegawaiOptions}
                                                value={selectedSourceId}
                                                onChange={handlePegawaiSelect}
                                                placeholder="Cari pegawai berdasarkan nama/NIP..."
                                                searchPlaceholder="Ketik nama atau NIP pegawai..."
                                                minChars={2}
                                            />
                                        </div>
                                    )}
                                    {dataSource === 'bupati' && (
                                        <div className="mt-3">
                                            <SearchSelect
                                                options={bupatiOpts}
                                                value={selectedSourceId}
                                                onChange={handleBupatiSelect}
                                                placeholder="Pilih Bupati/Wakil Bupati..."
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Photo */}
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-card-foreground mb-2">{t('label_photo')}</label>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted group cursor-pointer hover:border-emerald-300 transition-colors relative"
                                            onClick={() => fileInputRef.current?.click()}>
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                                    <p className="text-xs text-muted-foreground">{t('upload_photo')}</p>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        {photoPreview && (
                                            <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); setRemovePhoto(true); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium">
                                                {t('remove_photo')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="md:col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-card-foreground mb-1.5">
                                            {t('label_name')} <span className="text-red-500">*</span>
                                        </label>
                                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" placeholder={t('name_placeholder')} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-card-foreground mb-1.5">
                                                {t('label_position')} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedPositionId ?? ''}
                                                    onChange={e => setSelectedPositionId(e.target.value ? Number(e.target.value) : null)}
                                                    className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm"
                                                >
                                                    <option value="">-- Pilih Jabatan --</option>
                                                    {allPositionsFlat.map(({ pos, depth }) => (
                                                        <option key={pos.id} value={pos.id}>
                                                            {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '└ ' : ''}{pos.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => setShowNewPosition(true)}
                                                    className="px-3 py-2.5 border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-card-foreground"
                                                    title="Tambah Jabatan Baru"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {showNewPosition && (
                                                <div className="mt-2 space-y-2 p-3 bg-muted rounded-xl border border-border">
                                                    <input
                                                        type="text"
                                                        value={newPositionName}
                                                        onChange={e => setNewPositionName(e.target.value)}
                                                        placeholder="Nama jabatan baru"
                                                        className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm bg-card"
                                                        autoFocus
                                                        onKeyDown={e => { if (e.key === 'Enter') handleAddNewPosition(); if (e.key === 'Escape') { resetNewPosition(); } }}
                                                    />
                                                    <select
                                                        value={newPositionParent ?? ''}
                                                        onChange={e => setNewPositionParent(e.target.value ? Number(e.target.value) : null)}
                                                        className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm bg-card"
                                                    >
                                                        <option value="">-- Jabatan Induk (root) --</option>
                                                        {allPositionsFlat.filter(({ pos }) => pos.id !== selectedPositionId).map(({ pos, depth }) => (
                                                            <option key={pos.id} value={pos.id}>
                                                                {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '└ ' : ''}{pos.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={handleAddNewPosition}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">
                                                            Simpan
                                                        </button>
                                                        <button onClick={resetNewPosition}
                                                            className="px-4 py-2 text-sm text-muted-foreground hover:text-card-foreground">
                                                            Batal
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_nip')}</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input type="text" value={form.nip} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" placeholder={t('nip_placeholder')} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_unit')}</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input type="text" value={form.unit_kerja} onChange={e => setForm(f => ({ ...f, unit_kerja: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" placeholder={t('unit_placeholder')} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_order')}</label>
                                            <div className="relative">
                                                <ArrowUpDown className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_email')}</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" placeholder={t('email_placeholder')} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_phone')}</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm" placeholder={t('phone_placeholder')} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-card-foreground mb-1.5">{t('label_description')}</label>
                                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            rows={3} className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-muted focus:bg-card transition-colors text-sm resize-none"
                                            placeholder={t('desc_placeholder')} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border">
                                <button onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-card-foreground bg-muted hover:bg-muted rounded-xl transition-colors">
                                    {t('cancel')}
                                </button>
                                <button onClick={handleSubmit}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-200">
                                    {editing ? t('submit_edit') : t('submit_add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tree View */}
            {loading ? (
                <div className="space-y-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-muted rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-48" />
                                    <div className="h-3 bg-muted rounded w-32" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : tree.length === 0 && personalia.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-16 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-card-foreground mb-1">{t('empty_title')}</h3>
                    <p className="text-muted-foreground mb-6">{t('empty_desc')}</p>
                    <button onClick={() => openAdd()}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-200">
                        <Plus className="w-4 h-4" /> {t('empty_button')}
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {tree.map(pos => renderPositionNode(pos, 0))}

                    {/* Ungrouped personalia */}
                    {grouped.ungrouped.length > 0 && (
                        <div className="space-y-2 mt-6">
                            <div className="bg-card rounded-xl border border-dashed border-border shadow-sm p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-card-foreground">Tanpa Jabatan</p>
                                        <p className="text-xs text-muted-foreground">{grouped.ungrouped.length} orang</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-l-2 border-gray-200 ml-5 pl-4 space-y-2">
                                {grouped.ungrouped.map(renderPersonCard)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    function resetNewPosition() {
        setShowNewPosition(false);
        setNewPositionName('');
        setNewPositionParent(null);
    }
}
