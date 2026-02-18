/**
 * Gebruik utilities for wizard forms.
 * Fetches gebruik by afnemer and derives related entity IDs (e.g. module IDs).
 */

/**
 * Fetches gebruik for an afnemer (organisation) and returns the set of module IDs
 * referenced by those gebruik objects. Used to limit applicatie dropdowns to
 * applications in the organisation's gebruik (Gemeente/Samenwerking flows).
 *
 * @param {string} apiBaseUrl - Base URL for the API (e.g. from commongroundApiUrl())
 * @param {string} afnemerId - Organisation UUID/id to filter by (afnemer)
 * @returns {Promise<string[]>} Unique list of module IDs from the organisation's gebruik
 */
export async function fetchModuleIdsFromGebruikByAfnemer(apiBaseUrl, afnemerId) {
  if (!afnemerId) return [];
  const url = `${apiBaseUrl}/softwarecatalog/api/gebruik?afnemer=${encodeURIComponent(
    String(afnemerId)
  )}&_limit=1000&_extend[]=_schema`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  const ids = new Set();
  for (const item of results) {
    const rel = item?.['@self']?.relations?.module ?? item?.module;
    if (rel == null) continue;
    const id =
      typeof rel === 'string'
        ? rel.trim()
        : String(rel?.id ?? rel?.value ?? rel?.['@self']?.id ?? '').trim();
    if (id) ids.add(id);
  }
  return Array.from(ids);
}
