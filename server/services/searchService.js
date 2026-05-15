const { tavily } = require('@tavily/core');

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function webSearch(query, numResults = 6) {
  try {
    const response = await client.search(query, {
      searchDepth: 'advanced',
      maxResults: numResults,
      includeAnswer: true,
      includeRawContent: false,
    });

    if (!response || !response.results || response.results.length === 0) {
      return null;
    }

    const results = response.results.map((r, i) => ({
      position: i + 1,
      title: r.title,
      url: r.url,
      snippet: r.content,
      publishedDate: r.publishedDate || null,
    }));

    // Build context: Tavily's own AI answer first, then sources
    let contextText = '';
    if (response.answer) {
      contextText += `Quick Answer: ${response.answer}\n\n`;
    }
    contextText += results.map(r => {
      const date = r.publishedDate ? ` (${r.publishedDate})` : '';
      return `[${r.position}] ${r.title}${date}\nURL: ${r.url}\n${r.snippet}`;
    }).join('\n\n');

    return { results, contextText, query, answer: response.answer || null };
  } catch (err) {
    console.error('Tavily search error:', err.message);
    return null;
  }
}

async function fetchUrl(url) {
  try {
    const response = await client.extract([url], {
      extractDepth: 'advanced',
    });

    if (!response || !response.results || response.results.length === 0) {
      return null;
    }

    const page = response.results[0];
    return {
      url: page.url,
      rawContent: page.rawContent?.slice(0, 8000) || '',
    };
  } catch (err) {
    console.error('Tavily extract error:', err.message);
    return null;
  }
}

module.exports = { webSearch, fetchUrl };
