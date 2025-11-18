"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const branchRoutes_1 = __importDefault(require("./routes/branchRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const menuRoutes_1 = __importDefault(require("./routes/menuRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const seedAdmin_1 = require("./utils/seedAdmin");
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002'
];
app.use((0, cors_1.default)({ origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1)
            return callback(null, true);
        return callback(new Error('CORS policy: origin not allowed'), false);
    } }));
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.send('Welcome to the homepage!');
});
app.use('/api/users', userRoutes_1.default);
app.use('/api/posts', postRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api', authRoutes_1.default);
app.use('/api/stats', statsRoutes_1.default);
app.use('/api/branches', branchRoutes_1.default);
app.use('/api/inventory', inventoryRoutes_1.default);
app.use('/api/reviews', reviewRoutes_1.default);
app.use('/api/menu', menuRoutes_1.default);
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    await (0, seedAdmin_1.seedAdminUser)();
    console.log(`Server running on http://localhost:${PORT}`);
});
app.get('/users', async (_req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});
//# sourceMappingURL=index.js.map