import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Building2,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  _id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
  dateOfJoining: string;
  status: 'active' | 'inactive';
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeForm {
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  salary: number;
  dateOfJoining: string;
  status: 'active' | 'inactive';
  branchId: string;
}

interface Branch {
  id: string;       // backend may send "id" or "_id"
  _id?: string;     // fallback
  name: string;
  branchId : string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://digitalness-backend.onrender.com/api';

const emptyEmployee: EmployeeForm = {
  name: '',
  role: '',
  department: 'Sales',
  phone: '',
  email: '',
  password: '',
  address: '',
  salary: 0,
  dateOfJoining: new Date().toISOString().split('T')[0],
  status: 'active',
  branchId: '',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<EmployeeForm>(emptyEmployee);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { toast } = useToast();

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const departments = [
    'All',
    'Management',
    'Sales',
    'Creative',
    'Technical',
    'Marketing',
    'Support',
  ];

  const roles = [
    'Admin',
    'Operational Manager',
    'Performance Marketer',
    'Content Writer',
    'Graphic Designer',
    'UI/UX',
    'Telecaller',
    'Frontend Dev',
    'Backend Dev',
    'BDE',
    'Support',
  ];

  const getAuthConfig = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const getArrayData = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.branches)) return data.branches;
    return [];
  };

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const [res] = await Promise.all([
        fetch(`${API_URL}/branches`, getAuthConfig()),
        wait(400),
      ]);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch branches');
      }

     const branchesData = getArrayData(data).map((branch: any) => ({
  id: branch.id || branch._id,
  branchId: branch.branchId || branch.branchId,   // add this
  name: branch.name,
}));

      setBranches(branchesData);

      // If we have branches and the selectedBranchFilter is still 'All', optionally set first branch?
      // Not needed.
    } catch (error: any) {
      console.error('Branch fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load branches',
        variant: 'destructive',
      });
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [res] = await Promise.all([
        fetch(`${API_URL}/users`, getAuthConfig()),
        wait(400),
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch users');
      setEmployees(getArrayData(data));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      selectedDepartment === 'All' || emp.department === selectedDepartment;

    const matchesBranch =
      selectedBranchFilter === 'All' || emp.branchId === selectedBranchFilter;

    return matchesSearch && matchesDepartment && matchesBranch;
  });

  const selectedEmpData = employees.find((e) => e._id === selectedEmployee);

  const departmentStats = departments
    .filter((dept) => dept !== 'All')
    .map((dept) => ({
      department: dept,
      count: employees.filter((emp) => emp.department === dept).length,
    }));

  // Branch name lookup – supports both id and _id
  const branchName = (branchId?: string) => {
    if (!branchId) return '—';
    const branch = branches.find((b) => b.id === branchId || b._id === branchId);
    return branch?.name || branchId;
  };

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const validateAddForm = () => {
    if (
      !formData.name ||
      !formData.role ||
      !formData.phone ||
      !formData.email ||
      !formData.password ||
      !formData.branchId
    ) {
      toast({
        title: 'Error',
        description: 'Please fill name, role, phone, email, password and branch',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateEditForm = () => {
    if (!formData.name || !formData.role || !formData.phone || !formData.email || !formData.branchId) {
      toast({
        title: 'Error',
        description: 'Please fill name, role, phone, email and branch',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleAddEmployee = async () => {
    if (!validateAddForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        salary: Number(formData.salary),
        address: formData.address,
        dateOfJoining: formData.dateOfJoining,
        status: formData.status,
        branchId: formData.branchId,
      };

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.message || 'Failed to register user',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'User Registered',
        description: `${formData.name} added successfully`,
      });

      setShowAddModal(false);
      setFormData(emptyEmployee);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Server Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee) return;
    if (!validateEditForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        salary: Number(formData.salary),
        dateOfJoining: formData.dateOfJoining,
        status: formData.status,
        branchId: formData.branchId,
      };

      const res = await fetch(`${API_URL}/users/${editingEmployee._id}`, {
        method: 'PUT',
        ...getAuthConfig(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update user',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'User Updated',
        description: `${formData.name} updated successfully`,
      });

      setShowEditModal(false);
      setEditingEmployee(null);
      setFormData(emptyEmployee);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Server Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This action cannot be undone.`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        ...getAuthConfig(),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete user',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'User Deleted',
        description: `${name} removed successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Server Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      role: emp.role || '',
      department: emp.department || 'Sales',
      phone: emp.phone || '',
      email: emp.email || '',
      password: '',
      address: emp.address || '',
      salary: emp.salary || 0,
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split('T')[0] : new Date().toISOString().split('T')[0],
      status: emp.status || 'active',
      branchId: emp.branchId || '',
    });
    setShowEditModal(true);
  };


  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className="bg-card rounded-xl border border-border shadow-card p-5 overflow-hidden"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
          </div>

          <div className="space-y-3 mb-5">
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-10/12 rounded bg-muted animate-pulse" />
            <div className="h-3 w-11/12 rounded bg-muted animate-pulse" />
            <div className="h-3 w-8/12 rounded bg-muted animate-pulse" />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="User name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Role *</label>
          <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Department *</label>
          <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {departments.filter((d) => d !== 'All').map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Branch *</label>
          {branchesLoading ? (
            <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading branches...
            </div>
          ) : branches.length === 0 ? (
            <div className="px-3 py-2 border rounded-md bg-destructive/10 text-destructive text-sm">
              No branches found. Please add branches in settings.
            </div>
          ) : (
            <Select 
  value={formData.branchId} 
  onValueChange={(v) => setFormData({ ...formData, branchId: v })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select branch" />
  </SelectTrigger>
  <SelectContent>
    {branches.map((branch) => (
      <SelectItem 
        key={branch.id} 
        value={branch.branchId || branch.id}  // falls back to id if branchId missing
      >
        {branch.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Phone *</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Password *</label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Create password (min 6 chars)"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Monthly Salary ₹</label>
          <Input
            type="number"
            value={formData.salary || ''}
            onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) || 0 })}
            placeholder="Salary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Joining Date</label>
          <Input
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Address"
        />
      </div>

      {isEdit && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          disabled={submitting}
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingEmployee(null);
            setFormData(emptyEmployee);
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="gradient"
          disabled={submitting}
          onClick={isEdit ? handleEditEmployee : handleAddEmployee}
          className="flex-1"
        >
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitting ? (isEdit ? 'Updating...' : 'Registering...') : (isEdit ? 'Update User' : 'Register User')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Users / Employees</h1>
          <p className="text-muted-foreground">Register users, manage employees, roles and branch access</p>
        </div>
        <Button variant="gradient" onClick={() => { setFormData(emptyEmployee); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Register User
        </Button>
      </motion.div>

      {/* Department stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {departmentStats.map((dept) => (
          <div
            key={dept.department}
            onClick={() => setSelectedDepartment(dept.department)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedDepartment === dept.department
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <p className="text-2xl font-heading font-bold">{dept.count}</p>
            <p className={`text-sm ${selectedDepartment === dept.department ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {dept.department}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {branchesLoading ? (
            <div className="w-[160px] px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : branches.length > 0 ? (
            <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.branchId}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[160px] px-3 py-2 border rounded-md bg-destructive/10 text-destructive text-sm text-center">
              No branches
            </div>
          )}

          <Button variant="outline" size="icon" onClick={() => { setSelectedDepartment('All'); setSelectedBranchFilter('All'); setSearchQuery(''); }}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Employee Cards */}
      {loading || branchesLoading ? (
        <LoadingSkeleton />
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No users found</div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg">
                    {employee.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
                <Badge variant={employee.status === 'active' ? 'success' : 'secondary'}>{employee.status}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{branchName(employee.branchId)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{employee.address || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Salary</p>
                  <p className="font-semibold text-foreground">{formatSalary(employee.salary)}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(employee._id)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditModal(employee)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === employee._id}
                    onClick={() => handleDelete(employee._id, employee.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === employee._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* View Profile Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {selectedEmpData && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedEmpData.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold">{selectedEmpData.name}</h2>
                  <p className="text-muted-foreground">{selectedEmpData.role} • {selectedEmpData.department}</p>
                  <Badge variant={selectedEmpData.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                    {selectedEmpData.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="text-xl font-bold">{branchName(selectedEmpData.branchId)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="text-xl font-bold">{selectedEmpData.department}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="text-xl font-bold">{formatSalary(selectedEmpData.salary)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Joined On</p>
                  <p className="text-xl font-bold">
                    {selectedEmpData.dateOfJoining
                      ? new Date(selectedEmpData.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{selectedEmpData.phone}</div>
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{selectedEmpData.email}</div>
                <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" />{selectedEmpData.address || 'N/A'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Register New User</DialogTitle></DialogHeader>{renderForm(false)}</DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>{renderForm(true)}</DialogContent>
      </Dialog>
    </div>
  );
}