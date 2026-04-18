import CoursesIndex from '@/pages/courses/index';
import { index as labsIndex } from '@/routes/labs';

export default function LabsIndex() {
    return (
        <CoursesIndex
            courses={[]}
            catalogMode="labs"
            headTitle="Labs"
            pageTitle="Labs"
            pageDescription="This catalog is dedicated to cryptographic algorithm visualization and simulation with no progress or points."
            sidebarMode="filters"
        />
    );
}

LabsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Labs',
            href: labsIndex(),
        },
    ],
};
