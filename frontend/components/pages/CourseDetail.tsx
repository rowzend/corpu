'use client';

import { useTranslations } from 'next-intl';
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
    const t = useTranslations('courses_page');
    const tc = useTranslations('common');
    const ta = useTranslations('auth');

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
            showError(handleApiError(error), t('load_error'));
        } finally {
            setLoading(false);
        }
    };

    const requireAuth = () => {
        if (!authService.isAuthenticated()) {
            showConfirm(
                ta('login_required_desc'),
                ta('login_required'),
                ta('login_submit'),
                tc('cancel')
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
            showToast(t('enroll_success'), 'success');
            setIsEnrolled(true);
        } catch (error) {
            showError(handleApiError(error), t('enroll_error'));
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
            showError(handleApiError(error), tc('error_occurred'));
        }
    };

    const handleSubmitRating = async () => {
        if (!requireAuth()) return;
        if (userRating === 0) {
            showError(t('rating_required'), tc('error_occurred'));
            return;
        }
        try {
            await createRating({ course: course.id, rating: userRating, comment: userComment });
            showToast(t('rating_success'), 'success');
            setUserRating(0);
            setUserComment('');
            fetchData();
        } catch (error) {
            showError(handleApiError(error), tc('error_occurred'));
        }
    };

    const handleSubmitComment = async () => {
        if (!requireAuth()) return;
        if (!userComment.trim()) {
            showError(t('comment_required'), tc('error_occurred'));
            return;
        }
        try {
            await createComment({ course: course.id, comment: userComment });
            showToast(t('comment_success'), 'success');
            setUserComment('');
            fetchData();
        } catch (error) {
            showError(handleApiError(error), tc('error_occurred'));
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <p className="text-muted-foreground">{t('course_not_found')}</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push(basePath || '/courses')}>{tc('back')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative container mx-auto px-6 py-12">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" /> {tc('back')}
                    </button>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge className="bg-white/20 text-white border-0">
                                    {course.level === 'beginner' ? t('beginner') : course.level === 'intermediate' ? t('intermediate') : t('advanced')}
                                </Badge>
                                <Badge className="bg-white/20 text-white border-0">
                                    {course.status === 'published' ? 'Published' : course.status}
                                </Badge>
                                {course.is_featured && (
                                    <Badge className="bg-accent text-accent-foreground border-0">{t('featured')}</Badge>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
                            <p className="text-lg text-primary-foreground/80 mb-6">{course.short_description}</p>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-primary-foreground/60">
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{course.duration_minutes} {t('minutes')}</div>
                                <div className="flex items-center gap-2"><Users className="w-4 h-4" />{course.enrolled_count} {t('enrolled_count')}</div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    {course.rating_avg ? course.rating_avg.toFixed(1) : '0.0'}
                                    <span className="text-primary-foreground/40">({course.rating_count || 0} {t('reviews')})</span>
                                </div>
                                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{course.lesson_count || 0} {t('lessons')}</div>
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
                                                    className="w-full bg-card text-primary hover:bg-primary/5"
                                                    onClick={() => router.push(`${basePath || '/courses'}/${slug}/learn`)}
                                                >
                                                    <Play className="w-4 h-4 mr-2" />{t('continue_learning')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full bg-card text-primary hover:bg-primary/5 shadow-xl"
                                                    onClick={handleEnroll}
                                                >
                                                    <GraduationCap className="w-4 h-4 mr-2" />{t('enroll_now')}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                                                onClick={handleLike}
                                            >
                                                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
                                                {isLiked ? t('liked') : t('like_course')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Button
                                                className="w-full bg-card text-primary hover:bg-primary/5 shadow-xl"
                                                onClick={() => router.push('/login')}
                                            >
                                                <LogIn className="w-4 h-4 mr-2" />{t('login_to_enroll')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                                                onClick={() => router.push('/register')}
                                            >
                                                {ta('no_account')}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-primary-foreground/10 space-y-2 text-sm text-primary-foreground/60">
                                        <div className="flex items-center gap-2"><Layers className="w-4 h-4" />{course.modules?.length || 0} {t('modules')}</div>
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
            <section className="bg-gradient-to-b from-muted/20 via-background to-muted/20">
                <div className="container mx-auto px-4 py-16">
                    {isAuthenticated ? (
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="bg-card border border-border p-1 rounded-xl">
                                <TabsTrigger value="overview" className="rounded-lg">{t('tab_overview')}</TabsTrigger>
                                <TabsTrigger value="modules" className="rounded-lg">{t('tab_modules')}</TabsTrigger>
                                <TabsTrigger value="ratings" className="rounded-lg">{t('tab_reviews')} ({ratings.length})</TabsTrigger>
                                <TabsTrigger value="comments" className="rounded-lg">{t('tab_comments')} ({comments.length})</TabsTrigger>
                            </TabsList>

                            <div className="mt-8">
                                <TabsContent value="overview">
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-8">
                                            <h3 className="text-xl font-bold text-card-foreground mb-4">{t('course_description')}</h3>
                                            <div className="prose prose-gray max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: course.description }}>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="modules">
                                    <Card className="border-0 shadow-sm">
                                        <CardContent className="p-8">
                                            <h3 className="text-xl font-bold text-card-foreground mb-6">{t('learning_modules')}</h3>
                                            {course.modules && course.modules.length > 0 ? (
                                                <div className="space-y-4">
                                                    {course.modules.map((mod: any, i: number) => (
                                                        <div key={mod.id} className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                                                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                {i + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-card-foreground">{mod.title}</h4>
                                                                {mod.description && <p className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: mod.description }}></p>}
                                                                <span className="text-xs text-muted-foreground mt-2 block">{mod.lessons?.length || 0} {t('lessons')}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground">{t('no_modules')}</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="ratings">
                                    <div className="space-y-6">
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="text-lg">{t('give_rating')}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-foreground">{t('rating')}</label>
                                                        <div className="flex gap-2 mt-2">
                                                            {[1, 2, 3, 4, 5].map((i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setUserRating(i)}
                                                                    className={`text-3xl transition-all hover:scale-110 ${userRating >= i ? 'text-yellow-400 scale-110' : 'text-muted-foreground'}`}
                                                                >
                                                                    ★
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-foreground">{t('comment_optional')}</label>
                                                        <textarea
                                                            value={userComment}
                                                            onChange={(e) => setUserComment(e.target.value)}
                                                            placeholder={t('write_experience')}
                                                            className="w-full mt-2 p-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none"
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <Button onClick={handleSubmitRating} className="w-full rounded-xl">
                                                        {t('submit_rating')}
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
                                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                                        <span className="text-sm font-bold text-primary">{rating.user_name?.charAt(0) || 'U'}</span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-card-foreground">{rating.user_name}</div>
                                                                    <div className="flex gap-0.5 mt-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <span key={i} className={i < rating.rating ? 'text-yellow-400' : 'text-muted-foreground'}>★</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{new Date(rating.created_at).toLocaleDateString('id-ID')}</span>
                                                        </div>
                                                        {rating.comment && <p className="text-muted-foreground text-sm">{rating.comment}</p>}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {ratings.length === 0 && (
                                                <p className="text-center text-muted-foreground py-8">{t('no_reviews')}</p>
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
                                    <h3 className="text-xl font-bold text-card-foreground mb-4">{t('course_description')}</h3>
                                    <div className="prose prose-gray max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: course.description }}>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-8">
                                    <h3 className="text-xl font-bold text-card-foreground mb-6">{t('learning_modules')}</h3>
                                    {course.modules && course.modules.length > 0 ? (
                                        <div className="space-y-4">
                                            {course.modules.map((mod: any, i: number) => (
                                                <div key={mod.id} className="flex items-start gap-4 p-4 bg-muted rounded-xl">
                                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-card-foreground">{mod.title}</h4>
                                                        {mod.description && <p className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: mod.description }}></p>}
                                                        <span className="text-xs text-muted-foreground mt-2 block">{mod.lessons?.length || 0} {t('lessons')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">{t('no_modules')}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {ratings.length > 0 && (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="p-8">
                                        <h3 className="text-xl font-bold text-card-foreground mb-6">{t('tab_reviews')} ({ratings.length})</h3>
                                        <div className="space-y-4">
                                            {ratings.map((rating) => (
                                                <div key={rating.id} className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-bold text-primary">{rating.user_name?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium text-card-foreground">{rating.user_name}</span>
                                                            <div className="flex gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={i < rating.rating ? 'text-yellow-400' : 'text-muted-foreground'}>★</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {rating.comment && <p className="text-muted-foreground text-sm mt-1">{rating.comment}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-2xl p-8 text-center border border-primary/10">
                                <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-card-foreground mb-2">{t('follow_course')}</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    {t('login_or_register')}
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        className="rounded-xl px-8"
                                        onClick={() => router.push('/login')}
                                    >
                                        {ta('login_submit')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl px-8"
                                        onClick={() => router.push('/register')}
                                    >
                                        {ta('register')}
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
