import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCRMStore } from '@/store/crmStore';
import { Branch } from '@/data/dummyData';
import { toast } from 'sonner';

export default function BranchesPage() {
  const { branches, employees, addBranch, updateBranch, deleteBranch } = useCRMStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<Partial<Branch>>({ status: 'Active' });

  const handleSave = () => {
    if (!form.name || !form.city) {
      toast.error('Name and city are required');
      return;
    }
    if (editing) {
      updateBranch(editing.id, form);
      toast.success('Branch updated');
    } else {
      addBranch({
        id: `BR${Date.now()}`,
        name: form.name!,
        city: form.city!,
        managerId: form.managerId || '',
        status: (form.status as 'Active' | 'Inactive') || 'Active',
      });
      toast.success('Branch added');
    }
    setOpen(false);
    setEditing(null);
    setForm({ status: 'Active' });
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm(b);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Branches</h1>
          <p className="text-muted-foreground">Manage office branches and assigned managers</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ status: 'Active' }); } }}>
          <DialogTrigger asChild>
            <Button variant="gradient"><Plus className="w-4 h-4 mr-2" /> Add Branch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Branch</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Branch Name</Label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>City</Label><Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div>
                <Label>Manager</Label>
                <Select value={form.managerId} onValueChange={(v) => setForm({ ...form, managerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as 'Active' | 'Inactive' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => {
              const mgr = employees.find((e) => e.id === b.managerId);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell>{mgr?.name || '—'}</TableCell>
                  <TableCell><Badge variant={b.status === 'Active' ? 'default' : 'secondary'}>{b.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { deleteBranch(b.id); toast.success('Deleted'); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
