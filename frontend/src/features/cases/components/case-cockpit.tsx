import { useEffect } from "react";
import { RuleHighlightProvider } from "@/features/cases/hooks/use-rule-highlight";
import { BankFlowsCard } from "./bank-flows-card";
import { CaseHeader } from "./case-header";
import { CompletenessSection } from "./completeness-section";
import { FinancialIndicators } from "./financial-indicators";
import { RulesDiagnostic } from "./rules-diagnostic";
import { DecisionPanel } from "@/features/decisions/components/decision-panel";
import type { CaseCockpit } from "@/shared/types";
import { track } from "@/shared/lib/track";

type Props = {
  case: CaseCockpit;
  caseId: string;
};

export function CaseCockpit({ case: cockpit, caseId }: Props) {
  useEffect(() => {
    track("case.opened", caseId);
  }, [caseId]);

  return (
    <RuleHighlightProvider>
      <div className="space-y-4">
        <CaseHeader case={cockpit.caseData} />
        <CompletenessSection
          completeness={cockpit.completeness}
          documents={cockpit.caseData.documents}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FinancialIndicators
            fin={cockpit.caseData.financialIndicators}
            thresholds={cockpit.financialThresholds}
            statuses={cockpit.metricStatuses}
          />
          <BankFlowsCard
            bank={cockpit.caseData.bankFlows}
            thresholds={cockpit.financialThresholds}
            statuses={cockpit.metricStatuses}
            coverage={cockpit.dataCoverage}
          />
        </div>
        <RulesDiagnostic items={cockpit.rulesDiagnostic} />
        <DecisionPanel
          score={cockpit.caseData.score}
          explanation={cockpit.scoreExplanation}
        />
      </div>
    </RuleHighlightProvider>
  );
}
