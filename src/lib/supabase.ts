import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
    id: string;
    email: string;
    role: 'admin' | 'partner';
    relationship_id?: string;
    full_name: string;
};

export type Relationship = {
    id: string;
    created_at: string;
    connection_score: number;
    commitment_score: number;
    communication_score: number;
};

export type Message = {
    id: string;
    relationship_id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

export type MessageAnalysis = {
    message_id: string;
    calm_rewrite: string;
    emotional_tone: string;
    detected_needs: string[];
    nvc_rewrite: string;
    guidance: string;
    conflict_score: number;
    attachment_hints: string;
};

export type Habit = {
    id: string;
    relationship_id: string;
    type: 'sex' | 'talk' | 'date' | 'prayer' | 'family_time' | 'family_prayer';
    frequency_goal: number;
    week_start_date: string;
    completions: number;
};

export type Event = {
    id: string;
    relationship_id: string;
    title: string;
    type: 'date' | 'intimacy' | 'talk' | 'visit' | 'prayer' | 'family' | 'goal';
    start_time: string;
    end_time: string;
    description: string;
};

export type Journal = {
    id: string;
    user_id: string;
    relationship_id: string;
    content: string;
    is_shared: boolean;
    sentiment_score: number;
    created_at: string;
};

export type Insight = {
    week_start_date: string;
    total_messages: number;
    avg_conflict_score: number;
    dominant_emotions: string[];
    common_needs: string[];
    habit_completion: Record<string, number>;
    strengths: string[];
    suggestions: string[];
};
