import { motion } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { callLogs } from '@/data/dummyData';

export default function TelecallerPage() {
  const { leads, employees, currentUser } = useCRMStore();

  // Filter leads assigned to telecallers
  const telecallerLeads = leads.filter((lead) => {
    const emp = employees.find((e) => e.id === lead.assignedTo);
    return emp?.role === 'Telecaller';
  });

  const todayCalls = callLogs.filter(
    (log) => new Date(log.dateTime).toDateString() === new Date().toDateString()
  );

  const todayFollowups = leads.filter((lead) => {
    return lead.followUpDate === new Date().toISOString().split('T')[0];
  });

  const stats = {
    totalCalls: callLogs.length,
    todayCalls: todayCalls.length,
    followups: leads.filter((l) => l.status === 'Follow Up' || l.status === 'Call Back').length,
    ownClose: leads.filter((l) => l.status === 'Own Close').length,
    conversionRate: Math.round(
      (leads.filter((l) => l.status === 'Own Close').length / leads.length) * 100
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Telecaller Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage calls, follow-ups, and lead conversions
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">Total Calls</span>
          </div>
          <p className="text-3xl font-heading font-bold text-foreground">{stats.totalCalls}</p>
        </div>
        <div className="p-5 rounded-xl gradient-accent text-accent-foreground shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent-foreground/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="text-sm text-accent-foreground/80">Today's Calls</span>
          </div>
          <p className="text-3xl font-heading font-bold">{stats.todayCalls}</p>
        </div>
        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/20 text-warning">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">Follow-ups</span>
          </div>
          <p className="text-3xl font-heading font-bold text-warning">{stats.followups}</p>
        </div>
        <div className="p-5 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/20 text-success">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-sm text-muted-foreground">Own Close</span>
          </div>
          <p className="text-3xl font-heading font-bold text-success">{stats.ownClose}</p>
        </div>
        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary-foreground/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-primary-foreground/80">Conversion</span>
          </div>
          <p className="text-3xl font-heading font-bold">{stats.conversionRate}%</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Follow-ups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Today's Follow-ups
              </h3>
            </div>
            <Badge variant="warning">{todayFollowups.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {todayFollowups.length > 0 ? (
              todayFollowups.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.businessType}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="text-accent">
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-success">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No follow-ups scheduled for today</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Call Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Phone className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Recent Call Logs
            </h3>
          </div>
          <div className="space-y-3">
            {callLogs.slice(0, 5).map((log, index) => {
              const lead = leads.find((l) => l.id === log.leadId);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-info/10 text-info mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{lead?.name || 'Unknown'}</p>
                      <span className="text-xs text-muted-foreground">{log.duration} min</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{log.notes}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{log.result}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.dateTime).toLocaleString('en-IN', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Leads Assigned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Assigned Leads
            </h3>
          </div>
          <span className="text-sm text-muted-foreground">{telecallerLeads.length} leads</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Lead</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Business</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Last Contact</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {telecallerLeads.slice(0, 5).map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.contactNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{lead.businessType}</td>
                  <td className="py-3">
                    <Badge variant={
                      lead.status === 'Own Close' ? 'success' :
                      lead.status === 'Own Loss' ? 'destructive' :
                      lead.status === 'Follow Up' ? 'warning' :
                      'secondary'
                    }>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {new Date(lead.lastContactDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="py-3">
                    <Button size="sm" variant="ghost" className="text-accent">
                      <PhoneCall className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
