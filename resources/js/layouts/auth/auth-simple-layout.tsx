import { SkipToContent } from '@/components/accessibility';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppUrls } from '@/hooks/use-app-urls';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const urls = useAppUrls();

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <SkipToContent targetId="auth-content" />
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <a
                            href={urls.public}
                            className="flex flex-col items-center gap-2 font-medium"
                            aria-label="Go to homepage"
                        >
                            <div className="mb-1 flex size-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-foreground dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </a>

                        <div className="flex flex-col gap-2 text-center">
                            <h1 className="text-xl font-semibold">{title}</h1>
                            <p className="text-center text-sm/6 text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div
                        id="auth-content"
                        tabIndex={-1}
                        className="outline-none"
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
