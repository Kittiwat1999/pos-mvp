import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const settingsLinks = [
  { label: "Restaurant profile", path: "/settings/restaurant-profile", active: true },
  { label: "Tables", path: "/tables", active: false },
  { label: "Tax & discounts", path: "/settings/tax", active: false },
  { label: "Payment methods", path: "/settings/payment-methods", active: false },
  { label: "Staff & roles", path: "/settings/staff", active: false },
];

export default function SettingsSidebar() {
  return (
    <aside className="h-fit rounded-xl border border-border bg-card p-2 lg:sticky lg:top-6">
      <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Configure
      </p>
      <nav className="space-y-1" aria-label="Settings navigation">
        {settingsLinks.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
              item.active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            {item.active ? <Check className="size-4" /> : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}