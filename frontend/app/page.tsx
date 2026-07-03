'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import Brand from '@/components/Brand';
import Instructors from '@/components/Instructors';
import LatestCourses from '@/components/LatestCourses';
import LatestNews from '@/components/LatestNews';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import { authService } from '@/lib/services';

export default function HomePage() {
    const router = useRouter();
    const [checked, setChecked] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (authService.isAuthenticated()) {
            const token = authService.getToken();
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.exp && Date.now() < payload.exp * 1000) {
                        const roleType = authService.getActiveRoleType();
                        router.replace(roleType === 'member' ? '/member/dashboard' : '/admin/dashboard');
                        return;
                    }
                } catch {
                    // Invalid token, fall through to landing page
                }
            }
        }
        setChecked(true);
    }, [mounted, router]);

    if (!mounted || !checked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <Hero />
            <Features />
            <Stats />
            <Brand />
            <Instructors />
            <LatestCourses />
            <LatestNews />
            <CTA />
            <Footer />
        </>
    );
}
