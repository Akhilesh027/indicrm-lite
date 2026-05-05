import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCommunicationStore, CommChannel } from '@/store/communicationStore';
import { useCRMStore } from '@/store/crmStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Mail, Phone, Users, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

const channelIcon: Record<CommChannel, any> = {
  WhatsApp: MessageSquare, Email: Mail, Call: Phone, Meeting: Users, SMS: MessageSquare,
};

export default function CommunicationsPage() {
  const { customers, currentUser } = useCRMStore();
  const { comms, addComm, forCustomer } = useCommunicationStore();
  const [selectedId, setSelectedId] = useState(customers[0]?.id || '');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    channel: 'WhatsApp' as CommChannel,
    direction: 'Outbound' as 'Inbound' | 'Outbound',
    subject: '', message: '',
  });

  const customer = customers.find((c) => c.id === selectedId);
  const list = customer ? forCustomer(customer.id) : [];

  const handleSubmit = () => {
    if (!customer || !form.message.trim()) {
      toast.error('Pick a customer and add a message');
      return;
    }
    addComm({
      id: `COM${Date.now()}`,
      customerId: customer.id,
      channel: form.channel,
      direction: form.direction,
      subject: form.subject || undefined,
      message: form.message,
      by: currentUser?.id || 'SYS',
      byName: currentUser?.name || 'System',
      createdAt: new Date().toISOString(),
    });
    toast.success('Communication logged');
    setForm({ ...form, subject: '', message: '' });
    setOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Communications</h1>
          <p className="text-muted-foreground">Unified WhatsApp / Email / Call / Meeting timeline per customer</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Log Communication</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={form.channel} onValueChange={(v: any) => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['WhatsApp', 'Email', 'Call', 'Meeting', 'SMS'] as CommChannel[]).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.direction} onValueChange={(v: any) => setForm({ ...form, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outbound">Outbound (we sent)</SelectItem>
                  <SelectItem value="Inbound">Inbound (received)</SelectItem>
                </SelectContent>
              </Select>
              {form.channel === 'Email' && (
                <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              )}
              <Textarea rows={4} placeholder="Message / notes…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button className="w-full" onClick={handleSubmit}><Send className="w-4 h-4 mr-2" />Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedId} onValueChange={setSelectedId}>
        <TabsList className="flex-wrap h-auto">
          {customers.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
          ))}
        </TabsList>
        {customers.map((c) => (
          <TabsContent key={c.id} value={c.id}>
            <Card>
              <CardHeader><CardTitle>{c.name} — Timeline ({forCustomer(c.id).length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {forCustomer(c.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">No communications yet.</p>
                )}
                {forCustomer(c.id).map((com) => {
                  const Icon = channelIcon[com.channel];
                  return (
                    <div key={com.id} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/40">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{com.channel}</Badge>
                          <Badge variant={com.direction === 'Inbound' ? 'secondary' : 'default'}>
                            {com.direction}
                          </Badge>
                          {com.subject && <span className="font-medium text-sm">{com.subject}</span>}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(com.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{com.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">by {com.byName}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
