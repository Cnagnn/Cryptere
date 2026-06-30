/**
 * VisualizerShell — shared 2-panel layout for all algorithm visualizers.
 * Left: stage (diagram/SVG/matrix). Right: detail panel (metadata, step data).
 */
import type { ReactNode } from 'react';

import FadeIn from '@/components/fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
    step: number;
    stage: ReactNode;
    detail: ReactNode;
    caption?: ReactNode;
}

export default function VisualizerShell({
    step,
    stage,
    detail,
    caption,
}: Props) {
    return (
        <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-[420px] flex-col gap-3 lg:min-h-0">
                {caption && (
                    <FadeIn flushKey={`cap-${step}`} y={0} duration={0.15}>
                        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-relaxed">
                            {caption}
                        </div>
                    </FadeIn>
                )}
                <FadeIn
                    flushKey={`stage-${step}`}
                    y={6}
                    duration={0.2}
                    className="flex flex-1 items-center justify-center overflow-hidden rounded-xl border bg-muted/10 p-4"
                >
                    {stage}
                </FadeIn>
            </div>
            <Card className="flex min-h-0 flex-col overflow-hidden rounded-xl">
                <CardHeader className="border-b py-3">
                    <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Detail
                    </CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">
                    <ScrollArea className="h-full">
                        <FadeIn
                            flushKey={`det-${step}`}
                            y={4}
                            duration={0.15}
                            className="p-3"
                        >
                            {detail}
                        </FadeIn>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
