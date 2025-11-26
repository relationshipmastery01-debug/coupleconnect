'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationListener() {
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        // 1. Request Permission on Mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // 2. Check for Weekly Insights (Monday)
        checkWeeklyInsights();

        // 3. Setup Realtime Listeners
        const setupListeners = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userIdRef.current = user.id;

            const { data: profile } = await supabase
                .from('profiles')
                .select('relationship_id')
                .eq('id', user.id)
                .single();

            if (!profile?.relationship_id) return;

            const relationshipId = profile.relationship_id;

            // Subscribe to all relevant changes
            const channel = supabase
                .channel('global_notifications')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `relationship_id=eq.${relationshipId}` },
                    (payload) => {
                        if (payload.new.sender_id !== userIdRef.current) {
                            sendNotification('New Message', 'Your partner sent a message 💌');
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'journals', filter: `relationship_id=eq.${relationshipId}` },
                    (payload) => {
                        if (payload.new.user_id !== userIdRef.current && payload.new.is_shared) {
                            sendNotification('New Journal Entry', 'Your partner shared a moment 📔');
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'events', filter: `relationship_id=eq.${relationshipId}` },
                    (payload) => {
                        sendNotification('New Event', `New event added: ${payload.new.title} 📅`);
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'habits', filter: `relationship_id=eq.${relationshipId}` },
                    (payload) => {
                        // Simple check to see if completions increased
                        if (payload.new.completions > payload.old.completions) {
                            sendNotification('Habit Progress', 'A habit was completed! 🎉');
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupListeners();
    }, []);

    const sendNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/icon-192x192.png', // Assuming we have an icon, or standard browser icon
                badge: '/icon-192x192.png'
            });
        }
    };

    const checkWeeklyInsights = () => {
        const today = new Date();
        const isMonday = today.getDay() === 1; // 0 is Sunday, 1 is Monday

        if (isMonday) {
            const lastNotified = localStorage.getItem('lastInsightNotification');
            const todayStr = today.toDateString();

            if (lastNotified !== todayStr) {
                sendNotification('Weekly Insights Ready', 'Check out your relationship insights for this week! 📊');
                localStorage.setItem('lastInsightNotification', todayStr);
            }
        }
    };

    return null; // This component doesn't render anything visible
}
