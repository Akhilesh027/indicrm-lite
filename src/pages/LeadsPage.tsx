import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Plus, Phone, MessageSquare, Building2, MapPin, Clock, CheckCircle,
  XCircle, PhoneCall, PhoneOff, UserPlus, Flame, Snowflake, Sun, TrendingUp, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { Eye } from "lucide-react";

// ==================== Types ====================
type LeadScore = 'Hot' | 'Warm' | 'Cold';
type LeadTimeline = 'Urgent' | 'Normal' | 'Later';
type LeadClarity = 'Clear' | 'Not Clear';
type YesNo = 'Yes' | 'No';

interface Lead {
  _id: string;
  id: string;
  name: string;
  contactNumber: string;
  businessType: string;
  city: string;
  source: 'Telecaller' | 'Executive' | 'Website' | 'Ad';
  assignedTo: string;
  requirements: string[];
  branchId: string;
  budgetRange: string;
  requirementClarity: LeadClarity;
  budgetMatch: YesNo;
  timeline: LeadTimeline;
  decisionMaker: YesNo;
  leadScore: LeadScore;
  expectedClosingDate: string;
  probability: number;
  nextFollowUpDate: string;
  status: 'New' | 'Demo Completed' | 'Own Close' | 'Own Loss' | 'Follow Up' | 'No Response' | 'Call Back';
  lastContactDate: string;
  followUpDate?: string;
  inPipeline: boolean;
  notes?: string[];
  callLogs?: CallLog[];
}

interface CRMUser {
  _id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  performance?: { completedTasks?: number };
}

interface CallLog {
  _id: string;
  callStatus: string;
  notes?: string;
  followUpDate?: string;
  calledAt?: string;
}

interface Branch {
  _id: string;
  branchId?: string;
  name: string;
}

// Helper to get current user from localStorage
const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return {
      _id: user._id || user.id,
      role: user.role,
      branchId: user.branchId,
      name: user.name,
    };
  } catch {
    return null;
  }
};

// ==================== Constants ====================
const API_URL = "https://digitalness-backend.onrender.com/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const statusColors: Record<string, string> = {
  New: 'new',
  'Demo Completed': 'info',
  'Own Close': 'success',
  'Own Loss': 'destructive',
  'Follow Up': 'warning',
  'No Response': 'secondary',
  'Call Back': 'pending',
};

const scoreMeta: Record<LeadScore, { color: string; icon: any }> = {
  Hot: { color: 'bg-rose-500/10 text-rose-600 border-rose-500/30', icon: Flame },
  Warm: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Sun },
  Cold: { color: 'bg-sky-500/10 text-sky-600 border-sky-500/30', icon: Snowflake },
};

const requirementOptions = [
  'Digital Marketing', 'Website Design', 'App Development', 'Model Video',
  'Promotion Video', 'CRM', 'SEO', 'Other',
];

const budgetRanges = ['< ₹10K', '₹10K - ₹25K', '₹25K - ₹50K', '₹50K - ₹1L', '₹1L - ₹3L', '₹3L+'];
const timelines: LeadTimeline[] = ['Urgent', 'Normal', 'Later'];
const clarityOptions: LeadClarity[] = ['Clear', 'Not Clear'];
const yesNoOptions: YesNo[] = ['Yes', 'No'];
const leadScores: LeadScore[] = ['Hot', 'Warm', 'Cold'];
const statuses = ['All', 'New', 'Demo Completed', 'Own Close', 'Own Loss', 'Follow Up', 'No Response', 'Call Back'];

const emptyLead = {
  name: '',
  contactNumber: '',
  businessType: '',
  city: '',
  source: 'Telecaller' as Lead['source'],
  assignedTo: '',
  requirements: [] as string[],
  branchId: '',
  budgetRange: '',
  requirementClarity: 'Not Clear' as LeadClarity,
  budgetMatch: 'No' as YesNo,
  timeline: 'Normal' as LeadTimeline,
  decisionMaker: 'No' as YesNo,
  leadScore: 'Warm' as LeadScore,
  expectedClosingDate: '',
  probability: 30,
  nextFollowUpDate: '',
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentUser = getCurrentUser();
  const isOpsManager = currentUser?.role === "Operational Manager";
  const userBranchId = currentUser?.branchId;
  const isAdmin = currentUser?.role === "Admin";

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<CRMUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLeadLoading, setAddLeadLoading] = useState(false);
  const [callSaveLoading, setCallSaveLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [pipelineLoadingId, setPipelineLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>(
    isOpsManager && userBranchId ? userBranchId : 'All'
  );

  // Call popup state
  const [callPopupLead, setCallPopupLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState<Lead['status']>('Follow Up');
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');

  // Add lead modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ ...emptyLead });

  // Assign lead modal
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignDepartment, setAssignDepartment] = useState<string>('');
  const [assignRole, setAssignRole] = useState<string>('');
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>('');
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // ==================== Helper Functions ====================
  const getEmployeeName = (assignedTo: any) => {
    if (!assignedTo) return "Unassigned";
    if (typeof assignedTo === "object") return assignedTo.name || "Unassigned";
    const employee = employees.find((e) => e._id === assignedTo);
    return employee?.name || "Unassigned";
  };

  const getBranchName = (branchId: string) => {
    if (!branchId) return "—";
    const branch = branches.find(b => b._id === branchId);
    return branch?.name || branchId;
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  const rolesByDepartment = (department: string) => [
    ...new Set(
      employees
        .filter((e) => e.department === department && e.status === 'active')
        .map((e) => e.role)
    ),
  ];

  const employeesByDepartmentAndRole = (department: string, role: string) =>
    employees.filter(
      (e) => e.department === department && e.role === role && e.status === 'active'
    );


  const LoadingSpinner = ({ className = "w-4 h-4" }: { className?: string }) => (
    <Loader2 className={`${className} animate-spin`} />
  );

  const LeadTableSkeleton = () => (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={`lead-skeleton-${index}`} className="animate-pulse">
          <td className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
          </td>
          <td className="p-4"><div className="h-4 w-28 rounded bg-muted" /></td>
          <td className="p-4"><div className="h-6 w-16 rounded-full bg-muted" /></td>
          <td className="p-4"><div className="h-4 w-20 rounded bg-muted" /></td>
          <td className="p-4"><div className="h-4 w-24 rounded bg-muted" /></td>
          <td className="p-4"><div className="h-6 w-20 rounded-full bg-muted" /></td>
          <td className="p-4"><div className="h-4 w-16 rounded bg-muted" /></td>
          <td className="p-4"><div className="h-8 w-28 rounded bg-muted" /></td>
        </tr>
      ))}
    </>
  );

  // ==================== API Calls ====================
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.message || "Failed to fetch leads", variant: "destructive" });
        return;
      }
      setLeads(data);
    } catch {
      toast({ title: "Server Error", description: "Unable to load leads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to fetch employees", variant: "destructive" });
        return;
      }
      setEmployees(data);
    } catch {
      toast({ title: "Server Error", description: "Unable to load employees", variant: "destructive" });
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_URL}/branches`, { headers: authHeaders() });
      if (!res.ok) {
        // Fallback: use empty array; branches will be shown as IDs
        setBranches([]);
        return;
      }
      const data = await res.json();
      const branchesList = Array.isArray(data) ? data : data.branches || [];
      setBranches(branchesList);
    } catch (error) {
      console.error("Failed to fetch branches", error);
      setBranches([]);
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.contactNumber || !newLead.businessType) {
      toast({ title: "Error", description: "Please fill name, contact and business type", variant: "destructive" });
      return;
    }

    try {
      setAddLeadLoading(true);
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          ...newLead,
          status: "New",
          lastContactDate: new Date().toISOString(),
          inPipeline: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to add lead", variant: "destructive" });
        return;
      }
      toast({ title: "Lead Added", description: `${newLead.name} added successfully` });
      setShowAddModal(false);
      setNewLead({ ...emptyLead, branchId: branches[0]?._id || '' });
      setSelectedDepartment('');
      setSelectedRole('');
      fetchLeads();
    } catch {
      toast({ title: "Server Error", description: "Unable to add lead", variant: "destructive" });
    } finally {
      setAddLeadLoading(false);
    }
  };

  const handleSaveCall = async () => {
    if (!callPopupLead) return;
    try {
      setCallSaveLoading(true);
      const res = await fetch(`${API_URL}/leads/${callPopupLead._id}/call-log`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          callStatus,
          notes: callNotes,
          requirements: selectedRequirements,
          followUpDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to save call log", variant: "destructive" });
        return;
      }
      toast({ title: "Call Log Saved", description: "Call notes updated successfully" });
      setCallPopupLead(null);
      setCallNotes("");
      setFollowUpDate("");
      fetchLeads();
    } catch {
      toast({ title: "Server Error", description: "Unable to save call log", variant: "destructive" });
    } finally {
      setCallSaveLoading(false);
    }
  };

  const handlePushToPipeline = async (lead: Lead) => {
    if (lead.leadScore === "Cold") {
      toast({ title: "Cold Lead", description: "Cold leads stay in nurture, not pipeline.", variant: "destructive" });
      return;
    }
    try {
      setPipelineLoadingId(lead._id);
      const res = await fetch(`${API_URL}/leads/${lead._id}/push-to-pipeline`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to move lead to pipeline", variant: "destructive" });
        return;
      }
      toast({ title: "Added to Pipeline", description: "Lead moved to sales pipeline successfully" });
      fetchLeads();
      navigate("/sales-pipeline");
    } catch {
      toast({ title: "Server Error", description: "Unable to move lead to pipeline", variant: "destructive" });
    } finally {
      setPipelineLoadingId(null);
    }
  };

  const handleAssignLead = async () => {
    if (!assignLeadId || !assignEmployeeId) {
      toast({ title: "Error", description: "Please select employee", variant: "destructive" });
      return;
    }
    try {
      setAssignLoading(true);
      const res = await fetch(`${API_URL}/leads/${assignLeadId}/assign`, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({ assignedTo: assignEmployeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to assign lead", variant: "destructive" });
        return;
      }
      toast({ title: "Lead Assigned", description: "Lead assigned successfully" });
      setAssignLeadId(null);
      setAssignDepartment("");
      setAssignRole("");
      setAssignEmployeeId("");
      fetchLeads();
    } catch {
      toast({ title: "Server Error", description: "Unable to assign lead", variant: "destructive" });
    } finally {
      setAssignLoading(false);
    }
  };

  // ==================== Derived Data ====================
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.businessType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || lead.status === selectedStatus;
    const matchesScore = scoreFilter === 'All' || lead.leadScore === scoreFilter;
    const matchesBranch = branchFilter === 'All' || lead.branchId === branchFilter;
    return matchesSearch && matchesStatus && matchesScore && matchesBranch;
  });

  const leadCounts = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'New').length,
    closed: leads.filter((l) => l.status === 'Own Close').length,
    lost: leads.filter((l) => l.status === 'Own Loss').length,
    followUp: leads.filter((l) => l.status === 'Follow Up' || l.status === 'Call Back').length,
  };

  // ==================== Effects ====================
  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchBranches(), fetchLeads()]);
      setLoading(false);
    };

    loadPageData();
  }, []);

  useEffect(() => {
    if (branches.length > 0 && !newLead.branchId) {
      setNewLead(prev => ({ ...prev, branchId: branches[0]._id }));
    }
  }, [branches]);

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)} disabled={loading}>
          {loading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Add Lead
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold text-foreground">{leadCounts.total}</p>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
          <p className="text-2xl font-heading font-bold text-accent">{leadCounts.new}</p>
          <p className="text-sm text-muted-foreground">New</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">{leadCounts.closed}</p>
          <p className="text-sm text-muted-foreground">Own Close</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <p className="text-2xl font-heading font-bold text-destructive">{leadCounts.lost}</p>
          <p className="text-sm text-muted-foreground">Own Loss</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">{leadCounts.followUp}</p>
          <p className="text-sm text-muted-foreground">Follow Up</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Scores</SelectItem>
            {leadScores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Branch filter: hidden for Operational Manager (they only see their own branch) */}
        {!isOpsManager && (
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.slice(0, 5).map((status) => (
            <Button key={status} variant={selectedStatus === status ? 'default' : 'outline'} size="sm"
              onClick={() => setSelectedStatus(status)} className="whitespace-nowrap">
              {status}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Leads Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Lead</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Business</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Score</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Branch</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Assigned To</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Next F/U</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <LeadTableSkeleton />
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="w-8 h-8 opacity-50" />
                      <p className="font-medium text-foreground">No leads found</p>
                      <p className="text-sm">Try changing your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.map((lead, index) => (
                <motion.tr key={lead._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{lead.contactNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{lead.businessType}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />{lead.city}
                    </div>
                   </td>
                  <td className="p-4">
                    {lead.leadScore ? (() => {
                      const m = scoreMeta[lead.leadScore];
                      const Icon = m.icon;
                      return (
                        <Badge className={m.color} variant="outline">
                          <Icon className="w-3 h-3 mr-1" /> {lead.leadScore}
                        </Badge>
                      );
                    })() : <Badge variant="secondary">{lead.source}</Badge>}
                    {lead.budgetRange && (
                      <p className="text-[10px] text-muted-foreground mt-1">{lead.budgetRange}</p>
                    )}
                   </td>
                  <td className="p-4">
                    <p className="text-sm">{getBranchName(lead.branchId)}</p>
                   </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setAssignLeadId(lead._id);
                        setAssignDepartment('');
                        setAssignRole('');
                        setAssignEmployeeId('');
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
                    >
                      {getEmployeeName(lead.assignedTo)}
                    </button>
                   </td>
                  <td className="p-4">
                    <Badge variant={statusColors[lead.status] as any}>{lead.status}</Badge>
                   </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {lead.nextFollowUpDate
                        ? new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : new Date(lead.lastContactDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                   </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewLead(lead)}
                        className="text-primary hover:text-primary" title="View Lead">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCallPopup(lead)}
                        className="text-accent hover:text-accent" title="Log Call">
                        <PhoneCall className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        onClick={() => window.open(`https://wa.me/91${lead.contactNumber}`, '_blank')}
                        className="text-success hover:text-success" title="WhatsApp">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        onClick={() => {
                          setAssignLeadId(lead._id);
                          setAssignDepartment('');
                          setAssignRole('');
                          setAssignEmployeeId('');
                        }}
                        className="text-primary hover:text-primary" title="Assign Lead">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      {lead.leadScore !== 'Cold' && (
                        <Button variant="ghost" size="icon"
                          onClick={() => handlePushToPipeline(lead)}
                          disabled={pipelineLoadingId === lead._id}
                          className="text-warning hover:text-warning" title="Add to Sales Pipeline">
                          {pipelineLoadingId === lead._id ? <LoadingSpinner /> : <TrendingUp className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                   </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Call Log Dialog */}
      <Dialog open={!!callPopupLead} onOpenChange={() => setCallPopupLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Call</DialogTitle></DialogHeader>
          {callPopupLead && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-lg">
                    {callPopupLead.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{callPopupLead.name}</h3>
                    <p className="text-sm text-muted-foreground">{callPopupLead.businessType} • {callPopupLead.city}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Requirements</label>
                <div className="grid grid-cols-2 gap-2">
                  {requirementOptions.map((req) => (
                    <div key={req} className="flex items-center gap-2">
                      <Checkbox
                        id={req}
                        checked={selectedRequirements.includes(req)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedRequirements([...selectedRequirements, req]);
                          else setSelectedRequirements(selectedRequirements.filter((r) => r !== req));
                        }}
                      />
                      <label htmlFor={req} className="text-sm">{req}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Call Notes</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-input bg-background resize-none h-20"
                  placeholder="Enter call notes..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Call Result</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Own Close', 'Own Loss', 'Call Back', 'No Response', 'Follow Up', 'Demo Completed'].map((status) => (
                    <Button key={status} variant={callStatus === status ? 'default' : 'outline'} size="sm"
                      onClick={() => setCallStatus(status as Lead['status'])} className="justify-start">
                      {status === 'Own Close' && <CheckCircle className="w-4 h-4 mr-2 text-success" />}
                      {status === 'Own Loss' && <XCircle className="w-4 h-4 mr-2 text-destructive" />}
                      {status === 'No Response' && <PhoneOff className="w-4 h-4 mr-2" />}
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {(callStatus === 'Call Back' || callStatus === 'Follow Up') && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Follow-up Date</label>
                  <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                </div>
              )}

              <div className="border-t border-border pt-3">
                <ActivityTimeline relation="lead" relatedId={callPopupLead.id} compact />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCallPopupLead(null)} disabled={callSaveLoading} className="flex-1">Cancel</Button>
                <Button variant="gradient" onClick={handleSaveCall} disabled={callSaveLoading} className="flex-1">
                  {callSaveLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
                  {callSaveLoading ? "Saving..." : "Save Call Log"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={!!viewLead} onOpenChange={() => setViewLead(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Lead Details</DialogTitle></DialogHeader>
          {viewLead && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Lead Name</p><p className="font-semibold">{viewLead.name}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Contact Number</p><p className="font-semibold">{viewLead.contactNumber}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Business Type</p><p className="font-semibold">{viewLead.businessType}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">City</p><p className="font-semibold">{viewLead.city || "—"}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Assigned To</p><p className="font-semibold">{getEmployeeName(viewLead.assignedTo)}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Status</p><p className="font-semibold">{viewLead.status}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Lead Score</p><p className="font-semibold">{viewLead.leadScore}</p></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm text-muted-foreground">Budget Range</p><p className="font-semibold">{viewLead.budgetRange || "—"}</p></div>
              </div>
              <div><p className="font-semibold mb-2">Requirements</p><div className="flex flex-wrap gap-2">{viewLead.requirements?.length ? viewLead.requirements.map((req) => <Badge key={req} variant="secondary">{req}</Badge>) : <p className="text-sm text-muted-foreground">No requirements</p>}</div></div>
              <div><p className="font-semibold mb-2">Notes</p><div className="space-y-2">{viewLead.notes?.length ? viewLead.notes.map((note, index) => <div key={index} className="p-3 rounded-lg bg-muted/50 text-sm">{note}</div>) : <p className="text-sm text-muted-foreground">No notes</p>}</div></div>
              <div><p className="font-semibold mb-2">Call Logs</p><div className="space-y-3 max-h-64 overflow-y-auto">{viewLead.callLogs?.length ? viewLead.callLogs.map((log) => (<div key={log._id} className="p-3 rounded-lg border bg-card"><div className="flex justify-between gap-3"><p className="font-medium">{log.callStatus}</p><p className="text-xs text-muted-foreground">{log.calledAt ? new Date(log.calledAt).toLocaleString("en-IN") : "—"}</p></div>{log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}{log.followUpDate && <p className="text-xs text-muted-foreground mt-1">Follow-up: {new Date(log.followUpDate).toLocaleDateString("en-IN")}</p>}</div>)) : <p className="text-sm text-muted-foreground">No call logs</p>}</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Name *</label><Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Business/Person name" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Contact Number *</label><Input value={newLead.contactNumber} onChange={(e) => setNewLead({ ...newLead, contactNumber: e.target.value })} placeholder="Phone number" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Business Type *</label><Input value={newLead.businessType} onChange={(e) => setNewLead({ ...newLead, businessType: e.target.value })} placeholder="e.g. Real Estate" /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">City</label><Input value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} placeholder="City" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Source</label><Select value={newLead.source} onValueChange={(v: Lead['source']) => setNewLead({ ...newLead, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Telecaller">Telecaller</SelectItem><SelectItem value="Executive">Executive</SelectItem><SelectItem value="Website">Website</SelectItem><SelectItem value="Ad">Ad</SelectItem></SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Branch</label><Select value={newLead.branchId} onValueChange={(v) => setNewLead({ ...newLead, branchId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{branches.map((b) => <SelectItem key={b._id} value={b.branchId}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Lead Score</label><Select value={newLead.leadScore} onValueChange={(v: LeadScore) => setNewLead({ ...newLead, leadScore: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{leadScores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Budget Range</label><Select value={newLead.budgetRange} onValueChange={(v) => setNewLead({ ...newLead, budgetRange: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{budgetRanges.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Requirement Clarity</label><Select value={newLead.requirementClarity} onValueChange={(v: LeadClarity) => setNewLead({ ...newLead, requirementClarity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{clarityOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Timeline</label><Select value={newLead.timeline} onValueChange={(v: LeadTimeline) => setNewLead({ ...newLead, timeline: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{timelines.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Budget Match</label><Select value={newLead.budgetMatch} onValueChange={(v: YesNo) => setNewLead({ ...newLead, budgetMatch: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{yesNoOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Decision Maker</label><Select value={newLead.decisionMaker} onValueChange={(v: YesNo) => setNewLead({ ...newLead, decisionMaker: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{yesNoOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Probability %</label><Input type="number" min={0} max={100} value={newLead.probability} onChange={(e) => setNewLead({ ...newLead, probability: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Expected Close</label><Input type="date" value={newLead.expectedClosingDate} onChange={(e) => setNewLead({ ...newLead, expectedClosingDate: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Next Follow-up</label><Input type="date" value={newLead.nextFollowUpDate} onChange={(e) => setNewLead({ ...newLead, nextFollowUpDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1 block">Department</label><Select value={selectedDepartment} onValueChange={(v) => { setSelectedDepartment(v); setSelectedRole(''); setNewLead({ ...newLead, assignedTo: '' }); }}><SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger><SelectContent>{departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Role</label><Select value={selectedRole} disabled={!selectedDepartment} onValueChange={(v) => { setSelectedRole(v); setNewLead({ ...newLead, assignedTo: '' }); }}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent>{rolesByDepartment(selectedDepartment).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="text-sm font-medium text-foreground mb-1 block">Assign To</label><Select value={newLead.assignedTo} disabled={!selectedRole} onValueChange={(v) => setNewLead({ ...newLead, assignedTo: v })}><SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger><SelectContent>{employeesByDepartmentAndRole(selectedDepartment, selectedRole).map((e) => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><label className="text-sm font-medium text-foreground mb-2 block">Requirements</label><div className="grid grid-cols-2 gap-2">{requirementOptions.map((req) => (<div key={req} className="flex items-center gap-2"><Checkbox id={`new-${req}`} checked={newLead.requirements.includes(req)} onCheckedChange={(checked) => { if (checked) setNewLead({ ...newLead, requirements: [...newLead.requirements, req] }); else setNewLead({ ...newLead, requirements: newLead.requirements.filter((r) => r !== req) }); }} /><label htmlFor={`new-${req}`} className="text-sm">{req}</label></div>))}</div></div>
            <div className="flex gap-2 pt-4"><Button variant="outline" onClick={() => setShowAddModal(false)} disabled={addLeadLoading} className="flex-1">Cancel</Button><Button variant="gradient" onClick={handleAddLead} disabled={addLeadLoading} className="flex-1">{addLeadLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}{addLeadLoading ? "Adding..." : "Add Lead"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Lead Dialog */}
      <Dialog open={!!assignLeadId} onOpenChange={() => setAssignLeadId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50"><p className="font-medium text-foreground">{leads.find((l) => l._id === assignLeadId)?.name}</p><p className="text-sm text-muted-foreground">Currently: {getEmployeeName(leads.find((l) => l._id === assignLeadId)?.assignedTo || '')}</p></div>
            <div><label className="text-sm font-medium text-foreground mb-1 block">Step 1: Select Department</label><Select value={assignDepartment} onValueChange={(v) => { setAssignDepartment(v); setAssignRole(''); setAssignEmployeeId(''); }}><SelectTrigger><SelectValue placeholder="Choose department first" /></SelectTrigger><SelectContent>{departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select></div>
            {assignDepartment && (<div><label className="text-sm font-medium text-foreground mb-1 block">Step 2: Select Role</label><Select value={assignRole} onValueChange={(v) => { setAssignRole(v); setAssignEmployeeId(''); }}><SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger><SelectContent>{rolesByDepartment(assignDepartment).map((r) => <SelectItem key={r} value={r}>{r} ({employeesByDepartmentAndRole(assignDepartment, r).length} members)</SelectItem>)}</SelectContent></Select></div>)}
            {assignRole && (<div><label className="text-sm font-medium text-foreground mb-1 block">Step 3: Select {assignRole}</label><div className="space-y-2 max-h-48 overflow-y-auto">{employeesByDepartmentAndRole(assignDepartment, assignRole).map((emp) => (<div key={emp._id} onClick={() => setAssignEmployeeId(emp._id)} className={`p-3 rounded-lg border cursor-pointer transition-all ${assignEmployeeId === emp._id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold text-sm">{emp.name.charAt(0)}</div><div><p className="text-sm font-medium text-foreground">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.department} • {emp.performance?.completedTasks || 0} tasks done</p></div></div></div>))}</div></div>)}
            <div className="flex gap-2 pt-2"><Button variant="outline" onClick={() => setAssignLeadId(null)} disabled={assignLoading} className="flex-1">Cancel</Button><Button variant="gradient" onClick={handleAssignLead} disabled={!assignEmployeeId || assignLoading} className="flex-1">{assignLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}{assignLoading ? "Assigning..." : "Assign"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function used in JSX
  function handleCallPopup(lead: Lead) {
    setCallPopupLead(lead);
    setSelectedRequirements(lead.requirements);
    setCallNotes('');
    setCallStatus(lead.status);
    setFollowUpDate(lead.followUpDate || '');
  }
}