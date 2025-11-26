'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './feedback.module.css';

export default function FeedbackPage() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || rating === 0) return;

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user.id,
                    content: content,
                    rating: rating
                });

            if (!error) {
                setSubmitted(true);
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className={styles.container}>
                <div className={styles.successMessage}>
                    <span className={styles.successIcon}>🎉</span>
                    <h2>Thank You!</h2>
                    <p>Your feedback helps us make CoupleConnect better for everyone.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className={`${styles.submitBtn} ${styles.backBtn}`}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Share Your Feedback</h1>
                <p className={styles.subtitle}>Tell us what you love or what we can improve.</p>
            </div>

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>How would you rate your experience?</label>
                        <div className={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`${styles.starBtn} ${rating >= star ? styles.starActive : ''}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Your Thoughts</label>
                        <textarea
                            className={styles.textarea}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="I really wish the app could..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading || !content.trim() || rating === 0}
                    >
                        {loading ? 'Sending...' : 'Submit Feedback'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className={`${styles.submitBtn} ${styles.backBtn}`}
                        style={{ marginTop: '10px' }}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}
