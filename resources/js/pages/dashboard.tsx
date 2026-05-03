import { Head, usePage } from '@inertiajs/react';
import { BarChart3, Home } from 'lucide-react';
import { useState } from 'react';

import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { LearnerDashboard } from '@/components/dashboard/learner-dashboard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const [activeTab, setActiveTab] = useState<string>('home');

    // Admin gets tabbed view with Home + Analytics
    if (isAdmin && admin) {
        return (
            <>
                <Head title="Dasbor" />
                {activeTab === 'home' && stats && academy ? (
                    <LearnerDashboard
                        stats={stats}
                        level={level}
                        academy={academy}
                        learningPath={learningPath}
                        analytics={analytics}
                        decayWarning={decayWarning}
                        recentCourses={recentCourses}
                        adminTabs={
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                            >
                                <TabsList>
                                    <TabsTrigger value="home">
                                        <Home className="size-4" />
                                        Beranda
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics">
                                        <BarChart3 className="size-4" />
                                        Analitik
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        }
                    />
                ) : activeTab === 'analytics' ? (
                    <AdminDashboard
                        admin={admin}
                        adminTabs={
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                            >
                                <TabsList>
                                    <TabsTrigger value="home">
                                        <Home className="size-4" />
                                        Beranda
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics">
                                        <BarChart3 className="size-4" />
                                        Analitik
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        }
                    />
                ) : null}
            </>
        );
    }

    // Regular learner view (unchanged)
    return (
        <>
            <Head title="Dasbor" />
            {stats && academy ? (
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
