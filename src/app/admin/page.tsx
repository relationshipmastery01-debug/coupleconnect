'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Relationship } from '@/lib/supabase';
import styles from './admin.module.css';

type Couple = Relationship & { profiles: Profile[] };

export default function AdminPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [couples, setCouples] = useState<Couple[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [showPairForm, setShowPairForm] = useState(false);
    const [pairData, setPairData] = useState({ user1: '', user2: '' });
    const [selectedCouple, setSelectedCouple] = useState<string | null>(null);

    const [feedback, setFeedback] = useState<any[]>([]);

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

        if (profileData?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        setProfile(profileData);
        await loadCouples();
        await loadUsers();
        await loadFeedback();
    };

    const loadFeedback = async () => {
        const { data } = await supabase
            .from('feedback')
            .select(`
                *,
                profiles (full_name, email)
            `)
            .order('created_at', { ascending: false });

        setFeedback(data || []);
    };

    const loadCouples = async () => {
        const { data } = await supabase
            .from('relationships')
            .select('*');

        if (!data) return;

        const couplesWithProfiles = await Promise.all(
            data.map(async (rel: Relationship) => {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('relationship_id', rel.id);

                return { ...rel, profiles: profiles || [] };
            })
        );

        setCouples(couplesWithProfiles);
    };

    const loadUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'partner')
            .is('relationship_id', null);

        setUsers(data || []);
    };

    const createPair = async () => {
        if (!pairData.user1 || !pairData.user2) return;

        // Create relationship
        const { data: rel } = await supabase
            .from('relationships')
            .insert({
                connection_score: 50,
                commitment_score: 50,
                communication_score: 50,
            })
            .select()
            .single();

        if (!rel) return;

        // Update both users
        await supabase
            .from('profiles')
            .update({ relationship_id: rel.id })
            .in('id', [pairData.user1, pairData.user2]);

        setPairData({ user1: '', user2: '' });
        setShowPairForm(false);
        loadCouples();
        loadUsers();
    };

    const viewCoupleDetails = (relationshipId: string) => {
        setSelectedCouple(selectedCouple === relationshipId ? null : relationshipId);
    };

    const resetPassword = async (userId: string, email: string) => {
        // In production, use Supabase's password reset flow
        alert(`Password reset link would be sent to ${email}`);
    };

    const deletePair = async (relationshipId: string) => {
        if (!confirm('Are you sure you want to unpair this couple?')) return;

        // Remove relationship_id from users
        await supabase
            .from('profiles')
            .update({ relationship_id: null })
            .eq('relationship_id', relationshipId);

        // Delete relationship
        await supabase
            .from('relationships')
            .delete()
            .eq('id', relationshipId);

        loadCouples();
        loadUsers();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p className={styles.subtitle}>Manage couples and monitor relationships</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={() => setShowPairForm(!showPairForm)} className="btn btn-primary">
                        {showPairForm ? 'Cancel' : '+ Pair Couple'}
                    </button>
                    <button onClick={() => {
                        supabase.auth.signOut();
                        router.push('/');
                    }} className="btn btn-secondary">
                        Sign Out
                    </button>
                </div>
            </div>

            {showPairForm && (
                <div className={styles.formCard}>
                    <h2>Pair New Couple</h2>
                    <div className={styles.pairForm}>
                        <div className="form-group">
                            <label>Partner 1</label>
                            <select
                                value={pairData.user1}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setPairData({ ...pairData, user1: e.target.value })}
                            >
                                <option value="">Select user...</option>
                                {users.filter((u: Profile) => u.id !== pairData.user2).map((u: Profile) => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Partner 2</label>
                            <select
                                value={pairData.user2}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setPairData({ ...pairData, user2: e.target.value })}
                            >
                                <option value="">Select user...</option>
                                {users.filter((u: Profile) => u.id !== pairData.user1).map((u: Profile) => (
                                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={createPair} className="btn btn-primary">Create Pair</button>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h2>User Feedback ({feedback.length})</h2>
                {feedback.length === 0 ? (
                    <div className={styles.empty}>No feedback yet.</div>
                ) : (
                    <div className={styles.couplesList}>
                        {feedback.map((item) => (
                            <div key={item.id} className={styles.coupleCard} style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong>{item.profiles?.full_name || 'Anonymous'}</strong>
                                    <span style={{ color: '#ffd700' }}>{'★'.repeat(item.rating)}</span>
                                </div>
                                <p style={{ margin: '10px 0', lineHeight: '1.5', color: '#eee' }}>"{item.content}"</p>
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                    {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h2>All Couples ({couples.length})</h2>
                <div className={styles.couplesList}>
                    {couples.map((couple: Couple) => (
                        <div key={couple.id} className={styles.coupleCard}>
                            <div className={styles.coupleHeader}>
                                <div className={styles.coupleNames}>
                                    {couple.profiles?.map((p: Profile) => p.full_name).join(' & ') || 'Unnamed Couple'}
                                </div>
                                <div className={styles.coupleActions}>
                                    <button onClick={() => viewCoupleDetails(couple.id)} className="btn btn-secondary">
                                        {selectedCouple === couple.id ? 'Hide Details' : 'View Details'}
                                    </button>
                                    <button onClick={() => deletePair(couple.id)} className={styles.deleteBtn}>
                                        Unpair
                                    </button>
                                </div>
                            </div>

                            <div className={styles.scores}>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreValue}>{couple.connection_score}</div>
                                    <div className={styles.scoreLabel}>Connection</div>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreValue}>{couple.commitment_score}</div>
                                    <div className={styles.scoreLabel}>Commitment</div>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreValue}>{couple.communication_score}</div>
                                    <div className={styles.scoreLabel}>Communication</div>
                                </div>
                            </div>

                            {selectedCouple === couple.id && (
                                <div className={styles.details}>
                                    <h3>Partners</h3>
                                    {couple.profiles?.map((p: Profile) => (
                                        <div key={p.id} className={styles.partnerRow}>
                                            <div>
                                                <strong>{p.full_name}</strong>
                                                <br />
                                                <span className={styles.email}>{p.email}</span>
                                            </div>
                                            <button onClick={() => resetPassword(p.id, p.email)} className="btn btn-secondary">
                                                Reset Password
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h2>Unpaired Users ({users.length})</h2>
                {users.length === 0 ? (
                    <div className={styles.empty}>All users are paired!</div>
                ) : (
                    <div className={styles.usersList}>
                        {users.map((user: Profile) => (
                            <div key={user.id} className={styles.userCard}>
                                <div>
                                    <strong>{user.full_name}</strong>
                                    <br />
                                    <span className={styles.email}>{user.email}</span>
                                </div>
                                <button onClick={() => resetPassword(user.id, user.email)} className="btn btn-secondary">
                                    Reset Password
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
