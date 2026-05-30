import { Component, type ReactNode } from "react";

interface Props {
  /** Short name for logs / dev overlay (e.g. "WebGL", "ScoreMatrix"). */
  label: string;
  /** Rendered instead of children when they throw. Defaults to nothing. */
  fallback?: ReactNode;
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Isolates a subtree so one failing module can't blank the whole app. A WebGL
 * crash, for instance, should never take the résumé tooling down with it.
 * In dev it surfaces the message; in prod it shows the (quiet) fallback.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label}]`, error);
  }

  render(): ReactNode {
    if (this.state.error) {
      if (import.meta.env.DEV) {
        return (
          <div className="glass-deep m-4 rounded-xl border border-danger-red/40 p-4">
            <div className="terminal text-danger-red">
              ⚠ {this.props.label} failed to render
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs text-void-muted">
              {this.state.error.message}
            </pre>
          </div>
        );
      }
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
