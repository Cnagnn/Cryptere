/**
 * FadeIn — drop-in replacement for the framer-motion fade/rise pattern.
 *
 * On mount (or when `flushKey` changes) plays a tiny GSAP from-tween
 * on the wrapper div. Mirrors `motion.div initial={{opacity:0,y:N}} animate`
 * without pulling framer-motion in.
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef   } from 'react';
import type {CSSProperties, ReactNode} from 'react';

interface Props {
    children: ReactNode;
    /** Vertical offset to rise from (px). Default 12. */
    y?: number;
    /** Tween duration (s). Default 0.3. */
    duration?: number;
    /** Re-plays the animation when this value changes (mode="wait" replacement). */
    flushKey?: string | number;
    className?: string;
    style?: CSSProperties;
    as?: 'div' | 'section' | 'article' | 'ol' | 'ul' | 'li';
}

export default function FadeIn({
    children,
    y = 12,
    duration = 0.3,
    flushKey,
    className,
    style,
    as: Tag = 'div',
}: Props) {
    const ref = useRef<HTMLElement | null>(null);

    useGSAP(
        () => {
            if (!ref.current) {
                return;
            }

            gsap.from(ref.current, {
                opacity: 0,
                y,
                duration,
                ease: 'power2.out',
            });
        },
        { dependencies: [flushKey], scope: ref },
    );

    return (
        <Tag
            ref={ref as never}
            className={className}
            style={style}
        >
            {children}
        </Tag>
    );
}
