const { db } = require('../config/firebase');
const { generatePrefixedId, ID_PREFIXES } = require('../utils/idGenerator');

const INITIAL_QUICK_LINKS = [
  // Airlines
  { title: 'Cebu Pacific', url: 'https://www.cebupacificair.com/', category: 'airlines' },
  { title: 'Philippine Airlines', url: 'https://flights.philippineairlines.com/en-ph/', category: 'airlines' },
  { title: 'AirAsia', url: 'https://www.airasia.com', category: 'airlines' },
  { title: 'Singapore Airlines', url: 'https://www.singaporeair.com', category: 'airlines' },
  { title: 'Cathay Pacific', url: 'https://www.cathaypacific.com', category: 'airlines' },

  // Hotels
  { title: 'Booking.com', url: 'https://www.booking.com', category: 'hotels' },
  { title: 'Agoda', url: 'https://www.agoda.com', category: 'hotels' },
  { title: 'Hotels.com', url: 'https://www.hotels.com', category: 'hotels' },
  { title: 'Airbnb', url: 'https://www.airbnb.com', category: 'hotels' },
  { title: 'Expedia', url: 'https://www.expedia.com', category: 'hotels' },

  // Government
  { title: 'DFA Passport Appointment', url: 'https://www.passport.gov.ph', category: 'government' },
  { title: 'PSA Serbilis', url: 'https://www.psaserbilis.com.ph/BirthCertificate', category: 'government' },
  { title: 'BI e-Services', url: 'https://onlineservices.immigration.gov.ph', category: 'government' },
  { title: 'eGov PH Portal', url: 'https://egov.ph', category: 'government' },

  // Visa & Embassy
  { title: 'US Embassy Manila', url: 'https://ph.usembassy.gov', category: 'visaAndEmbassy' },
  { title: 'VFS Global', url: 'https://www.vfsglobal.com', category: 'visaAndEmbassy' },
  { title: 'BLS International', url: 'https://www.blsinternational.com', category: 'visaAndEmbassy' },
  { title: 'Japan Visa Processing Portal', url: 'https://www.ph.emb-japan.go.jp', category: 'visaAndEmbassy' },
];

async function seedQuickLinks() {
  console.log('--- QuickLinks Seeder ---');
  const snap = await db.collection('quickLinks').get();
  const existingUrls = new Set();
  const existingTitles = new Set();

  snap.forEach((doc) => {
    const data = doc.data();
    if (data.url) existingUrls.add(data.url.trim().toLowerCase().replace(/\/$/, ''));
    if (data.title) existingTitles.add(data.title.trim().toLowerCase());
  });

  console.log(`Found ${snap.size} existing quickLinks in Firestore.`);

  let createdCount = 0;
  for (const item of INITIAL_QUICK_LINKS) {
    const normalizedUrl = item.url.trim().toLowerCase().replace(/\/$/, '');
    const normalizedTitle = item.title.trim().toLowerCase();

    if (existingUrls.has(normalizedUrl) || existingTitles.has(normalizedTitle)) {
      console.log(`  [SKIP] "${item.title}" already exists.`);
      continue;
    }

    const docId = generatePrefixedId(ID_PREFIXES.QUICK_LINK);
    const now = new Date().toISOString();
    await db.collection('quickLinks').doc(docId).set({
      title: item.title,
      url: item.url,
      category: item.category,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`  [CREATED] ${docId} -> "${item.title}" (${item.category})`);
    createdCount++;
  }

  console.log(`--- Seeding completed: ${createdCount} links created. ---`);
}

if (require.main === module) {
  seedQuickLinks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedQuickLinks };
