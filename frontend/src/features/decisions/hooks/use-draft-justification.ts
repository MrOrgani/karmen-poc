import { useMutation } from "@tanstack/react-query";
import {
  draftJustification,
  type JustificationDirection,
  type JustificationDraft,
} from "../api";

// On-demand: the analyst explicitly asks the AI to pre-draft a justification
// for the direction they are leaning towards (✨ menu). Not a query — it fires per click.
export function useDraftJustification(caseId: string) {
  return useMutation<JustificationDraft, Error, JustificationDirection>({
    mutationFn: (direction) => draftJustification(caseId, direction),
  });
}
