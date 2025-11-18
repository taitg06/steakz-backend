"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getStats = async (_req, res) => {
    try {
        const [userCount, reviewCount, branchCount, menuItemCount] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.review.count(),
            prisma_1.default.branch.count(),
            prisma_1.default.menuItem.count(),
        ]);
        res.json({
            users: userCount,
            reviews: reviewCount,
            branches: branchCount,
            menuItems: menuItemCount,
            orders: 0
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=statsController.js.map