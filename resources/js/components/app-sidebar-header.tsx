import { usePage } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { buildBreadcrumbsFromUrl, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { Auth } from '@/types/auth';

type Props = {
    breadcrumbs?: BreadcrumbItemType[];
};

export function AppSidebarHeader({ breadcrumbs = [] }: Props) {
    const { url } = usePage<{ auth: Auth }>();
    const resolvedBreadcrumbs = withHomeBreadcrumb(
        breadcrumbs.length > 0 ? breadcrumbs : buildBreadcrumbsFromUrl(url),
    );

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    {resolvedBreadcrumbs.length > 1 ? (
                        <Separator
                            orientation="vertical"
                            className="mr-2 h-4"
                        />
                    ) : null}
                    {resolvedBreadcrumbs.length > 1 ? (
                        <div className="min-w-0 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_span[aria-current='page']]:truncate">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {resolvedBreadcrumbs.map((item, index) => {
                                        const isLast =
                                            index ===
                                            resolvedBreadcrumbs.length - 1;
                                        const href =
                                            typeof item.href === 'string'
                                                ? item.href
                                                : item.href?.url;

                                        return (
                                            <Fragment key={href ?? index}>
                                                <BreadcrumbItem>
                                                    {isLast ? (
                                                        <BreadcrumbPage>
                                                            {item.title}
                                                        </BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink
                                                            href={href}
                                                        >
                                                            {item.title}
                                                        </BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>
                                                {!isLast ? (
                                                    <BreadcrumbSeparator />
                                                ) : null}
                                            </Fragment>
                                        );
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
