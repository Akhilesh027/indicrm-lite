import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  CreditCard,
  Package,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { Customer } from '@/data/dummyData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function CustomersPage() {
  const { customers, projects } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.businessType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalPending = customers.reduce((sum, c) => sum + c.totalPending, 0);

  const getCustomerProjects = (customerId: string) => {
    return projects.filter((p) => p.customerId === customerId);
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
            Customers
          </h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <p className="text-3xl font-heading font-bold text-foreground">{customers.length}</p>
          <p className="text-sm text-muted-foreground">Total Customers</p>
        </div>
        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <p className="text-3xl font-heading font-bold">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-primary-foreground/80">Total Paid</p>
        </div>
        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-3xl font-heading font-bold text-warning">{formatCurrency(totalPending)}</p>
          <p className="text-sm text-muted-foreground">Pending Amount</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <p className="text-3xl font-heading font-bold text-foreground">{projects.length}</p>
          <p className="text-sm text-muted-foreground">Active Projects</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Customers Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredCustomers.map((customer, index) => {
          const customerProjects = getCustomerProjects(customer.id);
          return (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all cursor-pointer group"
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{customer.businessType}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{customer.contactNumbers[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{customer.city}</span>
                </div>
                {customer.package && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-accent" />
                    <Badge variant="new">{customer.package}</Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-semibold text-success">{formatCurrency(customer.totalPaid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className={`font-semibold ${customer.totalPending > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {formatCurrency(customer.totalPending)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold">{selectedCustomer.name}</h2>
                  <p className="text-muted-foreground">{selectedCustomer.businessType} • {selectedCustomer.city}</p>
                  {selectedCustomer.package && (
                    <Badge variant="new" className="mt-1">{selectedCustomer.package}</Badge>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Phone</span>
                  </div>
                  {selectedCustomer.contactNumbers.map((phone, idx) => (
                    <p key={idx} className="text-sm">{phone}</p>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <p className="text-sm">{selectedCustomer.email || 'Not provided'}</p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-heading font-bold text-success">
                    {formatCurrency(selectedCustomer.totalPaid)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-heading font-bold text-warning">
                    {formatCurrency(selectedCustomer.totalPending)}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-semibold mb-2">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.requirements.map((req) => (
                    <Badge key={req} variant="secondary">{req}</Badge>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h4 className="font-semibold mb-2">Ongoing Projects</h4>
                <div className="space-y-2">
                  {getCustomerProjects(selectedCustomer.id).map((project) => (
                    <div key={project.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{project.type}</p>
                      </div>
                      <Badge variant={
                        project.status === 'Completed' ? 'completed' :
                        project.status === 'In Progress' ? 'inProgress' :
                        project.status === 'Review' ? 'info' :
                        'pending'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                  {getCustomerProjects(selectedCustomer.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">No active projects</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${selectedCustomer.contactNumbers[0]}`, '_blank')}
                  className="flex-1"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button
                  variant="success"
                  onClick={() => window.open(`https://wa.me/91${selectedCustomer.contactNumbers[0]}`, '_blank')}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
