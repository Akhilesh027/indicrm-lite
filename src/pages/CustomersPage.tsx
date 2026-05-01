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

// ============= Customer Profile Dialog =============
interface ProfileProps {
  customer: Customer | null;
  onClose: () => void;
  projects: ReturnType<typeof useCRMStore>['projects'];
  employees: ReturnType<typeof useCRMStore>['employees'];
  invoices: ReturnType<typeof useInvoiceStore>['invoices'];
  deliverables: ReturnType<typeof useInvoiceStore>['deliverables'];
  paymentRecords: ReturnType<typeof useInvoiceStore>['paymentRecords'];
  formatCurrency: (n: number) => string;
}

function CustomerProfileDialog({
  customer, onClose, projects, employees, invoices, deliverables, paymentRecords, formatCurrency,
}: ProfileProps) {
  const data = useMemo(() => {
    if (!customer) return null;
    const custProjects = projects.filter((p) => p.customerId === customer.id);
    const custDeliverables = deliverables.filter((d) => d.customerId === customer.id);
    const custInvoices = invoices.filter((i) => i.customerId === customer.id);
    const custPayments = paymentRecords.filter((p) => p.customerId === customer.id);
    const teamIds = new Set<string>();
    custProjects.forEach((p) => p.assignedTo.forEach((id) => teamIds.add(id)));
    custDeliverables.forEach((d) => teamIds.add(d.assignedTo));
    const team = employees.filter((e) => teamIds.has(e.id));
    const completed = custDeliverables.filter((d) => d.status === 'Completed').length;
    const inProgress = custDeliverables.filter((d) => d.status === 'In Progress').length;
    const pending = custDeliverables.filter((d) => d.status === 'Not Started').length;
    const review = custDeliverables.filter((d) => d.status === 'Review').length;
    const totalDel = custDeliverables.length;
    const completionRate = totalDel ? Math.round((completed / totalDel) * 100) : 0;
    const totalInvoiced = custInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = custPayments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
    return {
      custProjects, custDeliverables, custInvoices, custPayments, team,
      completed, inProgress, pending, review, totalDel, completionRate, totalInvoiced, totalPaid,
    };
  }, [customer, projects, deliverables, invoices, paymentRecords, employees]);

  if (!customer || !data) return null;

  const empName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';
  const empRole = (id: string) => employees.find((e) => e.id === id)?.role || '-';

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Client Report: ${customer.name}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${customer.businessType} • ${customer.city}`, 14, 25);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

    autoTable(doc, {
      startY: 38,
      head: [['Metric', 'Value']],
      body: [
        ['Total Projects', String(data.custProjects.length)],
        ['Total Deliverables', String(data.totalDel)],
        ['Completed', String(data.completed)],
        ['In Progress', String(data.inProgress)],
        ['Completion Rate', `${data.completionRate}%`],
        ['Total Invoiced', formatCurrency(data.totalInvoiced)],
        ['Total Paid', formatCurrency(data.totalPaid)],
        ['Pending', formatCurrency(customer.totalPending)],
      ],
      theme: 'striped',
    });

    if (data.team.length) {
      autoTable(doc, {
        head: [['Team Member', 'Role', 'Status']],
        body: data.team.map((e) => [e.name, e.role, e.status]),
        theme: 'grid',
      });
    }

    if (data.custProjects.length) {
      autoTable(doc, {
        head: [['Project', 'Type', 'Status', 'Progress']],
        body: data.custProjects.map((p) => [
          p.title, p.type, p.status, `${p.completedDeliverables}/${p.deliverables}`,
        ]),
        theme: 'grid',
      });
    }

    if (data.custDeliverables.length) {
      autoTable(doc, {
        head: [['Task', 'Category', 'Assigned To', 'Status', 'Due']],
        body: data.custDeliverables.map((d) => [
          d.title, d.category, empName(d.assignedTo), d.status, d.dueDate,
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
      });
    }

    if (data.custPayments.length) {
      autoTable(doc, {
        head: [['Date', 'Amount', 'Method', 'Reference', 'Status']],
        body: data.custPayments.map((p) => [
          p.date, formatCurrency(p.amount), p.method, p.reference || '-', p.status,
        ]),
        theme: 'grid',
      });
    }

    doc.save(`${customer.name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Customer Profile</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold">{customer.name}</h2>
                <p className="text-muted-foreground text-sm">{customer.businessType} • {customer.city}</p>
                {customer.package && <Badge variant="new" className="mt-1">{customer.package}</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(`tel:${customer.contactNumbers[0]}`)}>
                <Phone className="w-4 h-4 mr-1" /> Call
              </Button>
              <Button variant="success" size="sm"
                onClick={() => window.open(`https://wa.me/91${customer.contactNumbers[0]}`, '_blank')}>
                <MessageSquare className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
              <Button variant="gradient" size="sm" onClick={downloadReport}>
                <Download className="w-4 h-4 mr-1" /> Report
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><FileText className="w-3 h-3" />Projects</div>
              <p className="text-2xl font-heading font-bold mt-1">{data.custProjects.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><CheckCircle2 className="w-3 h-3" />Tasks Done</div>
              <p className="text-2xl font-heading font-bold mt-1 text-success">{data.completed}/{data.totalDel}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="w-3 h-3" />Team Size</div>
              <p className="text-2xl font-heading font-bold mt-1 text-primary">{data.team.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="w-3 h-3" />Completion</div>
              <p className="text-2xl font-heading font-bold mt-1 text-accent">{data.completionRate}%</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />
                    {customer.contactNumbers.join(', ')}</div>
                  <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />
                    {customer.email || 'Not provided'}</div>
                  <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{customer.address || customer.city}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" />
                    Client since {new Date(customer.createdOn).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">{data.completionRate}%</span>
                    </div>
                    <Progress value={data.completionRate} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" />Done: {data.completed}</div>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-info" />In Progress: {data.inProgress}</div>
                    <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-warning" />Review: {data.review}</div>
                    <div className="flex items-center gap-1"><Package className="w-3 h-3 text-muted-foreground" />Pending: {data.pending}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-xs text-muted-foreground">Invoiced</p>
                  <p className="text-lg font-heading font-bold text-foreground">{formatCurrency(data.totalInvoiced)}</p>
                </div>
                <div className="p-4 rounded-lg gradient-primary text-primary-foreground">
                  <p className="text-xs opacity-80">Paid</p>
                  <p className="text-lg font-heading font-bold">{formatCurrency(data.totalPaid)}</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-heading font-bold text-warning">{formatCurrency(customer.totalPending)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {customer.requirements.map((r) => (<Badge key={r} variant="secondary">{r}</Badge>))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              {data.team.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No team members assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.team.map((emp) => {
                    const empTasks = data.custDeliverables.filter((d) => d.assignedTo === emp.id);
                    const done = empTasks.filter((t) => t.status === 'Completed').length;
                    return (
                      <div key={emp.id} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.role}</p>
                          </div>
                          <Badge variant={emp.status === 'active' ? 'success' : 'secondary'}>{emp.status}</Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{empTasks.length} tasks assigned</span>
                          <span className="text-success font-medium">{done} completed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="mt-4 space-y-3">
              {data.custProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No projects yet.</p>
              ) : data.custProjects.map((p) => {
                const pct = p.deliverables ? Math.round((p.completedDeliverables / p.deliverables) * 100) : 0;
                return (
                  <div key={p.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.type} • Due {p.dueDate}</p>
                      </div>
                      <Badge variant={
                        p.status === 'Completed' ? 'completed' : p.status === 'In Progress' ? 'inProgress' :
                        p.status === 'Review' ? 'info' : 'pending'
                      }>{p.status}</Badge>
                    </div>
                    <Progress value={pct} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.completedDeliverables}/{p.deliverables} deliverables</span>
                      <span>{p.assignedTo.map(empName).join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              {data.custDeliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Task</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Category</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Assigned</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.custDeliverables.map((d) => (
                        <tr key={d.id}>
                          <td className="p-2">{d.title}</td>
                          <td className="p-2 text-xs text-muted-foreground">{d.category}</td>
                          <td className="p-2 text-xs">
                            <div>{empName(d.assignedTo)}</div>
                            <div className="text-muted-foreground">{empRole(d.assignedTo)}</div>
                          </td>
                          <td className="p-2"><Badge variant={
                            d.status === 'Completed' ? 'completed' : d.status === 'In Progress' ? 'inProgress' :
                            d.status === 'Review' ? 'info' : 'pending'
                          }>{d.status}</Badge></td>
                          <td className="p-2 text-xs">{d.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Invoices</h4>
                {data.custInvoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No invoices.</p>
                ) : (
                  <div className="space-y-2">
                    {data.custInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{inv.id}</p>
                          <p className="text-xs text-muted-foreground">{inv.issueDate} • Due {inv.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(inv.totalAmount)}</p>
                          <Badge variant={inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'destructive' : 'warning'}>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Payment History</h4>
                {data.custPayments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No payments recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {data.custPayments.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{formatCurrency(p.amount)} via {p.method}</p>
                          <p className="text-xs text-muted-foreground">{p.date} {p.reference && `• ${p.reference}`}</p>
                        </div>
                        <Badge variant={p.status === 'Completed' ? 'success' : 'warning'}>{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}