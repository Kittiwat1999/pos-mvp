import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BrandBadge } from '@/components/common/BrandBadge';
import BackendHealth from '@/components/common/BackendHealth';

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10"><BrandBadge /></div>

        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Restaurant operations, simplified.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          A clean starter frontend for the POS and QR-ordering workflow, built with React,
          Vite, Tailwind CSS, and shadcn/ui components.
        </p>

        <div className="mt-4"><BackendHealth /></div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg">Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
