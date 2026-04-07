import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Filter, Calendar, Clock, CheckCircle, AlertTriangle, Users, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { Project } from '@/data/dummyData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  'Not Started': 'secondary', 'In Progress': 'inProgress', 'Review': 'info', 'Completed': 'completed', 'Failed': 'failed',
};

const priorityColors: Record<string, string> = {
  'Low': 'secondary', 'Medium': 'warning', 'High': 'destructive', 'Urgent': 'destructive',
};

export default function WorksPage() {
  const { projects, addProject, updateProject, employees, customers } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '', type: '', customerId: '', priority: 'Medium' as Project['priority'],
    dueDate: '', description: '', deliverables: 1, assignedTo: [] as string[],
  });
  const { toast } = useToast();

  const statuses = ['All', 'Not Started', 'In Progress', 'Review', 'Completed', 'Failed'];
  const projectTypes = ['Digital Marketing', 'Website Design', 'App Development', 'Video Production', 'SEO', 'Social Media', 'Branding'];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || 'Unknown';

  const projectsByStatus = {
    'Not Started': filteredProjects.filter((p) => p.status === 'Not Started'),
    'In Progress': filteredProjects.filter((p) => p.status === 'In Progress'),
    'Review': filteredProjects.filter((p) => p.status === 'Review'),
    'Completed': filteredProjects.filter((p) => p.status === 'Completed'),
  };

  const handleStatusChange = (projectId: string, newStatus: Project['status']) => {
    updateProject(projectId, { status: newStatus });
  };

  const handleAddProject = () => {
    if (!newProject.title || !newProject.customerId || !newProject.type) {
      toast({ title: 'Error', description: 'Please fill title, customer and type', variant: 'destructive' });
      return;
    }
    const project: Project = {
      id: `PROJ${Date.now()}`,
      ...newProject,
      status: 'Not Started',
      deliverables: Number(newProject.deliverables),
      completedDeliverables: 0,
      createdOn: new Date().toISOString().split('T')[0],
      dueDate: newProject.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };
    addProject(project);
    toast({ title: 'Work Created', description: `${newProject.title} created successfully` });
    setShowAddModal(false);
    setNewProject({ title: '', type: '', customerId: '', priority: 'Medium', dueDate: '', description: '', deliverables: 1, assignedTo: [] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Works & Tasks</h1>
          <p className="text-muted-foreground">Manage projects and assignments</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Work
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold text-foreground">{projects.length}</p>
          <p className="text-sm text-muted-foreground">Total Projects</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-heading font-bold text-info">{projects.filter((p) => p.status === 'In Progress').length}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">{projects.filter((p) => p.status === 'Review').length}</p>
          <p className="text-sm text-muted-foreground">In Review</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">{projects.filter((p) => p.status === 'Completed').length}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('kanban')}>Kanban</Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List</Button>
        </div>
      </motion.div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(projectsByStatus).map(([status, statusProjects]) => (
            <div key={status} className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant={statusColors[status] as any}>{status}</Badge>
                  <span className="text-sm text-muted-foreground">({statusProjects.length})</span>
                </div>
              </div>
              <div className="space-y-3">
                {statusProjects.map((project, index) => (
                  <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-foreground line-clamp-2">{project.title}</h4>
                      <Badge variant={priorityColors[project.priority] as any} className="text-xs">{project.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{project.type}</p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.completedDeliverables}/{project.deliverables}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${(project.completedDeliverables / project.deliverables) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex -space-x-2">
                        {project.assignedTo.slice(0, 2).map((empId) => (
                          <div key={empId} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary">
                            {getEmployeeName(empId).charAt(0)}
                          </div>
                        ))}
                        {project.assignedTo.length > 2 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                            +{project.assignedTo.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {statusProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No projects</p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Project</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Progress</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.map((project, index) => (
                <motion.tr key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-foreground">{project.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{project.assignedTo.map(getEmployeeName).join(', ')}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{getCustomerName(project.customerId)}</td>
                  <td className="p-4"><Badge variant="secondary">{project.type}</Badge></td>
                  <td className="p-4"><Badge variant={statusColors[project.status] as any}>{project.status}</Badge></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full"
                          style={{ width: `${(project.completedDeliverables / project.deliverables) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{project.completedDeliverables}/{project.deliverables}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Create Work Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Work</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Title *</label>
              <Input value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} placeholder="Project title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Customer *</label>
                <Select value={newProject.customerId} onValueChange={(v) => setNewProject({ ...newProject, customerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Type *</label>
                <Select value={newProject.type} onValueChange={(v) => setNewProject({ ...newProject, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Priority</label>
                <Select value={newProject.priority} onValueChange={(v: Project['priority']) => setNewProject({ ...newProject, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Urgent'].map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Due Date</label>
                <Input type="date" value={newProject.dueDate} onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Total Deliverables</label>
              <Input type="number" min={1} value={newProject.deliverables} onChange={(e) => setNewProject({ ...newProject, deliverables: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Assign Employees</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2">
                    <Checkbox id={`emp-${emp.id}`} checked={newProject.assignedTo.includes(emp.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setNewProject({ ...newProject, assignedTo: [...newProject.assignedTo, emp.id] });
                        else setNewProject({ ...newProject, assignedTo: newProject.assignedTo.filter((id) => id !== emp.id) });
                      }} />
                    <label htmlFor={`emp-${emp.id}`} className="text-sm">{emp.name} ({emp.role})</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <Textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder="Project description" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gradient" onClick={handleAddProject} className="flex-1">Create Work</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}