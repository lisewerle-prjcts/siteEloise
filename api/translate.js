module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { texts } = req.body || {};
  if (!Array.isArray(texts) || !texts.length) {
    return res.status(400).json({ error: 'texts array required' });
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Translation service not configured' });
  }
  const host = apiKey.trim().endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';

  async function translateTo(targetLang) {
    var indices = [];
    var nonEmpty = [];
    texts.forEach(function (txt, i) {
      if (txt && String(txt).trim()) { indices.push(i); nonEmpty.push(String(txt)); }
    });
    var result = texts.map(function () { return ''; });
    if (!nonEmpty.length) return result;

    var params = new URLSearchParams();
    nonEmpty.forEach(function (txt) { params.append('text', txt); });
    params.append('target_lang', targetLang);
    params.append('source_lang', 'FR');

    const r = await fetch('https://' + host + '/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': 'DeepL-Auth-Key ' + apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error('DeepL ' + targetLang + ' error: ' + errText);
    }
    const data = await r.json();
    (data.translations || []).forEach(function (item, j) { result[indices[j]] = item.text; });
    return result;
  }

  try {
    const [de, en] = await Promise.all([translateTo('DE'), translateTo('EN-GB')]);
    return res.status(200).json({ de: de, en: en });
  } catch (e) {
    console.error('Translate error:', e);
    return res.status(500).json({ error: 'Translation failed' });
  }
};
