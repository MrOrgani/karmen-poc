import type { ReactNode } from "react";
import { Card } from "@/shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type Props = {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
}: Props) {
  return (
    <Card className="overflow-hidden border-karmen-border-blue/60">
      <Collapsible defaultOpen={defaultOpen} className="group">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-left hover:bg-karmen-pale-blue/60 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karmen-blue focus-visible:ring-inset">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <span className="font-semibold text-karmen-ink truncate">
              {title}
            </span>
            {badge}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-karmen-mute transition-transform duration-200 motion-reduce:transition-none",
              "group-data-[state=open]:rotate-180",
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 pt-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
