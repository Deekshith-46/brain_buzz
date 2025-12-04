// src/models/Order/Order.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  itemType: {
    type: String,
    enum: ['testSeries', 'course'],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'items.itemType'
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  }
}, { _id: false });

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  items: [orderItemSchema],
  coupon: {
    code: String,
    discountType: String,
    discountValue: Number,
    maxDiscount: Number
  },
  paymentDetails: Object,
  shippingAddress: Object,
  billingAddress: Object
}, { timestamps: true });

// Add pagination plugin
orderSchema.plugin(mongoosePaginate);

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ paymentId: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;