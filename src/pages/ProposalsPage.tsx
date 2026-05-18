import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  MailCheck,
  FileText,
  IndianRupee,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

type ProposalStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

interface ProposalService {
  name: string;
  description?: string;
  price: number;
}

interface Proposal {
  _id?: string;
  id?: string;
  customerName: string;
  clientName?: string;
  contactNumber: string;
  clientEmail?: string;
  email?: string;
  businessType?: string;
  branchId?: string;
  title: string;
  proposalValue: number;
  services: ProposalService[];
  requirements?: string;
  notes?: string;
  mailSubject?: string;
  mailMessage?: string;
  status: ProposalStatus;
  mailSent?: boolean;
  sentAt?: string;
  createdAt?: string;
}

const blankForm = {
  customerName: "",
  contactNumber: "",
  clientEmail: "",
  businessType: "",
  branchId: "",
  title: "",
  proposalValue: "",
  requirements: "",
  notes: "",
  servicesText: "",
  mailSubject: "",
  mailMessage: "",
  status: "Draft" as ProposalStatus,
};

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

const getArrayData = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.proposals)) return data.proposals;
  return [];
};

const getItemId = (item: Proposal) => item._id || item.id || "";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const parseServices = (
  text: string,
  fallbackValue: number
): ProposalService[] => {
  if (!text.trim()) {
    return [
      {
        name: "Service Package",
        description: "Proposal service package",
        price: fallbackValue || 0,
      },
    ];
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());

      return {
        name: parts[0] || "Service",
        description: parts[1] || "",
        price: Number(parts[2]) || 0,
      };
    });
};

const servicesToText = (services: ProposalService[] = []) => {
  return services
    .map((s) => `${s.name || ""} | ${s.description || ""} | ${s.price || 0}`)
    .join("\n");
};

export default function ProposalsPage() {
  const { toast } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState("");

  const fetchProposals = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/proposals`, {
        method: "GET",
        ...getAuthConfig(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch proposals");
      }

      setProposals(getArrayData(data));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch proposals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      const q = search.toLowerCase();

      const matchesSearch =
        !q ||
        p.customerName?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.contactNumber?.toLowerCase().includes(q) ||
        p.clientEmail?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.businessType?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [proposals, search, statusFilter]);

  const resetForm = () => {
    setForm(blankForm);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (proposal: Proposal) => {
    setEditing(proposal);

    setForm({
      customerName: proposal.customerName || proposal.clientName || "",
      contactNumber: proposal.contactNumber || "",
      clientEmail: proposal.clientEmail || proposal.email || "",
      businessType: proposal.businessType || "",
      branchId: proposal.branchId || "",
      title: proposal.title || "",
      proposalValue: String(proposal.proposalValue || ""),
      requirements: proposal.requirements || "",
      notes: proposal.notes || "",
      servicesText: servicesToText(proposal.services),
      mailSubject:
        proposal.mailSubject ||
        `Proposal from Digitalness CRM - ${
          proposal.customerName || proposal.clientName || ""
        }`,
      mailMessage:
        proposal.mailMessage ||
        `Dear ${proposal.customerName || proposal.clientName || "Client"},

Please find your proposal details. Kindly review and confirm.

Regards,
Digitalness Team`,
      status: proposal.status || "Draft",
    });

    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (
        !form.customerName.trim() ||
        !form.contactNumber.trim() ||
        !form.title.trim()
      ) {
        toast({
          title: "Missing fields",
          description: "Client name, contact number and proposal title are required",
          variant: "destructive",
        });
        return;
      }

      if (form.clientEmail.trim() && !isValidEmail(form.clientEmail.trim())) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid client email",
          variant: "destructive",
        });
        return;
      }

      const proposalValue = Number(form.proposalValue) || 0;

      const payload = {
        customerName: form.customerName,
        clientName: form.customerName,
        contactNumber: form.contactNumber,
        clientEmail: form.clientEmail.trim(),
        email: form.clientEmail.trim(),
        businessType: form.businessType,
        branchId: form.branchId,
        title: form.title,
        proposalValue,
        requirements: form.requirements,
        notes: form.notes,
        services: parseServices(form.servicesText, proposalValue),
        mailSubject:
          form.mailSubject ||
          `Proposal from Digitalness CRM - ${form.customerName}`,
        mailMessage:
          form.mailMessage ||
          `Dear ${form.customerName},

Please find your proposal details. Kindly review and confirm.

Regards,
Digitalness Team`,
        status: form.status,
      };

      const proposalId = editing ? getItemId(editing) : "";
      const url = editing
        ? `${API_URL}/proposals/${proposalId}`
        : `${API_URL}/proposals`;

      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        ...getAuthConfig(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save proposal");
      }

      const savedProposal = data.data || data.proposal || data;

      if (editing) {
        setProposals((prev) =>
          prev.map((p) =>
            getItemId(p) === proposalId ? savedProposal : p
          )
        );
      } else {
        setProposals((prev) => [savedProposal, ...prev]);
      }

      toast({
        title: "Saved successfully",
        description: "Proposal data and requirements saved to backend",
      });

      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save proposal",
        variant: "destructive",
      });
    }
  };

  const handleSendMail = async (proposal: Proposal) => {
    try {
      const proposalId = getItemId(proposal);

      if (!proposalId) {
        toast({
          title: "Save proposal first",
          description: "Please save the proposal before sending mail.",
          variant: "destructive",
        });
        return;
      }

      let clientEmail = proposal.clientEmail || proposal.email || "";

      if (!clientEmail.trim()) {
        const enteredEmail = window.prompt(
          `Client email is missing for ${
            proposal.customerName || proposal.clientName || "this proposal"
          }.\n\nPlease enter client email:`
        );

        if (!enteredEmail || !enteredEmail.trim()) {
          toast({
            title: "Email required",
            description: "Client email is required to send proposal mail.",
            variant: "destructive",
          });
          return;
        }

        clientEmail = enteredEmail.trim();

        if (!isValidEmail(clientEmail)) {
          toast({
            title: "Invalid email",
            description: "Please enter a valid email address.",
            variant: "destructive",
          });
          return;
        }

        const updateRes = await fetch(`${API_URL}/proposals/${proposalId}`, {
          method: "PUT",
          ...getAuthConfig(),
          body: JSON.stringify({
            clientEmail,
            email: clientEmail,
          }),
        });

        const updateData = await updateRes.json();

        if (!updateRes.ok) {
          throw new Error(updateData.message || "Failed to save client email");
        }

        const updatedProposal =
          updateData.data || updateData.proposal || updateData;

        setProposals((prev) =>
          prev.map((p) =>
            getItemId(p) === proposalId ? updatedProposal : p
          )
        );

        proposal = updatedProposal;
      } else if (!isValidEmail(clientEmail.trim())) {
        toast({
          title: "Invalid email",
          description: "Saved client email is invalid. Please edit and correct it.",
          variant: "destructive",
        });
        return;
      }

      setSendingId(proposalId);

      const res = await fetch(`${API_URL}/proposals/${proposalId}/send-mail`, {
        method: "POST",
        ...getAuthConfig(),
        body: JSON.stringify({
          clientEmail,
          subject:
            proposal.mailSubject ||
            `Proposal from Digitalness CRM - ${
              proposal.customerName || proposal.clientName
            }`,
          message:
            proposal.mailMessage ||
            `Dear ${
              proposal.customerName || proposal.clientName || "Client"
            },

Please find your proposal details below.

Regards,
Digitalness Team`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send mail");
      }

      const updatedProposal = data.data || data.proposal || data;

      setProposals((prev) =>
        prev.map((p) =>
          getItemId(p) === proposalId ? updatedProposal : p
        )
      );

      toast({
        title: "Mail sent successfully",
        description: `Proposal sent to ${clientEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Mail failed",
        description: error.message || "Failed to send proposal mail",
        variant: "destructive",
      });
    } finally {
      setSendingId("");
    }
  };

  const handleDelete = async (proposal: Proposal) => {
    try {
      const proposalId = getItemId(proposal);

      const res = await fetch(`${API_URL}/proposals/${proposalId}`, {
        method: "DELETE",
        ...getAuthConfig(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete proposal");
      }

      setProposals((prev) =>
        prev.filter((p) => getItemId(p) !== proposalId)
      );

      toast({
        title: "Deleted",
        description: "Proposal deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete proposal",
        variant: "destructive",
      });
    }
  };

  const totalValue = proposals.reduce(
    (sum, p) => sum + Number(p.proposalValue || 0),
    0
  );

  const sentCount = proposals.filter(
    (p) => p.status === "Sent" || p.mailSent
  ).length;

  const acceptedCount = proposals.filter(
    (p) => p.status === "Accepted"
  ).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold">Proposals</h1>
          <p className="text-muted-foreground">
            Save proposal requirements first, then send proposal mail to client
          </p>
        </div>

        <Button variant="gradient" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Proposal
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <FileText className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Total Proposals</p>
          <p className="text-2xl font-bold">{proposals.length}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <IndianRupee className="w-5 h-5 text-success mb-2" />
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">
            ₹{totalValue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <MailCheck className="w-5 h-5 text-info mb-2" />
          <p className="text-sm text-muted-foreground">Sent</p>
          <p className="text-2xl font-bold text-info">{sentCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <MailCheck className="w-5 h-5 text-success mb-2" />
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold text-success">{acceptedCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <Input
            placeholder="Search proposal, client, email, business..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {loading && (
          <div className="p-6 rounded-xl border bg-card text-muted-foreground">
            Loading proposals...
          </div>
        )}

        {!loading &&
          filtered.map((proposal) => {
            const id = getItemId(proposal);
            const email = proposal.clientEmail || proposal.email;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-card border border-border shadow-card"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {proposal.title}
                      </h3>

                      <Badge
                        variant={
                          proposal.status === "Accepted"
                            ? "completed"
                            : "outline"
                        }
                      >
                        {proposal.status || "Draft"}
                      </Badge>

                      {proposal.mailSent && (
                        <Badge variant="info">Mail Sent</Badge>
                      )}

                      {!email && (
                        <Badge variant="destructive">Email Missing</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {proposal.customerName || proposal.clientName} •{" "}
                      {proposal.contactNumber} • {email || "No email"}
                    </p>

                    <p className="text-sm">
                      <b>Business:</b> {proposal.businessType || "-"}
                    </p>

                    <p className="text-sm">
                      <b>Requirements:</b> {proposal.requirements || "-"}
                    </p>

                    <p className="text-sm">
                      <b>Proposal Value:</b> ₹
                      {Number(proposal.proposalValue || 0).toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    {proposal.sentAt && (
                      <p className="text-xs text-muted-foreground">
                        Sent on:{" "}
                        {new Date(proposal.sentAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(proposal)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant={!email ? "default" : "outline"}
                      disabled={sendingId === id}
                      onClick={() => handleSendMail(proposal)}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      {sendingId === id
                        ? "Sending..."
                        : !email
                        ? "Add Email & Send"
                        : "Send Mail"}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(proposal)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-sm font-medium mb-2">Services</p>

                  <div className="grid md:grid-cols-2 gap-2">
                    {(proposal.services || []).map((service, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-muted/40 text-sm"
                      >
                        <p className="font-medium">{service.name}</p>
                        <p className="text-muted-foreground">
                          {service.description || "-"}
                        </p>
                        <p className="font-semibold">
                          ₹
                          {Number(service.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div className="p-8 rounded-xl border bg-card text-center text-muted-foreground">
            No proposals found
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Update Proposal" : "Create Proposal"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Client Name *"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />

            <Input
              placeholder="Contact Number *"
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
            />

            <Input
              placeholder="Client Email"
              value={form.clientEmail}
              onChange={(e) =>
                setForm({ ...form, clientEmail: e.target.value })
              }
            />

            <Input
              placeholder="Business Type"
              value={form.businessType}
              onChange={(e) =>
                setForm({ ...form, businessType: e.target.value })
              }
            />

            <Input
              placeholder="Branch ID"
              value={form.branchId}
              onChange={(e) =>
                setForm({ ...form, branchId: e.target.value })
              }
            />

            <Input
              placeholder="Proposal Title *"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <Input
              type="number"
              placeholder="Proposal Value"
              value={form.proposalValue}
              onChange={(e) =>
                setForm({ ...form, proposalValue: e.target.value })
              }
            />

            <Select
              value={form.status}
              onValueChange={(value: ProposalStatus) =>
                setForm({ ...form, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Proposal Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              className="md:col-span-2"
              placeholder="Client Requirements / Project Requirements"
              value={form.requirements}
              onChange={(e) =>
                setForm({ ...form, requirements: e.target.value })
              }
            />

            <Textarea
              className="md:col-span-2"
              placeholder={`Services - one per line:
Service Name | Description | Price`}
              value={form.servicesText}
              onChange={(e) =>
                setForm({ ...form, servicesText: e.target.value })
              }
            />

            <Textarea
              className="md:col-span-2"
              placeholder="Internal Notes"
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
            />

            <Input
              className="md:col-span-2"
              placeholder="Mail Subject"
              value={form.mailSubject}
              onChange={(e) =>
                setForm({ ...form, mailSubject: e.target.value })
              }
            />

            <Textarea
              className="md:col-span-2"
              placeholder="Mail Message"
              value={form.mailMessage}
              onChange={(e) =>
                setForm({ ...form, mailMessage: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button variant="gradient" onClick={handleSave}>
              Save Proposal Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}