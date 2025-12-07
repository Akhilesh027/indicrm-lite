import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { Project } from '@/data/dummyData';

const statusColors: Record<string, string> = {
  'Not Started': 'secondary',
  'In Progress': 'inProgress',
  'Review': 'info',
  'Completed': 'completed',
  'Failed': 'failed',
};

const priorityColors: Record<string, string> = {
  'Low': 'secondary',
  'Medium': 'warning',
  'High': 'destructive',
  'Urgent': 'destructive',
};

export default function WorksPage() {
  const { projects, updateProject, employees, customers } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const statuses = ['All', 'Not Started', 'In Progress', 'Review', 'Completed', 'Failed'];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (id: string) => {
    return employees.find((e) => e.id === id)?.name || 'Unassigned';
  };

  const getCustomerName = (id: string) => {
    return customers.find((c) => c.id === id)?.name || 'Unknown';
  };

  const projectsByStatus = {
    'Not Started': filteredProjects.filter((p) => p.status === 'Not Started'),
    'In Progress': filteredProjects.filter((p) => p.status === 'In Progress'),
    'Review': filteredProjects.filter((p) => p.status === 'Review'),
    'Completed': filteredProjects.filter((p) => p.status === 'Completed'),
  };

  const handleStatusChange = (projectId: string, newStatus: Project['status']) => {
    updateProject(projectId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Manage projects and assignments
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Create Work
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold text-foreground">{projects.length}</p>
          <p className="text-sm text-muted-foreground">Total Projects</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-heading font-bold text-info">
            {projects.filter((p) => p.status === 'In Progress').length}
          </p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">
            {projects.filter((p) => p.status === 'Review').length}
          </p>
          <p className="text-sm text-muted-foreground">In Review</p>
        </div>
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">
            {projects.filter((p) => p.status === 'Completed').length}
          </p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </motion.div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
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
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-foreground line-clamp-2">
                        {project.title}
                      </h4>
                      <Badge variant={priorityColors[project.priority] as any} className="text-xs">
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{project.type}</p>
                    
                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {project.completedDeliverables}/{project.deliverables}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{
                            width: `${(project.completedDeliverables / project.deliverables) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="flex -space-x-2">
                        {project.assignedTo.slice(0, 2).map((empId) => (
                          <div
                            key={empId}
                            className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                          >
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No projects
                  </p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        >
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
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <p className="font-medium text-foreground">{project.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {project.assignedTo.map(getEmployeeName).join(', ')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {getCustomerName(project.customerId)}
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary">{project.type}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={statusColors[project.status] as any}>
                      {project.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${(project.completedDeliverables / project.deliverables) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {project.completedDeliverables}/{project.deliverables}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
