import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, ChevronDown, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCRMStore } from '@/store/crmStore';
import { userRoles, UserRole } from '@/data/dummyData';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useCRMStore();

  const handleLogin = () => {
    if (selectedRole) {
      login(selectedRole);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Digitalness
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Digital Marketing CRM
            </p>
          </motion.div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Your Role
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-input bg-background hover:border-primary focus:border-primary focus:ring-2 focus:ring-ring transition-all"
              >
                <span className={selectedRole ? 'text-foreground' : 'text-muted-foreground'}>
                  {selectedRole || 'Choose a role...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-10 w-full mt-2 py-1 bg-popover border border-border rounded-lg shadow-lg"
                >
                  {userRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {role}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <Button
              onClick={handleLogin}
              disabled={!selectedRole}
              className="w-full h-12 text-base font-semibold"
              variant="gradient"
              size="lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login to Dashboard
            </Button>
          </motion.div>

          {/* Demo Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            Demo Mode: Select any role to explore the CRM features
          </motion.p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 Knight21 Digi Hub. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
