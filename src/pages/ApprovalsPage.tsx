import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApprovalStore, ApprovalStatus } from '@/store/approvalStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, RotateCw, Clock } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<ApprovalStatus, string> = {
  Pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  Approved: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  Rejected: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
  'Revision Requested': 'bg-blue-500/15 text-blue-600 border-blue-500/30',
};

export default function ApprovalsPage() {
  const { approvals, decide } = useApprovalStore();
  const [revOpen, setRevOpen] = useState<string | null>(null);
  const [revNotes, setRevNotes] = useState('');

  const groups: Record<string, typeof approvals> = {
    All: approvals,
    Pending: approvals.filter((a) => a.status === 'Pending'),
    'Revision Requested': approvals.filter((a) => a.status === 'Revision Requested'),
    Approved: approvals.filter((a) => a.status === 'Approved'),
    Rejected: approvals.filter((a) => a.status === 'Rejected'),
  };

  const handleRevision = () => {
    if (!revOpen) return;
    decide(revOpen, 'Revision Requested', revNotes);
    toast.success('Revision requested');
    setRevOpen(null);
    setRevNotes('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Approvals & Revisions</h1>
        <p className="text-muted-foreground">Track creative reviews, client approvals & revision history</p>
      </div>

      <Tabs defaultValue="Pending">
        <TabsList>
          {Object.keys(groups).map((k) => (
            <TabsTrigger key={k} value={k}>{k} ({groups[k].length})</TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(groups).map(([k, list]) => (
          <TabsContent key={k} value={k} className="space-y-3">
            {list.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">Nothing here.</p>}
            {list.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.entityType} · submitted by {a.submittedByName} · {new Date(a.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.revisionCount > 0 && (
                        <Badge variant="outline">v{a.revisionCount + 1}</Badge>
                      )}
                      <Badge className={statusColor[a.status]} variant="outline">{a.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {a.revisionNotes && (
                    <div className="text-sm bg-muted/50 p-3 rounded mb-3">
                      <span className="font-medium">Last notes: </span>{a.revisionNotes}
                    </div>
                  )}
                  {a.status === 'Pending' || a.status === 'Revision Requested' ? (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => { decide(a.id, 'Approved'); toast.success('Approved'); }}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRevOpen(a.id)}>
                        <RotateCw className="w-4 h-4 mr-2" />Request Revision
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { decide(a.id, 'Rejected'); toast.error('Rejected'); }}>
                        <XCircle className="w-4 h-4 mr-2" />Reject
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />Decided {a.decidedAt ? new Date(a.decidedAt).toLocaleString('en-IN') : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!revOpen} onOpenChange={(o) => !o && setRevOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Revision</DialogTitle></DialogHeader>
          <Textarea rows={4} placeholder="What needs to change?" value={revNotes} onChange={(e) => setRevNotes(e.target.value)} />
          <Button onClick={handleRevision}>Send Back for Revision</Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
