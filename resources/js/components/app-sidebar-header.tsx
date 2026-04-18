import { usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';
import type { Auth } from '@/types/auth';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

export function AppSidebarHeader({ breadcrumbs = [] }: Props) {
    const { url, props } = usePage<{ auth: Auth }>();
    const isAdmin = props.auth.user.is_admin || props.auth.user.role === 'admin';

    const showCreateTopicButton = isAdmin && /^\/courses\/[^/?#]+/.test(url);

    const handleCreateTopic = () => {
        window.dispatchEvent(new CustomEvent('course-topic:create'));
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    {breadcrumbs.length > 0 ? (
                        <div className="min-w-0 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_span[aria-current='page']]:truncate">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    ) : null}
                </div>

                {showCreateTopicButton ? (
                    <div className="flex items-center gap-3">
                        <Button type="button" size="sm" onClick={handleCreateTopic}>
                            <Plus data-icon="inline-start" />
                            Create Topic
                        </Button>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
