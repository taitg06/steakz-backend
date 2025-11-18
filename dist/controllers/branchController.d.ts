import { Request, Response } from 'express';
export declare const getBranches: (_req: Request, res: Response) => Promise<void>;
export declare const createBranch: (req: Request, res: Response) => Promise<void>;
export declare const updateBranch: (req: Request, res: Response) => Promise<void>;
export declare const deleteBranch: (req: Request, res: Response) => Promise<void>;
