import { toUrl } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const homeBreadcrumb: BreadcrumbItem = {
    title: 'Home',
    href: '/dashboard',
};

const segmentTitleMap: Record<string, string> = {
    admin: 'Admin',
    courses: 'Courses',
    challenges: 'Challenges',
    leaderboard: 'Leaderboard',
    labs: 'Labs',
    settings: 'Settings',
    profile: 'Profile',
    security: 'Security',
    appearance: 'Appearance',
    dashboard: 'Dashboard',
};

function toTitleCase(segment: string): string {
    if (/^\d+$/.test(segment)) {
        return `#${segment}`;
    }

    return segment
        .replace(/[-_]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toTitle(segment: string): string {
    return segmentTitleMap[segment] ?? toTitleCase(segment);
}

export function buildBreadcrumbsFromUrl(pageUrl: string): BreadcrumbItem[] {
    const pathname = new URL(pageUrl, 'http://localhost').pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
        return [{ title: 'Dashboard', href: '/dashboard' }];
    }

    let currentPath = '';

    return segments.map((segment) => {
        currentPath += `/${segment}`;

        return {
            title: toTitle(decodeURIComponent(segment)),
            href: currentPath,
        };
    });
}

export function withHomeBreadcrumb(
    breadcrumbs: BreadcrumbItem[],
): BreadcrumbItem[] {
    if (breadcrumbs.length === 0) {
        return [homeBreadcrumb];
    }

    const isHomeItem = (item: BreadcrumbItem): boolean => {
        const href = toUrl(item.href).split('?')[0];
        const title = item.title.trim().toLowerCase();

        return title === 'home' || href === '/dashboard' || href === '/';
    };

    const withHome = isHomeItem(breadcrumbs[0])
        ? breadcrumbs
        : [homeBreadcrumb, ...breadcrumbs];

    const deduped = [withHome[0]];

    for (let index = 1; index < withHome.length; index++) {
        if (isHomeItem(withHome[index]) && isHomeItem(deduped[0])) {
            continue;
        }

        deduped.push(withHome[index]);
    }

    return deduped;
}
