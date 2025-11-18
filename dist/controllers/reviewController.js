"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.createReview = exports.getReviews = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getReviews = async (_req, res) => {
    try {
        const reviews = await prisma_1.default.review.findMany({
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });
        res.json(reviews);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};
exports.getReviews = getReviews;
const createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const review = await prisma_1.default.review.create({
            data: {
                rating: Number(rating),
                comment,
                userId
            }
        });
        res.status(201).json(review);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating review' });
    }
};
exports.createReview = createReview;
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.review.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Review deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting review' });
    }
};
exports.deleteReview = deleteReview;
//# sourceMappingURL=reviewController.js.map