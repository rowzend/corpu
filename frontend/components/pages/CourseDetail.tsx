'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Users, Clock, Heart, Play, BookOpen, Layers, Shield, CheckCircle, ArrowLeft, GraduationCap, LogIn } from 'lucide-react';
import {
    getCourse,
    enrollCourse,
    likeCourse,
    dislikeCourse,
    getRatings,
    getComments,
    createRating,
    createComment,
    replyComment,
    likeComment,
} from '@/lib/api/learning';
import { handleApiError } from '@/lib/api';
import { showToast, showError, showConfirm } from '@/lib/sweetalert';
import CourseComments from '@/components/learning/CourseComments';
import { authService } from '@/lib/services';

export default function CourseDetailPage({ basePath }: { basePath?: string }) {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [course, setCourse] = useState<any>(null);
    const [ratings, setRatings] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        try {
            const courseData = await getCourse(slug);
            setCourse(courseData);
            setIsEnrolled(courseData.is_enrolled || false);

            const ratingsData = await getRatings({ course_slug: slug }).catch(() => ({ results: [] }));
            setRatings(ratingsData?.results || []);

            const commentsData = await getComments({ course_slug: slug }).catch(() => ({ results: [] }));
            setComments(commentsData?.results || []);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Load Kursus');
        } finally {
            setLoading(false);
        }
    };

    const requireAuth = () => {
        if (!authService.isAuthenticated()) {
            showConfirm(
                'Silakan login terlebih dahulu untuk menggunakan fitur ini.',
                'Login Diperlukan',
                'Login',
                'Batal'
            ).then((confirmed) => {
                if (confirmed) {
                    router.push('/login');
                }
            });
            return false;
        }
        return true;
    };

    const handleEnroll = async () => {
        if (!requireAuth()) return;
        try {
            await enrollCourse(slug);
            showToast('Berhasil mendaftar kursus!', 'success');
            setIsEnrolled(true);
        } catch (error) {
            showError(handleApiError(error), 'Gagal Mendaftar');
        }
    };

    const handleLike = async () => {
        if (!requireAuth()) return;
        try {
            if (isLiked) {
                await dislikeCourse(slug);
            } else {
                await likeCourse(slug);
            }
            setIsLiked(!isLiked);
        } catch (error) {
            showError(handleApiError(error), 'Gagal');
        }
    };

    const handleSubmitRating = async () => {
        if (!requireAuth()) return;
        if (userRating === 0) {
            showError('Pilih rating terlebih dahulu', 'Error');
            return;
        }
        try {
            await createRating({ course: course.id, rating: userRating, comment: userComment });
            showToast('Rating berhasil dikirim!', 'success');
            setUserRating(0);
            setUserComment('');
            fetchData();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Kirim Rating');
        }
    };

    const handleSubmitComment = async () => {
        if (!requireAuth()) return;
        if (!userComment.trim()) {
            showError('Komentar tidak boleh kosong', 'Error');
            return;
        }
        try {
            await createComment({ course: course.id, comment: userComment });
            showToast('Komentar berhasil dikirim!', 'success');
            setUserComment('');
            fetchData();
        } catch (error) {
            showError(handleApiError(error), 'Gagal Kirim Komentar');
        }
    };

    const handleReplyComment = async (commentId: number, reply: string) => {
        await replyComment(commentId, reply);
        fetchData();
    };

    const handleLikeComment = async (commentId: number) => {
        await likeComment(commentId);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <p className="text-gray-500">Kursus tidak ditemukan</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push(basePath || '/courses')}>Kembali</Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative container mx-auto px-6 py-12">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge className="bg-white/20 text-white border-0">
                                    {course.level === 'beginner' ? 'Pemula' : course.level === 'intermediate' ? 'Menengah' : 'Mahir'}
                                </Badge>
                                <Badge className="bg-white/20 text-white border-0">
                                    {course.status === 'published' ? 'Published' : course.status}
                                </Badge>
                                {course.is_featured && (
                                    <Badge className="bg-yellow-400 text-yellow-900 border-0">Unggulan</Badge>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
                            <p className="text-lg text-blue-100 mb-6">{course.short_description}</p>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-blue-200">
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{course.duration_minutes} menit</div>
                                <div className="flex items-center gap-2"><Users className="w-4 h-4" />{course.enrolled_count} terdaftar</div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    {course.rating_avg ? course.rating_avg.toFixed(1) : '0.0'}
                                    <span className="text-blue-300">({course.rating_count || 0} ulasan)</span>
                                </div>
                                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{course.lesson_count || 0} pelajaran</div>
                            </div>
                        </div>

                        {/* Course Image / CTA Card */}
                        <div className="md:col-span-1">
                            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                                <CardContent className="p-6">
                                    {course.thumbnail && (
                                        <div className="h-40 rounded-xl overflow-hidden mb-4">
                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {isAuthenticated ? (
                                        <div className="space-y-4">
                                            {isEnrolled ? (
                                                <Button
                                                    className="w-full bg-white text-blue-700 hover:bg-blue-50"
                                                    onClick={() => router.push(`${basePath || '/courses'}/${slug}/learn`)}
                                                >
                                                    <Play className="w-4 h-4 mr-2" />Lanjutkan Belajar
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full bg-white text-blue-700 hover:bg-blue-50 shadow-xl"
                                                    onClick={handleEnroll}
                                                >
                                                    <GraduationCap className="w-4 h-4 mr-2" />Daftar Sekarang
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full border-white/30 text-white hover:bg-white/10"
                                                onClick={handleLike}
                                            >
                                                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                                                {isLiked ? 'Disukai' : 'Sukai Kursus'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Button
                                                className="w-full bg-white text-blue-700 hover:bg-blue-50 shadow-xl"
                                                onClick={() => router.push('/login')}
                                            >
                                                <LogIn className="w-4 h-4 mr-2" />Login untuk Mendaftar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full border-white/30 text-white hover:bg-white/10"
                                                onClick={() => router.push('/register')}
                                            >
                                                Belum punya akun? Daftar
                                            </Button>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm text-blue-200">
                                        <div className="flex items-center gap-2"><Layers className="w-4 h-4" />{course.modules?.length || 0} modul</div>
                                        <div className="flex items-center gap-2"><Shield className="w-4 h-4" />Sertifikat kelulusan</div>
                                        <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />Akses seumur hidup</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="bg-gray-50">
                <div className="container mx-auto px-6 py-12">
                    {isAuthenticated ? (
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
                                <TabsTrigger value="overview" className="rounded-lg">Gambaran</TabsTrigger>
                                <TabsTrigger value="modules" className="rounded-lg">Modul Pelajaran</TabsTrigger>
                                <TabsTrigger value="ratings" className="rounded-lg">Ulasan ({ratings.length})</TabsTrigger>
                                <TabsTrigger value="comments" className="rounded-lg">Komentar ({comments.length})</TabsTrigger>
                            </TabsList>

                            <div className="mt-8">
                                <TabsContent value="overview">
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-8">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">Deskripsi Kursus</h3>
                                            <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-600 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: course.description }}>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="modules">
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-8">
                                            <h3 className="text-xl font-bold text-gray-900 mb-6">Modul Pembelajaran</h3>
                                            {course.modules && course.modules.length > 0 ? (
                                                <div className="space-y-4">
                                                    {course.modules.map((mod: any, i: number) => (
                                                        <div key={mod.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{mod.title}</h4>
                                                                {mod.description && <p className="text-sm text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: mod.description }}></p>}
                                                                <span className="text-xs text-gray-400 mt-2 block">{mod.lessons?.length || 0} pelajaran</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500">Belum ada modul tersedia.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="ratings">
                                    <div className="space-y-6">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Berikan Rating</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Rating</label>
                                                        <div className="flex gap-2 mt-2">
                                                            {[1, 2, 3, 4, 5].map((i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setUserRating(i)}
                                                                    className={`text-3xl transition-all hover:scale-110 ${userRating >= i ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                                                                >
                                                                    ★
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Komentar (Opsional)</label>
                                                        <textarea
                                                            value={userComment}
                                                            onChange={(e) => setUserComment(e.target.value)}
                                                            placeholder="Tulis pengalaman Anda..."
                                                            className="w-full mt-2 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <Button onClick={handleSubmitRating} className="w-full rounded-xl">
                                                        Kirim Rating
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="space-y-4">
                                            {ratings.map((rating) => (
                                                <Card key={rating.id} className="border-0 shadow-sm">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm font-bold text-blue-600">{rating.user_name?.charAt(0) || 'U'}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{rating.user_name}</div>
                                                                    <div className="flex gap-0.5 mt-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <span key={i} className={i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-gray-400">{new Date(rating.created_at).toLocaleDateString('id-ID')}</span>
                                                        </div>
                                                        {rating.comment && <p className="text-gray-600 text-sm">{rating.comment}</p>}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {ratings.length === 0 && (
                                                <p className="text-center text-gray-500 py-8">Belum ada ulasan.</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="comments">
                                    <CourseComments
                                        comments={comments}
                                        courseId={course.id}
                                        onSubmitComment={handleSubmitComment}
                                        onReply={handleReplyComment}
                                        onLikeComment={handleLikeComment}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Deskripsi Kursus</h3>
                                    <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-600 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: course.description }}>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Modul Pembelajaran</h3>
                                    {course.modules && course.modules.length > 0 ? (
                                        <div className="space-y-4">
                                            {course.modules.map((mod: any, i: number) => (
                                                <div key={mod.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{mod.title}</h4>
                                                        {mod.description && <p className="text-sm text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: mod.description }}></p>}
                                                        <span className="text-xs text-gray-400 mt-2 block">{mod.lessons?.length || 0} pelajaran</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Belum ada modul tersedia.</p>
                                    )}
                                </CardContent>
                            </Card>

                            {ratings.length > 0 && (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">Ulasan ({ratings.length})</h3>
                                        <div className="space-y-4">
                                            {ratings.map((rating) => (
                                                <div key={rating.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-bold text-blue-600">{rating.user_name?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium text-gray-900">{rating.user_name}</span>
                                                            <div className="flex gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {rating.comment && <p className="text-gray-600 text-sm mt-1">{rating.comment}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-100">
                                <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ikuti Kursus Ini</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    Login atau daftar untuk mendaftar kursus ini dan mulai perjalanan belajar Anda
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        className="rounded-xl px-8"
                                        onClick={() => router.push('/login')}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl px-8"
                                        onClick={() => router.push('/register')}
                                    >
                                        Daftar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
