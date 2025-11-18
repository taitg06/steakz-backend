import { Request, Response } from 'express';
export declare const getInventory: (_req: Request, res: Response) => Promise<void>;
export declare const updateInventory: (req: Request, res: Response) => Promise<void>;
export declare const deleteInventory: (req: Request, res: Response) => Promise<void>;
