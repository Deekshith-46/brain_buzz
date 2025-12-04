const crypto = require('crypto');
const Razorpay = require('razorpay');
const TestSeries = require('../../models/TestSeries/TestSeries');
const User = require('../../models/User/User');
const Coupon = require('../../models/Coupon/Coupon');
const { createOrder } = require('../../utils/orderUtils');
const Order = require('../../models/Order/Order');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RPLRzNCjuNmGdU",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6"
});

// Get test series price with coupon
exports.getTestSeriesPrice = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const { couponCode } = req.query;

    const testSeries = await TestSeries.findById(testSeriesId).select('price discount finalPrice');
    if (!testSeries) {
      const error = {
        success: false,
        message: 'Test series not found'
      };
      return res ? res.status(404).json(error) : error;
    }

    // Calculate base price with test series discount
    let finalPrice = testSeries.finalPrice || testSeries.price;
    let discountApplied = 0;
    let couponDiscount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
        'applicableItems.itemId': testSeriesId
      });

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          couponDiscount = (finalPrice * coupon.discountValue) / 100;
          // Apply max discount if specified
          if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
            couponDiscount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'fixed') {
          couponDiscount = coupon.discountValue;
        }
        // Ensure coupon discount doesn't make price negative
        finalPrice = Math.max(0, finalPrice - couponDiscount);
        discountApplied = testSeries.price - finalPrice;
      }
    }

    const response = {
      success: true,
      data: {
        originalPrice: testSeries.price,
        finalPrice, // In Rupees
        discountApplied,
        coupon: coupon ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount
        } : null
      }
    };

    // If res is provided (normal HTTP request), use it
    if (res && typeof res.json === 'function') {
      return res.json(response);
    }

    // If no res object (internal call), return the response directly
    return response;

  } catch (error) {
    console.error('Error getting test series price:', error);
    const errorResponse = {
      success: false,
      message: 'Error getting test series price',
      error: error.message
    };

    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorResponse);
    }

    return errorResponse;
  }
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { testSeriesId, couponCode } = req.body;
    const userId = req.user._id;

    // First, get the test series to ensure it exists
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    // Get price details
    const priceResponse = await exports.getTestSeriesPrice(
      {
        params: { testSeriesId },
        query: { couponCode }
      },
      { json: (data) => data } // Mock response object
    );

    if (!priceResponse || !priceResponse.success) {
      return res.status(400).json({
        success: false,
        message: priceResponse?.message || 'Failed to get price details'
      });
    }

    const { finalPrice } = priceResponse.data;

    // Create Razorpay order
    const options = {
      amount: Math.round(finalPrice * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
      notes: {
        testSeriesId: testSeriesId.toString(),
        userId: userId.toString(),
        couponCode: couponCode || '',
        amountInRupees: finalPrice
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: finalPrice, // In Rupees
        amountInPaise: order.amount, // In Paise
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6")
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { testSeriesId, userId, couponCode, amountInRupees } = order.notes;

    // Get price details
    const priceResponse = await exports.getTestSeriesPrice(
      {
        params: { testSeriesId },
        query: { couponCode }
      },
      { json: (data) => data } // Mock response object
    );

    if (!priceResponse || !priceResponse.success) {
      return res.status(400).json(priceResponse);
    }

    // Create order in database with amount in Rupees
    const orderData = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: priceResponse.data.finalPrice, // In Rupees
      currency: 'INR',
      status: 'completed',
      items: [{
        itemType: 'testSeries',
        itemId: testSeriesId,
        price: priceResponse.data.finalPrice // In Rupees
      }],
      coupon: priceResponse.data.coupon,
      paymentDetails: {
        ...order,
        amount: order.amount, // This is in paise
        amountInRupees: priceResponse.data.finalPrice
      }
    };

    // Save to database
    await createOrder(userId, orderData);

    // Update user's purchased test series
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { purchasedTestSeries: testSeriesId } }
    );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: priceResponse.data.finalPrice,
      currency: 'INR'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Get order history
exports.getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'items.itemId',
        // model: 'TestSeries', // Make sure this matches your model name
        select: 'name description' // Only include necessary fields
      })
      .lean();

    const total = await Order.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          ...order,
          amount: Number(order.amount),
          items: order.items.map(item => ({
            ...item,
            price: Number(item.price)
          }))
        })),
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message
    });
  }
};