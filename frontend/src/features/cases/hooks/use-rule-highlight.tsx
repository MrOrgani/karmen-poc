import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const HIGHLIGHT_DURATION_MS = 1800;

type ContextValue = {
  highlightedCodes: ReadonlySet<string>;
  highlight: (codes: string[]) => void;
};

const Ctx = createContext<ContextValue | null>(null);

export function RuleHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedCodes, setHighlightedCodes] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const highlight = useCallback((codes: string[]) => {
    if (codes.length === 0) return;
    setHighlightedCodes(new Set(codes));
    const target = document.getElementById(`rule-${codes[0]}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setHighlightedCodes(new Set());
      timerRef.current = null;
    }, HIGHLIGHT_DURATION_MS);
  }, []);

  const value = useMemo<ContextValue>(
    () => ({ highlightedCodes, highlight }),
    [highlightedCodes, highlight],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHighlight(): (codes: string[]) => void {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHighlight requires <RuleHighlightProvider>");
  return ctx.highlight;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHighlightedCodes(): ReadonlySet<string> {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useHighlightedCodes requires <RuleHighlightProvider>");
  return ctx.highlightedCodes;
}
