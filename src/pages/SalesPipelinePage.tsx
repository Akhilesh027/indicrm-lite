import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Phone, Calendar, IndianRupee, TrendingUp, Building2,
  ChevronRight, ChevronLeft, X, MessageSquare, Trophy, AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCRMStore } from '@/store/crmStore';
import { useDealStore } from '@/store/dealStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useTaskStore, tasksFromProjectType } from '@/store/taskStore';
import { Deal, DealStage, DEAL_STAGES } from '@/data/dealData';
import { Customer } from '@/data/dummyData';
import { Invoice } from '@/data/invoiceData';
import { useToast } from '@/hooks/use-toast';

const stageColors: Record<DealStage, string> = {
  New: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  Contacted: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600',
  Discovery: 'bg-violet-500/10 border-violet-500/30 text-violet-600',
  Qualified: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600',
  Proposal: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
  Negotiation: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  Won: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
  Lost: 'bg-rose-500/10 border-rose-500/30 text-rose-600',
};

const lostReasons = ['Price', 'No Response', 'Competitor', 'Not Interested', 'Other'];

export default function SalesPipelinePage() {
  const { deals, addDeal, updateDeal, moveDealStage, addCallLog } = useDealStore();
  const { leads, employees, branches, customers, addCustomer, addProject, currentUser } = useCRMStore();
  const { addInvoice } = useInvoiceStore();
  const { addTasks } = useTaskStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [lostDeal, setLostDeal] = useState<Deal | null>(null);
  const [lostReason, setLostReason] = useState<string>('Price');
  const [callNote, setCallNote] = useState('');

  const [newDeal, setNewDeal] = useState({
    leadId: '', title: '', dealValue: 0, probability: 50,
    expectedCloseDate: '', assignedTo: '', branchId: '', notes: '',
  });

  const visibleDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchesSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = branchFilter === 'All' || d.branchId === branchFilter;
      // Role filter: Sales sees own deals; others see all
      const isSales = currentUser?.role === 'Sales Executive';
      const matchesRole = !isSales || d.assignedTo === currentUser?.id;
      return matchesSearch && matchesBranch && matchesRole;
    });
  }, [deals, search, branchFilter, currentUser]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, Deal[]> = {
      New: [], Contacted: [], Discovery: [], Qualified: [],
      Proposal: [], Negotiation: [], Won: [], Lost: [],
    };
    visibleDeals.forEach((d) => grouped[d.stage].push(d));
    return grouped;
  }, [visibleDeals]);

  const stats = useMemo(() => {
    const open = visibleDeals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
    return {
      total: visibleDeals.length,
      open: open.length,
      pipelineValue: open.reduce((s, d) => s + d.dealValue, 0),
      won: visibleDeals.filter((d) => d.stage === 'Won').length,
      wonValue: visibleDeals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.dealValue, 0),
    };
  }, [visibleDeals]);

  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name || '—';

  const moveStage = (deal: Deal, dir: 1 | -1) => {
    const idx = DEAL_STAGES.indexOf(deal.stage);
    const next = DEAL_STAGES[idx + dir];
    if (!next) return;

    if (next === 'Won') {
      handleWin(deal);
      return;
    }
    if (next === 'Lost') {
      setLostDeal(deal);
      return;
    }
    moveDealStage(deal.id, next);
    toast({ title: 'Stage updated', description: `${deal.title} → ${next}` });
  };

  const handleWin = (deal: Deal) => {
    // 1. Convert to Customer (reuse existing one if matched by name)
    let customer = customers.find((c) => c.name.toLowerCase() === deal.customerName.toLowerCase());
    let customerId = customer?.id;

    if (!customer) {
      const newCust: Customer = {
        id: `CUST${Date.now()}`,
        name: deal.customerName,
        businessType: deal.businessType,
        contactNumbers: [deal.contactNumber],
        email: '',
        address: '',
        city: branches.find((b) => b.id === deal.branchId)?.city || '',
        requirements: [],
        projects: [],
        totalPaid: 0,
        totalPending: deal.dealValue,
        createdOn: new Date().toISOString().split('T')[0],
      };
      addCustomer(newCust);
      customerId = newCust.id;
    }

    // 2. Auto-create project
    const projectId = `PROJ${Date.now()}`;
    addProject({
      id: projectId,
      customerId: customerId!,
      title: `${deal.customerName} - Onboarding`,
      type: 'Digital Marketing',
      status: 'Not Started',
      priority: 'Medium',
      assignedTo: [deal.assignedTo],
      dueDate: deal.expectedCloseDate,
      createdOn: new Date().toISOString().split('T')[0],
      description: deal.notes || 'Auto-created from won deal',
      deliverables: 0,
      completedDeliverables: 0,
    });

    // 2b. Auto-generate playbook tasks for the new project
    const autoTasks = tasksFromProjectType('Digital Marketing', projectId, customerId, deal.assignedTo);
    if (autoTasks.length) addTasks(autoTasks);

    // 3. Draft invoice
    const invoiceId = `INV${Date.now()}`;
    const subtotal = deal.dealValue;
    const tax = Math.round(subtotal * 0.18);
    const draftInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: `KN21-${new Date().getFullYear()}-${invoiceId.slice(-4)}`,
      customerId: customerId!,
      customerName: deal.customerName,
      items: [
        { id: `IT${Date.now()}`, description: deal.title, quantity: 1, rate: subtotal, amount: subtotal },
      ],
      subtotal, tax, discount: 0, total: subtotal + tax,
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: deal.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paidAmount: 0,
      notes: 'Auto-generated from Sales Pipeline (Won deal)',
    };
    addInvoice(draftInvoice);

    moveDealStage(deal.id, 'Won', {
      wonOn: new Date().toISOString().split('T')[0],
      customerId,
      invoiceId,
      probability: 100,
    });

    toast({
      title: '🎉 Deal Won!',
      description: `Customer + project created, draft invoice ${draftInvoice.invoiceNumber} added.`,
    });
  };

  const handleConfirmLost = () => {
    if (!lostDeal) return;
    moveDealStage(lostDeal.id, 'Lost', { lostReason, probability: 0 });
    toast({ title: 'Deal marked Lost', description: lostReason, variant: 'destructive' });
    setLostDeal(null);
    setLostReason('Price');
  };

  const handleAddDeal = () => {
    if (!newDeal.title || !newDeal.dealValue || !newDeal.assignedTo) {
      toast({ title: 'Missing fields', description: 'Title, value, owner are required', variant: 'destructive' });
      return;
    }
    const lead = leads.find((l) => l.id === newDeal.leadId);
    const deal: Deal = {
      id: `DEAL${Date.now()}`,
      leadId: newDeal.leadId,
      title: newDeal.title,
      customerName: lead?.name || newDeal.title,
      contactNumber: lead?.contactNumber || '',
      businessType: lead?.businessType || '',
      branchId: newDeal.branchId || lead?.branchId || 'BR001',
      stage: 'New',
      dealValue: Number(newDeal.dealValue),
      probability: Number(newDeal.probability),
      expectedCloseDate: newDeal.expectedCloseDate,
      assignedTo: newDeal.assignedTo,
      notes: newDeal.notes,
      callLogs: [],
      createdOn: new Date().toISOString().split('T')[0],
    };
    addDeal(deal);
    toast({ title: 'Deal created', description: deal.title });
    setShowAdd(false);
    setNewDeal({ leadId: '', title: '', dealValue: 0, probability: 50, expectedCloseDate: '', assignedTo: '', branchId: '', notes: '' });
  };

  const saveCallLog = () => {
    if (!selectedDeal || !callNote.trim()) return;
    addCallLog(selectedDeal.id, {
      id: `DL${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      notes: callNote,
      by: currentUser?.id || 'system',
    });
    setCallNote('');
    toast({ title: 'Call log added' });
    // Refresh selected deal
    const refreshed = useDealStore.getState().deals.find((d) => d.id === selectedDeal.id);
    if (refreshed) setSelectedDeal(refreshed);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track deals from New → Won across stages</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Deal
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Deals</p>
        </div>
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-2xl font-heading font-bold text-primary">{stats.open}</p>
          <p className="text-sm text-muted-foreground">Open</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
          <p className="text-xl font-heading font-bold text-accent">₹{fmt(stats.pipelineValue)}</p>
          <p className="text-sm text-muted-foreground">Pipeline Value</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">{stats.won}</p>
          <p className="text-sm text-muted-foreground">Won</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-xl font-heading font-bold text-warning">₹{fmt(stats.wonValue)}</p>
          <p className="text-sm text-muted-foreground">Won Value</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search deals..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {DEAL_STAGES.map((stage) => (
            <div key={stage} className="w-72 flex-shrink-0">
              <div className={`px-3 py-2 rounded-t-lg border ${stageColors[stage]} flex items-center justify-between font-medium`}>
                <span>{stage}</span>
                <Badge variant="secondary">{dealsByStage[stage].length}</Badge>
              </div>
              <div className="bg-muted/30 border border-t-0 border-border rounded-b-lg p-2 space-y-2 min-h-[400px]">
                {dealsByStage[stage].map((deal) => {
                  const idx = DEAL_STAGES.indexOf(deal.stage);
                  return (
                    <motion.div
                      key={deal.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <p className="font-medium text-sm text-foreground line-clamp-2">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{deal.customerName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-primary flex items-center">
                          <IndianRupee className="w-3 h-3" />{fmt(deal.dealValue)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{deal.probability}%</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{branchName(deal.branchId)}</span>
                        {deal.expectedCloseDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      {deal.stage !== 'Won' && deal.stage !== 'Lost' && (
                        <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs"
                            onClick={() => moveStage(deal, -1)} disabled={idx === 0}>
                            <ChevronLeft className="w-3 h-3" />
                          </Button>
                          <Button variant="default" size="sm" className="flex-1 h-7 text-xs"
                            onClick={() => moveStage(deal, 1)}>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {dealsByStage[stage].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No deals</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deal Detail Drawer */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDeal?.title}
              {selectedDeal && <Badge className={stageColors[selectedDeal.stage]}>{selectedDeal.stage}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedDeal.customerName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{selectedDeal.contactNumber}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Deal Value</p>
                  <p className="font-medium text-primary">₹{fmt(selectedDeal.dealValue)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Probability</p>
                  <p className="font-medium">{selectedDeal.probability}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Expected Close</p>
                  <p className="font-medium">{selectedDeal.expectedCloseDate || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Owner / Branch</p>
                  <p className="font-medium">{employeeName(selectedDeal.assignedTo)}</p>
                  <p className="text-xs text-muted-foreground">{branchName(selectedDeal.branchId)}</p>
                </div>
              </div>

              {selectedDeal.lostReason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> Lost Reason
                  </p>
                  <p className="text-sm">{selectedDeal.lostReason}</p>
                </div>
              )}

              {selectedDeal.invoiceId && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-xs text-success font-medium flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Won — Invoice & Project Created
                  </p>
                  <p className="text-sm">Invoice ID: {selectedDeal.invoiceId}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">{selectedDeal.notes || '—'}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Call Logs ({selectedDeal.callLogs.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedDeal.callLogs.map((log) => (
                    <div key={log.id} className="text-xs p-2 rounded bg-muted/30">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{employeeName(log.by)}</span>
                        <span>{log.date}</span>
                      </div>
                      <p className="mt-1">{log.notes}</p>
                    </div>
                  ))}
                  {selectedDeal.callLogs.length === 0 && (
                    <p className="text-xs text-muted-foreground">No calls logged.</p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={callNote} onChange={(e) => setCallNote(e.target.value)} placeholder="Log a call note..." />
                  <Button onClick={saveCallLog} disabled={!callNote.trim()}>Add</Button>
                </div>
              </div>

              {selectedDeal.stage !== 'Won' && selectedDeal.stage !== 'Lost' && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" className="flex-1" onClick={() => { moveStage(selectedDeal, -1); setSelectedDeal(null); }}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="destructive" onClick={() => { setLostDeal(selectedDeal); setSelectedDeal(null); }}>
                    Mark Lost
                  </Button>
                  <Button variant="gradient" className="flex-1" onClick={() => { handleWin(selectedDeal); setSelectedDeal(null); }}>
                    <Trophy className="w-4 h-4 mr-1" /> Mark Won
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Linked Lead (optional)</label>
              <Select value={newDeal.leadId} onValueChange={(v) => {
                const lead = leads.find((l) => l.id === v);
                setNewDeal({
                  ...newDeal, leadId: v,
                  title: lead ? `${lead.name} - ${lead.requirements.join(', ') || 'Deal'}` : newDeal.title,
                  branchId: lead?.branchId || newDeal.branchId,
                });
              }}>
                <SelectTrigger><SelectValue placeholder="Choose lead" /></SelectTrigger>
                <SelectContent>
                  {leads.filter((l) => l.leadScore !== 'Cold').map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} • {l.leadScore}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Deal Title *</label>
              <Input value={newDeal.title} onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Deal Value (₹) *</label>
                <Input type="number" value={newDeal.dealValue || ''} onChange={(e) => setNewDeal({ ...newDeal, dealValue: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Probability %</label>
                <Input type="number" min={0} max={100} value={newDeal.probability} onChange={(e) => setNewDeal({ ...newDeal, probability: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Expected Close</label>
                <Input type="date" value={newDeal.expectedCloseDate} onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Branch</label>
                <Select value={newDeal.branchId} onValueChange={(v) => setNewDeal({ ...newDeal, branchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Salesperson *</label>
              <Select value={newDeal.assignedTo} onValueChange={(v) => setNewDeal({ ...newDeal, assignedTo: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => ['Sales Executive', 'Telecaller', 'Manager'].includes(e.role)).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} • {e.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={newDeal.notes} onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={handleAddDeal}>Create Deal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lost Reason Dialog */}
      <Dialog open={!!lostDeal} onOpenChange={() => setLostDeal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Mark Deal as Lost</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{lostDeal?.title}</p>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason *</label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {lostReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setLostDeal(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleConfirmLost}>Confirm Lost</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
