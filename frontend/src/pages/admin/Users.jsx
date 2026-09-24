import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { admin as adminApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, Avatar, Spinner, EmptyState, Modal, Select } from '../../components/ui';
import { Users, Search, UserPlus } from 'lucide-react';

const emptyForm = { name: '', email: '', password: '', role: 'operations_manager', phone: '' };

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const { data, loading, reload } = usePoll(() => adminApi.users({ q: q || undefined, role: role || undefined, limit: 50 }), [q, role]);
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const items = data?.data || [];

  const createStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createStaff(form);
      toast.success('Staff account created.');
      setModalOpen(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create account.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    try {
      await adminApi.setUserStatus(u._id, !u.isActive);
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}.`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">Users</h1>
        <Button onClick={() => setModalOpen(true)}><UserPlus size={15} /> New staff account</Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-52">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="operations_manager">Operations Manager</option>
          <option value="support_agent">Support Agent</option>
          <option value="provider">Provider</option>
          <option value="customer">Customer</option>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={Users} title="No users found" />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={u.name} color={u.avatarColor} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">{u.name}</p>
                  <p className="text-xs text-muted">{u.email} · <span className="capitalize">{u.role.replace('_', ' ')}</span></p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => toggleStatus(u)}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create staff account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={createStaff} disabled={saving}>{saving ? <Spinner size={16} className="text-white" /> : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={createStaff} className="space-y-4">
          <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="admin">Admin</option>
            <option value="operations_manager">Operations Manager</option>
            <option value="support_agent">Support Agent</option>
          </Select>
          <Input label="Full name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}
