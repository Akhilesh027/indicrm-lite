import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileBox, Trash2, Calendar, IndianRupee, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTemplateStore } from '@/store/templateStore';
import { ProjectTemplate } from '@/data/dummyData';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const { templates, addTemplate, deleteTemplate } = useTemplateStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ProjectTemplate>>({ defaultDeliverables: [] });
  const [delivText, setDelivText] = useState('');

  const handleSave = () => {
    if (!form.name || !form.category) {
      toast.error('Name and category required');
      return;
    }
    const items = delivText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((title) => ({ title, category: form.category!, days: 5 }));
    addTemplate({
      id: `TPL${Date.now()}`,
      name: form.name!,
      category: form.category!,
      description: form.description || '',
      defaultDeliverables: items.length ? items : (form.defaultDeliverables || []),
      estimatedDays: Number(form.estimatedDays) || 30,
      estimatedCost: Number(form.estimatedCost) || 0,
    });
    toast.success('Template created');
    setOpen(false);
    setForm({ defaultDeliverables: [] });
    setDelivText('');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2"><FileBox className="w-6 h-6" /> Project Templates</h1>
          <p className="text-muted-foreground">Reusable project blueprints with default deliverables</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient"><Plus className="w-4 h-4 mr-2" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Category</Label><Input placeholder="e.g., Website Design" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Estimated Days</Label><Input type="number" value={form.estimatedDays || ''} onChange={(e) => setForm({ ...form, estimatedDays: Number(e.target.value) })} /></div>
                <div><Label>Estimated Cost (₹)</Label><Input type="number" value={form.estimatedCost || ''} onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Default Deliverables (one per line)</Label>
                <Textarea rows={5} value={delivText} onChange={(e) => setDelivText(e.target.value)} placeholder="Wireframes &#10;Homepage Design&#10;..." />
              </div>
            </div>
            <DialogFooter><Button onClick={handleSave}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-card border border-border shadow-card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">{t.category}</Badge>
                <h3 className="font-heading font-semibold">{t.name}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { deleteTemplate(t.id); toast.success('Deleted'); }}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {t.estimatedDays} days</span>
              <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> {t.estimatedCost.toLocaleString('en-IN')}</span>
              <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> {t.defaultDeliverables.length} items</span>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Deliverables:</p>
              <ul className="text-xs space-y-0.5 max-h-24 overflow-y-auto">
                {t.defaultDeliverables.map((d, i) => <li key={i}>• {d.title}</li>)}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
