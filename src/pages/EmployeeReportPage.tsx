import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  ClipboardList,
  LifeBuoy,
  PhoneCall,
  AlertTriangle,
  Timer,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

const COLORS = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042", "#A855F7"];

interface Employee {
  _id: string;
  name?: string;
  fullName?: string;
  username?: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  branchId: string | { _id: string; name: string };
}

interface Work {
  _id: string;
  title: string;
  workType?: string;
  customer?: { _id: string; name?: string; companyName?: string };
  parentWorkId?: { _id: string; title?: string } | string | null;
  status: string;
  priority?: string;
  assignedTo: any;
  dueDate?: string;
  slaDays?: number;
  timeSpent?: number;
  updates?: any[];
}

interface Lead {
  _id: string;
  name?: string;
  status: string;
  assignedTo: any;
  callLogs?: any[];
  followUpDate?: string;
  nextFollowUpDate?: string;
}

interface Ticket {
  _id: string;
  status: string;
  assignedTo: any;
}

function getArrayData(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.works)) return data.works;
  if (Array.isArray(data?.leads)) return data.leads;
  if (Array.isArray(data?.tickets)) return data.tickets;
  return [];
}

function getEmployeeName(emp?: Employee) {
  return emp?.name || emp?.fullName || emp?.username || emp?.email || "Employee";
}

function assignedIncludesUser(assignedTo: any, userId: string) {
  if (!assignedTo || !userId) return false;

  const list = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

  return list.some((item) => {
    if (!item) return false;
    if (typeof item === "string") return String(item) === String(userId);
    return String(item._id || item.id) === String(userId);
  });
}

function getClientName(work: Work) {
  return work.customer?.name || work.customer?.companyName || "Client";
}

function getParentWorkTitle(work: Work) {
  if (!work.parentWorkId) return "Main Work";
  if (typeof work.parentWorkId === "object") {
    return work.parentWorkId.title || "Parent Work";
  }
  return "Parent Work";
}

function getBranchDisplay(branch: Employee["branchId"]) {
  if (!branch) return "—";
  if (typeof branch === "string") return branch;
  return branch.name || branch._id;
}

function isOverdue(work: Work) {
  if (!work.dueDate || work.status === "Completed") return false;

  const today = new Date();
  const due = new Date(work.dueDate);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

export default function EmployeeReportPage() {
  const { toast } = useToast();

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!token) {
      toast({
        title: "Auth Error",
        description: "No token found. Please login again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [usersRes, worksRes, leadsRes, ticketsRes] = await Promise.allSettled([
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/works`, { headers }),
        fetch(`${API_URL}/leads`, { headers }),
        fetch(`${API_URL}/tickets`, { headers }),
      ]);

      const usersData =
        usersRes.status === "fulfilled" && usersRes.value.ok
          ? await usersRes.value.json()
          : [];

      const worksData =
        worksRes.status === "fulfilled" && worksRes.value.ok
          ? await worksRes.value.json()
          : [];

      const leadsData =
        leadsRes.status === "fulfilled" && leadsRes.value.ok
          ? await leadsRes.value.json()
          : [];

      const ticketsData =
        ticketsRes.status === "fulfilled" && ticketsRes.value.ok
          ? await ticketsRes.value.json()
          : [];

      const employeeList = getArrayData(usersData);

      setEmployees(employeeList);
      setWorks(getArrayData(worksData));
      setLeads(getArrayData(leadsData));
      setTickets(getArrayData(ticketsData));

      if (employeeList.length && !selectedEmpId) {
        setSelectedEmpId(employeeList[0]._id);
      }
    } catch (error: any) {
      toast({
        title: "Data Fetch Failed",
        description: error.message || "Unable to load employee report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const employee = useMemo(
    () => employees.find((emp) => emp._id === selectedEmpId),
    [employees, selectedEmpId]
  );

  const employeeWorks = useMemo(
    () => works.filter((work) => assignedIncludesUser(work.assignedTo, selectedEmpId)),
    [works, selectedEmpId]
  );

  const employeeLeads = useMemo(
    () => leads.filter((lead) => assignedIncludesUser(lead.assignedTo, selectedEmpId)),
    [leads, selectedEmpId]
  );

  const employeeTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        assignedIncludesUser(ticket.assignedTo, selectedEmpId)
      ),
    [tickets, selectedEmpId]
  );

  const totalCalls = employeeLeads.reduce(
    (sum, lead) => sum + (lead.callLogs?.length || 0),
    0
  );

  const completedWorks = employeeWorks.filter(
    (work) => work.status === "Completed"
  ).length;

  const inProgressWorks = employeeWorks.filter(
    (work) => work.status === "In Progress"
  ).length;

  const reviewWorks = employeeWorks.filter((work) => work.status === "Review").length;

  const pendingWorks = employeeWorks.filter(
    (work) => work.status !== "Completed"
  ).length;

  const overdueWorks = employeeWorks.filter(isOverdue).length;

  const mainWorks = employeeWorks.filter((work) => !work.parentWorkId).length;

  const childTasks = employeeWorks.filter((work) => work.parentWorkId).length;

  const totalTimeSpent = employeeWorks.reduce(
    (sum, work) => sum + Number(work.timeSpent || 0),
    0
  );

  const wonLeads = employeeLeads.filter(
    (lead) => lead.status === "Own Close" || lead.status === "Won"
  ).length;

  const openTickets = employeeTickets.filter(
    (ticket) => ticket.status !== "Closed"
  ).length;

  const conversionRate = employeeLeads.length
    ? Math.round((wonLeads / employeeLeads.length) * 100)
    : 0;

  const telecallerLeads = employeeLeads.filter(
    (lead) =>
      lead.status === "Call Back" ||
      lead.status === "Follow Up" ||
      lead.status === "Own Close" ||
      lead.status === "Own Loss"
  );

  const workChart = [
    { name: "Completed", value: completedWorks },
    { name: "In Progress", value: inProgressWorks },
    { name: "Review", value: reviewWorks },
    { name: "Pending", value: pendingWorks },
  ].filter((item) => item.value > 0);

  const ticketChart = [
    {
      name: "Open",
      value: employeeTickets.filter((ticket) => ticket.status === "Open").length,
    },
    {
      name: "In Progress",
      value: employeeTickets.filter((ticket) => ticket.status === "In Progress")
        .length,
    },
    {
      name: "Resolved",
      value: employeeTickets.filter((ticket) => ticket.status === "Resolved")
        .length,
    },
    {
      name: "Closed",
      value: employeeTickets.filter((ticket) => ticket.status === "Closed").length,
    },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading employee report...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No employee found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employee Report</h1>
          <p className="text-muted-foreground">
            Work, task, lead, telecaller and support performance overview
          </p>
        </div>

        <div className="w-[320px]">
          <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {getEmployeeName(emp)} ({emp.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {getEmployeeName(employee).charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{getEmployeeName(employee)}</h2>
                <Badge>{employee.status}</Badge>
              </div>

              <p className="text-muted-foreground">
                {employee.role} {employee.department ? `• ${employee.department}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-bold">{getBranchDisplay(employee.branchId)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        <StatCard title="Works" value={employeeWorks.length} icon={<ClipboardList />} />
        <StatCard title="Main Works" value={mainWorks} icon={<ClipboardList />} />
        <StatCard title="Child Tasks" value={childTasks} icon={<Clock />} />
        <StatCard title="Completed" value={completedWorks} icon={<CheckCircle />} />
        <StatCard title="Overdue" value={overdueWorks} icon={<AlertTriangle />} />
        <StatCard title="Leads" value={employeeLeads.length} icon={<Target />} />
        <StatCard title="Calls" value={totalCalls} icon={<PhoneCall />} />
        <StatCard title="Time" value={`${totalTimeSpent}h`} icon={<Timer />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Conversion" value={`${conversionRate}%`} icon={<TrendingUp />} />
        <StatCard title="Won Leads" value={wonLeads} icon={<CheckCircle />} />
        <StatCard title="Telecaller Leads" value={telecallerLeads.length} icon={<PhoneCall />} />
        <StatCard title="Open Tickets" value={openTickets} icon={<LifeBuoy />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Work / Task Status</h3>
            <div className="h-[300px]">
              {workChart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No work data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={workChart} dataKey="value" outerRadius={100} label>
                      {workChart.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Ticket Status</h3>
            <div className="h-[300px]">
              {ticketChart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No ticket data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Assigned Works / Tasks</h3>

          <div className="space-y-3">
            {employeeWorks.length > 0 ? (
              employeeWorks.map((work) => (
                <div key={work._id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium">{work.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {getClientName(work)} • {work.workType || "General"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parent: {getParentWorkTitle(work)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{work.priority || "Medium"}</Badge>
                      <Badge>{work.status}</Badge>
                      {isOverdue(work) && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-6">
                No works assigned to this employee
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 text-primary">
        <div className="w-5 h-5">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
}