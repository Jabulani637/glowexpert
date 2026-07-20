const express = require('express');
const { registerSchema, loginSchema } = require('../validation/authSchemas');
const { register, login, socialAuth } = require('../controllers/authController');

const router = express.Router();

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return register(req, res);
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ message: 'Validation failed', errors: parsed.error.flatten() });
  }
  return login(req, res);
});



router.post('/social', socialAuth);


module.exports = router;


