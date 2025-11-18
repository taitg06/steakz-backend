"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.createComment = exports.getAllComments = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAllComments = async (_req, res) => {
    try {
        const comments = await prisma_1.default.comment.findMany({
            include: {
                post: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const formattedComments = comments.map(comment => ({
            ...comment,
            commenterName: comment.author ? comment.author.name : comment.userName
        }));
        return res.status(200).json(formattedComments);
    }
    catch (error) {
        return (0, errorHandler_1.handleError)(error, res);
    }
};
exports.getAllComments = getAllComments;
const createComment = async (req, res) => {
    try {
        const { content, postId, userName } = req.body;
        const authUser = req.user;
        const post = await prisma_1.default.post.findUnique({
            where: { id: Number(postId) }
        });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const commentData = {
            content,
            postId: Number(postId),
        };
        if (authUser) {
            commentData.authorId = authUser.id;
        }
        else {
            commentData.userName = userName || 'Anonymous';
        }
        const comment = await prisma_1.default.comment.create({
            data: commentData,
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        authorId: true
                    }
                },
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });
        const formattedComment = {
            ...comment,
            commenterName: comment.author ? comment.author.name : comment.userName
        };
        return res.status(201).json(formattedComment);
    }
    catch (error) {
        return (0, errorHandler_1.handleError)(error, res);
    }
};
exports.createComment = createComment;
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: Number(id) },
            include: {
                post: true
            }
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (user.role === 'ADMIN') {
            await prisma_1.default.comment.delete({
                where: { id: Number(id) }
            });
            return res.status(204).send();
        }
        if (comment.post.authorId !== user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }
        if (user.role !== 'admin' && comment.post.authorId !== user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }
        await prisma_1.default.comment.delete({
            where: { id: Number(id) }
        });
        return res.status(204).send();
    }
    catch (error) {
        return (0, errorHandler_1.handleError)(error, res);
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=commentController.js.map