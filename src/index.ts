import express, { Request, Response } from 'express';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';
import authRoutes from './routes/authRoutes';
import statsRoutes from './routes/statsRoutes';
import branchRoutes from './routes/branchRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import reviewRoutes from './routes/reviewRoutes';
import menuRoutes from './routes/menuRoutes';
import reportsRoutes from './routes/reportsRoutes';
import orderRoutes from './routes/orderRoutes';
import reservationRoutes from './routes/reservationRoutes';
import contactRoutes from './routes/contactRoutes';
import dotenv from 'dotenv';
import cors from 'cors';
import { seedAdminUser } from './utils/seedAdmin';
import { seedMenuItems } from './utils/seedMenu';
import { PrismaClient} from '@prisma/client'

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Allow frontend origins during development. If you deploy, set a stricter origin.
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002'
];
app.use(cors({ origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'), false);
}}));
app.use(express.json());

// Homepage route
app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to the homepage!');
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', authRoutes); // Mount authRoutes at /api so /api/signup works
app.use('/api/stats', statsRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/contact', contactRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    await seedAdminUser();
    await seedMenuItems();
    console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Catch-all 404 handler for unknown API routes
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});
