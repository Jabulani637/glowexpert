const { z } = require('zod');

const giftCardCheckSchema = z.object({
  code: z.string().min(4).max(32)
});

module.exports = {
  giftCardCheckSchema
};
