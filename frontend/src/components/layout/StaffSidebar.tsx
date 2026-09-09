import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";

const navItems = [
  { name: "Overview", path: "/dashboard" },
  { name: "Tables", path: "/tables" },
  { name: "Incoming Orders", path: "/incoming-orders" },
  { name: "Products", path: "/products" },
  { name: "Customers", path: "/" },
  { name: "Settings", path: "/" },
];

type StaffSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function StaffSidebar({
  className,
  onNavigate,
}: StaffSidebarProps) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "flex w-72 max-w-full flex-col border-r border-border bg-card p-6",
        className,
      )}
    >
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
          <Link
            key={item.name}
            to={item.path}
            onClick={onNavigate}
            className={buttonVariants({
              variant: "ghost",
              className: "w-full justify-between",
            })}
          >
            <span>{item.name}</span>
            <span className="text-xs text-muted-foreground">0{index + 1}</span>
          </Link>
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

      <div className="mt-auto space-y-3 border-t border-border pt-6">
        <div className="rounded-md border border-border bg-background px-3 py-2">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="truncate text-sm font-medium">{username ?? "Staff"}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  );
}
