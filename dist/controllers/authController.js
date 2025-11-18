"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
const hash_1 = require("../utils/hash");
dotenv_1.default.config();
const signup = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ message: 'Name, email, and password are required' });
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser)
        return res.status(400).json({ message: 'Email already taken' });
    const hashedPassword = await (0, hash_1.hashPassword)(password);
    const user = await prisma_1.default.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: 'CUSTOMER',
        },
    });
    res.status(201).json({ message: 'User created', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
exports.signup = signup;
const login = async (req, res) => {
    const { identifier, password } = req.body;
    console.log('[auth] login attempt for identifier:', identifier, 'from', req.ip);
    if (!identifier || !password)
        return res.status(400).json({ message: 'Identifier and password are required' });
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);
    let user;
    if (isEmail) {
        user = await prisma_1.default.user.findUnique({
            where: { email: identifier },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    else {
        user = await prisma_1.default.user.findFirst({
            where: { name: identifier },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await (0, hash_1.comparePassword)(password, user.password);
    if (!valid)
        return res.status(401).json({ message: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({
        token,
        user: userWithoutPassword
    });
};
exports.login = login;
//# sourceMappingURL=authController.js.map