import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import requestsRoutes from './routes/requests.js';
dotenv.config();
const app = express();
app.use(cors({origin: process.env.CORS_ORIGIN ||'http://localhost:4000'}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestsRoutes);
//app.use('/api/pdf', pdfRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor arrancado en el puerto ${PORT}`);
});
