import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getCasesQueryOptions } from '@/features/cases/hooks/query-options';
import { CaseList } from '@/features/cases/components/case-list';
import { RoutePending } from '@/shared/components/route-pending';

export const Route = createFileRoute('/')({
  component: CasesPage,
  pendingComponent: RoutePending,
  loader: ({ context }) => context.queryClient.ensureQueryData(getCasesQueryOptions()),
});

function CasesPage() {
  const { data: cases } = useSuspenseQuery(getCasesQueryOptions());
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-karmen-blue font-semibold">
          Analyst pipeline
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-karmen-marine mt-2 tracking-tight">
          Cases pipeline
        </h1>
        <p className="text-sm text-karmen-mute mt-3 max-w-prose">
          Select a case to open its unified cockpit: completeness, score,
          financial indicators and red flags in a single view.
        </p>
      </header>
      <CaseList cases={cases} />
    </div>
  );
}
