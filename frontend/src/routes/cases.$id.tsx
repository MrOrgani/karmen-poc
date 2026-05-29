/* eslint-disable react-refresh/only-export-components -- TanStack file-based route exports `Route` alongside the component */
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getCaseQueryOptions } from "@/features/cases/hooks/query-options";
import { CaseCockpit } from "@/features/cases/components/case-cockpit";
import { RoutePending } from "@/shared/components/route-pending";
import { ApiError } from "@/shared/lib/http";

export const Route = createFileRoute("/cases/$id")({
  component: CasePage,
  pendingComponent: RoutePending,
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(getCaseQueryOptions(params.id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  },
});

function CasePage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(getCaseQueryOptions(id));
  return <CaseCockpit case={data} caseId={id} />;
}
