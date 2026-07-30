'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Shield, Bolt, Database, Grid3X3, Gavel, UserCheck, ArrowRight } from 'lucide-react';
import { useThemeColors } from '@/lib/hooks/useThemeColors';

const links = [
    { href: '/admin/manajemen-aplikasi/fungsi', icon: Bolt, label: 'manajemen_fungsi', desc: 'manajemen_fungsi_desc', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
    { href: '/admin/manajemen-aplikasi/kontrol', icon: Database, label: 'manajemen_kontrol', desc: 'manajemen_kontrol_desc', color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
    { href: '/admin/manajemen-aplikasi/module', icon: Grid3X3, label: 'manajemen_module', desc: 'manajemen_module_desc', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
    { href: '/admin/manajemen-aplikasi/rules', icon: Gavel, label: 'manajemen_rules', desc: 'manajemen_rules_desc', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
    { href: '/admin/users', icon: UserCheck, label: 'manajemen_user', desc: 'manajemen_user_desc', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
    { href: '/admin/roles', icon: Shield, label: 'manajemen_role', desc: 'manajemen_role_desc', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
];

export default function AksesGranularPage() {
    const t = useTranslations('admin.manajemen_aplikasi');
    const { card, text } = useThemeColors();

    return (
        <div className="space-y-6">
            <div className={`relative overflow-hidden rounded-2xl ${card.bgClass} ${card.borderClass} border p-6`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-card-foreground">{t('akses_granular')}</h1>
                        <p className="text-sm text-muted-foreground">{t('akses_granular_desc')}</p>
                    </div>
                </div>
            </div>

            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl p-6`}>
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-card-foreground">{t('quick_access')}</h2>
                    <p className="text-sm text-muted-foreground">{t('quick_access_desc')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link key={link.href} href={link.href}
                                className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-blue-200 dark:hover:border-blue-800 bg-background hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${link.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-card-foreground group-hover:text-blue-600 transition-colors text-sm">{t(link.label)}</h3>
                                    <p className="text-xs text-muted-foreground truncate">{t(link.desc)}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className={`${card.bgClass} ${card.borderClass} border rounded-xl p-6`}>
                <h2 className="text-lg font-semibold text-card-foreground mb-3">{t('how_it_works')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                        { step: '1', title: t('step_module'), desc: t('step_module_desc') },
                        { step: '2', title: t('step_control'), desc: t('step_control_desc') },
                        { step: '3', title: t('step_function'), desc: t('step_function_desc') },
                        { step: '4', title: t('step_rule'), desc: t('step_rule_desc') },
                        { step: '5', title: t('step_role'), desc: t('step_role_desc') },
                    ].map(s => (
                        <div key={s.step} className="text-center p-4 rounded-xl bg-background border border-border">
                            <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-lg">{s.step}</div>
                            <h3 className="font-semibold text-card-foreground text-sm">{s.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
