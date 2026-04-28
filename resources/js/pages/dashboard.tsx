import { Head, usePage } from '@inertiajs/react';

import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { LearnerDashboard } from '@/components/dashboard/learner-dashboard';
import type { Auth } from '@/types/auth';
import type { DashboardProps } from '@/types/dashboard';

export default function Dashboard({
    stats,
    level,
    academy,
    learningPath,
    analytics,
    admin,
    decayWarning,
    recentCourses,
}: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const isAdmin = auth.user.is_admin;

    return (
        <>
            <Head title="Dashboard" />
            {isAdmin && admin ? (
                <AdminDashboard admin={admin} />
            ) : stats && academy ? (
                <LearnerDashboard
                    stats={stats}
                    level={level}
                    academy={academy}
                    learningPath={learningPath}
                    analytics={analytics}
                    decayWarning={decayWarning}
                    recentCourses={recentCourses}
                />
            ) : null}
        </>
    );
}
