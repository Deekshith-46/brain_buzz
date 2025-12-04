// middlewares/validators/couponValidator.js
const { body, param } = require('express-validator');

exports.validateCouponCreation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 4, max: 20 })
    .withMessage('Coupon code must be between 4 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Coupon code can only contain uppercase letters, numbers, and hyphens'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Invalid discount type'),

  body('discountValue')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),

  body('maxDiscount')
    .if(body('discountType').equals('percentage'))
    .isFloat({ min: 0.01 })
    .withMessage('Maximum discount is required for percentage discounts')
    .custom((value, { req }) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Maximum discount must be greater than 0');
      }
      return true;
    }),

  body('minPurchaseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount must be 0 or greater'),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum uses must be a positive integer'),

  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date')
    .custom((value, { req }) => {
      if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('validUntil')
    .isISO8601()
    .withMessage('Invalid expiry date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.body.validFrom && new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Expiry date must be after start date');
      }
      return true;
    }),

  body('applicableItems')
    .optional()
    .isArray()
    .withMessage('Applicable items must be an array')
    .custom((items) => {
      if (!Array.isArray(items)) return true;
      
      return items.every(item => {
        if (!['test_series', 'online_course', 'all'].includes(item.itemType)) {
          throw new Error('Invalid item type in applicable items');
        }
        return true;
      });
    })
];

exports.validateCouponUpdate = [
  param('couponId')
    .isMongoId()
    .withMessage('Invalid coupon ID'),

  body('discountValue')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),

  body('maxDiscount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Maximum discount must be greater than 0'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
];