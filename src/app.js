import express from 'express';
import apiRoutes from './api.js';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

export default app;
