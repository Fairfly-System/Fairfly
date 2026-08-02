const express = require('express');
const router = express.Router();

const franchiseRoutes = require('./franchiseRoutes');
const serviceRoutes = require('./serviceRoutes');
const operatorRoutes = require('./operatorRoutes');
const workflowRoutes = require('./workflowRoutes');
const chatRoutes = require('./chatRoutes');

router.use('/franchise', franchiseRoutes);
router.use('/services', serviceRoutes);
router.use('/operators', operatorRoutes);
router.use('/workflows', workflowRoutes);
router.use('/workflow', workflowRoutes); // Support both /workflow and /workflows
router.use('/chats', chatRoutes);

module.exports = router;
