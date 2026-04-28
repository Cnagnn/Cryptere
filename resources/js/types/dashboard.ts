import type { UserLevel } from '@/types/auth';

// ── Learner Dashboard ──

export type LearnerStats = {
    enrolledCourses: number;
    completedCourses: number;
    completedLessons: number;
    solvedChallenges: number;
    points: number;
    xp: number;
};

export type AcademyHero = {
    greeting: string;
    headline: string;
    description: string;
    completionRate: number;
};

export type LearningPathSummary = {
    name: string;
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
    currentRank: number;
};

export type SuccessMetrics = {
    overallSuccessRate: number;
    previousSuccessRate: number;
    targetRate: number;
    totalEnrollments: number;
    completedEnrollments: number;
    inProgressEnrollments: number;
};

export type LeaderboardEntry = {
    rank: number;
    name: string;
    username: string | null;
    avatar: string | null;
    points: number;
    isCurrentUser?: boolean;
};

export type ActivityBreakdownItem = {
    label: string;
    completed: number;
    total: number;
    percentage: number;
};

export type MonthlyProgressEntry = {
    month: string;
    lessonsCompleted: number;
    challengesSolved: number;
    totalActivity: number;
};

export type MonthlyProgress = {
    rangeLabel: string;
    summaryPercentage: number;
    deltaFromPrevious: number;
    series: MonthlyProgressEntry[];
};

export type EarningsHistoryEntry = { label: string; points: number; xp: number };

export type EarningsHistory = {
    deltaFromPrevious: number;
    weekly: EarningsHistoryEntry[];
    monthly: EarningsHistoryEntry[];
};

export type RecentActivityItem = {
    id: string;
    title: string;
    tag: string;
    timestamp: string;
    isoDate: string;
};

export type AcademyData = {
    hero: AcademyHero;
    learningPath: LearningPathSummary;
    successMetrics: SuccessMetrics;
    leaderboardPreview: LeaderboardEntry[];
    activityBreakdown: ActivityBreakdownItem[];
    monthlyProgress: MonthlyProgress;
    earningsHistory: EarningsHistory;
    popularCourses: unknown[];
    recentActivity: RecentActivityItem[];
};

export type PathNode = {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    category: string | null;
    difficulty: string;
    pathPosition: number;
    prerequisiteId: number | null;
    prerequisiteTitle: string | null;
    lessonCount: number;
    estimatedMinutes: number | null;
    cover: string | null;
    isEnrolled: boolean;
    progressPercentage: number;
    isCompleted: boolean;
    isLocked: boolean;
};

export type LearningPathData = { nodes: PathNode[]; categories: string[] };

export type StreakCalendarEntry = {
    date: string;
    active: boolean;
    isToday?: boolean;
    isOutOfRange?: boolean;
    isFuture?: boolean;
};

export type AnalyticsData = {
    stats: unknown;
    activityHeatmap: unknown[];
    streakCalendar: StreakCalendarEntry[];
};

export type RecentCourse = {
    id: number | null;
    slug: string | null;
    title: string | null;
    summary: string | null;
    lessonCount: number | null;
    progressPercentage: number;
};

export type DecayWarning = {
    daysUntilDecay: number;
    currentPoints: number;
    decayPercent: number;
};

// ── Admin Dashboard ──

export type AdminStats = {
    totalUsers: number;
    totalCourses: number;
    totalChallenges: number;
    totalEnrollments: number;
    activeUsers: number;
    newUsersThisMonth: number;
};

export type AdminEnrollmentTrend = { month: string; enrollments: number };
export type AdminUserGrowth = { month: string; users: number };

export type AdminCoursePerformance = {
    title: string;
    enrollments: number;
    completionRate: number;
};

export type AdminChallengePerformance = {
    title: string;
    submissions: number;
    successRate: number;
};

export type AdminRecentUser = {
    id: number;
    name: string;
    username: string | null;
    email: string;
    role: string;
    createdAt: string;
};

export type AdminData = {
    stats: AdminStats;
    enrollmentTrends: AdminEnrollmentTrend[];
    userGrowth: AdminUserGrowth[];
    coursePerformance: AdminCoursePerformance[];
    challengePerformance: AdminChallengePerformance[];
    recentUsers: AdminRecentUser[];
};

// ── Page Props ──

export type DashboardProps = {
    stats?: LearnerStats;
    level?: UserLevel;
    academy?: AcademyData;
    learningPath?: LearningPathData;
    analytics?: AnalyticsData;
    admin?: AdminData;
    decayWarning?: DecayWarning | null;
    recentCourses?: RecentCourse[];
};
