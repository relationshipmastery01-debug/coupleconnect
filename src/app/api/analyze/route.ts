import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log('--- Analyze API Called ---');

    // 1. Get API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: No API Key found');
        return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }
    console.log('✅ API Key found (starts with):', apiKey.substring(0, 5));

    try {
        // 2. Parse Request
        const body = await request.json();
        const { content } = body;
        console.log('📝 Analyzing content:', content);

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // 3. Construct Prompt
        const prompt = `
            You are an expert relationship coach. Analyze this message: "${content}"
            
            Return a JSON object with:
            - emotional_tone: 1-3 word description.
            - conflict_score: 1-10 number.
            - detected_needs: Array of strings.
            - rewrites: Array of 3 objects { label, text, explanation (array of strings) }.
            - guidance: Short tip.
            - attachment_hints: Short hint.

            IMPORTANT: Return ONLY valid JSON. No markdown.
        `;

        // 4. Call Gemini API via REST
        // Using the specific model available to this key
        const modelsToTry = ['gemini-2.0-flash-lite-preview-02-05', 'gemini-2.0-flash-exp'];

        let data;
        let usedModel;

        for (const model of modelsToTry) {
            try {
                console.log(`🚀 Calling Gemini API (${model})...`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.warn(`⚠️ Model ${model} failed:`, response.status, errorText);
                    continue; // Try next model
                }

                data = await response.json();
                usedModel = model;
                console.log(`✅ Gemini Response Received from ${model}`);
                break; // Success!
            } catch (e) {
                console.warn(`⚠️ Error calling ${model}:`, e);
            }
        }

        if (!data) {
            throw new Error('All Gemini models failed to respond.');
        }

        // 5. Parse Response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        // Clean markdown if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(cleanText);

        return NextResponse.json(analysis);

    } catch (error) {
        console.error('💥 Critical Error in Analyze Route:', error);
        return NextResponse.json({ error: 'Failed to analyze message', details: error.message }, { status: 500 });
    }
}
