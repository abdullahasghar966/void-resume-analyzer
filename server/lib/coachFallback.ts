import type { ChatContextDTO } from "../schemas";

/**
 * Builds the résumé-aware system prompt for the real LLM (brief: "context
 * awareness — CRITICAL"). The model is told exactly what we know about this
 * specific résumé so its advice is concrete, not generic.
 */
export function buildSystemPrompt(ctx: ChatContextDTO): string {
  const s = ctx.scores;
  return [
    "You are a senior career coach who has analysed the user's résumé.",
    "Be direct, tactical, and concrete. Reference their actual numbers.",
    "Keep replies under ~180 words unless the user asks for more.",
    "",
    "RÉSUMÉ:",
    ctx.resumeText ? ctx.resumeText.slice(0, 8000) : "(not provided)",
    "",
    "TARGET JOB DESCRIPTION:",
    ctx.jobDescription ? ctx.jobDescription.slice(0, 3000) : "(not provided)",
    "",
    s
      ? `CURRENT SCORES — ATS ${s.overall}/100 · Impact ${s.impact} · Keywords ${s.keywords} · Formatting ${s.formatting} · Completeness ${s.completeness}`
      : "SCORES: (not computed yet)",
    s && s.topIssues.length ? `TOP ISSUES: ${s.topIssues.join("; ")}` : "",
    ctx.missingKeywords.length
      ? `MISSING JD KEYWORDS: ${ctx.missingKeywords.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * No-API-key coach. Produces a genuinely useful, résumé-specific answer from
 * the computed analysis (scores, issues, strengths, missing keywords) via
 * light intent-matching. Streamed token-by-token so the UI behaves identically
 * to the real model. Replaced by GPT-4o the moment a key is present.
 */
export function coachAnswer(userMessage: string, ctx: ChatContextDTO): string {
  const q = userMessage.toLowerCase();
  const s = ctx.scores;

  if (!ctx.resumeText) {
    return "Upload a résumé first and I'll coach you on it specifically — drop a PDF, DOCX, or TXT into the deck above. I'll then break down your impact, keywords, formatting, and completeness, and tell you exactly what to fix.";
  }

  const entries: [string, number][] = s
    ? [
        ["impact", s.impact],
        ["keywords", s.keywords],
        ["formatting", s.formatting],
        ["completeness", s.completeness],
      ]
    : [];
  const sub = entries.length
    ? [...entries].sort((a, b) => a[1] - b[1])
    : null;
  const weakest = sub ? sub[0] : null;

  // ── biggest weakness ──
  if (q.includes("weak") || q.includes("worst") || q.includes("problem")) {
    if (!s) return "I haven't scored your résumé yet — scroll to the Score Matrix to generate it, then ask again.";
    return `Your weakest dimension is ${weakest![0]} at ${weakest![1]}/100. ${s.topIssues[0] ?? "Tighten the wording and quantify outcomes."} ${s.topIssues[1] ?? ""} Fix that first — it's the fastest lift to your ${s.overall}/100 overall.`;
  }

  // ── missing keywords ──
  if (q.includes("keyword") || q.includes("missing")) {
    if (ctx.missingKeywords.length) {
      return `Against the target role you're missing: ${ctx.missingKeywords.join(", ")}. Work the genuine ones into your experience bullets and skills section using the same wording as the job description — ATS filters match literally. Don't keyword-stuff; show each with a concrete result.`;
    }
    return "Paste a job description into the Semantic Matcher and I'll list the exact keywords you're missing for that role. Right now I don't have a target to compare against.";
  }

  // ── improve score ──
  if (q.includes("improve") || q.includes("90") || q.includes("higher") || q.includes("better") || q.includes("raise")) {
    if (!s) return "Generate your score first (scroll to the Score Matrix), then I'll give you a ranked plan to raise it.";
    const steps = s.topIssues.slice(0, 3).map((i, n) => `${n + 1}. ${i}`).join("  ");
    return `You're at ${s.overall}/100. To push higher, in order: ${steps || "quantify results, add strong action verbs, and surface clear sections."} Each quantified bullet (numbers, %, $) and matched keyword moves the needle most.`;
  }

  // ── rewrite summary ──
  if (q.includes("summary") || q.includes("rewrite") || q.includes("profile")) {
    const str = s?.topStrengths[0] ?? "your strongest, most quantified achievement";
    return `Lead with a 2-3 line summary built around ${str}. Formula: [Seniority + role] who [signature outcome with a number] across [domain]. Drop generic adjectives ("hard-working", "team player") — replace them with a metric. Mirror the target job title in the first line so ATS and recruiters lock on immediately.`;
  }

  // ── recruiter view ──
  if (q.includes("recruiter") || q.includes("think") || q.includes("impression")) {
    if (!s) return "Once I've scored your résumé I can tell you what a recruiter would notice in their 7-second scan. Generate the score first.";
    return `In a 7-second scan a recruiter sees your ${s.overall}/100 shape: ${s.topStrengths[0] ?? "some solid wins"} stands out, but ${s.topIssues[0]?.toLowerCase() ?? "weak quantification"} would give them pause. Make your top achievement and target title impossible to miss in the first third of page one.`;
  }

  // ── tailor ──
  if (q.includes("tailor") || q.includes("specific role") || q.includes("this job")) {
    const miss = ctx.missingKeywords.length ? ` Start by working in: ${ctx.missingKeywords.slice(0, 6).join(", ")}.` : " Paste the job description in the Semantic Matcher so I can target it precisely.";
    return `Tailoring means re-ordering and re-wording, not rewriting. Move the most relevant experience up, mirror the role's exact phrasing, and cut bullets that don't serve this job.${miss}`;
  }

  // ── strengths ──
  if (q.includes("strength") || q.includes("good") || q.includes("working")) {
    if (s?.topStrengths.length) return `What's working: ${s.topStrengths.join("; ")}. Lean into these — they're your differentiators. Make sure each appears in the top third of page one where attention is highest.`;
    return "Once scored, I'll highlight exactly what's already working so you can amplify it.";
  }

  // ── default ──
  if (s) {
    return `Your résumé scores ${s.overall}/100. Biggest strength: ${s.topStrengths[0] ?? "solid foundation"}. Biggest opportunity: ${s.topIssues[0] ?? "more quantified impact"}. Ask me about your weakest area, missing keywords, or how to reach 90+ and I'll get specific.`;
  }
  return "I've got your résumé. Scroll to the Score Matrix to generate your ATS score, then ask me about your weaknesses, missing keywords, or how to improve — I'll be specific to your document.";
}
