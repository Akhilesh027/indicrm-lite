import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, Clock, Download, FileText, IndianRupee, Users, CreditCard,
  LayoutDashboard, ListChecks, Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import { useTaskStore } from '@/store/taskStore';
import { generateWorkReportPDF } from '@/utils/pdfGenerator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

type Section = 'overview' | 'team' | 'tasks' | 'payments' | 'invoices';

const NAV: { key: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
];

export default function ClientPortalPage() {
  const { deliverables, invoices, paymentRecords } = useInvoiceStore();
  const { customers, employees, projects, currentUser } = useCRMStore();
  const { tasks } = useTaskStore();
  const { toast } = useToast();

  const isCustomerRole = currentUser?.role === 'Customer';
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    isCustomerRole ? 'CUST001' : customers[0]?.id || ''
  );
  const [active, setActive] = useState<Section>('overview');

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

  const completedWithDates = customerDeliverables.filter((d) => d.status === 'Completed' && d.completedDate);
  const onTime = completedWithDates.filter((d) => d.completedDate! <= d.dueDate).length;
  const onTimeRate = completedWithDates.length > 0 ? Math.round((onTime / completedWithDates.length) * 100) : 100;

  const categoryData = Object.entries(
    customerDeliverables.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

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
      ...d, assignedToName: employeeNames[d.assignedTo] || d.assignedTo,
    }));
    const doc = generateWorkReportPDF(customer.name, 'December 2024', delsWithNames, {
      total: totalDels, completed: completedDels, inProgress: inProgressDels, pending: pendingDels, onTimeRate,
    });
    doc.save(`WorkReport_${customer.name.replace(/\s/g, '_')}_Dec2024.pdf`);
    toast({ title: 'Report Downloaded', description: 'Monthly work report saved as PDF' });
  };

  if (!customer) return <div className="text-center py-20 text-muted-foreground">Select a customer to view portal</div>;

  // ===== Team data =====
  const teamIds = new Set<string>();
  customerProjects.forEach((p) => p.assignedTo.forEach((id) => teamIds.add(id)));
  customerDeliverables.forEach((d) => teamIds.add(d.assignedTo));
  const team = employees.filter((e) => teamIds.has(e.id));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ===== Sidebar ===== */}
      <aside className="lg:w-64 lg:shrink-0">
        <div className="lg:sticky lg:top-4 space-y-4">
          {/* Client header */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                {customer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm truncate">{customer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{customer.businessType}</p>
              </div>
            </div>
            {!isCustomerRole && (
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="w-full mt-3 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nav */}
          <nav className="p-2 rounded-xl bg-card border border-border shadow-card flex lg:flex-col gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              const count =
                item.key === 'team' ? team.length :
                item.key === 'tasks' ? totalDels :
                item.key === 'payments' ? customerPayments.length :
                item.key === 'invoices' ? customerInvoices.length : null;
              return (
                <button key={item.key} onClick={() => setActive(item.key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 lg:flex-none justify-start',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {count !== null && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                    )}>{count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <Button variant="gradient" onClick={handleDownloadReport} className="w-full">
            <Download className="w-4 h-4 mr-2" /> Download Report
          </Button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="flex-1 min-w-0 space-y-6">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {active === 'overview' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBox label="Total Tasks" value={totalDels} />
                <StatBox label="Completed" value={completedDels} variant="success" />
                <StatBox label="In Progress" value={inProgressDels} variant="warning" />
                <StatBox label="On-Time Rate" value={`${onTimeRate}%`} variant="gradient" />
                <StatBox label="Projects" value={customerProjects.length} />
              </div>

              <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-bold">Overall Progress</h3>
                  <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-4" />
                <div className="flex flex-wrap justify-between gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{completedDels} completed</span>
                  <span>{reviewDels} in review</span>
                  <span>{inProgressDels} in progress</span>
                  <span>{pendingDels} pending</span>
                </div>
              </div>

              {(() => {
                const cTasks = tasks.filter((t) => t.customerId === selectedCustomerId);
                const cDone = cTasks.filter((t) => t.status === 'Completed').length;
                const cPct = cTasks.length ? Math.round((cDone / cTasks.length) * 100) : 0;
                if (cTasks.length === 0) return null;
                return (
                  <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-bold">Task Progress</h3>
                      <span className="text-2xl font-bold text-success">{cPct}%</span>
                    </div>
                    <Progress value={cPct} className="h-4" />
                    <p className="text-xs text-muted-foreground mt-2">{cDone}/{cTasks.length} tasks completed across your projects</p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                  <h3 className="font-heading font-bold mb-4">Work Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Legend /><Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-5 rounded-xl bg-card border border-border shadow-card">
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </>
          )}

          {active === 'team' && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-4">Your Team</h2>
              {team.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">No team assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {team.map((emp) => {
                    const empTasks = customerDeliverables.filter((d) => d.assignedTo === emp.id);
                    const done = empTasks.filter((t) => t.status === 'Completed').length;
                    const rate = empTasks.length ? Math.round((done / empTasks.length) * 100) : 0;
                    return (
                      <div key={emp.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Tasks</span>
                            <span className="font-medium">{done}/{empTasks.length}</span>
                          </div>
                          <Progress value={rate} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {active === 'tasks' && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-4">Current Deliverables</h2>
              <div className="space-y-2">
                {customerDeliverables.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No deliverables for this period.</p>
                ) : customerDeliverables.map((del) => {
                  const emp = employees.find((e) => e.id === del.assignedTo);
                  return (
                    <div key={del.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-2 h-2 rounded-full',
                          del.status === 'Completed' ? 'bg-success' :
                          del.status === 'In Progress' ? 'bg-warning' :
                          del.status === 'Review' ? 'bg-info' : 'bg-muted-foreground'
                        )} />
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
              </div>
            </div>
          )}

          {active === 'payments' && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-4">Payment History</h2>
              <div className="space-y-2">
                {customerPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No payments recorded yet.</p>
                ) : customerPayments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full', p.status === 'Completed' ? 'bg-success' : 'bg-warning')} />
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(p.amount)} via {p.method}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {p.reference && ` • Ref: ${p.reference}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={p.status === 'Completed' ? 'completed' : 'warning'}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'invoices' && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-4">Invoices</h2>
              <div className="space-y-2">
                {customerInvoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 text-sm">No invoices yet.</p>
                ) : customerInvoices.map((inv) => (
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
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function StatBox({ label, value, variant }: { label: string; value: string | number; variant?: 'success' | 'warning' | 'gradient' }) {
  const cls =
    variant === 'success' ? 'bg-success/10 border-success/30 text-success' :
    variant === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' :
    variant === 'gradient' ? 'gradient-primary text-primary-foreground border-transparent' :
    'bg-card border-border text-foreground';
  return (
    <div className={cn('p-4 rounded-xl border shadow-card text-center', cls)}>
      <p className="text-2xl font-heading font-bold">{value}</p>
      <p className={cn('text-xs', variant === 'gradient' ? 'opacity-80' : 'text-muted-foreground')}>{label}</p>
    </div>
  );
}
