import { GoogleGenerativeAI } from '@google/generative-ai';

export type AnalysisResult = {
    calm_rewrite: string;
    emotional_tone: string;
    detected_needs: string[];
    nvc_rewrite: string;
    guidance: string;
    conflict_score: number;
    attachment_hints: string;
};

// Initialize Gemini
// Note: In a real production app, you should call this via a Next.js API route to keep the key secret.
// For this personal app/demo, using NEXT_PUBLIC_ is acceptable but exposes the key to the browser.
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function analyzeMessage(content: string): Promise<AnalysisResult> {
    try {
        const prompt = `
            You are an expert relationship coach and conflict resolution specialist.
            Analyze the following message from one partner to another.
            
            Message: "${content}"
            
            Your goal is to help them communicate with love, clarity, and non-violent communication (NVC) principles.
            
            Return a JSON object with the following fields:
            - calm_rewrite: A version of the message that is calm, loving, and clear, removing any aggression or blame.
            - emotional_tone: A 1-3 word description of the emotional tone (e.g., "Frustrated but caring", "Angry and defensive").
            - detected_needs: An array of strings listing the underlying human needs (e.g., "Respect", "Connection", "Safety").
            - nvc_rewrite: A strict NVC format rewrite: "When I see/hear [observation], I feel [emotion] because I need [need]. Would you be willing to [request]?"
            - guidance: A short, 1-sentence coaching tip for the sender on how to approach this topic.
            - conflict_score: A number from 1-10 indicating how likely this message is to cause a fight (10 = high conflict).
            - attachment_hints: Briefly mention if this sounds like Anxious, Avoidant, or Secure attachment style.

            IMPORTANT: Return ONLY the JSON object. No markdown formatting.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up potential markdown code blocks if Gemini adds them
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText) as AnalysisResult;

    } catch (error) {
        console.error('Error analyzing message with AI:', error);
        // Fallback to basic logic if AI fails
        return {
            calm_rewrite: content,
            emotional_tone: 'Neutral',
            detected_needs: ['Understanding'],
            nvc_rewrite: content,
            guidance: 'Try to speak from your heart.',
            conflict_score: 1,
            attachment_hints: 'Unknown'
        };
    }
}

export function analyzeSentiment(content: string): number {
    // Simple sentiment for journaling (can be upgraded to AI later if needed)
    const positiveWords = ['happy', 'love', 'great', 'good', 'excited', 'peace', 'calm', 'hope'];
    const negativeWords = ['sad', 'angry', 'hurt', 'bad', 'hate', 'fear', 'anxious', 'tired'];

    let score = 5;
    const lowerContent = content.toLowerCase();

    positiveWords.forEach(word => {
        if (lowerContent.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
        if (lowerContent.includes(word)) score -= 1;
    });

    return Math.max(1, Math.min(10, score));
}
