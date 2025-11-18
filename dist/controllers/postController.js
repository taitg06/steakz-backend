"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getPosts = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getPosts = async (_req, res) => {
    try {
        const posts = await prisma_1.default.post.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        const formattedPosts = posts.map(post => ({
            ...post,
            comments: post.comments.map(comment => ({
                ...comment,
                commenterName: comment.author ? comment.author.name : comment.userName
            }))
        }));
        res.json(formattedPosts);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
};
exports.getPosts = getPosts;
const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma_1.default.post.findUnique({
            where: { id: Number(id) },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        const formattedPost = {
            ...post,
            comments: post.comments.map(comment => ({
                ...comment,
                commenterName: comment.author ? comment.author.name : comment.userName
            }))
        };
        res.json(formattedPost);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching post' });
    }
};
exports.getPost = getPost;
const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await prisma_1.default.post.create({
            data: {
                title,
                content,
                authorId: req.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json(post);
    }
    catch (error) {
        console.error('Error creating post:', error);
        res.status(400).json({ message: 'Failed to create post' });
    }
};
exports.createPost = createPost;
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id;
        const existingPost = await prisma_1.default.post.findUnique({
            where: { id: Number(id) }
        });
        if (!existingPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        if (existingPost.authorId !== userId) {
            res.status(403).json({ message: 'You can only update your own posts' });
            return;
        }
        const post = await prisma_1.default.post.update({
            where: { id: Number(id) },
            data: { title, content },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating post' });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const existingPost = await prisma_1.default.post.findUnique({
            where: { id: Number(id) }
        });
        if (!existingPost) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }
        if (existingPost.authorId !== userId) {
            res.status(403).json({ message: 'You can only delete your own posts' });
            return;
        }
        await prisma_1.default.post.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting post' });
    }
};
exports.deletePost = deletePost;
//# sourceMappingURL=postController.js.map