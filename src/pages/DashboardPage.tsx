import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  Building2,
  Wallet,
  TrendingUp,
  Phone,
  Briefcase,
  Video,
  Globe,
  MonitorSmartphone,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { LeadsFunnel } from '@/components/dashboard/LeadsFunnel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useCRMStore } from '@/store/crmStore';
import { dashboardStats } from '@/data/dummyData';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, leads, customers, employees, projects } = useCRMStore();

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const todayFollowups = leads.filter(
    (lead) => lead.followUpDate === new Date().toISOString().split('T')[0]
  ).length;

  const stats = [
    {
      title: 'Total Customers',
      value: dashboardStats.totalCustomers,
      icon: Building2,
      trend: { value: 12, isPositive: true },
      variant: 'default' as const,
      onClick: () => navigate('/customers'),
    },
    {
      title: 'Total Employees',
      value: employees.length,
      icon: Users,
      variant: 'default' as const,
      onClick: () => navigate('/employees'),
    },
    {
      title: 'Total Leads',
      value: leads.length,
      icon: Target,
      trend: { value: 8, isPositive: true },
      variant: 'default' as const,
      onClick: () => navigate('/leads'),
    },
    {
      title: 'Total Income',
      value: formatCurrency(dashboardStats.totalIncome),
      subtitle: 'From start to date',
      icon: Wallet,
      variant: 'primary' as const,
      onClick: () => navigate('/accounts'),
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(dashboardStats.totalExpenses),
      icon: TrendingUp,
      variant: 'default' as const,
      onClick: () => navigate('/accounts'),
    },
    {
      title: "Today's Follow-ups",
      value: dashboardStats.todaysFollowups,
      icon: Phone,
      variant: todayFollowups > 0 ? 'warning' as const : 'default' as const,
      onClick: () => navigate('/leads'),
    },
  ];

  const projectStats = [
    {
      title: 'Digital Marketing',
      value: dashboardStats.digitalMarketingProjects,
      icon: TrendingUp,
    },
    {
      title: 'Apps Developed',
      value: dashboardStats.appProjects,
      icon: MonitorSmartphone,
    },
    {
      title: 'Promo Videos',
      value: dashboardStats.promoVideos,
      icon: Video,
    },
    {
      title: 'Website Designs',
      value: dashboardStats.websiteDesigns,
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            {...stat}
            delay={index}
          />
        ))}
      </div>

      {/* Project Type Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card rounded-xl border border-border shadow-card p-6"
      >
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
          Completed Projects by Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {projectStats.map((stat) => (
            <div
              key={stat.title}
              className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <LeadsFunnel />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-card rounded-xl border border-border shadow-card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Pending Alerts
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Follow-up overdue', desc: 'Mahesh Traders - 2 days', type: 'warning' },
              { title: 'Payment pending', desc: '₹50,000 from Sunrise Hospital', type: 'warning' },
              { title: 'Task deadline', desc: 'Green Valley App - 5 days left', type: 'info' },
              { title: 'Salary pending', desc: '2 employees - November', type: 'destructive' },
            ].map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className={`p-3 rounded-lg border ${
                  alert.type === 'warning'
                    ? 'bg-warning/10 border-warning/30'
                    : alert.type === 'destructive'
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-info/10 border-info/30'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
