import { Request, Response } from 'express';
export declare const getPosts: (_req: Request, res: Response) => Promise<void>;
export declare const getPost: (req: Request, res: Response) => Promise<void>;
export declare const createPost: (req: Request, res: Response) => Promise<void>;
export declare const updatePost: (req: Request, res: Response) => Promise<void>;
export declare const deletePost: (req: Request, res: Response) => Promise<void>;
