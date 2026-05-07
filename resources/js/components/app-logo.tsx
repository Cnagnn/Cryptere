import { cn } from '@/lib/utils';

type AppLogoProps = {
    className?: string;
    imageClassName?: string;
};

export default function AppLogo({ className, imageClassName }: AppLogoProps) {
    return (
        <div className={cn('flex items-center', className)}>
            <img
                src="/images/Logo/Logomark-Black.svg"
                alt="Cryptere"
                className={cn('h-8 w-auto dark:hidden', imageClassName)}
            />
            <img
                src="/images/Logo/Logomark.svg"
                alt="Cryptere"
                className={cn('hidden h-8 w-auto dark:block', imageClassName)}
            />
        </div>
    );
}
