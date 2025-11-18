"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInventory = exports.updateInventory = exports.getInventory = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getInventory = async (_req, res) => {
    try {
        const inventory = await prisma_1.default.menuItem.findMany();
        res.json(inventory);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching inventory' });
    }
};
exports.getInventory = getInventory;
const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, quantity } = req.body;
        const item = await prisma_1.default.menuItem.update({
            where: { id: Number(id) },
            data: { name, price: Number(price), description, quantity: Number(quantity) }
        });
        res.json(item);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating inventory item' });
    }
};
exports.updateInventory = updateInventory;
const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.menuItem.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Inventory item deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting inventory item' });
    }
};
exports.deleteInventory = deleteInventory;
//# sourceMappingURL=inventoryController.js.map