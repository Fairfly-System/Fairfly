const { db, auth } = require('../config/firebase');
const { ID_PREFIXES, parsePrefix } = require('../utils/idGenerator');

const isDryRun = process.argv.includes('--dry-run');

/**
 * Migration Script: Prepends standard human-readable prefixes to all Firestore records
 * and updates Firebase Auth UIDs and all cross-collection foreign key references.
 */
async function runMigration() {
  console.log('===============================================================');
  console.log(`Starting Record ID Prefix Migration ${isDryRun ? '[DRY RUN - NO WRITES]' : '[LIVE EXECUTION]'}`);
  console.log('===============================================================\n');

  // Mappings from old document ID to new prefixed document ID
  const userMap = {};
  const serviceMap = {};
  const workflowTemplateMap = {};
  const ticketMap = {};
  const appointmentMap = {};
  const resourceMap = {};
  const conversationMap = {};
  const announcementMap = {};
  const qualificationMap = {};
  const franchiseMap = {};
  const inquiryMap = {};
  const quotationMap = {};
  const activeServiceMap = {};

  // -------------------------------------------------------------------------
  // 1. Build User Map
  // -------------------------------------------------------------------------
  console.log('Step 1: Reading users collection and building user ID map...');
  const usersSnapshot = await db.collection('users').get();
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const oldId = doc.id;
    
    // Check if already prefixed
    if (parsePrefix(oldId)) {
      userMap[oldId] = oldId;
      return;
    }

    let prefix = ID_PREFIXES.CLIENT;
    if (data.role === 'admin') {
      prefix = data.isSuperAdmin === true ? ID_PREFIXES.SUPER_ADMIN : ID_PREFIXES.ADMIN;
    } else if (data.role === 'operator') {
      prefix = ID_PREFIXES.OPERATOR;
    }

    const newId = `${prefix}-${oldId}`;
    userMap[oldId] = newId;
  });

  console.log(`Mapped ${Object.keys(userMap).length} users.`);

  // -------------------------------------------------------------------------
  // 2. Build Catalog & Workflow Maps
  // -------------------------------------------------------------------------
  console.log('\nStep 2: Mapping workflow templates and services...');
  const wflSnap = await db.collection('workflowTemplates').get();
  wflSnap.forEach(doc => {
    const oldId = doc.id;
    workflowTemplateMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.WORKFLOW_TEMPLATE}-${oldId}`;
  });

  const srvSnap = await db.collection('services').get();
  srvSnap.forEach(doc => {
    const oldId = doc.id;
    serviceMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.SERVICE}-${oldId}`;
  });

  // -------------------------------------------------------------------------
  // 3. Build Operation & Support Maps
  // -------------------------------------------------------------------------
  const tktSnap = await db.collection('tickets').get();
  tktSnap.forEach(doc => {
    const oldId = doc.id;
    ticketMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.TICKET}-${oldId}`;
  });

  const aptSnap = await db.collection('appointments').get();
  aptSnap.forEach(doc => {
    const oldId = doc.id;
    appointmentMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.APPOINTMENT}-${oldId}`;
  });

  const resSnap = await db.collection('resources').get();
  resSnap.forEach(doc => {
    const oldId = doc.id;
    resourceMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.RESOURCE}-${oldId}`;
  });

  const cnvSnap = await db.collection('conversations').get();
  cnvSnap.forEach(doc => {
    const oldId = doc.id;
    conversationMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.CONVERSATION}-${oldId}`;
  });

  const annSnap = await db.collection('announcements').get();
  annSnap.forEach(doc => {
    const oldId = doc.id;
    announcementMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.ANNOUNCEMENT}-${oldId}`;
  });

  const qapSnap = await db.collection('qualificationApplications').get();
  qapSnap.forEach(doc => {
    const oldId = doc.id;
    qualificationMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.QUALIFICATION}-${oldId}`;
  });

  const fraSnap = await db.collection('franchiseApplications').get();
  fraSnap.forEach(doc => {
    const oldId = doc.id;
    franchiseMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.FRANCHISE}-${oldId}`;
  });

  const inqSnap = await db.collection('inquiries').get();
  inqSnap.forEach(doc => {
    const oldId = doc.id;
    inquiryMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.INQUIRY}-${oldId}`;
  });

  const qtnSnap = await db.collection('quotations').get();
  qtnSnap.forEach(doc => {
    const oldId = doc.id;
    quotationMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.QUOTATION}-${oldId}`;
  });

  const svcSnap = await db.collection('activeServices').get();
  svcSnap.forEach(doc => {
    const oldId = doc.id;
    activeServiceMap[oldId] = parsePrefix(oldId) ? oldId : `${ID_PREFIXES.ACTIVE_SERVICE}-${oldId}`;
  });

  console.log(`Mappings Summary:`);
  console.log(`- Services: ${Object.keys(serviceMap).length}`);
  console.log(`- Workflow Templates: ${Object.keys(workflowTemplateMap).length}`);
  console.log(`- Tickets: ${Object.keys(ticketMap).length}`);
  console.log(`- Appointments: ${Object.keys(appointmentMap).length}`);
  console.log(`- Conversations: ${Object.keys(conversationMap).length}`);
  console.log(`- Active Services: ${Object.keys(activeServiceMap).length}`);

  // -------------------------------------------------------------------------
  // 4. Migrate Firebase Auth Users
  // -------------------------------------------------------------------------
  console.log('\nStep 3: Migrating Firebase Auth users with preserved credentials...');
  const authList = await auth.listUsers(1000);
  
  for (const authUser of authList.users) {
    const oldUid = authUser.uid;
    const newUid = userMap[oldUid] || (parsePrefix(oldUid) ? oldUid : `${ID_PREFIXES.CLIENT}-${oldUid}`);
    userMap[oldUid] = newUid;

    if (oldUid === newUid) {
      console.log(`  ✓ Auth user ${authUser.email} already has prefixed UID (${oldUid})`);
      continue;
    }

    console.log(`  Migrating Auth: ${authUser.email} (${oldUid} -> ${newUid})`);
    if (!isDryRun) {
      try {
        // 1. Rename existing user email to temporary alias so import won't clash
        const tempEmail = `migrating_${Date.now()}_${authUser.email}`;
        await auth.updateUser(oldUid, { email: tempEmail });

        // 2. Import user with new prefixed UID and original credentials
        const importPayload = {
          uid: newUid,
          email: authUser.email,
          emailVerified: Boolean(authUser.emailVerified),
          disabled: Boolean(authUser.disabled)
        };

        if (authUser.displayName) importPayload.displayName = authUser.displayName;
        if (authUser.phoneNumber) importPayload.phoneNumber = authUser.phoneNumber;

        if (authUser.passwordHash && authUser.passwordSalt) {
          importPayload.passwordHash = Buffer.from(authUser.passwordHash, 'base64');
          importPayload.passwordSalt = Buffer.from(authUser.passwordSalt, 'base64');
        }

        const importResult = await auth.importUsers([importPayload], {
          hash: {
            algorithm: 'SCRYPT',
            key: Buffer.from('ORPufA3/n2LE+EQAQgXnBs8EsnE0LdDYkKooJFiXwXlDZxER8WpnzdCul3zqb1bcaJCdXUIozE41mJzMYxHD9A==', 'base64'),
            saltSeparator: Buffer.from('Bw==', 'base64'),
            rounds: 8,
            memoryCost: 14
          }
        });

        if (importResult.failureCount > 0) {
          console.error(`  ✕ Failed to import user ${authUser.email}:`, importResult.errors);
          // Rollback email
          await auth.updateUser(oldUid, { email: authUser.email });
          continue;
        }

        // 3. Delete old user from Auth
        await auth.deleteUser(oldUid);
        console.log(`  ✓ Successfully migrated Auth user ${authUser.email}`);
      } catch (authErr) {
        console.error(`  ✕ Error migrating Auth user ${authUser.email}:`, authErr.message);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. Migrate Firestore Users Collection
  // -------------------------------------------------------------------------
  console.log('\nStep 4: Migrating Firestore users collection...');
  for (const doc of usersSnapshot.docs) {
    const oldId = doc.id;
    const newId = userMap[oldId] || oldId;
    if (oldId === newId) continue;

    const data = doc.data();
    // Update any foreign keys inside user profile (e.g. assignedOperators)
    const updatedData = { ...data };
    if (Array.isArray(updatedData.assignedOperators)) {
      updatedData.assignedOperators = updatedData.assignedOperators.map(opId => userMap[opId] || opId);
    }
    if (updatedData.createdBySuperAdmin && userMap[updatedData.createdBySuperAdmin]) {
      updatedData.createdBySuperAdmin = userMap[updatedData.createdBySuperAdmin];
    }

    console.log(`  Firestore users: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('users').doc(newId).set(updatedData);
      await db.collection('users').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 6. Migrate Workflow Templates
  // -------------------------------------------------------------------------
  console.log('\nStep 5: Migrating workflow templates...');
  for (const doc of wflSnap.docs) {
    const oldId = doc.id;
    const newId = workflowTemplateMap[oldId];
    if (oldId === newId) continue;

    console.log(`  workflowTemplates: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('workflowTemplates').doc(newId).set(doc.data());
      await db.collection('workflowTemplates').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 7. Migrate Services
  // -------------------------------------------------------------------------
  console.log('\nStep 6: Migrating services catalog...');
  for (const doc of srvSnap.docs) {
    const oldId = doc.id;
    const newId = serviceMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      branchUid: userMap[data.branchUid] || data.branchUid || null,
      createdByOperatorId: userMap[data.createdByOperatorId] || data.createdByOperatorId || null,
      workflowIds: Array.isArray(data.workflowIds)
        ? data.workflowIds.map(wId => workflowTemplateMap[wId] || wId)
        : []
    };

    console.log(`  services: ${oldId} -> ${newId} (workflowIds: ${JSON.stringify(updatedData.workflowIds)})`);
    if (!isDryRun) {
      await db.collection('services').doc(newId).set(updatedData);
      await db.collection('services').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 8. Migrate Quick Links
  // -------------------------------------------------------------------------
  console.log('\nStep 7: Migrating quick links...');
  const qlkSnap = await db.collection('quickLinks').get();
  for (const doc of qlkSnap.docs) {
    const oldId = doc.id;
    if (parsePrefix(oldId)) continue;
    const newId = `${ID_PREFIXES.QUICK_LINK}-${oldId}`;

    console.log(`  quickLinks: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('quickLinks').doc(newId).set(doc.data());
      await db.collection('quickLinks').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 9. Migrate Support Tickets
  // -------------------------------------------------------------------------
  console.log('\nStep 8: Migrating support tickets...');
  for (const doc of tktSnap.docs) {
    const oldId = doc.id;
    const newId = ticketMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedMessages = Array.isArray(data.messages)
      ? data.messages.map(m => ({
          ...m,
          senderId: userMap[m.senderId] || m.senderId
        }))
      : [];

    const updatedData = {
      ...data,
      operatorId: userMap[data.operatorId] || data.operatorId,
      operatorUid: userMap[data.operatorUid] || data.operatorUid || null,
      clientUid: userMap[data.clientUid] || data.clientUid || null,
      closedBy: userMap[data.closedBy] || data.closedBy || null,
      messages: updatedMessages
    };

    console.log(`  tickets: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('tickets').doc(newId).set(updatedData);
      await db.collection('tickets').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 10. Migrate Appointments
  // -------------------------------------------------------------------------
  console.log('\nStep 9: Migrating appointments...');
  for (const doc of aptSnap.docs) {
    const oldId = doc.id;
    const newId = appointmentMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      clientUid: userMap[data.clientUid] || data.clientUid,
      branchUid: userMap[data.branchUid] || data.branchUid
    };

    console.log(`  appointments: ${oldId} -> ${newId} (client: ${updatedData.clientUid}, branch: ${updatedData.branchUid})`);
    if (!isDryRun) {
      await db.collection('appointments').doc(newId).set(updatedData);
      await db.collection('appointments').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 11. Migrate Resources
  // -------------------------------------------------------------------------
  console.log('\nStep 10: Migrating resources...');
  for (const doc of resSnap.docs) {
    const oldId = doc.id;
    const newId = resourceMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      uploadedByUid: userMap[data.uploadedByUid] || data.uploadedByUid
    };

    console.log(`  resources: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('resources').doc(newId).set(updatedData);
      await db.collection('resources').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 12. Migrate Conversations & Messages
  // -------------------------------------------------------------------------
  console.log('\nStep 11: Migrating conversations & messages subcollections...');
  for (const doc of cnvSnap.docs) {
    const oldId = doc.id;
    const newId = conversationMap[oldId];
    const data = doc.data();

    const updatedParticipants = Array.isArray(data.participants)
      ? data.participants.map(p => userMap[p] || p)
      : [];

    const updatedUnread = {};
    if (data.unreadCount && typeof data.unreadCount === 'object') {
      for (const [k, v] of Object.entries(data.unreadCount)) {
        updatedUnread[userMap[k] || k] = v;
      }
    }

    const updatedData = {
      ...data,
      participants: updatedParticipants,
      unreadCount: updatedUnread,
      lastMessageSenderId: userMap[data.lastMessageSenderId] || data.lastMessageSenderId || null
    };

    console.log(`  conversations: ${oldId} -> ${newId} (participants: ${JSON.stringify(updatedParticipants)})`);

    // Fetch messages subcollection
    const msgsSnap = await doc.ref.collection('messages').get();

    if (!isDryRun) {
      const newConvRef = db.collection('conversations').doc(newId);
      await newConvRef.set(updatedData);

      for (const msgDoc of msgsSnap.docs) {
        const oldMsgId = msgDoc.id;
        const newMsgId = parsePrefix(oldMsgId) ? oldMsgId : `${ID_PREFIXES.MESSAGE}-${oldMsgId}`;
        const msgData = msgDoc.data();
        const updatedMsg = {
          ...msgData,
          senderId: userMap[msgData.senderId] || msgData.senderId
        };
        await newConvRef.collection('messages').doc(newMsgId).set(updatedMsg);
        await msgDoc.ref.delete();
      }

      await doc.ref.delete();
    }
  }

  // -------------------------------------------------------------------------
  // 13. Migrate Announcements
  // -------------------------------------------------------------------------
  console.log('\nStep 12: Migrating announcements...');
  for (const doc of annSnap.docs) {
    const oldId = doc.id;
    const newId = announcementMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      authorUid: userMap[data.authorUid] || data.authorUid
    };

    console.log(`  announcements: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('announcements').doc(newId).set(updatedData);
      await db.collection('announcements').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 14. Migrate Qualification Applications
  // -------------------------------------------------------------------------
  console.log('\nStep 13: Migrating qualification applications...');
  for (const doc of qapSnap.docs) {
    const oldId = doc.id;
    const newId = qualificationMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      operatorId: userMap[data.operatorId] || data.operatorId,
      reviewedBy: userMap[data.reviewedBy] || data.reviewedBy || null
    };

    console.log(`  qualificationApplications: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('qualificationApplications').doc(newId).set(updatedData);
      await db.collection('qualificationApplications').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 15. Migrate Franchise Applications
  // -------------------------------------------------------------------------
  console.log('\nStep 14: Migrating franchise applications...');
  for (const doc of fraSnap.docs) {
    const oldId = doc.id;
    const newId = franchiseMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      userId: userMap[data.userId] || data.userId || 'anonymous'
    };

    console.log(`  franchiseApplications: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('franchiseApplications').doc(newId).set(updatedData);
      await db.collection('franchiseApplications').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 16. Migrate Active Services
  // -------------------------------------------------------------------------
  console.log('\nStep 15: Migrating active services...');
  for (const doc of svcSnap.docs) {
    const oldId = doc.id;
    const newId = activeServiceMap[oldId];
    if (oldId === newId) continue;

    const data = doc.data();
    const updatedData = {
      ...data,
      clientUid: userMap[data.clientUid] || data.clientUid || null,
      operatorId: userMap[data.operatorId] || data.operatorId,
      branchUid: userMap[data.branchUid] || data.branchUid,
      serviceId: serviceMap[data.serviceId] || data.serviceId || null,
      serviceUID: serviceMap[data.serviceUID] || data.serviceUID || null,
      inquiryId: inquiryMap[data.inquiryId] || data.inquiryId || null,
      quotationId: quotationMap[data.quotationId] || data.quotationId || null
    };

    console.log(`  activeServices: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('activeServices').doc(newId).set(updatedData);
      await db.collection('activeServices').doc(oldId).delete();
    }
  }

  // -------------------------------------------------------------------------
  // 17. Migrate Notifications
  // -------------------------------------------------------------------------
  console.log('\nStep 16: Migrating notifications...');
  const notifSnap = await db.collection('notifications').get();
  for (const doc of notifSnap.docs) {
    const oldId = doc.id;
    if (parsePrefix(oldId)) continue;
    const newId = `${ID_PREFIXES.NOTIFICATION}-${oldId}`;
    const data = doc.data();

    const updatedMetadata = { ...(data.metadata || {}) };
    if (updatedMetadata.serviceId && serviceMap[updatedMetadata.serviceId]) {
      updatedMetadata.serviceId = serviceMap[updatedMetadata.serviceId];
    }
    if (updatedMetadata.appointmentId && appointmentMap[updatedMetadata.appointmentId]) {
      updatedMetadata.appointmentId = appointmentMap[updatedMetadata.appointmentId];
    }
    if (updatedMetadata.resourceId && resourceMap[updatedMetadata.resourceId]) {
      updatedMetadata.resourceId = resourceMap[updatedMetadata.resourceId];
    }
    if (updatedMetadata.ticketId && ticketMap[updatedMetadata.ticketId]) {
      updatedMetadata.ticketId = ticketMap[updatedMetadata.ticketId];
    }
    if (updatedMetadata.announcementId && announcementMap[updatedMetadata.announcementId]) {
      updatedMetadata.announcementId = announcementMap[updatedMetadata.announcementId];
    }

    const updatedData = {
      ...data,
      recipientUid: userMap[data.recipientUid] || data.recipientUid || null,
      userId: userMap[data.userId] || data.userId || null,
      metadata: updatedMetadata
    };

    if (!isDryRun) {
      await db.collection('notifications').doc(newId).set(updatedData);
      await db.collection('notifications').doc(oldId).delete();
    }
  }
  console.log(`  Migrated ${notifSnap.size} notifications.`);

  // -------------------------------------------------------------------------
  // 18. Migrate Chatbot FAQs
  // -------------------------------------------------------------------------
  console.log('\nStep 17: Migrating chatbot FAQs...');
  const faqSnap = await db.collection('chatbotFaqs').get();
  for (const doc of faqSnap.docs) {
    const oldId = doc.id;
    if (parsePrefix(oldId)) continue;
    const newId = `${ID_PREFIXES.FAQ}-${oldId}`;

    console.log(`  chatbotFaqs: ${oldId} -> ${newId}`);
    if (!isDryRun) {
      await db.collection('chatbotFaqs').doc(newId).set(doc.data());
      await db.collection('chatbotFaqs').doc(oldId).delete();
    }
  }

  console.log('\n===============================================================');
  console.log(`Migration Complete! ${isDryRun ? '[DRY RUN FINISHED - NO WRITES PERFORMED]' : '[ALL RECORDS SUCCESSFULLY MIGRATED]'}`);
  console.log('===============================================================\n');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed with fatal error:', err);
    process.exit(1);
  });
