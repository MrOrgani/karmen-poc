import type { ReactNode } from 'react';
import { Card } from '@/shared/ui/card';

type Props = {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, icon, badge, children }: Props) {
  return (
    <Card className="border-karmen-border-blue/60 p-4 h-full">
      <div className="flex items-center gap-2 min-w-0 mb-3">
        {icon}
        <h2 className="font-semibold text-karmen-ink truncate">{title}</h2>
        {badge}
      </div>
      <div>{children}</div>
    </Card>
  );
}
