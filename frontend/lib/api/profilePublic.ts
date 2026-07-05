interface ProfileSection {
  id: number;
  key: string;
  title: string;
  content: string;
  image: string | null;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

interface PersonaliaItem {
  id: number;
  name: string;
  nip: string | null;
  position: string;
  position_fk: number | null;
  position_name: string | null;
  position_id: number | null;
  description: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  unit_kerja: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BrandItem {
  id: number;
  name: string;
  image: string;
  image_url: string | null;
  description: string | null;
  is_primary: boolean;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function getBaseURL() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return 'http://localhost:3000/apicorpu/public/1.0';
}

function getAdminBaseURL() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/1.0`;
  }
  return 'http://localhost:3000/apicorpu/1.0';
}

function photoUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    return path;
  } catch {
    return url;
  }
}

// Public API (no auth required)
export async function getProfileSections(): Promise<ProfileSection[]> {
  const res = await fetch(`${getBaseURL()}/profile/sections/`);
  const json: ApiResponse<ProfileSection[]> = await res.json();
  return json.data ?? [];
}

export async function getPersonalia(): Promise<PersonaliaItem[]> {
  const res = await fetch(`${getBaseURL()}/profile/personalia/`);
  const json: ApiResponse<PersonaliaItem[]> = await res.json();
  return json.data ?? [];
}

export async function getBrands(): Promise<BrandItem[]> {
  const res = await fetch(`${getBaseURL()}/profile/brands/`);
  const json: ApiResponse<BrandItem[]> = await res.json();
  return json.data ?? [];
}

// Admin API (auth required)
export async function getAdminBrands(): Promise<BrandItem[]> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getAdminBaseURL()}/profile/brands/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch brands');
  }
  
  const json: ApiResponse<BrandItem[]> = await res.json();
  return json.data ?? [];
}

export async function createBrand(brandData: FormData): Promise<BrandItem> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getAdminBaseURL()}/profile/brands/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: brandData,
  });
  
  if (!res.ok) {
    throw new Error('Failed to create brand');
  }
  
  const json: ApiResponse<BrandItem> = await res.json();
  return json.data;
}

export async function updateBrand(id: number, brandData: FormData): Promise<BrandItem> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getAdminBaseURL()}/profile/brands/${id}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: brandData,
  });
  
  if (!res.ok) {
    // Log response untuk debugging
    const errorText = await res.text();
    console.error('Update brand error:', {
      status: res.status,
      statusText: res.statusText,
      response: errorText
    });
    throw new Error(`Failed to update brand: ${res.status} ${res.statusText}`);
  }
  
  const json: ApiResponse<BrandItem> = await res.json();
  return json.data;
}

export async function deleteBrand(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getAdminBaseURL()}/profile/brands/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to delete brand');
  }
}

export async function getBrandById(id: number): Promise<BrandItem> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getAdminBaseURL()}/profile/brands/${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch brand');
  }
  
  const json: ApiResponse<BrandItem> = await res.json();
  return json.data;
}

export { photoUrl };
export type { ProfileSection, PersonaliaItem, BrandItem };

// Public Settings (key-value map)
export async function getPublicSettings(): Promise<Record<string, string>> {
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}/apicorpu/public/1.0`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/apicorpu/public/1.0`;
  const res = await fetch(`${base}/settings/`);
  const json: ApiResponse<Record<string, string>> = await res.json();
  return json.data ?? {};
}
