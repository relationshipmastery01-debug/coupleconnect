// Logic for calculating relationship scores

import { supabase, Message, Habit, Journal } from './supabase';

export async function calculateRelationshipScores(relationshipId: string) {
    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*, message_analysis(*)')
        .eq('relationship_id', relationshipId)
        .gte('created_at', thirtyDaysAgo.toISOString());

    // Fetch habits
    const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('relationship_id', relationshipId);

    // Fetch journals
    const { data: journals } = await supabase
        .from('journals')
        .select('*')
        .eq('relationship_id', relationshipId)
        .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate Communication Score (0-100)
    let communicationScore = 50; // baseline

    if (messages && messages.length > 0) {
        const avgConflictScore = messages.reduce((sum: number, msg: any) => {
            return sum + (msg.message_analysis?.conflict_score || 0);
        }, 0) / messages.length;

        // Lower conflict = higher communication score
        communicationScore = Math.round(100 - (avgConflictScore * 10));

        // Bonus for frequency of communication
        if (messages.length > 20) communicationScore += 10;
        if (messages.length > 50) communicationScore += 10;
    }

    communicationScore = Math.min(100, Math.max(0, communicationScore));

    // Calculate Connection Score (0-100)
    let connectionScore = 50;

    if (habits && habits.length > 0) {
        const completionRate = habits.reduce((sum, habit) => {
            return sum + (habit.completions / habit.frequency_goal);
        }, 0) / habits.length;

        connectionScore = Math.round(completionRate * 100);
    }

    // Bonus for shared journal entries
    if (journals) {
        const sharedEntries = journals.filter((j: Journal) => j.is_shared);
        connectionScore += sharedEntries.length * 2;
    }

    connectionScore = Math.min(100, Math.max(0, connectionScore));

    // Calculate Commitment Score (0-100)
    let commitmentScore = 50;

    // Based on consistency over time
    if (habits && habits.length > 0) {
        const allHabitsComplete = habits.every(habit => habit.completions >= habit.frequency_goal);
        if (allHabitsComplete) commitmentScore = 90;
        else {
            const avgCompletion = habits.reduce((sum, h) => sum + h.completions, 0) / habits.length;
            commitmentScore = Math.round(50 + (avgCompletion * 5));
        }
    }

    // Message frequency indicates commitment
    if (messages && messages.length > 30) commitmentScore += 10;

    commitmentScore = Math.min(100, Math.max(0, commitmentScore));

    // Update the relationship record
    await supabase
        .from('relationships')
        .update({
            communication_score: communicationScore,
            connection_score: connectionScore,
            commitment_score: commitmentScore,
        })
        .eq('id', relationshipId);

    return {
        communication_score: communicationScore,
        connection_score: connectionScore,
        commitment_score: commitmentScore,
    };
}

export async function generateWeeklyInsights(relationshipId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Fetch week's data
    const { data: messages } = await supabase
        .from('messages')
        .select('*, message_analysis(*)')
        .eq('relationship_id', relationshipId)
        .gte('created_at', weekAgo.toISOString());

    const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('relationship_id', relationshipId);

    const { data: journals } = await supabase
        .from('journals')
        .select('*')
        .eq('relationship_id', relationshipId)
        .gte('created_at', weekAgo.toISOString());

    // Analyze patterns
    const insights: any = {
        week_start_date: weekAgo.toISOString().split('T')[0],
        total_messages: messages?.length || 0,
        avg_conflict_score: 0,
        dominant_emotions: [],
        common_needs: [],
        habit_completion: {},
        strengths: [],
        suggestions: [],
    };

    if (messages && messages.length > 0) {
        const avgConflict = messages.reduce((sum: number, msg: any) => {
            return sum + (msg.message_analysis?.conflict_score || 0);
        }, 0) / messages.length;
        insights.avg_conflict_score = avgConflict;

        // Collect all emotions
        const emotions: Record<string, number> = {};
        messages.forEach((msg: any) => {
            if (msg.message_analysis?.emotional_tone) {
                const tones = msg.message_analysis.emotional_tone.split(',');
                tones.forEach((tone: string) => {
                    const trimmed = tone.trim();
                    emotions[trimmed] = (emotions[trimmed] || 0) + 1;
                });
            }
        });

        insights.dominant_emotions = Object.entries(emotions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emotion]) => emotion);

        // Collect needs
        const needs: Record<string, number> = {};
        messages.forEach((msg: any) => {
            if (msg.message_analysis?.detected_needs) {
                msg.message_analysis.detected_needs.forEach((need: string) => {
                    needs[need] = (needs[need] || 0) + 1;
                });
            }
        });

        insights.common_needs = Object.entries(needs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([need]) => need);
    }

    // Habit analysis
    if (habits) {
        habits.forEach((habit: any) => {
            const completionRate = (habit.completions / habit.frequency_goal) * 100;
            insights.habit_completion[habit.type] = Math.round(completionRate);
        });
    }

    // Generate strengths
    if (insights.avg_conflict_score < 3) {
        insights.strengths.push('Low conflict communication');
    }
    if (insights.total_messages > 20) {
        insights.strengths.push('High engagement and communication frequency');
    }
    const habitCompletionAvg = Object.values(insights.habit_completion).reduce((a: any, b: any) => a + b, 0) / Object.keys(insights.habit_completion).length;
    if (habitCompletionAvg > 80) {
        insights.strengths.push('Excellent habit consistency');
    }

    // Generate suggestions
    if (insights.avg_conflict_score > 5) {
        insights.suggestions.push('Consider using the calm rewrite feature more often before sending messages');
    }
    if (insights.total_messages < 10) {
        insights.suggestions.push('Try to check in with each other more frequently this week');
    }
    const incompletHabits = Object.entries(insights.habit_completion).filter(([_, rate]) => (rate as number) < 70);
    if (incompletHabits.length > 0) {
        insights.suggestions.push(`Focus on improving: ${incompletHabits.map(([type]) => type).join(', ')}`);
    }

    // Save insights
    await supabase.from('insights').insert({
        relationship_id: relationshipId,
        week_start_date: insights.week_start_date,
        summary_json: insights,
    });

    return insights;
}
