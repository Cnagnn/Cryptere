import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { useEffect, useMemo, useRef } from 'react';

type PlayerSource =
    | { kind: 'youtube' | 'vimeo'; embedId: string }
    | { kind: 'file'; src: string }
    | { kind: 'unsupported' };

function resolvePlayerSource(url: string): PlayerSource {
    try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.toLowerCase();

        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            const youtubeId =
                parsedUrl.searchParams.get('v') ??
                parsedUrl.pathname.split('/').filter(Boolean).pop();

            if (youtubeId) {
                return { kind: 'youtube', embedId: youtubeId };
            }
        }

        if (host.includes('vimeo.com')) {
            const vimeoId = parsedUrl.pathname.split('/').filter(Boolean).pop();

            if (vimeoId) {
                return { kind: 'vimeo', embedId: vimeoId };
            }
        }

        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            return { kind: 'file', src: url };
        }

        return { kind: 'unsupported' };
    } catch {
        return { kind: 'unsupported' };
    }
}

export function VideoPlayer({
    url,
    onEnded,
}: {
    url: string;
    onEnded?: () => void;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const onEndedRef = useRef(onEnded);
    const source = useMemo(() => resolvePlayerSource(url), [url]);

    useEffect(() => {
        onEndedRef.current = onEnded;
    }, [onEnded]);

    useEffect(() => {
        if (!containerRef.current || source.kind === 'unsupported') {
            return;
        }

        const targetElement = containerRef.current.querySelector('[data-plyr-player]');

        if (!targetElement) {
            return;
        }

        const player = new Plyr(targetElement as HTMLElement, {
            controls: [
                'play-large',
                'play',
                'progress',
                'current-time',
                'mute',
                'volume',
                'settings',
                'pip',
                'airplay',
                'fullscreen',
            ],
            ratio: '16:9',
            youtube: {
                noCookie: true,
                controls: 0,
                disablekb: 1,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3,
                playsinline: 1,
            },
            vimeo: {
                byline: false,
                portrait: false,
                title: false,
            },
        });

        player.on('ended', () => {
            onEndedRef.current?.();
        });

        return () => {
            player.destroy();
        };
    }, [source]);

    if (source.kind !== 'unsupported') {
        return (
            <div ref={containerRef} className="overflow-hidden rounded-xl border bg-black">
                <div className="aspect-video w-full">
                    {source.kind === 'file' ? (
                        <video data-plyr-player controls className="h-full w-full">
                            <source src={source.src} />
                            Your browser does not support this video element.
                        </video>
                    ) : (
                        <div
                            data-plyr-player
                            data-plyr-provider={source.kind}
                            data-plyr-embed-id={source.embedId}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border bg-black">
            <div className="flex aspect-video w-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Video URL is not supported or invalid. Please update the task video link in admin.
            </div>
        </div>
    );
}
