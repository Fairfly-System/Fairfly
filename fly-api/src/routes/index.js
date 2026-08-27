const express = require('express');
const router = express.Router();

const franchiseRoutes = require('./franchiseRoutes');
const serviceRoutes = require('./serviceRoutes');
const operatorRoutes = require('./operatorRoutes');
const workflowRoutes = require('./workflowRoutes');
const chatRoutes = require('./chatRoutes');
const uploadRoutes = require('./uploadRoutes');
const ticketRoutes = require('./ticketRoutes');
const inquiryRoutes = require('./inquiryRoutes');
const quotationRoutes = require('./quotationRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');
const resourceRoutes = require('./resourceRoutes');
const authRoutes = require('./authRoutes');
const qualificationRoutes = require('./qualificationRoutes');

router.use('/auth', authRoutes);
router.use('/qualifications', qualificationRoutes);
router.use('/franchise', franchiseRoutes);
router.use('/services', serviceRoutes);
router.use('/operators', operatorRoutes);
router.use('/workflows', workflowRoutes);
router.use('/workflow', workflowRoutes); // Support both /workflow and /workflows
router.use('/chats', chatRoutes);
router.use('/upload', uploadRoutes);
router.use('/tickets', ticketRoutes);
router.use('/inquiries', inquiryRoutes);
router.use('/quotations', quotationRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/admins', adminRoutes);
router.use('/admin/admins', adminRoutes); // Backward compatibility alias
router.use('/notifications', notificationRoutes);
router.use('/resources', resourceRoutes);
router.use('/services/resources', resourceRoutes); // Backward compatibility alias

module.exports = router;
