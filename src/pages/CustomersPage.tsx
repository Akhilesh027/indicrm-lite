import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Phone, MessageSquare, Mail, MapPin, Package, ChevronRight,
  Users, FileText, CheckCircle2, Clock, AlertCircle, TrendingUp, Download, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import { Customer } from '@/data/dummyData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const requirementOptions = [
  'Digital Marketing', 'Website Design', 'App Development', 'Model Video',
  'Promotion Video', 'CRM', 'SEO', 'Other',
];

export default function CustomersPage() {
  const { customers, addCustomer, projects, employees } = useCRMStore();
  const { invoices, deliverables, paymentRecords } = useInvoiceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '', businessType: '', contactNumber: '', email: '', address: '', city: '',
    package: '', requirements: [] as string[],
  });
  const { toast } = useToast();

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.businessType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalPaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalPending = customers.reduce((sum, c) => sum + c.totalPending, 0);

  const getCustomerProjects = (customerId: string) => projects.filter((p) => p.customerId === customerId);

  const handleAddCustomer = () => {
    if (!newCust.name || !newCust.contactNumber || !newCust.businessType) {
      toast({ title: 'Error', description: 'Please fill name, contact and business type', variant: 'destructive' });
      return;
    }
    const customer: Customer = {
      id: `CUST${Date.now()}`,
      name: newCust.name,
      businessType: newCust.businessType,
      contactNumbers: [newCust.contactNumber],
      email: newCust.email,
      address: newCust.address,
      city: newCust.city,
      requirements: newCust.requirements,
      package: newCust.package || undefined,
      projects: [],
      totalPaid: 0,
      totalPending: 0,
      createdOn: new Date().toISOString().split('T')[0],
    };
    addCustomer(customer);
    toast({ title: 'Customer Added', description: `${newCust.name} added successfully` });
    setShowAddModal(false);
    setNewCust({ name: '', businessType: '', contactNumber: '', email: '', address: '', city: '', package: '', requirements: [] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <p className="text-3xl font-heading font-bold text-foreground">{customers.length}</p>
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
          <p className="text-3xl font-heading font-bold text-foreground">{projects.length}</p>
          <p className="text-sm text-muted-foreground">Active Projects</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </motion.div>

      {/* Customers Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => {
          const customerProjects = getCustomerProjects(customer.id);
          return (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all cursor-pointer group"
              onClick={() => setSelectedCustomer(customer)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {customer.name.charAt(0)}
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
                  <Phone className="w-4 h-4" /><span>{customer.contactNumbers[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /><span>{customer.city}</span>
                </div>
                {customer.package && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-accent" />
                    <Badge variant="new">{customer.package}</Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-semibold text-success">{formatCurrency(customer.totalPaid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className={`font-semibold ${customer.totalPending > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {formatCurrency(customer.totalPending)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Customer Detail Modal */}
      <CustomerProfileDialog
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        projects={projects}
        employees={employees}
        invoices={invoices}
        deliverables={deliverables}
        paymentRecords={paymentRecords}
        formatCurrency={formatCurrency}
      />

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
                <Input value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} placeholder="Business name" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Business Type *</label>
                <Input value={newCust.businessType} onChange={(e) => setNewCust({ ...newCust, businessType: e.target.value })} placeholder="e.g. Healthcare" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Contact Number *</label>
                <Input value={newCust.contactNumber} onChange={(e) => setNewCust({ ...newCust, contactNumber: e.target.value })} placeholder="Phone number" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} placeholder="Email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">City</label>
                <Input value={newCust.city} onChange={(e) => setNewCust({ ...newCust, city: e.target.value })} placeholder="City" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Package</label>
                <Input value={newCust.package} onChange={(e) => setNewCust({ ...newCust, package: e.target.value })} placeholder="e.g. Premium" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Address</label>
              <Input value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} placeholder="Full address" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Requirements</label>
              <div className="grid grid-cols-2 gap-2">
                {requirementOptions.map((req) => (
                  <div key={req} className="flex items-center gap-2">
                    <Checkbox id={`cust-${req}`} checked={newCust.requirements.includes(req)}
                      onCheckedChange={(checked) => {
                        if (checked) setNewCust({ ...newCust, requirements: [...newCust.requirements, req] });
                        else setNewCust({ ...newCust, requirements: newCust.requirements.filter((r) => r !== req) });
                      }} />
                    <label htmlFor={`cust-${req}`} className="text-sm">{req}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gradient" onClick={handleAddCustomer} className="flex-1">Add Customer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}