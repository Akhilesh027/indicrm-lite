import { motion } from 'framer-motion';
import { useCRMStore } from '@/store/crmStore';
import { useTaskStore } from '@/store/taskStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Trophy, AlertTriangle, TrendingUp } from 'lucide-react';

interface Score {
  id: string; name: string; role: string;
  total: number; done: number; delayed: number;
  completionRate: number; delayRate: number;
  score: number; rank: number;
}

export default function PerformancePage() {
  const { employees } = useCRMStore();
  const { tasks } = useTaskStore();

  const scores: Score[] = employees.map((e) => {
    const ts = tasks.filter((t) => t.assignedTo === e.id);
    const total = ts.length;
    const done = ts.filter((t) => t.status === 'Completed').length;
    const delayed = ts.filter(
      (t) => t.status !== 'Completed' && new Date(t.deadline) < new Date(new Date().toDateString())
    ).length;
    const completionRate = total ? (done / total) * 100 : 0;
    const delayRate = total ? (delayed / total) * 100 : 0;
    // Composite: 70% completion, 30% on-time (inverse delay), bonus for volume
    const score = Math.round(
      completionRate * 0.6 + (100 - delayRate) * 0.3 + Math.min(total * 2, 10)
    );
    return {
      id: e.id, name: e.name, role: e.role,
      total, done, delayed, completionRate: Math.round(completionRate),
      delayRate: Math.round(delayRate), score, rank: 0,
    };
  })
  .sort((a, b) => b.score - a.score)
  .map((s, i) => ({ ...s, rank: i + 1 }));

  const top = scores.slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Performance Scoring</h1>
        <p className="text-muted-foreground">Auto-computed employee performance from tasks, on-time delivery & volume</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />Top Performer</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{scores[0]?.name || '—'}</p>
            <p className="text-xs text-muted-foreground">Score {scores[0]?.score}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" />Most Delays</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{[...scores].sort((a, b) => b.delayRate - a.delayRate)[0]?.name || '—'}</p>
            <p className="text-xs text-muted-foreground">{[...scores].sort((a, b) => b.delayRate - a.delayRate)[0]?.delayRate}% delayed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Avg Completion</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{Math.round(scores.reduce((a, b) => a + b.completionRate, 0) / (scores.length || 1))}%</p>
            <p className="text-xs text-muted-foreground">across all team</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top 5 Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={top}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Full Leaderboard</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {scores.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                #{s.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{s.name}</p>
                  <Badge variant="outline" className="text-xs">{s.role}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{s.done}/{s.total} done</span>
                  <span>{s.completionRate}% completion</span>
                  <span className={s.delayRate > 30 ? 'text-rose-500' : ''}>{s.delayRate}% delayed</span>
                </div>
                <Progress value={s.completionRate} className="h-1.5 mt-2" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{s.score}</p>
                <p className="text-xs text-muted-foreground">score</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
