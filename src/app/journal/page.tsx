'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Journal } from '@/lib/supabase';
import { analyzeSentiment } from '@/lib/interpreter';
import styles from './journal.module.css';

export default function JournalPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [journals, setJournals] = useState<Journal[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        content: '',
        is_shared: false,
    });

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

        if (profileData) {
            await loadJournals(profileData.id, profileData.relationship_id);
        }
    };

    const loadJournals = async (userId: string, relationshipId?: string) => {
        if (!relationshipId) return;

        // Load own journals + partner's shared journals
        const { data } = await supabase
            .from('journals')
            .select('*, profiles(full_name)')
            .eq('relationship_id', relationshipId)
            .or(`user_id.eq.${userId},is_shared.eq.true`)
            .order('created_at', { ascending: false });

        setJournals(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.relationship_id) return;

        const sentimentScore = analyzeSentiment(formData.content);

        await supabase.from('journals').insert({
            user_id: profile.id,
            relationship_id: profile.relationship_id,
            content: formData.content,
            is_shared: formData.is_shared,
            sentiment_score: sentimentScore,
        });

        setFormData({ content: '', is_shared: false });
        setShowForm(false);
        loadJournals(profile.id, profile.relationship_id);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Emotion Journal</h1>
                    <p className={styles.subtitle}>Reflect on your feelings and share with your partner</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? 'Cancel' : '+ New Entry'}
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
                        Back
                    </button>
                </div>
            </div>

            {showForm && (
                <div className={styles.formCard}>
                    <h2>New Journal Entry</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>How are you feeling?</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                rows={8}
                                placeholder="Write about your thoughts, feelings, or experiences..."
                            />
                        </div>

                        <div className={styles.checkboxGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_shared}
                                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                                />
                                <span>Share with partner</span>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary">Save Entry</button>
                    </form>
                </div>
            )}

            <div className={styles.journalsList}>
                {journals.length === 0 ? (
                    <div className={styles.empty}>No journal entries yet. Start writing!</div>
                ) : (
                    journals.map((entry: any) => {
                        const isOwn = entry.user_id === profile?.id;
                        return (
                            <div key={entry.id} className={styles.journalCard}>
                                <div className={styles.journalHeader}>
                                    <div className={styles.journalAuthor}>
                                        {entry.profiles?.full_name}
                                        {!isOwn && <span className={styles.sharedBadge}>Shared with you</span>}
                                        {isOwn && !entry.is_shared && <span className={styles.privateBadge}>Private</span>}
                                    </div>
                                    <div className={styles.journalDate}>
                                        {new Date(entry.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={styles.journalContent}>{entry.content}</div>
                                <div className={styles.journalFooter}>
                                    <div className={styles.sentiment}>
                                        Sentiment: {entry.sentiment_score}/10
                                        <div className={styles.sentimentBar}>
                                            <div
                                                className={styles.sentimentFill}
                                                style={{ width: `${entry.sentiment_score * 10}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
