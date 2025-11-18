"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranches = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getBranches = async (_req, res) => {
    try {
        const branches = await prisma_1.default.branch.findMany();
        res.json(branches);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching branches' });
    }
};
exports.getBranches = getBranches;
const createBranch = async (req, res) => {
    try {
        const { name, address, phone } = req.body;
        const branch = await prisma_1.default.branch.create({
            data: { name, address, phone }
        });
        res.status(201).json(branch);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating branch' });
    }
};
exports.createBranch = createBranch;
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone } = req.body;
        const branch = await prisma_1.default.branch.update({
            where: { id: Number(id) },
            data: { name, address, phone }
        });
        res.json(branch);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating branch' });
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.branch.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Branch deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting branch' });
    }
};
exports.deleteBranch = deleteBranch;
//# sourceMappingURL=branchController.js.map