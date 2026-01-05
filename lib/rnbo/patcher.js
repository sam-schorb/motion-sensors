export async function fetchJson(url, { signal } = {}) {
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`fetch failed (${resp.status}) for ${url}`);
  return await resp.json();
}

export async function loadPatcherFromUrl(url, { signal } = {}) {
  return await fetchJson(url, { signal });
}

