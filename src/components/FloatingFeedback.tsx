'use client';

import { useRouter, usePathname } from 'next/navigation';
import styles from './FloatingFeedback.module.css';

export default function FloatingFeedback() {
    const router = useRouter();
    const pathname = usePathname();

    // Don't show on login page or feedback page itself
    if (pathname === '/' || pathname === '/feedback') return null;

    return (
        <button
            className={styles.floatingBtn}
            onClick={() => router.push('/feedback')}
            aria-label="Give Feedback"
        >
            💭
            <span className={styles.tooltip}>Give Feedback</span>
        </button>
    );
}
