interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export async function generateGeminiResponse(prompt: string, apiKey: string, history: ChatMessage[] = []): Promise<string> {
    try {
        // Convert chat history to Gemini's expected format
        const contents = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Add the current prompt
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        return data.candidates[0]?.content.parts[0]?.text || 'No response generated';
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
} 