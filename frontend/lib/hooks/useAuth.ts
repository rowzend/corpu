'use client';

import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/auth';

interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    role?: string;
    [key: string]: any;
}

interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Check if token exists
            const token = localStorage.getItem('token');
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            // Fetch user profile
            const response = await getProfile();
            setUser(response.data || response);
        } catch (err: any) {
            console.error('Failed to fetch user:', err);
            setError(err.message || 'Failed to fetch user');
            setUser(null);
            
            // Clear token if unauthorized
            if (err.status === 401 || err.status === 403) {
                localStorage.removeItem('token');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        refetch: fetchUser,
    };
}
