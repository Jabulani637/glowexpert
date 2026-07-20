const express = require('express');

const { clerkMiddleware, requireAdminRole } = require('../auth/clerkMiddleware');
const { createHelpCentreMessage, listHelpCentreMessages, markHelpCentreMessageHandled } = require('../models/HelpCentreMessage');
const { z } = require('zod');

const router = express.Router();

const helpCentreMessageCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(190),
  phone: z.string().min(4).max(64).optional().nullable(),
  topic: z.string().max(160).optional().nullable(),
  message: z.string().min(5).max(4000)
});

router.post('/help-centre/messages', async (req, res) => {
  try {
    const parsed = helpCentreMessageCreateSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid message payload' });
    }

    const data = await createHelpCentreMessage(parsed.data);
    return res.status(201).json({ data });
  } catch (err) {
    console.error('help-centre/messages create error:', err?.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin endpoints (Clerk only)
router.get(
  '/admin/help-centre/messages',
  clerkMiddleware(),
  requireAdminRole,
  async (req, res) => {
    try {
      const limit = req.query?.limit ? Number(req.query.limit) : 200;
      const data = await listHelpCentreMessages({ limit });
      return res.json({ data });
    } catch (err) {
      console.error('help-centre/messages list error:', err?.message || err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

router.put(
  '/admin/help-centre/messages/:id/handled',
  clerkMiddleware(),
  requireAdminRole,
  async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Invalid id' });

      const data = await markHelpCentreMessageHandled(id);
      if (!data) return res.status(404).json({ message: 'Not found' });

      return res.json({ data });
    } catch (err) {
      console.error('help-centre/messages handled error:', err?.message || err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

module.exports = router;



