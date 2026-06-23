import CoursesIndex from '@/pages/courses/index';

export default function LabsIndex() {
    return (
        <CoursesIndex
            courses={[]}
            catalogMode="labs"
            headTitle="Laboratorium"
            pageTitle="Laboratorium"
            pageDescription="Jelajahi simulasi kriptografi dan laboratorium visual tanpa persyaratan progres atau poin."
            sidebarMode="filters"
        />
    );
}
