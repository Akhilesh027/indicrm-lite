import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, CheckCircle, Clock, AlertTriangle, Download,
  FileText, IndianRupee, BarChart2, TrendingUp, Calendar,
  Video, Image, Globe, Smartphone, PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import { generateWorkReportPDF } from '@/utils/pdfGenerator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

export default function ClientPortalPage() {
  const { deliverables, invoices, paymentRecords } = useInvoiceStore();
  const { customers, employees, projects, currentUser } = useCRMStore();
  const { toast } = useToast();

  // For admin/manager, let them select a customer. For customer role, show their own
  const isCustomerRole = currentUser?.role === 'Customer';
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    isCustomerRole ? 'CUST001' : customers[0]?.id || ''
  );

  const customer = customers.find((c) => c.id === selectedCustomerId);
  const customerDeliverables = deliverables.filter((d) => d.customerId === selectedCustomerId);
  const customerInvoices = invoices.filter((inv) => inv.customerId === selectedCustomerId);
  const customerPayments = paymentRecords.filter((p) => p.customerId === selectedCustomerId);
  const customerProjects = projects.filter((p) => p.customerId === selectedCustomerId);

  const completedDels = customerDeliverables.filter((d) => d.status === 'Completed').length;
  const inProgressDels = customerDeliverables.filter((d) => d.status === 'In Progress').length;
  const pendingDels = customerDeliverables.filter((d) => d.status === 'Not Started').length;
  const reviewDels = customerDeliverables.filter((d) => d.status === 'Review').length;
  const totalDels = customerDeliverables.length;
  const progressPercent = totalDels > 0 ? Math.round((completedDels / totalDels) * 100) : 0;

  const totalPaid = customerPayments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
  const totalDue = customerInvoices.reduce((s, inv) => s + Math.max(0, inv.total - inv.paidAmount), 0);

  // On-time rate
  const completedWithDates = customerDeliverables.filter((d) => d.status === 'Completed' && d.completedDate);
  const onTime = completedWithDates.filter((d) => d.completedDate! <= d.dueDate).length;
  const onTimeRate = completedWithDates.length > 0 ? Math.round((onTime / completedWithDates.length) * 100) : 100;

  // Category breakdown
  const categoryData = Object.entries(
    customerDeliverables.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Status breakdown for pie
  const statusData = [
    { name: 'Completed', value: completedDels },
    { name: 'In Progress', value: inProgressDels },
    { name: 'Review', value: reviewDels },
    { name: 'Not Started', value: pendingDels },
  ].filter((d) => d.value > 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const handleDownloadReport = () => {
    if (!customer) return;
    const employeeNames: Record<string, string> = {};
    employees.forEach((e) => (employeeNames[e.id] = e.name));

    const delsWithNames = customerDeliverables.map((d) => ({
      ...d,
      assignedToName: employeeNames[d.assignedTo] || d.assignedTo,
    }));

    const doc = generateWorkReportPDF(customer.name, 'December 2024', delsWithNames, {
      total: totalDels,
      completed: completedDels,
      inProgress: inProgressDels,
      pending: pendingDels,
      onTimeRate,
    });
    doc.save(`WorkReport_${customer.name.replace(/\s/g, '_')}_Dec2024.pdf`);
    toast({ title: 'Report Downloaded', description: 'Monthly work report saved as PDF' });
  };

  if (!customer) return <div className="text-center py-20 text-muted-foreground">Select a customer to view portal</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {isCustomerRole ? 'My Dashboard' : 'Client Portal'}
            </h1>
            {!isCustomerRole ? (
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="w-[250px] mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">{customer.name} • {customer.businessType}</p>
            )}
          </div>
        </div>
        <Button variant="gradient" onClick={handleDownloadReport}>
          <Download className="w-4 h-4 mr-2" /> Download Report
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
          <p className="text-2xl font-heading font-bold text-foreground">{totalDels}</p>
          <p className="text-xs text-muted-foreground">Total Tasks</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-center">
          <p className="text-2xl font-heading font-bold text-success">{completedDels}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-center">
          <p className="text-2xl font-heading font-bold text-warning">{inProgressDels}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="p-4 rounded-xl gradient-primary text-primary-foreground text-center">
          <p className="text-2xl font-heading font-bold">{onTimeRate}%</p>
          <p className="text-xs opacity-80">On-Time Rate</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
          <p className="text-2xl font-heading font-bold text-foreground">{customerProjects.length}</p>
          <p className="text-xs text-muted-foreground">Projects</p>
        </div>
      </motion.div>

      {/* Overall Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="p-5 rounded-xl bg-card border border-border shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold">Overall Progress</h3>
          <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-4" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{completedDels} completed</span>
          <span>{reviewDels} in review</span>
          <span>{inProgressDels} in progress</span>
          <span>{pendingDels} pending</span>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-xl bg-card border border-border shadow-card">
          <h3 className="font-heading font-bold mb-4">Work Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="p-5 rounded-xl bg-card border border-border shadow-card">
          <h3 className="font-heading font-bold mb-4">Deliverables by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Financial Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Total Paid</span>
          </div>
          <p className="text-3xl font-heading font-bold text-success">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">Outstanding Due</span>
          </div>
          <p className="text-3xl font-heading font-bold text-warning">{formatCurrency(totalDue)}</p>
        </div>
      </motion.div>

      {/* Active Deliverables */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h3 className="font-heading font-bold mb-3">Current Deliverables</h3>
        <div className="space-y-2">
          {customerDeliverables.map((del) => {
            const emp = employees.find((e) => e.id === del.assignedTo);
            return (
              <div key={del.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    del.status === 'Completed' ? 'bg-success' :
                    del.status === 'In Progress' ? 'bg-warning' :
                    del.status === 'Review' ? 'bg-info' : 'bg-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{del.title}</p>
                    <p className="text-xs text-muted-foreground">{del.category} • {emp?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Due: {new Date(del.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                  <Badge variant={
                    del.status === 'Completed' ? 'completed' :
                    del.status === 'In Progress' ? 'inProgress' :
                    del.status === 'Review' ? 'info' : 'pending'
                  }>{del.status}</Badge>
                </div>
              </div>
            );
          })}
          {customerDeliverables.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No deliverables for this period</p>
          )}
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 className="font-heading font-bold mb-3">Invoices</h3>
        <div className="space-y-2">
          {customerInvoices.map((inv) => (
            <div key={inv.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.createdDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">{formatCurrency(inv.total)}</span>
                <Badge variant={
                  inv.status === 'Paid' ? 'completed' :
                  inv.status === 'Overdue' ? 'failed' :
                  inv.status === 'Partially Paid' ? 'warning' : 'info'
                }>{inv.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
