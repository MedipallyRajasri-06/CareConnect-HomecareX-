const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS refusing SRV queries for MongoDB Atlas (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fallback if environment restricts custom DNS servers
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careconnect';
  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
