'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Profile, Event } from '@/lib/supabase';
import styles from './planner.module.css';

const EVENT_TYPES = [
    { value: 'date', label: 'Date', icon: '🌹' },
    { value: 'intimacy', label: 'Intimacy', icon: '💕' },
    { value: 'talk', label: 'Talk', icon: '💬' },
    { value: 'visit', label: 'Visit', icon: '🚗' },
    { value: 'prayer', label: 'Prayer', icon: '🙏' },
    { value: 'family', label: 'Family Time', icon: '👨‍👩‍👧‍👦' },
    { value: 'goal', label: 'Shared Goal', icon: '🎯' },
];

export default function PlannerPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'date' as Event['type'],
        start_time: '',
        end_time: '',
        description: '',
    });

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
            await loadEvents(profileData.relationship_id);
        }
    };

    const loadEvents = async (relationshipId: string) => {
        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('relationship_id', relationshipId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        setEvents(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.relationship_id) return;

        await supabase.from('events').insert({
            relationship_id: profile.relationship_id,
            ...formData,
        });

        setFormData({
            title: '',
            type: 'date',
            start_time: '',
            end_time: '',
            description: '',
        });
        setShowForm(false);
        loadEvents(profile.relationship_id);
    };

    const deleteEvent = async (id: string) => {
        await supabase.from('events').delete().eq('id', id);
        if (profile?.relationship_id) {
            loadEvents(profile.relationship_id);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Shared Planner</h1>
                    <p className={styles.subtitle}>Schedule and plan your quality time together</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? 'Cancel' : '+ Add Event'}
                    </button>
                    <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
                        Back
                    </button>
                </div>
            </div>

            {showForm && (
                <div className={styles.formCard}>
                    <h2>Create New Event</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g., Dinner Date"
                            />
                        </div>

                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as Event['type'] })}
                            >
                                {EVENT_TYPES.map(et => (
                                    <option key={et.value} value={et.value}>
                                        {et.icon} {et.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Start Time</label>
                            <input
                                type="datetime-local"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>End Time</label>
                            <input
                                type="datetime-local"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Additional details..."
                            />
                        </div>

                        <button type="submit" className="btn btn-primary">Create Event</button>
                    </form>
                </div>
            )}

            <div className={styles.eventsList}>
                <h2>Upcoming Events</h2>
                {events.length === 0 ? (
                    <div className={styles.empty}>No upcoming events. Create your first event!</div>
                ) : (
                    <div className={styles.eventsGrid}>
                        {events.map((event) => {
                            const eventType = EVENT_TYPES.find(et => et.value === event.type);
                            return (
                                <div key={event.id} className={styles.eventCard}>
                                    <div className={styles.eventIcon}>{eventType?.icon}</div>
                                    <div className={styles.eventDetails}>
                                        <div className={styles.eventTitle}>{event.title}</div>
                                        <div className={styles.eventType}>{eventType?.label}</div>
                                        <div className={styles.eventTime}>
                                            {new Date(event.start_time).toLocaleString()}
                                            {' → '}
                                            {new Date(event.end_time).toLocaleString()}
                                        </div>
                                        {event.description && (
                                            <div className={styles.eventDescription}>{event.description}</div>
                                        )}
                                    </div>
                                    <div className={styles.eventActions}>
                                        <button
                                            onClick={() => {
                                                const startTime = new Date(event.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                                const endTime = new Date(event.end_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(event.description || '')}`;
                                                window.open(url, '_blank');
                                            }}
                                            className={styles.calendarBtn}
                                            title="Add to Google Calendar"
                                        >
                                            📅 Add to Calendar
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(event.id)}
                                            className={styles.deleteBtn}
                                            title="Delete event"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
