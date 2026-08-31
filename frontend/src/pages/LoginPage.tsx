import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandBadge } from '@/components/common/BrandBadge';
import DemoCredentials from '@/components/auth/DemoCredentials';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      storeLogin(result.access_token, username);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border shadow-2xl lg:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-br from-primary/20 via-card to-background p-8 md:p-10">
          <div>
            <BrandBadge />
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Manage tables, orders, menu items, and daily operations from one place.
            </p>
          </div>

          <DemoCredentials />
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Staff portal</p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">Sign in</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-muted-foreground">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
