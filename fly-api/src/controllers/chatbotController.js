const {
  addToDatabase,
  getFromDatabase,
  getAllFromDatabase,
  setToDatabase,
  updateToDatabase,
  deleteFromDatabase,
} = require('../services/firebaseService');

const COLLECTIONS = {
  CONFIG: 'chatbotConfig',
  FAQS: 'chatbotFaqs',
};

const CONFIG_ID = 'default';
const MAX_TEXT_LENGTH = 5000;

const DEFAULT_CONFIG = {
  systemInstruction: 'You are an AI assistant built into the Fairfly Travel and Tours Agency website. Answer visitors politely, concisely, and professionally. Only answer questions related to Fairfly services, prices, packages, requirements, processing times, or basic greetings. Use the live service catalog as the source of truth for factual claims. Do not invent details.',
  offTopicResponse: "I'm here to help you learn more about Fairfly's services! Feel free to ask about what we offer.",
  updatedAt: null,
};

const DEFAULT_FAQS = [
  { label: 'What services does Fairfly offer?', prompt: 'What services does Fairfly currently offer?', category: 'Services', displayOrder: 1 },
  { label: 'How much do your services cost?', prompt: 'What are the current prices for Fairfly services?', category: 'Pricing', displayOrder: 2 },
  { label: 'What requirements do I need?', prompt: 'What requirements are needed for Fairfly services?', category: 'Requirements', displayOrder: 3 },
  { label: 'How long does processing take?', prompt: 'What are the current processing times for Fairfly services?', category: 'Processing', displayOrder: 4 },
  { label: 'What tour packages are available?', prompt: 'What tour packages and travel services does Fairfly offer?', category: 'Packages', displayOrder: 5 },
];

const now = () => new Date().toISOString();

function cleanText(value, fieldName, required = false) {
  const valueText = typeof value === 'string' ? value.trim() : '';
  if (required && !valueText) {
    throw new Error(`${fieldName} is required`);
  }
  if (valueText.length > MAX_TEXT_LENGTH) {
    throw new Error(`${fieldName} must not exceed ${MAX_TEXT_LENGTH} characters`);
  }
  return valueText;
}

function normalizeFaqPayload(body, partial = false) {
  const payload = {};

  if (!partial || body.label !== undefined) {
    payload.label = cleanText(body.label, 'FAQ label', true);
  }
  if (!partial || body.prompt !== undefined) {
    payload.prompt = cleanText(body.prompt, 'FAQ prompt', true);
  }
  if (!partial || body.category !== undefined) {
    payload.category = cleanText(body.category || 'General', 'FAQ category', true);
  }
  if (!partial || body.enabled !== undefined) {
    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      throw new Error('FAQ enabled value must be boolean');
    }
    payload.enabled = body.enabled === undefined ? true : body.enabled;
  }
  if (!partial || body.displayOrder !== undefined) {
    const displayOrder = Number(body.displayOrder ?? 0);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      throw new Error('FAQ display order must be a non-negative integer');
    }
    payload.displayOrder = displayOrder;
  }

  return payload;
}

async function getOrCreateConfig() {
  const existing = await getFromDatabase(`${COLLECTIONS.CONFIG}/${CONFIG_ID}`);
  if (existing) return { id: CONFIG_ID, ...existing };

  const config = { ...DEFAULT_CONFIG, createdAt: now() };
  await setToDatabase(`${COLLECTIONS.CONFIG}/${CONFIG_ID}`, config);
  return { id: CONFIG_ID, ...config };
}

async function seedFaqsIfEmpty() {
  const existing = await getAllFromDatabase(COLLECTIONS.FAQS);
  if (existing.length > 0) return existing;

  const timestamp = now();
  return Promise.all(DEFAULT_FAQS.map(async (faq) => {
    const id = await addToDatabase(COLLECTIONS.FAQS, {
      ...faq,
      enabled: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return { id, ...faq, enabled: true, createdAt: timestamp, updatedAt: timestamp };
  }));
}

const getConfig = async (req, res) => {
  try {
    return res.status(200).json(await getOrCreateConfig());
  } catch (error) {
    console.error('Error fetching chatbot config:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const systemInstruction = cleanText(req.body.systemInstruction, 'System instruction', true);
    const offTopicResponse = cleanText(req.body.offTopicResponse, 'Off-topic response', true);
    const updates = { systemInstruction, offTopicResponse, updatedAt: now() };

    await getOrCreateConfig();
    await updateToDatabase(`${COLLECTIONS.CONFIG}/${CONFIG_ID}`, updates);
    return res.status(200).json({ id: CONFIG_ID, ...updates });
  } catch (error) {
    const status = error.message?.includes('required') || error.message?.includes('exceed') ? 400 : 500;
    console.error('Error updating chatbot config:', error);
    return res.status(status).json({ error: status === 400 ? error.message : 'Internal Server Error' });
  }
};

const getFaqs = async (req, res) => {
  try {
    const faqs = await seedFaqsIfEmpty();
    return res.status(200).json(faqs.filter((faq) => faq.enabled).sort((a, b) => a.displayOrder - b.displayOrder));
  } catch (error) {
    console.error('Error fetching chatbot FAQs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAllFaqs = async (req, res) => {
  try {
    const faqs = await seedFaqsIfEmpty();
    return res.status(200).json(faqs.sort((a, b) => a.displayOrder - b.displayOrder));
  } catch (error) {
    console.error('Error fetching all chatbot FAQs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createFaq = async (req, res) => {
  try {
    const faq = normalizeFaqPayload(req.body);
    const timestamp = now();
    const id = await addToDatabase(COLLECTIONS.FAQS, { ...faq, createdAt: timestamp, updatedAt: timestamp });
    return res.status(201).json({ id, ...faq, createdAt: timestamp, updatedAt: timestamp });
  } catch (error) {
    const status = error.message?.includes('required') || error.message?.includes('must') ? 400 : 500;
    console.error('Error creating chatbot FAQ:', error);
    return res.status(status).json({ error: status === 400 ? error.message : 'Internal Server Error' });
  }
};

const updateFaq = async (req, res) => {
  try {
    const id = cleanText(req.params.id, 'FAQ ID', true);
    if (!await getFromDatabase(`${COLLECTIONS.FAQS}/${id}`)) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    const updates = { ...normalizeFaqPayload(req.body, true), updatedAt: now() };
    await updateToDatabase(`${COLLECTIONS.FAQS}/${id}`, updates);
    return res.status(200).json({ id, ...updates });
  } catch (error) {
    const status = error.message?.includes('required') || error.message?.includes('must') ? 400 : 500;
    console.error('Error updating chatbot FAQ:', error);
    return res.status(status).json({ error: status === 400 ? error.message : 'Internal Server Error' });
  }
};

const deleteFaq = async (req, res) => {
  try {
    const id = cleanText(req.params.id, 'FAQ ID', true);
    if (!await getFromDatabase(`${COLLECTIONS.FAQS}/${id}`)) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    await deleteFromDatabase(`${COLLECTIONS.FAQS}/${id}`);
    return res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting chatbot FAQ:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getConfig,
  updateConfig,
  getFaqs,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};
