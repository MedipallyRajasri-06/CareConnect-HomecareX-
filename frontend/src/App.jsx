import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';
import NotFound from './pages/NotFound';

import CustomerDashboard from './pages/customer/Dashboard';
import NewRequest from './pages/customer/NewRequest';
import CustomerRequests from './pages/customer/Requests';
import CustomerRequestDetail from './pages/customer/RequestDetail';
import CustomerBookings from './pages/customer/Bookings';
import CustomerBookingDetail from './pages/customer/BookingDetail';

import ProviderDashboard from './pages/provider/Dashboard';
import ProviderRequests from './pages/provider/Requests';
import ProviderRequestDetail from './pages/provider/RequestDetail';
import ProviderJobs from './pages/provider/Jobs';
import ProviderJobDetail from './pages/provider/JobDetail';
import ProviderAvailability from './pages/provider/Availability';
import ProviderProfile from './pages/provider/Profile';
import ProviderReviews from './pages/provider/Reviews';

import AdminDashboard from './pages/admin/Dashboard';
import AdminCategories from './pages/admin/Categories';
import AdminProviders from './pages/admin/Providers';
import AdminUsers from './pages/admin/Users';
import AdminAuditLog from './pages/admin/AuditLog';

import DisputesList from './pages/shared/DisputesList';
import DisputeDetail from './pages/shared/DisputeDetail';
import SupportDashboard from './pages/support/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/" element={<LandingPage />} />

            {/* Customer */}
            <Route element={<ProtectedRoute roles={['customer']}><Layout /></ProtectedRoute>}>
              <Route path="/customer" element={<CustomerDashboard />} />
              <Route path="/customer/new-request" element={<NewRequest />} />
              <Route path="/customer/requests" element={<CustomerRequests />} />
              <Route path="/customer/requests/:id" element={<CustomerRequestDetail />} />
              <Route path="/customer/bookings" element={<CustomerBookings />} />
              <Route path="/customer/bookings/:id" element={<CustomerBookingDetail />} />
              <Route path="/disputes/:id" element={<DisputeDetail />} />
            </Route>

            {/* Provider */}
            <Route element={<ProtectedRoute roles={['provider']}><Layout /></ProtectedRoute>}>
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/provider/requests" element={<ProviderRequests />} />
              <Route path="/provider/requests/:id" element={<ProviderRequestDetail />} />
              <Route path="/provider/jobs" element={<ProviderJobs />} />
              <Route path="/provider/jobs/:id" element={<ProviderJobDetail />} />
              <Route path="/provider/reviews" element={<ProviderReviews />} />
              <Route path="/provider/disputes" element={<DisputesList basePath="/provider/disputes" />} />
              <Route path="/provider/disputes/:id" element={<DisputeDetail />} />
              <Route path="/provider/availability" element={<ProviderAvailability />} />
              <Route path="/provider/profile" element={<ProviderProfile />} />
            </Route>

            {/* Admin / Operations Manager */}
            <Route element={<ProtectedRoute roles={['admin', 'operations_manager']}><Layout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/categories" element={<AdminCategories />} />
              <Route path="/admin/providers" element={<AdminProviders />} />
              <Route path="/admin/disputes" element={<DisputesList basePath="/admin/disputes" />} />
              <Route path="/admin/disputes/:id" element={<DisputeDetail />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/audit-log" element={<AdminAuditLog />} />
            </Route>

            {/* Support Agent */}
            <Route element={<ProtectedRoute roles={['support_agent']}><Layout /></ProtectedRoute>}>
              <Route path="/support" element={<SupportDashboard />} />
              <Route path="/support/:id" element={<DisputeDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
