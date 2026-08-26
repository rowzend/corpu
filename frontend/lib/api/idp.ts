import { api } from '../api';

export interface IdpPegawaiRef {
    id: number | null;
    id_pegawai: number | null;
    nip: string;
    nama: string;
    nama_jabatan: string;
    nm_opd: string;
}

export interface IdpAsn {
    id: number;
    asn: IdpPegawaiRef;
    asn_id: number;
    asn_nama: string;
    asn_nip: string;
    asn_jabatan: string;
    asn_opd: string;
    atasan_langsung: IdpPegawaiRef | null;
    atasan_langsung_id: number | null;
    atasan_langsung_nama: string;
    periode_dari: string | null;
    periode_sampai: string | null;
    periode_display: string;
    target_penugasan_idp: string;
    dasar_penyusunan_idp: string;
    tanggal_pengajuan: string | null;
    target_kompetensi: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    catatan: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    approved_by: string | null;
    approved_at: string | null;
}

export interface IdpAsnListResponse {
    status: string;
    data: IdpAsn[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface IdpAsnDetailResponse {
    status: string;
    data: IdpAsn;
}

export interface IdpStatsResponse {
    status: string;
    data: {
        total_idp: number;
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        total_asn: number;
    };
}

export interface IdpAsnPayload {
    asn_id: number;
    atasan_langsung_id?: number | null;
    periode_dari?: string | null;
    periode_sampai?: string | null;
    target_penugasan_idp?: string;
    dasar_penyusunan_idp?: string;
    tanggal_pengajuan?: string | null;
    target_kompetensi?: string;
    status?: 'draft' | 'submitted' | 'approved' | 'rejected';
    catatan?: string;
}

export async function getIdpList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
}): Promise<IdpAsnListResponse> {
    return api.get('/idp/asn/', params);
}

export async function getIdpDetail(id: number): Promise<IdpAsnDetailResponse> {
    return api.get(`/idp/asn/${id}/`);
}

export async function createIdp(data: IdpAsnPayload): Promise<IdpAsnDetailResponse> {
    return api.post('/idp/asn/', data);
}

export async function updateIdp(id: number, data: Partial<IdpAsnPayload>): Promise<IdpAsnDetailResponse> {
    return api.put(`/idp/asn/${id}/`, data);
}

export async function deleteIdp(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/asn/${id}/`);
}

export async function getIdpStats(): Promise<IdpStatsResponse> {
    return api.get('/idp/stats/');
}

export async function getIdpApprovalList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
}): Promise<IdpAsnListResponse> {
    return api.get('/idp/approval/', params);
}

export async function approveIdp(id: number, catatan?: string): Promise<IdpAsnDetailResponse> {
    return api.post(`/idp/approval/${id}/`, { action: 'approve', catatan });
}

export async function rejectIdp(id: number, catatan?: string): Promise<IdpAsnDetailResponse> {
    return api.post(`/idp/approval/${id}/`, { action: 'reject', catatan });
}

export interface JenisKompetensi {
    id: number;
    kode: string;
    nama: string;
    deskripsi: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface JenisKompetensiListResponse {
    status: string;
    data: JenisKompetensi[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface JenisKompetensiDetailResponse {
    status: string;
    data: JenisKompetensi;
}

export interface JenisKompetensiPayload {
    kode?: string;
    nama: string;
    deskripsi?: string;
    is_active?: boolean;
}

export async function getJenisKompetensiList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
}): Promise<JenisKompetensiListResponse> {
    return api.get('/idp/jenis-kompetensi/', params);
}

export async function getJenisKompetensiDetail(id: number): Promise<JenisKompetensiDetailResponse> {
    return api.get(`/idp/jenis-kompetensi/${id}/`);
}

export async function createJenisKompetensi(data: JenisKompetensiPayload): Promise<JenisKompetensiDetailResponse> {
    return api.post('/idp/jenis-kompetensi/', data);
}

export async function updateJenisKompetensi(id: number, data: Partial<JenisKompetensiPayload>): Promise<JenisKompetensiDetailResponse> {
    return api.put(`/idp/jenis-kompetensi/${id}/`, data);
}

export async function deleteJenisKompetensi(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/jenis-kompetensi/${id}/`);
}

export interface NamaKompetensi {
    id: number;
    jenis_kompetensi: {
        id: number;
        kode: string;
        nama: string;
    };
    jenis_kompetensi_id: number;
    jenis_kompetensi_nama: string;
    kode: string;
    nama: string;
    deskripsi: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface NamaKompetensiListResponse {
    status: string;
    data: NamaKompetensi[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface NamaKompetensiDetailResponse {
    status: string;
    data: NamaKompetensi;
}

export interface NamaKompetensiPayload {
    jenis_kompetensi_id: number;
    kode?: string;
    nama: string;
    deskripsi?: string;
    is_active?: boolean;
}

export async function getNamaKompetensiList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
    jenis_kompetensi_id?: number | string;
}): Promise<NamaKompetensiListResponse> {
    return api.get('/idp/nama-kompetensi/', params);
}

export async function getNamaKompetensiDetail(id: number): Promise<NamaKompetensiDetailResponse> {
    return api.get(`/idp/nama-kompetensi/${id}/`);
}

export async function createNamaKompetensi(data: NamaKompetensiPayload): Promise<NamaKompetensiDetailResponse> {
    return api.post('/idp/nama-kompetensi/', data);
}

export async function updateNamaKompetensi(id: number, data: Partial<NamaKompetensiPayload>): Promise<NamaKompetensiDetailResponse> {
    return api.put(`/idp/nama-kompetensi/${id}/`, data);
}

export async function deleteNamaKompetensi(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/nama-kompetensi/${id}/`);
}

export interface PrioritasPengembangan {
    id: number;
    tingkat_prioritas: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface PrioritasPengembanganListResponse {
    status: string;
    data: PrioritasPengembangan[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface PrioritasPengembanganDetailResponse {
    status: string;
    data: PrioritasPengembangan;
}

export interface PrioritasPengembanganPayload {
    tingkat_prioritas: string;
    is_active?: boolean;
}

export async function getPrioritasPengembanganList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
}): Promise<PrioritasPengembanganListResponse> {
    return api.get('/idp/prioritas-pengembangan/', params);
}

export async function getPrioritasPengembanganDetail(id: number): Promise<PrioritasPengembanganDetailResponse> {
    return api.get(`/idp/prioritas-pengembangan/${id}/`);
}

export async function createPrioritasPengembangan(data: PrioritasPengembanganPayload): Promise<PrioritasPengembanganDetailResponse> {
    return api.post('/idp/prioritas-pengembangan/', data);
}

export async function updatePrioritasPengembangan(id: number, data: Partial<PrioritasPengembanganPayload>): Promise<PrioritasPengembanganDetailResponse> {
    return api.put(`/idp/prioritas-pengembangan/${id}/`, data);
}

export async function deletePrioritasPengembangan(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/prioritas-pengembangan/${id}/`);
}

export interface PilarPengembangan {
    id: number;
    nama: string;
    persentase: number;
    deskripsi: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface PilarPengembanganListResponse {
    status: string;
    data: PilarPengembangan[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface PilarPengembanganDetailResponse {
    status: string;
    data: PilarPengembangan;
}

export interface PilarPengembanganPayload {
    nama: string;
    persentase?: number;
    deskripsi?: string;
    is_active?: boolean;
}

export async function getPilarPengembanganList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
}): Promise<PilarPengembanganListResponse> {
    return api.get('/idp/metode-pengembangan-kompetensi/', params);
}

export async function getPilarPengembanganDetail(id: number): Promise<PilarPengembanganDetailResponse> {
    return api.get(`/idp/metode-pengembangan-kompetensi/${id}/`);
}

export async function createPilarPengembangan(data: PilarPengembanganPayload): Promise<PilarPengembanganDetailResponse> {
    return api.post('/idp/metode-pengembangan-kompetensi/', data);
}

export async function updatePilarPengembangan(id: number, data: Partial<PilarPengembanganPayload>): Promise<PilarPengembanganDetailResponse> {
    return api.put(`/idp/metode-pengembangan-kompetensi/${id}/`, data);
}

export async function deletePilarPengembangan(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/metode-pengembangan-kompetensi/${id}/`);
}

export interface JenisKegiatanPengembangan {
    id: number;
    pilar_pengembangan: {
        id: number;
        nama: string;
        persentase: number;
    };
    pilar_pengembangan_id: number;
    pilar_pengembangan_nama: string;
    pilar_pengembangan_persentase: number;
    nama: string;
    deskripsi: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface JenisKegiatanPengembanganListResponse {
    status: string;
    data: JenisKegiatanPengembangan[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface JenisKegiatanPengembanganDetailResponse {
    status: string;
    data: JenisKegiatanPengembangan;
}

export interface JenisKegiatanPengembanganPayload {
    pilar_pengembangan_id: number;
    nama: string;
    deskripsi?: string;
    is_active?: boolean;
}

export async function getJenisKegiatanPengembanganList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
    pilar_pengembangan_id?: number | string;
}): Promise<JenisKegiatanPengembanganListResponse> {
    return api.get('/idp/bentuk-pengembangan-kompetensi/', params);
}

export async function getJenisKegiatanPengembanganDetail(id: number): Promise<JenisKegiatanPengembanganDetailResponse> {
    return api.get(`/idp/bentuk-pengembangan-kompetensi/${id}/`);
}

export async function createJenisKegiatanPengembangan(data: JenisKegiatanPengembanganPayload): Promise<JenisKegiatanPengembanganDetailResponse> {
    return api.post('/idp/bentuk-pengembangan-kompetensi/', data);
}

export async function updateJenisKegiatanPengembangan(id: number, data: Partial<JenisKegiatanPengembanganPayload>): Promise<JenisKegiatanPengembanganDetailResponse> {
    return api.put(`/idp/bentuk-pengembangan-kompetensi/${id}/`, data);
}

export async function deleteJenisKegiatanPengembangan(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/bentuk-pengembangan-kompetensi/${id}/`);
}

export interface NamaKegiatanProgram {
    id: number;
    bentuk_pengembangan: {
        id: number;
        nama: string;
    };
    bentuk_pengembangan_id: number;
    bentuk_pengembangan_nama: string;
    nama: string;
    deskripsi: string;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface NamaKegiatanProgramListResponse {
    status: string;
    data: NamaKegiatanProgram[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

export interface NamaKegiatanProgramDetailResponse {
    status: string;
    data: NamaKegiatanProgram;
}

export interface NamaKegiatanProgramPayload {
    bentuk_pengembangan_id: number;
    nama: string;
    deskripsi?: string;
    is_active?: boolean;
}

export async function getNamaKegiatanProgramList(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: string;
    bentuk_pengembangan_id?: number | string;
    pilar_pengembangan_id?: number | string;
}): Promise<NamaKegiatanProgramListResponse> {
    return api.get('/idp/nama-kegiatan-program/', params);
}

export async function getNamaKegiatanProgramDetail(id: number): Promise<NamaKegiatanProgramDetailResponse> {
    return api.get(`/idp/nama-kegiatan-program/${id}/`);
}

export async function createNamaKegiatanProgram(data: NamaKegiatanProgramPayload): Promise<NamaKegiatanProgramDetailResponse> {
    return api.post('/idp/nama-kegiatan-program/', data);
}

export async function updateNamaKegiatanProgram(id: number, data: Partial<NamaKegiatanProgramPayload>): Promise<NamaKegiatanProgramDetailResponse> {
    return api.put(`/idp/nama-kegiatan-program/${id}/`, data);
}

export async function deleteNamaKegiatanProgram(id: number): Promise<{ status: string; message: string }> {
    return api.delete(`/idp/nama-kegiatan-program/${id}/`);
}

// ── Desain Pembelajaran (tree read-only) ──────────────────────────────

export interface DesainPembelajaranNode {
    id: number;
    tipe: 'metode' | 'bentuk' | 'kegiatan';
    nama: string;
    deskripsi: string;
    persentase?: number;
    is_active: boolean;
    children?: DesainPembelajaranNode[];
}

export interface DesainPembelajaranTreeResponse {
    success: boolean;
    data: DesainPembelajaranNode[];
    stats: {
        total_metode: number;
        total_bentuk: number;
        total_kegiatan: number;
    };
}

export async function getDesainPembelajaranTree(params?: {
    search?: string;
    include_inactive?: string;
}): Promise<DesainPembelajaranTreeResponse> {
    return api.get('/idp/desain-pembelajaran-tree/', params);
}
