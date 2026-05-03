import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Download,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMStore } from '@/store/crmStore';
import { monthlyRevenueData, leadStatusDistribution, employeesByDepartment } from '@/data/dummyData';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const { employees, leads, customers, projects, branches } = useCRMStore();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [branchId, setBranchId] = useState<string>('all');
  const [customerId, setCustomerId] = useState<string>('all');

  const filteredLeads = useMemo(() => leads.filter((l) => {
    if (branchId !== 'all' && l.branchId !== branchId) return false;
    if (fromDate && l.createdOn < fromDate) return false;
    if (toDate && l.createdOn > toDate) return false;
    return true;
  }), [leads, branchId, fromDate, toDate]);

  const filteredProjects = useMemo(() => projects.filter((p) => {
    if (customerId !== 'all' && p.customerId !== customerId) return false;
    if (fromDate && p.createdOn < fromDate) return false;
    if (toDate && p.createdOn > toDate) return false;
    return true;
  }), [projects, customerId, fromDate, toDate]);


  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  // Employee Performance Data
  const employeePerformance = employees.map((emp) => ({
    name: emp.name.split(' ')[0],
    tasks: emp.performance.completedTasks,
    rate: emp.performance.successRate,
  }));

  // Lead Conversion Funnel
  const conversionData = [
    { stage: 'Total Leads', value: leads.length },
    { stage: 'Demo', value: leads.filter((l) => l.status === 'Demo Completed' || l.status === 'Own Close').length },
    { stage: 'Negotiation', value: leads.filter((l) => l.status === 'Follow Up' || l.status === 'Own Close').length },
    { stage: 'Won', value: leads.filter((l) => l.status === 'Own Close').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1 flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4 text-primary" /> Filters
        </div>
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Branch</Label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Employees</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{employees.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Total Leads</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{leads.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Conversion Rate</span>
          </div>
          <p className="text-3xl font-heading font-bold text-success">
            {Math.round((leads.filter((l) => l.status === 'Own Close').length / leads.length) * 100)}%
          </p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-info" />
            <span className="text-sm text-muted-foreground">Active Projects</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">
            {projects.filter((p) => p.status !== 'Completed').length}
          </p>
        </div>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6">
            Monthly Revenue Trend
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(168, 75%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(168, 75%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 20%, 88%)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(168, 75%, 40%)" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6">
            Lead Status Distribution
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {leadStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 20%, 88%)',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6">
            Employee Performance
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 11 }} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 20%, 88%)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="tasks" fill="hsl(210, 55%, 25%)" radius={[0, 4, 4, 0]} name="Tasks Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6">
            Lead Conversion Funnel
          </h3>
          <div className="space-y-4">
            {conversionData.map((stage, index) => {
              const percentage = (stage.value / conversionData[0].value) * 100;
              return (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.value} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                      className={`h-full rounded-lg ${
                        index === 0 ? 'bg-primary' :
                        index === 1 ? 'bg-info' :
                        index === 2 ? 'bg-warning' :
                        'bg-success'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Employees by Department */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <h3 className="text-lg font-heading font-semibold text-foreground mb-6">
          Team Distribution by Department
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {employeesByDepartment.map((dept, index) => (
            <motion.div
              key={dept.department}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted text-center"
            >
              <p className="text-4xl font-heading font-bold text-foreground mb-1">
                {dept.count}
              </p>
              <p className="text-sm text-muted-foreground">{dept.department}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
