import { motion } from 'framer-motion';
import { useCRMStore } from '@/store/crmStore';
import { useTaskStore } from '@/store/taskStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useExpenseStore } from '@/store/expenseStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, FileText, Calendar } from 'lucide-react';
import { generateMonthlyClientReportPDF, generateAgencyMonthlyPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

export default function AutoReportsPage() {
  const { customers } = useCRMStore();
  const { tasks } = useTaskStore();
  const { invoices } = useInvoiceStore();
  const { expenses } = useExpenseStore();

  const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const downloadClient = (cId: string) => {
    const c = customers.find((x) => x.id === cId);
    if (!c) return;
    const ctasks = tasks.filter((t) => t.customerId === cId);
    const cinvoices = invoices.filter((i) => i.customerId === cId);
    generateMonthlyClientReportPDF(c.name, month, ctasks, cinvoices)
      .save(`${c.name.replace(/\s+/g, '_')}_${month.replace(' ', '_')}.pdf`);
    toast.success('Report downloaded');
  };

  const downloadAgency = () => {
    generateAgencyMonthlyPDF(month, {
      revenue: invoices.reduce((s, i) => s + i.paidAmount, 0),
      expenses: expenses.reduce((s, e) => s + e.amount, 0),
      tasksDone: tasks.filter((t) => t.status === 'Completed').length,
      tasksTotal: tasks.length,
      activeClients: customers.length,
    }).save(`Digitalness_Agency_${month.replace(' ', '_')}.pdf`);
    toast.success('Agency report downloaded');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Automated Reports</h1>
        <p className="text-muted-foreground">One-click monthly PDF reports — clients & agency-wide</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Period: {month}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadAgency} size="lg">
            <FileDown className="w-4 h-4 mr-2" />Download Agency Monthly P&amp;L Report
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Per-Client Reports</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {customers.map((c) => {
            const ctasks = tasks.filter((t) => t.customerId === c.id);
            const done = ctasks.filter((t) => t.status === 'Completed').length;
            return (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <p className="font-medium">{c.name}</p>
                    <Badge variant="outline">{done}/{ctasks.length} tasks done</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.businessType} · {c.city}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadClient(c.id)}>
                  <FileDown className="w-4 h-4 mr-2" />PDF
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
