import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Clock, AlertTriangle, CheckCircle2, Paperclip, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AgencyTask, TaskStatus, TaskUpdate, daysToDeadline, isOverdue, useTaskStore,
} from '@/store/taskStore';
import { useCRMStore } from '@/store/crmStore';
import { useApprovalStore, ApprovalStatus } from '@/store/approvalStore';
import { CheckSquare, RefreshCw, XCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES: TaskStatus[] = ['Not Started', 'In Progress', 'Review', 'Completed', 'Blocked'];
const APPROVAL_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Revision Requested', 'No Approval'] as const;

const statusVariant: Record<TaskStatus, string> = {
  'Not Started': 'secondary',
  'In Progress': 'inProgress',
  Review: 'info',
  Completed: 'completed',
  Blocked: 'failed',
};

const approvalMeta: Record<ApprovalStatus, { variant: string; icon: any; label: string }> = {
  Pending: { variant: 'info', icon: HelpCircle, label: 'Approval Pending' },
  Approved: { variant: 'completed', icon: CheckSquare, label: 'Approved' },
  Rejected: { variant: 'failed', icon: XCircle, label: 'Rejected' },
  'Revision Requested': { variant: 'inProgress', icon: RefreshCw, label: 'Revision' },
};

export default function TasksPage() {
  const { tasks, updateTask, addUpdate } = useTaskStore();
  const { employees, projects, customers, currentUser } = useCRMStore();
  const { approvals } = useApprovalStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [approvalFilter, setApprovalFilter] = useState<string>('All');
  const [selected, setSelected] = useState<AgencyTask | null>(null);
  const [updMsg, setUpdMsg] = useState('');
  const [updFiles, setUpdFiles] = useState('');
  const [updTime, setUpdTime] = useState<number>(1);

  const isEmployeeRole = currentUser?.role === 'Employee';

  // Latest approval per task id
  const taskApprovalMap = useMemo(() => {
    const m: Record<string, typeof approvals[number]> = {};
    approvals
      .filter((a) => a.entityType === 'Task')
      .forEach((a) => {
        const prev = m[a.entityId];
        if (!prev || a.createdAt > prev.createdAt) m[a.entityId] = a;
      });
    return m;
  }, [approvals]);

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (isEmployeeRole && t.assignedTo !== currentUser?.id) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (approvalFilter !== 'All') {
        const ap = taskApprovalMap[t.id];
        if (approvalFilter === 'No Approval') {
          if (ap) return false;
        } else {
          if (!ap || ap.status !== approvalFilter) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const proj = projects.find((p) => p.id === t.projectId)?.title || '';
        return (
          t.title.toLowerCase().includes(q) ||
          proj.toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, search, statusFilter, approvalFilter, isEmployeeRole, currentUser, projects, taskApprovalMap]);

  const stats = {
    total: visible.length,
    inProgress: visible.filter((t) => t.status === 'In Progress').length,
    overdue: visible.filter(isOverdue).length,
    done: visible.filter((t) => t.status === 'Completed').length,
    pendingApproval: visible.filter((t) => taskApprovalMap[t.id]?.status === 'Pending').length,
    revision: visible.filter((t) => taskApprovalMap[t.id]?.status === 'Revision Requested').length,
  };

  const empName = (id?: string) =>
    id ? employees.find((e) => e.id === id)?.name || 'Unassigned' : 'Unassigned';
  const projName = (id: string) => projects.find((p) => p.id === id)?.title || id;
  const custName = (id?: string) => customers.find((c) => c.id === id)?.name || '—';

  const handleAddUpdate = () => {
    if (!selected || !updMsg.trim()) {
      toast.error('Add a message to log work');
      return;
    }
    const u: TaskUpdate = {
      id: `U${Date.now()}`,
      message: updMsg,
      files: updFiles ? updFiles.split(',').map((s) => s.trim()).filter(Boolean) : [],
      timeSpent: Number(updTime) || 0,
      by: currentUser?.id || 'SYSTEM',
      byName: currentUser?.name,
      createdAt: new Date().toISOString(),
    };
    addUpdate(selected.id, u);
    setSelected({ ...selected, updates: [...selected.updates, u] });
    setUpdMsg(''); setUpdFiles(''); setUpdTime(1);
    toast.success('Work update added');
  };

  const handleStatus = (s: TaskStatus) => {
    if (!selected) return;
    updateTask(selected.id, { status: s });
    setSelected({ ...selected, status: s });
    toast.success(`Status → ${s}`);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">Daily execution, work updates & SLA tracking</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-bold text-info">{stats.inProgress}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
          <p className="text-sm text-muted-foreground">Overdue</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-bold text-success">{stats.done}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <button
          onClick={() => setApprovalFilter('Pending')}
          className="text-left p-4 rounded-xl bg-warning/10 border border-warning/30 hover:bg-warning/20 transition">
          <p className="text-2xl font-bold text-warning">{stats.pendingApproval}</p>
          <p className="text-sm text-muted-foreground">Approval Pending</p>
        </button>
        <button
          onClick={() => setApprovalFilter('Revision Requested')}
          className="text-left p-4 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/20 transition">
          <p className="text-2xl font-bold text-accent">{stats.revision}</p>
          <p className="text-sm text-muted-foreground">In Revision</p>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks, project..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={approvalFilter} onValueChange={setApprovalFilter}>
          <SelectTrigger className="w-full lg:w-56"><SelectValue placeholder="Approval" /></SelectTrigger>
          <SelectContent>
            {APPROVAL_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'All' ? 'All Approvals' : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Task</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Project / Client</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Owner</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Approval</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">SLA / Deadline</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Updates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((t, i) => {
                const overdue = isOverdue(t);
                const days = daysToDeadline(t);
                const ap = taskApprovalMap[t.id];
                const apMeta = ap ? approvalMeta[ap.status] : null;
                return (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(t)}>
                    <td className="p-3">
                      <p className="font-medium text-sm">{t.title}</p>
                      {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                    </td>
                    <td className="p-3 text-sm">
                      <p className="text-foreground">{projName(t.projectId)}</p>
                      <p className="text-xs text-muted-foreground">{custName(t.customerId)}</p>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{empName(t.assignedTo)}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant[t.status] as any}>{t.status}</Badge>
                    </td>
                    <td className="p-3">
                      {ap && apMeta ? (
                        <div className="space-y-1">
                          <Badge variant={apMeta.variant as any} className="text-[10px]">
                            <apMeta.icon className="w-3 h-3 mr-1" />
                            {apMeta.label}
                          </Badge>
                          {ap.revisionCount > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              v{ap.revisionCount + 1} • {ap.revisionCount} revision{ap.revisionCount > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{t.slaDays}d SLA</span>
                      </div>
                      <div className="mt-1">
                        {overdue ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Overdue {Math.abs(days)}d
                          </Badge>
                        ) : t.status === 'Completed' ? (
                          <Badge variant="completed" className="text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {days >= 0 ? `${days}d left` : 'Due'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{t.updates.length}</td>
                  </motion.tr>
                );
              })}
              {visible.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No tasks</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Detail */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Project</p>
                    <p className="font-medium">{projName(selected.projectId)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="font-medium">{empName(selected.assignedTo)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">SLA</p>
                    <p className="font-medium">{selected.slaDays} days</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{new Date(selected.deadline).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {(() => {
                  const ap = taskApprovalMap[selected.id];
                  if (!ap) return null;
                  const m = approvalMeta[ap.status];
                  return (
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">Latest Approval</p>
                        <Badge variant={m.variant as any} className="text-[10px]">
                          <m.icon className="w-3 h-3 mr-1" />{m.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(ap.createdAt).toLocaleString('en-IN')} by {ap.submittedByName || ap.submittedBy}
                        {ap.revisionCount > 0 && ` • ${ap.revisionCount} revision${ap.revisionCount > 1 ? 's' : ''}`}
                      </p>
                      {ap.revisionNotes && (
                        <p className="text-xs mt-2 italic">"{ap.revisionNotes}"</p>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <p className="text-sm font-semibold mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <Button key={s} size="sm"
                        variant={selected.status === s ? 'gradient' : 'outline'}
                        onClick={() => handleStatus(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Add Work Update</p>
                  <Textarea placeholder="What did you do?" value={updMsg}
                    onChange={(e) => setUpdMsg(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input placeholder="Files (comma separated names/links)"
                      value={updFiles} onChange={(e) => setUpdFiles(e.target.value)} />
                    <Input type="number" min={0} step={0.5} placeholder="Hours spent"
                      value={updTime} onChange={(e) => setUpdTime(parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button size="sm" className="mt-2" variant="gradient" onClick={handleAddUpdate}>
                    <Plus className="w-3 h-3 mr-1" /> Log Update
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Updates ({selected.updates.length})</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selected.updates.length === 0 && (
                      <p className="text-xs text-muted-foreground">No updates yet</p>
                    )}
                    {[...selected.updates].reverse().map((u) => (
                      <div key={u.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{u.byName || u.by}</span>
                          <span>{new Date(u.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p>{u.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {u.timeSpent}h</span>
                          {u.files.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> {u.files.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
