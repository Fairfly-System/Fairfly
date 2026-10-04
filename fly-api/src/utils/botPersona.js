/**
 * Fairfly AI Assistant Persona and Grounding Context Builder
 */

const GEMINI_SYSTEM_INSTRUCTION = `
You are the official AI Assistant for Fairfly Travel and Tours Agency.
Your job is to answer visitor questions politely, concisely, accurately, and with a professional yet friendly tone.

You have access to the official, live Fairfly Service Catalog and Official Branch Directory below. Always use this data as the sole ground truth for factual claims about services, prices, requirements, processing times, and branch locations. Do not invent services, prices, or locations. Prices are in Philippine Pesos (PHP / ₱) unless stated otherwise. "WD" means Working Days.

Key Rules & Guidelines:
1. Ground Truth & Accuracy: Only recommend and detail services and branches that exist in the directory below.
2. Branch Referrals: When a visitor asks about booking, consulting, or applying for a service, guide them to their nearest or relevant branch. Provide the branch's name, physical address, and contact number, and invite them to schedule an appointment or submit an inquiry on the website.
3. Exclusive vs Nationwide Services: If a service is marked as branch-exclusive, inform the user that it is offered specifically by that branch. If it is nationwide/all-branches, they can inquire or book at any branch.
4. Scope: Only answer questions related to Fairfly's travel services, tour packages, visa assistance, passport processing, franchise opportunities, appointment booking, and branch contact info.
5. Off-Topic Inquiries: If a visitor asks an irrelevant question (e.g., coding, general trivia, unrelated businesses), politely decline and guide them back: "[offTopicResponse]"
6. Never break character. Keep responses concise and easy to read on mobile.
`.trim();

function formatBranches(branches = []) {
  if (!branches.length) {
    return 'No physical branch locations currently available.';
  }
  return branches.map((b) => {
    const qualifiedNote = b.isQualified ? ' (Certified Qualified Branch)' : '';
    return [
      `- ${b.branchName || b.name || 'FairFly Branch'}${qualifiedNote}`,
      `Address: ${b.address || b.location || 'Location upon inquiry'}`,
      `Contact: ${b.contactNumber || 'Available through website inquiry'}`,
      `Email: ${b.email || 'N/A'}`
    ].join(' | ');
  }).join('\n');
}

function formatServices(services = []) {
  if (!services.length) {
    return 'No active services currently listed.';
  }
  return services.map((s) => {
    const requirements = Array.isArray(s.requirements)
      ? s.requirements.join(', ')
      : s.requirements || 'Standard documents required';
    const tags = Array.isArray(s.tags) ? s.tags.join(', ') : s.tags || 'General';
    const branchAvailability = s.isBranchExclusive && s.branchName
      ? `Exclusive to ${s.branchName}`
      : 'Available across all Fairfly branches (Nationwide)';

    return [
      `- ${s.name || 'Unnamed service'}`,
      `Category: ${s.category || 'General Services'}`,
      `Description: ${s.description || 'Not specified'}`,
      `Price: ${s.price || 'Contact branch for quote'}`,
      `Processing time: ${s.processingTime || 'Varies by application'}`,
      `Requirements: ${requirements}`,
      `Availability: ${branchAvailability}`,
      `Tags: ${tags}`
    ].join(' | ');
  }).join('\n');
}

function buildBackendSystemInstruction({ services = [], branches = [], config = {} }) {
  const baseInstruction = config.systemInstruction || GEMINI_SYSTEM_INSTRUCTION;
  const offTopicResponse = config.offTopicResponse || "I'm here to help you learn more about Fairfly's services and branch locations! Feel free to ask about what we offer.";

  return `${baseInstruction}

Official Fairfly Branch Directory:
${formatBranches(branches)}

Current Fairfly Service Catalog:
${formatServices(services)}

If a question is outside the allowed topics, respond politely with: "${offTopicResponse}"`.trim();
}

module.exports = {
  GEMINI_SYSTEM_INSTRUCTION,
  buildBackendSystemInstruction
};
