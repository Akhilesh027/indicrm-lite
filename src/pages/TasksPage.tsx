import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Timer,
  Send,
  RotateCcw,
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
import {
  AgencyTask,
  TaskStatus,
  TaskUpdate,
  daysToDeadline,
  isOverdue,
  useTaskStore,
} from "@/store/taskStore";
import { useCRMStore } from "@/store/crmStore";
import { toast } from "sonner";

const STATUSES: TaskStatus[] = [
  "Pending",
  "In Progress",
  "Review",
  "Completed",
  "Revision",
];

const POSITIONS = [
  "Digital Marketer",
  "Performance Marketer",
  "Content Writer",
  "Graphic Designer",
  "UI/UX Designer",
  "Frontend Developer",
  "Backend Developer",
  "BDE",
  "Support & Voice Process",
];

const PRIORITIES = ["High", "Medium", "Low"];

const statusVariant: Record<TaskStatus, string> = {
  Pending: "secondary",
  "In Progress": "inProgress",
  Review: "info",
  Completed: "completed",
  Revision: "warning",
};

export default function TasksPage() {
  const { tasks, updateTask, addUpdate, addTask } = useTaskStore();
  const { employees, projects, customers, branches = [], currentUser } = useCRMStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");

  const [selected, setSelected] = useState<AgencyTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [updMsg, setUpdMsg] = useState("");
  const [updFiles, setUpdFiles] = useState("");
  const [updTime, setUpdTime] = useState<number>(1);
  const [reviewNote, setReviewNote] = useState("");

  const [form, setForm] = useState({
    title: "",
    projectId: "",
    customerId: "",
    serviceType: "",
    assignedTo: "",
    assignedPosition: "",
    priority: "Medium",
    deadline: "",
    branchId: "",
    notes: "",
    slaDays: 2,
  });

  const role = currentUser?.role;
  const isAdminOrManager = role === "Admin" || role === "Manager";
  const isEmployee = role === "Employee";

  const visible = useMemo(() => {
    return tasks.filter((t) => {
      if (isEmployee) {
        const userPosition = currentUser?.position || currentUser?.employeePosition;
        if (t.assignedTo !== currentUser?.id && t.assignedPosition !== userPosition) {
          return false;
        }
      }

      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
      if (positionFilter !== "All" && t.assignedPosition !== positionFilter) return false;
      if (branchFilter !== "All" && t.branchId !== branchFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        const proj = projects.find((p) => p.id === t.projectId)?.title || "";
        const cust = customers.find((c) => c.id === t.customerId)?.name || "";

        return (
          t.title.toLowerCase().includes(q) ||
          proj.toLowerCase().includes(q) ||
          cust.toLowerCase().includes(q) ||
          (t.serviceType || "").toLowerCase().includes(q) ||
          (t.assignedPosition || "").toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    positionFilter,
    branchFilter,
    isEmployee,
    currentUser,
    projects,
    customers,
  ]);

  const stats = {
    pending: visible.filter((t) => t.status === "Pending").length,
    ongoing: visible.filter((t) => t.status === "In Progress").length,
    review: visible.filter((t) => t.status === "Review").length,
    completed: visible.filter((t) => t.status === "Completed").length,
  };

  const empName = (id?: string) =>
    id ? employees.find((e) => e.id === id)?.name || "Unassigned" : "Unassigned";

  const projName = (id?: string) =>
    id ? projects.find((p) => p.id === id)?.title || id : "—";

  const custName = (id?: string) =>
    id ? customers.find((c) => c.id === id)?.name || "—" : "—";

  const branchName = (id?: string) =>
    id ? branches.find((b: any) => b.id === id)?.name || "—" : "—";

  const suggestedEmployees = employees.filter((emp: any) => {
    if (!form.assignedPosition) return true;
    return (
      emp.position === form.assignedPosition ||
      emp.employeePosition === form.assignedPosition ||
      emp.role === form.assignedPosition ||
      emp.department === form.assignedPosition
    );
  });

  const resetForm = () => {
    setForm({
      title: "",
      projectId: "",
      customerId: "",
      serviceType: "",
      assignedTo: "",
      assignedPosition: "",
      priority: "Medium",
      deadline: "",
      branchId: "",
      notes: "",
      slaDays: 2,
    });
  };

  const handleCreateTask = () => {
    if (!form.title || !form.assignedPosition || !form.deadline) {
      toast.error("Task title, position and deadline are required");
      return;
    }

    const newTask: AgencyTask = {
      id: `TASK-${Date.now()}`,
      title: form.title,
      projectId: form.projectId,
      customerId: form.customerId,
      serviceType: form.serviceType,
      assignedTo: form.assignedTo,
      assignedPosition: form.assignedPosition,
      priority: form.priority as "High" | "Medium" | "Low",
      deadline: form.deadline,
      status: "Pending",
      progressNote: "",
      attachments: [],
      timeSpent: 0,
      managerReviewNote: "",
      notes: form.notes,
      slaDays: Number(form.slaDays) || 2,
      branchId: form.branchId,
      createdAt: new Date().toISOString(),
      updates: [],
    };

    addTask(newTask);
    toast.success("Task created successfully");
    setCreateOpen(false);
    resetForm();
  };

  const handleAddUpdate = () => {
    if (!selected || !updMsg.trim()) {
      toast.error("Add a message to log work");
      return;
    }

    const files = updFiles
      ? updFiles.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const u: TaskUpdate = {
      id: `U${Date.now()}`,
      message: updMsg,
      files,
      timeSpent: Number(updTime) || 0,
      by: currentUser?.id || "SYSTEM",
      byName: currentUser?.name,
      createdAt: new Date().toISOString(),
    };

    addUpdate(selected.id, u);

    const nextSelected = {
      ...selected,
      updates: [...selected.updates, u],
      progressNote: updMsg,
      attachments: [...(selected.attachments || []), ...files],
      timeSpent: (selected.timeSpent || 0) + (Number(updTime) || 0),
    };

    updateTask(selected.id, {
      progressNote: updMsg,
      attachments: nextSelected.attachments,
      timeSpent: nextSelected.timeSpent,
    });

    setSelected(nextSelected);
    setUpdMsg("");
    setUpdFiles("");
    setUpdTime(1);
    toast.success("Work update added");
  };

  const handleStatus = (s: TaskStatus) => {
    if (!selected) return;

    if (isEmployee && s !== "Review" && s !== "In Progress") {
      toast.error("Employees can only start work or submit for review");
      return;
    }

    updateTask(selected.id, { status: s });
    setSelected({ ...selected, status: s });
    toast.success(`Status changed to ${s}`);
  };

  const handleManagerReview = (status: "Completed" | "Revision") => {
    if (!selected) return;

    updateTask(selected.id, {
      status,
      managerReviewNote: reviewNote,
    });

    setSelected({
      ...selected,
      status,
      managerReviewNote: reviewNote,
    });

    setReviewNote("");
    toast.success(status === "Completed" ? "Task approved" : "Revision requested");
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
            Works / Tasks
          </h1>
          <p className="text-muted-foreground">
            Pending, ongoing, review and completed work tracking
          </p>
        </div>

        {isAdminOrManager && (
          <Button variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>

        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-bold text-info">{stats.ongoing}</p>
          <p className="text-sm text-muted-foreground">Ongoing</p>
        </div>

        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-bold text-warning">{stats.review}</p>
          <p className="text-sm text-muted-foreground">Review</p>
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search task, project, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priorities</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Positions</SelectItem>
            {POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {branches.length > 0 && (
        <div className="w-full lg:w-64">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Branches</SelectItem>
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Task
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Project / Client
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Assigned
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Priority
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  SLA / Deadline
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                  Updates
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {visible.map((t, i) => {
                const overdue = isOverdue(t);
                const days = daysToDeadline(t);

                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(t)}
                  >
                    <td className="p-3">
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.serviceType || "General"} • {branchName(t.branchId)}
                      </p>
                    </td>

                    <td className="p-3 text-sm">
                      <p>{projName(t.projectId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {custName(t.customerId)}
                      </p>
                    </td>

                    <td className="p-3 text-sm">
                      <p>{empName(t.assignedTo)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.assignedPosition || "—"}
                      </p>
                    </td>

                    <td className="p-3">
                      <Badge variant={statusVariant[t.status] as any}>
                        {t.status}
                      </Badge>
                    </td>

                    <td className="p-3">
                      <Badge variant="outline">{t.priority || "Medium"}</Badge>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{t.slaDays || 0}d SLA</span>
                      </div>

                      <div className="mt-1">
                        {overdue ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Overdue {Math.abs(days)}d
                          </Badge>
                        ) : t.status === "Completed" ? (
                          <Badge variant="completed" className="text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {days >= 0 ? `${days}d left` : "Due"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-sm text-muted-foreground">
                      {t.updates?.length || 0}
                    </td>
                  </motion.tr>
                );
              })}

              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Task Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <Input
              placeholder="Service Type"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            />

            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={form.customerId}
              onValueChange={(v) => setForm({ ...form, customerId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={form.assignedPosition}
              onValueChange={(v) =>
                setForm({ ...form, assignedPosition: v, assignedTo: "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Assigned Position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={form.assignedTo}
              onValueChange={(v) => setForm({ ...form, assignedTo: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assigned Employee" />
              </SelectTrigger>
              <SelectContent>
                {suggestedEmployees.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />

            <Input
              type="number"
              placeholder="SLA Days"
              value={form.slaDays}
              onChange={(e) =>
                setForm({ ...form, slaDays: Number(e.target.value) })
              }
            />

            {branches.length > 0 && (
              <Select
                value={form.branchId}
                onValueChange={(v) => setForm({ ...form, branchId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Textarea
              className="md:col-span-2"
              placeholder="Task notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button variant="gradient" onClick={handleCreateTask}>
            Create Task
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Project</p>
                    <p className="font-medium">{projName(selected.projectId)}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="font-medium">{empName(selected.assignedTo)}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="font-medium">
                      {selected.assignedPosition || "—"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {new Date(selected.deadline).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selected.status === s ? "gradient" : "outline"}
                        onClick={() => handleStatus(s)}
                        disabled={isEmployee && s !== "In Progress" && s !== "Review"}
                      >
                        {s === "Review" && isEmployee ? (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Submit Review
                          </>
                        ) : (
                          s
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Add Work Update</p>
                  <Textarea
                    placeholder="What did you do?"
                    value={updMsg}
                    onChange={(e) => setUpdMsg(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Files / links comma separated"
                      value={updFiles}
                      onChange={(e) => setUpdFiles(e.target.value)}
                    />

                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Hours spent"
                      value={updTime}
                      onChange={(e) =>
                        setUpdTime(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <Button
                    size="sm"
                    className="mt-2"
                    variant="gradient"
                    onClick={handleAddUpdate}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Log Update
                  </Button>
                </div>

                {isAdminOrManager && selected.status === "Review" && (
                  <div className="p-4 rounded-xl border border-border bg-muted/30">
                    <p className="text-sm font-semibold mb-2">Manager Review</p>

                    <Textarea
                      placeholder="Review note"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="gradient"
                        onClick={() => handleManagerReview("Completed")}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManagerReview("Revision")}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}

                {selected.managerReviewNote && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                    <p className="font-semibold">Manager Note</p>
                    <p className="text-muted-foreground">
                      {selected.managerReviewNote}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold mb-2">
                    Updates ({selected.updates?.length || 0})
                  </p>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(selected.updates?.length || 0) === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No updates yet
                      </p>
                    )}

                    {[...(selected.updates || [])].reverse().map((u) => (
                      <div key={u.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{u.byName || u.by}</span>
                          <span>{new Date(u.createdAt).toLocaleString("en-IN")}</span>
                        </div>

                        <p>{u.message}</p>

                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {u.timeSpent}h
                          </span>

                          {u.files?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {u.files.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}