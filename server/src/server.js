const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.URL_CLIENT,
        credentials: true,
    },
});

const port = 3001;

const connectDB = require('./config/connectDB');
const routes = require('./routes/index.routes');
const { initSocket } = require('./socket');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: process.env.URL_CLIENT, credentials: true }));
app.use(express.static(path.join(__dirname, '../src')));

routes(app);

// Khởi động Socket.io
initSocket(io);

// Khởi chạy cron job tự động xác nhận đã nhận hàng
const startAutoConfirmReceivedJob = require('./cron/autoConfirmJob');
startAutoConfirmReceivedJob();

// Export io để dùng ở service nếu cần
app.set('io', io);
global.io = io;

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server',
    });
});

httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
