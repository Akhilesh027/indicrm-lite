import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Package,
  ChevronRight,
  Download,
  Calendar,
  Building2,
  User,
  ClipboardList,
  Briefcase,
  KeyRound,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

const requirementOptions = [
  "Digital Marketing",
  "Website Design",
  "App Development",
  "Model Video",
  "Promotion Video",
  "CRM",
  "SEO",
  "Other",
];

interface Employee {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department: string;
  branchId?: string;
  status: "active" | "inactive";
}

interface ClientLogin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  businessType?: string;
  branchId?: string;
  status?: "active" | "inactive";
}

interface Customer {
  _id: string;
  name: string;
  businessType: string;
  contactNumbers: string[];
  email?: string;
  address?: string;
  city?: string;
  branchId: string;
  assignedTo?: Employee | string | null;
  userId?: ClientLogin | string | null;
  requirements: string[];
  package?: string;
  totalPaid: number;
  totalPending: number;
  status: "Active" | "Inactive";
  createdAt?: string;
}

interface Work {
  _id: string;
  title: string;
  workType?: string;
  type?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: any;
  dueDate?: string;
  customer?: string | { _id: string };
  createdAt?: string;
  updates?: any[];
}

const emptyCustomer = {
  name: "",
  businessType: "",
  contactNumber: "",
  email: "",
  address: "",
  city: "",
  branchId: "",
  assignedDepartment: "",
  assignedRole: "",
  assignedTo: "",
  package: "",
  requirements: [] as string[],
};

const statusVariant: Record<string, any> = {
  Pending: "secondary",
  "Not Started": "secondary",
  "In Progress": "default",
  Review: "outline",
  Completed: "default",
  Revision: "destructive",
  Failed: "destructive",
};

const priorityVariant: Record<string, any> = {
  Low: "secondary",
  Medium: "outline",
  High: "destructive",
  Urgent: "destructive",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState(emptyCustomer);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [clientLoginLoading, setClientLoginLoading] = useState(false);

  const [loginCustomer, setLoginCustomer] = useState<Customer | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const { toast } = useToast();

  const token = localStorage.getItem("token");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const getJsonConfig = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const getArrayData = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.customers)) return data.customers;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.branches)) return data.branches;
    return [];
  };

  // Fetch branches dynamically
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const res = await fetch(`${API_URL}/branches`, getAuthConfig());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch branches");
      const branchesData = getArrayData(data);
      setBranches(branchesData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not load branches",
        variant: "destructive",
      });
      // Fallback static branches if API fails
      setBranches([
        { id: "BR001", name: "Hyderabad" },
        { id: "BR002", name: "Bangalore" },
        { id: "BR003", name: "Chennai" },
      ]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/customers`, getAuthConfig());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch customers");
      setCustomers(getArrayData(data));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, getAuthConfig());
      const data = await res.json();
      if (res.ok) setEmployees(getArrayData(data));
    } catch {
      console.log("Unable to fetch employees");
    }
  };

  const fetchWorks = async () => {
    try {
      const res = await fetch(`${API_URL}/works`, getAuthConfig());
      const data = await res.json();
      if (res.ok) setWorks(getArrayData(data));
    } catch {
      console.log("Unable to fetch works");
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCustomers();
    fetchEmployees();
    fetchWorks();
  }, []);

  // Helper to extract customer ID from work object
  const getWorkCustomerId = (work: Work): string | null => {
    if (!work.customer) return null;
    if (typeof work.customer === "string") return work.customer;
    return work.customer._id;
  };

  const getCustomerWorks = (customerId: string) => {
    return works.filter((work) => getWorkCustomerId(work) === customerId);
  };

  const getAssignedUsers = (assignedTo: any) => {
    if (!assignedTo) return [];
    const assignedArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    return assignedArray.map((user: any) => {
      if (typeof user === "object") {
        return {
          id: user._id || user.id,
          name: user.name || user.fullName || user.username || user.email || "Unassigned",
          email: user.email || "",
          role: user.role || user.department || "Employee",
        };
      }
      const found = employees.find((u: any) => u._id === user || u.id === user);
      return {
        id: user,
        name: found?.name || found?.fullName || found?.username || found?.email || "Unassigned",
        email: found?.email || "",
        role: found?.role || found?.department || "Employee",
      };
    });
  };

  const branchName = (branchId: string) =>
    branches.find((branch) => branch.id === branchId)?.name || branchId || "—";

  const getAssignedName = (assignedTo?: Employee | string | null) => {
    if (!assignedTo) return "Unassigned";
    if (typeof assignedTo === "object") return assignedTo.name || "Unassigned";
    return employees.find((emp) => emp._id === assignedTo)?.name || "Unassigned";
  };

  const filteredCustomers = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return customers.filter((customer) => {
      const customerWorks = getCustomerWorks(customer._id);
      const customerMatch =
        customer.name?.toLowerCase().includes(search) ||
        customer.businessType?.toLowerCase().includes(search) ||
        customer.city?.toLowerCase().includes(search) ||
        customer.contactNumbers?.[0]?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search);
      const taskMatch = customerWorks.some((work) => {
        const assignedUsers = getAssignedUsers(work.assignedTo);
        return (
          work.title?.toLowerCase().includes(search) ||
          work.workType?.toLowerCase().includes(search) ||
          work.type?.toLowerCase().includes(search) ||
          work.status?.toLowerCase().includes(search) ||
          assignedUsers.some((u) => u.name?.toLowerCase().includes(search))
        );
      });
      return customerMatch || taskMatch;
    });
  }, [customers, works, employees, searchQuery]);

  const totalPaid = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const totalPending = customers.reduce((sum, c) => sum + (c.totalPending || 0), 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const departments = [...new Set(employees.map((emp) => emp.department).filter(Boolean))];
  const rolesByDepartment = [
    ...new Set(
      employees
        .filter((emp) => emp.department === newCust.assignedDepartment && emp.status === "active")
        .map((emp) => emp.role)
    ),
  ];
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.department === newCust.assignedDepartment &&
      emp.role === newCust.assignedRole &&
      emp.status === "active"
  );

  const handleAddCustomer = async () => {
    if (!newCust.name || !newCust.contactNumber || !newCust.businessType || !newCust.branchId || !newCust.assignedTo) {
      toast({
        title: "Missing fields",
        description: "Name, contact, business type, branch and assigned employee are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingCustomer(true);
      const res = await fetch(`${API_URL}/customers`, {
        method: "POST",
        ...getJsonConfig(),
        body: JSON.stringify({
          name: newCust.name,
          businessType: newCust.businessType,
          contactNumbers: [newCust.contactNumber],
          email: newCust.email,
          address: newCust.address,
          city: newCust.city,
          branchId: newCust.branchId,
          assignedTo: newCust.assignedTo,
          requirements: newCust.requirements,
          package: newCust.package,
          totalPaid: 0,
          totalPending: 0,
          status: "Active",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add customer");
      toast({ title: "Customer Added", description: `${newCust.name} saved successfully` });
      setShowAddModal(false);
      setNewCust(emptyCustomer);
      await fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingCustomer(false);
    }
  };

  const openClientLogin = (customer: Customer) => {
    setLoginCustomer(customer);
    setClientEmail(customer.email || "");
    setClientPassword("");
    setNeedsPassword(false);
  };

  const closeClientLogin = () => {
    setLoginCustomer(null);
    setClientEmail("");
    setClientPassword("");
    setNeedsPassword(false);
  };

  const handleCreateClientLogin = async () => {
    if (!loginCustomer || !clientEmail) {
      toast({ title: "Error", description: "Client email is required", variant: "destructive" });
      return;
    }
    try {
      setClientLoginLoading(true);
      const res = await fetch(`${API_URL}/clients/create-login`, {
        method: "POST",
        ...getJsonConfig(),
        body: JSON.stringify({
          customerId: loginCustomer._id,
          email: clientEmail,
          password: needsPassword ? clientPassword : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsPassword) {
          setNeedsPassword(true);
          toast({ title: "Password Required", description: "Create password for client login." });
          return;
        }
        throw new Error(data.message || "Failed to create client login");
      }
      toast({ title: "Client Login Ready", description: data.message || "Login created/linked successfully" });
      closeClientLogin();
      await fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClientLoginLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage customer data, assigned employees and customer-wise tasks</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)} disabled={loading || branchesLoading}>
          {loading || branchesLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Add Customer
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <p className="text-3xl font-heading font-bold">{customers.length}</p>
          <p className="text-sm text-muted-foreground">Total Customers</p>
        </div>
        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <p className="text-3xl font-heading font-bold">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-primary-foreground/80">Total Paid</p>
        </div>
        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-3xl font-heading font-bold text-warning">{formatCurrency(totalPending)}</p>
          <p className="text-sm text-muted-foreground">Pending Amount</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <p className="text-3xl font-heading font-bold">{works.length}</p>
          <p className="text-sm text-muted-foreground">Total Tasks</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers, tasks, employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading || branchesLoading}
          className="pl-10"
        />
      </div>

      {/* Customers Grid */}
      {loading || branchesLoading ? (
        <CustomersLoadingSkeleton />
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No customers found</div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer, index) => {
            const customerWorks = getCustomerWorks(customer._id);
            const hasClientLogin = Boolean(customer.userId);
            return (
              <motion.div
                key={customer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group"
              >
                <div className="cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {customer.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.businessType}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{customer.contactNumbers?.[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{customer.city || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="w-4 h-4" />
                      <span>{branchName(customer.branchId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{getAssignedName(customer.assignedTo)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-accent" />
                      <Badge variant="secondary">{customerWorks.length} Tasks</Badge>
                      <Badge variant={hasClientLogin ? "default" : "outline"}>
                        {hasClientLogin ? "Client Login Active" : "No Login"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border space-y-2">
                  {customerWorks.slice(0, 2).map((work) => (
                    <div key={work._id} className="rounded-lg bg-muted/40 p-2">
                      <p className="text-sm font-medium line-clamp-1">{work.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {work.workType || work.type || "General"} • {work.status || "Pending"}
                      </p>
                    </div>
                  ))}
                  {customerWorks.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{customerWorks.length - 2} more tasks</p>
                  )}
                  {customerWorks.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tasks assigned</p>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openClientLogin(customer)}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {hasClientLogin ? "Manage Client Login" : "Create Client Login"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Customer Profile Dialog */}
      <CustomerProfileDialog
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        formatCurrency={formatCurrency}
        branchName={branchName}
        getAssignedName={getAssignedName}
        works={selectedCustomer ? getCustomerWorks(selectedCustomer._id) : []}
        getAssignedUsers={getAssignedUsers}
        openClientLogin={openClientLogin}
      />

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Customer / Business Name *"
                value={newCust.name}
                onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
              />
              <Input
                placeholder="Business Type *"
                value={newCust.businessType}
                onChange={(e) => setNewCust({ ...newCust, businessType: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Contact Number *"
                value={newCust.contactNumber}
                onChange={(e) => setNewCust({ ...newCust, contactNumber: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={newCust.email}
                onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={newCust.city}
                onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
              />
              <Select
                value={newCust.branchId}
                disabled={branchesLoading || savingCustomer}
                onValueChange={(value) => setNewCust({ ...newCust, branchId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch *"} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Address"
              value={newCust.address}
              onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
            />
            <Input
              placeholder="Package / Plan"
              value={newCust.package}
              onChange={(e) => setNewCust({ ...newCust, package: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-4">
              <Select
                value={newCust.assignedDepartment}
                onValueChange={(value) =>
                  setNewCust({ ...newCust, assignedDepartment: value, assignedRole: "", assignedTo: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department *" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newCust.assignedRole}
                disabled={!newCust.assignedDepartment}
                onValueChange={(value) => setNewCust({ ...newCust, assignedRole: value, assignedTo: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role *" />
                </SelectTrigger>
                <SelectContent>
                  {rolesByDepartment.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newCust.assignedTo}
                disabled={!newCust.assignedRole}
                onValueChange={(value) => setNewCust({ ...newCust, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Employee *" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEmployees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Requirements</p>
              <div className="grid grid-cols-2 gap-2">
                {requirementOptions.map((req) => (
                  <div key={req} className="flex items-center gap-2">
                    <Checkbox
                      id={`cust-${req}`}
                      checked={newCust.requirements.includes(req)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewCust({ ...newCust, requirements: [...newCust.requirements, req] });
                        } else {
                          setNewCust({
                            ...newCust,
                            requirements: newCust.requirements.filter((r) => r !== req),
                          });
                        }
                      }}
                    />
                    <label htmlFor={`cust-${req}`} className="text-sm">
                      {req}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
                disabled={savingCustomer}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleAddCustomer}
                className="flex-1"
                disabled={savingCustomer}
              >
                {savingCustomer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {savingCustomer ? "Saving..." : "Save Customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Login Dialog */}
      <Dialog open={!!loginCustomer} onOpenChange={closeClientLogin}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Client Login</DialogTitle>
          </DialogHeader>
          {loginCustomer && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{loginCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {loginCustomer.businessType} • {branchName(loginCustomer.branchId)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Client Email *</label>
                <Input
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={clientLoginLoading}
                />
              </div>
              {needsPassword && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Create Password *</label>
                  <Input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    disabled={clientLoginLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This email is not registered. Enter password to create a new client login.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={closeClientLogin} disabled={clientLoginLoading}>
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleCreateClientLogin}
                  disabled={clientLoginLoading}
                >
                  {clientLoginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {clientLoginLoading ? "Processing..." : needsPassword ? "Create Login" : "Check / Link Login"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersLoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-card rounded-xl border border-border shadow-card p-5 overflow-hidden"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
          </div>

          <div className="space-y-3 mb-4">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 flex-1 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <div className="h-12 rounded-lg bg-muted/70 animate-pulse" />
            <div className="h-9 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </motion.div>
  );
}


// Customer Profile Dialog Component (unchanged except using props)
function CustomerProfileDialog({
  customer,
  onClose,
  formatCurrency,
  branchName,
  getAssignedName,
  works,
  getAssignedUsers,
  openClientLogin,
}: any) {
  if (!customer) return null;

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Client Report: ${customer.name}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 26);
    autoTable(doc, {
      startY: 34,
      head: [["Metric", "Value"]],
      body: [
        ["Business Type", customer.businessType],
        ["Branch", branchName(customer.branchId)],
        ["Assigned To", getAssignedName(customer.assignedTo)],
        ["Status", customer.status],
        ["Total Paid", formatCurrency(customer.totalPaid)],
        ["Pending", formatCurrency(customer.totalPending)],
        ["Total Tasks", String(works.length)],
        ["Client Since", customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"],
      ],
    });
    if (works.length) {
      autoTable(doc, {
        head: [["Task", "Type", "Assigned", "Status", "Priority", "Due Date"]],
        body: works.map((work: any) => [
          work.title || "—",
          work.workType || work.type || "General",
          getAssignedUsers(work.assignedTo)
            .map((u: any) => `${u.name} (${u.role})`)
            .join(", ") || "Unassigned",
          work.status || "Pending",
          work.priority || "Medium",
          work.dueDate ? new Date(work.dueDate).toLocaleDateString("en-IN") : "No date",
        ]),
      });
    }
    doc.save(`${customer.name.replace(/\s+/g, "_")}_Report.pdf`);
  };

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold">{customer.name}</h2>
                <p className="text-muted-foreground text-sm">{customer.businessType} • {customer.city || "—"}</p>
                {customer.package && <Badge variant="new" className="mt-1">{customer.package}</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(`tel:${customer.contactNumbers?.[0]}`)}>
                <Phone className="w-4 h-4 mr-1" /> Call
              </Button>
              <Button variant="success" size="sm" onClick={() => window.open(`https://wa.me/91${customer.contactNumbers?.[0]}`, "_blank")}>
                <MessageSquare className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={() => openClientLogin(customer)}>
                <KeyRound className="w-4 h-4 mr-1" /> Client Login
              </Button>
              <Button variant="gradient" size="sm" onClick={downloadReport}>
                <Download className="w-4 h-4 mr-1" /> Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-xl font-heading font-bold mt-1">{customer.status}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground">Branch</p>
              <p className="text-xl font-heading font-bold mt-1">{branchName(customer.branchId)}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/30">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-xl font-heading font-bold mt-1 text-success">{formatCurrency(customer.totalPaid)}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-heading font-bold mt-1 text-warning">{formatCurrency(customer.totalPending)}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-xl font-heading font-bold mt-1">{works.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="font-semibold text-sm">Contact & Assignment</p>
            <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{customer.contactNumbers?.join(", ")}</div>
            <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{customer.email || "Not provided"}</div>
            <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />{customer.address || customer.city || "—"}</div>
            <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-muted-foreground" />Assigned To: {getAssignedName(customer.assignedTo)}</div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" />Client since {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"}</div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-sm">Services</h4>
            <div className="flex flex-wrap gap-2">
              {customer.requirements?.length ? customer.requirements.map((req: string) => <Badge key={req} variant="secondary">{req}</Badge>) : <p className="text-sm text-muted-foreground">No services added</p>}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2"><ClipboardList className="w-4 h-4" />Customer Tasks & Assigned Employees</h4>
            {works.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center"><p className="text-sm text-muted-foreground">No tasks assigned for this customer.</p></div>
            ) : (
              <div className="space-y-3">
                {works.map((work: any) => {
                  const assignedUsers = getAssignedUsers(work.assignedTo);
                  return (
                    <div key={work._id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                          <h5 className="font-semibold">{work.title}</h5>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3" />{work.workType || work.type || "General Work"}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{work.description || "No description"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={statusVariant[work.status || "Pending"]}>{work.status || "Pending"}</Badge>
                          <Badge variant={priorityVariant[work.priority || "Medium"]}>{work.priority || "Medium"}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground mb-2">Assigned Employees</p>
                          {assignedUsers.length === 0 ? <p className="text-sm font-medium">Unassigned</p> : assignedUsers.map((user: any) => (
                            <div key={user.id} className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{user.name?.charAt(0)}</div>
                              <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.role}</p></div>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground mb-2">Due Date</p>
                          <p className="text-sm font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{work.dueDate ? new Date(work.dueDate).toLocaleDateString("en-IN") : "No due date"}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground mb-2">Updates</p>
                          <p className="text-sm font-medium">{work.updates?.length || 0} Updates</p>
                          <p className="text-xs text-muted-foreground mt-1">Created: {work.createdAt ? new Date(work.createdAt).toLocaleDateString("en-IN") : "—"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}