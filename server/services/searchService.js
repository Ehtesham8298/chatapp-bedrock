const DDG = require('duck-duck-scrape');

async function webSearch(query, numResults = 5) {
  try {
    const results = await DDG.search(query, { safeSearch: DDG.SafeSearchType.MODERATE });

    if (!results || !results.results || results.results.length === 0) {
      return null;
    }

    const topResults = results.results.slice(0, numResults).map((r, i) => ({
      position: i + 1,
      title: r.title,
      url: r.url,
      snippet: r.description,
    }));

    // Format as context string for Claude
    const contextText = topResults.map(r =>
      `[${r.position}] ${r.title}\nURL: ${r.url}\n${r.snippet}`
    ).join('\n\n');

    return {
      results: topResults,
      contextText,
      query,
    };
  } catch (err) {
    console.error('Search error:', err);
    return null;
  }
}

module.exports = { webSearch };
