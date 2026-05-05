import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, LogIn, Mail, Lock, UserRound, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRMStore } from "@/store/crmStore";
import { UserRole } from "@/data/dummyData";

type DemoUser = {
  role: UserRole;
  position: string;
  email: string;
  password: string;
};

const demoUsers: DemoUser[] = [
  {
    role: "Admin",
    position: "Admin",
    email: "admin@digitalness.in",
    password: "admin123",
  },
  {
    role: "Manager",
    position: "Operational Manager",
    email: "manager@digitalness.in",
    password: "manager123",
  },
  {
    role: "Telecaller",
    position: "Telecaller",
    email: "telecaller@digitalness.in",
    password: "tele123",
  },
  {
    role: "Sales Executive",
    position: "BDE",
    email: "sales@digitalness.in",
    password: "sales123",
  },
  {
    role: "Employee",
    position: "Digital Marketer",
    email: "digitalmarketer@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "Performance Marketer",
    email: "performance@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "Content Writer",
    email: "content@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "Graphic Designer",
    email: "designer@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "UI/UX Designer",
    email: "uiux@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "Frontend Developer",
    email: "frontend@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "Backend Developer",
    email: "backend@digitalness.in",
    password: "emp123",
  },
  {
    role: "Employee",
    position: "Support & Voice Process",
    email: "support@digitalness.in",
    password: "emp123",
  },
  // {
  //   role: "Accountant",
  //   position: "Account Manager",
  //   email: "accounts@digitalness.in",
  //   password: "accounts123",
  // },
  {
    role: "Customer",
    position: "Customer",
    email: "customer@digitalness.in",
    password: "customer123",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useCRMStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [selectedPosition, setSelectedPosition] = useState("");

  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    const user = demoUsers.find(
      (item) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password
    );

    if (!user) {
      setError("Invalid email or password");
      return;
    }

    login(user.role, user.position);
    navigate("/dashboard");
  };

  const fillDemoUser = (user: DemoUser) => {
    setEmail(user.email);
    setPassword(user.password);
    setSelectedRole(user.role);
    setSelectedPosition(user.position);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-2xl mx-4"
      >
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>

            <h1 className="text-2xl font-heading font-bold text-foreground">
              Digitalness CRM
            </h1>

            <p className="text-muted-foreground text-sm mt-1">
              Login with role + position
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-input bg-background focus:border-primary focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
              </div>

              {(selectedRole || selectedPosition) && (
                <div className="space-y-2">
                  {selectedRole && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm">
                      <UserRound className="w-4 h-4 text-primary" />
                      <span>
                        Role: <strong>{selectedRole}</strong>
                      </span>
                    </div>
                  )}

                  {selectedPosition && (
                    <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-3 text-sm">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span>
                        Position: <strong>{selectedPosition}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}

              <Button
                onClick={handleLogin}
                disabled={!email || !password}
                className="w-full h-12 text-base font-semibold"
                variant="gradient"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </Button>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                Demo Login Details
              </p>

              <div className="grid grid-cols-1 gap-2 max-h-[390px] overflow-y-auto pr-1">
                {demoUsers.map((user) => (
                  <button
                    key={`${user.role}-${user.position}`}
                    type="button"
                    onClick={() => fillDemoUser(user)}
                    className="text-left rounded-lg border border-border bg-background hover:bg-accent transition-colors p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {user.position}
                      </p>
                      <span className="text-[10px] rounded-full px-2 py-1 bg-primary/10 text-primary">
                        {user.role}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user.email}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {user.password}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 Digitalness. All Rights Reserved.
        </p>
      </motion.div>
    </div>
  );
}