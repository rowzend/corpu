'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    Network, Search, ChevronRight, ChevronDown, Loader2, Layers, Shapes, BookOpen,
    Info, Building2, Target, Plus, Trash2, ArrowUp, ArrowDown, Save,
} from 'lucide-react';
import {
    getDesainPembelajaranTree,
    type DesainPembelajaranNode,
} from '@/lib/api/idp';
import { simpegService, type UnitKerjaTreeNode, type UnitKerjaDesain } from '@/lib/services';
import { usePermission } from '@/lib/hooks/usePermission';
import { showError, showSuccess, showWarning, showDeleteConfirm } from '@/lib/sweetalert';
import { handleApiError } from '@/lib/api';

const TIPE_CONFIG = {
    metode: { icon: Layers, label: 'Metode', color: 'text-blue-600', bg: 'bg-blue-100' },
    bentuk: { icon: Shapes, label: 'Bentuk', color: 'text-purple-600', bg: 'bg-purple-100' },
    kegiatan: { icon: BookOpen, label: 'Kegiatan', color: 'text-green-600', bg: 'bg-green-100' },
} as const;

function collectIds<T extends { children?: T[] }>(nodes: T[], keyFn: (n: T) => string): string[] {
    const ids: string[] = [];
    for (const n of nodes) {
        if (n.children && n.children.length > 0) {
            ids.push(keyFn(n));
            ids.push(...collectIds(n.children, keyFn));
        }
    }
    return ids;
}

function filterTree<T extends { nama?: string; nm_opd?: string; children?: T[] }>(
    nodes: T[], q: string, nameFn: (n: T) => string
): T[] {
    if (!q) return nodes;
    const lower = q.toLowerCase();
    const result: T[] = [];
    for (const node of nodes) {
        const children = node.children ? filterTree(node.children, q, nameFn) : [];
        if (nameFn(node).toLowerCase().includes(lower) || children.length > 0) {
            result.push({ ...node, children });
        }
    }
    return result;
}

interface UraianRow { key: number; uraian: string }

interface KompRow { key: number; uraian: string; tujuan: UraianRow[] }

let uraianRowKeySeq = -1;
const nextUraianKey = () => --uraianRowKeySeq;

function UraianListEditor({ icon, title, hint, rows, onChange, canEdit }: {
    icon: React.ReactNode;
    title: string;
    hint?: string;
    rows: UraianRow[];
    onChange: (rows: UraianRow[]) => void;
    canEdit: boolean;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                    {icon}
                    {title}
                    {hint && <span className="text-[11px] text-gray-400">({hint})</span>}
                </Label>
                {canEdit && (
                    <Button
                        type="button" variant="outline" size="sm"
                        onClick={() => onChange([...rows, { key: nextUraianKey(), uraian: '' }])}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                    </Button>
                )}
            </div>
            {rows.length === 0 && (
                <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-md p-3 text-center">
                    Belum ada data.
                </p>
            )}
            {rows.map((row, i) => (
                <div key={row.key} className="flex items-start gap-2">
                    <span className="w-6 h-6 mt-1 flex items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 flex-shrink-0">
                        {i + 1}
                    </span>
                    <Textarea
                        value={row.uraian}
                        onChange={(e) => onChange(rows.map(r =>
                            r.key === row.key ? { ...r, uraian: e.target.value } : r))}
                        placeholder={`Baris #${i + 1}`}
                        rows={2}
                        disabled={!canEdit}
                        className="min-h-0"
                    />
                    {canEdit && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                                type="button" disabled={i === 0}
                                onClick={() => {
                                    if (i === 0) return;
                                    const next = [...rows];
                                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                    onChange(next);
                                }}
                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                title="Naikkan"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                                type="button" disabled={i === rows.length - 1}
                                onClick={() => {
                                    if (i === rows.length - 1) return;
                                    const next = [...rows];
                                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                                    onChange(next);
                                }}
                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                title="Turunkan"
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange(rows.filter(r => r.key !== row.key))}
                                className="text-gray-400 hover:text-red-600"
                                title="Hapus"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function DesainPembelajaranPage() {
    // ── Tree Unit Kerja (DB lokal asncorpu) ──────────────────────────
    const [ukTree, setUkTree] = useState<UnitKerjaTreeNode[]>([]);
    const [ukStats, setUkStats] = useState({ total_shown: 0, total_all: 0 });
    const [ukLoading, setUkLoading] = useState(true);
    const [ukExpanded, setUkExpanded] = useState<Set<string>>(new Set());
    const [includeInactive, setIncludeInactive] = useState(false);

    const fetchUnitKerja = useCallback(async () => {
        setUkLoading(true);
        try {
            const res = await simpegService.getUnitKerjaTree(includeInactive ? { include_inactive: '1' } : undefined);
            setUkTree(res.data || []);
            setUkStats(res.stats || { total_shown: 0, total_all: 0 });
            // expand root + level periode tahun saja (tree besar)
            const init = new Set<string>();
            for (const r of res.data || []) {
                init.add(`uk-${r.id_opd}`);
                for (const c of r.children || []) init.add(`uk-${c.id_opd}`);
            }
            setUkExpanded(init);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Unit Kerja');
        } finally {
            setUkLoading(false);
        }
    }, [includeInactive]);

    useEffect(() => {
        fetchUnitKerja();
    }, [fetchUnitKerja]);

    // ── Tree Desain Pembelajaran (master data IDP) ───────────────────
    const [dpTree, setDpTree] = useState<DesainPembelajaranNode[]>([]);
    const [dpStats, setDpStats] = useState({ total_metode: 0, total_bentuk: 0, total_kegiatan: 0 });
    const [dpLoading, setDpLoading] = useState(true);
    const [dpExpanded, setDpExpanded] = useState<Set<string>>(new Set());

    const fetchDesain = useCallback(async () => {
        setDpLoading(true);
        try {
            const res = await getDesainPembelajaranTree();
            setDpTree(res.data || []);
            setDpStats(res.stats || { total_metode: 0, total_bentuk: 0, total_kegiatan: 0 });
            setDpExpanded(new Set(collectIds(res.data || [], n => `dp-${n.id}`)));
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Data');
        } finally {
            setDpLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDesain();
    }, [fetchDesain]);

    const [search, setSearch] = useState('');
    const ukFiltered = useMemo(() => filterTree(ukTree, search, n => n.nm_opd), [ukTree, search]);
    const dpFiltered = useMemo(() => filterTree(dpTree, search, n => n.nama), [dpTree, search]);

    const toggleUk = (key: string) => {
        setUkExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const toggleDp = (key: string) => {
        setDpExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    // ── Desain Pembelajaran per Unit Kerja ───────────────────────────
    const { hasPermission, isSuperadmin } = usePermission();
    const canEdit = isSuperadmin || hasPermission('api_simpeg', 'change', 'unit_kerja');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<UnitKerjaTreeNode | null>(null);
    const [desainLoading, setDesainLoading] = useState(false);
    const [desainId, setDesainId] = useState<number | null>(null);
    const [keterangan, setKeterangan] = useState('');
    const [kompRows, setKompRows] = useState<KompRow[]>([]);
    const [savingDesain, setSavingDesain] = useState(false);

    const updateKompRow = (key: number, patch: Partial<KompRow>) =>
        setKompRows(prev => prev.map(k => (k.key === key ? { ...k, ...patch } : k)));

    const addKompRow = () =>
        setKompRows(prev => [...prev, { key: nextUraianKey(), uraian: '', tujuan: [] }]);

    const removeKompRow = (key: number) =>
        setKompRows(prev => prev.filter(k => k.key !== key));

    const moveKompRow = (index: number, dir: -1 | 1) =>
        setKompRows(prev => {
            const target = index + dir;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });

    const openDesainDialog = useCallback(async (unit: UnitKerjaTreeNode) => {
        setSelectedUnit(unit);
        setDesainId(null);
        setKeterangan('');
        setKompRows([]);
        setDialogOpen(true);
        setDesainLoading(true);
        try {
            const res = await simpegService.getUnitKerjaDesain(unit.id_opd);
            if (res.data) {
                const d: UnitKerjaDesain = res.data;
                setDesainId(d.id);
                setKeterangan(d.keterangan || '');
                setKompRows((d.kompetensi_teknis || []).map(k => ({
                    key: nextUraianKey(),
                    uraian: k.uraian,
                    tujuan: (k.tujuan || []).map(t => ({ key: t.id, uraian: t.uraian })),
                })));
            }
        } catch (error) {
            showError(handleApiError(error), 'Gagal Memuat Desain');
        } finally {
            setDesainLoading(false);
        }
    }, []);

    const handleSaveDesain = async () => {
        if (!selectedUnit) return;
        const kompClean = kompRows
            .map(k => ({
                uraian: k.uraian.trim(),
                tujuan: k.tujuan.map(t => t.uraian.trim()).filter(Boolean),
            }))
            .filter(k => k.uraian);
        if (kompClean.length === 0 && !keterangan.trim()) {
            showWarning('Isi minimal satu kompetensi teknis atau keterangan.');
            return;
        }
        setSavingDesain(true);
        try {
            await simpegService.saveUnitKerjaDesain(selectedUnit.id_opd, {
                keterangan: keterangan.trim(),
                kompetensi_teknis: kompClean.map((k, i) => ({
                    uraian: k.uraian,
                    urutan: i + 1,
                    tujuan: k.tujuan.map((uraian, j) => ({ uraian, urutan: j + 1 })),
                })),
            });
            showSuccess(`Desain pembelajaran "${selectedUnit.nm_opd}" tersimpan.`);
            setDialogOpen(false);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menyimpan');
        } finally {
            setSavingDesain(false);
        }
    };

    const handleDeleteDesain = async () => {
        if (!selectedUnit || !desainId) return;
        const ok = await showDeleteConfirm(selectedUnit.nm_opd, 'desain pembelajaran unit kerja');
        if (!ok) return;
        try {
            await simpegService.deleteUnitKerjaDesain(selectedUnit.id_opd);
            showSuccess('Desain pembelajaran dihapus.');
            setDialogOpen(false);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Menghapus');
        }
    };

    const renderUkNodes = (nodes: UnitKerjaTreeNode[], depth: number): React.ReactNode =>
        nodes.map(node => {
            const key = `uk-${node.id_opd}`;
            const hasChildren = !!node.children && node.children.length > 0;
            const isOpen = search ? true : ukExpanded.has(key);
            const isPeriode = /^TAHUN\s/i.test(node.nm_opd || '');
            const isContext = !!node._context;

            return (
                <div key={key}>
                    <div
                        className={`group flex items-center gap-2 rounded-lg py-1.5 pr-3 transition-colors ${
                            hasChildren ? 'cursor-pointer hover:bg-muted/70' : ''
                        } ${depth === 0 ? 'bg-muted/30 font-bold' : ''} ${isContext ? 'opacity-60' : ''}`}
                        style={{ paddingLeft: `${depth * 24 + 8}px` }}
                        onClick={() => hasChildren && toggleUk(key)}
                    >
                        {hasChildren ? (
                            <span
                                className="text-gray-400 flex-shrink-0"
                                onClick={(e) => { e.stopPropagation(); toggleUk(key); }}
                            >
                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                        ) : (
                            <span className="w-4 flex-shrink-0" />
                        )}
                        <span
                            className="flex items-center gap-2 flex-1 min-w-0 rounded-md px-1 -mx-1 hover:bg-blue-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); openDesainDialog(node); }}
                            title={`Klik untuk kelola desain pembelajaran: ${node.nm_opd}`}
                        >
                            <span className={`flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 ${
                                isPeriode ? 'bg-amber-100' : node.is_opd_induk ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                                <Building2 className={`w-3.5 h-3.5 ${
                                    isPeriode ? 'text-amber-600' : node.is_opd_induk ? 'text-purple-600' : 'text-blue-600'
                                }`} />
                            </span>
                            <span className={`text-sm flex-shrink-0 ${depth === 0 ? 'font-bold text-gray-900 uppercase' : isPeriode ? 'font-semibold text-amber-800 uppercase' : 'font-medium text-gray-800'} max-w-[28rem] truncate`} title={node.nm_opd}>
                                {node.nm_opd}
                            </span>
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                            {isPeriode && (
                                <Badge variant="outline" className="text-[10px] px-1.5 border-amber-300 text-amber-700">Periode SOTK</Badge>
                            )}
                            {node.jenis_organisasi && !isPeriode && (
                                <Badge variant="outline" className="text-[10px] px-1.5 text-gray-500">{node.jenis_organisasi}</Badge>
                            )}
                            {(node.status !== 1 || isContext) && (
                                <Badge variant="outline" className="text-[10px] px-1.5 text-gray-400">Riwayat</Badge>
                            )}
                            {hasChildren && <span className="text-[11px] text-gray-400">{node.children!.length} sub unit</span>}
                            <span className="text-[10px] text-gray-300">ID: {node.id_opd}</span>
                        </span>
                    </div>
                    {hasChildren && isOpen && (
                        <div className="border-l border-gray-200" style={{ marginLeft: `${depth * 24 + 20}px` }}>
                            {renderUkNodes(node.children!, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });

    const renderDpNodes = (nodes: DesainPembelajaranNode[], depth: number): React.ReactNode =>
        nodes.map(node => {
            const key = `dp-${node.id}`;
            const cfg = TIPE_CONFIG[node.tipe];
            const Icon = cfg.icon;
            const hasChildren = !!node.children && node.children.length > 0;
            const isOpen = search ? true : dpExpanded.has(key);

            return (
                <div key={key}>
                    <div
                        className={`group flex items-center gap-2 rounded-lg py-2 pr-3 transition-colors ${
                            hasChildren ? 'cursor-pointer hover:bg-muted/70' : ''
                        } ${depth === 0 ? 'bg-muted/30' : ''}`}
                        style={{ paddingLeft: `${depth * 24 + 8}px` }}
                        onClick={() => hasChildren && toggleDp(key)}
                    >
                        {hasChildren ? (
                            <span className="text-gray-400 flex-shrink-0">
                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                        ) : (
                            <span className="w-4 flex-shrink-0" />
                        )}
                        <span className={`flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 ${cfg.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </span>
                        <span className={`text-sm flex-shrink-0 font-medium ${depth === 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                            {node.nama}
                        </span>
                        {node.persentase !== undefined && (
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5">{node.persentase}%</Badge>
                        )}
                        {!node.is_active && (
                            <Badge variant="outline" className="text-gray-400 text-[10px] px-1.5">Non-Aktif</Badge>
                        )}
                        <span className="ml-auto flex items-center gap-2 flex-shrink-0">
                            {hasChildren && <span className="text-[11px] text-gray-400">{node.children!.length} item</span>}
                            <span className="text-[10px] uppercase tracking-wide text-gray-300 group-hover:text-gray-400">{cfg.label}</span>
                        </span>
                    </div>
                    {hasChildren && isOpen && (
                        <div className="border-l border-gray-200" style={{ marginLeft: `${depth * 24 + 20}px` }}>
                            {renderDpNodes(node.children!, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Network className="w-6 h-6 text-blue-600" />
                        Desain Pembelajaran
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Struktur organisasi (unit kerja) &amp; hierarki desain pembelajaran IDP
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Cari unit kerja / metode / bentuk / kegiatan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setUkExpanded(new Set(collectIds(ukFiltered, n => `uk-${n.id_opd}`)));
                        setDpExpanded(new Set(collectIds(dpFiltered, n => `dp-${n.id}`)));
                    }}
                >
                    Expand Semua
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setUkExpanded(new Set()); setDpExpanded(new Set()); }}>
                    Tutup Semua
                </Button>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none px-2">
                    <input
                        type="checkbox"
                        checked={includeInactive}
                        onChange={(e) => setIncludeInactive(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    Unit Non-Aktif
                </label>
            </div>

            {/* ── Section 1: Tree Unit Kerja ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Struktur Organisasi — Unit Kerja</h2>
                        <Badge variant="outline" className="text-[10px]">{ukStats.total_shown} unit</Badge>
                        {!includeInactive && ukStats.total_all > ukStats.total_shown && (
                            <span className="text-[11px] text-gray-400">({ukStats.total_all} termasuk non-aktif)</span>
                        )}
                    </div>
                </div>
                {ukLoading ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memuat struktur unit kerja...
                    </div>
                ) : ukFiltered.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        {search ? (
                            <p>Tidak ada unit kerja yang cocok dengan &ldquo;{search}&rdquo;</p>
                        ) : (
                            <>
                                <p>Belum ada data unit kerja</p>
                                <p className="text-sm">Sinkronkan dari menu ESIMPEG → Unit Kerja terlebih dahulu</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="py-2 max-h-[32rem] overflow-y-auto">{renderUkNodes(ukFiltered, 0)}</div>
                )}
            </div>

            {/* ── Section 2: Tree Desain Pembelajaran ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-semibold text-gray-900">Hierarki Desain Pembelajaran IDP</h2>
                        <Badge variant="outline" className="text-[10px]">
                            {dpStats.total_metode} metode · {dpStats.total_bentuk} bentuk · {dpStats.total_kegiatan} kegiatan
                        </Badge>
                    </div>
                </div>
                {dpLoading ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memuat desain pembelajaran...
                    </div>
                ) : dpFiltered.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        {search ? (
                            <p>Tidak ada hasil untuk &ldquo;{search}&rdquo;</p>
                        ) : (
                            <p>Belum ada master data desain pembelajaran</p>
                        )}
                    </div>
                ) : (
                    <div className="py-2 max-h-[32rem] overflow-y-auto">{renderDpNodes(dpFiltered, 0)}</div>
                )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Info:</p>
                        <p className="text-sm text-blue-700">
                            Klik nama unit kerja untuk melihat/mengelola desain pembelajarannya
                            (1 kompetensi teknis + beberapa tujuan pembelajaran). Tree unit kerja dibangun
                            dari data sinkronisasi ESIMPEG berdasarkan hierarki SOTK per periode tahun;
                            unit lama/non-aktif ditandai &ldquo;Riwayat&rdquo;. Hierarki desain pembelajaran berasal dari
                            Master Data IDP (Metode → Bentuk → Nama Kegiatan/Program).
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Dialog Desain Pembelajaran Unit Kerja ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <Target className="w-5 h-5 text-blue-600" />
                            Desain Pembelajaran — {selectedUnit?.nm_opd}
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            {selectedUnit?.nm_opd} · ID {selectedUnit?.id_opd}
                            {canEdit ? ' — beberapa kompetensi teknis, masing-masing punya daftar tujuan pembelajarannya sendiri.' : ' (mode lihat saja)'}
                        </DialogDescription>
                    </DialogHeader>

                    {desainLoading ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin" /> Memuat...
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Kompetensi Teknis (kartu, tiap kartu punya tujuannya sendiri) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5 text-purple-600" />
                                        Kompetensi Teknis
                                        <span className="text-[11px] text-gray-400">
                                            (tiap kompetensi punya daftar tujuannya sendiri)
                                        </span>
                                    </Label>
                                    {canEdit && (
                                        <Button type="button" variant="outline" size="sm" onClick={addKompRow}>
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Kompetensi
                                        </Button>
                                    )}
                                </div>
                                {kompRows.length === 0 && (
                                    <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-md p-3 text-center">
                                        Belum ada kompetensi teknis.
                                    </p>
                                )}
                                {kompRows.map((komp, i) => (
                                    <div key={komp.key} className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/50">
                                        <div className="flex items-start gap-2">
                                            <span className="w-6 h-6 mt-1 flex items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-purple-700 flex-shrink-0">
                                                {i + 1}
                                            </span>
                                            <Textarea
                                                value={komp.uraian}
                                                onChange={(e) => updateKompRow(komp.key, { uraian: e.target.value })}
                                                placeholder={`Kompetensi teknis #${i + 1}`}
                                                rows={2}
                                                disabled={!canEdit}
                                                className="min-h-0 bg-white"
                                            />
                                            {canEdit && (
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    <button
                                                        type="button" disabled={i === 0}
                                                        onClick={() => moveKompRow(i, -1)}
                                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                                        title="Naikkan kompetensi"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button" disabled={i === kompRows.length - 1}
                                                        onClick={() => moveKompRow(i, 1)}
                                                        className="text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                                        title="Turunkan kompetensi"
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeKompRow(komp.key)}
                                                        className="text-gray-400 hover:text-red-600"
                                                        title="Hapus kompetensi beserta tujuannya"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tujuan pembelajaran milik kompetensi ini */}
                                        <div className="pl-8 border-l-2 border-purple-100 ml-3">
                                            <UraianListEditor
                                                icon={<BookOpen className="w-3.5 h-3.5 text-green-600" />}
                                                title="Tujuan Pembelajaran"
                                                hint="khusus kompetensi ini"
                                                rows={komp.tujuan}
                                                onChange={(rows) => updateKompRow(komp.key, { tujuan: rows })}
                                                canEdit={canEdit}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Keterangan */}
                            <div className="space-y-2">
                                <Label>Keterangan</Label>
                                <Textarea
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    placeholder="Catatan tambahan (opsional)"
                                    rows={2}
                                    disabled={!canEdit}
                                    className="min-h-0"
                                />
                            </div>

                            {canEdit && (
                                <div className="flex justify-between pt-2 border-t">
                                    <Button
                                        type="button" variant="destructive" size="sm"
                                        onClick={handleDeleteDesain} disabled={!desainId}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" /> Hapus Desain
                                    </Button>
                                    <Button type="button" onClick={handleSaveDesain} disabled={savingDesain}>
                                        {savingDesain
                                            ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                            : <Save className="w-4 h-4 mr-1" />}
                                        Simpan
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
