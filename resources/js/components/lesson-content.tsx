import { useMemo } from 'react';
import { parseContentWithChecks } from '@/lib/content-parser';
import { InlineKnowledgeCheck } from '@/components/inline-knowledge-check';
import { MarkdownRenderer } from '@/components/markdown-renderer';

type LessonContentProps = {
    content: string;
    className?: string;
};

/**
 * Renders lesson Markdown content with embedded inline knowledge checks.
 * Parses :::check blocks and renders them as interactive InlineKnowledgeCheck components
 * interspersed with rendered Markdown content.
 */
export function LessonContent({ content, className }: LessonContentProps) {
    const segments = useMemo(() => parseContentWithChecks(content), [content]);

    if (segments.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            {segments.map((segment, index) => {
                if (segment.type === 'markdown') {
                    return (
                        <MarkdownRenderer
                            key={`md-${index}`}
                            content={segment.content}
                            className="prose-sm"
                        />
                    );
                }

                return (
                    <InlineKnowledgeCheck
                        key={`check-${index}`}
                        question={segment.question}
                        type={segment.checkType}
                        options={segment.options}
                        answer={segment.answer}
                        hint={segment.hint}
                    />
                );
            })}
        </div>
    );
}
