'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Relationship } from '@/lib/supabase';
import { calculateRelationshipScores } from '@/lib/scores';
import styles from './dashboard.module.css';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [relationship, setRelationship] = useState<Relationship | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadUserData = async () => {
        try {
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

            if (!profileData) {
                await supabase.auth.signOut();
                router.push('/');
                return;
            }

            setProfile(profileData);

            if (!profileData.relationship_id) {
                alert('You are not yet paired with a partner. Please contact your admin.');
                return;
            }

            // Load relationship data
            const { data: relData } = await supabase
                .from('relationships')
                .select('*')
                .eq('id', profileData.relationship_id)
                .single();

            setRelationship(relData);

            // Recalculate scores
            if (relData) {
                await calculateRelationshipScores(relData.id);

                // Reload updated scores
                const { data: updatedRel } = await supabase
                    .from('relationships')
                    .select('*')
                    .eq('id', profileData.relationship_id)
                    .single();

                setRelationship(updatedRel);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading your relationship space...</div>
            </div>
        );
    }

    if (!relationship) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Welcome, {profile?.full_name}</h1>
                    <button onClick={handleSignOut} className="btn btn-secondary">Sign Out</button>
                </div>
                <div className={styles.noPair}>
                    <h2>Not Yet Paired</h2>
                    <p>Please contact your administrator to be paired with your partner.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Welcome back, {profile?.full_name}</h1>
                    <p className={styles.subtitle}>Your relationship dashboard</p>
                </div>
                <button onClick={handleSignOut} className="btn btn-secondary">Sign Out</button>
            </div>

            <div className={styles.scores}>
                <div className={styles.scoreCard}>
                    <div className="score-circle">
                        <div className="score-value">{relationship.connection_score}</div>
                        <div className="score-label">Connection</div>
                    </div>
                    <p className={styles.scoreDesc}>Measures shared activities and emotional bonding</p>
                </div>

                <div className={styles.scoreCard}>
                    <div className="score-circle">
                        <div className="score-value">{relationship.commitment_score}</div>
                        <div className="score-label">Commitment</div>
                    </div>
                    <p className={styles.scoreDesc}>Reflects consistency and dedication to growth</p>
                </div>

                <div className={styles.scoreCard}>
                    <div className="score-circle">
                        <div className="score-value">{relationship.communication_score}</div>
                        <div className="score-label">Communication</div>
                    </div>
                    <p className={styles.scoreDesc}>Evaluates clarity and emotional translation</p>
                </div>
            </div>

            <div className={styles.quickActions}>
                <h2>Quick Actions</h2>
                <div className={styles.actionGrid}>
                    <Link href="/messages" className={styles.actionCard}>
                        <div className={styles.actionIcon}>💬</div>
                        <div className={styles.actionTitle}>Messages</div>
                        <div className={styles.actionDesc}>Chat with emotional interpreter</div>
                    </Link>

                    <Link href="/habits" className={styles.actionCard}>
                        <div className={styles.actionIcon}>✅</div>
                        <div className={styles.actionTitle}>Weekly Habits</div>
                        <div className={styles.actionDesc}>Track your relationship rituals</div>
                    </Link>

                    <Link href="/planner" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📅</div>
                        <div className={styles.actionTitle}>Shared Planner</div>
                        <div className={styles.actionDesc}>Schedule dates and quality time</div>
                    </Link>

                    <Link href="/journal" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📔</div>
                        <div className={styles.actionTitle}>Journal</div>
                        <div className={styles.actionDesc}>Reflect and share your feelings</div>
                    </Link>

                    <Link href="/insights" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📊</div>
                        <div className={styles.actionTitle}>Insights</div>
                        <div className={styles.actionDesc}>View trends and suggestions</div>
                    </Link>

                    <Link href="/feedback" className={styles.actionCard}>
                        <div className={styles.actionIcon}>💭</div>
                        <div className={styles.actionTitle}>Feedback</div>
                        <div className={styles.actionDesc}>Help us improve</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
