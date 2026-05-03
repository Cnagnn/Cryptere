import CoursesIndex from '@/pages/courses/index';
import { dashboard } from '@/routes';
import { index as labsIndex } from '@/routes/labs';

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

LabsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Beranda',
            href: dashboard(),
        },
        {
            title: 'Laboratorium',
            href: labsIndex(),
        },
    ],
};
