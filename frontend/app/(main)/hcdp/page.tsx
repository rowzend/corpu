'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    GraduationCap,
    Search,
    Calendar,
    Users,
    Clock,
    MapPin,
    BookOpen,
    Filter
} from 'lucide-react';
import { getHCDPPrograms, type HCDPProgram } from '@/lib/api/hcdp';
import { handleApiError } from '@/lib/api';

export default function PublicHCDPPage() {
    const [programs, setPrograms] = useState<HCDPProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await getHCDPPrograms({
                    page: 1,
                    per_page: 100,
                });

                console.log('Public HCDP response:', response); // Debug

                // Handle response - check if it's the data array directly or wrapped
                let allPrograms: HCDPProgram[] = [];
                if (Array.isArray(response)) {
                    allPrograms = response;
                } else if (response && Array.isArray(response.data)) {
                    allPrograms = response.data;
                }

                // Filter only published programs for public
                setPrograms(allPrograms.filter(p => p && p.is_published && p.is_active));
            } catch (error) {
                console.error('Failed to fetch programs:', handleApiError(error));
                setPrograms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const categories = ['all', 'Leadership', 'Technology', 'Communication', 'Management', 'Technical'];

    const filteredPrograms = programs.filter(program => {
        if (!program) return false;
        const matchesSearch = (program.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (program.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800';
            case 'ongoing': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <GraduationCap className="w-16 h-16 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">
                        Human Capital Development Program
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Program pelatihan dan pengembangan kompetensi ASN untuk meningkatkan kualitas pelayanan publik
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600">{programs.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Program Tersedia</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-green-600">
                                {programs.filter(p => p.status === 'ongoing').length}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Sedang Berlangsung</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-purple-600">
                                {programs.reduce((sum, p) => sum + p.registered_participants, 0)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Total Peserta</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="max-w-4xl mx-auto">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Cari program..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Filter className="w-4 h-4 mt-2 text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category === 'all' ? 'Semua Kategori' : category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Programs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {filteredPrograms.map((program) => (
                        <Card key={program.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg line-clamp-2">{program.title}</CardTitle>
                                    <div className="flex flex-col gap-1">
                                        <Badge className={getStatusColor(program.status)}>
                                            {program.status}
                                        </Badge>
                                        <Badge className={getLevelColor(program.level)}>
                                            {program.level}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                                    {program.description}
                                </p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        <span>{program.instructor}</span>
                                    </div>

                                    {program.start_date && program.end_date && (
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{new Date(program.start_date).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>{program.duration}</span>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        <span>{program.location}</span>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <Users className="w-4 h-4 mr-2" />
                                        <span>{program.registered_participants}/{program.max_participants} peserta</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {program.max_participants > 0 && (
                                    <div className="mt-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(program.registered_participants / program.max_participants) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {program.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-4">
                                        {program.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredPrograms.length === 0 && (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-12 text-center">
                            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada program ditemukan</h3>
                            <p className="text-gray-600">
                                Coba ubah filter atau kata kunci pencarian Anda.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
