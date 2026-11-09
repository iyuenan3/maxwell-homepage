// Shared P0 rules. Real employer terms and private slugs are supplied only by env.
const JOB_INTERVIEW_CHUNK_FILTER = /面试|面经|面试官|面试题|面试录音|求职|找工作|应聘|招聘|投简历|投了几家|在面|跳槽|HR\s*面|CEO\s*面|终面|一面|二面|三面|谈薪|薪资期望|期望薪资|当前薪资|\bOffer\b|BOSS\s*直聘|招呼语|offerhelper/i;
const JOB_INTERVIEW_SOURCE_BLACKLIST = [/^wiki:jobs-hunt$/, /^wiki:offerhelper$/];
const FILTER_EXEMPT_SOURCES = new Set(["resume", "home-data", "detail"]);

export function hasJobInterviewContent(text) {
  return JOB_INTERVIEW_CHUNK_FILTER.test(text);
}
export function isJobInterviewSource(source) {
  return JOB_INTERVIEW_SOURCE_BLACKLIST.some((pattern) => pattern.test(source));
}
function envList(name) {
  return (process.env[name] || "").split(",").map((value) => value.trim()).filter(Boolean);
}
export function hasEmployerConfidential(text) {
  const normalized = text.toLowerCase();
  return envList("EMPLOYER_CONFIDENTIAL_TERMS").some((term) => normalized.includes(term.toLowerCase()));
}
export function isPrivateSource(source) {
  return envList("PRIVATE_SOURCE_SLUGS").some((slug) => source === "wiki:" + slug);
}

// Index-only migration adds a local egress check; it never edits source text.
export function indexExportIssue(chunk) {
  if ((chunk.needs_sanitize && chunk.sanitized !== true) || chunk.sanitize_error) return "unsanitized";
  const text = chunk.section + "\n" + chunk.text;
  if (isPrivateSource(chunk.source) || hasEmployerConfidential(text)) return "employer";
  if (isJobInterviewSource(chunk.source)) return "job_source";
  if (!FILTER_EXEMPT_SOURCES.has(chunk.source.split(":")[0]) && hasJobInterviewContent(text)) return "job_content";
  if (/\b(?:sk-[A-Za-z0-9_-]{20,}|ark-[A-Za-z0-9-]{30,})\b/.test(text)) return "credential";
  if (/(?<![0-9])1[3-9]\d{9}(?![0-9])/.test(text)) return "phone";
  if (/\b\d{17}[\dXx]\b/.test(text)) return "id_card";
  return null;
}
