import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

type ApprovalStatus =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Revision Requested";

const statusColor: Record<ApprovalStatus, string> = {
  "Pending Approval": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  "Revision Requested": "bg-blue-500/15 text-blue-600 border-blue-500/30",
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
  if (Array.isArray(data?.approvals)) return data.approvals;
  return [];
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [revOpen, setRevOpen] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [revNotes, setRevNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

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

  const getApprovalId = (approval: any) => approval._id || approval.id;

  const reviewApproval = async (
    id: string,
    status: ApprovalStatus,
    adminRemark = ""
  ) => {
    try {
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

      const updated = data.data || data.approval || data;

      setApprovals((prev) =>
        prev.map((approval) =>
          String(getApprovalId(approval)) === String(getApprovalId(updated))
            ? updated
            : approval
        )
      );

      toast.success(
        status === "Approved"
          ? "Work approved"
          : status === "Rejected"
          ? "Work rejected"
          : "Revision requested"
      );

      setRevOpen(null);
      setRejectOpen(null);
      setRevNotes("");
      setRejectNotes("");
      fetchApprovals();
    } catch (error: any) {
      toast.error(error.message || "Failed to update approval");
    }
  };

  const groups: Record<string, any[]> = {
    All: approvals,
    "Pending Approval": approvals.filter(
      (a) => a.status === "Pending Approval"
    ),
    "Revision Requested": approvals.filter(
      (a) => a.status === "Revision Requested"
    ),
    Approved: approvals.filter((a) => a.status === "Approved"),
    Rejected: approvals.filter((a) => a.status === "Rejected"),
  };

  const handleRevision = () => {
    if (!revOpen) return;

    reviewApproval(revOpen, "Revision Requested", revNotes);
  };

  const handleReject = () => {
    if (!rejectOpen) return;

    reviewApproval(rejectOpen, "Rejected", rejectNotes);
  };

  const getWorkTitle = (approval: any) =>
    approval.work?.title || approval.title || "Work Approval";

  const getEntityType = (approval: any) =>
    approval.work?.workType || approval.entityType || "Work";

  const getSubmittedBy = (approval: any) =>
    approval.submittedBy?.name ||
    approval.submittedBy?.email ||
    approval.submittedByName ||
    "Employee";

  const getCustomerName = (approval: any) =>
    approval.customer?.name ||
    approval.customer?.customerName ||
    approval.customer?.clientName ||
    approval.customer?.companyName ||
    approval.work?.customer?.name ||
    "Customer";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">
            Approvals & Revisions
          </h1>
          <p className="text-muted-foreground">
            Track submitted works, admin approvals and revision history
          </p>
        </div>

        <Button variant="outline" onClick={fetchApprovals}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading approvals...</p>
      )}

      <Tabs defaultValue="Pending Approval">
        <TabsList className="flex flex-wrap h-auto">
          {Object.keys(groups).map((key) => (
            <TabsTrigger key={key} value={key}>
              {key} ({groups[key].length})
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groups).map(([key, list]) => (
          <TabsContent key={key} value={key} className="space-y-3">
            {list.length === 0 && (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Nothing here.
              </p>
            )}

            {list.map((approval) => {
              const id = getApprovalId(approval);
              const status = approval.status as ApprovalStatus;

              return (
                <Card key={id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="text-base">
                          {getWorkTitle(approval)}
                        </CardTitle>

                        <p className="text-xs text-muted-foreground mt-1">
                          {getEntityType(approval)} · submitted by{" "}
                          {getSubmittedBy(approval)} ·{" "}
                          {approval.createdAt
                            ? new Date(approval.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : ""}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                          Customer: {getCustomerName(approval)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={statusColor[status]} variant="outline">
                          {status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {approval.reviewMessage && (
                      <div className="text-sm bg-muted/50 p-3 rounded mb-3">
                        <span className="font-medium">Review message: </span>
                        {approval.reviewMessage}
                      </div>
                    )}

                    {approval.adminRemark && (
                      <div className="text-sm bg-muted/50 p-3 rounded mb-3">
                        <span className="font-medium">Admin remark: </span>
                        {approval.adminRemark}
                      </div>
                    )}

                    {status === "Pending Approval" ? (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => reviewApproval(id, "Approved")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRevOpen(id)}
                        >
                          <RotateCw className="w-4 h-4 mr-2" />
                          Request Revision
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectOpen(id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Decided{" "}
                        {approval.reviewedAt
                          ? new Date(approval.reviewedAt).toLocaleString(
                              "en-IN"
                            )
                          : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!revOpen} onOpenChange={(open) => !open && setRevOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>

          <Textarea
            rows={4}
            placeholder="What needs to change?"
            value={revNotes}
            onChange={(e) => setRevNotes(e.target.value)}
          />

          <Button onClick={handleRevision}>Send Back for Revision</Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectOpen}
        onOpenChange={(open) => !open && setRejectOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Work</DialogTitle>
          </DialogHeader>

          <Textarea
            rows={4}
            placeholder="Reason for rejection"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />

          <Button variant="destructive" onClick={handleReject}>
            Reject Work
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}