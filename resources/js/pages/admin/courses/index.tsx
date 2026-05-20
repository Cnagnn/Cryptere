import { Head } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { dashboard } from '@/routes';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import type {
    AdminAssessment,
    AdminAssessmentQuestion,
    BloomLevel,
    Paginated,
    QuestionBank,
} from '@/types';
import type { CourseRow, LessonRow, TaskRow } from '@/types/course-management';
import AdminCoursesAssessment from './assessment';
import AdminCoursesBuilder from './builder';
import AdminCoursesTask from './task';
import AdminCoursesTitle from './title';
import AdminCoursesTopic from './topic';

type VersionHistoryItem = {
    id: number;
    version_number: number;
    changed_fields: string[];
    change_summary: string | null;
    creator_name: string | null;
    created_at: string | null;
    restored_at: string | null;
};

type LessonOption = { id: number; course_id: number; title: string };

type Props = {
    section: 'catalog' | 'lesson' | 'task' | 'assessment';
    builderMode: boolean;
    builder: ComponentProps<typeof AdminCoursesBuilder>['builder'];
    courses: Paginated<CourseRow>;
    courseOptions: Array<Pick<CourseRow, 'id' | 'title'>>;
    allLessons: LessonOption[];
    lessons: Paginated<LessonRow>;
    tasks: Paginated<TaskRow>;
    selectedCourseId: number;
    selectedLessonId: number;
    filters: {
        search: string;
    };
    // Assessment section data
    assessments: Paginated<AdminAssessment>;
    allAssessments: { id: number; title: string; course_id: number; course_title: string }[];
    assessmentQuestions: AdminAssessmentQuestion[];
    selectedAssessmentId: number;
    assessmentTopics: { id: number; name: string }[];
    courseFilterSelected: boolean;
    assessmentFilters: {
        search: string;
        bloom_level: BloomLevel | null;
    };
    questionBank: Paginated<QuestionBank>;
    versionHistories: {
        courses: Record<number, VersionHistoryItem[]>;
        lessons: Record<number, VersionHistoryItem[]>;
        tasks: Record<number, VersionHistoryItem[]>;
        assessments: Record<number, VersionHistoryItem[]>;
    };
};

export default function AdminCoursesIndex(props: Props) {
    if (props.builderMode) {
        return (
            <>
                <Head title="Course Builder" />
                <AdminCoursesBuilder builder={props.builder} />
            </>
        );
    }

    return (
        <>
            <Head title="Management - Courses" />

            {props.section === 'lesson' ? (
                <AdminCoursesTopic
                    lessons={props.lessons}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
                    versionHistories={props.versionHistories.lessons}
                />
            ) : null}

            {props.section === 'task' ? (
                <AdminCoursesTask
                    tasks={props.tasks}
                    lessons={props.lessons}
                    allLessons={props.allLessons ?? []}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
                    selectedLessonId={props.selectedLessonId}
                    versionHistories={props.versionHistories.tasks}
                />
            ) : null}

            {props.section === 'catalog' ? (
                <AdminCoursesTitle
                    courses={props.courses}
                    versionHistories={props.versionHistories.courses}
                />
            ) : null}

            {props.section === 'assessment' ? (
                <AdminCoursesAssessment
                    assessments={props.assessments}
                    allAssessments={props.allAssessments ?? []}
                    questions={props.assessmentQuestions}
                    selectedAssessmentId={props.selectedAssessmentId}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
                    courseFilterSelected={props.courseFilterSelected}
                    allLessons={props.allLessons ?? []}
                    topics={props.assessmentTopics}
                    filters={props.assessmentFilters}
                    questionBank={props.questionBank}
                    versionHistories={props.versionHistories.assessments}
                />
            ) : null}
        </>
    );
}

AdminCoursesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Courses',
            href: adminCoursesIndex(),
        },
    ],
};
