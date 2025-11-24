'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Message, MessageAnalysis } from '@/lib/supabase';
import { analyzeMessage, AnalysisResult } from '@/lib/interpreter';
import styles from './messages.module.css';

export default function MessagesPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<(Message & { profiles: { full_name: string }, message_analysis: MessageAnalysis })[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const subscription = supabase
            .channel('messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                loadMessages();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
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
            await loadMessages();
        }
        setLoading(false);
    };

    const loadMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profileData } = await supabase
            .from('profiles')
            .select('relationship_id')
            .eq('id', user?.id)
            .single();

        if (!profileData?.relationship_id) return;

        const { data } = await supabase
            .from('messages')
            .select('*, message_analysis(*), profiles(full_name)')
            .eq('relationship_id', profileData.relationship_id)
            .order('created_at', { ascending: true });

        setMessages(data || []);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !profile?.relationship_id) return;

        // Analyze message
        const analysis = analyzeMessage(newMessage);
        setCurrentAnalysis(analysis);
        setShowAnalysis(true);
    };

    const confirmSend = async (useRewrite: boolean) => {
        if (!profile?.relationship_id) return;

        const contentToSend = useRewrite ? currentAnalysis.calm_rewrite : newMessage;

        // Insert message
        const { data: msgData } = await supabase
            .from('messages')
            .insert({
                relationship_id: profile.relationship_id,
                sender_id: profile.id,
                content: contentToSend,
            })
            .select()
            .single();

        // Insert analysis
        if (msgData) {
            await supabase.from('message_analysis').insert({
                message_id: msgData.id,
                calm_rewrite: currentAnalysis.calm_rewrite,
                emotional_tone: currentAnalysis.emotional_tone,
                detected_needs: currentAnalysis.detected_needs,
                nvc_rewrite: currentAnalysis.nvc_rewrite,
                guidance: currentAnalysis.guidance,
                conflict_score: currentAnalysis.conflict_score,
                attachment_hints: currentAnalysis.attachment_hints,
            });
        }

        setNewMessage('');
        setShowAnalysis(false);
        setCurrentAnalysis(null);
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Messages</h1>
                <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">Back to Dashboard</button>
            </div>

            <div className={styles.messagesContainer}>
                <div className={styles.messagesList}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${msg.sender_id === profile?.id ? styles.ownMessage : styles.partnerMessage}`}
                        >
                            <div className={styles.messageSender}>{msg.profiles?.full_name}</div>
                            <div className={styles.messageContent}>{msg.content}</div>
                            <div className={styles.messageTime}>
                                {new Date(msg.created_at).toLocaleString()}
                                {msg.message_analysis && (
                                    <span className={styles.conflictBadge}>
                                        Conflict: {msg.message_analysis.conflict_score}/10
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.inputArea}>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                    />
                    <button onClick={handleSend} className="btn btn-primary">
                        Analyze & Send
                    </button>
                </div>
            </div>

            {showAnalysis && currentAnalysis && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Emotional Analysis</h2>

                        <div className={styles.analysisSection}>
                            <strong>Original Message:</strong>
                            <p>{newMessage}</p>
                        </div>

                        <div className={styles.analysisSection}>
                            <strong>Suggested Calm Rewrite:</strong>
                            <p className={styles.rewrite}>{currentAnalysis.calm_rewrite}</p>
                        </div>

                        <div className={styles.analysisSection}>
                            <strong>Emotional Tone:</strong>
                            <p>{currentAnalysis.emotional_tone}</p>
                        </div>

                        <div className={styles.analysisSection}>
                            <strong>Detected Needs:</strong>
                            <p>{currentAnalysis.detected_needs.join(', ')}</p>
                        </div>

                        <div className={styles.analysisSection}>
                            <strong>NVC Rewrite:</strong>
                            <p className={styles.nvc}>{currentAnalysis.nvc_rewrite}</p>
                        </div>

                        <div className={styles.analysisSection}>
                            <strong>Guidance for Partner:</strong>
                            <p className={styles.guidance}>{currentAnalysis.guidance}</p>
                        </div>

                        <div className={styles.analysisSection}>
                            <strong>Conflict Score:</strong>
                            <div className={styles.conflictScore}>
                                {currentAnalysis.conflict_score}/10
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={() => confirmSend(false)} className="btn btn-secondary">
                                Send Original
                            </button>
                            <button onClick={() => confirmSend(true)} className="btn btn-primary">
                                Send Calm Version
                            </button>
                            <button onClick={() => setShowAnalysis(false)} className="btn btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
