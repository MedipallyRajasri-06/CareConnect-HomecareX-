/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const ServiceCategory = require('../models/ServiceCategory');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceRequest = require('../models/ServiceRequest');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const Notification = require('../models/Notification');

const aiService = require('../services/aiService');

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function run() {
  await connectDB();
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    ServiceCategory.deleteMany({}),
    ProviderProfile.deleteMany({}),
    ServiceRequest.deleteMany({}),
    Quote.deleteMany({}),
    Booking.deleteMany({}),
    Invoice.deleteMany({}),
    Review.deleteMany({}),
    Dispute.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('👥 Creating users...');
  const admin = await User.create({
    name: 'Ava Patel', email: 'admin@careconnect.dev', password: 'password123', role: 'admin', isVerified: true, avatarColor: '#2563eb',
  });
  const ops = await User.create({
    name: 'Noah Kim', email: 'ops@careconnect.dev', password: 'password123', role: 'operations_manager', isVerified: true, avatarColor: '#7c3aed',
  });
  const agent = await User.create({
    name: 'Maria Chen', email: 'support@careconnect.dev', password: 'password123', role: 'support_agent', isVerified: true, avatarColor: '#059669',
  });

  const customerData = [
    { name: 'Liam Johnson', email: 'liam@example.com', password: 'password123', role: 'customer', isVerified: true, avatarColor: '#dc2626', address: { city: 'Austin', state: 'TX', zip: '78701' } },
    { name: 'Emma Davis', email: 'emma@example.com', password: 'password123', role: 'customer', isVerified: true, avatarColor: '#d97706', address: { city: 'Austin', state: 'TX', zip: '78704' } },
    { name: 'Olivia Martinez', email: 'olivia@example.com', password: 'password123', role: 'customer', isVerified: true, avatarColor: '#0891b2', address: { city: 'Round Rock', state: 'TX', zip: '78664' } },
  ];
  const customers = [];
  for (const c of customerData) {
    const u = new User(c);
    await u.save();
    customers.push(u);
  }

  const providerUsersRaw = [
    { name: 'James Rodriguez', email: 'james@pro.dev', city: 'Austin' },
    { name: 'Sophia Lee', email: 'sophia@pro.dev', city: 'Austin' },
    { name: 'Ethan Brown', email: 'ethan@pro.dev', city: 'Round Rock' },
    { name: 'Ava Wilson', email: 'ava@pro.dev', city: 'Austin' },
    { name: 'Mason Clark', email: 'mason@pro.dev', city: 'Cedar Park' },
  ];
  const providerUsers = [];
  for (const p of providerUsersRaw) {
    const u = new User({ name: p.name, email: p.email, password: 'password123', role: 'provider', isVerified: true, address: { city: p.city, state: 'TX' } });
    await u.save();
    providerUsers.push(u);
  }

  console.log('🗂️  Creating service categories...');
  const categoriesData = [
    {
      name: 'Appliance Repair', slug: 'appliance-repair', icon: 'wrench',
      description: 'Repair and maintenance of home appliances like refrigerators, washers, and ovens.',
      keywords: ['appliance', 'refrigerator', 'fridge', 'washer', 'dryer', 'oven', 'microwave', 'dishwasher', 'repair', 'broken', 'not working', 'ac', 'air conditioner'],
      requiredSkills: ['appliance repair', 'electrical basics', 'diagnostics'],
      basePrice: 60, pricingUnit: 'flat',
    },
    {
      name: 'Home Cleaning', slug: 'home-cleaning', icon: 'sparkles',
      description: 'Deep cleaning, regular housekeeping, move-in/move-out cleaning.',
      keywords: ['cleaning', 'clean', 'housekeeping', 'dust', 'mop', 'vacuum', 'sanitize', 'deep clean', 'maid'],
      requiredSkills: ['cleaning', 'attention to detail', 'time management'],
      basePrice: 45, pricingUnit: 'hourly',
    },
    {
      name: 'Electrical Work', slug: 'electrical-work', icon: 'zap',
      description: 'Wiring, outlets, lighting fixtures, circuit breakers, and electrical safety inspections.',
      keywords: ['electrical', 'wiring', 'outlet', 'switch', 'circuit', 'breaker', 'lighting', 'fuse', 'sparking', 'short'],
      requiredSkills: ['electrical wiring', 'licensed electrician', 'safety compliance'],
      basePrice: 80, pricingUnit: 'hourly',
    },
    {
      name: 'Plumbing', slug: 'plumbing', icon: 'droplet',
      description: 'Leak repairs, pipe installation, drain cleaning, water heaters, and fixtures.',
      keywords: ['plumbing', 'pipe', 'leak', 'drain', 'faucet', 'toilet', 'water heater', 'clog', 'sink', 'sewage'],
      requiredSkills: ['plumbing', 'pipe fitting', 'leak diagnostics'],
      basePrice: 75, pricingUnit: 'hourly',
    },
    {
      name: 'General Maintenance', slug: 'general-maintenance', icon: 'hammer',
      description: 'Handyman services: furniture assembly, painting, drywall, carpentry, and small repairs.',
      keywords: ['maintenance', 'handyman', 'paint', 'drywall', 'furniture', 'assembly', 'carpentry', 'fix', 'install', 'mount'],
      requiredSkills: ['carpentry', 'painting', 'general repair'],
      basePrice: 50, pricingUnit: 'hourly',
    },
  ];
  const categories = await ServiceCategory.insertMany(
    categoriesData.map((c) => ({ ...c, createdBy: admin._id }))
  );
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  console.log('🛠️  Creating provider profiles...');
  const profileConfigs = [
    { user: providerUsers[0], categories: ['Appliance Repair', 'Electrical Work'], skills: ['appliance repair', 'electrical wiring', 'diagnostics'], experienceYears: 6, hourlyRate: 55, serviceAreas: ['Austin', '78701', '78704'], rating: 4.8, ratingCount: 32, completedJobs: 41, verification: 'verified' },
    { user: providerUsers[1], categories: ['Home Cleaning'], skills: ['cleaning', 'attention to detail', 'deep clean'], experienceYears: 4, hourlyRate: 30, serviceAreas: ['Austin', '78701'], rating: 4.9, ratingCount: 58, completedJobs: 74, verification: 'verified' },
    { user: providerUsers[2], categories: ['Plumbing', 'General Maintenance'], skills: ['plumbing', 'pipe fitting', 'general repair'], experienceYears: 8, hourlyRate: 65, serviceAreas: ['Round Rock', 'Austin', '78664'], rating: 4.6, ratingCount: 21, completedJobs: 28, verification: 'verified' },
    { user: providerUsers[3], categories: ['Electrical Work'], skills: ['electrical wiring', 'licensed electrician'], experienceYears: 3, hourlyRate: 60, serviceAreas: ['Austin'], rating: 4.2, ratingCount: 9, completedJobs: 11, verification: 'pending' },
    { user: providerUsers[4], categories: ['General Maintenance', 'Home Cleaning'], skills: ['carpentry', 'painting', 'cleaning'], experienceYears: 2, hourlyRate: 35, serviceAreas: ['Cedar Park', 'Austin'], rating: 0, ratingCount: 0, completedJobs: 2, verification: 'pending' },
  ];

  const providerProfiles = [];
  for (const cfg of profileConfigs) {
    const profile = await ProviderProfile.create({
      user: cfg.user._id,
      bio: `${cfg.user.name} is an experienced professional with ${cfg.experienceYears} years in the field, dedicated to quality workmanship and customer satisfaction.`,
      categories: cfg.categories.map((n) => catByName[n]._id),
      skills: cfg.skills,
      experienceYears: cfg.experienceYears,
      hourlyRate: cfg.hourlyRate,
      serviceAreas: cfg.serviceAreas,
      verificationStatus: cfg.verification,
      ratingAverage: cfg.rating,
      ratingCount: cfg.ratingCount,
      completedJobs: cfg.completedJobs,
      isOnline: true,
      availability: [
        { date: daysFromNow(1), startTime: '09:00', endTime: '12:00' },
        { date: daysFromNow(1), startTime: '13:00', endTime: '16:00' },
        { date: daysFromNow(2), startTime: '09:00', endTime: '11:00' },
        { date: daysFromNow(3), startTime: '10:00', endTime: '15:00' },
      ],
    });
    providerProfiles.push(profile);
  }

  console.log('📋 Creating service requests + AI classification + quotes + bookings...');

  // Request 1: fully completed lifecycle (Appliance Repair)
  const desc1 = 'My refrigerator stopped cooling and is making a loud humming noise, need urgent repair';
  const cls1 = aiService.classifyRequest(desc1, categories);
  const req1 = await ServiceRequest.create({
    customer: customers[0]._id, rawDescription: desc1,
    category: cls1.category._id, aiSuggestedCategory: cls1.category._id, aiConfidence: cls1.confidence,
    aiRequiredSkills: cls1.requiredSkills, urgency: 'high',
    location: { city: 'Austin', state: 'TX', zip: '78701' },
    preferredDate: daysFromNow(1), status: 'completed',
  });
  const applianceProvider = providerProfiles[0];
  const rank1 = aiService.rankProviders(req1, [applianceProvider]);
  req1.aiRankedProviders = rank1;
  await req1.save();

  const quote1 = await Quote.create({ serviceRequest: req1._id, provider: applianceProvider._id, price: 120, estimatedDuration: '2 hours', message: 'Can fix today, bringing replacement compressor parts if needed.', status: 'accepted' });
  const slot1 = applianceProvider.availability[0];
  slot1.isBooked = true;
  await applianceProvider.save();

  const booking1 = await Booking.create({
    serviceRequest: req1._id, quote: quote1._id, customer: customers[0]._id, provider: applianceProvider._id,
    category: cls1.category._id, scheduledDate: slot1.date, scheduledStartTime: slot1.startTime, scheduledEndTime: slot1.endTime,
    slotId: slot1._id, price: 120, status: 'completed', customerConfirmedAt: new Date(),
    updates: [
      { status: 'scheduled', note: 'Booking confirmed.', updatedBy: customers[0]._id },
      { status: 'in_progress', note: 'On my way, ETA 15 mins.', updatedBy: providerUsers[0]._id },
      { status: 'completed', note: 'Replaced compressor relay, fridge cooling normally now.', updatedBy: providerUsers[0]._id },
    ],
  });
  slot1.bookingId = booking1._id;
  await applianceProvider.save();
  applianceProvider.completedJobs += 1;
  await applianceProvider.save();

  await Invoice.create({
    booking: booking1._id, customer: customers[0]._id, provider: applianceProvider._id,
    invoiceNumber: 'INV-SEED-001', lineItems: [{ description: 'Compressor relay replacement', amount: 120 }],
    subtotal: 120, platformFee: 12, tax: 6, total: 138, status: 'paid', paidAt: new Date(),
  });

  await Review.create({
    booking: booking1._id, customer: customers[0]._id, provider: applianceProvider._id,
    rating: 5, comment: 'James was fast, professional, and fixed it same day!', punctuality: 5, quality: 5,
  });

  // Request 2: quoted / awaiting customer decision (Plumbing)
  const desc2 = 'There is a leaking pipe under my kitchen sink and water is pooling on the floor';
  const cls2 = aiService.classifyRequest(desc2, categories);
  const req2 = await ServiceRequest.create({
    customer: customers[1]._id, rawDescription: desc2,
    category: cls2.category._id, aiSuggestedCategory: cls2.category._id, aiConfidence: cls2.confidence,
    aiRequiredSkills: cls2.requiredSkills, urgency: 'high',
    location: { city: 'Austin', state: 'TX', zip: '78704' },
    preferredDate: daysFromNow(2), status: 'quoted',
  });
  const plumber = providerProfiles[2];
  req2.aiRankedProviders = aiService.rankProviders(req2, [plumber]);
  await req2.save();
  await Quote.create({ serviceRequest: req2._id, provider: plumber._id, price: 95, estimatedDuration: '1.5 hours', message: 'I can patch the pipe and check for further damage.', status: 'pending' });

  // Request 3: in progress job (General Maintenance)
  const desc3 = 'Need to assemble a new wardrobe and mount two shelves in the living room';
  const cls3 = aiService.classifyRequest(desc3, categories);
  const req3 = await ServiceRequest.create({
    customer: customers[2]._id, rawDescription: desc3,
    category: cls3.category._id, aiSuggestedCategory: cls3.category._id, aiConfidence: cls3.confidence,
    aiRequiredSkills: cls3.requiredSkills, urgency: 'normal',
    location: { city: 'Round Rock', state: 'TX', zip: '78664' },
    preferredDate: daysFromNow(1), status: 'scheduled',
  });
  const handyman = providerProfiles[2];
  req3.aiRankedProviders = aiService.rankProviders(req3, [handyman, providerProfiles[4]]);
  await req3.save();
  const quote3 = await Quote.create({ serviceRequest: req3._id, provider: handyman._id, price: 85, estimatedDuration: '3 hours', status: 'accepted' });
  const slot3 = handyman.availability.find((s) => !s.isBooked);
  slot3.isBooked = true;
  await handyman.save();
  const booking3 = await Booking.create({
    serviceRequest: req3._id, quote: quote3._id, customer: customers[2]._id, provider: handyman._id,
    category: cls3.category._id, scheduledDate: slot3.date, scheduledStartTime: slot3.startTime, scheduledEndTime: slot3.endTime,
    slotId: slot3._id, price: 85, status: 'in_progress',
    updates: [
      { status: 'scheduled', note: 'Booking confirmed.', updatedBy: customers[2]._id },
      { status: 'in_progress', note: 'Started assembling the wardrobe.', updatedBy: providerUsers[2]._id },
    ],
  });
  slot3.bookingId = booking3._id;
  await handyman.save();

  // Request 4: brand new, unclassified-confirmed, ready for matching demo (Electrical)
  const desc4 = 'Outlet in my bedroom is sparking and one light switch stopped working';
  const cls4 = aiService.classifyRequest(desc4, categories);
  await ServiceRequest.create({
    customer: customers[0]._id, rawDescription: desc4,
    category: cls4.category._id, aiSuggestedCategory: cls4.category._id, aiConfidence: cls4.confidence,
    aiRequiredSkills: cls4.requiredSkills, urgency: 'emergency',
    location: { city: 'Austin', state: 'TX', zip: '78701' },
    preferredDate: daysFromNow(1), status: 'classified',
  });

  // Request 5: cancelled example
  const desc5 = 'Need a full deep cleaning before move-out inspection this weekend';
  const cls5 = aiService.classifyRequest(desc5, categories);
  await ServiceRequest.create({
    customer: customers[1]._id, rawDescription: desc5,
    category: cls5.category._id, aiSuggestedCategory: cls5.category._id, aiConfidence: cls5.confidence,
    aiRequiredSkills: cls5.requiredSkills, urgency: 'normal',
    location: { city: 'Austin', state: 'TX', zip: '78704' },
    status: 'cancelled', cancellationReason: 'Found a friend to help instead.',
  });

  console.log('⚖️  Creating a dispute example...');
  const dispute = await Dispute.create({
    booking: booking1._id, raisedBy: customers[0]._id, reason: 'Was charged more than the original quote without explanation.',
    category: 'pricing', status: 'investigating', assignedTo: agent._id,
    thread: [
      { sender: customers[0]._id, message: 'Was charged more than the original quote without explanation.' },
      { sender: agent._id, message: "Thanks for flagging this, I'm reviewing the invoice and will follow up shortly." },
    ],
  });

  console.log('🔔 Seeding a few notifications...');
  await Notification.insertMany([
    { user: customers[1]._id, type: 'new_quote', title: 'New quote received', message: 'You received a ₹950 quote for your plumbing request.', link: `/customer/requests/${req2._id}`, isRead: false },
    { user: providerUsers[3]._id, type: 'provider_verified', title: 'Verification pending', message: 'Your documents are under review by our operations team.', link: '/provider/profile', isRead: false },
    { user: customers[0]._id, type: 'dispute_opened', title: 'Dispute opened', message: 'Our support team is reviewing your billing dispute.', link: `/disputes/${dispute._id}`, isRead: true },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('----------------------------------------------------');
  console.log('Login credentials (all passwords: password123)');
  console.log('----------------------------------------------------');
  console.log('Admin:             admin@careconnect.dev');
  console.log('Operations Mgr:    ops@careconnect.dev');
  console.log('Support Agent:     support@careconnect.dev');
  console.log('Customer:          liam@example.com / emma@example.com / olivia@example.com');
  console.log('Provider (verified): james@pro.dev / sophia@pro.dev / ethan@pro.dev');
  console.log('Provider (pending):  ava@pro.dev / mason@pro.dev');
  console.log('----------------------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
