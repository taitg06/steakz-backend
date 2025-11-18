"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chefEndpoint = exports.headquarterEndpoint = exports.cashierEndpoint = exports.managerEndpoint = exports.adminEndpoint = exports.customerEndpoint = exports.updateUserRole = exports.adminDeleteUser = exports.adminChangeRole = exports.adminUpdateUser = exports.adminCreateUser = exports.getUserById = exports.getAllUsers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const hash_1 = require("../utils/hash");
const getAllUsers = async (_req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.user.findUnique({
            where: { id: Number(id) },
            select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true }
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching user details' });
    }
};
exports.getUserById = getUserById;
const adminCreateUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            res.status(400).json({ message: 'All fields required' });
            return;
        }
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(400).json({ message: 'Email already exists' });
            return;
        }
        const hashedPassword = await (0, hash_1.hashPassword)(password);
        const user = await prisma_1.default.user.create({
            data: { name, email, password: hashedPassword, role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.status(201).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
};
exports.adminCreateUser = adminCreateUser;
const adminUpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (password)
            updateData.password = await (0, hash_1.hashPassword)(password);
        const user = await prisma_1.default.user.update({
            where: { id: Number(id) },
            data: updateData,
            select: { id: true, name: true, email: true, role: true }
        });
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
};
exports.adminUpdateUser = adminUpdateUser;
const adminChangeRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
            res.status(400).json({ message: 'Role required' });
            return;
        }
        const user = await prisma_1.default.user.update({
            where: { id: Number(id) },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error changing user role' });
    }
};
exports.adminChangeRole = adminChangeRole;
const adminDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.user.delete({ where: { id: Number(id) } });
        res.json({ message: 'User deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};
exports.adminDeleteUser = adminDeleteUser;
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
            res.status(400).json({ message: 'Role required' });
            return;
        }
        const user = await prisma_1.default.user.update({
            where: { id: Number(id) },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user role' });
    }
};
exports.updateUserRole = updateUserRole;
const customerEndpoint = (_req, res) => {
    res.json({ message: 'Hello, customer!' });
};
exports.customerEndpoint = customerEndpoint;
const adminEndpoint = (_req, res) => {
    res.json({ message: 'Hello, admin!' });
};
exports.adminEndpoint = adminEndpoint;
const managerEndpoint = (_req, res) => {
    res.json({ message: 'Hello, manager!' });
};
exports.managerEndpoint = managerEndpoint;
const cashierEndpoint = (_req, res) => {
    res.json({ message: 'Hello, cashier!' });
};
exports.cashierEndpoint = cashierEndpoint;
const headquarterEndpoint = (_req, res) => {
    res.json({ message: 'Hello, headquarter!' });
};
exports.headquarterEndpoint = headquarterEndpoint;
const chefEndpoint = (_req, res) => {
    res.json({ message: 'Hello, chef!' });
};
exports.chefEndpoint = chefEndpoint;
//# sourceMappingURL=userController.js.map