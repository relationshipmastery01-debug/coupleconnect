'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Habit } from '@/lib/supabase';
import styles from './habits.module.css';

const HABIT_TYPES = [
    { type: 'sex', label: 'Intimacy/Sex', icon: '💕', goal: 1, weekly: true },
    { type: 'talk', label: 'Honest Talk', icon: '💬', goal: 1, weekly: true },
    { type: 'date', label: 'Date Day', icon: '🌹', goal: 1, weekly: true },
    { type: 'prayer', label: 'Prayer Together', icon: '🙏', goal: 3, weekly: false },
    { type: 'family_time', label: 'Family Time', icon: '👨‍👩‍👧‍👦', goal: 1, weekly: true, optional: true },
    { type: 'family_prayer', label: 'Family Prayer', icon: '🙏👨‍👩‍👧', goal: 1, weekly: true, optional: true },
];

export default function HabitsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            await loadHabits(profileData.relationship_id);
        }
        setLoading(false);
    };

    const loadHabits = async (relationshipId: string) => {
        // Get current week start (Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekStartStr = weekStart.toISOString().split('T')[0];

        // Load or create habits for this week
        const { data: existingHabits } = await supabase
            .from('habits')
            .select('*')
            .eq('relationship_id', relationshipId)
            .eq('week_start_date', weekStartStr);

        if (existingHabits && existingHabits.length > 0) {
            setHabits(existingHabits);
        } else {
            // Create habits for this week
            const newHabits = HABIT_TYPES.map(ht => ({
                relationship_id: relationshipId,
                type: ht.type as Habit['type'],
                frequency_goal: ht.goal,
                week_start_date: weekStartStr,
                completions: 0,
            }));

            const { data } = await supabase
                .from('habits')
                .insert(newHabits)
                .select();

            setHabits(data || []);
        }
    };

    const incrementHabit = async (habitId: string, currentCount: number, goal: number) => {
        if (currentCount >= goal) return;

        const { data } = await supabase
            .from('habits')
            .update({ completions: currentCount + 1 })
            .eq('id', habitId)
            .select()
            .single();

        if (data) {
            setHabits((prev: Habit[]) => prev.map((h: Habit) => h.id === habitId ? (data as Habit) : h));
        }
    };

    const decrementHabit = async (habitId: string, currentCount: number) => {
        if (currentCount <= 0) return;

        const { data } = await supabase
            .from('habits')
            .update({ completions: currentCount - 1 })
            .eq('id', habitId)
            .select()
            .single();

        if (data) {
            setHabits((prev: Habit[]) => prev.map((h: Habit) => h.id === habitId ? (data as Habit) : h));
        }
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Weekly Habits</h1>
                    <p className={styles.subtitle}>Track your relationship rituals and commitment</p>
                </div>
                <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
                    Back to Dashboard
                </button>
            </div>

            <div className={styles.habitsList}>
                {HABIT_TYPES.map((habitType) => {
                    const habit = habits.find(h => h.type === habitType.type);
                    if (!habit) return null;

                    const isComplete = habit.completions >= habit.frequency_goal;
                    const percentage = Math.min(100, (habit.completions / habit.frequency_goal) * 100);

                    return (
                        <div key={habit.id} className={`${styles.habitCard} ${isComplete ? styles.complete : ''}`}>
                            <div className={styles.habitIcon}>{habitType.icon}</div>
                            <div className={styles.habitInfo}>
                                <div className={styles.habitLabel}>{habitType.label}</div>
                                <div className={styles.habitProgress}>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
                                    </div>
                                    <div className={styles.progressText}>
                                        {habit.completions} / {habit.frequency_goal} {habitType.weekly ? 'this week' : '× per week'}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.habitActions}>
                                <button
                                    onClick={() => decrementHabit(habit.id, habit.completions)}
                                    className={styles.btnCounter}
                                    disabled={habit.completions === 0}
                                >
                                    −
                                </button>
                                <span className={styles.count}>{habit.completions}</span>
                                <button
                                    onClick={() => incrementHabit(habit.id, habit.completions, habit.frequency_goal)}
                                    className={styles.btnCounter}
                                    disabled={isComplete}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.summary}>
                <h2>This Week&apos;s Progress</h2>
                <div className={styles.summaryStats}>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>
                            {habits.filter(h => h.completions >= h.frequency_goal).length} / {habits.length}
                        </div>
                        <div className={styles.statLabel}>Habits Completed</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>
                            {Math.round(
                                (habits.reduce((acc, h) => acc + (h.completions / h.frequency_goal), 0) / habits.length) * 100
                            )}%
                        </div>
                        <div className={styles.statLabel}>Overall Completion</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
