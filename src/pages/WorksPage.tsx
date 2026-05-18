import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Calendar, Loader2 } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/data/dummyData";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTemplateStore } from "@/store/templateStore";

const API_URL = import.meta.env.VITE_API_URL || "https://digitalness-backend.onrender.com/api";

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const statusColors: Record<string, string> = {
  Pending: "secondary",
  "Not Started": "secondary",
  "In Progress": "inProgress",
  Review: "info",
  Completed: "completed",
  Failed: "failed",
};

const priorityColors: Record<string, string> = {
  Low: "secondary",
  Medium: "warning",
  High: "destructive",
  Urgent: "destructive",
};

export default function WorksPage() {
  const { templates } = useTemplateStore();
  const { toast } = useToast();

  const [works, setWorks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [assignUpdatingId, setAssignUpdatingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newProject, setNewProject] = useState({
    title: "",
    type: "",
    customerId: "",
    priority: "Medium" as Project["priority"],
    dueDate: "",
    description: "",
    deliverables: 1,
    assignedTo: [] as string[],
    templateId: "",
  });

  const statuses = [
    "All",
    "Pending",
    "Not Started",
    "In Progress",
    "Review",
    "Completed",
    "Failed",
  ];

  const kanbanStatuses = [
    "Pending",
    "Not Started",
    "In Progress",
    "Review",
    "Completed",
  ];

  const projectTypes = [
    "Digital Marketing",
    "Website Design",
    "App Development",
    "Video Production",
    "SEO",
    "Social Media",
    "Branding",
  ];

  const getArrayData = (res: any) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data.users)) return res.data.users;
    if (Array.isArray(res.data.customers)) return res.data.customers;
    if (Array.isArray(res.data.works)) return res.data.works;
    return [];
  };

  const formatAssignedUsers = (assignedTo: any) => {
    if (!assignedTo) return [];

    const users = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    return users.map((emp: any) => {
      if (typeof emp === "string") {
        const found = employees.find(
          (user: any) => user._id === emp || user.id === emp
        );

        return {
          id: emp,
          name:
            found?.name ||
            found?.fullName ||
            found?.username ||
            found?.email ||
            "User",
          role: found?.role || found?.department || "Employee",
        };
      }

      return {
        id: emp._id || emp.id,
        name: emp.name || emp.fullName || emp.username || emp.email || "User",
        role: emp.role || emp.department || "Employee",
      };
    });
  };

  const fetchCustomersAndUsers = async () => {
    try {
      const [customerRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/customers`, getAuthConfig()),
        axios.get(`${API_URL}/users`, getAuthConfig()),
      ]);

      setCustomers(getArrayData(customerRes));
      setEmployees(getArrayData(userRes));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers and users",
        variant: "destructive",
      });
    }
  };

  const fetchWorks = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/works`, getAuthConfig());
      const data = getArrayData(res);

      const formattedWorks = data.map((work: any) => ({
        id: work._id || work.id,
        title: work.title || "",
        type: work.workType || work.type || "",
        customerId: work.customer?._id || work.customer || work.customerId,
        customerName:
          work.customer?.name ||
          work.customer?.customerName ||
          work.customer?.clientName ||
          work.customer?.companyName ||
          "Unknown",
        assignedTo: formatAssignedUsers(work.assignedTo),
        priority: work.priority || "Medium",
        status: work.status || "Pending",
        dueDate: work.dueDate,
        description: work.description || "",
        deliverables: work.deliverables || 1,
        completedDeliverables: work.completedDeliverables || 0,
        createdOn: work.createdAt,
        templateId: work.templateId,
      }));

      setWorks(formattedWorks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch works",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCustomersAndUsers();
      await fetchWorks();
    };

    loadData();
  }, []);

  const WorkCardSkeleton = () => (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-5 bg-muted rounded w-14" />
      </div>
      <div className="h-3 bg-muted rounded w-1/2 mb-3" />
      <div className="h-3 bg-muted rounded w-3/4 mb-4" />
      <div className="h-2 bg-muted rounded w-full mb-4" />
      <div className="h-8 bg-muted rounded w-full mb-3" />
      <div className="h-8 bg-muted rounded w-full" />
    </div>
  );

  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <td key={cellIndex} className="p-4">
              <div className="h-4 bg-muted rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const getCustomerName = (id: string, fallback?: string) => {
    const customer = customers.find((c: any) => c._id === id || c.id === id);

    return (
      customer?.name ||
      customer?.customerName ||
      customer?.clientName ||
      customer?.companyName ||
      fallback ||
      "Unknown"
    );
  };

  const getEmployeeName = (employee: any) => {
    if (typeof employee === "object") {
      return employee.name || employee.email || "Unassigned";
    }

    const found = employees.find(
      (emp: any) => emp._id === employee || emp.id === employee
    );

    return (
      found?.name ||
      found?.fullName ||
      found?.username ||
      found?.email ||
      "Unassigned"
    );
  };


  const getFirstAssignedId = (assignedTo: any[]) => {
    if (!assignedTo || assignedTo.length === 0) return "";
    const first = assignedTo[0];
    return typeof first === "string" ? first : first.id || first._id || "";
  };

  const getEmployeeOptionName = (emp: any) =>
    emp.name || emp.fullName || emp.username || emp.email || "Unnamed User";

  const buildAssignedUser = (employeeId: string) => {
    const emp = employees.find(
      (user: any) => user._id === employeeId || user.id === employeeId
    );

    return {
      id: employeeId,
      name: emp?.name || emp?.fullName || emp?.username || emp?.email || "User",
      role: emp?.role || emp?.department || "Employee",
    };
  };

  const filteredProjects = works.filter((project) => {
    const matchesSearch = project.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" || project.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const projectsByStatus = kanbanStatuses.reduce((acc: any, status) => {
    acc[status] = filteredProjects.filter((p) => p.status === status);
    return acc;
  }, {});

  const handleStatusChange = async (
    projectId: string,
    newStatus: Project["status"]
  ) => {
    try {
      setStatusUpdatingId(projectId);

      await axios.put(
        `${API_URL}/works/${projectId}/status`,
        { status: newStatus },
        getAuthConfig()
      );

      setWorks((prev) =>
        prev.map((work) =>
          work.id === projectId ? { ...work, status: newStatus } : work
        )
      );

      toast({
        title: "Status Updated",
        description: `Work moved to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update work status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleAssignChange = async (projectId: string, employeeId: string) => {
    try {
      setAssignUpdatingId(projectId);

      const assignedUser = buildAssignedUser(employeeId);

      try {
        await axios.put(
          `${API_URL}/works/${projectId}/assign`,
          { assignedTo: employeeId },
          getAuthConfig()
        );
      } catch (assignRouteError) {
        await axios.put(
          `${API_URL}/works/${projectId}`,
          { assignedTo: employeeId },
          getAuthConfig()
        );
      }

      setWorks((prev) =>
        prev.map((work) =>
          work.id === projectId ? { ...work, assignedTo: [assignedUser] } : work
        )
      );

      toast({
        title: "Assigned",
        description: `Work assigned to ${assignedUser.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign work",
        variant: "destructive",
      });
    } finally {
      setAssignUpdatingId(null);
    }
  };

  const handleAddProject = async () => {
    if (
      !newProject.title ||
      !newProject.customerId ||
      !newProject.type ||
      newProject.assignedTo.length === 0
    ) {
      toast({
        title: "Error",
        description: "Please fill title, customer, type and assign employee",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateLoading(true);

      const payload = {
        title: newProject.title,
        workType: newProject.type,
        customer: newProject.customerId,
        assignedTo:
          newProject.assignedTo.length === 1
            ? newProject.assignedTo[0]
            : newProject.assignedTo,
        priority: newProject.priority,
        dueDate:
          newProject.dueDate ||
          new Date(Date.now() + 30 * 86400000).toISOString(),
        description: newProject.description,
        deliverables: Number(newProject.deliverables),
        completedDeliverables: 0,
        templateId: newProject.templateId || undefined,
        status: "Pending",
      };

      await axios.post(`${API_URL}/works`, payload, getAuthConfig());

      toast({
        title: "Work Created",
        description: "Work saved, assigned and added to customer",
      });

      setShowAddModal(false);

      setNewProject({
        title: "",
        type: "",
        customerId: "",
        priority: "Medium",
        dueDate: "",
        description: "",
        deliverables: 1,
        assignedTo: [],
        templateId: "",
      });

      fetchWorks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create work",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
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
            Works & Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage works, employees and customer assignments
          </p>
        </div>

        <Button
          variant="gradient"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create Work
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold">{works.length}</p>
          <p className="text-sm text-muted-foreground">Total Works</p>
        </div>

        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-heading font-bold text-info">
            {works.filter((p) => p.status === "In Progress").length}
          </p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>

        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">
            {works.filter((p) => p.status === "Review").length}
          </p>
          <p className="text-sm text-muted-foreground">In Review</p>
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">
            {works.filter((p) => p.status === "Completed").length}
          </p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search works..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </Button>

          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading works...
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {Object.entries(projectsByStatus).map(([status, statusProjects]: any) => (
            <div key={status} className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={statusColors[status] as any}>{status}</Badge>
                <span className="text-sm text-muted-foreground">
                  ({statusProjects.length})
                </span>
              </div>

              <div className="space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <WorkCardSkeleton key={`${status}-skeleton-${index}`} />
                    ))
                  : statusProjects.map((project: any) => (
                  <div
                    key={project.id}
                    className="bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {project.title}
                      </h4>

                      <Badge
                        variant={priorityColors[project.priority] as any}
                        className="text-xs"
                      >
                        {project.priority}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">
                      {project.type}
                    </p>

                    <p className="text-xs text-muted-foreground mb-3">
                      Customer:{" "}
                      {getCustomerName(project.customerId, project.customerName)}
                    </p>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span>
                          {project.completedDeliverables}/
                          {project.deliverables}
                        </span>
                      </div>

                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${
                              (project.completedDeliverables /
                                project.deliverables) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <Select
                      value={project.status}
                      disabled={statusUpdatingId === project.id}
                      onValueChange={(value: Project["status"]) =>
                        handleStatusChange(project.id, value)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mb-3">
                        {statusUpdatingId === project.id ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {statuses
                          .filter((s) => s !== "All")
                          .map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={getFirstAssignedId(project.assignedTo)}
                      disabled={assignUpdatingId === project.id}
                      onValueChange={(value) => handleAssignChange(project.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs mb-3">
                        {assignUpdatingId === project.id ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Assigning...
                          </span>
                        ) : (
                          <SelectValue placeholder="Assign user" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp: any) => {
                          const empId = emp._id || emp.id;
                          return (
                            <SelectItem key={empId} value={empId}>
                              {getEmployeeOptionName(emp)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {project.dueDate
                          ? new Date(project.dueDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )
                          : "No date"}
                      </div>

                      <div className="flex -space-x-2">
                        {project.assignedTo.slice(0, 2).map((emp: any) => (
                          <div
                            key={emp.id}
                            title={`${emp.name} - ${emp.role}`}
                            className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                          >
                            {getEmployeeName(emp).charAt(0)}
                          </div>
                        ))}

                        {project.assignedTo.length > 2 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs">
                            +{project.assignedTo.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {!loading && statusProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No works
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm">Work</th>
                <th className="text-left p-4 text-sm">Customer</th>
                <th className="text-left p-4 text-sm">Type</th>
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-left p-4 text-sm">Assigned User</th>
                <th className="text-left p-4 text-sm">Due Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <TableSkeleton />
              ) : (
                filteredProjects.map((project: any) => (
                <tr key={project.id} className="hover:bg-muted/30">
                  <td className="p-4 font-medium">{project.title}</td>

                  <td className="p-4 text-sm text-muted-foreground">
                    {getCustomerName(project.customerId, project.customerName)}
                  </td>

                  <td className="p-4">
                    <Badge variant="secondary">{project.type}</Badge>
                  </td>

                  <td className="p-4">
                    <Badge variant={statusColors[project.status] as any}>
                      {project.status}
                    </Badge>
                  </td>

                  <td className="p-4 text-sm text-muted-foreground min-w-[190px]">
                    <Select
                      value={getFirstAssignedId(project.assignedTo)}
                      disabled={assignUpdatingId === project.id}
                      onValueChange={(value) => handleAssignChange(project.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        {assignUpdatingId === project.id ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Assigning...
                          </span>
                        ) : (
                          <SelectValue placeholder="Assign user" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp: any) => {
                          const empId = emp._id || emp.id;
                          return (
                            <SelectItem key={empId} value={empId}>
                              {getEmployeeOptionName(emp)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="p-4 text-sm text-muted-foreground">
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString("en-IN")
                      : "No date"}
                  </td>
                </tr>
              ))
              )}

              {!loading && filteredProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No works found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(open) => !createLoading && setShowAddModal(open)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Work</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                disabled={createLoading}
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
                placeholder="Work title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Customer *
              </label>
              <Select
                disabled={createLoading}
                value={newProject.customerId}
                onValueChange={(v) =>
                  setNewProject({ ...newProject, customerId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>

                <SelectContent>
                  {customers.map((c: any) => {
                    const customerId = c._id || c.id;
                    const customerName =
                      c.name ||
                      c.customerName ||
                      c.clientName ||
                      c.companyName ||
                      "Unnamed Customer";

                    return (
                      <SelectItem key={customerId} value={customerId}>
                        {customerName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Type *</label>
              <Select
                disabled={createLoading}
                value={newProject.type}
                onValueChange={(v) =>
                  setNewProject({ ...newProject, type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>

                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select
                disabled={createLoading}
                value={newProject.priority}
                onValueChange={(v: Project["priority"]) =>
                  setNewProject({ ...newProject, priority: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {["Low", "Medium", "High", "Urgent"].map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Due Date</label>
              <Input
                disabled={createLoading}
                type="date"
                value={newProject.dueDate}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    dueDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Total Deliverables
              </label>
              <Input
                disabled={createLoading}
                type="number"
                min={1}
                value={newProject.deliverables}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    deliverables: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Assign Users *
              </label>

              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {employees.map((emp: any) => {
                  const empId = emp._id || emp.id;
                  const empName =
                    emp.name || emp.fullName || emp.username || emp.email;
                  const empRole = emp.role || emp.department || "Employee";

                  return (
                    <div key={empId} className="flex items-center gap-2">
                      <Checkbox
                        disabled={createLoading}
                        id={`emp-${empId}`}
                        checked={newProject.assignedTo.includes(empId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewProject({
                              ...newProject,
                              assignedTo: [...newProject.assignedTo, empId],
                            });
                          } else {
                            setNewProject({
                              ...newProject,
                              assignedTo: newProject.assignedTo.filter(
                                (id) => id !== empId
                              ),
                            });
                          }
                        }}
                      />

                      <label htmlFor={`emp-${empId}`} className="text-sm">
                        {empName} ({empRole})
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <Textarea
                disabled={createLoading}
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    description: e.target.value,
                  })
                }
                placeholder="Work description"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={createLoading}
                className="flex-1"
              >
                Cancel
              </Button>

              <Button
                variant="gradient"
                onClick={handleAddProject}
                disabled={createLoading}
                className="flex-1"
              >
                {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {createLoading ? "Creating..." : "Create Work"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}