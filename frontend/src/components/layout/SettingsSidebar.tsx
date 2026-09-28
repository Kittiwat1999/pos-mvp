import { Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const settingsLinks = [
  { label: "Restaurant profile", path: "/settings/restaurant-profile" },
  { label: "Tables", path: "/settings/tables" },
  { label: "Tax & discounts", path: "/settings/tax" },
  { label: "Payment methods", path: "/settings/payment-methods" },
  { label: "Staff & roles", path: "/settings/staff" },
];

export default function SettingsSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="h-fit rounded-xl border border-border bg-card p-2 lg:sticky lg:top-6">
      <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Configure
      </p>
      <nav className="space-y-1" aria-label="Settings navigation">
        {settingsLinks.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>{item.label}</span>
              {active ? <Check className="size-4" /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}