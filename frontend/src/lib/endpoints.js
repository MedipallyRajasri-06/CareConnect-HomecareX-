import api, { unwrap } from './api';

export const auth = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  updateMe: (payload) => unwrap(api.put('/auth/me', payload)),
  changePassword: (payload) => unwrap(api.put('/auth/password', payload)),
};

export const categories = {
  list: (params) => unwrap(api.get('/categories', { params })),
  get: (id) => unwrap(api.get(`/categories/${id}`)),
  create: (payload) => unwrap(api.post('/categories', payload)),
  update: (id, payload) => unwrap(api.put(`/categories/${id}`, payload)),
  remove: (id) => unwrap(api.delete(`/categories/${id}`)),
};

export const providers = {
  list: (params) => unwrap(api.get('/providers', { params })),
  recommendations: (params) => unwrap(api.get('/providers/recommendations', { params })),
  me: () => unwrap(api.get('/providers/me')),
  get: (id) => unwrap(api.get(`/providers/${id}`)),
  updateMe: (payload) => unwrap(api.put('/providers/me', payload)),
  addDocument: (payload) => unwrap(api.post('/providers/me/documents', payload)),
  verify: (id, payload) => unwrap(api.put(`/providers/${id}/verify`, payload)),
  addSlots: (slots) => unwrap(api.post('/providers/me/availability', { slots })),
  removeSlot: (slotId) => unwrap(api.delete(`/providers/me/availability/${slotId}`)),
  reviews: (providerId) => unwrap(api.get(`/providers/${providerId}/reviews`)),
};

export const requests = {
  create: (payload) => unwrap(api.post('/requests', payload)),
  list: (params) => unwrap(api.get('/requests', { params })),
  get: (id) => unwrap(api.get(`/requests/${id}`)),
  updateCategory: (id, categoryId) => unwrap(api.put(`/requests/${id}/category`, { categoryId })),
  match: (id) => unwrap(api.post(`/requests/${id}/match`)),
  cancel: (id, reason) => unwrap(api.put(`/requests/${id}/cancel`, { reason })),
  createQuote: (requestId, payload) => unwrap(api.post(`/requests/${requestId}/quotes`, payload)),
  listQuotes: (requestId) => unwrap(api.get(`/requests/${requestId}/quotes`)),
};

export const quotes = {
  mine: () => unwrap(api.get('/quotes/mine')),
  accept: (id, payload) => unwrap(api.put(`/quotes/${id}/accept`, payload)),
  decline: (id) => unwrap(api.put(`/quotes/${id}/decline`)),
  withdraw: (id) => unwrap(api.put(`/quotes/${id}/withdraw`)),
};

export const bookings = {
  list: (params) => unwrap(api.get('/bookings', { params })),
  get: (id) => unwrap(api.get(`/bookings/${id}`)),
  updateStatus: (id, payload) => unwrap(api.put(`/bookings/${id}/status`, payload)),
  updateTracking: (id, payload) => unwrap(api.put(`/bookings/${id}/tracking`, payload)),
  claimWarranty: (id, payload) => unwrap(api.post(`/bookings/${id}/warranty-claim`, payload)),
  maskedCall: (id) => unwrap(api.post(`/bookings/${id}/masked-call`)),
  repeat: (id, payload) => unwrap(api.post(`/bookings/${id}/repeat`, payload)),
  confirm: (id) => unwrap(api.put(`/bookings/${id}/confirm`)),
  cancel: (id, reason) => unwrap(api.put(`/bookings/${id}/cancel`, { reason })),
  review: (bookingId, payload) => unwrap(api.post(`/bookings/${bookingId}/review`, payload)),
  dispute: (bookingId, payload) => unwrap(api.post(`/bookings/${bookingId}/disputes`, payload)),
  getMessages: (id) => unwrap(api.get(`/bookings/${id}/messages`)),
  sendMessage: (id, payload) => unwrap(api.post(`/bookings/${id}/messages`, payload)),
};

export const invoices = {
  list: () => unwrap(api.get('/invoices')),
  get: (id) => unwrap(api.get(`/invoices/${id}`)),
  pay: (id) => unwrap(api.put(`/invoices/${id}/pay`)),
};

export const reviews = {
  respond: (id, response) => unwrap(api.put(`/reviews/${id}/respond`, { response })),
};

export const disputes = {
  list: (params) => unwrap(api.get('/disputes', { params })),
  get: (id) => unwrap(api.get(`/disputes/${id}`)),
  assign: (id, agentId) => unwrap(api.put(`/disputes/${id}/assign`, { agentId })),
  addMessage: (id, message) => unwrap(api.post(`/disputes/${id}/messages`, { message })),
  resolve: (id, payload) => unwrap(api.put(`/disputes/${id}/resolve`, payload)),
};

export const notifications = {
  list: () => unwrap(api.get('/notifications')),
  markRead: (id) => unwrap(api.put(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.put('/notifications/read-all')),
};

export const admin = {
  users: (params) => unwrap(api.get('/admin/users', { params })),
  createStaff: (payload) => unwrap(api.post('/admin/users', payload)),
  setUserStatus: (id, isActive) => unwrap(api.put(`/admin/users/${id}/status`, { isActive })),
  auditLogs: (params) => unwrap(api.get('/admin/audit-logs', { params })),
};

export const analytics = {
  overview: () => unwrap(api.get('/analytics/overview')),
  provider: () => unwrap(api.get('/analytics/provider')),
};
