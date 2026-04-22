import CoursesIndex from '@/pages/courses/index';
import { dashboard } from '@/routes';
import { index as labsIndex } from '@/routes/labs';

export default function LabsIndex() {
    return (
        <CoursesIndex
            courses={[]}
            catalogMode="labs"
            headTitle="Labs"
            pageTitle="Labs"
            pageDescription="Explore cryptography simulations and visual labs without progress or point requirements."
            sidebarMode="filters"
        />
    );
}

LabsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Labs',
            href: labsIndex(),
        },
    ],
};
