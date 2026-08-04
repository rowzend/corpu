export interface HeroImageItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  image_url: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

function getPublicBaseURL() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/public/1.0`;
  }
  return '/apicorpu/public/1.0';
}

function getAdminBaseURL() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/apicorpu/1.0`;
  }
  return 'http://localhost:3000/apicorpu/1.0';
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return { 'Authorization': `Bearer ${token}` };
}

export async function getHeroImages(): Promise<HeroImageItem[]> {
  try {
    const res = await fetch(`${getPublicBaseURL()}/hero/`);
    if (!res.ok) return [];
    const json: ApiResponse<HeroImageItem[]> = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function getAdminHeroImages(): Promise<HeroImageItem[]> {
  const res = await fetch(`${getAdminBaseURL()}/hero/`, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch hero images');
  const json: ApiResponse<HeroImageItem[]> = await res.json();
  return json.data ?? [];
}

export async function createHeroImage(data: FormData): Promise<HeroImageItem> {
  const res = await fetch(`${getAdminBaseURL()}/hero/`, {
    method: 'POST',
    headers: authHeaders(),
    body: data,
  });
  if (!res.ok) throw new Error('Failed to create hero image');
  const json: ApiResponse<HeroImageItem> = await res.json();
  return json.data;
}

export async function updateHeroImage(id: number, data: FormData): Promise<HeroImageItem> {
  const res = await fetch(`${getAdminBaseURL()}/hero/${id}/`, {
    method: 'PUT',
    headers: authHeaders(),
    body: data,
  });
  if (!res.ok) throw new Error('Failed to update hero image');
  const json: ApiResponse<HeroImageItem> = await res.json();
  return json.data;
}

export async function deleteHeroImage(id: number): Promise<void> {
  const res = await fetch(`${getAdminBaseURL()}/hero/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete hero image');
}
