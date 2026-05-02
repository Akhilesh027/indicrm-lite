import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Phone, MessageSquare, Calendar, ChevronDown,
  Building2, MapPin, Clock, CheckCircle, XCircle, PhoneCall, PhoneOff, UserPlus,
  Flame, Snowflake, Sun, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { useDealStore } from '@/store/dealStore';
import { Lead, LeadScore, LeadTimeline, LeadClarity, YesNo } from '@/data/dummyData';
import { Deal } from '@/data/dealData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  'New': 'new', 'Demo Completed': 'info', 'Own Close': 'success',
  'Own Loss': 'destructive', 'Follow Up': 'warning', 'No Response': 'secondary', 'Call Back': 'pending',
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

export default function LeadsPage() {
  const { leads, addLead, updateLead, convertLeadToCustomer, employees, branches } = useCRMStore();
  const { addDeal, deals } = useDealStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [callPopupLead, setCallPopupLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState<Lead['status']>('Follow Up');
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '', contactNumber: '', businessType: '', city: '',
    source: 'Telecaller' as Lead['source'], assignedTo: '', requirements: [] as string[],
    branchId: 'BR001', budgetRange: '', requirementClarity: 'Not Clear' as LeadClarity,
    budgetMatch: 'No' as YesNo, timeline: 'Normal' as LeadTimeline,
    decisionMaker: 'No' as YesNo, leadScore: 'Warm' as LeadScore,
    expectedClosingDate: '', probability: 30, nextFollowUpDate: '',
  });
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState<string>('');
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>('');
  const { toast } = useToast();

  const statuses = ['All', 'New', 'Demo Completed', 'Own Close', 'Own Loss', 'Follow Up', 'No Response', 'Call Back'];

  // Auto-assign branch from city
  const branchFromCity = (city: string) => {
    const c = city.toLowerCase();
    if (c.includes('bangalore') || c.includes('bengaluru')) return 'BR002';
    if (c.includes('chennai')) return 'BR003';
    return 'BR001';
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.businessType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || lead.status === selectedStatus;
    const matchesScore = scoreFilter === 'All' || lead.leadScore === scoreFilter;
    const matchesBranch = branchFilter === 'All' || lead.branchId === branchFilter;
    return matchesSearch && matchesStatus && matchesScore && matchesBranch;
  });

  const handleCallPopup = (lead: Lead) => {
    setCallPopupLead(lead);
    setSelectedRequirements(lead.requirements);
    setCallNotes('');
    setCallStatus(lead.status);
    setFollowUpDate(lead.followUpDate || '');
  };

  const handleSaveCall = () => {
    if (!callPopupLead) return;
    const updates: Partial<Lead> = {
      status: callStatus, requirements: selectedRequirements,
      notes: [...callPopupLead.notes, callNotes].filter(Boolean),
      lastContactDate: new Date().toISOString().split('T')[0],
    };
    if (callStatus === 'Call Back' || callStatus === 'Follow Up') updates.followUpDate = followUpDate;
    updateLead(callPopupLead.id, updates);
    if (callStatus === 'Own Close') convertLeadToCustomer(callPopupLead.id);
    setCallPopupLead(null);
  };

  const handleAddLead = () => {
    if (!newLead.name || !newLead.contactNumber || !newLead.businessType) {
      toast({ title: 'Error', description: 'Please fill name, contact and business type', variant: 'destructive' });
      return;
    }
    const branchId = newLead.branchId || branchFromCity(newLead.city);
    const lead: Lead = {
      id: `LEAD${Date.now()}`,
      ...newLead,
      branchId,
      status: 'New',
      notes: [],
      createdOn: new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      inPipeline: newLead.leadScore !== 'Cold',
    };
    addLead(lead);
    toast({ title: 'Lead Added', description: `${newLead.name} added successfully` });
    setShowAddModal(false);
    setNewLead({
      name: '', contactNumber: '', businessType: '', city: '',
      source: 'Telecaller', assignedTo: '', requirements: [],
      branchId: 'BR001', budgetRange: '', requirementClarity: 'Not Clear',
      budgetMatch: 'No', timeline: 'Normal', decisionMaker: 'No', leadScore: 'Warm',
      expectedClosingDate: '', probability: 30, nextFollowUpDate: '',
    });
  };

  const handlePushToPipeline = (lead: Lead) => {
    if (lead.leadScore === 'Cold') {
      toast({ title: 'Cold lead', description: 'Cold leads stay in nurture, not pipeline.', variant: 'destructive' });
      return;
    }
    if (deals.some((d) => d.leadId === lead.id)) {
      toast({ title: 'Already in pipeline', description: 'A deal exists for this lead.' });
      navigate('/sales-pipeline');
      return;
    }
    const dealValue = lead.budgetRange?.includes('3L+') ? 300000
      : lead.budgetRange?.includes('1L - ₹3L') ? 200000
      : lead.budgetRange?.includes('50K - ₹1L') ? 75000
      : lead.budgetRange?.includes('25K - ₹50K') ? 35000
      : lead.budgetRange?.includes('10K - ₹25K') ? 18000 : 50000;
    const newDeal: Deal = {
      id: `DEAL${Date.now()}`,
      leadId: lead.id,
      title: `${lead.name} - ${lead.requirements.join(', ') || 'Discovery'}`,
      customerName: lead.name,
      contactNumber: lead.contactNumber,
      businessType: lead.businessType,
      branchId: lead.branchId || 'BR001',
      stage: 'New',
      dealValue,
      probability: lead.probability ?? 50,
      expectedCloseDate: lead.expectedClosingDate || '',
      assignedTo: lead.assignedTo,
      notes: lead.notes.join('\n'),
      callLogs: [],
      createdOn: new Date().toISOString().split('T')[0],
    };
    addDeal(newDeal);
    updateLead(lead.id, { inPipeline: true });
    toast({ title: '✓ Added to Sales Pipeline', description: `Deal created for ${lead.name}` });
    navigate('/sales-pipeline');
  };

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';

  const uniqueRoles = [...new Set(employees.map((e) => e.role))];
  const employeesByRole = (role: string) => employees.filter((e) => e.role === role && e.status === 'active');

  const handleAssignLead = () => {
    if (!assignLeadId || !assignEmployeeId) return;
    updateLead(assignLeadId, { assignedTo: assignEmployeeId });
    toast({ title: 'Lead Assigned', description: `Lead assigned to ${getEmployeeName(assignEmployeeId)}` });
    setAssignLeadId(null);
    setAssignRole('');
    setAssignEmployeeId('');
  };

  const leadCounts = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'New').length,
    closed: leads.filter((l) => l.status === 'Own Close').length,
    lost: leads.filter((l) => l.status === 'Own Loss').length,
    followUp: leads.filter((l) => l.status === 'Follow Up' || l.status === 'Call Back').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </motion.div>

      {/* Summary Cards */}
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

      {/* Search and Filter */}
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
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Branches</SelectItem>
            {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
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
              {filteredLeads.map((lead, index) => (
                <motion.tr key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
                    <div className="flex items-center gap-1 text-sm"><Building2 className="w-4 h-4 text-muted-foreground" /><span>{lead.businessType}</span></div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3" />{lead.city}</div>
                  </td>
                  <td className="p-4"><Badge variant="secondary">{lead.source}</Badge></td>
                  <td className="p-4">
                    <button onClick={() => { setAssignLeadId(lead.id); setAssignRole(''); setAssignEmployeeId(''); }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline">
                      {getEmployeeName(lead.assignedTo)}
                    </button>
                  </td>
                  <td className="p-4"><Badge variant={statusColors[lead.status] as any}>{lead.status}</Badge></td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(lead.lastContactDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleCallPopup(lead)} className="text-accent hover:text-accent">
                        <PhoneCall className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        onClick={() => window.open(`https://wa.me/91${lead.contactNumber}`, '_blank')}
                        className="text-success hover:text-success">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        onClick={() => { setAssignLeadId(lead.id); setAssignRole(''); setAssignEmployeeId(''); }}
                        className="text-primary hover:text-primary" title="Assign Lead">
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon"><Calendar className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Call Popup Modal */}
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
                      <Checkbox id={req} checked={selectedRequirements.includes(req)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedRequirements([...selectedRequirements, req]);
                          else setSelectedRequirements(selectedRequirements.filter((r) => r !== req));
                        }} />
                      <label htmlFor={req} className="text-sm">{req}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Call Notes</label>
                <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-3 rounded-lg border border-input bg-background resize-none h-20" placeholder="Enter call notes..." />
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
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setCallPopupLead(null)} className="flex-1">Cancel</Button>
                <Button variant="gradient" onClick={handleSaveCall} className="flex-1">Save Call Log</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
                <Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Business/Person name" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Contact Number *</label>
                <Input value={newLead.contactNumber} onChange={(e) => setNewLead({ ...newLead, contactNumber: e.target.value })} placeholder="Phone number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Business Type *</label>
                <Input value={newLead.businessType} onChange={(e) => setNewLead({ ...newLead, businessType: e.target.value })} placeholder="e.g. Real Estate" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">City</label>
                <Input value={newLead.city} onChange={(e) => setNewLead({ ...newLead, city: e.target.value })} placeholder="City" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Source</label>
                <Select value={newLead.source} onValueChange={(v: Lead['source']) => setNewLead({ ...newLead, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telecaller">Telecaller</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Ad">Ad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Select Role</label>
                <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setNewLead({ ...newLead, assignedTo: '' }); }}>
                  <SelectTrigger><SelectValue placeholder="Choose role first" /></SelectTrigger>
                  <SelectContent>
                    {uniqueRoles.map((role) => (<SelectItem key={role} value={role}>{role}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedRole && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Assign To ({selectedRole})</label>
                <Select value={newLead.assignedTo} onValueChange={(v) => setNewLead({ ...newLead, assignedTo: v })}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employeesByRole(selectedRole).map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Requirements</label>
              <div className="grid grid-cols-2 gap-2">
                {requirementOptions.map((req) => (
                  <div key={req} className="flex items-center gap-2">
                    <Checkbox id={`new-${req}`} checked={newLead.requirements.includes(req)}
                      onCheckedChange={(checked) => {
                        if (checked) setNewLead({ ...newLead, requirements: [...newLead.requirements, req] });
                        else setNewLead({ ...newLead, requirements: newLead.requirements.filter((r) => r !== req) });
                      }} />
                    <label htmlFor={`new-${req}`} className="text-sm">{req}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gradient" onClick={handleAddLead} className="flex-1">Add Lead</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Assign Lead Modal */}
      <Dialog open={!!assignLeadId} onOpenChange={() => setAssignLeadId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">{leads.find((l) => l.id === assignLeadId)?.name}</p>
              <p className="text-sm text-muted-foreground">Currently: {getEmployeeName(leads.find((l) => l.id === assignLeadId)?.assignedTo || '')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Step 1: Select Role</label>
              <Select value={assignRole} onValueChange={(v) => { setAssignRole(v); setAssignEmployeeId(''); }}>
                <SelectTrigger><SelectValue placeholder="Choose role first" /></SelectTrigger>
                <SelectContent>
                  {uniqueRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role} ({employeesByRole(role).length} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignRole && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Step 2: Select {assignRole}</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {employeesByRole(assignRole).map((emp) => (
                    <div key={emp.id} onClick={() => setAssignEmployeeId(emp.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        assignEmployeeId === emp.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-semibold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.department} • {emp.performance.completedTasks} tasks done</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssignLeadId(null)} className="flex-1">Cancel</Button>
              <Button variant="gradient" onClick={handleAssignLead} disabled={!assignEmployeeId} className="flex-1">Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}