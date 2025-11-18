import { Request, Response } from 'express';
export declare const getReviews: (_req: Request, res: Response) => Promise<void>;
export declare const createReview: (req: Request, res: Response) => Promise<void>;
export declare const deleteReview: (req: Request, res: Response) => Promise<void>;
