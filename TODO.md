# Removal Progress Checklist - COMPLETED ✓

## Phase 1: Delete Files ✓
- [x] Delete frontend/html/sitemap.html
- [x] Delete frontend/html/unsubscribe.html
- [x] Delete frontend/html/order.html
- [x] Delete frontend/html/gift-cards.html
- [x] frontend/dist/ files (already didn't exist)
- [x] Delete backend/src/routes/giftCardRoutes.js
- [x] Delete backend/src/controllers/giftCardController.js
- [x] Delete backend/src/models/GiftCard.js
- [x] Delete backend/src/validation/giftCardSchemas.js
- [x] Delete backend/src/test/giftCardRoutes.test.js

## Phase 2: Edit Backend Files ✓
- [x] Edit backend/src/server.js - remove giftCardRoutes require, usage, and ensureGiftCardSchema
- [x] Edit backend/src/controllers/subscriberController.js - remove unsubscribe function
- [x] Edit backend/src/routes/subscriberRoutes.js - remove unsubscribe route
- [x] Edit backend/src/models/Subscriber.js - remove deleteSubscriberByEmail
- [x] Edit backend/src/validation/siteSchemas.js - remove unsubscribeSchema, orderLookupSchema
- [x] Edit backend/src/controllers/orderController.js - remove lookup function
- [x] Edit backend/src/routes/orderRoutes.js - remove lookup route
- [x] Edit backend/src/test/subscriberRoutes.test.js - remove unsubscribe test

## Phase 3: Edit Frontend Config ✓
- [x] Edit frontend/vite.config.js - remove sitemap, unsubscribe, order, giftCards entries

## Phase 4: Update Footer Links ✓
- [x] Verified: No remaining HTML pages link to sitemap, unsubscribe, order, or gift-cards pages in their footers

