import type { UserLevel } from '@/types/auth';

// ── Learner Dashboard ──

export type LearnerStats = {
    enrolledCourses: number;
    completedCourses: number;
    completedLessons: number;
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
    totalActivity: number;
};

export type MonthlyProgress = {
    rangeLabel: string;
    summaryPercentage: number;
    deltaFromPrevious: number;
    series: MonthlyProgressEntry[];
};

export type EarningsHistoryEntry = {
    label: string;
    points: number;
    xp: number;
};

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

export type RecentBadge = {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    tier: string | null;
    category: string | null;
    actionLabel: string;
    actionUrl: string;
    earnedAt: string | null;
};

export type RecommendedCourse = {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    difficulty: string | null;
    category: string | null;
    lessonCount: number | null;
    recommendationReason: string;
    actionLabel: string;
};

export type DecayWarning = {
    daysUntilDecay: number;
    currentPoints: number;
    decayPercent: number;
};

export type LearnerNextAction = {
    type: 'continue_course' | 'start_course' | 'review_progress';
    title: string;
    description: string;
    actionLabel: string;
    url: string;
    meta: {
        courseTitle?: string;
        lessonTitle?: string | null;
        progressPercentage?: number;
        lessonCount?: number | null;
    };
};

export type WeeklyGoal = {
    label: string;
    targetLessons: number;
    completedLessons: number;
    remainingLessons: number;
    targetXp: number;
    earnedXp: number;
    progressPercentage: number;
    resetsAt: string;
};

export type RankProgress = {
    currentRank: number;
    nextRank: number | null;
    pointsToNextRank: number;
    nextUser: {
        name: string;
        username: string | null;
        points: number;
    } | null;
};

export type LearningRisk = {
    type: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionLabel: string;
    url: string;
};

export type ProgressInsight = {
    label: string;
    value: number;
    unit: string;
    description: string;
    status: 'strong' | 'needs_practice';
    courseCount: number;
};

export type BadgeGoal = {
    title: string;
    description: string | null;
    currentValue: number;
    targetValue: number;
    progressPercentage: number;
    actionLabel: string;
    url: string;
};

// ── Admin Dashboard ──

export type AdminStats = {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    activeUsers: number;
    newUsersThisMonth: number;
    periodUsers: number;
    periodEnrollments: number;
    activeUsersDelta: number;
    newUsersDelta: number;
    enrollmentsDelta: number;
    periodLabel: string;
};

export type AdminEnrollmentTrend = { month: string; enrollments: number };
export type AdminUserGrowth = { month: string; users: number };

export type AdminCoursePerformance = {
    title: string;
    enrollments: number;
    completionRate: number;
};

export type AdminRecentUser = {
    id: number;
    name: string;
    username: string | null;
    email: string;
    role: string;
    createdAt: string;
};

export type AdminCohortRetention = {
    cohort_week: string;
    signup_count: number;
    confidence: 'low' | 'medium' | 'high';
    sample_label: string;
    retention: Record<string, number | null>;
};

export type AdminGamificationFunnelStage = {
    stage: string;
    count: number;
    percentage: number;
    conversion_from_previous: number;
    dropoff_count: number;
    dropoff_percentage: number;
};

export type AdminEconomySignal = {
    label: string;
    value: number;
    unit: string;
    status: 'healthy' | 'watch';
};

export type AdminEconomyHealth = {
    total_xp_awarded_today: number;
    avg_xp_per_user: number;
    avg_points_per_user: number;
    avg_streak: number;
    users_with_streak: number;
    total_badges_earned: number;
    avg_badges_per_user: number;
    status: 'healthy' | 'watch';
    status_label: string;
    signals: AdminEconomySignal[];
    top_badge: {
        name: string;
        earn_count: number;
    } | null;
};

export type AdminFilters = {
    period: string;
    availablePeriods: Array<{ value: string; label: string }>;
    segment: string;
    availableSegments: Array<{ value: string; label: string }>;
};

export type AdminActionItem = {
    type: string;
    severity: 'medium' | 'high' | 'info';
    title: string;
    description: string;
    metric: number;
    actionLabel: string;
    actionUrl: string;
};

export type AdminCourseAnalytics = {
    id: number;
    title: string;
    enrollments: number;
    completionRate: number;
    lessonCompletionRate: number;
    quizPassRate: number | null;
    inactiveLearners: number;
    actionLabel: string;
    actionUrl: string;
};

export type AdminAnomaly = {
    type: string;
    severity: 'medium' | 'high' | 'info';
    title: string;
    description: string;
};

export type AdminReportSnapshot = {
    generatedAt: string;
    period: string;
    periodLabel: string;
    summary: {
        totalUsers: number;
        activeUsers: number;
        periodEnrollments: number;
        openActions: number;
        anomalies: number;
    };
    topActions: AdminActionItem[];
};

export type AdminData = {
    filters: AdminFilters;
    stats: AdminStats;
    enrollmentTrends: AdminEnrollmentTrend[];
    userGrowth: AdminUserGrowth[];
    coursePerformance: AdminCoursePerformance[];
    recentUsers: AdminRecentUser[];
    actionQueue: AdminActionItem[];
    courseAnalytics: AdminCourseAnalytics[];
    anomalies: AdminAnomaly[];
    reportSnapshot: AdminReportSnapshot;
    cohortRetention?: AdminCohortRetention[];
    gamificationFunnel?: AdminGamificationFunnelStage[];
    economyHealth?: AdminEconomyHealth;
};

// ── Page Props ──

export type DashboardProps = {
    stats?: LearnerStats;
    level?: UserLevel;
    academy?: AcademyData;
    analytics?: AnalyticsData;
    admin?: AdminData;
    decayWarning?: DecayWarning | null;
    nextAction?: LearnerNextAction;
    weeklyGoal?: WeeklyGoal;
    rankProgress?: RankProgress;
    learningRisks?: LearningRisk[];
    progressInsights?: ProgressInsight[];
    badgeGoal?: BadgeGoal;
    recentCourses?: RecentCourse[];
    recentBadges?: RecentBadge[];
    recommendedCourses?: RecommendedCourse[];
};
