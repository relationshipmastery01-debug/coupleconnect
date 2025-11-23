'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile } from '@/lib/supabase';
import { generateWeeklyInsights } from '@/lib/scores';
import styles from './insights.module.css';

export default function InsightsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/');
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profileData);

        if (profileData?.relationship_id) {
            await loadInsights(profileData.relationship_id);
        }
        setLoading(false);
    };

    const loadInsights = async (relationshipId: string) => {
        // Get latest insights
        const { data } = await supabase
            .from('insights')
            .select('*')
            .eq('relationship_id', relationshipId)
            .order('week_start_date', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setInsights(data.summary_json);
        } else {
            // Generate new insights
            const newInsights = await generateWeeklyInsights(relationshipId);
            setInsights(newInsights);
        }
    };

    const regenerateInsights = async () => {
        if (!profile?.relationship_id) return;
        setLoading(true);
        const newInsights = await generateWeeklyInsights(profile.relationship_id);
        setInsights(newInsights);
        setLoading(false);
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Generating insights...</div></div>;
    }

    if (!insights) {
        return <div className={styles.container}><div className={styles.empty}>No insights available yet.</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Weekly Insights</h1>
                    <p className={styles.subtitle}>Understanding your relationship patterns and growth</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={regenerateInsights} className="btn btn-secondary">
                        Refresh Insights
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
                        Back
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.section}>
                    <h2>📊 Communication Overview</h2>
                    <div className={styles.stats}>
                        <div className={styles.statBox}>
                            <div className={styles.statValue}>{insights.total_messages}</div>
                            <div className={styles.statLabel}>Messages This Week</div>
                        </div>
                        <div className={styles.statBox}>
                            <div className={styles.statValue}>{insights.avg_conflict_score?.toFixed(1) || 0}</div>
                            <div className={styles.statLabel}>Avg Conflict Score</div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>💭 Emotional Patterns</h2>
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Dominant Emotions</div>
                        <div className={styles.emotions}>
                            {insights.dominant_emotions && insights.dominant_emotions.length > 0 ? (
                                insights.dominant_emotions.map((emotion: string, index: number) => (
                                    <span key={index} className={styles.emotionTag}>
                                        {emotion}
                                    </span>
                                ))
                            ) : (
                                <p className={styles.muted}>No emotional data yet</p>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Common Needs</div>
                        <div className={styles.needs}>
                            {insights.common_needs && insights.common_needs.length > 0 ? (
                                insights.common_needs.map((need: string, index: number) => (
                                    <span key={index} className={styles.needTag}>
                                        {need}
                                    </span>
                                ))
                            ) : (
                                <p className={styles.muted}>No needs detected yet</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>✅ Habit Completion</h2>
                    <div className={styles.habitGrid}>
                        {Object.entries(insights.habit_completion || {}).map(([habit, rate]: [string, any]) => (
                            <div key={habit} className={styles.habitBox}>
                                <div className={styles.habitName}>{habit.replace('_', ' ')}</div>
                                <div className={styles.habitRate}>{rate}%</div>
                                <div className={styles.habitBar}>
                                    <div className={styles.habitFill} style={{ width: `${rate}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>💪 Strengths</h2>
                    <div className={styles.list}>
                        {insights.strengths && insights.strengths.length > 0 ? (
                            insights.strengths.map((strength: string, index: number) => (
                                <div key={index} className={styles.listItem}>
                                    <span className={styles.icon}>✓</span>
                                    {strength}
                                </div>
                            ))
                        ) : (
                            <p className={styles.muted}>Keep building your strengths!</p>
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>💡 Suggestions for Growth</h2>
                    <div className={styles.list}>
                        {insights.suggestions && insights.suggestions.length > 0 ? (
                            insights.suggestions.map((suggestion: string, index: number) => (
                                <div key={index} className={styles.listItem}>
                                    <span className={styles.icon}>→</span>
                                    {suggestion}
                                </div>
                            ))
                        ) : (
                            <p className={styles.muted}>You're doing great! Keep it up.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
