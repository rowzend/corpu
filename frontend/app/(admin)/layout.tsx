'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SessionChecker from '@/components/providers/SessionChecker';
import { authService } from '@/lib/services';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

    const isDetailCoursePath = useMemo(() => {
        const match = pathname.match(/^\/courses\/([^/]+)$/);
        if (!match) return false;
        const slug = match[1];
        return !['my-courses', 'my-progress', 'certificates'].includes(slug);
    }, [pathname]);

    const isDetailKMSPath = useMemo(() => {
        const match = pathname.match(/^\/kms\/([^/]+)$/);
        return !!match;
    }, [pathname]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = authService.getToken();

            const isPublicPath = pathname === '/courses' || isDetailCoursePath || pathname === '/kms' || isDetailKMSPath;

            if (!token) {
                if (!isPublicPath) {
                    router.push('/login');
                }
                setIsLoading(false);
                return;
            }

            try {
                const isValid = await authService.verifyToken();
                setIsAuthenticated(isValid);
            } catch (error) {
                console.error('Auth check failed:', error);
                if (!isPublicPath) {
                    authService.logout();
                    router.push('/login?error=auth_failed');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router, pathname, isDetailCoursePath, isDetailKMSPath]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const isPublicPage = (pathname === '/courses' || pathname === '/kms') && !isAuthenticated || (isDetailCoursePath && !isAuthenticated) || (isDetailKMSPath && !isAuthenticated);

    if (isPublicPage) {
        return (
            <>
                <Navbar />
                {children}
                <Footer />
            </>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
            <SessionChecker 
                timeoutMinutes={30}
                showWarning={true}
            />

            <AdminSidebar
                isMobileOpen={mobileSidebarOpen}
                onToggleMobile={() => setMobileSidebarOpen(v => !v)}
            />

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <AdminHeader onToggleSidebar={() => setMobileSidebarOpen(v => !v)} />

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}