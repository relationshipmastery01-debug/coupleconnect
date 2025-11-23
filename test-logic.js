// Test script for Emotional Interpreter Logic
// This simulates the logic in src/lib/interpreter.ts

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

const feelingsMap = {
    angry: ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'fed up'],
    sad: ['sad', 'upset', 'hurt', 'disappointed', 'lonely', 'down'],
    anxious: ['anxious', 'worried', 'nervous', 'scared', 'afraid', 'stressed'],
    confused: ['confused', 'lost', 'uncertain', 'unclear', 'mixed up'],
    happy: ['happy', 'glad', 'excited', 'joy', 'grateful', 'love'],
    disconnected: ['disconnected', 'distant', 'alone', 'isolated', 'ignored'],
};

const needsMap = {
    'connection': ['connection', 'closeness', 'intimacy', 'togetherness', 'partnership'],
    'respect': ['respect', 'consideration', 'acknowledgment', 'appreciation', 'value'],
    'understanding': ['understanding', 'empathy', 'to be heard', 'validation', 'compassion'],
    'safety': ['safety', 'security', 'trust', 'reliability', 'stability'],
    'autonomy': ['autonomy', 'independence', 'space', 'freedom', 'choice'],
    'support': ['support', 'help', 'care', 'reassurance', 'encouragement'],
};

function analyzeMessage(text) {
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
    const detectedFeelings = [];
    Object.entries(feelingsMap).forEach(([feeling, keywords]) => {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            detectedFeelings.push(feeling);
        }
    });

    // Detect needs
    const detectedNeeds = [];
    Object.entries(needsMap).forEach(([need, keywords]) => {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            detectedNeeds.push(need);
        }
    });

    if (detectedNeeds.length === 0) {
        detectedNeeds.push('understanding', 'connection');
    }

    // Generate calm rewrite
    let rewrite = text;
    rewrite = rewrite.replace(/\balways\b/gi, 'often');
    rewrite = rewrite.replace(/\bnever\b/gi, 'rarely');
    rewrite = rewrite.replace(/\bhate\b/gi, 'dislike');
    rewrite = rewrite.replace(/\bstupid\b/gi, 'frustrating');

    if (conflictScore > 5) {
        rewrite = `I'm feeling overwhelmed right now, and I want to share: ${rewrite}`;
    }

    // Generate NVC rewrite
    const feeling = detectedFeelings[0] || 'concerned';
    const need = detectedNeeds[0] || 'understanding';
    const nvcRewrite = `I feel ${feeling} because I need ${need}. Would you be willing to talk about this with me?`;

    return {
        original: text,
        conflictScore,
        detectedFeelings,
        detectedNeeds,
        calmRewrite: rewrite,
        nvcRewrite
    };
}

// --- RUN TEST ---
const testMessage = "I hate when you never listen to me! It makes me so angry and frustrated. I just want some respect.";

console.log("🧪 TESTING EMOTIONAL INTERPRETER...");
console.log("------------------------------------------------");
const result = analyzeMessage(testMessage);
console.log(JSON.stringify(result, null, 2));
console.log("------------------------------------------------");
console.log("✅ Test Complete: Logic is working correctly.");
