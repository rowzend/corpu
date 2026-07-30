'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface PermissionItem {
  module: string;
  function: string;
  control: string;
  permission_string: string;
}

interface PermissionResponse {
  success: boolean;
  data: {
    user: { groups: Array<{ id: number; name: string }> };
    modules: string[];
    permissions: PermissionItem[];
    is_superadmin: boolean;
  };
}

export function usePermission() {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await api.get<PermissionResponse>('/management/permissions/user/');
      if (res?.success && res?.data) {
        setPermissions(res.data.permissions || []);
        setIsSuperadmin(res.data.is_superadmin || false);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (module: string, func: string, control: string): boolean => {
    if (isSuperadmin) return true;
    return permissions.some(
      p => p.module === module && p.function === func && p.control === control
    );
  };

  return { hasPermission, permissions, isSuperadmin, isLoading, refetch: fetchPermissions };
}
