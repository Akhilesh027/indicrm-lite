import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useExpenseStore, ExpenseCategory } from '@/store/expenseStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];
const CATEGORIES: ExpenseCategory[] = ['Ad Spend', 'Tools/Software', 'Freelancer', 'Travel', 'Office', 'Salary', 'Misc'];

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useExpenseStore();
  const { invoices } = useInvoiceStore();
  const { customers } = useCRMStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Ad Spend' as ExpenseCategory,
    amount: 0, description: '', customerId: 'none', paidTo: '',
  });

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRev = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const profit = totalRev - totalExp;
  const margin = totalRev ? Math.round((profit / totalRev) * 100) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const perCustomer = useMemo(() => {
    return customers.map((c) => {
      const exp = expenses.filter((e) => e.customerId === c.id).reduce((s, e) => s + e.amount, 0);
      const rev = invoices.filter((i) => i.customerId === c.id).reduce((s, i) => s + i.paidAmount, 0);
      return { name: c.name, expense: exp, revenue: rev, profit: rev - exp };
    }).filter((x) => x.expense > 0 || x.revenue > 0);
  }, [customers, expenses, invoices]);

  const handleSubmit = () => {
    if (!form.amount || !form.description) {
      toast.error('Amount and description required');
      return;
    }
    addExpense({
      id: `EXP${Date.now()}`,
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
      customerId: form.customerId !== 'none' ? form.customerId : undefined,
      paidTo: form.paidTo || undefined,
      createdAt: new Date().toISOString(),
    });
    toast.success('Expense added');
    setOpen(false);
    setForm({ ...form, amount: 0, description: '', paidTo: '' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Expenses & Profit</h1>
          <p className="text-muted-foreground">Track outflows, attribute to clients, see real margins</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Amount (₹)" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="Paid To" value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} />
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="Attribute to customer (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No customer —</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleSubmit}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-2xl font-bold flex items-center"><IndianRupee className="w-5 h-5" />{totalRev.toLocaleString('en-IN')}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-2xl font-bold flex items-center text-rose-500"><IndianRupee className="w-5 h-5" />{totalExp.toLocaleString('en-IN')}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Profit</p><p className={`text-2xl font-bold flex items-center ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{profit >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}₹{profit.toLocaleString('en-IN')}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Margin</p><p className="text-2xl font-bold">{margin}%</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Spend by Category</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${v.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Per Client P&amp;L</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={perCustomer}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: any) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  <Bar dataKey="expense" fill="#ef4444" />
                  <Bar dataKey="profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Expenses</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Category</TableHead>
                <TableHead>Description</TableHead><TableHead>Customer</TableHead>
                <TableHead>Paid To</TableHead><TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.date}</TableCell>
                  <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{customers.find((c) => c.id === e.customerId)?.name || '—'}</TableCell>
                  <TableCell className="text-xs">{e.paidTo || '—'}</TableCell>
                  <TableCell className="text-right font-medium">₹{e.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => { deleteExpense(e.id); toast.success('Deleted'); }}>×</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
