import { useMemo } from 'react';

export function VideoPlayer({ url }: { url: string }) {
    const embedUrl = useMemo(() => {
        try {
            const urlObj = new URL(url);

            if (
                urlObj.hostname.includes('youtube.com') ||
                urlObj.hostname.includes('youtu.be')
            ) {
                const videoId =
                    urlObj.searchParams.get('v') ||
                    urlObj.pathname.split('/').pop();

                return videoId
                    ? `https://www.youtube.com/embed/${videoId}?rel=0`
                    : null;
            }

            if (urlObj.hostname.includes('vimeo.com')) {
                const videoId = urlObj.pathname.split('/').pop();

                return videoId
                    ? `https://player.vimeo.com/video/${videoId}`
                    : null;
            }

            return null;
        } catch {
            return null;
        }
    }, [url]);

    if (embedUrl) {
        return (
            <div className="overflow-hidden rounded-xl border bg-black">
                <iframe
                    src={embedUrl}
                    className="aspect-video w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border bg-black">
            <video controls preload="metadata" className="aspect-video w-full">
                <source src={url} />
                Your browser does not support this video element.
            </video>
        </div>
    );
}
