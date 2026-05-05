import { motion } from 'framer-motion';
import { useNotificationStore, NotifType } from '@/store/notificationStore';
import { useCRMStore } from '@/store/crmStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckSquare, FileText, Target, Settings as SettingsIcon, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const iconFor: Record<NotifType, any> = {
  task: ClipboardCheck, approval: CheckSquare, invoice: FileText, lead: Target, system: SettingsIcon,
};

export default function NotificationsPage() {
  const { currentUser } = useCRMStore();
  const { forRole, markRead, markAllRead } = useNotificationStore();
  const list = forRole(currentUser?.role);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><Bell className="w-7 h-7" />Notifications</h1>
          <p className="text-muted-foreground">Inbox of system alerts, overdue tasks & approvals</p>
        </div>
        <Button variant="outline" onClick={() => { markAllRead(currentUser?.role); toast.success('All marked as read'); }}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-2">
        {list.length === 0 && <p className="text-center text-muted-foreground py-12">You're all caught up 🎉</p>}
        {list.map((n) => {
          const Icon = iconFor[n.type];
          return (
            <Card key={n.id} className={!n.read ? 'border-primary/40 bg-primary/5' : ''}>
              <CardContent className="pt-4 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.title}</p>
                    {!n.read && <Badge variant="default" className="text-[10px] h-4">NEW</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                  <div className="flex gap-2 mt-2">
                    {n.link && <Link to={n.link}><Button size="sm" variant="outline">Open</Button></Link>}
                    {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
