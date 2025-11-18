import { Request, Response } from 'express';
export declare const getAllComments: (_req: Request, res: Response) => Promise<any>;
export declare const createComment: (req: Request, res: Response) => Promise<any>;
export declare const deleteComment: (req: Request, res: Response) => Promise<any>;
