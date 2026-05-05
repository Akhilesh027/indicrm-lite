import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  FileText,
  Download,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  IndianRupee,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProposalStore } from "@/store/proposalStore";
import { useCRMStore } from "@/store/crmStore";
import { useDealStore } from "@/store/dealStore";
import { Proposal, ProposalService, ProposalStatus } from "@/data/proposalData";
import { generateProposalPDF } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

const statusMeta: Record<ProposalStatus, { color: string; icon: any }> = {
  Draft: { color: "bg-muted text-muted-foreground", icon: Clock },
  Sent: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Send },
  Viewed: { color: "bg-violet-500/10 text-violet-600 border-violet-500/30", icon: Eye },
  Accepted: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle },
  Rejected: { color: "bg-rose-500/10 text-rose-600 border-rose-500/30", icon: XCircle },
};

const statuses: ProposalStatus[] = ["Draft", "Sent", "Viewed", "Accepted", "Rejected"];

const emptyService = (): ProposalService => ({
  id: `PS${Date.now()}${Math.floor(Math.random() * 1000)}`,
  name: "",
  description: "",
  price: 0,
});

export default function ProposalsPage() {
  const { proposals, addProposal, updateProposal, deleteProposal, setStatus } =
    useProposalStore();

  const { leads } = useCRMStore();
  const { deals, moveDealStage } = useDealStore();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const blank = (): Omit<Proposal, "id"> => ({
    proposalNumber: `PR-${new Date().getFullYear()}-${String(
      proposals.length + 1
    ).padStart(3, "0")}`,
    clientName: "",
    clientContact: "",
    leadId: undefined,
    dealId: undefined,
    services: [emptyService()],
    totalPrice: 0,
    durationDays: 30,
    timeline: "30 Days",
    scopeOfWork: "",
    includedPoints: [""],
    excludedPoints: [""],
    deliverables: [""],
    status: "Draft",
    createdOn: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 14 * 86400000)
      .toISOString()
      .split("T")[0],
    notes: "",
  });

  const [form, setForm] = useState<Omit<Proposal, "id">>(blank());

  const visible = useMemo(
    () =>
      proposals.filter((p) => {
        const matchSearch =
          !search ||
          p.clientName.toLowerCase().includes(search.toLowerCase()) ||
          p.proposalNumber.toLowerCase().includes(search.toLowerCase());

        const matchStatus = statusFilter === "All" || p.status === statusFilter;

        return matchSearch && matchStatus;
      }),
    [proposals, search, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: proposals.length,
      accepted: proposals.filter((p) => p.status === "Accepted").length,
      pending: proposals.filter((p) => ["Sent", "Viewed"].includes(p.status))
        .length,
      value: proposals.reduce((sum, p) => sum + p.totalPrice, 0),
    }),
    [proposals]
  );

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  const openCreate = () => {
    setEditing(null);
    setForm(blank());
    setShowForm(true);
  };

  const openEdit = (p: Proposal) => {
    setEditing(p);
    setForm({
      ...p,
      timeline: p.timeline || `${p.durationDays} Days`,
      scopeOfWork: p.scopeOfWork || "",
      includedPoints: p.includedPoints?.length ? p.includedPoints : [""],
      excludedPoints: p.excludedPoints?.length ? p.excludedPoints : [""],
      deliverables: p.deliverables?.length ? p.deliverables : [""],
    });
    setShowForm(true);
  };

  const updateService = (index: number, patch: Partial<ProposalService>) => {
    const services = form.services.map((service, i) =>
      i === index ? { ...service, ...patch } : service
    );

    setForm({
      ...form,
      services,
      totalPrice: services.reduce((sum, service) => sum + (service.price || 0), 0),
    });
  };

  const addService = () => {
    setForm({ ...form, services: [...form.services, emptyService()] });
  };

  const removeService = (index: number) => {
    const services = form.services.filter((_, i) => i !== index);

    setForm({
      ...form,
      services,
      totalPrice: services.reduce((sum, service) => sum + (service.price || 0), 0),
    });
  };

  const updateListItem = (
    field: "deliverables" | "includedPoints" | "excludedPoints",
    index: number,
    value: string
  ) => {
    setForm({
      ...form,
      [field]: form[field].map((item, i) => (i === index ? value : item)),
    });
  };

  const addListItem = (
    field: "deliverables" | "includedPoints" | "excludedPoints"
  ) => {
    setForm({
      ...form,
      [field]: [...form[field], ""],
    });
  };

  const removeListItem = (
    field: "deliverables" | "includedPoints" | "excludedPoints",
    index: number
  ) => {
    setForm({
      ...form,
      [field]: form[field].filter((_, i) => i !== index),
    });
  };

  const cleanArray = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean);

  const handleSave = () => {
    if (!form.clientName || !form.clientContact || form.services.length === 0) {
      toast({
        title: "Missing fields",
        description: "Client, contact and at least one service are required",
        variant: "destructive",
      });
      return;
    }

    const cleaned = {
      ...form,
      deliverables: cleanArray(form.deliverables),
      includedPoints: cleanArray(form.includedPoints),
      excludedPoints: cleanArray(form.excludedPoints),
      services: form.services.filter((service) => service.name.trim()),
    };

    if (editing) {
      updateProposal(editing.id, cleaned);
      toast({
        title: "Proposal updated",
        description: cleaned.proposalNumber,
      });
    } else {
      addProposal({
        id: `PROP${Date.now()}`,
        ...cleaned,
      });

      toast({
        title: "Proposal created",
        description: cleaned.proposalNumber,
      });
    }

    setShowForm(false);
  };

  const handleStatus = (proposal: Proposal, newStatus: ProposalStatus) => {
    setStatus(proposal.id, newStatus);

    toast({
      title: `Marked ${newStatus}`,
      description: proposal.proposalNumber,
    });

    if (newStatus === "Accepted" && proposal.dealId) {
      const deal = deals.find((item) => item.id === proposal.dealId);

      if (deal && deal.stage !== "Won" && deal.stage !== "Negotiation") {
        moveDealStage(proposal.dealId, "Negotiation");

        toast({
          title: "Deal advanced",
          description: "Linked deal moved to Negotiation",
        });
      }
    }
  };

  const handleDownload = (proposal: Proposal) => {
    const doc = generateProposalPDF(proposal);
    doc.save(`${proposal.proposalNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Proposals
          </h1>
          <p className="text-muted-foreground">
            Send, track, and convert proposals into deals
          </p>
        </div>

        <Button variant="gradient" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Proposal
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Proposals</p>
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">
            {stats.accepted}
          </p>
          <p className="text-sm text-muted-foreground">Accepted</p>
        </div>

        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">
            {stats.pending}
          </p>
          <p className="text-sm text-muted-foreground">Awaiting Response</p>
        </div>

        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-xl font-heading font-bold text-primary">
            ₹{fmt(stats.value)}
          </p>
          <p className="text-sm text-muted-foreground">Total Quoted</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or proposal number..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {visible.map((proposal, index) => {
          const MetaIcon = statusMeta[proposal.status].icon;

          return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground line-clamp-1">
                    {proposal.clientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {proposal.proposalNumber}
                  </p>
                </div>

                <Badge className={statusMeta[proposal.status].color} variant="outline">
                  <MetaIcon className="w-3 h-3 mr-1" />
                  {proposal.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quotation</span>
                  <span className="font-bold text-primary flex items-center">
                    <IndianRupee className="w-3 h-3" />
                    {fmt(proposal.totalPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Services: {proposal.services.length}</span>
                  <span>
                    Valid:{" "}
                    {new Date(proposal.validUntil).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(proposal)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(proposal)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete ${proposal.proposalNumber}?`)) {
                      deleteProposal(proposal.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>

              {proposal.status !== "Accepted" && proposal.status !== "Rejected" && (
                <div className="flex gap-1 mt-2">
                  {proposal.status === "Draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleStatus(proposal, "Sent")}
                    >
                      Send
                    </Button>
                  )}

                  {(proposal.status === "Sent" || proposal.status === "Viewed") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-success"
                        onClick={() => handleStatus(proposal, "Accepted")}
                      >
                        Accept
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive"
                        onClick={() => handleStatus(proposal, "Rejected")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {visible.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No proposals match your filters.</p>
          </div>
        )}
      </motion.div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Proposal" : "New Proposal"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Proposal #
                </label>
                <Input
                  value={form.proposalNumber}
                  onChange={(event) =>
                    setForm({ ...form, proposalNumber: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Linked Lead
                </label>
                <Select
                  value={form.leadId || ""}
                  onValueChange={(value) => {
                    const lead = leads.find((item) => item.id === value);

                    setForm({
                      ...form,
                      leadId: value,
                      clientName: lead?.name || form.clientName,
                      clientContact: lead?.contactNumber || form.clientContact,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>

                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Client Name *
                </label>
                <Input
                  value={form.clientName}
                  onChange={(event) =>
                    setForm({ ...form, clientName: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Client Contact *
                </label>
                <Input
                  value={form.clientContact}
                  onChange={(event) =>
                    setForm({ ...form, clientContact: event.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Scope of Work
              </label>
              <Textarea
                rows={3}
                placeholder="Describe full scope of work..."
                value={form.scopeOfWork}
                onChange={(event) =>
                  setForm({ ...form, scopeOfWork: event.target.value })
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Quotation / Services
                </label>
                <Button size="sm" variant="outline" onClick={addService}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Service
                </Button>
              </div>

              <div className="space-y-2">
                {form.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg bg-muted/30"
                  >
                    <Input
                      className="col-span-12 md:col-span-3"
                      placeholder="Service"
                      value={service.name}
                      onChange={(event) =>
                        updateService(index, { name: event.target.value })
                      }
                    />

                    <Input
                      className="col-span-12 md:col-span-6"
                      placeholder="Description"
                      value={service.description}
                      onChange={(event) =>
                        updateService(index, { description: event.target.value })
                      }
                    />

                    <Input
                      className="col-span-10 md:col-span-2"
                      type="number"
                      placeholder="Price"
                      value={service.price || ""}
                      onChange={(event) =>
                        updateService(index, {
                          price: Number(event.target.value),
                        })
                      }
                    />

                    <Button
                      className="col-span-2 md:col-span-1"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeService(index)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-right mt-2 text-sm font-bold text-primary">
                Total Quotation: ₹{fmt(form.totalPrice)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Duration Days
                </label>
                <Input
                  type="number"
                  value={form.durationDays}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      durationDays: Number(event.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Timeline
                </label>
                <Input
                  placeholder="Example: 30 Days"
                  value={form.timeline}
                  onChange={(event) =>
                    setForm({ ...form, timeline: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Valid Until
                </label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(event) =>
                    setForm({ ...form, validUntil: event.target.value })
                  }
                />
              </div>
            </div>

            <ListEditor
              title="Deliverables"
              items={form.deliverables}
              placeholder="Example: 12 creatives per month"
              onAdd={() => addListItem("deliverables")}
              onUpdate={(index, value) =>
                updateListItem("deliverables", index, value)
              }
              onRemove={(index) => removeListItem("deliverables", index)}
            />

            <ListEditor
              title="Included Points / Benefits"
              items={form.includedPoints}
              placeholder="Example: Monthly performance report included"
              onAdd={() => addListItem("includedPoints")}
              onUpdate={(index, value) =>
                updateListItem("includedPoints", index, value)
              }
              onRemove={(index) => removeListItem("includedPoints", index)}
            />

            <ListEditor
              title="Not Included / Exclusions"
              items={form.excludedPoints}
              placeholder="Example: Ad budget not included"
              onAdd={() => addListItem("excludedPoints")}
              onUpdate={(index, value) =>
                updateListItem("excludedPoints", index, value)
              }
              onRemove={(index) => removeListItem("excludedPoints", index)}
            />

            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as ProposalStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>

              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleSave}
              >
                {editing ? "Save Changes" : "Create Proposal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposal(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedProposal && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProposal.proposalNumber}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedProposal.clientName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedProposal.clientContact}
                  </p>
                </div>

                <Section title="Scope of Work">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedProposal.scopeOfWork || "No scope added"}
                  </p>
                </Section>

                <Section title="Quotation">
                  <div className="space-y-2">
                    {selectedProposal.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between gap-4 border-b border-border pb-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                        <p className="font-bold">₹{fmt(service.price)}</p>
                      </div>
                    ))}

                    <p className="text-right font-bold text-primary">
                      Total: ₹{fmt(selectedProposal.totalPrice)}
                    </p>
                  </div>
                </Section>

                <Section title="Timeline">
                  <p className="text-sm text-muted-foreground">
                    {selectedProposal.timeline || `${selectedProposal.durationDays} Days`}
                  </p>
                </Section>

                <BulletSection title="Deliverables" items={selectedProposal.deliverables} />
                <BulletSection title="Included Points" items={selectedProposal.includedPoints} />
                <BulletSection title="Not Included / Exclusions" items={selectedProposal.excludedPoints} />

                {selectedProposal.notes && (
                  <Section title="Notes">
                    <p className="text-sm text-muted-foreground">
                      {selectedProposal.notes}
                    </p>
                  </Section>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListEditor({
  title,
  items,
  placeholder,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  items: string[];
  placeholder: string;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{title}</label>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(event) => onUpdate(index, event.target.value)}
              placeholder={placeholder}
            />

            <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

function BulletSection({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <Section title={title}>
      {items && items.length > 0 ? (
        <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No items added</p>
      )}
    </Section>
  );
}