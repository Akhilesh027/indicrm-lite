import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  Building2,
  Phone,
  Video,
  Globe,
  MonitorSmartphone,
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Activity,
  UserPlus,
  Briefcase,
  Star,
  AlertCircle,
  Ticket,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ===================== TYPES (match actual backend) =====================
interface Employee {
  _id: string;
  name: string;
  role: string;
  status: string;
}

interface Customer {
  _id: string;
  name: string;
  createdAt?: string;
}

interface Lead {
  _id: string;
  name: string;
  status: string;
  nextFollowUpDate?: string | null;
  assignedTo?: { $oid: string } | string;
  createdAt: string;
  updatedAt?: string;
  source?: string;
}

interface Work {
  _id: string;
  title: string;
  workType: string;
  status: string;
  assignedTo?: { $oid: string } | string;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
}

interface Ticket {
  _id: string;
  ticketId?: string;
  subject: string;
  status: string;
  priority?: string;
  assignedTo?: { $oid: string } | string;
  createdAt?: string;
  customer?: { $oid: string };
}

interface Activity {
  id: string;
  type: 'lead' | 'work' | 'customer' | 'ticket';
  title: string;
  description: string;
  timestamp: string;
}

interface User {
  _id: string;
  name: string;
  role: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://digitalness-backend.onrender.com/api';

// Helper: extract MongoDB $oid or string ID
function extractId(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (obj.$oid) return obj.$oid;
  if (obj._id) return obj._id;
  return null;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day ago`;
  return date.toLocaleDateString();
}

// ============= IMPROVED FETCHER: handles common API response shapes =============
async function fetcher<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  const json = await res.json();

  // Try to extract the actual data array from various common wrappers
  // Support: direct array, { data: [...] }, { data: { items: [...] } }, { customers: [...] }, etc.
  if (Array.isArray(json)) return json as T;
  if (json.data && Array.isArray(json.data)) return json.data as T;
  if (json.data && json.data.items && Array.isArray(json.data.items)) return json.data.items as T;
  if (json.data && json.data.docs && Array.isArray(json.data.docs)) return json.data.docs as T;
  // For named collections: e.g., { customers: [...] }
  const possibleKeys = ['customers', 'leads', 'works', 'tickets', 'users', 'items', 'results', 'result'];
  for (const key of possibleKeys) {
    if (json[key] && Array.isArray(json[key])) return json[key] as T;
    if (json.data && json.data[key] && Array.isArray(json.data[key])) return json.data[key] as T;
  }
  // Fallback: return the whole json (might be an object, caller must handle)
  console.warn(`Unexpected response shape for ${endpoint}:`, json);
  return json as T;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = localStorage.getItem('token');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser: User = {
    _id: storedUser._id || storedUser.id,
    name: storedUser.name,
    role: storedUser.role,
  };

  // Role detection - case insensitive, support variations
  const adminRoles = ['admin', 'operational manager', 'operation manager'];
  const isAdminOrManager = adminRoles.includes(currentUser.role?.toLowerCase());
  const isEmployee = !isAdminOrManager;

  // State
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const isAssignedToCurrentUser = (assignedTo: any): boolean => {
    if (!isEmployee) return true;
    const assignedId = extractId(assignedTo);
    return assignedId === currentUser._id;
  };

  useEffect(() => {
    if (!token) {
      toast({ title: 'Auth Error', description: 'Please log in.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Parallel fetch with improved error handling
        const [usersData, customersData, leadsData, worksData, ticketsData] = await Promise.all([
          fetcher<any>('users', token).catch(() => []),
          fetcher<any>('customers', token).catch(() => []),
          fetcher<any>('leads', token).catch(() => []),
          fetcher<any>('works', token).catch(() => []),
          fetcher<any>('tickets', token).catch(() => []),
        ]);

        // Ensure arrays (fetcher already attempts to return array, but double-check)
        let employeesList = Array.isArray(usersData) ? usersData : [];
        let customersList = Array.isArray(customersData) ? customersData : [];
        let leadsList = Array.isArray(leadsData) ? leadsData : [];
        let worksList = Array.isArray(worksData) ? worksData : [];
        let ticketsList = Array.isArray(ticketsData) ? ticketsData : [];

        // Role-based filtering
        if (isEmployee) {
          leadsList = leadsList.filter((l: Lead) => isAssignedToCurrentUser(l.assignedTo));
          worksList = worksList.filter((w: Work) => isAssignedToCurrentUser(w.assignedTo));
          ticketsList = ticketsList.filter((t: Ticket) => isAssignedToCurrentUser(t.assignedTo));
          employeesList = employeesList.filter((e: Employee) => e._id === currentUser._id);
          customersList = []; // Employees should not see customer list
        }

        setEmployees(employeesList);
        setCustomers(customersList);
        setLeads(leadsList);
        setWorks(worksList);
        setTickets(ticketsList);

        // Build activities from all sources (only if timestamp exists)
        const acts: Activity[] = [];
        leadsList.forEach((l: Lead) => {
          if (l.createdAt) acts.push({ id: `lead-${l._id}`, type: 'lead', title: 'New Lead', description: l.name, timestamp: l.createdAt });
        });
        worksList.forEach((w: Work) => {
          if (w.createdAt) acts.push({ id: `work-${w._id}`, type: 'work', title: 'New Work', description: w.title, timestamp: w.createdAt });
        });
        customersList.forEach((c: Customer) => {
          if (c.createdAt) acts.push({ id: `cust-${c._id}`, type: 'customer', title: 'New Customer', description: c.name, timestamp: c.createdAt });
        });
        ticketsList.forEach((t: Ticket) => {
          if (t.createdAt) acts.push({ id: `ticket-${t._id}`, type: 'ticket', title: 'New Ticket', description: t.subject, timestamp: t.createdAt });
        });
        acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(acts.slice(0, 10));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token, toast, isEmployee, currentUser._id]);

  // ===================== STATS =====================
  const today = new Date().toISOString().split('T')[0];
  const todayFollowups = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate.split('T')[0] === today).length;
  const completedWorks = works.filter(w => w.status === 'Completed').length;
  const pendingWorks = works.filter(w => w.status !== 'Completed').length;
  const openTickets = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;
  const highPriorityTickets = tickets.filter(t => t.priority === 'High' || t.priority === 'Urgent').length;

  // Lead status pie
  const leadStatusMap: Record<string, number> = {};
  leads.forEach(l => { leadStatusMap[l.status] = (leadStatusMap[l.status] || 0) + 1; });
  const leadStatusData = Object.entries(leadStatusMap).map(([name, value]) => ({ name, value }));

  // Work status bar
  const workStatusMap: Record<string, number> = {};
  works.forEach(w => { workStatusMap[w.status] = (workStatusMap[w.status] || 0) + 1; });
  const workStatusData = Object.entries(workStatusMap).map(([name, value]) => ({ name, value }));

  // Ticket priority bar
  const ticketPriorityMap: Record<string, number> = {};
  tickets.forEach(t => { const p = t.priority || 'Medium'; ticketPriorityMap[p] = (ticketPriorityMap[p] || 0) + 1; });
  const ticketPriorityData = Object.entries(ticketPriorityMap).map(([name, value]) => ({ name, value }));

  // Project types from completed works
  const completedWorksList = works.filter(w => w.status === 'Completed');
  const digitalMarketing = completedWorksList.filter(w => w.workType === 'Digital Marketing').length;
  const appDev = completedWorksList.filter(w => w.workType === 'App Development').length;
  const promoVideos = completedWorksList.filter(w => w.workType === 'Video Production').length;
  const webDesign = completedWorksList.filter(w => w.workType === 'Website Design').length;
  const projectStats = [
    { title: 'Digital Marketing', value: digitalMarketing, icon: TrendingUp },
    { title: 'Apps Developed', value: appDev, icon: MonitorSmartphone },
    { title: 'Promo Videos', value: promoVideos, icon: Video },
    { title: 'Website Designs', value: webDesign, icon: Globe },
  ];

  // Top employees (admin only)
  let topEmployees: { name: string; completed: number; total: number }[] = [];
  if (isAdminOrManager && employees.length > 0) {
    const empMap: Record<string, { name: string; completed: number; total: number }> = {};
    works.forEach(w => {
      const assigneeId = extractId(w.assignedTo);
      if (assigneeId) {
        const emp = employees.find(e => e._id === assigneeId);
        const name = emp?.name || 'Unknown';
        if (!empMap[assigneeId]) empMap[assigneeId] = { name, completed: 0, total: 0 };
        empMap[assigneeId].total++;
        if (w.status === 'Completed') empMap[assigneeId].completed++;
      }
    });
    topEmployees = Object.values(empMap).sort((a, b) => b.completed - a.completed).slice(0, 5);
  }

  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentTickets = [...tickets].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5);
  const urgentWorks = works.filter(w => w.status !== 'Completed' && (w.priority === 'High' || w.priority === 'Urgent')).slice(0, 5);

  // Stats cards - conditionally include customer/employee for admins
  const statsCards = [];
  if (isAdminOrManager) {
    statsCards.push(
      { title: 'Total Customers', value: customers.length, icon: Building2, variant: 'default', onClick: () => navigate('/customers'), trend: { value: 12, isPositive: true } },
      { title: 'Total Employees', value: employees.length, icon: Users, variant: 'default', onClick: () => navigate('/employees') }
    );
  }
  statsCards.push(
    { title: 'Total Leads', value: leads.length, icon: Target, variant: 'default', onClick: () => navigate('/leads'), ...(isAdminOrManager && { trend: { value: 8, isPositive: true } }) },
    { title: 'Pending Works', value: pendingWorks, icon: Briefcase, variant: 'default', onClick: () => navigate('/works') },
    { title: 'Open Tickets', value: openTickets, icon: Ticket, variant: openTickets > 0 ? 'warning' : 'default', onClick: () => navigate('/tickets') },
    { title: "Today's Follow-ups", value: todayFollowups, icon: Phone, variant: todayFollowups > 0 ? 'warning' : 'default', onClick: () => navigate('/leads') }
  );

  const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#A855F7', '#EF4444'];
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Open': 'bg-blue-100 text-blue-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Won': 'bg-green-100 text-green-800',
      'Own Close': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview {!isAdminOrManager && `(${currentUser.role})`}</h1>
          <p className="text-muted-foreground">{isAdminOrManager ? 'Company-wide insights' : 'Your personal workspace'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Stats grid - dynamic columns based on card count */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(statsCards.length, 4)} gap-4`}>
        {statsCards.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Lead Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {leadStatusData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={leadStatusData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {leadStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No lead data</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Work Status Overview</CardTitle></CardHeader>
          <CardContent>
            {workStatusData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No work data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Priority Chart (if data exists) */}
      {ticketPriorityData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Ticket Priority Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ticketPriorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Completed Projects by Type (Admin only) */}
      {isAdminOrManager && (
        <Card>
          <CardHeader><CardTitle>Completed Projects by Type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {projectStats.map(stat => (
                <div key={stat.title} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><stat.icon className="w-5 h-5" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three column info row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Employees (Admin only) */}
        {isAdminOrManager && (
          <Card>
            <CardHeader><CardTitle className="flex gap-2"><Star className="text-yellow-500" /> Top Employees</CardTitle></CardHeader>
            <CardContent>
              {topEmployees.length ? (
                topEmployees.map((e, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{e.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-xs">Completed: {e.completed}/{e.total}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{Math.round((e.completed / e.total) * 100)}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Leads */}
        <Card>
          <CardHeader><CardTitle className="flex gap-2"><Target className="text-blue-500" /> Recent Leads</CardTitle></CardHeader>
          <CardContent>
            {recentLeads.length ? (
              recentLeads.map(lead => (
                <div key={lead._id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(lead.createdAt)}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-muted-foreground">No leads</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tickets */}
        <Card>
          <CardHeader><CardTitle className="flex gap-2"><Ticket className="text-purple-500" /> Recent Tickets</CardTitle></CardHeader>
          <CardContent>
            {recentTickets.length ? (
              recentTickets.map(ticket => (
                <div key={ticket._id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30 mb-2">
                  <div>
                    <p className="text-sm font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{ticket.createdAt ? formatRelativeTime(ticket.createdAt) : 'N/A'}</p>
                  </div>
                  <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-muted-foreground">No tickets</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two column bottom: Recent Activities + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex gap-2"><Activity /> Recent Activities</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length ? (
                activities.map(act => (
                  <div key={act.id} className="flex items-start gap-3 pb-3 border-b">
                    <div className="mt-1 p-1 rounded-full bg-blue-100 text-blue-600">
                      {act.type === 'lead' ? <Target className="w-3 h-3" /> : act.type === 'work' ? <Briefcase className="w-3 h-3" /> : act.type === 'ticket' ? <Ticket className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(act.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex gap-2"><AlertTriangle className="text-warning" /> Alerts & Follow‑ups</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Upcoming follow-ups */}
              {(() => {
                const next7 = new Date(); next7.setDate(next7.getDate() + 7);
                const upcoming = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate >= today && l.nextFollowUpDate <= next7.toISOString().split('T')[0] && l.status !== 'Closed');
                return (
                  <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                    <p className="text-sm font-medium">Upcoming Follow-ups</p>
                    <p className="text-xs">{upcoming.length} leads in next 7 days</p>
                    {upcoming.slice(0, 2).map(l => (
                      <div key={l._id} className="text-xs mt-1">• {l.name} - {new Date(l.nextFollowUpDate!).toLocaleDateString()}</div>
                    ))}
                  </div>
                );
              })()}
              {/* Overdue follow-ups */}
              {(() => {
                const overdue = leads.filter(l => l.nextFollowUpDate && l.nextFollowUpDate < today && l.status !== 'Closed');
                return (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <p className="text-sm font-medium">Overdue Follow-ups</p>
                    <p className="text-xs">{overdue.length} leads past due</p>
                  </div>
                );
              })()}
              {/* High priority tickets */}
              {highPriorityTickets > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-medium">High Priority Tickets</p>
                  <p className="text-xs">{highPriorityTickets} tickets need attention</p>
                </div>
              )}
              {/* Inactive employees (admin only) */}
              {isAdminOrManager && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium">Inactive Employees</p>
                  <p className="text-xs">{employees.filter(e => e.status === 'inactive').length} inactive</p>
                </div>
              )}
              {/* Pending works */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">Pending Works</p>
                <p className="text-xs">{pendingWorks} works not completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}