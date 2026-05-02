import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, FileText, Download, Edit, Trash2, Send, CheckCircle,
  XCircle, Eye, Clock, IndianRupee, X,
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
import { useProposalStore } from '@/store/proposalStore';
import { useCRMStore } from '@/store/crmStore';
import { useDealStore } from '@/store/dealStore';
import { Proposal, ProposalService, ProposalStatus } from '@/data/proposalData';
import { generateProposalPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

const statusMeta: Record<ProposalStatus, { color: string; icon: any }> = {
  Draft: { color: 'bg-muted text-muted-foreground', icon: Clock },
  Sent: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Send },
  Viewed: { color: 'bg-violet-500/10 text-violet-600 border-violet-500/30', icon: Eye },
  Accepted: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: CheckCircle },
  Rejected: { color: 'bg-rose-500/10 text-rose-600 border-rose-500/30', icon: XCircle },
};

const statuses: ProposalStatus[] = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'];

const emptyService = (): ProposalService => ({
  id: `PS${Date.now()}${Math.floor(Math.random() * 1000)}`,
  name: '', description: '', price: 0,
});

export default function ProposalsPage() {
  const { proposals, addProposal, updateProposal, deleteProposal, setStatus } = useProposalStore();
  const { leads } = useCRMStore();
  const { deals, moveDealStage } = useDealStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const blank = (): Omit<Proposal, 'id'> => ({
    proposalNumber: `PR-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
    clientName: '', clientContact: '',
    leadId: undefined, dealId: undefined,
    services: [emptyService()],
    totalPrice: 0, durationDays: 30,
    deliverables: [''], status: 'Draft',
    createdOn: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const [form, setForm] = useState<Omit<Proposal, 'id'>>(blank());

  const visible = useMemo(() => proposals.filter((p) => {
    const ms = !search || p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.proposalNumber.toLowerCase().includes(search.toLowerCase());
    const mstat = statusFilter === 'All' || p.status === statusFilter;
    return ms && mstat;
  }), [proposals, search, statusFilter]);

  const stats = useMemo(() => ({
    total: proposals.length,
    accepted: proposals.filter((p) => p.status === 'Accepted').length,
    pending: proposals.filter((p) => ['Sent', 'Viewed'].includes(p.status)).length,
    value: proposals.reduce((s, p) => s + p.totalPrice, 0),
  }), [proposals]);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  const openCreate = () => { setEditing(null); setForm(blank()); setShowForm(true); };
  const openEdit = (p: Proposal) => {
    setEditing(p);
    setForm({ ...p });
    setShowForm(true);
  };

  const updateService = (idx: number, patch: Partial<ProposalService>) => {
    const services = form.services.map((s, i) => i === idx ? { ...s, ...patch } : s);
    setForm({ ...form, services, totalPrice: services.reduce((sum, s) => sum + (s.price || 0), 0) });
  };
  const addService = () => setForm({ ...form, services: [...form.services, emptyService()] });
  const removeService = (idx: number) => {
    const services = form.services.filter((_, i) => i !== idx);
    setForm({ ...form, services, totalPrice: services.reduce((sum, s) => sum + (s.price || 0), 0) });
  };

  const updateDeliverable = (idx: number, val: string) => {
    setForm({ ...form, deliverables: form.deliverables.map((d, i) => i === idx ? val : d) });
  };
  const addDeliverable = () => setForm({ ...form, deliverables: [...form.deliverables, ''] });
  const removeDeliverable = (idx: number) => setForm({ ...form, deliverables: form.deliverables.filter((_, i) => i !== idx) });

  const handleSave = () => {
    if (!form.clientName || !form.clientContact || form.services.length === 0) {
      toast({ title: 'Missing fields', description: 'Client, contact and at least 1 service required', variant: 'destructive' });
      return;
    }
    const cleaned = { ...form, deliverables: form.deliverables.filter((d) => d.trim()) };
    if (editing) {
      updateProposal(editing.id, cleaned);
      toast({ title: 'Proposal updated', description: cleaned.proposalNumber });
    } else {
      addProposal({ id: `PROP${Date.now()}`, ...cleaned });
      toast({ title: 'Proposal created', description: cleaned.proposalNumber });
    }
    setShowForm(false);
  };

  const handleStatus = (p: Proposal, newStatus: ProposalStatus) => {
    setStatus(p.id, newStatus);
    toast({ title: `Marked ${newStatus}`, description: p.proposalNumber });

    // If accepted and linked to a deal, move deal forward
    if (newStatus === 'Accepted' && p.dealId) {
      const deal = deals.find((d) => d.id === p.dealId);
      if (deal && deal.stage !== 'Won' && deal.stage !== 'Negotiation') {
        moveDealStage(p.dealId, 'Negotiation');
        toast({ title: 'Deal advanced', description: 'Linked deal moved to Negotiation' });
      }
    }
  };

  const handleDownload = (p: Proposal) => {
    const doc = generateProposalPDF(p);
    doc.save(`${p.proposalNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Proposals</h1>
          <p className="text-muted-foreground">Send, track, and convert proposals into deals</p>
        </div>
        <Button variant="gradient" onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New Proposal</Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Proposals</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">{stats.accepted}</p>
          <p className="text-sm text-muted-foreground">Accepted</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Awaiting Response</p>
        </div>
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-xl font-heading font-bold text-primary">₹{fmt(stats.value)}</p>
          <p className="text-sm text-muted-foreground">Total Quoted</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by client or number..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {visible.map((p, i) => {
          const Meta = statusMeta[p.status].icon;
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground line-clamp-1">{p.clientName}</p>
                  <p className="text-xs text-muted-foreground">{p.proposalNumber}</p>
                </div>
                <Badge className={statusMeta[p.status].color} variant="outline">
                  <Meta className="w-3 h-3 mr-1" /> {p.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-primary flex items-center"><IndianRupee className="w-3 h-3" />{fmt(p.totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Services: {p.services.length}</span>
                  <span>Valid: {new Date(p.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleDownload(p)}>
                  <Download className="w-3 h-3 mr-1" /> PDF
                </Button>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm(`Delete ${p.proposalNumber}?`)) deleteProposal(p.id);
                }}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
              {p.status !== 'Accepted' && p.status !== 'Rejected' && (
                <div className="flex gap-1 mt-2">
                  {p.status === 'Draft' && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStatus(p, 'Sent')}>Send</Button>
                  )}
                  {(p.status === 'Sent' || p.status === 'Viewed') && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1 text-success" onClick={() => handleStatus(p, 'Accepted')}>Accept</Button>
                      <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => handleStatus(p, 'Rejected')}>Reject</Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No proposals match your filters.</p>
          </div>
        )}
      </motion.div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Proposal' : 'New Proposal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Proposal #</label>
                <Input value={form.proposalNumber} onChange={(e) => setForm({ ...form, proposalNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Linked Lead</label>
                <Select value={form.leadId || ''} onValueChange={(v) => {
                  const lead = leads.find((l) => l.id === v);
                  setForm({
                    ...form, leadId: v,
                    clientName: lead?.name || form.clientName,
                    clientContact: lead?.contactNumber || form.clientContact,
                  });
                }}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Client Name *</label>
                <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Client Contact *</label>
                <Input value={form.clientContact} onChange={(e) => setForm({ ...form, clientContact: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Services</label>
                <Button size="sm" variant="outline" onClick={addService}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {form.services.map((s, i) => (
                  <div key={s.id} className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg bg-muted/30">
                    <Input className="col-span-3" placeholder="Service" value={s.name}
                      onChange={(e) => updateService(i, { name: e.target.value })} />
                    <Input className="col-span-6" placeholder="Description" value={s.description}
                      onChange={(e) => updateService(i, { description: e.target.value })} />
                    <Input className="col-span-2" type="number" placeholder="Price" value={s.price || ''}
                      onChange={(e) => updateService(i, { price: Number(e.target.value) })} />
                    <Button className="col-span-1" variant="ghost" size="icon" onClick={() => removeService(i)}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-right mt-2 text-sm font-bold text-primary">Total: ₹{fmt(form.totalPrice)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Duration (days)</label>
                <Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valid Until</label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProposalStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Deliverables</label>
                <Button size="sm" variant="outline" onClick={addDeliverable}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {form.deliverables.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={d} onChange={(e) => updateDeliverable(i, e.target.value)} placeholder={`Deliverable ${i + 1}`} />
                    <Button variant="ghost" size="icon" onClick={() => removeDeliverable(i)}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave}>{editing ? 'Save Changes' : 'Create Proposal'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
