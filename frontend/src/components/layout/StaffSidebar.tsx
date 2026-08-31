import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const navItems = ['Overview', 'Tables', 'Orders', 'Products', 'Customers', 'Settings'];

export default function StaffSidebar() {
  return (
    <aside className="hidden w-72 border-r border-border bg-card p-6 lg:block">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-lg font-bold text-primary">
          P
        </div>
        <div>
          <p className="text-lg font-semibold">POS MVP</p>
          <p className="text-xs text-muted-foreground">Staff Console</p>
        </div>
      </div>

      <nav className="mt-10 space-y-2" aria-label="Staff navigation">
        {navItems.map((item, index) => (
          item === 'Products' || item === 'Tables' ? (
            <Link key={item} to={item === 'Products' ? '/products' : '/tables'} className={buttonVariants({ variant: 'ghost', className: 'w-full justify-between' })}>
              <span>{item}</span><span className="text-xs text-muted-foreground">0{index + 1}</span>
            </Link>
          ) : (
            <Button key={item} variant={index === 0 ? 'default' : 'ghost'} className="w-full justify-between">
              <span>{item}</span>
              <span className="text-xs text-muted-foreground">0{index + 1}</span>
            </Button>
          )
        ))}
      </nav>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="text-sm">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">฿8,420</p>
          <p className="mt-1 text-sm text-muted-foreground">Sales so far</p>
        </CardContent>
      </Card>
    </aside>
  );
}
