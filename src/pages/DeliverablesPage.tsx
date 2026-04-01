import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, MessageSquare, Calendar, User,
  Video, Image, Globe, Smartphone, BarChart2, PenTool, FileText,
  CheckCircle, Clock, AlertCircle, Eye, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import { Deliverable } from '@/data/invoiceData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ElementType> = {
  Video, 'Social Media Post': Image, Design: PenTool, Website: Globe,
  'App Feature': Smartphone, SEO: BarChart2, 'Ad Campaign': BarChart2,
  'Content Writing': FileText,
};

const statusColumns = ['Not Started', 'In Progress', 'Review', 'Completed'] as const;

const statusColors: Record<string, string> = {
  'Not Started': 'bg-muted/50 border-muted-foreground/20',
  'In Progress': 'bg-warning/5 border-warning/30',
  'Review': 'bg-info/5 border-info/30',
  'Completed': 'bg-success/5 border-success/30',
  'Revision': 'bg-destructive/5 border-destructive/30',
};

export default function DeliverablesPage() {
  const { deliverables, updateDeliverable, addDeliverableComment } = useInvoiceStore();
  const { customers, employees } = useCRMStore();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-12');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();

  const filtered = deliverables.filter((d) => {
    const matchesCustomer = selectedCustomer === 'all' || d.customerId === selectedCustomer;
    const matchesMonth = d.month === selectedMonth;
    return matchesCustomer && matchesMonth;
  });

  const totalDels = filtered.length;
  const completedDels = filtered.filter((d) => d.status === 'Completed').length;
  const progressPercent = totalDels > 0 ? Math.round((completedDels / totalDels) * 100) : 0;

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || id;
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const handleStatusChange = (deliverable: Deliverable, newStatus: string) => {
    updateDeliverable(deliverable.id, {
      status: newStatus as Deliverable['status'],
      completedDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
    });
    toast({ title: 'Status Updated', description: `${deliverable.title} → ${newStatus}` });
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedDeliverable) return;
    addDeliverableComment(selectedDeliverable.id, {
      id: `C${Date.now()}`,
      userId: 'ADMIN001',
      userName: 'Admin',
      text: commentText,
      timestamp: new Date().toISOString(),
    });
    setCommentText('');
    toast({ title: 'Comment Added' });
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  // Group by customer for summary
  const customerSummaries = customers
    .map((c) => {
      const custDels = filtered.filter((d) => d.customerId === c.id);
      if (custDels.length === 0) return null;
      const completed = custDels.filter((d) => d.status === 'Completed').length;
      return { ...c, total: custDels.length, completed, progress: Math.round((completed / custDels.length) * 100) };
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Deliverables</h1>
          <p className="text-muted-foreground">Track all client deliverables and work progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'kanban' ? 'gradient' : 'outline'} size="sm"
            onClick={() => setViewMode('kanban')}>Kanban</Button>
          <Button variant={viewMode === 'list' ? 'gradient' : 'outline'} size="sm"
            onClick={() => setViewMode('list')}>List</Button>
        </div>
      </motion.div>

      {/* Filters & Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-12">December 2024</SelectItem>
            <SelectItem value="2024-11">November 2024</SelectItem>
            <SelectItem value="2025-01">January 2025</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <Progress value={progressPercent} className="h-3" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {completedDels}/{totalDels} ({progressPercent}%)
          </span>
        </div>
      </motion.div>

      {/* Customer Summary Cards */}
      {selectedCustomer === 'all' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {customerSummaries.map((cs: any) => (
            <div key={cs.id} className="p-4 rounded-xl bg-card border border-border shadow-card cursor-pointer hover:shadow-card-hover transition-all"
              onClick={() => setSelectedCustomer(cs.id)}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {cs.name.charAt(0)}
                </div>
                <span className="font-semibold text-sm truncate">{cs.name}</span>
              </div>
              <Progress value={cs.progress} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{cs.completed}/{cs.total} completed</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((status) => {
            const columnItems = filtered.filter((d) => d.status === status);
            return (
              <div key={status} className={`rounded-xl border p-3 min-h-[200px] ${statusColors[status]}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{status}</h3>
                  <Badge variant="secondary" className="text-xs">{columnItems.length}</Badge>
                </div>
                <div className="space-y-2">
                  {columnItems.map((del) => (
                    <motion.div key={del.id} layout
                      className="p-3 rounded-lg bg-card border border-border shadow-sm hover:shadow-card transition-all cursor-pointer"
                      onClick={() => setSelectedDeliverable(del)}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-muted-foreground mt-0.5">{getCategoryIcon(del.category)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{del.title}</p>
                          <p className="text-xs text-muted-foreground">{getCustomerName(del.customerId)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{getEmployeeName(del.assignedTo)}</span>
                        </div>
                        <span>{new Date(del.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      {del.priority === 'Urgent' && (
                        <Badge variant="failed" className="mt-2 text-xs">Urgent</Badge>
                      )}
                      {del.priority === 'High' && (
                        <Badge variant="warning" className="mt-2 text-xs">High</Badge>
                      )}
                      {del.comments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          <span>{del.comments.length}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        /* List View */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Deliverable</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Client</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Assigned</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Due</th>
                  <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((del) => (
                  <tr key={del.id} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedDeliverable(del)}>
                    <td className="p-3 text-sm font-medium">{del.title}</td>
                    <td className="p-3 text-sm text-muted-foreground">{getCustomerName(del.customerId)}</td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-1">{getCategoryIcon(del.category)} {del.category}</div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{getEmployeeName(del.assignedTo)}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(del.dueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={
                        del.status === 'Completed' ? 'completed' :
                        del.status === 'In Progress' ? 'inProgress' :
                        del.status === 'Review' ? 'info' :
                        del.status === 'Revision' ? 'failed' : 'pending'
                      }>{del.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Deliverable Detail Modal */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDeliverable && getCategoryIcon(selectedDeliverable.category)}
              {selectedDeliverable?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedDeliverable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-sm">{getCustomerName(selectedDeliverable.customerId)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="font-medium text-sm">{getEmployeeName(selectedDeliverable.assignedTo)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium text-sm">{new Date(selectedDeliverable.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <Badge variant={
                    selectedDeliverable.priority === 'Urgent' ? 'failed' :
                    selectedDeliverable.priority === 'High' ? 'warning' : 'secondary'
                  }>{selectedDeliverable.priority}</Badge>
                </div>
              </div>

              {/* Status Change */}
              <div>
                <p className="text-sm font-semibold mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['Not Started', 'In Progress', 'Review', 'Completed', 'Revision'].map((status) => (
                    <Button key={status} size="sm"
                      variant={selectedDeliverable.status === status ? 'gradient' : 'outline'}
                      onClick={() => {
                        handleStatusChange(selectedDeliverable, status);
                        setSelectedDeliverable({ ...selectedDeliverable, status: status as any });
                      }}>
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-sm font-semibold mb-2">Comments ({selectedDeliverable.comments.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {selectedDeliverable.comments.map((c) => (
                    <div key={c.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-medium">{c.userName}</span>
                        <span>{new Date(c.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  ))}
                  {selectedDeliverable.comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="Add a comment..." value={commentText}
                    onChange={(e) => setCommentText(e.target.value)} className="min-h-[60px]" />
                </div>
                <Button size="sm" variant="gradient" className="mt-2" onClick={handleAddComment}
                  disabled={!commentText.trim()}>
                  <MessageSquare className="w-3 h-3 mr-1" /> Post Comment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
