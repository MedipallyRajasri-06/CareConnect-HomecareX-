require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const providerRoutes = require('./routes/providerRoutes');
const requestRoutes = require('./routes/requestRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

connectDB();

const allowedOrigins = [
  'https://care-connect-homecare-x.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Dynamically echo back requesting origin for Vercel, localhost, or any configured client
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '5mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ success: true, message: 'CareConnect API is live 🚀', timestamp: new Date().toISOString() });
});

// Support both /api/path and /path so requests work regardless of frontend baseURL configuration
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/categories', '/categories'], categoryRoutes);
app.use(['/api/providers', '/providers'], providerRoutes);
app.use(['/api/requests', '/requests'], requestRoutes);
app.use(['/api/quotes', '/quotes'], quoteRoutes);
app.use(['/api/bookings', '/bookings'], bookingRoutes);
app.use(['/api/invoices', '/invoices'], invoiceRoutes);
app.use(['/api/reviews', '/reviews'], reviewRoutes);
app.use(['/api/disputes', '/disputes'], disputeRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/analytics', '/analytics'], analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`[CareConnect API] Listening on port ${PORT}`));
}

module.exports = app;
