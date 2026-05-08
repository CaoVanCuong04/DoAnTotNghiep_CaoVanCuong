const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/product.model');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.CONNECT_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const cleanup = async () => {
    await connectDB();
    try {
        const res = await Product.deleteMany({ brand: 'SeedBrand' });
        console.log(`Đã xóa ${res.deletedCount} sản phẩm cũ.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
cleanup();
