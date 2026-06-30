'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Send, CheckCircle2, Circle, HelpCircle, Save, AlertTriangle } from 'lucide-react';
import { saveQuizDraft } from '@/lib/api/learning';

interface Question {
    id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'essay';
    choices: { id: number; choice_text: string }[];
    points: number;
    essay_word_limit?: number;
}

interface QuizTakerProps {
    quiz: {
        id: number;
        title: string;
        description?: string;
        passing_score_percentage: number;
        time_limit_minutes?: number;
        questions: Question[];
    };
    onSubmit: (answers: { question_id: number; choice_id?: number; answer?: boolean; essay?: string }[], timeSpent: number) => Promise<void>;
    onCancel?: () => void;
    initialAnswers?: Record<number, any>;
    initialTimeSpent?: number;
}

const STORAGE_KEY_PREFIX = 'quiz_draft_';
const AUTO_SAVE_INTERVAL = 15000;

export default function QuizTaker({ quiz, onSubmit, onCancel, initialAnswers, initialTimeSpent }: QuizTakerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>(initialAnswers || {});
    const [marked, setMarked] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const startTimeRef = useRef(initialTimeSpent ? Date.now() - initialTimeSpent * 1000 : Date.now());
    const answersRef = useRef(answers);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);
    const submittingRef = useRef(false);
    const doneRef = useRef(false);

    const timeLimit = quiz.time_limit_minutes || 0;

    // Keep answersRef in sync
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    // Load marked state from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${quiz.id}_marked`);
            if (stored) {
                setMarked(new Set(JSON.parse(stored)));
            }
        } catch {}
    }, [quiz.id]);

    // Tab / Window visibility detection (anti-cheat)
    const [tabHidden, setTabHidden] = useState(false);
    const [violations, setViolations] = useState(0);
    const hiddenSinceRef = useRef<number | null>(null);
    const violationsRef = useRef(0);
    const MAX_VIOLATIONS = 3;
    const MAX_HIDDEN_SECONDS = 15;
    const VIOLATIONS_KEY = `${STORAGE_KEY_PREFIX}${quiz.id}_violations`;

    // Load violations from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(VIOLATIONS_KEY);
            if (stored) {
                const v = parseInt(stored, 10);
                violationsRef.current = v;
                setViolations(v);
            }
        } catch {}
    }, [quiz.id]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                setTabHidden(true);
                hiddenSinceRef.current = Date.now();
            } else {
                setTabHidden(false);
                if (hiddenSinceRef.current) {
                    const elapsed = (Date.now() - hiddenSinceRef.current) / 1000;
                    if (elapsed > 3) {
                        violationsRef.current += 1;
                        setViolations(violationsRef.current);
                        localStorage.setItem(VIOLATIONS_KEY, String(violationsRef.current));
                    }
                    hiddenSinceRef.current = null;
                }
            }
        };

        const handleBlur = () => {
            setTabHidden(true);
            if (!hiddenSinceRef.current) {
                hiddenSinceRef.current = Date.now();
            }
        };

        const handleFocus = () => {
            setTabHidden(false);
            if (hiddenSinceRef.current) {
                const elapsed = (Date.now() - hiddenSinceRef.current) / 1000;
                if (elapsed > 3) {
                    violationsRef.current += 1;
                    setViolations(violationsRef.current);
                    localStorage.setItem(VIOLATIONS_KEY, String(violationsRef.current));
                }
                hiddenSinceRef.current = null;
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Check if tab has been hidden too long or too many violations
    useEffect(() => {
        if (!tabHidden) return;
        const checkInterval = setInterval(() => {
            if (doneRef.current) return;
            if (violationsRef.current >= MAX_VIOLATIONS) {
                doSubmitRef.current();
                return;
            }
            if (hiddenSinceRef.current) {
                const elapsed = (Date.now() - hiddenSinceRef.current) / 1000;
                if (elapsed >= MAX_HIDDEN_SECONDS) {
                    doSubmitRef.current();
                }
            }
        }, 1000);
        return () => clearInterval(checkInterval);
    }, [tabHidden]);

    // Inactivity detection (mouse/keyboard idle)
    const IDLE_TIMEOUT_SECONDS = 45;
    const lastActivityRef = useRef(Date.now());
    const isInactiveRef = useRef(false);

    useEffect(() => {
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            isInactiveRef.current = false;
        };

        window.addEventListener('mousemove', handleActivity, { passive: true });
        window.addEventListener('keydown', handleActivity, { passive: true });
        window.addEventListener('click', handleActivity, { passive: true });
        window.addEventListener('touchstart', handleActivity, { passive: true });
        window.addEventListener('scroll', handleActivity, { passive: true });

        const idleInterval = setInterval(() => {
            if (doneRef.current) return;
            const idleTime = (Date.now() - lastActivityRef.current) / 1000;
            if (idleTime >= IDLE_TIMEOUT_SECONDS && !isInactiveRef.current) {
                isInactiveRef.current = true;
                violationsRef.current += 1;
                setViolations(violationsRef.current);
                localStorage.setItem(VIOLATIONS_KEY, String(violationsRef.current));

                if (violationsRef.current >= MAX_VIOLATIONS) {
                    doSubmitRef.current();
                }
            }
        }, 5000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            clearInterval(idleInterval);
        };
    }, []);

    // Timer
    useEffect(() => {
        if (timeLimit <= 0) return;
        const endTime = startTimeRef.current + timeLimit * 60 * 1000;
        let expired = false;
        const tick = () => {
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0 && !expired && !doneRef.current) {
                expired = true;
                doSubmitRef.current();
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [timeLimit]);

    // Auto-save to localStorage on every answer change
    useEffect(() => {
        try {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${quiz.id}`, JSON.stringify(answers));
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${quiz.id}_marked`, JSON.stringify([...marked]));
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${quiz.id}_time`, String(elapsed));
        } catch {}
    }, [answers, marked, quiz.id]);

    // Periodic auto-save to server
    useEffect(() => {
        if (!quiz.id) return;

        const doAutoSave = async () => {
            if (submittingRef.current || isSavingRef.current || Object.keys(answersRef.current).length === 0) return;
            isSavingRef.current = true;
            try {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                await saveQuizDraft(quiz.id, Object.values(answersRef.current), elapsed);
                setLastSaved(new Date());
            } catch {
                // Silent fail for auto-save
            } finally {
                isSavingRef.current = false;
            }
        };

        saveTimerRef.current = setInterval(doAutoSave, AUTO_SAVE_INTERVAL);
        return () => {
            if (saveTimerRef.current) clearInterval(saveTimerRef.current);
        };
    }, [quiz.id]);

    // Save on beforeunload
    useEffect(() => {
        const apiBase = typeof window !== 'undefined'
            ? `${window.location.origin}/apicorpu/1.0`
            : '';

        const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
            if (submittingRef.current) return;

            const currentAnswers = answersRef.current;
            if (Object.keys(currentAnswers).length === 0) return;

            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const payload = JSON.stringify({
                draft_answers: Object.values(currentAnswers),
                time_spent: elapsed,
            });

            try {
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                await fetch(`${apiBase}/learning/quizzes/${quiz.id}/save_draft/`, {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: payload,
                });
            } catch {}

            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [quiz.id]);

    // Final save when component unmounts (e.g., user clicks back)
    useEffect(() => {
        const apiBase = typeof window !== 'undefined'
            ? `${window.location.origin}/apicorpu/1.0`
            : '';

        return () => {
            if (submittingRef.current) return;

            const currentAnswers = answersRef.current;
            if (Object.keys(currentAnswers).length === 0) return;

            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const token = localStorage.getItem('token') || '';
            const payload = JSON.stringify({
                draft_answers: Object.values(currentAnswers),
                time_spent: elapsed,
            });

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                navigator.sendBeacon(
                    `${apiBase}/learning/quizzes/${quiz.id}/save_draft/`,
                    new Blob([payload], { type: 'application/json' })
                );
            } catch {}
        };
    }, [quiz.id]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const doSubmit = async () => {
        if (doneRef.current || submittingRef.current) return;
        doneRef.current = true;
        submittingRef.current = true;
        setSubmitting(true);
        try {
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            try {
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}`);
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}_marked`);
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}_time`);
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quiz.id}_violations`);
            } catch {}
            await onSubmit(Object.values(answersRef.current), timeSpent);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const doSubmitRef = useRef(doSubmit);
    doSubmitRef.current = doSubmit;

    const currentQuestion = quiz.questions[currentIndex];
    const totalQuestions = quiz.questions.length;
    const markedCount = marked.size;
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

    const handleAnswer = (value: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    };

    const handleChoiceAnswer = (choiceId: number) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: { question_id: currentQuestion.id, choice_id: choiceId } }));
    };

    const handleTrueFalse = (value: boolean) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: { question_id: currentQuestion.id, answer: value } }));
    };

    const handleEssayAnswer = (text: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: { question_id: currentQuestion.id, essay: text } }));
    };

    const getQuestionStatus = (qId: number) => {
        if (marked.has(qId)) return 'marked';
        if (answers[qId]) return 'answered';
        return 'empty';
    };

    const renderQuestion = () => {
        if (!currentQuestion) return null;
        const readOnly = isCurrentMarked;

        const choiceClass = (isSelected: boolean) =>
            `p-3 border rounded-lg transition ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
                isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : readOnly
                        ? 'border-border opacity-70'
                        : 'border-border hover:border-blue-300'
            }`;

        switch (currentQuestion.question_type) {
            case 'multiple_choice':
                return (
                    <div className="space-y-3">
                        {currentQuestion.choices.map((choice) => (
                            <div
                                key={choice.id}
                                className={choiceClass(currentAnswer?.choice_id === choice.id)}
                                onClick={() => !readOnly && handleChoiceAnswer(choice.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        currentAnswer?.choice_id === choice.id ? 'border-blue-500' : 'border-border'
                                    }`}>
                                        {currentAnswer?.choice_id === choice.id && (
                                            <div className="w-3 h-3 rounded-full bg-blue-50 dark:bg-blue-900/300" />
                                        )}
                                    </div>
                                    <span>{choice.choice_text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'true_false':
                return (
                    <div className="flex gap-4">
                        {[
                            { value: true, label: 'Benar' },
                            { value: false, label: 'Salah' },
                        ].map(option => {
                            const isActive = currentAnswer?.answer === option.value;
                            return (
                                <div
                                    key={String(option.value)}
                                    className={`flex-1 p-4 border-2 rounded-lg text-center transition font-semibold ${
                                        readOnly ? 'cursor-default' : 'cursor-pointer'
                                    } ${
                                        isActive
                                            ? option.value
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700'
                                                : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            : readOnly
                                                ? 'border-border opacity-70'
                                                : 'border-border hover:border-gray-400'
                                    }`}
                                    onClick={() => !readOnly && handleTrueFalse(option.value)}
                                >
                                    {option.label}
                                </div>
                            );
                        })}
                    </div>
                );

            case 'essay':
                return (
                    <textarea
                        className={`w-full p-4 border rounded-lg transition ${
                            readOnly ? 'bg-muted cursor-default' : 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        }`}
                        rows={6}
                        placeholder="Tulis jawaban Anda di sini..."
                        value={currentAnswer?.essay || ''}
                        onChange={(e) => !readOnly && handleEssayAnswer(e.target.value)}
                        readOnly={readOnly}
                    />
                );
        }
    };

    const handleToggleMark = () => {
        setMarked(prev => {
            const next = new Set(prev);
            if (next.has(currentQuestion.id)) {
                next.delete(currentQuestion.id);
            } else {
                next.add(currentQuestion.id);
            }
            return next;
        });
    };

    const isCurrentMarked = marked.has(currentQuestion?.id);

    return (
        <div className="relative">
            {/* Tab Hidden Overlay */}
            {tabHidden && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                    <div className="bg-card rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                        <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-card-foreground mb-2">Peringatan!</h2>
                        <p className="text-muted-foreground mb-4">
                            Anda meninggalkan halaman kuis. Kuis akan dikirim otomatis jika anda terus meninggalkan halaman ini.
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                Pelanggaran: {violations} / {MAX_VIOLATIONS}
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={() => {
                                setTabHidden(false);
                                hiddenSinceRef.current = null;
                            }}
                        >
                            Kembali ke Kuis
                        </Button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto flex gap-6">
                {/* Question Navigator Sidebar */}
                <div className="w-24 flex-shrink-0">
                    <div className="bg-card rounded-lg border border-border p-3 sticky top-6 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground text-center mb-3">Soal</p>
                        {quiz.questions.map((q, i) => {
                            const status = getQuestionStatus(q.id);
                            const isCurrent = i === currentIndex;
                            const colorMap: Record<string, string> = {
                                marked: 'border-green-500 bg-green-50 dark:bg-green-900/300 text-white',
                                answered: 'border-yellow-400 bg-yellow-50 text-yellow-700',
                                empty: 'border-red-300 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400',
                            };
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(i)}
                                    className={`w-full aspect-square rounded-lg text-sm font-bold border-2 transition flex items-center justify-center ${
                                        isCurrent ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-300' : colorMap[status]
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                        <div className="pt-2 border-t space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-900/300" />
                                <span>Tandai</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <div className="w-3 h-3 rounded bg-yellow-400" />
                                <span>Isi</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <div className="w-3 h-3 rounded bg-red-300" />
                                <span>Kosong</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30" />
                                <span>Skrg</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">{quiz.title}</CardTitle>
                                    {quiz.description && <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {lastSaved && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Save className="w-3 h-3" />
                                            Tersimpan
                                        </span>
                                    )}
                                    <Badge variant="outline" className="text-sm">
                                        Lulus: {quiz.passing_score_percentage}%
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm text-muted-foreground">
                                    Soal {currentIndex + 1} dari {totalQuestions}
                                </span>
                                {timeLimit > 0 && timeLeft !== null && (
                                    <span className={`text-sm font-bold ${timeLeft <= 60 ? 'text-red-600 dark:text-red-400 animate-pulse' : timeLeft <= 300 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                        ⏱ {formatTime(timeLeft)}
                                    </span>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    <span className="text-green-600 dark:text-green-400 font-medium">{markedCount}</span>
                                    <span className="text-muted-foreground"> ditandai </span>
                                    <span className="text-yellow-600 font-medium">{Object.keys(answers).length - markedCount}</span>
                                    <span className="text-muted-foreground"> diisi </span>
                                    <span className="text-red-500 dark:text-red-400 font-medium">{totalQuestions - Object.keys(answers).length}</span>
                                    <span className="text-muted-foreground"> kosong</span>
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                        isCurrentMarked
                                            ? 'bg-green-50 dark:bg-green-900/300 text-white'
                                            : currentAnswer
                                                ? 'bg-yellow-400 text-yellow-900'
                                                : 'bg-red-300 text-white'
                                    }`}>
                                        {currentIndex + 1}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium mb-4">{currentQuestion?.question_text}</h3>
                                        {renderQuestion()}
                                        <div className="mt-4">
                                            <Button
                                                variant={isCurrentMarked ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={handleToggleMark}
                                                className={isCurrentMarked ? 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800' : ''}
                                            >
                                                {isCurrentMarked ? '✓ Sudah Ditandai' : 'Tandai Jawaban'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                        <div>
                            {onCancel && (
                                <Button variant="outline" onClick={onCancel}>Batalkan</Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />Sebelumnya
                            </Button>
                            {currentIndex < totalQuestions - 1 ? (
                                <Button onClick={() => setCurrentIndex(i => i + 1)}>
                                    Selanjutnya<ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={doSubmit} disabled={submitting}>
                                    <Send className="w-4 h-4 mr-2" />
                                    {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
