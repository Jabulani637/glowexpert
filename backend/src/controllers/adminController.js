const { updateSettings, getAllSettings } = require('../models/SiteSettings');
const { listSubscribers } = require('../models/Subscriber');
const { listOrders, listCustomers } = require('../models/Order');
const { listReviews, createReview, deleteReview } = require('../models/Review');

async function getSettingsController(req, res) {
  const data = await getAllSettings();
  return res.json({ data });
}

async function updateSettingsController(req, res) {
  const data = await updateSettings(req.body || {});
  return res.json({ data });
}

async function getSubscribers(req, res) {
  const data = await listSubscribers();
  return res.json({ data });
}

async function getOrders(req, res) {
  const data = await listOrders();
  return res.json({ data });
}

async function getCustomers(req, res) {
  const data = await listCustomers();
  return res.json({ data });
}

async function getReviews(req, res) {
  const data = await listReviews({ onlyPublished: false });
  return res.json({ data });
}

async function addReview(req, res) {
  const data = await createReview(req.body);
  return res.status(201).json({ data });
}

async function removeReview(req, res) {
  await deleteReview(req.params.id);
  return res.status(204).send();
}

module.exports = {
  getSettingsController,
  updateSettingsController,
  getSubscribers,
  getOrders,
  getCustomers,
  getReviews,
  addReview,
  removeReview
};
