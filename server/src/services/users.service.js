const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelOtp = require('../models/otp.model');
// const modelMessageChatbot = require('../models/messageChatbot.model');
// const { askHotelAssistant } = require('../utils/chatbot');

const { createToken, createRefreshToken, createApiKey, verifyToken } = require('../utils/jwt');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

const { ConflictRequestError, BadRequestError } = require('../core/error.response');

const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const SendMailForgotPassword = require('../utils/sendMailForgotPassword');
const { uploadSingle, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinaryUpload');

class UserService {
    async createUser(data) {
        const { fullName, email, password } = data;
        const findUser = await modelUser.findOne({ email });
        if (findUser) {
            throw new ConflictRequestError('Email đã tồn tại');
        }

        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(password, salt);

        // Tạo user mới
        const newUser = await modelUser.create({
            fullName,
            email,
            password: passwordHash,
            typeLogin: 'email',
        });

        // Tạo API key và token
        await createApiKey(newUser._id);
        const token = await createToken({ id: newUser._id });
        const refreshToken = await createRefreshToken({ id: newUser._id });

        return { token, refreshToken };
    }

    async authUser(id) {
        const findUser = await modelUser.findById(id);
        if (!findUser) {
            throw new BadRequestError('User không tồn tại');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        return auth;
    }

    async login(data) {
        const { email, password } = data;
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        if (user.typeLogin === 'google') {
            throw new BadRequestError('Tài khoản đăng nhập bằng google');
        }

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        await createApiKey(user._id);
        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });
        return { token, refreshToken };
    }

    async logout(id) {
        await modelApiKey.deleteMany({ userId: id });
        return { status: 200 };
    }

    async refreshToken(refreshToken) {
        const decoded = await verifyToken(refreshToken);

        const user = await modelUser.findOne({ _id: decoded.id });

        const token = await createToken({ id: user._id });
        return { token };
    }

    async getAllUser() {
        const data = await modelUser.find();
        return data;
    }

    async updateUserAdmin(id, data) {
        const { fullName, email, phone, address, isAdmin, typeLogin } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        user.fullName = fullName;
        user.email = email;
        user.phone = phone;
        user.address = address;
        user.isAdmin = isAdmin;
        user.typeLogin = typeLogin;
        await user.save();
        return user;
    }

    async deleteUser(id) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        await user.deleteOne();
        return user;
    }

    async changePassword(id, data) {
        const { currentPassword, newPassword } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Mật khẩu hiện tại không chính xác');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async updateUser(id, data) {
        const { fullName, address, phone, birthDay, email } = data;
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }
        user.fullName = fullName;
        user.address = address;
        user.phone = phone;
        user.birthDay = birthDay;
        user.email = email;
        await user.save();
        return user;
    }

    async uploadAvatar(id, file) {
        const user = await modelUser.findOne({ _id: id });
        if (!user) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        if (!file) {
            throw new BadRequestError('Vui lòng chọn ảnh đại diện');
        }

        const avatarUrl = await uploadSingle(file, 'avatars');

        if (user.avatar) {
            const publicId = getPublicIdFromUrl(user.avatar);
            if (publicId) {
                await deleteFromCloudinary(publicId);
            }
        }

        user.avatar = avatarUrl;
        await user.save();
        return user;
    }

    async loginGoogle(credential) {
        const dataToken = jwtDecode(credential);
        const user = await modelUser.findOne({ email: dataToken.email });

        if (user) {
            await createApiKey(user._id);
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });
            return { token, refreshToken };
        } else {
            const newUser = await modelUser.create({
                email: dataToken.email,
                typeLogin: 'google',
                fullName: dataToken.name,
            });
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            return { token, refreshToken };
        }
    }

    async forgotPassword(email) {
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }

        const token = jwt.sign({ id: user._id }, process.env.SECRET_CRYPTO, { expiresIn: '5m' });

        const otp = otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        const otpHash = bcrypt.hashSync(otp, saltRounds);

        await modelOtp.create({ email: user.email, otp: otpHash });

        await SendMailForgotPassword(user.email, otp);

        return { token, otp };
    }

    async resetPassword(token, otpUser, newPassword) {
        const decoded = jwt.verify(token, process.env.SECRET_CRYPTO);
        const user = await modelUser.findOne({ _id: decoded.id });

        if (!user) {
            throw new BadRequestError('Tài khoản không tồn tại');
        }
        const findOtp = await modelOtp.findOne({ email: user.email }).sort({ createdAt: -1 });

        if (!findOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }

        const checkOtp = bcrypt.compareSync(otpUser, findOtp.otp);
        if (!checkOtp) {
            throw new BadRequestError('Mã OTP không hợp lệ');
        }
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const passwordHash = bcrypt.hashSync(newPassword, salt);
        user.password = passwordHash;
        await user.save();
        return user;
    }

    async chatbot(question, userId) {
        const response = await askHotelAssistant(question);

        await modelMessageChatbot.create({
            userId: userId,
            sender: 'user',
            content: question,
        });

        await modelMessageChatbot.create({
            userId: userId,
            sender: 'bot',
            content: response,
        });

        return response;
    }

    async getMessageChatbot(userId) {
        const messageChatbot = await modelMessageChatbot.find({ userId });
        return messageChatbot;
    }

    // ─── [ADMIN] Lấy danh sách tất cả user ───
    async getAllUsers({ search, isActive, role, page = 1, limit = 20 }) {
        const filter = {};
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }
        if (isActive !== undefined && isActive !== 'all') {
            filter.isActive = isActive === 'true' || isActive === true;
        }
        if (role && role !== 'all') {
            filter.role = role;
        }

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            modelUser.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            modelUser.countDocuments(filter),
        ]);

        return { users, total, page, limit };
    }

    // ─── [ADMIN] Khóa / Mở khóa tài khoản ───
    async toggleUserStatus(userId, isActive) {
        const user = await modelUser.findById(userId).select('-password');
        if (!user) throw new BadRequestError('Người dùng không tồn tại');
        if (user.role === 'admin') throw new BadRequestError('Không thể khóa tài khoản Admin');
        user.isActive = isActive;
        await user.save();
        return user;
    }

    // ─── [ADMIN] Reset mật khẩu người dùng ───
    async adminResetPassword(userId, newPassword) {
        const user = await modelUser.findById(userId);
        if (!user) throw new BadRequestError('Người dùng không tồn tại');
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        user.password = bcrypt.hashSync(newPassword, salt);
        await user.save();
        return { message: 'Đã reset mật khẩu thành công' };
    }

    // ─── [ADMIN] Lấy lịch sử mua hàng của 1 user ───
    async getUserOrderHistory(userId, { page = 1, limit = 10 }) {
        const Order = require('../models/order.model');
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order.find({ user: userId })
                .populate('items.product', 'name images price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ user: userId }),
        ]);
        return { orders, total, page, limit };
    }

    // ─── [ADMIN] Thống kê user ───
    async getUserStats() {
        const [total, active, locked, customers, sellers] = await Promise.all([
            modelUser.countDocuments(),
            modelUser.countDocuments({ isActive: true }),
            modelUser.countDocuments({ isActive: false }),
            modelUser.countDocuments({ role: 'customer' }),
            modelUser.countDocuments({ role: 'seller' }),
        ]);
        return { total, active, locked, customers, sellers };
    }

    // ─── Địa chỉ giao hàng ───────────────────────────────────────────────────

    async getAddresses(userId) {
        const user = await modelUser.findById(userId).select('addresses');
        if (!user) throw new BadRequestError('Người dùng không tồn tại');
        return user.addresses;
    }

    async addAddress(userId, data) {
        const { fullName, phone, address, city, district, ward, provinceId, districtId, wardCode } = data;
        const user = await modelUser.findById(userId);
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        // Nếu chưa có địa chỉ nào → tự đặt làm mặc định
        const isDefault = user.addresses.length === 0;

        user.addresses.push({
            fullName,
            phone,
            detail: address, // map "address" → "detail" theo schema
            province: city,
            district,
            ward,
            provinceId,
            districtId,
            wardCode,
            isDefault,
        });

        await user.save();
        return user.addresses;
    }

    async updateAddress(userId, addressId, data) {
        const { fullName, phone, address, city, district, ward, provinceId, districtId, wardCode } = data;
        const user = await modelUser.findById(userId);
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        const addr = user.addresses.id(addressId);
        if (!addr) throw new BadRequestError('Địa chỉ không tồn tại');

        addr.fullName = fullName ?? addr.fullName;
        addr.phone = phone ?? addr.phone;
        addr.detail = address ?? addr.detail;
        addr.province = city ?? addr.province;
        addr.district = district ?? addr.district;
        addr.ward = ward ?? addr.ward;
        addr.provinceId = provinceId ?? addr.provinceId;
        addr.districtId = districtId ?? addr.districtId;
        addr.wardCode = wardCode ?? addr.wardCode;

        await user.save();
        return user.addresses;
    }

    async deleteAddress(userId, addressId) {
        const user = await modelUser.findById(userId);
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        const addr = user.addresses.id(addressId);
        if (!addr) throw new BadRequestError('Địa chỉ không tồn tại');

        const wasDefault = addr.isDefault;
        addr.deleteOne();

        // Nếu xóa địa chỉ mặc định → gán cho địa chỉ đầu tiên còn lại
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        return user.addresses;
    }

    async setDefaultAddress(userId, addressId) {
        const user = await modelUser.findById(userId);
        if (!user) throw new BadRequestError('Người dùng không tồn tại');

        const addr = user.addresses.id(addressId);
        if (!addr) throw new BadRequestError('Địa chỉ không tồn tại');

        user.addresses.forEach((a) => {
            a.isDefault = false;
        });
        addr.isDefault = true;

        await user.save();
        return user.addresses;
    }
}

module.exports = new UserService();
