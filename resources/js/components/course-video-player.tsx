import { Loader2, TriangleAlert } from 'lucide-react';
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

type VideoProcessingStatus =
    | 'pending'
    | 'processing'
    | 'ready'
    | 'converted'
    | 'failed'
    | null;

export function VideoPlayer({
    url,
    processingStatus,
    onEnded,
}: {
    url: string;
    processingStatus?: VideoProcessingStatus;
    onEnded?: () => void;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const onEndedRef = useRef(onEnded);
    const source = useMemo(() => resolvePlayerSource(url), [url]);

    useEffect(() => {
        onEndedRef.current = onEnded;
    }, [onEnded]);

    // Show processing indicator
    if (processingStatus === 'pending' || processingStatus === 'processing') {
        return (
            <div className="overflow-hidden rounded-xl border bg-black">
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                        {processingStatus === 'pending'
                            ? 'Video sedang dalam antrian untuk diproses...'
                            : 'Video sedang dikonversi...'}
                    </div>
                    <div className="text-xs text-muted-foreground/60">
                        Ini mungkin memakan waktu beberapa menit. Halaman akan
                        diperbarui secara otomatis saat siap.
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (processingStatus === 'failed') {
        return (
            <div className="overflow-hidden rounded-xl border bg-black">
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <TriangleAlert className="size-8 text-destructive" />
                    <div className="text-sm text-destructive">
                        Pemrosesan video gagal
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Silakan coba unggah ulang video atau hubungi
                        administrator.
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (!containerRef.current || source.kind === 'unsupported') {
            return;
        }

        const targetElement =
            containerRef.current.querySelector('[data-plyr-player]');

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
            <div
                ref={containerRef}
                className="overflow-hidden rounded-xl border bg-black"
            >
                <div className="aspect-video w-full">
                    {source.kind === 'file' ? (
                        <video
                            data-plyr-player
                            controls
                            className="h-full w-full"
                        >
                            <source src={source.src} />
                            Browser Anda tidak mendukung elemen video ini.
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
                URL video tidak didukung atau tidak valid. Silakan perbarui
                tautan video tugas di admin.
            </div>
        </div>
    );
}
