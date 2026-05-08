/**
 * AI Service — Gemini-powered features
 * ─────────────────────────────────────
 * 1. AI Shopping Assistant (chat)
 * 2. AI Product Recommendations
 * 3. Natural Language Search
 * 4. Review Sentiment Analysis
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Review = require('../models/review.model');
const AICopilotHistory = require('../models/aiCopilotHistory.model');

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Shared helper ─────────────────────────────────────────────────────────
function getModel(modelName = 'gemini-2.5-flash') {
    return genai.getGenerativeModel({ model: modelName });
}

// ─── 1. AI Shopping Assistant ──────────────────────────────────────────────
/**
 * Multi-turn chat. Each session gets a new chat history.
 * System context includes current product catalog summary.
 */
async function chatWithAssistant(message, history = [], userProfile = null) {
    // 1. Tìm sản phẩm liên quan đến tin nhắn của user (keyword search)
    const keywords = message
        .toLowerCase()
        .replace(/[^\w\sÀ-ỹ]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .slice(0, 5);

    let relevantProducts = [];
    if (keywords.length > 0) {
        const orClauses = keywords.map((kw) => ({
            $or: [
                { name: { $regex: kw, $options: 'i' } },
                { brand: { $regex: kw, $options: 'i' } },
                { shortDescription: { $regex: kw, $options: 'i' } },
            ],
        }));
        relevantProducts = await Product.find({
            isActive: true,
            $and: orClauses.slice(0, 2), // Không quá strict
        })
            .limit(10)
            .select('name brand price originalPrice stock category slug shortDescription')
            .populate('category', 'name')
            .lean();
    }

    // 2. Fallback: top sản phẩm bán chạy (bao gồm cả pending để seller test)
    const topProducts = await Product.find({ isActive: true })
        .sort({ sold: -1 })
        .limit(40)
        .select('name brand price originalPrice category slug')
        .populate('category', 'name')
        .lean();

    // 3. Merge: relevant trước, top sau, không trùng lặp
    const allIds = new Set();
    const mergedProducts = [];
    for (const p of [...relevantProducts, ...topProducts]) {
        const id = p._id.toString();
        if (!allIds.has(id)) {
            allIds.add(id);
            mergedProducts.push(p);
        }
        if (mergedProducts.length >= 50) break;
    }

    const formatPrice = (p) => {
        const price = p.price?.toLocaleString('vi-VN') || '?';
        const orig =
            p.originalPrice > 0 && p.originalPrice !== p.price
                ? ` (gốc ${p.originalPrice?.toLocaleString('vi-VN')}đ)`
                : '';
        return `${price}đ${orig}`;
    };

    const productContext = mergedProducts
        .map(
            (p) =>
                `- ${p.name}${p.brand ? ` (${p.brand})` : ''} – ${formatPrice(p)}${p.category?.name ? ` – Danh mục: ${p.category.name}` : ''} – /product/${p.slug}`,
        )
        .join('\n');

    const userProfileSection = userProfile
        ? `\nHỒ SƠ KHÁCH HÀNG (dùng để cá nhân hóa tư vấn):
- Sở thích: ${userProfile.interests?.join(', ') || 'Chưa rõ'}
- Ngân sách thường: ${userProfile.budgetRange || 'Chưa rõ'}
- Thương hiệu ưa thích: ${userProfile.preferredBrands?.join(', ') || 'Chưa rõ'}
- Tóm tắt: ${userProfile.summary || 'Khách hàng mới'}\n`
        : '';

    const systemPrompt = `Bạn là AI tư vấn mua sắm thông minh của TechStore – nền tảng thương mại điện tử hàng đầu Việt Nam.

MỤC TIÊU: Giúp khách hàng tìm sản phẩm phù hợp, so sánh giá, tư vấn mua hàng dựa trên danh sách sản phẩm THỰC TẾ trong hệ thống.
${userProfileSection}
QUY TẮC QUAN TRỌNG:
- Chỉ được tư vấn SẢN PHẨM CÓ TRONG DANH SÁCH bên dưới. KHÔNG được bịa sản phẩm.
- Nếu người dùng hỏi sản phẩm không có trong danh sách, hãy nói thẳng "Hiện cửa hàng chưa có sản phẩm này" và gợi ý sản phẩm tương tự nếu có.
- Dùng hồ sơ khách hàng để ưu tiên gợi ý phù hợp ngân sách và sở thích nếu có.
- Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.
- Khi gợi ý sản phẩm, format: **Tên sản phẩm** – [giá] → /product/[slug]
- So sánh cụ thể về giá, tính năng khi được hỏi.

DANH SÁCH SẢN PHẨM ĐANG BÁN (${mergedProducts.length} sản phẩm):
${productContext || 'Hiện không có sản phẩm nào.'}`;

    const model = getModel();

    const geminiHistory = history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            {
                role: 'model',
                parts: [
                    {
                        text: `Tôi đã nắm danh sách ${mergedProducts.length} sản phẩm. Tôi sẵn sàng tư vấn! Bạn cần tìm gì?`,
                    },
                ],
            },
            ...geminiHistory,
        ],
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
}

// ─── 2. AI Product Recommendations ────────────────────────────────────────
/**
 * Given a list of recently-viewed product IDs, use Gemini to pick
 * which other products from the catalog best match user's taste.
 */
async function getAIRecommendations(viewedProductIds = [], limit = 8) {
    if (viewedProductIds.length === 0) {
        // Cold start: return top sellers
        const top = await Product.find({ isActive: true, status: 'active' }).sort({ sold: -1 }).limit(limit).lean();
        return top;
    }

    // Get viewed products info
    const viewedProducts = await Product.find({ _id: { $in: viewedProductIds } })
        .select('name brand category price')
        .lean();

    // Collect categories from viewed products
    const categoryIds = [...new Set(viewedProducts.map((p) => p.category?.toString()).filter(Boolean))];

    // Candidate products: same categories + not already viewed
    const candidates = await Product.find({
        isActive: true,
        status: 'active',
        _id: { $nin: viewedProductIds },
        $or: [{ category: { $in: categoryIds } }, { brand: { $in: viewedProducts.map((p) => p.brand) } }],
    })
        .limit(50)
        .lean();

    if (candidates.length === 0) {
        return await Product.find({ isActive: true, status: 'active' }).sort({ sold: -1 }).limit(limit).lean();
    }

    // Ask Gemini to rank candidates
    const model = getModel();
    const viewedSummary = viewedProducts.map((p) => `${p.name} (${p.brand})`).join(', ');
    const candidateSummary = candidates.map((p, i) => `${i}: ${p.name} – ${p.brand} – ${p.price}đ`).join('\n');

    const prompt = `Người dùng đã xem các sản phẩm: ${viewedSummary}

Dưới đây là danh sách sản phẩm có thể gợi ý (index: tên):
${candidateSummary}

Hãy chọn ${limit} sản phẩm phù hợp nhất với sở thích người dùng dựa trên lịch sử xem.
Chỉ trả về danh sách các index, cách nhau bằng dấu phẩy, ví dụ: 0,3,7,12
Không giải thích thêm.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const indices = text
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
        const recommended = indices
            .slice(0, limit)
            .map((i) => candidates[i])
            .filter(Boolean);
        return recommended.length > 0 ? recommended : candidates.slice(0, limit);
    } catch {
        return candidates.slice(0, limit);
    }
}

// ─── 3. Natural Language Search ────────────────────────────────────────────
/**
 * Convert a natural language query into MongoDB search filters using Gemini,
 * then execute the search.
 */
async function naturalLanguageSearch(query) {
    const model = getModel();

    const prompt = `Bạn là hệ thống tìm kiếm thương mại điện tử. Phân tích câu truy vấn tiếng Việt và trích xuất các bộ lọc tìm kiếm.

Câu truy vấn: "${query}"

Trả về JSON với các trường (bỏ qua trường nếu không đề cập):
{
  "keywords": "từ khóa tên sản phẩm",
  "brand": "thương hiệu nếu có",
  "priceMin": số tiền tối thiểu (số nguyên, VND),
  "priceMax": số tiền tối đa (số nguyên, VND),
  "sort": "price_asc | price_desc | sold | newest",
  "categories": ["tên danh mục nếu đề cập"]
}

Chỉ trả về JSON, không giải thích.`;

    let filters = {};
    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        // Remove markdown code blocks if any
        text = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        filters = JSON.parse(text);
    } catch {
        filters = { keywords: query };
    }

    // Build MongoDB query from filters
    const mongoQuery = { isActive: true, status: 'active' };
    if (filters.keywords) {
        mongoQuery.$or = [
            { name: { $regex: filters.keywords, $options: 'i' } },
            { brand: { $regex: filters.keywords, $options: 'i' } },
            { shortDescription: { $regex: filters.keywords, $options: 'i' } },
        ];
    }
    if (filters.brand) {
        mongoQuery.brand = { $regex: filters.brand, $options: 'i' };
    }
    if (filters.priceMin || filters.priceMax) {
        mongoQuery.price = {};
        if (filters.priceMin) mongoQuery.price.$gte = filters.priceMin;
        if (filters.priceMax) mongoQuery.price.$lte = filters.priceMax;
    }

    // Handle categories
    if (filters.categories && filters.categories.length > 0) {
        const cats = await Category.find({
            name: { $in: filters.categories.map((c) => new RegExp(c, 'i')) },
        }).select('_id');
        if (cats.length > 0) {
            mongoQuery.category = { $in: cats.map((c) => c._id) };
        }
    }

    // Sort
    let sortOption = { sold: -1 };
    if (filters.sort === 'price_asc') sortOption = { price: 1 };
    else if (filters.sort === 'price_desc') sortOption = { price: -1 };
    else if (filters.sort === 'newest') sortOption = { createdAt: -1 };

    const products = await Product.find(mongoQuery).sort(sortOption).limit(24).populate('category', 'name slug').lean();

    return {
        query,
        filters,
        total: products.length,
        products,
    };
}

// ─── 4. Review Sentiment Analysis ─────────────────────────────────────────
/**
 * Analyze all reviews for a product and return a structured sentiment report.
 */
async function analyzeProductReviews(productId) {
    const reviews = await Review.find({ product: productId }).select('rating content').limit(50).lean();

    if (reviews.length === 0) {
        return { summary: 'Sản phẩm chưa có đánh giá nào.', pros: [], cons: [], sentiment: 'neutral', totalReviews: 0 };
    }

    const reviewText = reviews.map((r) => `[${r.rating}⭐] ${r.content || '(Không có nhận xét)'}`).join('\n');

    const model = getModel();
    const prompt = `Phân tích các đánh giá sản phẩm sau và trả về JSON:

${reviewText}

Trả về JSON:
{
  "sentiment": "positive | mixed | negative",
  "sentimentScore": số từ 0-100 (100 = rất tích cực),
  "summary": "tóm tắt tổng quan 1-2 câu",
  "pros": ["điểm mạnh 1", "điểm mạnh 2", ...],
  "cons": ["điểm yếu 1", "điểm yếu 2", ...],
  "highlights": ["câu trích dẫn nổi bật từ review"],
  "recommendation": "Có nên mua không? 1 câu."
}

Chỉ trả về JSON, không giải thích.`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const analysis = JSON.parse(text);
        return {
            ...analysis,
            totalReviews: reviews.length,
            avgRating: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        };
    } catch (err) {
        return {
            sentiment: 'mixed',
            sentimentScore: 50,
            summary: 'Không thể phân tích đánh giá lúc này.',
            pros: [],
            cons: [],
            highlights: [],
            recommendation: 'N/A',
            totalReviews: reviews.length,
        };
    }
}

// ─── 5. History: Lấy lịch sử hội thoại ────────────────────────────────────────
async function getHistory({ userId, sessionId }) {
    const query = userId ? { user: userId } : { sessionId };
    if (!userId && !sessionId) return { messages: [], userProfile: null };

    const doc = await AICopilotHistory.findOne(query).lean();
    if (!doc) return { messages: [], userProfile: null };

    // Chỉ trả về 200 tin nhắn gần nhất
    const messages = (doc.messages || []).slice(-200);
    return { messages, userProfile: doc.userProfile || null };
}

// ─── 6. History: Lưu tin nhắn mới ─────────────────────────────────────────────
async function saveToHistory({ userId, sessionId, userMessage, aiReply }) {
    const query = userId ? { user: userId } : { sessionId };
    if (!userId && !sessionId) return;

    const newMessages = [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiReply },
    ];

    await AICopilotHistory.findOneAndUpdate(
        query,
        {
            $push: { messages: { $each: newMessages } },
            $setOnInsert: userId ? { user: userId } : { sessionId },
        },
        { upsert: true, new: true },
    );
}

// ─── 7. Cập nhật profile người dùng dựa trên lịch sử ──────────────────────────────
async function updateUserProfile({ userId, sessionId }) {
    const query = userId ? { user: userId } : { sessionId };
    if (!userId && !sessionId) return null;

    const doc = await AICopilotHistory.findOne(query);
    if (!doc || doc.messages.length < 6) return null; // Cần ít nhất 3 lượt chat

    // Lấy 30 tin nhắn gần nhất của user để phân tích
    const recentUserMsgs = doc.messages
        .filter((m) => m.role === 'user')
        .slice(-30)
        .map((m) => m.content)
        .join(' | ');

    const model = getModel();
    const prompt = `Dựa trên các tin nhắn sau của một khách hàng mua sắm, hãy phân tích sở thích và trả về JSON:

Tin nhắn: "${recentUserMsgs}"

Trả về JSON:
{
  "interests": ["tối đa 5 từ khóa sở thích"],
  "budgetRange": "mức ngân sách hay hỏi (VD: 10-20 triệu) hoặc null",
  "preferredBrands": ["thương hiệu hay đề cập"],
  "summary": "1 câu mô tả ngắn về khách hàng này"
}
Chỉ trả về JSON.`;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response
            .text()
            .trim()
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const profile = JSON.parse(text);
        doc.userProfile = profile;
        await doc.save();
        return profile;
    } catch {
        return null;
    }
}

module.exports = {
    chatWithAssistant,
    getAIRecommendations,
    naturalLanguageSearch,
    analyzeProductReviews,
    getHistory,
    saveToHistory,
    updateUserProfile,
};
