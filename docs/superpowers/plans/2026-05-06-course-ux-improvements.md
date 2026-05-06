# Course UX/UI Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ('- [ ]') syntax for tracking.

**Goal:** Implement comprehensive UX/UI improvements for course learning experience including data persistence, error recovery, accessibility, and user feedback.

**Architecture:** Incremental layer-by-layer approach across 4 phases. Build reusable hooks and utilities first, then enhance UI components, add error recovery, and finally polish with advanced features.

**Tech Stack:** React 19, TypeScript, Inertia.js v3, Tailwind CSS v4, Radix UI, Sonner, seedrandom

---

## File Structure

### New Files to Create

**Hooks:**
- 'resources/js/hooks/use-local-storage.ts' - localStorage sync with React state
- 'resources/js/hooks/use-debounced-value.ts' - Debounce value changes
- 'resources/js/hooks/use-video-progress.ts' - Video playback position tracking
- 'resources/js/hooks/use-retry.ts' - Retry mechanism with exponential backoff
- 'resources/js/hooks/use-keyboard-navigation.ts' - Keyboard navigation logic
- 'resources/js/hooks/use-video-processing-status.ts' - Poll video processing status
- 'resources/js/hooks/use-assessment-timer.ts' - Assessment timer with visibility API
- 'resources/js/hooks/use-assessment-autosave.ts' - Debounced assessment auto-save

**Utilities:**
- 'resources/js/lib/storage-keys.ts' - Centralized localStorage key definitions
- 'resources/js/lib/shuffle.ts' - Deterministic shuffle with seed

**Components:**
- 'resources/js/components/quiz-review-screen.tsx' - Pre-submit quiz review
- 'resources/js/components/error-boundary.tsx' - Global error boundary
- 'resources/js/components/network-status-indicator.tsx' - Online/offline indicator
- 'resources/js/components/accessibility-announcer.tsx' - ARIA live region announcer

### Files to Modify

- 'resources/js/pages/courses/show.tsx' - Main course detail page (video, quiz, assessment)
- 'resources/js/pages/courses/index.tsx' - Course catalog with reset confirmation

---

## Phase 1: Data Persistence Layer

### Task 1: Storage Keys Utility

**Files:**
- Create: 'resources/js/lib/storage-keys.ts'

- [ ] **Step 1: Create storage keys file**

`	ypescript
// resources/js/lib/storage-keys.ts
export const STORAGE_KEYS = {
    QUIZ_DRAFT: (taskId: number) => 'quiz-draft-\' as const,
    ASSESSMENT_DRAFT: (assessmentId: number) => 'assessment-draft-\' as const,
    VIDEO_POSITION: (taskId: number) => 'video-position-\' as const,
    QUIZ_SHUFFLE_SEED: (taskId: number) => 'quiz-shuffle-\' as const,
    HEARTBEAT_QUEUE: 'heartbeat-queue' as const,
} as const;

export type QuizDraft = {
    taskId: number;
    answers: number[]; // -1 = unanswered, 0-3 = option index
    timestamp: number;
    version: 1;
};

export type AssessmentDraft = {
    assessmentId: number;
    submissionId: number;
    answers: Record<number, {
        answer_text?: string;
        selected_option?: string;
    }>;
    timestamp: number;
    version: 1;
};

export type VideoProgress = {
    taskId: number;
    position: number; // seconds
    duration: number;
    timestamp: number;
};

export type QueuedHeartbeat = {
    id: string;
    taskId: number;
    type: 'video' | 'reading';
    seconds: number;
    timestamp: number;
};
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/lib/storage-keys.ts
git commit -m "feat: add storage keys and type definitions"
`

---

### Task 2: useLocalStorage Hook

**Files:**
- Create: 'resources/js/hooks/use-local-storage.ts'

- [ ] **Step 1: Create useLocalStorage hook**

`	ypescript
// resources/js/hooks/use-local-storage.ts
import { useEffect, useState } from 'react';

export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    // SSR-safe: check if window is available
    const isClient = typeof window !== 'undefined';

    // Initialize state
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (!isClient) return initialValue;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    // Update localStorage when state changes
    const setValue = (value: T | ((prev: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (isClient) {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded');
                // TODO: Implement cleanup of old drafts
            } else {
                console.error('Error writing to localStorage:', error);
            }
        }
    };

    // Remove from localStorage
    const removeValue = () => {
        try {
            if (isClient) {
                window.localStorage.removeItem(key);
                setStoredValue(initialValue);
            }
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    };

    // Listen for changes in other tabs
    useEffect(() => {
        if (!isClient) return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error('Error parsing storage event:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, isClient]);

    return [storedValue, setValue, removeValue];
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/hooks/use-local-storage.ts
git commit -m "feat: add useLocalStorage hook with cross-tab sync"
`

---

### Task 3: useDebouncedValue Hook

**Files:**
- Create: 'resources/js/hooks/use-debounced-value.ts'

- [ ] **Step 1: Create useDebouncedValue hook**

`	ypescript
// resources/js/hooks/use-debounced-value.ts
import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/hooks/use-debounced-value.ts
git commit -m "feat: add useDebouncedValue hook"
`

---

### Task 4: useVideoProgress Hook

**Files:**
- Create: 'resources/js/hooks/use-video-progress.ts'

- [ ] **Step 1: Create useVideoProgress hook**

`	ypescript
// resources/js/hooks/use-video-progress.ts
import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './use-local-storage';
import { STORAGE_KEYS, type VideoProgress } from '@/lib/storage-keys';

export function useVideoProgress(taskId: number) {
    const [progress, setProgress, removeProgress] = useLocalStorage<VideoProgress | null>(
        STORAGE_KEYS.VIDEO_POSITION(taskId),
        null
    );

    const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
    const pendingPosition = useRef<number | null>(null);

    // Save position (debounced via interval)
    const savePosition = useCallback((seconds: number, duration: number) => {
        pendingPosition.current = seconds;

        // Start auto-save interval if not already running
        if (!autoSaveInterval.current) {
            autoSaveInterval.current = setInterval(() => {
                if (pendingPosition.current !== null) {
                    setProgress({
                        taskId,
                        position: pendingPosition.current,
                        duration,
                        timestamp: Date.now(),
                    });
                    pendingPosition.current = null;
                }
            }, 5000); // Save every 5 seconds
        }
    }, [taskId, setProgress]);

    // Clear position
    const clearPosition = useCallback(() => {
        if (autoSaveInterval.current) {
            clearInterval(autoSaveInterval.current);
            autoSaveInterval.current = null;
        }
        pendingPosition.current = null;
        removeProgress();
    }, [removeProgress]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
            }
        };
    }, []);

    return {
        position: progress?.position ?? 0,
        savePosition,
        clearPosition,
    };
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/hooks/use-video-progress.ts
git commit -m "feat: add useVideoProgress hook for playback position tracking"
`

---

## Phase 2: UI Enhancements

### Task 5: Quiz Review Screen Component

**Files:**
- Create: 'resources/js/components/quiz-review-screen.tsx'

- [ ] **Step 1: Create quiz review screen component**

`	ypescript
// resources/js/components/quiz-review-screen.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type QuizQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
};

type QuizReviewScreenProps = {
    questions: QuizQuestion[];
    answers: number[]; // -1 = unanswered
    onEditQuestion: (index: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
};

export function QuizReviewScreen({
    questions,
    answers,
    onEditQuestion,
    onBack,
    onSubmit,
    isSubmitting,
}: QuizReviewScreenProps) {
    const unansweredCount = answers.filter(a => a === -1).length;
    const allAnswered = unansweredCount === 0;

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-2xl font-bold'>Review Your Answers</h2>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Check your answers before submitting
                    </p>
                </div>
                {!allAnswered && (
                    <Badge variant='destructive'>
                        {unansweredCount} Unanswered
                    </Badge>
                )}
            </div>

            <div className='space-y-4'>
                {questions.map((q, i) => {
                    const isAnswered = answers[i] !== -1;

                    return (
                        <Card key={q.id}>
                            <CardHeader>
                                <div className='flex items-center justify-between'>
                                    <span className='font-semibold'>
                                        Question {i + 1}
                                    </span>
                                    {isAnswered ? (
                                        <Badge variant='secondary'>Answered</Badge>
                                    ) : (
                                        <Badge variant='destructive'>Unanswered</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                                <p className='text-sm'>{q.question}</p>
                                {isAnswered && (
                                    <div className='rounded-lg bg-muted p-3'>
                                        <p className='text-sm font-medium'>Your answer:</p>
                                        <p className='text-sm text-muted-foreground mt-1'>
                                            {q.options[answers[i]]}
                                        </p>
                                    </div>
                                )}
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => onEditQuestion(i)}
                                >
                                    {isAnswered ? 'Edit Answer' : 'Answer Question'}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className='flex gap-2 border-t pt-4'>
                <Button variant='outline' onClick={onBack}>
                    Back to Quiz
                </Button>
                <Button
                    onClick={onSubmit}
                    disabled={!allAnswered || isSubmitting}
                    className='flex-1'
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
            </div>
        </div>
    );
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/components/quiz-review-screen.tsx
git commit -m "feat: add quiz review screen component"
`

---


### Task 6: Reset Confirmation Dialog

**Files:**
- Modify: 'resources/js/pages/courses/index.tsx:342-373'

- [ ] **Step 1: Add state for confirmation dialog**

In EnrolledCardFooter component, add:

`	ypescript
const [showResetDialog, setShowResetDialog] = useState(false);
const [confirmText, setConfirmText] = useState('');
`

- [ ] **Step 2: Replace Form with Button + Dialog**

Replace the Form component (lines 347-363) with:

`	ypescript
<>
    <Button
        variant='outline'
        onClick={() => setShowResetDialog(true)}
        disabled={progressPercentage === 0}
        className='w-full'
    >
        Mulai Ulang
    </Button>

    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Reset Progress?</AlertDialogTitle>
                <AlertDialogDescription>
                    You will lose {progressPercentage}% progress. Type "RESET" to confirm.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
                placeholder='Type RESET'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
            />
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>
                    Cancel
                </AlertDialogCancel>
                <Form
                    action={resetCourseProgress.url({ course: course.slug })}
                    method='post'
                >
                    {({ processing }) => (
                        <AlertDialogAction
                            type='submit'
                            disabled={confirmText !== 'RESET' || processing}
                        >
                            {processing ? 'Resetting...' : 'Reset Progress'}
                        </AlertDialogAction>
                    )}
                </Form>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</>
`

- [ ] **Step 3: Add Input import**

At top of file, add to imports:

`	ypescript
import { Input } from '@/components/ui/input';
`

- [ ] **Step 4: Test reset confirmation**

Run: 'npm run dev'
Navigate to courses page
Click "Mulai Ulang" on enrolled course
Verify dialog appears
Try submitting without typing RESET - should be disabled
Type "RESET" - button should enable
Submit - should reset progress

- [ ] **Step 5: Commit**

`ash
git add resources/js/pages/courses/index.tsx
git commit -m "feat: add reset confirmation dialog with text verification"
`

---

## Phase 3: Error Recovery

### Task 7: useRetry Hook

**Files:**
- Create: 'resources/js/hooks/use-retry.ts'

- [ ] **Step 1: Create useRetry hook**

`	ypescript
// resources/js/hooks/use-retry.ts
import { useCallback, useState } from 'react';

type RetryOptions = {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
};

export function useRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
) {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        onRetry,
    } = options;

    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [lastError, setLastError] = useState<Error | null>(null);

    const execute = useCallback(async (): Promise<T> => {
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                const result = await fn();
                setIsRetrying(false);
                setRetryCount(0);
                setLastError(null);
                return result;
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                setLastError(err);

                if (attempt === maxRetries) {
                    setIsRetrying(false);
                    throw err;
                }

                attempt++;
                setRetryCount(attempt);
                setIsRetrying(true);

                if (onRetry) {
                    onRetry(attempt, err);
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    initialDelay * Math.pow(backoffMultiplier, attempt - 1),
                    maxDelay
                );

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }, [fn, maxRetries, initialDelay, maxDelay, backoffMultiplier, onRetry]);

    return {
        execute,
        isRetrying,
        retryCount,
        lastError,
    };
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/hooks/use-retry.ts
git commit -m "feat: add useRetry hook with exponential backoff"
`

---

### Task 8: Error Boundary Component

**Files:**
- Create: 'resources/js/components/error-boundary.tsx'

- [ ] **Step 1: Create error boundary component**

`	ypescript
// resources/js/components/error-boundary.tsx
import React, { Component, type ReactNode } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

type Props = {
    children: ReactNode;
};

type State = {
    hasError: boolean;
    error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Empty className='h-screen'>
                    <EmptyHeader>
                        <XCircle className='size-16 text-destructive' />
                    </EmptyHeader>
                    <EmptyTitle>Something Went Wrong</EmptyTitle>
                    <EmptyDescription>
                        An unexpected error occurred. Your progress is saved locally.
                    </EmptyDescription>
                    <div className='flex gap-2'>
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                        <Button
                            variant='outline'
                            onClick={() => this.setState({ hasError: false, error: null })}
                        >
                            Try Again
                        </Button>
                    </div>
                </Empty>
            );
        }

        return this.props.children;
    }
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/components/error-boundary.tsx
git commit -m "feat: add error boundary component"
`

---

### Task 9: Network Status Indicator

**Files:**
- Create: 'resources/js/components/network-status-indicator.tsx'

- [ ] **Step 1: Create network status indicator**

`	ypescript
// resources/js/components/network-status-indicator.tsx
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export function NetworkStatusIndicator() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [showOffline, setShowOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOffline(false);
            toast.dismiss('offline-toast');
            toast.success('Connection restored');
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOffline(true);
            toast.error('Connection lost. Working offline.', {
                duration: Infinity,
                id: 'offline-toast',
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showOffline) return null;

    return (
        <div className='fixed bottom-4 left-4 z-50'>
            <Alert variant='destructive' className='shadow-lg'>
                <AlertCircle className='size-4' />
                <AlertTitle>Offline Mode</AlertTitle>
                <AlertDescription className='text-xs'>
                    Your progress is saved locally and will sync when reconnected.
                </AlertDescription>
            </Alert>
        </div>
    );
}
`

- [ ] **Step 2: Commit**

`ash
git add resources/js/components/network-status-indicator.tsx
git commit -m "feat: add network status indicator"
`

---

## Phase 4: Polish & Integration

### Task 10: Deterministic Shuffle Utility

**Files:**
- Create: 'resources/js/lib/shuffle.ts'

- [ ] **Step 1: Install seedrandom**

`ash
npm install seedrandom
npm install --save-dev @types/seedrandom
`

- [ ] **Step 2: Create shuffle utility**

`	ypescript
// resources/js/lib/shuffle.ts
import seedrandom from 'seedrandom';

export function shuffleWithSeed<T>(array: T[], seed: string): T[] {
    const rng = seedrandom(seed);
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}
`

- [ ] **Step 3: Commit**

`ash
git add package.json package-lock.json resources/js/lib/shuffle.ts
git commit -m "feat: add deterministic shuffle with seedrandom"
`

---

### Task 11: Integrate Quiz Improvements

**Files:**
- Modify: 'resources/js/pages/courses/show.tsx:1080-1539'

- [ ] **Step 1: Add imports at top of file**

`	ypescript
import { useLocalStorage } from '@/hooks/use-local-storage';
import { STORAGE_KEYS, type QuizDraft } from '@/lib/storage-keys';
import { shuffleWithSeed } from '@/lib/shuffle';
import { QuizReviewScreen } from '@/components/quiz-review-screen';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
`

- [ ] **Step 2: Add draft save logic in QuizPanel**

After line 1095 (const [answers, setAnswers] = useState...), add:

`	ypescript
// Load draft from localStorage
const [draft, saveDraft, clearDraft] = useLocalStorage<QuizDraft | null>(
    STORAGE_KEYS.QUIZ_DRAFT(task.taskId),
    null
);

// Initialize answers from draft if available
useEffect(() => {
    if (draft && draft.taskId === task.taskId) {
        setAnswers(draft.answers);
    }
}, []);

// Save draft when answers change
useEffect(() => {
    if (answers.some(a => a !== -1)) {
        saveDraft({
            taskId: task.taskId,
            answers,
            timestamp: Date.now(),
            version: 1,
        });
    }
}, [answers, task.taskId, saveDraft]);
`

- [ ] **Step 3: Add stable shuffle with seed**

After line 1100 (const questions = ...), replace with:

`	ypescript
// Generate or retrieve shuffle seed
const shuffleSeed = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.QUIZ_SHUFFLE_SEED(task.taskId));
    if (stored) return stored;

    const newSeed = '\-\';
    localStorage.setItem(STORAGE_KEYS.QUIZ_SHUFFLE_SEED(task.taskId), newSeed);
    return newSeed;
}, [task.taskId]);

// Shuffle questions with stable seed
const questions = useMemo(() => {
    return task.questions.map(q => ({
        ...q,
        shuffledOptions: shuffleWithSeed(
            q.options.map((opt, idx) => ({ text: opt, originalIndex: idx })),
            '\-\'
        ),
    }));
}, [task.questions, shuffleSeed]);
`

- [ ] **Step 4: Add review screen state**

After line 1093 (const [submitting, setSubmitting] = useState(false)), add:

`	ypescript
const [showReview, setShowReview] = useState(false);
`

- [ ] **Step 5: Add XP multiplier tooltip**

Find the Badge showing attempt number (around line 1150) and wrap with tooltip:

`	ypescript
<Tooltip>
    <TooltipTrigger asChild>
        <Badge variant='secondary' className='cursor-help'>
            Attempt {submission.attemptNumber}
            <Info className='ml-1 size-3' />
        </Badge>
    </TooltipTrigger>
    <TooltipContent>
        <div className='space-y-1 text-xs'>
            <p className='font-semibold'>XP Rewards:</p>
            <p>• 1st attempt: 100%</p>
            <p>• 2nd attempt: 50%</p>
            <p>• 3rd attempt: 25%</p>
            <p>• 4th+ attempt: 10%</p>
        </div>
    </TooltipContent>
</Tooltip>
`

- [ ] **Step 6: Add review screen before submit**

Replace the submit button section (around line 1525-1535) with:

`	ypescript
{showReview ? (
    <QuizReviewScreen
        questions={questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.shuffledOptions.map(o => o.text) as [string, string, string, string],
        }))}
        answers={answers}
        onEditQuestion={(index) => {
            setCurrentIndex(index);
            setShowReview(false);
        }}
        onBack={() => setShowReview(false)}
        onSubmit={submitQuiz}
        isSubmitting={submitting}
    />
) : (
    <>
        {/* Existing quiz UI */}
        {currentIndex < questions.length - 1 ? (
            <Button
                onClick={() =>
                    setCurrentIndex((index) =>
                        Math.min(questions.length - 1, index + 1)
                    )
                }
                disabled={answers[currentIndex] === -1}
            >
                Berikutnya
                <ChevronRight className='ml-2 size-4' />
            </Button>
        ) : (
            <Button
                onClick={() => setShowReview(true)}
                disabled={!allAnswered}
            >
                Review Answers
            </Button>
        )}
    </>
)}
`

- [ ] **Step 7: Clear draft on successful submission**

In submitQuiz function, after successful submission (around line 1234), add:

`	ypescript
clearDraft();
localStorage.removeItem(STORAGE_KEYS.QUIZ_SHUFFLE_SEED(task.taskId));
`

- [ ] **Step 8: Test quiz improvements**

Run: 'npm run dev'
Navigate to course with quiz
Start quiz - verify options are shuffled
Answer some questions - refresh page - verify answers persist
Complete quiz - click "Review Answers"
Verify review screen shows all answers
Submit quiz - verify draft is cleared

- [ ] **Step 9: Commit**

`ash
git add resources/js/pages/courses/show.tsx
git commit -m "feat: integrate quiz improvements (draft save, stable shuffle, review screen, XP tooltip)"
`

---

### Task 12: Integrate Video Progress Tracking

**Files:**
- Modify: 'resources/js/pages/courses/show.tsx:650-800'

- [ ] **Step 1: Add useVideoProgress hook**

In VideoPanel component (around line 650), add after existing hooks:

`	ypescript
const { position, savePosition, clearPosition } = useVideoProgress(task.taskId);
`

- [ ] **Step 2: Restore video position on player ready**

In the Plyr initialization (around line 700), add:

`	ypescript
player.on('ready', () => {
    if (position > 0) {
        player.currentTime = position;
        toast.info('Resumed from \s');
    }
});
`

- [ ] **Step 3: Save position during playback**

Add timeupdate listener:

`	ypescript
player.on('timeupdate', () => {
    const currentTime = player.currentTime;
    const duration = player.duration;
    savePosition(currentTime, duration);
});
`

- [ ] **Step 4: Clear position on completion**

In the completion handler (around line 470), add:

`	ypescript
clearPosition();
`

- [ ] **Step 5: Test video progress**

Run: 'npm run dev'
Navigate to course with video
Play video for 30 seconds
Refresh page
Verify video resumes from saved position
Complete video
Verify position is cleared

- [ ] **Step 6: Commit**

`ash
git add resources/js/pages/courses/show.tsx
git commit -m "feat: add video progress tracking and resume"
`

---

### Task 13: Add Error Retry to Video/PDF

**Files:**
- Modify: 'resources/js/pages/courses/show.tsx:650-950'

- [ ] **Step 1: Add useRetry for video**

In VideoPanel component, add:

`	ypescript
const { execute: retryVideo, isRetrying: isRetryingVideo } = useRetry(
    async () => {
        // Re-initialize player
        if (playerRef.current) {
            playerRef.current.destroy();
        }
        // Trigger re-render
        setVideoError(null);
    },
    {
        maxRetries: 3,
        onRetry: (attempt) => {
            toast.info('Retrying video load (attempt \)...');
        },
    }
);
`

- [ ] **Step 2: Add video error fallback UI**

Replace video error display (around line 750) with:

`	ypescript
{videoError && (
    <Empty className='h-[400px]'>
        <EmptyHeader>
            <AlertCircle className='size-12 text-destructive' />
        </EmptyHeader>
        <EmptyTitle>Video Failed to Load</EmptyTitle>
        <EmptyDescription>
            {videoError.message || 'Unable to load video content'}
        </EmptyDescription>
        <div className='flex gap-2'>
            <Button
                onClick={() => retryVideo()}
                variant='outline'
                disabled={isRetryingVideo}
            >
                {isRetryingVideo ? (
                    <>
                        <Loader2 className='mr-2 size-4 animate-spin' />
                        Retrying...
                    </>
                ) : (
                    <>
                        <RotateCcw className='mr-2 size-4' />
                        Retry
                    </>
                )}
            </Button>
            <Button onClick={() => window.location.reload()}>
                Refresh Page
            </Button>
        </div>
    </Empty>
)}
`

- [ ] **Step 3: Add useRetry for PDF**

In ReadPanel component (around line 820), add:

`	ypescript
const { execute: retryPdf, isRetrying: isRetryingPdf } = useRetry(
    async () => {
        setLoading(true);
        setPdfError(null);
        // Re-fetch PDF
        const response = await fetch(task.pdfUrl);
        if (!response.ok) throw new Error('Failed to load PDF');
        const blob = await response.blob();
        setPdfData(await blob.arrayBuffer());
        setLoading(false);
    },
    {
        maxRetries: 3,
        onRetry: (attempt) => {
            toast.info('Retrying PDF load (attempt \)...');
        },
    }
);
`

- [ ] **Step 4: Add PDF error fallback UI**

Add after loading check (around line 925):

`	ypescript
{pdfError && (
    <Alert variant='destructive' className='mb-4'>
        <AlertCircle className='size-4' />
        <AlertTitle>Document Load Failed</AlertTitle>
        <AlertDescription className='flex items-center justify-between'>
            <span>{pdfError.message}</span>
            <Button
                onClick={() => retryPdf()}
                variant='outline'
                size='sm'
                disabled={isRetryingPdf}
            >
                {isRetryingPdf ? (
                    <>
                        <Loader2 className='mr-2 size-3 animate-spin' />
                        Retrying...
                    </>
                ) : (
                    <>
                        <RotateCcw className='mr-2 size-3' />
                        Retry
                    </>
                )}
            </Button>
        </AlertDescription>
    </Alert>
)}
`

- [ ] **Step 5: Add imports**

At top of file, add:

`	ypescript
import { useRetry } from '@/hooks/use-retry';
import { RotateCcw } from 'lucide-react';
`

- [ ] **Step 6: Test error recovery**

Simulate network error (DevTools → Network → Offline)
Try loading video - verify error UI appears
Click Retry - verify retry attempts
Go online - verify successful load

- [ ] **Step 7: Commit**

`ash
git add resources/js/pages/courses/show.tsx
git commit -m "feat: add error retry mechanism for video and PDF"
`

---

### Task 14: Add Network Status to Layout

**Files:**
- Modify: 'resources/js/layouts/app-layout.tsx'

- [ ] **Step 1: Add NetworkStatusIndicator**

Import at top:

`	ypescript
import { NetworkStatusIndicator } from '@/components/network-status-indicator';
`

Add before closing tag of main layout:

`	ypescript
<NetworkStatusIndicator />
`

- [ ] **Step 2: Test network indicator**

Run: 'npm run dev'
Go offline (DevTools → Network → Offline)
Verify offline alert appears
Go online
Verify success toast and alert disappears

- [ ] **Step 3: Commit**

`ash
git add resources/js/layouts/app-layout.tsx
git commit -m "feat: add network status indicator to app layout"
`

---

### Task 15: Wrap Course Pages in Error Boundary

**Files:**
- Modify: 'resources/js/pages/courses/show.tsx'
- Modify: 'resources/js/pages/courses/index.tsx'

- [ ] **Step 1: Add ErrorBoundary to show.tsx**

Import at top:

`	ypescript
import { ErrorBoundary } from '@/components/error-boundary';
`

Wrap the entire component return:

`	ypescript
export default function CoursesShow({ ... }: CoursesShowProps) {
    // ... existing code ...

    return (
        <ErrorBoundary>
            {/* existing JSX */}
        </ErrorBoundary>
    );
}
`

- [ ] **Step 2: Add ErrorBoundary to index.tsx**

Same pattern - import and wrap return.

- [ ] **Step 3: Test error boundary**

Temporarily throw error in component
Verify error boundary catches and shows fallback UI
Click "Try Again" - verify recovery

- [ ] **Step 4: Commit**

`ash
git add resources/js/pages/courses/show.tsx resources/js/pages/courses/index.tsx
git commit -m "feat: wrap course pages in error boundary"
`

---

## Final Integration & Testing

### Task 16: Run Full Test Suite

- [ ] **Step 1: Run linter**

`ash
npm run lint
`

Expected: No errors

- [ ] **Step 2: Run type check**

`ash
npm run type-check
`

Expected: No type errors

- [ ] **Step 3: Run build**

`ash
npm run build
`

Expected: Successful build

- [ ] **Step 4: Manual E2E testing**

Test scenarios:
1. Course catalog → enroll → reset with confirmation
2. Video → play → refresh → resume from position
3. Quiz → answer → refresh → draft restored → review → submit
4. Go offline → verify indicator → go online → verify sync
5. Simulate errors → verify retry buttons work

- [ ] **Step 5: Final commit**

`ash
git add .
git commit -m "chore: final integration and testing"
`

---

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] localStorage working across tabs
- [ ] Error recovery tested
- [ ] Accessibility tested (keyboard navigation)
- [ ] Mobile responsive verified
- [ ] Performance acceptable (no lag)

---

## Success Metrics

Track these after deployment:

1. **Quiz abandonment rate** - should decrease by 30%
2. **Support tickets for lost progress** - should decrease by 80%
3. **Video restart rate** - should decrease by 60%
4. **Assessment completion rate** - should increase by 25%

---

## Rollback Plan

If issues arise:

**Phase 1 rollback:**
`ash
git revert <commit-hash-task-1-4>
`

**Phase 2 rollback:**
`ash
git revert <commit-hash-task-5-6>
`

**Phase 3 rollback:**
`ash
git revert <commit-hash-task-7-9>
`

**Phase 4 rollback:**
`ash
git revert <commit-hash-task-10-15>
`

Each phase is independently revertible.

