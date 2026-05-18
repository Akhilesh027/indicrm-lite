import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import {
  Plus,
  FileBox,
  Trash2,
  Calendar,
  IndianRupee,
  Layers,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';

const API_URL = 'https://digitalness-backend.onrender.com/api';

export default function TemplatesPage() {
  const token = localStorage.getItem('token');

  const [templates, setTemplates] = useState<any[]>([]);

  const [open, setOpen] = useState(false);

  const [delivText, setDelivText] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    estimatedDays: 30,
    estimatedCost: 0,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  // FETCH
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (error) {
      console.log(error);
    }
  };

  // CREATE
  const handleSave = async () => {
    try {
      if (!form.name || !form.category) {
        toast.error('Name and category required');
        return;
      }

      const deliverables = delivText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((title) => ({
          title,
          category: form.category,
          days: 5,
        }));

      const res = await fetch(`${API_URL}/templates`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          ...form,
          defaultDeliverables: deliverables,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed');
        return;
      }

      toast.success('Template Created');

      setOpen(false);

      setForm({
        name: '',
        category: '',
        description: '',
        estimatedDays: 30,
        estimatedCost: 0,
      });

      setDelivText('');

      fetchTemplates();
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  // DELETE
  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      toast.success('Deleted');

      fetchTemplates();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <FileBox className="w-6 h-6" />
            Project Templates
          </h1>

          <p className="text-muted-foreground">
            Reusable project blueprints
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Create Template
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* NAME */}

              <div>
                <Label>Name</Label>

                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {/* CATEGORY */}

              <div>
                <Label>Category</Label>

                <Input
                  placeholder="Website Design"
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <Label>Description</Label>

                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {/* COST */}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Estimated Days</Label>

                  <Input
                    type="number"
                    value={form.estimatedDays}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedDays: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Estimated Cost</Label>

                  <Input
                    type="number"
                    value={form.estimatedCost}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedCost: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* DELIVERABLES */}

              <div>
                <Label>
                  Deliverables (one per line)
                </Label>

                <Textarea
                  rows={5}
                  value={delivText}
                  onChange={(e) =>
                    setDelivText(e.target.value)
                  }
                  placeholder={`Homepage Design
Admin Panel
SEO Setup`}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSave}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* TEMPLATE GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <motion.div
            key={t._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl bg-card border border-border shadow-card flex flex-col gap-3"
          >
            {/* TOP */}

            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant="secondary"
                  className="mb-2"
                >
                  {t.category}
                </Badge>

                <h3 className="font-heading font-semibold">
                  {t.name}
                </h3>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  deleteTemplate(t._id)
                }
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>

            {/* DESCRIPTION */}

            <p className="text-sm text-muted-foreground">
              {t.description}
            </p>

            {/* DETAILS */}

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />

                {t.estimatedDays} days
              </span>

              <span className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />

                ₹
                {Number(
                  t.estimatedCost || 0
                ).toLocaleString('en-IN')}
              </span>

              <span className="flex items-center gap-1">
                <Layers className="w-4 h-4" />

                {t.defaultDeliverables?.length || 0}
                {' '}
                items
              </span>
            </div>

            {/* DELIVERABLES */}

            <div className="border-t border-border pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Deliverables:
              </p>

              <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                {t.defaultDeliverables?.map(
                  (d: any, i: number) => (
                    <li key={i}>
                      • {d.title}
                    </li>
                  )
                )}
              </ul>
            </div>
          </motion.div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No templates found
          </div>
        )}
      </div>
    </div>
  );
}