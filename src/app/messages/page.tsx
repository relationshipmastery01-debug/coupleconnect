'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Message, MessageAnalysis } from '@/lib/supabase';
import styles from './messages.module.css';

type RewriteOption = {
    label: string;
    text: string;
    explanation: string[];
};

type AnalysisResult = {
    emotional_tone: string;
    conflict_score: number;
    detected_needs: string[];
    rewrites: RewriteOption[];
    guidance: string;
    attachment_hints: string;
};

export default function MessagesPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<(Message & { profiles: { full_name: string }, message_analysis: MessageAnalysis })[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const submitFeedback = async () => {
        if (!profile || feedbackRating === 0) return;

        const { error } = await supabase.from('feedback').insert({
            user_id: profile.id,
            rating: feedbackRating,
            content: `[Analysis Feedback] ${feedbackText} (Context: ${newMessage.substring(0, 50)}...)`
        });

        if (!error) {
            alert('Thanks for your feedback!');
            setFeedbackRating(0);
            setFeedbackText('');
        } else {
            alert('Failed to save feedback.');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            await loadMessages(profileData.relationship_id);
            subscribeToMessages(profileData.relationship_id);
        }
        setLoading(false);
    };

    const loadMessages = async (relationshipId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*, message_analysis(*), profiles(full_name)')
            .eq('relationship_id', relationshipId)
            .order('created_at', { ascending: true });

        setMessages((data as any) || []);
    };

    const subscribeToMessages = (relationshipId: string) => {
        supabase
            .channel('messages_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `relationship_id=eq.${relationshipId}`
                },
                async (payload) => {
                    // Fetch the full message details including profile
                    const { data } = await supabase
                        .from('messages')
                        .select('*, message_analysis(*), profiles(full_name)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setMessages((prev) => [...prev, data as any]);
                    }
                }
            )
            .subscribe();
    };

    const handleAnalyze = async () => {
        if (!newMessage.trim()) return;
        setAnalyzing(true);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setCurrentAnalysis(data);
            setShowAnalysis(true);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('AI Analysis failed. You can still send the message.');
        } finally {
            setAnalyzing(false);
        }
    };

    const confirmSend = async (textToSend: string, analysisData?: AnalysisResult) => {
        if (!profile?.relationship_id) return;

        // Insert message
        const { data: msgData } = await supabase
            .from('messages')
            .insert({
                relationship_id: profile.relationship_id,
                sender_id: profile.id,
                content: textToSend,
            })
            .select()
            .single();

        // Insert analysis if available
        if (msgData && analysisData) {
            await supabase.from('message_analysis').insert({
                message_id: msgData.id,
                calm_rewrite: analysisData.rewrites[0].text, // Default to first option for storage
                emotional_tone: analysisData.emotional_tone,
                detected_needs: analysisData.detected_needs,
                nvc_rewrite: analysisData.rewrites[1].text, // Store second option as NVC
                guidance: analysisData.guidance,
                conflict_score: analysisData.conflict_score,
                attachment_hints: analysisData.attachment_hints,
            });
        }

        setNewMessage('');
        setShowAnalysis(false);
        setCurrentAnalysis(null);

        // Manually refresh messages to ensure UI updates immediately
        if (profile?.relationship_id) {
            loadMessages(profile.relationship_id);
        }
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
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea}>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                    />
                    <div className={styles.inputActions}>
                        <button
                            onClick={() => confirmSend(newMessage)}
                            className="btn btn-secondary"
                            disabled={!newMessage.trim() || analyzing}
                        >
                            Send As Is
                        </button>
                        <button
                            onClick={handleAnalyze}
                            className="btn btn-primary"
                            disabled={!newMessage.trim() || analyzing}
                        >
                            {analyzing ? 'Analyzing...' : '✨ Analyze & Improve'}
                        </button>
                    </div>
                </div>
            </div>

            {showAnalysis && currentAnalysis && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Choose a Better Way to Say It</h2>
                        <p className={styles.subtitle}>Original: &quot;{newMessage}&quot;</p>

                        <div className={styles.analysisGrid}>
                            <div className={styles.analysisInfo}>
                                <div className={styles.infoItem}>
                                    <strong>Tone:</strong> {currentAnalysis.emotional_tone}
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Conflict Score:</strong> {currentAnalysis.conflict_score}/10
                                </div>
                                <div className={styles.infoItem}>
                                    <strong>Needs:</strong> {currentAnalysis.detected_needs.join(', ')}
                                </div>
                            </div>
                            <div className={styles.guidanceBox}>
                                💡 {currentAnalysis.guidance}
                            </div>
                        </div>

                        <div className={styles.optionsList}>
                            {currentAnalysis.rewrites.map((option, index) => (
                                <div key={index} className={styles.optionCard}>
                                    <div className={styles.optionHeader}>
                                        <h3>{index + 1}. {option.label}</h3>
                                    </div>
                                    <div className={styles.optionText}>
                                        &quot;{option.text}&quot;
                                    </div>
                                    <div className={styles.optionExplanation}>
                                        <strong>Why this works:</strong>
                                        <ul>
                                            {Array.isArray(option.explanation)
                                                ? option.explanation.map((exp, i) => <li key={i}>{exp}</li>)
                                                : <li>{option.explanation}</li>
                                            }
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => confirmSend(option.text, currentAnalysis)}
                                        className="btn btn-primary full-width"
                                    >
                                        Select & Send This Version
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.feedbackSection}>
                            <div className={styles.feedbackLabel}>Was this analysis helpful?</div>
                            <div className={styles.feedbackButtons}>
                                <button
                                    className={`${styles.feedbackBtn} ${feedbackRating === 5 ? styles.active : ''}`}
                                    onClick={() => setFeedbackRating(5)}
                                >
                                    👍 Yes
                                </button>
                                <button
                                    className={`${styles.feedbackBtn} ${feedbackRating === 1 ? styles.active : ''}`}
                                    onClick={() => setFeedbackRating(1)}
                                >
                                    👎 No
                                </button>
                            </div>
                            {(feedbackRating !== 0) && (
                                <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                    <input
                                        type="text"
                                        className={styles.feedbackInput}
                                        placeholder={feedbackRating === 1 ? "What was wrong?" : "Any other notes?"}
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                    />
                                    <button
                                        className={styles.feedbackSubmit}
                                        onClick={submitFeedback}
                                    >
                                        Submit Feedback
                                    </button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setShowAnalysis(false)} className="btn btn-secondary full-width margin-top">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
