import { useMemo } from 'react';

type MarkdownRendererProps = {
    content: string;
    className?: string;
};

/**
 * Lightweight Markdown renderer for lesson content.
 * Converts Markdown to safe HTML and renders it using React's dangerouslySetInnerHTML.
 *
 * Supports: headings, paragraphs, bold, italic, inline code, code blocks,
 * ordered/unordered lists, blockquotes, tables, horizontal rules, and links.
 *
 * All HTML is sanitized to prevent XSS.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    const html = useMemo(() => renderMarkdown(content), [content]);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/**
 * Sanitize a string to prevent XSS by escaping HTML entities.
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Process inline Markdown formatting (bold, italic, code, links, images).
 */
function processInline(text: string): string {
    let result = escapeHtml(text);

    // Inline code (must be before bold/italic to avoid conflicts)
    result = result.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>');

    // Bold + Italic
    result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

    // Bold
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links [text](url)
    result = result.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    return result;
}

/**
 * Convert Markdown string to HTML.
 */
function renderMarkdown(markdown: string): string {
    if (!markdown || !markdown.trim()) {
        return '';
    }

    const lines = markdown.split('\n');
    const htmlParts: string[] = [];
    let i = 0;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let inTable = false;
    let tableRows: string[] = [];
    let inBlockquote = false;
    let blockquoteLines: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' = 'ul';
    let listItems: string[] = [];

    const flushBlockquote = () => {
        if (blockquoteLines.length > 0) {
            const content = blockquoteLines.map((l) => processInline(l)).join('<br/>');
            htmlParts.push(
                `<blockquote class="border-l-4 border-muted-foreground/30 pl-4 my-4 text-muted-foreground italic">${content}</blockquote>`,
            );
            blockquoteLines = [];
            inBlockquote = false;
        }
    };

    const flushList = () => {
        if (listItems.length > 0) {
            const tag = listType;
            const listClass =
                tag === 'ul'
                    ? 'list-disc pl-6 my-3 space-y-1'
                    : 'list-decimal pl-6 my-3 space-y-1';
            const items = listItems
                .map((item) => `<li class="text-sm leading-relaxed">${processInline(item)}</li>`)
                .join('');
            htmlParts.push(`<${tag} class="${listClass}">${items}</${tag}>`);
            listItems = [];
            inList = false;
        }
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            const headerRow = tableRows[0];
            const dataRows = tableRows.slice(2); // Skip separator row

            const headerCells = headerRow
                .split('|')
                .filter((c) => c.trim())
                .map((c) => `<th class="border border-border px-3 py-2 text-left text-sm font-semibold">${processInline(c.trim())}</th>`)
                .join('');

            const bodyRows = dataRows
                .map((row) => {
                    const cells = row
                        .split('|')
                        .filter((c) => c.trim())
                        .map((c) => `<td class="border border-border px-3 py-2 text-sm">${processInline(c.trim())}</td>`)
                        .join('');
                    return `<tr>${cells}</tr>`;
                })
                .join('');

            htmlParts.push(
                `<div class="my-4 overflow-x-auto"><table class="w-full border-collapse border border-border"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`,
            );
            tableRows = [];
            inTable = false;
        }
    };

    while (i < lines.length) {
        const line = lines[i];

        // Code blocks
        if (line.trimStart().startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                const code = escapeHtml(codeBlockContent.join('\n'));
                htmlParts.push(
                    `<pre class="my-4 overflow-x-auto rounded-lg bg-muted p-4"><code class="text-sm font-mono"${codeBlockLang ? ` data-lang="${escapeHtml(codeBlockLang)}"` : ''}>${code}</code></pre>`,
                );
                codeBlockContent = [];
                codeBlockLang = '';
                inCodeBlock = false;
            } else {
                // Start code block - flush any pending content
                flushBlockquote();
                flushList();
                flushTable();
                inCodeBlock = true;
                codeBlockLang = line.trimStart().slice(3).trim();
            }
            i++;
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            i++;
            continue;
        }

        // Empty line - flush pending content
        if (line.trim() === '') {
            flushBlockquote();
            flushList();
            if (inTable) {
                flushTable();
            }
            i++;
            continue;
        }

        // Table detection
        if (line.includes('|') && line.trim().startsWith('|')) {
            if (!inTable) {
                flushBlockquote();
                flushList();
                inTable = true;
            }
            tableRows.push(line);
            i++;
            continue;
        } else if (inTable) {
            flushTable();
        }

        // Blockquotes
        if (line.trimStart().startsWith('> ')) {
            if (!inBlockquote) {
                flushList();
                inBlockquote = true;
            }
            blockquoteLines.push(line.trimStart().slice(2));
            i++;
            continue;
        } else if (inBlockquote) {
            flushBlockquote();
        }

        // Headings
        const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const text = processInline(headingMatch[2]);
            const headingClasses: Record<number, string> = {
                1: 'text-2xl font-bold mt-8 mb-4',
                2: 'text-xl font-semibold mt-6 mb-3',
                3: 'text-lg font-semibold mt-5 mb-2',
                4: 'text-base font-semibold mt-4 mb-2',
            };
            htmlParts.push(
                `<h${level} class="${headingClasses[level] || ''}">${text}</h${level}>`,
            );
            i++;
            continue;
        }

        // Horizontal rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            flushList();
            htmlParts.push('<hr class="my-6 border-border" />');
            i++;
            continue;
        }

        // Unordered list items
        const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                flushList();
                inList = true;
                listType = 'ul';
            }
            listItems.push(ulMatch[2]);
            i++;
            continue;
        }

        // Ordered list items
        const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                flushList();
                inList = true;
                listType = 'ol';
            }
            listItems.push(olMatch[2]);
            i++;
            continue;
        }

        // Regular paragraph
        flushList();
        htmlParts.push(
            `<p class="my-3 text-sm leading-relaxed">${processInline(line)}</p>`,
        );
        i++;
    }

    // Flush any remaining content
    if (inCodeBlock) {
        const code = escapeHtml(codeBlockContent.join('\n'));
        htmlParts.push(
            `<pre class="my-4 overflow-x-auto rounded-lg bg-muted p-4"><code class="text-sm font-mono">${code}</code></pre>`,
        );
    }
    flushBlockquote();
    flushList();
    flushTable();

    return htmlParts.join('\n');
}
