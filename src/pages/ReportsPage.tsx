import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Download,
  Filter,
  Mic,
  Square,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const API_URL = "https://digitalness-backend.onrender.com/api";

export default function ReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [customerId, setCustomerId] = useState("all");

  const [isSpeaking, setIsSpeaking] = useState(false);

  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const normalizeArray = (data: any, key?: string) => {
    if (Array.isArray(data)) return data;

    if (key && Array.isArray(data?.[key])) {
      return data[key];
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [
        employeeRes,
        leadRes,
        customerRes,
        workRes,
        branchRes,
      ] = await Promise.all([
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/leads`, { headers }),
        fetch(`${API_URL}/customers`, { headers }),
        fetch(`${API_URL}/works`, { headers }),
        fetch(`${API_URL}/branches`, { headers }),
      ]);

      const employeeData = await employeeRes.json();
      const leadData = await leadRes.json();
      const customerData = await customerRes.json();
      const workData = await workRes.json();
      const branchData = await branchRes.json();

      setEmployees(normalizeArray(employeeData, "users"));
      setLeads(normalizeArray(leadData, "leads"));
      setCustomers(normalizeArray(customerData, "customers"));
      setWorks(normalizeArray(workData, "works"));
      setBranches(normalizeArray(branchData, "branches"));
    } catch (error) {
      console.log(error);

      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    return leads.filter((lead) => {
      if (branchId !== "all" && lead.branchId !== branchId) {
        return false;
      }

      if (
        fromDate &&
        new Date(lead.createdAt) < new Date(fromDate)
      ) {
        return false;
      }

      if (
        toDate &&
        new Date(lead.createdAt) > new Date(toDate)
      ) {
        return false;
      }

      return true;
    });
  }, [leads, branchId, fromDate, toDate]);

  const filteredWorks = useMemo(() => {
    if (!Array.isArray(works)) return [];

    return works.filter((work) => {
      if (
        customerId !== "all" &&
        work.customer?._id !== customerId
      ) {
        return false;
      }

      if (
        fromDate &&
        new Date(work.createdAt) < new Date(fromDate)
      ) {
        return false;
      }

      if (
        toDate &&
        new Date(work.createdAt) > new Date(toDate)
      ) {
        return false;
      }

      return true;
    });
  }, [works, customerId, fromDate, toDate]);

  const monthlyRevenueData = useMemo(() => {
    if (!Array.isArray(works)) return [];

    const grouped: any = {};

    works.forEach((work) => {
      const month = new Date(work.createdAt).toLocaleString(
        "default",
        {
          month: "short",
        }
      );

      if (!grouped[month]) {
        grouped[month] = 0;
      }

      grouped[month] += 1;
    });

    return Object.keys(grouped).map((month) => ({
      month,
      income: grouped[month],
    }));
  }, [works]);

  const leadStatusDistribution = useMemo(() => {
    if (!Array.isArray(leads)) return [];

    const statuses = [
      "New",
      "Interested",
      "Follow Up",
      "Own Close",
      "Lost",
    ];

    const colors = [
      "#2563eb",
      "#06b6d4",
      "#f59e0b",
      "#22c55e",
      "#ef4444",
    ];

    return statuses.map((status, index) => ({
      name: status,
      value: leads.filter((l) => l.status === status).length,
      color: colors[index],
    }));
  }, [leads]);

  const employeePerformance = useMemo(() => {
    if (!Array.isArray(employees)) return [];

    return employees.map((emp) => {
      const completedTasks = Array.isArray(works)
        ? works.filter(
            (w) =>
              w.assignedTo?._id === emp._id &&
              w.status === "Completed"
          ).length
        : 0;

      return {
        name: emp.name?.split(" ")[0] || "User",
        tasks: completedTasks,
      };
    });
  }, [employees, works]);

  const employeesByDepartment = useMemo(() => {
    if (!Array.isArray(employees)) return [];

    const grouped: any = {};

    employees.forEach((emp) => {
      const dept = emp.department || "Other";

      if (!grouped[dept]) {
        grouped[dept] = 0;
      }

      grouped[dept]++;
    });

    return Object.keys(grouped).map((dept) => ({
      department: dept,
      count: grouped[dept],
    }));
  }, [employees]);

  const conversionData = [
    {
      stage: "Total Leads",
      value: filteredLeads.length,
    },
    {
      stage: "Interested",
      value: filteredLeads.filter(
        (l) => l.status === "Interested"
      ).length,
    },
    {
      stage: "Follow Up",
      value: filteredLeads.filter(
        (l) => l.status === "Follow Up"
      ).length,
    },
    {
      stage: "Won",
      value: filteredLeads.filter(
        (l) => l.status === "Own Close"
      ).length,
    },
  ];

  const generateReportSummary = useCallback(() => {
    return `
    Total Employees ${employees.length}.
    Total Leads ${filteredLeads.length}.
    Active Works ${
      filteredWorks.filter((w) => w.status !== "Completed")
        .length
    }.
    Completed Works ${
      filteredWorks.filter((w) => w.status === "Completed")
        .length
    }.
    `;
  }, [employees, filteredLeads, filteredWorks]);

  const speakReport = () => {
    if (!window.speechSynthesis) {
      toast.error("Voice not supported");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      generateReportSummary()
    );

    utterance.lang = "en-US";

    utterance.onstart = () => setIsSpeaking(true);

    utterance.onend = () => setIsSpeaking(false);

    speechSynthRef.current = window.speechSynthesis;

    speechSynthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }

    setIsSpeaking(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text("Digitalness CRM Report", 14, 20);

    autoTable(doc, {
      startY: 35,

      head: [["Metric", "Value"]],

      body: [
        ["Employees", employees.length],
        ["Leads", filteredLeads.length],
        [
          "Conversion Rate",
          `${
            filteredLeads.length === 0
              ? 0
              : Math.round(
                  (filteredLeads.filter(
                    (l) => l.status === "Own Close"
                  ).length /
                    filteredLeads.length) *
                    100
                )
          }%`,
        ],
        [
          "Active Works",
          filteredWorks.filter(
            (w) => w.status !== "Completed"
          ).length,
        ],
      ],
    });

    doc.save("crm-report.pdf");

    toast.success("Report exported");
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">
            Reports & Analytics
          </h1>

          <p className="text-muted-foreground">
            Real-time backend reports
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={
              isSpeaking ? "destructive" : "outline"
            }
            onClick={
              isSpeaking ? stopSpeaking : speakReport
            }
          >
            {isSpeaking ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Voice Report
              </>
            )}
          </Button>

          <Button onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </motion.div>

      <div className="bg-card border rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          Filters
        </div>

        <div>
          <Label>From</Label>

          <Input
            type="date"
            value={fromDate}
            onChange={(e) =>
              setFromDate(e.target.value)
            }
          />
        </div>

        <div>
          <Label>To</Label>

          <Input
            type="date"
            value={toDate}
            onChange={(e) =>
              setToDate(e.target.value)
            }
          />
        </div>

        <div>
          <Label>Branch</Label>

          <Select
            value={branchId}
            onValueChange={setBranchId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Branches
              </SelectItem>

              {branches.map((branch) => (
                <SelectItem
                  key={branch._id}
                  value={branch.branchId}
                >
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Customer</Label>

          <Select
            value={customerId}
            onValueChange={setCustomerId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Customers
              </SelectItem>

              {customers.map((customer) => (
                <SelectItem
                  key={customer._id}
                  value={customer._id}
                >
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-card border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Employees
            </span>
          </div>

          <h2 className="text-3xl font-bold">
            {employees.length}
          </h2>
        </div>

        <div className="p-5 bg-card border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">
              Leads
            </span>
          </div>

          <h2 className="text-3xl font-bold">
            {filteredLeads.length}
          </h2>
        </div>

        <div className="p-5 bg-card border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Conversion
            </span>
          </div>

          <h2 className="text-3xl font-bold">
            {filteredLeads.length === 0
              ? 0
              : Math.round(
                  (filteredLeads.filter(
                    (l) => l.status === "Own Close"
                  ).length /
                    filteredLeads.length) *
                    100
                )}
            %
          </h2>
        </div>

        <div className="p-5 bg-card border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-muted-foreground">
              Active Works
            </span>
          </div>

          <h2 className="text-3xl font-bold">
            {
              filteredWorks.filter(
                (w) => w.status !== "Completed"
              ).length
            }
          </h2>
        </div>
      </div>
    </div>
  );
}