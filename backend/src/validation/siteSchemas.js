const { z } = require('zod');

const subscriberSchema = z.object({
  name: z.string().min(2).max(120).optional().nullable(),
  email: z.string().email().max(190)
});

const checkoutItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(99)
});

const checkoutSchema = z.object({
  customer_name: z.string().min(2).max(120),
  customer_email: z.string().email().max(190),
  customer_phone: z.string().min(6).max(32),
  referral_code: z.string().length(8).optional()
});

module.exports = {
  subscriberSchema,
  checkoutSchema
};
