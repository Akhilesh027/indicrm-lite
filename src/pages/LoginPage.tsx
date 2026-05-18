import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://digitalness-backend.onrender.com/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Enter email and password',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Login Failed',
          description: data.message || 'Invalid credentials',
          variant: 'destructive',
        });
        return;
      }

      // ✅ Save token + user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: 'Login Success',
        description: `Welcome ${data.user.name}`,
      });
// remove duplicate localStorage lines

localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));

const roleRoutes: Record<string, string> = {
  Admin: "/dashboard",
  "Operational Manager": "/employees",
  "Performance Marketer": "/performance",
  "Content Writer": "/tasks",
  "Graphic Designer": "/tasks",
  "UI/UX": "/works",
  "Frontend Dev": "/works",
  "Backend Dev": "/works",
  BDE: "/leads",
  Support: "/tickets",
};

navigate(roleRoutes[data.user.role] || "/dashboard", { replace: true });    } catch (error) {
      toast({
        title: 'Server Error',
        description: 'Backend not running',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md p-6 bg-card rounded-xl border shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Digitalness CRM Login
        </h2>

        <div className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </div>
    </div>
  );
}