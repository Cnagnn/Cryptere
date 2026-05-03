import { Head } from '@inertiajs/react';
import type {
    CourseRow,
    LessonRow,
    Paginated,
    TaskRow,
} from '@/components/course-types';
import { dashboard } from '@/routes';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import type {
    AdminAssessment,
    AdminAssessmentQuestion,
    BloomLevel,
} from '@/types';
import AdminCoursesAssessment from './assessment';
import AdminCoursesTask from './task';
import AdminCoursesTitle from './title';
import AdminCoursesTopic from './topic';

type LessonOption = { id: number; course_id: number; title: string };

type Props = {
    section: 'catalog' | 'lesson' | 'task' | 'assessment';
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
    assessmentQuestions: AdminAssessmentQuestion[];
    selectedAssessmentId: number;
    assessmentTopics: { id: number; name: string }[];
    assessmentFilters: {
        search: string;
        bloom_level: BloomLevel | null;
    };
};

export default function AdminCoursesIndex(props: Props) {
    return (
        <>
            <Head title="Manajemen - Kursus" />

            {props.section === 'lesson' ? (
                <AdminCoursesTopic
                    lessons={props.lessons}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
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
                />
            ) : null}

            {props.section === 'catalog' ? (
                <AdminCoursesTitle courses={props.courses} />
            ) : null}

            {props.section === 'assessment' ? (
                <AdminCoursesAssessment
                    assessments={props.assessments}
                    questions={props.assessmentQuestions}
                    selectedAssessmentId={props.selectedAssessmentId}
                    courseOptions={props.courseOptions}
                    selectedCourseId={props.selectedCourseId}
                    allLessons={props.allLessons ?? []}
                    topics={props.assessmentTopics}
                    filters={props.assessmentFilters}
                />
            ) : null}
        </>
    );
}

AdminCoursesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Beranda',
            href: dashboard(),
        },
        {
            title: 'Manajemen',
            href: adminCoursesIndex(),
        },
        {
            title: 'Kursus',
            href: adminCoursesIndex(),
        },
    ],
};
