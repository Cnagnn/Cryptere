import { useCallback, useRef } from 'react';
import type { HTMLAttributes } from 'react';

/**
 * Cryptere wordmark logo (icon + "Cryptere" text).
 *
 * Pakai aset SVG asli dari /public/images/Logo/ — Logomark.svg (white, dark
 * theme) dan Logomark-Black.svg (blue, light theme). Dual <img> di-toggle
 * via Tailwind dark: variant supaya theme switching instant tanpa flash.
 *
 * Anti-context-menu & anti-drag dipasang via ref-based listener (bukan
 * inline handler) supaya CSP nonce-based script-src tidak block.
 */
export default function AppLogo({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const ref = useRef<HTMLDivElement>(null);

    const block = useCallback((e: Event) => e.preventDefault(), []);

    const setRef = useCallback(
        (el: HTMLDivElement | null) => {
            const prev = ref.current;

            if (prev) {
                prev.removeEventListener('contextmenu', block);
                prev.removeEventListener('dragstart', block);
            }

            if (el) {
                el.addEventListener('contextmenu', block);
                el.addEventListener('dragstart', block);
            }

            ref.current = el;
        },
        [block],
    );

    return (
        <div
            {...props}
            ref={setRef}
            role="img"
            aria-label="Cryptere"
            className={`inline-flex items-center ${className}`}
        >
            <img
                src="/images/Logo/Logomark-Black.svg"
                alt="Cryptere"
                draggable={false}
                className="block h-full w-auto select-none dark:hidden"
            />
            <img
                src="/images/Logo/Logomark.svg"
                alt="Cryptere"
                draggable={false}
                className="hidden h-full w-auto select-none dark:block"
            />
        </div>
    );
}
