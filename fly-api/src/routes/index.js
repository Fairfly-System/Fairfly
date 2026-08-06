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

module.exports = router;
