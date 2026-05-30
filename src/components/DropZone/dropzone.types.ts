export type DropPhase =
  | "idle"
  | "dragover"
  | "dropping" // flip + scan beam + particle burst + terminal log
  | "success"
  | "error";

export interface TerminalStep {
  /** ms offset within the dropping choreography. */
  at: number;
  text: string;
}
