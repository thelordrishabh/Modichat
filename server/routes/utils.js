const router = require('express').Router();
const auth = require('../middleware/auth');

router.get('/link-preview', auth, async (req, res) => {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) return res.status(400).json({ message: 'url query is required' });

    const targetUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const response = await fetch(targetUrl, { method: 'GET' });
    const html = await response.text();

    const readMeta = (propertyName) => {
      const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["']`, 'i');
      const match = html.match(pattern);
      return match?.[1] || '';
    };

    const title = readMeta('og:title') || (html.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
    const description = readMeta('og:description') || readMeta('description');
    const image = readMeta('og:image');

    res.json({ title, description, image, url: targetUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/music/search', auth, async (req, res) => {
  try {
    const term = req.query.q?.trim();
    if (!term) return res.json([]);
    const response = await fetch(`https://itunes.apple.com/search?media=music&limit=10&term=${encodeURIComponent(term)}`);
    const data = await response.json();
    const tracks = (data.results || []).map((track) => ({
      title: track.trackName,
      artist: track.artistName,
      previewUrl: track.previewUrl
    }));
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
