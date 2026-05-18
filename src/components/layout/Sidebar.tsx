import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Target, Building2, ClipboardList, Phone,
  Wallet, BarChart3, ChevronLeft, ChevronRight, LogOut, Crown,
  FileText, PackageCheck, CreditCard, Eye, TrendingUp, FileSignature,
  GitBranch, FileBox, LifeBuoy, ListChecks, MessageSquare, CheckSquare,
  Trophy, Receipt, Bell, FileBarChart, Workflow,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
{
  label: 'Dashboard',
  path: '/dashboard',
  icon: LayoutDashboard,
  roles: [
    'Admin',
    'Operational Manager',
    'Performance Marketer',
    'Content Writer',
    'Graphic Designer',
    'UI/UX',
    'Frontend Dev',
    'Backend Dev',
    'BDE',
    'Support',
    'Telecaller',
  ],
},

{
  label: 'Employees',
  path: '/employees',
  icon: Users,
  roles: ['Admin', 'Operational Manager'],
},

{
  label: 'Leads',
  path: '/leads',
  icon: Target,
  roles: [
    'Admin',
    'Operational Manager',
    'BDE',
    'Performance Marketer',
    'Telecaller',
  ],
},

{
  label: 'Sales Pipeline',
  path: '/sales-pipeline',
  icon: TrendingUp,
  roles: [
    'Admin',
    'Operational Manager',
    
  ],
},

{
  label: 'Proposals',
  path: '/proposals',
  icon: FileSignature,
  roles: [
    'Admin',
    'Operational Manager',
    'BDE',
  ],
},

{
  label: 'Customers',
  path: '/customers',
  icon: Building2,
  roles: [
    'Admin',
    'Operational Manager',
    'BDE',
    
  ],
},

{
  label: 'Works',
  path: '/works',
  icon: ClipboardList,
  roles: [
    'Admin',
    'Operational Manager',
    'UI/UX',
    'Frontend Dev',
    'Backend Dev',
  ],
},

{
  label: 'Deliverables',
  path: '/deliverables',
  icon: PackageCheck,
  roles: [
    'Admin',
    'Operational Manager',
    'Content Writer',
    'Graphic Designer',
    'UI/UX',
    'Frontend Dev',
    'Backend Dev',
  ],
},

{
  label: 'Tasks',
  path: '/tasks',
  icon: ListChecks,
  roles: [
    'Admin',
    'Operational Manager',
    'Performance Marketer',
    'Content Writer',
    'Graphic Designer',
    'UI/UX',
    'Frontend Dev',
    'Backend Dev',
    'Support',
    'Telecaller',
  ],
},

{
  label: 'Communications',
  path: '/communications',
  icon: MessageSquare,
  roles: [
    'Admin',
    'Operational Manager',
    'BDE',
    'Support',
    'Telecaller',
  ],
},

{
  label: 'Approvals',
  path: '/approvals',
  icon: CheckSquare,
  roles: ['Admin', 'Operational Manager'],
},

{
  label: 'Performance',
  path: '/performance',
  icon: Trophy,
  roles: [
    'Admin',
    'Operational Manager',
    'Performance Marketer',
  
  ],
},

{
  label: 'Notifications',
  path: '/notifications',
  icon: Bell,
  roles: [
    'Admin',
    'Operational Manager',
    'Performance Marketer',
    'Content Writer',
    'Graphic Designer',
    'UI/UX',
    'Frontend Dev',
    'Backend Dev',
    'BDE',
    'Support',
    'Telecaller',
  ],
},

{
  label: 'Auto Reports',
  path: '/auto-reports',
  icon: FileBarChart,
  roles: ['Admin', 'Operational Manager'],
},

{
  label: 'Workflow',
  path: '/workflow',
  icon: Workflow,
  roles: ['Admin', 'Operational Manager'],
},

{
  label: 'Client Portal',
  path: '/client-portal',
  icon: Eye,
  roles: [
    'Admin',
    'Operational Manager',
    'BDE',
  
  ],
},

{
  label: 'Telecaller',
  path: '/telecaller',
  icon: Phone,
  roles: [
    'Admin',
    'Operational Manager',
    'BDE',
  ],
},

// {
//   label: 'Accounts',
//   path: '/accounts',
//   icon: Wallet,
//   roles: ['Admin', 'Operational Manager'],
// },

{
  label: 'Reports',
  path: '/reports',
  icon: BarChart3,
  roles: ['Admin', 'Operational Manager'],
},

{
  label: 'Tickets',
  path: '/tickets',
  icon: LifeBuoy,
  roles: [
    'Admin',
    'Operational Manager',
    'Support',
    'Telecaller',
  ],
},

{
  label: 'Templates',
  path: '/templates',
  icon: FileBox,
  roles: [
    'Admin',
    'Operational Manager',
    'Content Writer',
    'Graphic Designer',
  ],
},

{
  label: 'Branches',
  path: '/branches',
  icon: GitBranch,
  roles: ['Admin'],
},

{
  label: 'Employee Report',
  path: '/employee-report',
  icon: Users,
  roles: ['Admin', 'Operational Manager'],
},
];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = getStoredUser();
  const currentRole = currentUser?.role;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col bg-sidebar h-screen border-r border-sidebar-border"
    >
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary/20">
          <Crown className="w-6 h-6 text-sidebar-primary" />
        </div>

        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="font-heading font-bold text-lg text-sidebar-foreground">
              Digitalness
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Digital Marketing CRM
            </span>
          </motion.div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent z-10"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                )}
              />

              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-sm">
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {currentUser?.name && (
          <div className={cn('flex items-center gap-3 mb-3', collapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-semibold text-sm">
              {currentUser.name.charAt(0)}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {currentRole}
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10',
            collapsed ? 'justify-center px-0' : 'justify-start'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </motion.aside>
  );
}