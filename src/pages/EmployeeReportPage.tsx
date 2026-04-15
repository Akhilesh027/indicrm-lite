import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Target, ClipboardList, CheckCircle, Clock, TrendingUp,
  Award, BarChart3, Calendar, Phone, Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const COLORS = [
  'hsl(168, 75%, 40%)', 'hsl(210, 55%, 25%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)', 'hsl(200, 80%, 50%)', 'hsl(280, 60%, 50%)',
];

export default function EmployeeReportPage() {
  const { employees, leads, projects, attendance } = useCRMStore();
  const { deliverables } = useInvoiceStore();
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');

  const emp = employees.find((e) => e.id === selectedEmpId);
  if (!emp) return <div className="p-6 text-muted-foreground">No employees found.</div>;

  // Leads handled by this employee
  const empLeads = leads.filter((l) => l.assignedTo === emp.id);
  const leadsByStatus = [
    { name: 'New', value: empLeads.filter((l) => l.status === 'New').length },
    { name: 'Follow Up', value: empLeads.filter((l) => l.status === 'Follow Up' || l.status === 'Call Back').length },
    { name: 'Demo Done', value: empLeads.filter((l) => l.status === 'Demo Completed').length },
    { name: 'Won', value: empLeads.filter((l) => l.status === 'Own Close').length },
    { name: 'Lost', value: empLeads.filter((l) => l.status === 'Own Loss').length },
    { name: 'No Response', value: empLeads.filter((l) => l.status === 'No Response').length },
  ].filter((s) => s.value > 0);

  // Projects assigned
  const empProjects = projects.filter((p) => p.assignedTo.includes(emp.id));
  const projectsByStatus = [
    { name: 'Not Started', value: empProjects.filter((p) => p.status === 'Not Started').length },
    { name: 'In Progress', value: empProjects.filter((p) => p.status === 'In Progress').length },
    { name: 'Review', value: empProjects.filter((p) => p.status === 'Review').length },
    { name: 'Completed', value: empProjects.filter((p) => p.status === 'Completed').length },
  ].filter((s) => s.value > 0);

  // Deliverables assigned
  const empDeliverables = deliverables.filter((d) => d.assignedTo === emp.id);
  const completedDeliverables = empDeliverables.filter((d) => d.status === 'Completed').length;
  const pendingDeliverables = empDeliverables.filter((d) => d.status !== 'Completed').length;

  // Attendance
  const empAttendance = attendance.filter((a) => a.employeeId === emp.id);
  const presentDays = empAttendance.filter((a) => a.status === 'Present').length;
  const absentDays = empAttendance.filter((a) => a.status === 'Absent').length;
  const leaveDays = empAttendance.filter((a) => a.status === 'Leave').length;

  // Radar chart data for performance overview
  const radarData = [
    { metric: 'Tasks', value: Math.min(emp.performance.completedTasks / 3, 100) },
    { metric: 'Success Rate', value: emp.performance.successRate },
    { metric: 'Leads Won', value: empLeads.length > 0 ? Math.round((empLeads.filter((l) => l.status === 'Own Close').length / empLeads.length) * 100) : 0 },
    { metric: 'Projects Done', value: empProjects.length > 0 ? Math.round((empProjects.filter((p) => p.status === 'Completed').length / empProjects.length) * 100) : 0 },
    { metric: 'Attendance', value: empAttendance.length > 0 ? Math.round((presentDays / empAttendance.length) * 100) : 100 },
    { metric: 'Deliverables', value: empDeliverables.length > 0 ? Math.round((completedDeliverables / empDeliverables.length) * 100) : 0 },
  ];

  const conversionRate = empLeads.length > 0
    ? Math.round((empLeads.filter((l) => l.status === 'Own Close').length / empLeads.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Employee Report</h1>
          <p className="text-muted-foreground">Complete work report & performance analysis</p>
        </div>
        <div className="w-64">
          <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
            <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Employee Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-2xl">
            {emp.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-bold text-foreground">{emp.name}</h2>
              <Badge variant={emp.status === 'active' ? 'success' : 'secondary'}>{emp.status}</Badge>
            </div>
            <p className="text-muted-foreground">{emp.role} • {emp.department}</p>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined: {new Date(emp.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
            <Star className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Overall Score</p>
              <p className="text-lg font-bold text-primary">{emp.performance.successRate}%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Leads', value: empLeads.length, icon: Target, color: 'text-accent' },
          { label: 'Leads Won', value: empLeads.filter((l) => l.status === 'Own Close').length, icon: CheckCircle, color: 'text-success' },
          { label: 'Conversion', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-primary' },
          { label: 'Projects', value: empProjects.length, icon: ClipboardList, color: 'text-info' },
          { label: 'Completed Tasks', value: emp.performance.completedTasks, icon: Award, color: 'text-warning' },
          { label: 'Deliverables', value: `${completedDeliverables}/${empDeliverables.length}`, icon: BarChart3, color: 'text-primary' },
        ].map((stat, i) => (
          <div key={stat.label} className="p-4 rounded-xl bg-card border border-border shadow-card">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Performance Overview</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(210, 20%, 88%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="hsl(168, 75%, 40%)" fill="hsl(168, 75%, 40%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Status Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Lead Status Breakdown</h3>
          {leadsByStatus.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                    {leadsByStatus.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0,0%,100%)', border: '1px solid hsl(210,20%,88%)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">No leads assigned</div>
          )}
        </motion.div>
      </div>

      {/* Projects & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
            Assigned Projects ({empProjects.length})
          </h3>
          {empProjects.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {empProjects.map((proj) => (
                <div key={proj.id} className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{proj.title}</p>
                    <Badge variant={
                      proj.status === 'Completed' ? 'success' :
                      proj.status === 'In Progress' ? 'info' :
                      proj.status === 'Review' ? 'warning' : 'secondary'
                    } className="text-xs">{proj.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{proj.type}</span>
                    <span>Due: {new Date(proj.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>{proj.completedDeliverables}/{proj.deliverables} deliverables</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${proj.deliverables > 0 ? (proj.completedDeliverables / proj.deliverables) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">No projects assigned</div>
          )}
        </motion.div>

        {/* Leads History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
            Leads History ({empLeads.length})
          </h3>
          {empLeads.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {empLeads.map((lead) => (
                <div key={lead.id} className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{lead.name}</p>
                    <Badge variant={
                      lead.status === 'Own Close' ? 'success' :
                      lead.status === 'Own Loss' ? 'destructive' :
                      lead.status === 'Follow Up' || lead.status === 'Call Back' ? 'warning' : 'secondary'
                    } className="text-xs">{lead.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{lead.businessType}</span>
                    <span>{lead.city}</span>
                    <span>Last: {new Date(lead.lastContactDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {lead.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.requirements.map((r) => (
                        <span key={r} className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">No leads assigned</div>
          )}
        </motion.div>
      </div>

      {/* Attendance & Deliverables Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-success/10 text-center">
              <p className="text-2xl font-bold text-success">{presentDays}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 text-center">
              <p className="text-2xl font-bold text-destructive">{absentDays}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 text-center">
              <p className="text-2xl font-bold text-warning">{leaveDays}</p>
              <p className="text-xs text-muted-foreground">Leave</p>
            </div>
          </div>
        </motion.div>

        {/* Deliverables Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Deliverables Tracker</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-success/10 text-center">
              <p className="text-2xl font-bold text-success">{completedDeliverables}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 text-center">
              <p className="text-2xl font-bold text-warning">{pendingDeliverables}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          {empDeliverables.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {empDeliverables.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                  <span className="text-foreground">{d.title}</span>
                  <Badge variant={d.status === 'Completed' ? 'success' : d.status === 'In Progress' ? 'info' : 'secondary'} className="text-xs">
                    {d.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
