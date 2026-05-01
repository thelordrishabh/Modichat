const router = require('express').Router();
const auth = require('../middleware/auth');

const INSTAGRAM_BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: '*/*'
};

const sanitizeInstagramHandle = (value = '') =>
  value
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const decodeJsonEscaped = (value = '') => {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value;
  }
};

const parseInstagramProfileFromHtml = (html, requestedUsername) => {
  const normalized = sanitizeInstagramHandle(requestedUsername);
  const usernamePattern = new RegExp(`\"username\":\"${escapeRegex(normalized)}\"`, 'i');
  if (!usernamePattern.test(html)) return null;

  const username = html.match(/"username":"([^"]+)"/)?.[1] || normalized;
  const fullNameRaw = html.match(/"full_name":"([^"]*)"/)?.[1] || username;
  const profilePicRaw =
    html.match(/"profile_pic_url_hd":"([^"]+)"/)?.[1] ||
    html.match(/"profile_pic_url":"([^"]+)"/)?.[1] ||
    '';
  const isVerified = html.match(/"is_verified":(true|false)/)?.[1] === 'true';
  const id = html.match(/"id":"(\d+)"/)?.[1] || null;

  return {
    username,
    fullName: decodeJsonEscaped(fullNameRaw),
    profilePicUrl: decodeJsonEscaped(profilePicRaw).replace(/\\u0026/g, '&'),
    isVerified,
    id
  };
};

const fetchInstagramProfile = async (username) => {
  const response = await fetch(
    `https://www.instagram.com/${encodeURIComponent(username)}/`,
    {
      method: 'GET',
      headers: INSTAGRAM_BASE_HEADERS
    }
  );

  if (!response.ok) return null;
  const html = await response.text();
  return parseInstagramProfileFromHtml(html, username);
};

router.get('/instagram/search', async (req, res) => {
  try {
    const rawQuery = req.query.q || '';
    const query = sanitizeInstagramHandle(rawQuery);
    if (query.length < 2) return res.json([]);

    const searchResponse = await fetch(
      `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: INSTAGRAM_BASE_HEADERS
      }
    );

    let candidates = [];
    if (searchResponse.ok) {
      const raw = await searchResponse.text();
      try {
        const searchPayload = JSON.parse(raw);
        candidates = (searchPayload?.users || [])
          .map((entry) => sanitizeInstagramHandle(entry?.user?.username || ''))
          .filter(Boolean)
          .slice(0, 8);
      } catch {
        candidates = [];
      }
    }
    if (!candidates.includes(query)) candidates.unshift(query);

    // Verify each candidate using profile metadata to prevent invalid handles.
    const verifiedProfiles = await Promise.all(candidates.map((username) => fetchInstagramProfile(username)));
    const unique = new Map();
    verifiedProfiles.filter(Boolean).forEach((profile) => {
      const key = profile.username.toLowerCase();
      if (!unique.has(key)) unique.set(key, profile);
    });

    res.json(Array.from(unique.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/instagram/profile', async (req, res) => {
  try {
    const handle = sanitizeInstagramHandle(req.query.username || '');
    if (!handle) {
      return res.status(400).json({ message: 'username query is required' });
    }

    const profile = await fetchInstagramProfile(handle);
    if (!profile) {
      return res.status(404).json({ message: 'Instagram profile not found' });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
