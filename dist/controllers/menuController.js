"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.getMenuItems = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getMenuItems = async (_req, res) => {
    try {
        const menuItems = await prisma_1.default.menuItem.findMany({
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });
        res.json(menuItems);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};
exports.getMenuItems = getMenuItems;
const createMenuItem = async (req, res) => {
    try {
        const { name, description, price, quantity, branchId } = req.body;
        const menuItem = await prisma_1.default.menuItem.create({
            data: {
                name,
                description: description || '',
                price: parseFloat(price),
                quantity: quantity || 100,
                branchId: branchId || 1,
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json(menuItem);
    }
    catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Error creating menu item' });
    }
};
exports.createMenuItem = createMenuItem;
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, quantity } = req.body;
        const menuItem = await prisma_1.default.menuItem.update({
            where: { id: Number(id) },
            data: {
                name,
                description,
                price: parseFloat(price),
                quantity
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json(menuItem);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating menu item' });
    }
};
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.menuItem.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting menu item' });
    }
};
exports.deleteMenuItem = deleteMenuItem;
//# sourceMappingURL=menuController.js.map