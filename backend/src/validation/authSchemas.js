const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(190),
  cellphone: z.string().min(6).max(32).optional(),
  password: z.string().min(8).max(72),
  role: z.string().optional()
});

const loginSchema = z.object({
  cellphone: z.string().min(3).max(120), // Accepts email or cellphone
  password: z.string().min(8).max(72)
});

const influencerAdminCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(190),
  cellphone: z.string().min(6).max(32).optional().nullable(),
  commission_rate: z.number().min(0).max(100).optional()
});

module.exports = { registerSchema, loginSchema };
module.exports.influencerAdminCreateSchema = influencerAdminCreateSchema;
