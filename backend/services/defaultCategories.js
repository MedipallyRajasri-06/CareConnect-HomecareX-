const ServiceCategory = require('../models/ServiceCategory');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');

const DEFAULT_CATEGORIES = [
  {
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    icon: 'wrench',
    description: 'Repair and servicing of home appliances including air conditioners, refrigerators, washing machines, microwaves, and ovens.',
    keywords: [
      'appliance', 'refrigerator', 'fridge', 'washer', 'dryer', 'oven', 'microwave',
      'dishwasher', 'repair', 'broken', 'not working', 'ac', 'air conditioner',
      'cooling', 'water leak', 'compressor', 'cooling coil', 'split ac', 'window ac',
      'leakage', 'gas refilling', 'servicing', 'drain pipe', 'hvac'
    ],
    requiredSkills: ['appliance repair', 'electrical basics', 'diagnostics', 'ac repair', 'refrigeration'],
    basePrice: 499,
    pricingUnit: 'flat',
    surgeMultiplier: 1,
    isActive: true,
  },
  {
    name: 'AC & HVAC Services',
    slug: 'ac-hvac-services',
    icon: 'wind',
    description: 'AC repair, servicing, installation, gas charging, water leakage fixes, and seasonal tune-ups.',
    keywords: [
      'ac', 'air conditioner', 'cooling', 'hvac', 'split ac', 'window ac',
      'gas leak', 'compressor', 'cooling coils', 'filter', 'water leak',
      'servicing', 'not cooling', 'ac service', 'ac installation', 'water dripping', 'leak'
    ],
    requiredSkills: ['ac repair', 'hvac diagnostics', 'gas charging', 'leak repair'],
    basePrice: 499,
    pricingUnit: 'flat',
    surgeMultiplier: 1,
    isActive: true,
  },
  {
    name: 'Plumbing',
    slug: 'plumbing',
    icon: 'droplet',
    description: 'Leak repairs, pipe installations, drain cleaning, water heaters, faucets, and bathroom fixtures.',
    keywords: [
      'plumbing', 'pipe', 'leak', 'drain', 'faucet', 'toilet', 'water heater',
      'clog', 'sink', 'sewage', 'tap', 'shower', 'water', 'leakage', 'geyser', 'flush', 'water tank'
    ],
    requiredSkills: ['plumbing', 'pipe fitting', 'leak diagnostics', 'drain snaking'],
    basePrice: 399,
    pricingUnit: 'hourly',
    surgeMultiplier: 1,
    isActive: true,
  },
  {
    name: 'Electrical Work',
    slug: 'electrical-work',
    icon: 'zap',
    description: 'Wiring, outlets, switchboards, lighting fixtures, circuit breakers, fan installation, and electrical safety.',
    keywords: [
      'electrical', 'wiring', 'outlet', 'switch', 'circuit', 'breaker',
      'lighting', 'fuse', 'sparking', 'short', 'fan', 'light', 'power', 'geyser', 'mcb', 'inverter'
    ],
    requiredSkills: ['electrical wiring', 'licensed electrician', 'safety compliance', 'diagnostics'],
    basePrice: 599,
    pricingUnit: 'hourly',
    surgeMultiplier: 1,
    isActive: true,
  },
  {
    name: 'Home Cleaning',
    slug: 'home-cleaning',
    icon: 'sparkles',
    description: 'Deep cleaning, regular housekeeping, bathroom & kitchen cleaning, sofa & carpet shampooing.',
    keywords: [
      'cleaning', 'clean', 'housekeeping', 'dust', 'mop', 'vacuum', 'sanitize',
      'deep clean', 'maid', 'bathroom', 'kitchen', 'sofa', 'floor', 'window'
    ],
    requiredSkills: ['cleaning', 'attention to detail', 'time management', 'sanitization'],
    basePrice: 799,
    pricingUnit: 'flat',
    surgeMultiplier: 1,
    isActive: true,
  },
  {
    name: 'General Maintenance',
    slug: 'general-maintenance',
    icon: 'hammer',
    description: 'Handyman services: furniture assembly, painting, drywall, carpentry, mounting, and general home repairs.',
    keywords: [
      'maintenance', 'handyman', 'paint', 'drywall', 'furniture', 'assembly',
      'carpentry', 'fix', 'install', 'mount', 'door', 'shelf', 'drilling', 'tv mount', 'lock'
    ],
    requiredSkills: ['carpentry', 'painting', 'general repair', 'mounting'],
    basePrice: 349,
    pricingUnit: 'hourly',
    surgeMultiplier: 1,
    isActive: true,
  },
];

async function ensureDefaultCategories() {
  try {
    const existingCount = await ServiceCategory.countDocuments({ isActive: true });
    if (existingCount === 0) {
      console.log('⚡ [AutoSeed] No active service categories found. Initializing defaults...');
      for (const cat of DEFAULT_CATEGORIES) {
        await ServiceCategory.findOneAndUpdate(
          { slug: cat.slug },
          { $setOnInsert: cat },
          { upsert: true, new: true }
        );
      }
      console.log('✅ [AutoSeed] Default service categories initialized.');
    }

    // Baseline: ensure admin user exists if no admin in DB
    const adminExists = await User.findOne({ role: 'admin' });
    let adminUser = adminExists;
    if (!adminExists) {
      console.log('⚡ [AutoSeed] Creating default admin account...');
      adminUser = await User.create({
        name: 'CareConnect Admin',
        email: 'admin@careconnect.dev',
        password: 'password123',
        role: 'admin',
        isVerified: true,
        avatarColor: '#2563eb',
      });
      console.log('✅ [AutoSeed] Default admin created: admin@careconnect.dev / password123');
    }

    // Baseline: ensure existing providers (e.g. kavya@gmail.com) are verified and linked to categories
    const allCategories = await ServiceCategory.find({ isActive: true });
    const categoryIds = allCategories.map((c) => c._id);

    const pendingProfiles = await ProviderProfile.find({ verificationStatus: 'pending' });
    for (const profile of pendingProfiles) {
      profile.verificationStatus = 'verified';
      profile.isOnline = true;
      if (!profile.categories || profile.categories.length === 0) {
        profile.categories = categoryIds;
      }
      if (!profile.skills || profile.skills.length === 0) {
        profile.skills = [
          'appliance repair', 'ac repair', 'electrical basics', 'plumbing',
          'cleaning', 'general repair', 'diagnostics'
        ];
      }
      if (!profile.serviceAreas || profile.serviceAreas.length === 0) {
        profile.serviceAreas = ['Hyderabad', 'hyd', 'Hasthinapuram', 'Austin', '78701'];
      } else if (!profile.serviceAreas.some((a) => a.toLowerCase().includes('hyd'))) {
        profile.serviceAreas.push('Hyderabad', 'hyd', 'Hasthinapuram');
      }
      await profile.save();
      console.log(`✅ [AutoSeed] Activated and verified provider profile: ${profile._id}`);
    }

    // Ensure at least 2 verified providers exist for demo & provider matching fallback
    const verifiedCount = await ProviderProfile.countDocuments({ verificationStatus: 'verified' });
    if (verifiedCount < 2) {
      const demoProviders = [
        {
          name: 'Rajesh Sharma',
          email: 'rajesh.pro@careconnect.dev',
          city: 'Hyderabad',
          categories: categoryIds,
          skills: ['ac repair', 'appliance repair', 'cooling', 'leak repair', 'electrical wiring'],
          hourlyRate: 400,
          experienceYears: 7,
          serviceAreas: ['Hyderabad', 'Hasthinapuram', 'hyd', 'Telangana'],
          bio: 'Certified AC & home appliance specialist with 7+ years of experience across Hyderabad.',
        },
        {
          name: 'Suresh Kumar',
          email: 'suresh.pro@careconnect.dev',
          city: 'Hyderabad',
          categories: categoryIds,
          skills: ['plumbing', 'pipe fitting', 'leak diagnostics', 'electrical basics'],
          hourlyRate: 350,
          experienceYears: 5,
          serviceAreas: ['Hyderabad', 'Hasthinapuram', 'hyd', 'Telangana'],
          bio: 'Master technician for leak troubleshooting, plumbing fixes, and home repairs.',
        },
      ];

      for (const dp of demoProviders) {
        let user = await User.findOne({ email: dp.email });
        if (!user) {
          user = await User.create({
            name: dp.name,
            email: dp.email,
            password: 'password123',
            role: 'provider',
            isVerified: true,
            address: { city: dp.city, state: 'Telangana' },
            avatarColor: '#059669',
          });
        }
        const existingProfile = await ProviderProfile.findOne({ user: user._id });
        if (!existingProfile) {
          await ProviderProfile.create({
            user: user._id,
            bio: dp.bio,
            categories: dp.categories,
            skills: dp.skills,
            experienceYears: dp.experienceYears,
            hourlyRate: dp.hourlyRate,
            serviceAreas: dp.serviceAreas,
            verificationStatus: 'verified',
            ratingAverage: 4.9,
            ratingCount: 28,
            completedJobs: 35,
            isOnline: true,
          });
        }
      }
      console.log('✅ [AutoSeed] Verified demo providers created for instant matching.');
    }
  } catch (err) {
    console.error('⚠️ [AutoSeed] Warning: failed to ensure default categories/providers:', err.message);
  }
}

module.exports = { DEFAULT_CATEGORIES, ensureDefaultCategories };
