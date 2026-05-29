import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { AlertCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { ApiError } from "@/shared/lib/http";

type ErrorComponentProps = { error: unknown; reset?: () => void };

export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  const isApiError = error instanceof ApiError;
  const message = error instanceof Error ? error.message : String(error);

  return (
    <Alert variant="destructive" aria-live="polite">
      <AlertCircle aria-hidden className="h-4 w-4" />
      <AlertTitle>
        {isApiError ? "Erreur API" : "Erreur de chargement"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        <div className="flex gap-2">
          {reset && (
            <Button size="sm" variant="outline" onClick={reset}>
              <RefreshCcw aria-hidden className="h-3.5 w-3.5 mr-2" /> Réessayer
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link to="/">
              <ArrowLeft aria-hidden className="h-3.5 w-3.5 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function RouteNotFound() {
  return (
    <Alert variant="destructive" aria-live="polite">
      <AlertCircle aria-hidden className="h-4 w-4" />
      <AlertTitle>Page introuvable</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>La page demandée n’existe pas.</p>
        <Button asChild size="sm" variant="outline">
          <Link to="/">
            <ArrowLeft aria-hidden className="h-3.5 w-3.5 mr-2" />
            Retour à la liste
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
