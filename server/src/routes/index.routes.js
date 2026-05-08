const userRoutes = require('./users.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const couponRoutes = require('./coupon.routes');
const reviewRoutes = require('./review.routes');
const storeRoutes = require('./store.routes');
const sellerRoutes = require('./seller.routes');
const chatRoutes = require('./chat.routes');
const notificationRoutes = require('./notification.routes');
const ghnRoutes = require('./ghn.routes');
const wishlistRoutes = require('./wishlist.routes');
const reportRoutes = require('./report.routes');
const walletRoutes = require('./wallet.routes');
const bannerRoutes = require('./banner.routes');
const uploadRoutes = require('./upload.routes');
const returnRoutes = require('./return.routes');
const aiRoutes = require('./ai.routes');

function routes(app) {
    app.use('/api/users', userRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/coupons', couponRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/stores', storeRoutes);
    app.use('/api/seller', sellerRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/notifications', notificationRoutes);

    app.use('/api/ghn', ghnRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/wallet', walletRoutes);
    app.use('/api/banners', bannerRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/returns', returnRoutes);
    app.use('/api/ai', aiRoutes);
}

module.exports = routes;
