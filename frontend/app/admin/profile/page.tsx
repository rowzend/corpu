'use client';

import Link from 'next/link';
import { Building2, ScrollText, LayoutList, Users, Tag, ArrowRight } from 'lucide-react';
import { useThemeColors } from '@/lib/hooks/useThemeColors';
import { useTranslations } from 'next-intl';
import { gradients } from '@/lib/colors';

export default function ProfilePage() {
    const t = useTranslations('admin.profile');
    const { card, text, brand, isDark, header, icon, heading, body } = useThemeColors();

    const cards = [
        {
            title: t('sambutan'),
            href: '/admin/profile/sambutan-visi-misi',
            icon: ScrollText,
            desc: t('sambutan_desc'),
            gradient: gradients.ocean,
        },
        {
            title: t('sejarah'),
            href: '/admin/profile/sejarah',
            icon: Building2,
            desc: t('sejarah_desc'),
            gradient: gradients.royal,
        },
        {
            title: t('struktur'),
            href: '/admin/profile/struktur',
            icon: LayoutList,
            desc: t('struktur_desc'),
            gradient: gradients.fire,
        },
        {
            title: t('personalia'),
            href: '/admin/profile/personalia',
            icon: Users,
            desc: t('personalia_desc'),
            gradient: gradients.forest,
        },
        {
            title: t('brand'),
            href: '/admin/profile/brand',
            icon: Tag,
            desc: t('brand_desc'),
            gradient: gradients.sunset,
        },
    ];
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div 
                className="relative overflow-hidden rounded-2xl p-8"
                style={header.background}
            >
                {/* Glow effect */}
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={header.glowOverlay}
                />
                
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div 
                            className="backdrop-blur-sm rounded-xl p-2"
                            style={{ backgroundColor: icon.background() }}
                        >
                            <Building2 
                                className="w-6 h-6" 
                                style={{ color: icon.color }}
                            />
                        </div>
                        <div>
                            <h1 
                                className="text-2xl font-bold"
                                style={{ color: heading.color }}
                            >
                                {t('page_title')}
                            </h1>
                            <p 
                                className="text-sm"
                                style={{ color: body.color }}
                            >
                                {t('page_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((cardData, i) => {
                    const Icon = cardData.icon;
                    return (
                        <Link
                            key={cardData.href}
                            href={cardData.href}
                            className={`group relative ${card.bgClass} ${card.borderClass} border rounded-2xl shadow-sm p-6 ${card.hoverClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden`}
                        >
                            <div 
                                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cardData.gradient} opacity-5 rounded-bl-[100px] transition-all duration-300 group-hover:opacity-10 group-hover:scale-110`}
                            />
                            <div className="relative z-10">
                                <div 
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cardData.gradient} flex items-center justify-center shadow-lg mb-4`}
                                    style={{
                                        boxShadow: isDark 
                                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' 
                                            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h2 
                                            className={`text-lg font-semibold ${text.primaryClass} transition-colors`}
                                            style={{
                                                color: isDark ? brand.neutral[100] : brand.neutral[900]
                                            }}
                                        >
                                            {cardData.title}
                                        </h2>
                                        <p className={`text-sm ${text.mutedClass} mt-1`}>{cardData.desc}</p>
                                    </div>
                                    <div className="flex-shrink-0 ml-4 mt-1">
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                            style={{
                                                backgroundColor: isDark 
                                                    ? brand.neutral[800] 
                                                    : brand.neutral[100]
                                            }}
                                        >
                                            <ArrowRight 
                                                className={`w-4 h-4 ${text.mutedClass} transition-all duration-300 group-hover:translate-x-0.5`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
