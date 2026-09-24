import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Sparkles,
  Zap,
  Droplets,
  Hammer,
  Refrigerator,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CalendarClock,
  Star,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Award,
  Lock,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';

// Brand Color Palette Constants
// Primary: Deep Navy #152238
// Accent: Tool Amber #D98C2B
// Success: Green #2F8F5B

const ROLE_HOME = {
  admin: '/admin',
  operations_manager: '/admin',
  support_agent: '/support',
  provider: '/provider',
  customer: '/customer',
};

const SERVICES = [
  {
    id: 'washer',
    name: 'Washing Machine Repair',
    shortDesc: 'Diagnostics, spin cycle, pump & drum repairs by certified techs.',
    headline: 'Washing machine acting up? We\'ve got you.',
    subline: 'Same-day diagnostics and factory-grade part replacements before laundry piles up.',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
    altText: 'Technician examining and servicing a modern washing machine',
    icon: Wrench,
    badge: 'Popular',
    startingAt: '₹499 diagnostics',
  },
  {
    id: 'cleaning',
    name: 'Home & Deep Cleaning',
    shortDesc: 'Move-in/out sanitization, eco-friendly deep cleans, and scheduled care.',
    headline: 'Spotless homes, zero stress.',
    subline: 'Vetted cleaning crews equipped with hospital-grade sanitizers for every room.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    altText: 'Professional residential cleaner sanitizing kitchen surface',
    icon: Sparkles,
    badge: 'Top Rated',
    startingAt: '₹799 flat-rate',
  },
  {
    id: 'electrical',
    name: 'Electrical Repair & Wiring',
    shortDesc: 'Panel upgrades, EV chargers, breaker troubleshooting & certified fixtures.',
    headline: 'Certified electricians, safe and reliable power.',
    subline: 'Licensed specialists handling emergency faults, circuit breakers, and lighting safely.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    altText: 'Licensed electrician testing wiring inside an electrical service panel',
    icon: Zap,
    badge: 'Licensed Only',
    startingAt: '₹599/hour',
  },
  {
    id: 'appliance',
    name: 'Appliance Repair (Fridge/Oven)',
    shortDesc: 'Cooling coils, thermostats, igniters, gaskets & range top maintenance.',
    headline: 'Keep your kitchen humming smoothly.',
    subline: 'Rapid repairs for failing refrigerator compressors and broken stove heating elements.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    altText: 'Modern kitchen appliances including refrigerator and stainless steel oven',
    icon: Refrigerator,
    badge: 'Same-day Available',
    startingAt: '₹499 base',
  },
  {
    id: 'plumbing',
    name: 'Plumbing & Leak Repair',
    shortDesc: 'Pipe leak detection, faucet installs, drain snaking & water heater fixes.',
    headline: 'Fast plumbing fixes before minor leaks become floods.',
    subline: '24/7 priority emergency dispatch with upfront quote estimates and zero hidden fees.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
    altText: 'Plumber using pipe wrench underneath kitchen sink pipework',
    icon: Droplets,
    badge: '24/7 Urgent',
    startingAt: '₹399 callout',
  },
  {
    id: 'handyman',
    name: 'General Maintenance & Handyman',
    shortDesc: 'Drywall repairs, door hanging, furniture assembly & carpentry punch-lists.',
    headline: 'Every odd job tackled with master craftsmanship.',
    subline: 'Reliable multi-skilled handymen ready to tackle your home to-do list in one visit.',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    altText: 'Craftsman assembling wood framing with precision measurement tools',
    icon: Hammer,
    badge: 'Flexible Slots',
    startingAt: '₹349/hour',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Describe your job',
    desc: 'Tell us what needs fixing in plain language. Select your preferred timing and location.',
  },
  {
    num: '02',
    title: 'AI matches verified providers',
    desc: 'Our scoring engine ranks vetted local specialists by trade license, proximity, and availability.',
  },
  {
    num: '03',
    title: 'Compare quotes & book',
    desc: 'Review transparent bids, inspect verified customer reviews, and lock in a guaranteed time slot.',
  },
  {
    num: '04',
    title: 'Track your job live',
    desc: 'Follow real-time status updates, inspect completion photos, and pay securely with escrow protection.',
  },
];

const STATS = [
  { value: '500+', label: 'Verified providers', sub: 'Background-checked & insured' },
  { value: '10,000+', label: 'Jobs completed', sub: 'Across 18 service categories' },
  { value: '4.8★', label: 'Average rating', sub: 'From verified homeowners' },
  { value: '100%', label: 'Conflict-free scheduling', sub: 'Zero double-booking guarantee' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth() || {};
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Touch swipe support
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const carouselContainerRef = useRef(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Preload all carousel slide images so rotation transitions are instant and never flash or crop
  useEffect(() => {
    SERVICES.forEach((service) => {
      const img = new Image();
      img.src = service.image;
    });
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setTimerKey((k) => k + 1);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SERVICES.length);
    setTimerKey((k) => k + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SERVICES.length) % SERVICES.length);
    setTimerKey((k) => k + 1);
  }, []);

  // Autorotate is ALWAYS ON by default: runs continuously every 4 seconds
  // Selecting a slide manually resets the 4-second timer and continues rotating from there
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SERVICES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [timerKey]);

  // Keyboard navigation on arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      nextSlide(); // Swiped left -> next slide & resets 4s timer
    } else if (distance < -50) {
      prevSlide(); // Swiped right -> previous slide & resets 4s timer
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/customer/new-request');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#101828] font-['Inter',sans-serif] selection:bg-[#D98C2B] selection:text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-50 bg-[#1F2421] border-b-2 border-[#D98C2B] text-white shadow-md"
        style={{
          backgroundColor: '#1F2421',
          borderBottom: '2px solid #D98C2B',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/homecarex-logo.png"
              alt="HomeCareX"
              className="h-11 w-11 rounded-lg object-cover bg-white p-0.5 shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <div className="flex items-center leading-tight">
                <span className="font-['Space_Grotesk'] font-bold text-2xl tracking-tight text-[#F5F5F0]">
                  HomeCare
                </span>
                <span className="font-['Space_Grotesk'] font-bold text-2xl tracking-tight text-[#2F8F5B]">
                  X
                </span>
              </div>
              <span className="text-[10px] text-[#F5F5F0]/60 tracking-wider font-medium uppercase -mt-0.5 hidden sm:block">
                Trusted Home Services
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#F5F5F0]">
            <a href="#services" className="hover:text-[#D98C2B] transition-colors">
              Our Services
            </a>
            <a href="#how-it-works" className="hover:text-[#D98C2B] transition-colors">
              How It Works
            </a>
            <a href="#stats" className="hover:text-[#D98C2B] transition-colors">
              Why Us
            </a>
            <a href="#about" className="hover:text-[#D98C2B] transition-colors">
              About
            </a>
          </nav>

          {/* Nav Right CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={ROLE_HOME[user.role] || '/customer'}
                  className="px-4 py-2 text-sm font-semibold bg-[#D98C2B] hover:bg-[#c27b22] text-white rounded-md shadow-sm transition-all hover:brightness-105 flex items-center gap-1.5"
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-xs font-medium text-[#F5F5F0] hover:text-[#D98C2B] transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-[#F5F5F0] hover:text-[#D98C2B] border border-white/20 hover:border-white/40 hover:bg-white/10 rounded-md transition-all"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-[#D98C2B] hover:bg-[#c27b22] text-white rounded-md shadow-sm transition-all hover:brightness-105"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="sm:hidden flex items-center gap-2">
            {user ? (
              <Link
                to={ROLE_HOME[user.role] || '/customer'}
                className="px-3 py-1.5 text-xs font-semibold bg-[#D98C2B] text-white rounded-md"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-[#F5F5F0] hover:text-[#D98C2B] border border-white/20 rounded-md"
              >
                Log in
              </Link>
            )}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-[#F5F5F0] hover:text-[#D98C2B] rounded-md hover:bg-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileNavOpen && (
          <div
            className="sm:hidden px-4 pt-2 pb-4 border-t border-[#D98C2B]/30 bg-[#1F2421] space-y-2"
            style={{ backgroundColor: '#1F2421' }}
          >
            <a
              href="#services"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#F5F5F0] hover:text-[#D98C2B]"
            >
              Our Services
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#F5F5F0] hover:text-[#D98C2B]"
            >
              How It Works
            </a>
            <a
              href="#stats"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#F5F5F0] hover:text-[#D98C2B]"
            >
              Why Us
            </a>
            <a
              href="#about"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#F5F5F0] hover:text-[#D98C2B]"
            >
              About
            </a>
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <Link
                  to={ROLE_HOME[user.role] || '/customer'}
                  className="w-full text-center py-2 text-sm font-semibold bg-[#D98C2B] text-white rounded-md"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="w-full text-center py-2 text-sm font-semibold bg-[#D98C2B] text-white rounded-md"
                >
                  Sign up
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* HERO SECTION — Autoplay Image Carousel (~80vh tall) */}
        <section
          ref={carouselContainerRef}
          className="relative w-full h-[80vh] min-h-[580px] max-h-[820px] bg-[#152238] text-white overflow-hidden select-none focus:outline-none"
          style={{
            position: 'relative',
            width: '100%',
            height: '80vh',
            minHeight: '580px',
            maxHeight: '820px',
          }}
          tabIndex={0}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-roledescription="carousel"
          aria-label="Featured Home Services"
        >
          {/* Background Images Carousel with Crossfade and Ken Burns Zoom */}
          {SERVICES.map((service, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={service.id}
                className={`absolute inset-0 w-full h-full overflow-hidden ${
                  prefersReducedMotion
                    ? 'transition-opacity duration-[2500ms] ease-linear'
                    : 'transition-opacity duration-1000 ease-in-out'
                } ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                }}
                aria-hidden={!isActive}
              >
                {/* Background Image with Ken Burns zoom effect and color saturation/contrast boost */}
                <img
                  src={service.image}
                  alt={service.altText}
                  loading="eager"
                  decoding="async"
                  fetchPriority={index < 2 ? 'high' : 'auto'}
                  className={`absolute inset-0 w-full h-full object-cover object-center ${
                    prefersReducedMotion ? '' : 'transition-transform duration-[7000ms] ease-out'
                  } ${
                    !prefersReducedMotion && isActive ? 'scale-105' : 'scale-100'
                  }`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    filter: 'saturate(1.12) contrast(1.05) brightness(1.02)',
                  }}
                />

                {/* Bottom-to-top gradient ONLY: transparent at top ~60%, fading to 55-65% navy in bottom third */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(to top, rgba(21, 34, 56, 0.65) 0%, rgba(21, 34, 56, 0.55) 25%, rgba(21, 34, 56, 0.2) 40%, rgba(21, 34, 56, 0) 60%, rgba(21, 34, 56, 0) 100%)',
                  }}
                />
              </div>
            );
          })}

          {/* Foreground Hero Content (Centered, Layered over Carousel) */}
          <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-10 sm:py-14">
            {/* Central Headline & Dynamic Slide Overlay Text */}
            <div className="max-w-3xl my-auto text-left">
              {/* Persistent Main Headline */}
              <h1
                className="font-['Space_Grotesk'] text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]"
                style={{
                  textShadow: '0 2px 14px rgba(10, 18, 30, 0.85), 0 1px 3px rgba(10, 18, 30, 0.95)',
                }}
              >
                Trusted help for every home service,{' '}
                <span className="text-[#D98C2B]">booked in minutes.</span>
              </h1>

              {/* Dynamic Headline per active slide */}
              <div className="mt-4 min-h-[56px] sm:min-h-[64px]">
                <p
                  className="font-['Space_Grotesk'] text-lg sm:text-2xl font-semibold text-white transition-all duration-300 drop-shadow-md"
                  style={{
                    textShadow: '0 2px 10px rgba(10, 18, 30, 0.85), 0 1px 3px rgba(10, 18, 30, 0.95)',
                  }}
                >
                  {SERVICES[currentSlide].headline}
                </p>
                <p
                  className="text-sm sm:text-base text-white/95 mt-1 max-w-2xl font-medium leading-relaxed"
                  style={{
                    textShadow: '0 1px 6px rgba(10, 18, 30, 0.8)',
                  }}
                >
                  {SERVICES[currentSlide].subline}
                </p>
              </div>

              {/* Persistent Search Bar & Action Buttons */}
              <div className="mt-8 space-y-3">
                <form
                  onSubmit={handleSearchSubmit}
                  className="p-1.5 sm:p-2 rounded-md bg-[#152238]/85 backdrop-blur-md border border-white/25 shadow-2xl max-w-xl flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex items-center gap-2.5 px-3 py-2 w-full flex-1 text-white">
                    <Search size={18} className="text-[#D98C2B] shrink-0" />
                    <input
                      type="text"
                      placeholder="What needs repair? (e.g. leaking sink, washer motor)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60 focus:ring-0"
                    />
                  </div>
                  <Link to="/register" className="w-full sm:w-auto">
                    <button
                      type="button"
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#D98C2B] hover:bg-[#c27b22] text-[#152238] font-bold text-sm rounded-md shadow-md transition-all flex items-center justify-center gap-2 shrink-0 hover:brightness-105"
                    >
                      <span>Request a service</span>
                      <ArrowRight size={16} />
                    </button>
                  </Link>
                </form>

                {/* Secondary buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <Link
                    to="/register?role=provider"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/30 hover:border-white/60 text-white font-medium hover:bg-white/10 backdrop-blur-sm transition-all"
                    style={{
                      textShadow: '0 1px 4px rgba(10, 18, 30, 0.7)',
                    }}
                  >
                    <span>Become a provider</span>
                    <ArrowRight size={14} className="text-[#D98C2B]" />
                  </Link>
                  <span
                    className="text-white/80 text-xs hidden sm:inline font-medium"
                    style={{
                      textShadow: '0 1px 4px rgba(10, 18, 30, 0.7)',
                    }}
                  >
                    · Zero lead fees · Guaranteed payouts · Smart scheduling
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Controls: Carousel Indicators & Arrows */}
            <div className="flex items-center justify-between pt-6 border-t border-white/15">
              {/* Slide Counter / Category Badge */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#D98C2B] font-bold tracking-wider drop-shadow-sm">
                  0{currentSlide + 1} / 0{SERVICES.length}
                </span>
                <span className="hidden sm:inline-block text-xs text-white/90 font-medium border-l border-white/20 pl-3 drop-shadow-sm">
                  {SERVICES[currentSlide].name}
                </span>
              </div>

              {/* Clickable Dot Indicators (Resets 4s timer on click without stopping autorotate) */}
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Carousel slide dots"
              >
                {SERVICES.map((s, index) => {
                  const isActive = index === currentSlide;
                  return (
                    <button
                      key={s.id}
                      onClick={() => goToSlide(index)}
                      className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#D98C2B] ${
                        isActive
                          ? 'w-8 bg-[#D98C2B]'
                          : 'w-2.5 bg-white/40 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${index + 1}: ${s.name}`}
                      aria-current={isActive ? 'true' : 'false'}
                      role="tab"
                    />
                  );
                })}
              </div>

              {/* Manual Left/Right Arrow Navigation (Resets 4s timer on click without stopping autorotate) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-md bg-[#152238]/70 hover:bg-[#152238]/90 border border-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#D98C2B] backdrop-blur-sm"
                  aria-label="Previous service slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-md bg-[#152238]/70 hover:bg-[#152238]/90 border border-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#D98C2B] backdrop-blur-sm"
                  aria-label="Next service slide"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: "Our Services" — 6-Card Responsive Grid */}
        <section id="services" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D98C2B]">
              Verified Trade Specialists
            </span>
            <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#152238] mt-2">
              Our Services
            </h2>
            <p className="text-[#5b6472] mt-2 text-sm sm:text-base">
              Every job is backed by certified local technicians, transparent upfront quotes, and full satisfaction guarantees.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, index) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs hover:border-[#D98C2B]/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Service Photo with Hairline Border */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#152238]/5 border-b border-gray-100">
                    <img
                      src={s.thumb}
                      alt={s.altText}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-[#152238]/85 text-white backdrop-blur-xs border border-white/15">
                        {s.badge}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-md bg-[#152238] text-white flex items-center justify-center shrink-0">
                          <Icon size={18} className="text-[#D98C2B]" />
                        </div>
                        <h3 className="font-['Space_Grotesk'] font-bold text-lg text-[#152238] leading-tight">
                          {s.name}
                        </h3>
                      </div>
                      <p className="text-sm text-[#5b6472] leading-relaxed">
                        {s.shortDesc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#152238] bg-gray-100 px-2.5 py-1 rounded-md">
                        {s.startingAt}
                      </span>
                      <Link
                        to="/register"
                        className="font-semibold text-[#152238] hover:text-[#D98C2B] inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Book now</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: "How It Works" — 4 Numbered Steps */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-white border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D98C2B]">
                Frictionless Dispatch
              </span>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#152238] mt-2">
                How It Works
              </h2>
              <p className="text-[#5b6472] mt-2 text-sm sm:text-base">
                From problem description to job completion in 4 streamlined steps.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {STEPS.map((step, idx) => (
                <div
                  key={step.num}
                  className="bg-[#f5f6f8] rounded-md border border-gray-200/90 p-6 flex flex-col justify-between hover:border-gray-300 transition-colors relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-['Space_Grotesk'] font-bold text-3xl text-[#D98C2B]">
                        {step.num}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#152238]/5 text-[#152238]">
                        Step {idx + 1}
                      </span>
                    </div>
                    <h3 className="font-['Space_Grotesk'] font-bold text-lg text-[#152238] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#5b6472] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center gap-1.5 text-xs text-[#2F8F5B] font-semibold">
                    <CheckCircle2 size={15} />
                    <span>Verified workflow</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: Trust & Stats Strip */}
        <section id="stats" className="py-14 bg-[#152238] text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="p-5 rounded-md bg-white/5 border border-white/10 flex flex-col items-center justify-center"
                >
                  <div className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold text-[#D98C2B] tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-white mt-1.5">
                    {s.label}
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: About HomeCareX & Platform Information */}
        <section id="about" className="py-20 sm:py-24 bg-white border-b border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#2F8F5B]/10 border border-[#2F8F5B]/20 text-[#2F8F5B] text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck size={14} />
                <span>About HomeCareX</span>
              </div>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#152238]">
                Trusted home services, <span className="text-[#2F8F5B]">all in one place.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#5b6472] leading-relaxed">
                HomeCareX is an on-demand residential maintenance and repair platform engineered to connect homeowners with verified trade professionals. We eliminate the frustration of unreturned calls, hidden pricing, and scheduling conflicts.
              </p>
            </div>

            {/* Core Values / Platform Architecture Cards */}
            <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1: 100% Background-Checked */}
              <div className="p-8 rounded-xl bg-[#f8fafc] border border-gray-200/80 hover:border-gray-300 transition-all hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-lg bg-[#152238] text-white flex items-center justify-center mb-6 shadow-sm">
                    <ShieldCheck size={24} className="text-[#2F8F5B]" />
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#152238] mb-3">
                    Verified Trade Specialists
                  </h3>
                  <p className="text-sm text-[#5b6472] leading-relaxed">
                    Every service technician is rigorously vetted. We verify state trade licensing, general liability insurance, and multi-state background checks before any provider is dispatched to your home.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 text-xs font-semibold text-[#152238] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#2F8F5B]" />
                  <span>Licensed · Bonded · Insured</span>
                </div>
              </div>

              {/* Card 2: AI Matching & Conflict-Free Dispatch */}
              <div className="p-8 rounded-xl bg-[#f8fafc] border border-gray-200/80 hover:border-gray-300 transition-all hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-lg bg-[#152238] text-white flex items-center justify-center mb-6 shadow-sm">
                    <CalendarClock size={24} className="text-[#D98C2B]" />
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#152238] mb-3">
                    Conflict-Free Smart Dispatch
                  </h3>
                  <p className="text-sm text-[#5b6472] leading-relaxed">
                    Say goodbye to four-hour arrival windows. Our proprietary matching system dispatches nearby specialists based on exact trade classification, proximity, and live schedule availability with zero double-booking.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 text-xs font-semibold text-[#152238] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#2F8F5B]" />
                  <span>Real-time GPS tracking & updates</span>
                </div>
              </div>

              {/* Card 3: Upfront Pricing & Escrow */}
              <div className="p-8 rounded-xl bg-[#f8fafc] border border-gray-200/80 hover:border-gray-300 transition-all hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 rounded-lg bg-[#152238] text-white flex items-center justify-center mb-6 shadow-sm">
                    <Lock size={24} className="text-[#2F8F5B]" />
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold text-[#152238] mb-3">
                    Transparent Escrow Payments
                  </h3>
                  <p className="text-sm text-[#5b6472] leading-relaxed">
                    Receive transparent, upfront quotes with no surprise diagnostic add-ons. Payments are safely held in digital escrow and only released after work is verified, inspected, and approved by you.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 text-xs font-semibold text-[#152238] flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#2F8F5B]" />
                  <span>100% money-back satisfaction guarantee</span>
                </div>
              </div>
            </div>

            {/* Application Overview Banner: The 4 Core Domains */}
            <div className="mt-12 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#152238] to-[#1c2d49] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D98C2B] font-bold uppercase tracking-wider mb-2">
                    <span>Comprehensive Home Coverage</span>
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-white">
                    One app for diagnostics, maintenance, and emergency fixes.
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base mt-2 leading-relaxed">
                    HomeCareX brings verified specialists across appliances, electrical, plumbing, deep cleaning, and general maintenance together on a single unified platform. Track work orders, view past service logs, and communicate directly with technicians in one place.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 shrink-0 w-full lg:w-auto">
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-white/10 border border-white/10">
                    <Wrench size={20} className="text-[#D98C2B]" />
                    <span className="text-sm font-semibold text-white">Appliance Repair</span>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-white/10 border border-white/10">
                    <Zap size={20} className="text-[#D98C2B]" />
                    <span className="text-sm font-semibold text-white">Electrical Wiring</span>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-white/10 border border-white/10">
                    <Droplets size={20} className="text-blue-400" />
                    <span className="text-sm font-semibold text-white">Leak & Plumbing</span>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-white/10 border border-white/10">
                    <Sparkles size={20} className="text-[#2F8F5B]" />
                    <span className="text-sm font-semibold text-white">Deep Cleaning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Ready to get started (Lightened warm champagne background) */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EE] to-[#FEF3DC] border-y border-[#F3DFC1] text-[#152238] relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#D98C2B]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#2F8F5B]/10 blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#152238]">
              Ready to get started with <span className="text-[#D98C2B]">HomeCare</span><span className="text-[#2F8F5B]">X</span>?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#5b6472] max-w-2xl mx-auto font-medium leading-relaxed">
              Book your certified service provider today or register your business to access matched jobs with zero scheduling conflicts.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <button
                  type="button"
                  className="px-6 py-3.5 bg-[#D98C2B] hover:bg-[#c27b22] text-white font-bold text-sm sm:text-base rounded-md shadow-lg shadow-[#D98C2B]/25 transition-all hover:brightness-105 flex items-center gap-2"
                >
                  <span>Sign up now</span>
                  <ArrowRight size={16} />
                </button>
              </Link>
              <Link to="/login">
                <button
                  type="button"
                  className="px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-[#152238] font-bold text-sm sm:text-base rounded-md shadow-sm transition-all"
                >
                  Log in to account
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#152238] text-white/70 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img
                src="/homecarex-logo.png"
                alt="HomeCareX"
                className="h-10 w-10 rounded-lg object-cover bg-white p-0.5 shadow-sm"
              />
              <div className="flex flex-col">
                <div className="flex items-center leading-tight">
                  <span className="font-['Space_Grotesk'] font-bold text-2xl text-white">
                    HomeCare
                  </span>
                  <span className="font-['Space_Grotesk'] font-bold text-2xl text-[#2F8F5B]">
                    X
                  </span>
                </div>
                <span className="text-xs text-white/50">
                  Trusted Home Services. All in One Place.
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
              <a href="#services" className="hover:text-white transition-colors">
                Services
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
              <Link to="/login" className="hover:text-white transition-colors">
                Log in
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Sign up
              </Link>
              <Link to="/register?role=provider" className="hover:text-white transition-colors">
                Become a Provider
              </Link>
            </nav>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} HomeCareX. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Trusted Home Services Platform</span>
              <span>•</span>
              <span>Zero double-booking guarantee</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
