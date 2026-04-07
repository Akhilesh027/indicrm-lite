import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Phone, Mail, MapPin, Edit, Trash2, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { employeesByDepartment, Employee } from '@/data/dummyData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EmployeeForm {
  name: string; role: string; department: string; phone: string; email: string;
  address: string; salary: number; dateOfJoining: string; status: 'active' | 'inactive';
}

const emptyEmployee: EmployeeForm = {
  name: '', role: '', department: 'Sales', phone: '', email: '', address: '',
  salary: 0, dateOfJoining: new Date().toISOString().split('T')[0], status: 'active',
};

export default function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState(emptyEmployee);
  const { toast } = useToast();

  const departments = ['All', 'Sales', 'Creative', 'Technical', 'Marketing'];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartment === 'All' || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const selectedEmpData = employees.find((e) => e.id === selectedEmployee);

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const handleAddEmployee = () => {
    if (!formData.name || !formData.role || !formData.phone) {
      toast({ title: 'Error', description: 'Please fill name, role and phone', variant: 'destructive' });
      return;
    }
    const newEmp: Employee = {
      ...formData,
      id: `EMP${Date.now()}`,
      salary: Number(formData.salary),
      bankDetails: { accountNumber: '****0000', bankName: 'N/A', ifsc: 'N/A' },
      performance: { completedTasks: 0, successRate: 0, avgTurnaround: 0 },
    };
    addEmployee(newEmp);
    toast({ title: 'Employee Added', description: `${formData.name} added successfully` });
    setShowAddModal(false);
    setFormData(emptyEmployee);
  };

  const handleEditEmployee = () => {
    if (!editingEmployee) return;
      updateEmployee(editingEmployee.id, {
      name: formData.name,
      role: formData.role,
      department: formData.department,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      salary: Number(formData.salary),
      status: formData.status as 'active' | 'inactive',
    });
    toast({ title: 'Employee Updated', description: `${formData.name} updated` });
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name, role: emp.role, department: emp.department, phone: emp.phone,
      email: emp.email, address: emp.address, salary: emp.salary,
      dateOfJoining: emp.dateOfJoining, status: emp.status as 'active' | 'inactive',
    });
    setShowEditModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    deleteEmployee(id);
    toast({ title: 'Employee Deleted', description: `${name} removed` });
  };

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Employee name" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Role *</label>
          <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Telecaller" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Department</label>
          <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Sales', 'Creative', 'Technical', 'Marketing'].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Phone *</label>
          <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
          <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Monthly Salary (₹)</label>
          <Input type="number" value={formData.salary || ''} onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })} placeholder="Salary" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
        <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Address" />
      </div>
      {isEdit && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as 'active' | 'inactive' })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1">Cancel</Button>
        <Button variant="gradient" onClick={isEdit ? handleEditEmployee : handleAddEmployee} className="flex-1">
          {isEdit ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        <Button variant="gradient" onClick={() => { setFormData(emptyEmployee); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </motion.div>

      {/* Department Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {employeesByDepartment.map((dept) => (
          <div key={dept.department} onClick={() => setSelectedDepartment(dept.department)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedDepartment === dept.department
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card border-border hover:border-primary/50'
            }`}>
            <p className="text-2xl font-heading font-bold">{dept.count}</p>
            <p className={`text-sm ${selectedDepartment === dept.department ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {dept.department}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Search and Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {departments.map((dept) => (
            <Button key={dept} variant={selectedDepartment === dept ? 'default' : 'outline'} size="sm"
              onClick={() => setSelectedDepartment(dept)} className="hidden md:flex">
              {dept}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="md:hidden">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Employees Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee, index) => (
          <motion.div key={employee.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg">
                  {employee.name.charAt(0)}
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
                <Phone className="w-4 h-4" /><span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" /><span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" /><span className="truncate">{employee.address}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Salary</p>
                <p className="font-semibold text-foreground">{formatSalary(employee.salary)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(employee.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEditModal(employee)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id, employee.name)}
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Employee Detail Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Employee Profile</DialogTitle></DialogHeader>
          {selectedEmpData && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedEmpData.name.charAt(0)}
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
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <p className="text-2xl font-bold">{selectedEmpData.performance.completedTasks}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{selectedEmpData.performance.successRate}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="text-2xl font-bold">{formatSalary(selectedEmpData.salary)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Joined On</p>
                  <p className="text-2xl font-bold">
                    {new Date(selectedEmpData.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Contact Information</h4>
                <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{selectedEmpData.phone}</span></div>
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{selectedEmpData.email}</span></div>
                <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /><span>{selectedEmpData.address}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
          {renderForm(false)}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
}