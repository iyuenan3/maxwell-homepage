/** Shared by online retrieval, full builds, and index-only migration. */
export function assertVector(vector, dimensions) {
  if (!Array.isArray(vector) || vector.length !== dimensions ||
      !vector.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("Embedding vector dimension or values invalid");
  }
  const norm = vector.reduce((sum, value) => sum + value * value, 0);
  if (!Number.isFinite(norm) || norm === 0) throw new Error("Embedding vector norm invalid");
}

export function assertEmbeddingIndex(index) {
  if (!index || typeof index.model !== "string" || !index.model ||
      !Number.isSafeInteger(index.dim) || index.dim <= 0 ||
      !Array.isArray(index.chunks) || !index.chunks.length ||
      index.count !== index.chunks.length) {
    throw new Error("Embedding index metadata invalid");
  }
  for (const chunk of index.chunks) {
    if (!chunk || !["id", "source", "section", "text"].every((key) => typeof chunk[key] === "string") ||
        !chunk.text.trim()) throw new Error("Embedding index chunk invalid");
    assertVector(chunk.vector, index.dim);
  }
}

export function assertIndexMatchesConfig(index, config) {
  if (index.model !== config.model || index.dim !== config.dimensions) {
    throw new Error("Embedding index model/dimension mismatch; rebuild before retrieval");
  }
}

/** @param {{baseUrl:string, apiKey:string, model:string, dimensions:number}} config
 * @param {string | string[]} input
 * @param {{timeoutMs?:number}} options
 * @returns {Promise<number[][]>}
 */
export async function requestEmbeddings(config, input, { timeoutMs = 10_000 } = {}) {
  const inputs = Array.isArray(input) ? input : [input];
  if (!inputs.length) return [];
  if (!config.baseUrl || !config.apiKey || !config.model ||
      !Number.isSafeInteger(config.dimensions) || config.dimensions <= 0) {
    throw new Error("Embedding configuration missing or invalid");
  }
  if (!inputs.every((text) => typeof text === "string" && text.trim())) {
    throw new Error("Embedding input must contain nonempty strings");
  }
  const res = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, input: inputs,
      dimensions: config.dimensions, encoding_format: "float" }),
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "error",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const rawCode = body.error?.code || body.code;
    const code = typeof rawCode === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(rawCode)
      ? rawCode : "upstream_error";
    const error = new Error(`Embedding API ${res.status}: ${code}`);
    Object.assign(error, { status: res.status });
    throw error;
  }
  const body = await res.json().catch(() => { throw new Error("Embedding response JSON invalid"); });
  if (body.model && body.model !== config.model) throw new Error("Embedding response model mismatch");
  if (!Array.isArray(body.data) || body.data.length !== inputs.length) {
    throw new Error("Embedding response count mismatch");
  }
  const rows = [...body.data].sort((a, b) => a?.index - b?.index);
  return rows.map((row, i) => {
    if (row?.index !== i) throw new Error("Embedding response indices invalid");
    assertVector(row.embedding, config.dimensions);
    return row.embedding;
  });
}
