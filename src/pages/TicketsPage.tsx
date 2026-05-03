import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LifeBuoy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTicketStore } from '@/store/ticketStore';
import { useCRMStore } from '@/store/crmStore';
import { SupportTicket } from '@/data/dummyData';
import { toast } from 'sonner';

const priorityColor: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-info/15 text-info',
  High: 'bg-warning/15 text-warning',
  Urgent: 'bg-destructive/15 text-destructive',
};
const statusColor: Record<string, string> = {
  Open: 'bg-info/15 text-info',
  'In Progress': 'bg-warning/15 text-warning',
  Resolved: 'bg-success/15 text-success',
  Closed: 'bg-muted text-muted-foreground',
};

export default function TicketsPage() {
  const { tickets, addTicket, updateTicket, deleteTicket } = useTicketStore();
  const { customers, employees, currentUser } = useCRMStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<SupportTicket>>({ priority: 'Medium', status: 'Open', category: 'Question' });

  // Customer view: only show their tickets
  const visible = currentUser?.role === 'Customer'
    ? tickets.filter((t) => t.customerId === customers.find((c) => c.name === currentUser.name)?.id)
    : tickets;

  const handleSave = () => {
    if (!form.customerId || !form.subject) {
      toast.error('Customer and subject required');
      return;
    }
    const cust = customers.find((c) => c.id === form.customerId);
    const today = new Date().toISOString().split('T')[0];
    addTicket({
      id: `TKT${Date.now()}`,
      customerId: form.customerId!,
      customerName: cust?.name || '',
      subject: form.subject!,
      description: form.description || '',
      priority: (form.priority as SupportTicket['priority']) || 'Medium',
      status: 'Open',
      assignedTo: form.assignedTo,
      createdOn: today,
      updatedOn: today,
      category: (form.category as SupportTicket['category']) || 'Question',
    });
    toast.success('Ticket created');
    setOpen(false);
    setForm({ priority: 'Medium', status: 'Open', category: 'Question' });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><LifeBuoy className="w-6 h-6" /> Support Tickets</h1>
          <p className="text-muted-foreground">Customer issues, feature requests and follow-ups</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gradient"><Plus className="w-4 h-4 mr-2" /> New Ticket</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Raise New Ticket</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Customer</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subject</Label><Input value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as SupportTicket['priority'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['Low','Medium','High','Urgent'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as SupportTicket['category'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['Bug','Feature Request','Question','Complaint','Other'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Assign To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave}>Create Ticket</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((t) => {
              const emp = employees.find((e) => e.id === t.assignedTo);
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-xs font-mono">{t.id}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell className="font-medium max-w-[220px] truncate">{t.subject}</TableCell>
                  <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                  <TableCell><span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[t.priority]}`}>{t.priority}</span></TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => updateTicket(t.id, { status: v as SupportTicket['status'] })}>
                      <SelectTrigger className={`h-8 w-[130px] ${statusColor[t.status]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{['Open','In Progress','Resolved','Closed'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{emp?.name || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.updatedOn}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { deleteTicket(t.id); toast.success('Deleted'); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No tickets yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
