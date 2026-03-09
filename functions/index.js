const { onRequest } = require("firebase-functions/v2/https");

/**
 * Proxy for the USITC HTS REST API.
 * Avoids CORS issues when calling from the browser.
 */
exports.htsProxy = onRequest({ cors: true }, async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    res.status(400).json({ error: "Missing 'keyword' parameter" });
    return;
  }

  try {
    const url = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `USITC API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    res.set("Cache-Control", "public, max-age=3600");
    res.json(data);
  } catch (err) {
    console.error("USITC proxy error:", err);
    res.status(500).json({ error: "Failed to fetch from USITC" });
  }
});
