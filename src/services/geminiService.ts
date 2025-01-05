interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

export async function generateGeminiResponse(prompt: string, apiKey: string): Promise<string> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
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