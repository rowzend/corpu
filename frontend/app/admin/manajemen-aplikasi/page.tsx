'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Shield, Menu, Bolt, Database, Grid3X3, Gavel, BookOpen, LayoutGrid } from 'lucide-react';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

const menuItems = [
    { href: '/admin/manajemen-aplikasi/akses-granular', icon: Shield, label: 'akses_granular', desc: 'akses_granular_desc', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
    { href: '/admin/manajemen-aplikasi/menu', icon: Menu, label: 'manajemen_menu', desc: 'manajemen_menu_desc', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
    { href: '/admin/manajemen-aplikasi/fungsi', icon: Bolt, label: 'manajemen_fungsi', desc: 'manajemen_fungsi_desc', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
    { href: '/admin/manajemen-aplikasi/kontrol', icon: Database, label: 'manajemen_kontrol', desc: 'manajemen_kontrol_desc', color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
    { href: '/admin/manajemen-aplikasi/module', icon: Grid3X3, label: 'manajemen_module', desc: 'manajemen_module_desc', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
    { href: '/admin/manajemen-aplikasi/rules', icon: Gavel, label: 'manajemen_rules', desc: 'manajemen_rules_desc', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
    { href: '/admin/manajemen-aplikasi/menu-categories', icon: LayoutGrid, label: 'menu_categories', desc: 'menu_categories_desc', color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
    { href: '/admin/manajemen-aplikasi/dokumentasi-api', icon: BookOpen, label: 'dokumentasi_api', desc: 'dokumentasi_api_desc', color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
];

export default function ManajemenAplikasiPage() {
    const t = useTranslations('admin.manajemen_aplikasi');
    const { card, text } = useThemeColors();

    return (
        <div className="space-y-6">
            <div className={`relative overflow-hidden rounded-2xl ${card.bgClass} ${card.borderClass} border p-8`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-card-foreground">{t('page_title')}</h1>
                            <p className="text-muted-foreground">{t('page_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href}
                            className={`group ${card.bgClass} ${card.borderClass} ${card.hoverClass} border rounded-xl p-5 transition-all duration-200 hover:shadow-md`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-card-foreground group-hover:text-blue-600 transition-colors">
                                {t(item.label)}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {t(item.desc)}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
