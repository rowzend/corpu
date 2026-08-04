'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations('hcdp');
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
            case 'upcoming': return 'bg-primary/10 text-primary';
            case 'ongoing': return 'bg-accent/10 text-accent';
            case 'completed': return 'bg-muted text-muted-foreground';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner': return 'bg-accent/10 text-accent';
            case 'intermediate': return 'bg-primary/10 text-primary';
            case 'advanced': return 'bg-destructive/10 text-destructive';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted py-12">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-muted rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted">
            <div className="bg-gradient-to-b from-muted/20 via-background to-muted/20">
                <div className="container mx-auto px-4 py-16 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <GraduationCap className="w-16 h-16 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold text-card-foreground">
                        {t('page_title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t('page_desc')}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-primary">{programs.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">{t('programs_available')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-accent">
                                {programs.filter(p => p.status === 'ongoing').length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">{t('ongoing')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-primary">
                                {programs.reduce((sum, p) => sum + p.registered_participants, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">{t('total_participants')}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="max-w-4xl mx-auto">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder={t('search_placeholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Filter className="w-4 h-4 mt-2 text-muted-foreground" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category === 'all' ? t('all_categories') : category}
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
                                            {t(`status_${program.status}`)}
                                        </Badge>
                                        <Badge className={getLevelColor(program.level)}>
                                            {program.level}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                                    {program.description}
                                </p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        <span>{program.instructor}</span>
                                    </div>

                                    {program.start_date && program.end_date && (
                                        <div className="flex items-center text-muted-foreground">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>{new Date(program.start_date).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center text-muted-foreground">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>{program.duration}</span>
                                    </div>

                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        <span>{program.location}</span>
                                    </div>

                                    <div className="flex items-center text-muted-foreground">
                                        <Users className="w-4 h-4 mr-2" />
                                        <span>{program.registered_participants}/{program.max_participants} {t('participants')}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {program.max_participants > 0 && (
                                    <div className="mt-4">
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full"
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
                            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-card-foreground mb-2">{t('no_programs')}</h3>
                            <p className="text-muted-foreground">
                                {t('try_adjust_filter')}
                            </p>
                        </CardContent>
                    </Card>
                )}
                </div>
            </div>
        </div>
    );
}
