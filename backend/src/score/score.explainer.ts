import { Injectable } from '@nestjs/common';
import type {
  AugmentedCase,
  RedFlag,
  ScoreBullet,
  ScoreExplanation,
  Severity,
  Theme,
} from '../cases/types';
import { RuleEngine, THEMES, type RuleInput } from '../rule-engine/rule-engine';

const BULLET_ORDER: Theme[] = ['profitability', 'debt', 'cash'];
const SEVERITY_RANK: Record<Severity, number> = { high: 2, medium: 1, low: 0 };

function severest(flags: RedFlag[]): RedFlag | undefined {
  return flags
    .slice()
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
}

@Injectable()
export class ScoreExplainer {
  constructor(private readonly engine: RuleEngine = new RuleEngine()) {}

  explain(case_: AugmentedCase, redFlags: RedFlag[]): ScoreExplanation {
    const input: RuleInput = {
      fin: case_.financialIndicators,
      bank: case_.bankFlows,
      financingType: case_.financing_request.type,
      factoring: case_.factoringIndicators,
    };
    const bullets: ScoreBullet[] = BULLET_ORDER.map((theme) => {
      const inTheme = redFlags.filter((f) => f.theme === theme);
      const top = severest(inTheme);
      return {
        text: top ? top.explanation : THEMES[theme].whenAllGreen(input),
        ruleCodes: this.engine.rulesForTheme(theme),
      };
    });
    return { bullets };
  }
}
