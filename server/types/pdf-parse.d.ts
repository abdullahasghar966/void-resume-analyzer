// pdf-parse ships no types for its deep lib entry. We import the lib directly
// (not the package index) to skip its debug harness that reads a bundled test
// PDF at import time. Minimal ambient declaration for what we actually use.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  }
  function pdf(
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PdfParseResult>;
  export default pdf;
}
