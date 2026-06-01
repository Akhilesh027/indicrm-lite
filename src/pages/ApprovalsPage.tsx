import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  RefreshCcw,
  RotateCw,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

type ApprovalStatus =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Revision Requested";

type WorkStatus =
  | "Pending"
  | "Not Started"
  | "In Progress"
  | "Review"
  | "Completed"
  | "Revision"
  | "Failed";

type Approval = {
  _id?: string;
  id?: string;
  status?: ApprovalStatus;
  reviewMessage?: string;
  adminRemark?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedByName?: string;
  submittedBy?: any;
  customer?: any;
  work?: any;
  assignedTo?: any[];
  title?: string;
  entityType?: string;
};

const statusColor: Record<ApprovalStatus, string> = {
  "Pending Approval": "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
  "Revision Requested": "border-blue-200 bg-blue-50 text-blue-700",
};

const statusIcon: Record<ApprovalStatus, any> = {
  "Pending Approval": Clock,
  Approved: CheckCircle2,
  Rejected: XCircle,
  "Revision Requested": RotateCw,
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getAuthConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

const getArrayData = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.approvals)) return data.approvals;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getApprovalId = (approval: Approval) => approval._id || approval.id || "";

const getWorkId = (approval: Approval) =>
  approval.work?._id || approval.work?.id || approval.work || "";

const getWorkTitle = (approval: Approval) =>
  approval.work?.title || approval.title || "Work Approval";

const getWorkType = (approval: Approval) =>
  approval.work?.workType || approval.entityType || "Work";

const getWorkStatus = (approval: Approval): WorkStatus =>
  approval.work?.status || "Review";

const getSubmittedBy = (approval: Approval) =>
  approval.submittedBy?.name ||
  approval.submittedBy?.fullName ||
  approval.submittedBy?.username ||
  approval.submittedBy?.email ||
  approval.submittedByName ||
  "Employee";

const getCustomerName = (approval: Approval) =>
  approval.customer?.name ||
  approval.customer?.customerName ||
  approval.customer?.clientName ||
  approval.customer?.companyName ||
  approval.work?.customer?.name ||
  approval.work?.customer?.companyName ||
  "Customer";

const getAssignedNames = (approval: Approval) => {
  const assigned = approval.assignedTo || approval.work?.assignedTo || [];
  if (!Array.isArray(assigned) || assigned.length === 0) return "Unassigned";

  return assigned
    .map((employee: any) =>
      typeof employee === "string"
        ? employee
        : employee?.name ||
          employee?.fullName ||
          employee?.username ||
          employee?.email ||
          "Employee"
    )
    .join(", ");
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ApprovalStatus>(
    "All"
  );

  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [notesDialog, setNotesDialog] = useState<{
    id: string;
    action: "Revision Requested" | "Rejected";
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const fetchApprovals = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/work-approvals`, getAuthConfig());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch approvals");
      }

      setApprovals(getArrayData(data));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const reviewApproval = async (
    id: string,
    status: ApprovalStatus,
    adminRemark = ""
  ) => {
    try {
      setActionLoading(`${id}-${status}`);

      const res = await fetch(`${API_URL}/work-approvals/${id}/review`, {
        method: "PUT",
        ...getAuthConfig(),
        body: JSON.stringify({
          status,
          adminRemark,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update approval");
      }

      toast.success(
        status === "Approved"
          ? "Work approved successfully"
          : status === "Rejected"
          ? "Work rejected"
          : "Revision requested"
      );

      setNotesDialog(null);
      setReviewNote("");
      setSelectedApproval(null);
      await fetchApprovals();
    } catch (error: any) {
      toast.error(error.message || "Failed to update approval");
    } finally {
      setActionLoading(null);
    }
  };

  const updateWorkStatusFallback = async (
    approval: Approval,
    workStatus: WorkStatus,
    note = ""
  ) => {
    const workId = getWorkId(approval);
    if (!workId) return;

    await fetch(`${API_URL}/works/${workId}/status`, {
      method: "PUT",
      ...getAuthConfig(),
      body: JSON.stringify({
        status: workStatus,
        managerReviewNote: note,
      }),
    });
  };

  const handleApprove = async (approval: Approval) => {
    const id = getApprovalId(approval);
    await reviewApproval(id, "Approved", "Approved by manager/admin");
  };

  const handleNotesAction = async () => {
    if (!notesDialog) return;

    await reviewApproval(notesDialog.id, notesDialog.action, reviewNote);
  };

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const keyword = search.toLowerCase();
      const matchesSearch =
        getWorkTitle(approval).toLowerCase().includes(keyword) ||
        getCustomerName(approval).toLowerCase().includes(keyword) ||
        getSubmittedBy(approval).toLowerCase().includes(keyword) ||
        getWorkType(approval).toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All" || approval.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [approvals, search, statusFilter]);

  const groups: Record<string, Approval[]> = {
    All: filteredApprovals,
    "Pending Approval": filteredApprovals.filter(
      (item) => item.status === "Pending Approval"
    ),
    "Revision Requested": filteredApprovals.filter(
      (item) => item.status === "Revision Requested"
    ),
    Approved: filteredApprovals.filter((item) => item.status === "Approved"),
    Rejected: filteredApprovals.filter((item) => item.status === "Rejected"),
  };

  const stats = {
    total: approvals.length,
    pending: approvals.filter((item) => item.status === "Pending Approval").length,
    approved: approvals.filter((item) => item.status === "Approved").length,
    revision: approvals.filter((item) => item.status === "Revision Requested")
      .length,
    rejected: approvals.filter((item) => item.status === "Rejected").length,
  };

  const ApprovalCard = ({ approval }: { approval: Approval }) => {
    const id = getApprovalId(approval);
    const status = (approval.status || "Pending Approval") as ApprovalStatus;
    const Icon = statusIcon[status] || Clock;
    const work = approval.work || {};

    return (
      <Card className="overflow-hidden border-slate-200 shadow-sm transition hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${statusColor[status]} border`}>
                  <Icon className="mr-1 h-3.5 w-3.5" />
                  {status}
                </Badge>
                <Badge variant="outline">{getWorkType(approval)}</Badge>
                {work.priority && (
                  <Badge
                    variant={work.priority === "Urgent" ? "destructive" : "secondary"}
                  >
                    {work.priority}
                  </Badge>
                )}
              </div>

              <CardTitle className="text-lg leading-tight text-slate-950">
                {getWorkTitle(approval)}
              </CardTitle>

              <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" /> {getSubmittedBy(approval)}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> {getAssignedNames(approval)}
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {getCustomerName(approval)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {formatDate(approval.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApproval(approval)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>

              {status === "Pending Approval" && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={actionLoading === `${id}-Approved`}
                    onClick={() => handleApprove(approval)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setReviewNote("");
                      setNotesDialog({ id, action: "Revision Requested" });
                    }}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Revision
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      setReviewNote("");
                      setNotesDialog({ id, action: "Rejected" });
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {approval.reviewMessage && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Employee Submission Note
              </p>
              <p className="text-sm text-slate-700">{approval.reviewMessage}</p>
            </div>
          )}

          {approval.adminRemark && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                Review Note
              </p>
              <p className="text-sm text-blue-800">{approval.adminRemark}</p>
            </div>
          )}

          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-slate-500">Work Status</p>
              <p className="font-semibold text-slate-900">{getWorkStatus(approval)}</p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-slate-500">Due Date</p>
              <p className="font-semibold text-slate-900">
                {formatDate(work.dueDate)}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-slate-500">Progress</p>
              <p className="font-semibold text-slate-900">
                {work.completedDeliverables || 0}/{work.deliverables || 1} Deliverables
              </p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-slate-500">Time Spent</p>
              <p className="font-semibold text-slate-900">
                {Number(work.timeSpent || 0)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-3 sm:p-4 lg:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Work Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review submitted works, approve completed tasks, request revisions, or reject failed submissions.
          </p>
        </div>

        <Button variant="outline" onClick={fetchApprovals} disabled={loading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Revision</p>
            <p className="text-2xl font-bold text-blue-600">{stats.revision}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by work, customer, employee or work type..."
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Revision Requested">Revision Requested</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="space-y-3 p-5">
                <div className="h-5 w-1/3 rounded bg-slate-200" />
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-20 rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="Pending Approval" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            {Object.keys(groups).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-full border bg-white px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
              >
                {key} ({groups[key].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groups).map(([key, list]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              {list.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                    <AlertTriangle className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="font-semibold text-slate-800">No approvals found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      There are no {key.toLowerCase()} approval records right now.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                list.map((approval) => (
                  <ApprovalCard key={getApprovalId(approval)} approval={approval} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Approval Details</DialogTitle>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <h3 className="text-lg font-bold text-slate-950">
                  {getWorkTitle(selectedApproval)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {getWorkType(selectedApproval)} · {getCustomerName(selectedApproval)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Submitted By" value={getSubmittedBy(selectedApproval)} />
                <Info label="Assigned To" value={getAssignedNames(selectedApproval)} />
                <Info label="Approval Status" value={selectedApproval.status || "Pending Approval"} />
                <Info label="Work Status" value={getWorkStatus(selectedApproval)} />
                <Info label="Submitted Date" value={formatDateTime(selectedApproval.createdAt)} />
                <Info label="Due Date" value={formatDate(selectedApproval.work?.dueDate)} />
              </div>

              {selectedApproval.work?.description && (
                <Section title="Work Description" value={selectedApproval.work.description} />
              )}

              {selectedApproval.reviewMessage && (
                <Section title="Employee Submission Note" value={selectedApproval.reviewMessage} />
              )}

              {selectedApproval.adminRemark && (
                <Section title="Manager/Admin Review Note" value={selectedApproval.adminRemark} />
              )}

              {Array.isArray(selectedApproval.work?.attachments) &&
                selectedApproval.work.attachments.length > 0 && (
                  <div className="rounded-2xl border p-4">
                    <h4 className="mb-3 font-semibold">Attachments</h4>
                    <div className="space-y-2">
                      {selectedApproval.work.attachments.map((file: any, index: number) => (
                        <a
                          key={index}
                          href={file.fileUrl || file}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl border bg-white p-3 text-sm text-blue-700 hover:bg-blue-50"
                        >
                          {file.fileName || String(file).split("/").pop() || `Attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!notesDialog} onOpenChange={() => setNotesDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {notesDialog?.action === "Rejected" ? "Reject Work" : "Request Revision"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              rows={5}
              placeholder={
                notesDialog?.action === "Rejected"
                  ? "Enter rejection reason..."
                  : "Enter revision instructions..."
              }
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setNotesDialog(null)}>
                Cancel
              </Button>
              <Button
                variant={notesDialog?.action === "Rejected" ? "destructive" : "default"}
                onClick={handleNotesAction}
                disabled={!reviewNote.trim() || !!actionLoading}
              >
                {notesDialog?.action === "Rejected" ? (
                  <XCircle className="mr-2 h-4 w-4" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}

function Section({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h4 className="mb-2 font-semibold text-slate-900">{title}</h4>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
