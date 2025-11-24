// Rule-based Emotional Interpreter - No external APIs required

export type AnalysisResult = {
    calm_rewrite: string;
    emotional_tone: string;
    detected_needs: string[];
    nvc_rewrite: string;
    guidance: string;
    conflict_score: number;
    attachment_hints: string;
};

// Emotional keywords and their scores
const conflictWords = [
    { word: 'always', score: 2 },
    { word: 'never', score: 2 },
    { word: 'hate', score: 3 },
    { word: 'stupid', score: 3 },
    { word: 'worst', score: 2 },
    { word: 'terrible', score: 2 },
    { word: 'annoying', score: 1 },
    { word: 'frustrated', score: 1 },
    { word: 'angry', score: 2 },
    { word: 'furious', score: 3 },
    { word: 'fed up', score: 2 },
    { word: 'sick of', score: 2 },
];

const feelingsMap: Record<string, string[]> = {
    angry: ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'fed up'],
    sad: ['sad', 'upset', 'hurt', 'disappointed', 'lonely', 'down'],
    anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'stressed'],
    confused: ['confused', 'lost', 'uncertain', 'unclear', 'mixed up'],
    happy: ['happy', 'glad', 'excited', 'joy', 'grateful', 'love'],
    disconnected: ['disconnected', 'distant', 'alone', 'isolated', 'ignored'],
};

const needsMap: Record<string, string[]> = {
    'connection': ['connection', 'closeness', 'intimacy', 'togetherness', 'partnership'],
    'respect': ['respect', 'consideration', 'acknowledgment', 'appreciation', 'value'],
    'understanding': ['understanding', 'empathy', 'to be heard', 'validation', 'compassion'],
    'safety': ['safety', 'security', 'trust', 'reliability', 'stability'],
    'autonomy': ['autonomy', 'independence', 'space', 'freedom', 'choice'],
    'support': ['support', 'help', 'care', 'reassurance', 'encouragement'],
};

const attachmentPatterns = {
    anxious: ['need you', 'where are you', 'ignore me', 'don\'t care', 'leaving me'],
    avoidant: ['space', 'alone', 'too much', 'clingy', 'overwhelmed', 'independent'],
    secure: ['we can', 'understand', 'together', 'appreciate', 'support'],
};

export function analyzeMessage(text: string): AnalysisResult {
    const lowerText = text.toLowerCase();

    // Calculate conflict score
    let conflictScore = 0;
    conflictWords.forEach(({ word, score }) => {
        if (lowerText.includes(word)) {
            conflictScore += score;
        }
    });
    conflictScore = Math.min(10, conflictScore);

    // Detect feelings
    const detectedFeelings: string[] = [];
    Object.entries(feelingsMap).forEach(([feeling, keywords]) => {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            detectedFeelings.push(feeling);
        }
    });

    // Detect needs
    const detectedNeeds: string[] = [];
    Object.entries(needsMap).forEach(([need, keywords]) => {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            detectedNeeds.push(need);
        }
    });

    // Default needs if none detected
    if (detectedNeeds.length === 0) {
        detectedNeeds.push('understanding', 'connection');
    }

    // Detect attachment style
    let attachmentHint = 'secure';
    let maxMatches = 0;
    Object.entries(attachmentPatterns).forEach(([style, patterns]) => {
        const matches = patterns.filter(pattern => lowerText.includes(pattern)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            attachmentHint = style;
        }
    });

    // Generate calm rewrite
    const calmRewrite = generateCalmRewrite(text, detectedFeelings, conflictScore);

    // Generate NVC rewrite
    const nvcRewrite = generateNVCRewrite(detectedFeelings, detectedNeeds);

    // Determine emotional tone
    const emotionalTone = detectedFeelings.length > 0
        ? detectedFeelings.join(', ')
        : 'neutral';

    // Generate guidance for partner
    const guidance = generateGuidance(detectedFeelings, detectedNeeds, conflictScore);

    return {
        calm_rewrite: calmRewrite,
        emotional_tone: emotionalTone,
        detected_needs: detectedNeeds,
        nvc_rewrite: nvcRewrite,
        guidance,
        conflict_score: conflictScore,
        attachment_hints: attachmentHint,
    };
}

function generateCalmRewrite(text: string, feelings: string[], conflictScore: number): string {
    let rewrite = text;

    // Replace extreme words
    rewrite = rewrite.replace(/\balways\b/gi, 'often');
    rewrite = rewrite.replace(/\bnever\b/gi, 'rarely');
    rewrite = rewrite.replace(/\bhate\b/gi, 'dislike');
    rewrite = rewrite.replace(/\bstupid\b/gi, 'frustrating');
    rewrite = rewrite.replace(/\bworst\b/gi, 'challenging');
    rewrite = rewrite.replace(/\bterrible\b/gi, 'difficult');

    // Add softening prefix if high conflict
    if (conflictScore > 5) {
        rewrite = `I'm feeling overwhelmed right now, and I want to share: ${rewrite}`;
    }

    return rewrite;
}

function generateNVCRewrite(feelings: string[], needs: string[]): string {
    const feeling = feelings[0] || 'concerned';
    const need = needs[0] || 'understanding';

    return `I feel ${feeling} because I need ${need}. Would you be willing to talk about this with me?`;
}

function generateGuidance(feelings: string[], needs: string[], conflictScore: number): string {
    if (conflictScore > 7) {
        return 'Your partner is experiencing high emotional intensity right now. Take a moment to breathe before responding. Acknowledge their feelings first, even if you disagree with their perspective. Try: "I can see you\'re really upset. Help me understand what\'s happening for you."';
    }

    if (conflictScore > 4) {
        return `Your partner seems to be feeling ${feelings[0] || 'upset'} and needs ${needs[0] || 'understanding'}. Respond with empathy and avoid defensiveness. You might say: "Thank you for sharing. It sounds like you need ${needs[0]}. How can we work on this together?"`;
    }

    return `Your partner is sharing their feelings with you. Listen actively and validate their experience. A helpful response could be: "I hear you, and I want to understand better. Can you tell me more about what you need right now?"`;
}

// Sentiment analysis for journal entries
export function analyzeSentiment(text: string): number {
    const positiveWords = ['happy', 'love', 'grateful', 'joy', 'wonderful', 'great', 'amazing', 'blessed', 'thankful', 'good', 'better', 'peace', 'hope'];
    const negativeWords = ['sad', 'angry', 'hurt', 'pain', 'difficult', 'hard', 'struggle', 'worried', 'anxious', 'upset', 'bad', 'worse', 'fear'];

    const lowerText = text.toLowerCase();
    let score = 5; // neutral baseline

    positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 0.5;
    });

    negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 0.5;
    });

    return Math.max(0, Math.min(10, score));
}
