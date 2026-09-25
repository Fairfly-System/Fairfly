export const GEMINI_SYSTEM_INSTRUCTION = `
You are an AI assistant built into Fairfly Travel and Tours Agency website.
Your job is to answer visitor questions politely, concisely, and with a professional yet friendly tone.

Use only the current Fairfly service catalog provided below for factual claims about services, prices, requirements, and processing times. Do not invent details or use information from prior conversations when the catalog does not contain an answer. Prices are in the currency shown, and "WD" means Working Days.

Rules:
1. Only answer questions related to Fairfly's services, prices, packages, or basic greetings.
2. If someone asks an irrelevant question (e.g., "Give me a recipe for lasagna"), politely guide them back by saying: "I'm here to help you learn more about Fairfly's services! Feel free to ask about what we offer."
3. Never break character.
`;

export function buildGeminiSystemInstruction(services, config = {}) {
    const baseInstruction = config.systemInstruction || GEMINI_SYSTEM_INSTRUCTION;
    const offTopicResponse = config.offTopicResponse || "I'm here to help you learn more about Fairfly's services! Feel free to ask about what we offer.";
    const serviceContext = services.map((service) => {
        const requirements = Array.isArray(service.requirements)
            ? service.requirements.join(', ')
            : service.requirements || 'Not specified';
        const tags = Array.isArray(service.tags) ? service.tags.join(', ') : service.tags || 'None';

        return [
            `- ${service.name || 'Unnamed service'}`,
            `Category: ${service.category || 'General Services'}`,
            `Description: ${service.description || 'Not specified'}`,
            `Price: ${service.price || 'Not specified'}`,
            `Processing time: ${service.processingTime || 'Not specified'}`,
            `Requirements: ${requirements}`,
            `Tags: ${tags}`,
        ].join(' | ');
    }).join('\n');

    return `${baseInstruction}\nIf a question is outside the allowed topics, respond with: "${offTopicResponse}"\nCurrent Fairfly service catalog:\n${serviceContext}`;
}