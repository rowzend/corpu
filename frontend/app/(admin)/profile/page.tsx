'use client';

import Link from 'next/link';
import { Building2, ScrollText, LayoutList, Users, Tag, ArrowRight } from 'lucide-react';

const cards = [
    {
        title: 'Sambutan & Visi Misi',
        href: '/profile/sambutan-visi-misi',
        icon: ScrollText,
        desc: 'Kelola sambutan kepala badan serta visi dan misi instansi',
        gradient: 'from-blue-500 to-cyan-500',
        shadow: 'shadow-blue-200',
    },
    {
        title: 'Sejarah CORPU',
        href: '/profile/sejarah',
        icon: Building2,
        desc: 'Kelola konten sejarah Corporate University',
        gradient: 'from-purple-500 to-pink-500',
        shadow: 'shadow-purple-200',
    },
    {
        title: 'Struktur Organisasi',
        href: '/profile/struktur',
        icon: LayoutList,
        desc: 'Kelola konten struktur organisasi instansi',
        gradient: 'from-amber-500 to-orange-500',
        shadow: 'shadow-amber-200',
    },
    {
        title: 'Personalia',
        href: '/profile/personalia',
        icon: Users,
        desc: 'Kelola data personalia dan pegawai instansi',
        gradient: 'from-green-500 to-emerald-500',
        shadow: 'shadow-green-200',
    },
    {
        title: 'Brand',
        href: '/profile/brand',
        icon: Tag,
        desc: 'Kelola brand dan logo institusi',
        gradient: 'from-rose-500 to-red-500',
        shadow: 'shadow-rose-200',
    },
];

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2MmgyM3Y0aDJWNmgyVjR6bTAtMzBWMEgzNHY0aC00djJoNHY0aDJWNmgyVjR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0yek02IDRWMUg0djRIMHYyaDR2NGgyVjZoNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Profile Instansi</h1>
                            <p className="text-purple-100 text-sm">Kelola konten profil dan informasi instansi</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl ${card.shadow} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[100px] transition-all duration-300 group-hover:opacity-10 group-hover:scale-110`} />
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg mb-4`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {card.title}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
                                    </div>
                                    <div className="flex-shrink-0 ml-4 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                            <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-all duration-300 group-hover:translate-x-0.5`} />
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
