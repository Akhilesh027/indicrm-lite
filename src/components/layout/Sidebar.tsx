import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Target,
  Building2,
  ClipboardList,
  Phone,
  Wallet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Crown,
  FileText,
  PackageCheck,
  CreditCard,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRMStore } from '@/store/crmStore';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Telecaller', 'Sales Executive', 'Employee', 'Accountant'] },
  { label: 'Employees', path: '/employees', icon: Users, roles: ['Admin', 'Manager'] },
  { label: 'Leads', path: '/leads', icon: Target, roles: ['Admin', 'Manager', 'Telecaller', 'Sales Executive'] },
  { label: 'Customers', path: '/customers', icon: Building2, roles: ['Admin', 'Manager', 'Sales Executive', 'Customer'] },
  { label: 'Works', path: '/works', icon: ClipboardList, roles: ['Admin', 'Manager', 'Employee'] },
  { label: 'Deliverables', path: '/deliverables', icon: PackageCheck, roles: ['Admin', 'Manager', 'Employee'] },
  { label: 'Invoices', path: '/invoices', icon: FileText, roles: ['Admin', 'Manager', 'Accountant'] },
  { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['Admin', 'Manager', 'Accountant'] },
  { label: 'Client Portal', path: '/client-portal', icon: Eye, roles: ['Admin', 'Manager', 'Customer'] },
  { label: 'Telecaller', path: '/telecaller', icon: Phone, roles: ['Admin', 'Manager', 'Telecaller'] },
  { label: 'Accounts', path: '/accounts', icon: Wallet, roles: ['Admin', 'Accountant'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['Admin', 'Manager', 'Accountant'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useCRMStore();

  const filteredNavItems = navItems.filter(
    (item) => currentUser && item.roles.includes(currentUser.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col bg-sidebar h-screen border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary/20">
          <Crown className="w-6 h-6 text-sidebar-primary" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <span className="font-heading font-bold text-lg text-sidebar-foreground">
              Digitalness
            </span>
            <span className="text-xs text-sidebar-foreground/60">Digital Marketing CRM</span>
          </motion.div>
        )}
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>

      {/* Navigation */}
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
                  isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                )}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-sm"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-sidebar-border">
        {currentUser && (
          <div className={cn('flex items-center gap-3 mb-3', collapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-semibold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60">{currentUser.role}</p>
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
