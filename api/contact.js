module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, clientEmail, subject, message, type, service, location, date, time, duration, price, phone, notes } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const isBooking = type === 'booking';
  const isConfirm = type === 'confirm';

  // Handle confirm type: send confirmation email to client and return
  if (isConfirm) {
    const confirmClientEmail = clientEmail || email;
    if (!confirmClientEmail) return res.status(200).json({ ok: true });
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set — confirm email not sent');
      return res.status(200).json({ ok: true, warn: 'no_api_key' });
    }
    const confirmHtml = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2C2A">
        <div style="background:#C8B89A;padding:32px 40px;border-radius:12px 12px 0 0">
          <h1 style="color:#FBF5ED;font-size:24px;margin:0;font-weight:400">Votre rendez-vous est confirmé ✓</h1>
          <p style="color:#F0DECF;margin:6px 0 0;font-size:14px">Eloïse Werle — eloisewerle.com</p>
        </div>
        <div style="background:#FDFAF5;padding:32px 40px;border:1px solid #E8E0D5;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:1.05rem;margin:0 0 24px">Bonjour ${name},<br><br>Votre rendez-vous est bien confirmé. À très bientôt !</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em;width:40%">Soin</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;font-weight:600">${service || '—'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Lieu</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${location || '—'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Date</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${date || '—'}${time ? ' à ' + time : ''}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Durée</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${duration ? duration + ' min' : '—'}</td></tr>
            <tr><td style="padding:10px 0;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Total</td><td style="padding:10px 0;font-weight:700;font-size:18px;color:#C8B89A">${price ? price + ' €' : '—'}</td></tr>
          </table>
          <p style="margin-top:28px;color:#7C6E5F;font-size:13px">Pour toute modification, contactez-moi en direct. Le règlement se fait sur place. Prévoyez une tenue décontractée et qui ne craint pas l'huile.</p>
        </div>
      </div>`;
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Eloïse Werle <hello@eloisewerle.com>',
          to: [confirmClientEmail],
          reply_to: 'eloiserose.werle@gmail.com',
          subject: `Votre rendez-vous est confirmé — ${service || 'séance'}`,
          html: confirmHtml,
        }),
      });
    } catch(e) { console.error('Confirm email error:', e); }
    return res.status(200).json({ ok: true });
  }

  const emailSubject = isBooking
    ? `Nouvelle demande de réservation — ${name}`
    : `Contact eloisewerle.com — ${subject || name}`;

  const html = isBooking ? `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2C2A">
      <div style="background:#C8B89A;padding:32px 40px;border-radius:12px 12px 0 0">
        <h1 style="color:#FBF5ED;font-size:24px;margin:0;font-weight:400">Nouvelle réservation</h1>
        <p style="color:#F0DECF;margin:6px 0 0;font-size:14px">eloisewerle.com</p>
      </div>
      <div style="background:#FDFAF5;padding:32px 40px;border:1px solid #E8E0D5;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em;width:40%">Client</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;font-weight:600">${name}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">E-mail</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5"><a href="mailto:${email}" style="color:#C8B89A">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Téléphone</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${phone}</td></tr>` : ''}
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Soin</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${service || '—'}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Lieu</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${location || '—'}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Date</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${date || '—'}${time ? ' à ' + time : ''}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Durée</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${duration ? duration + ' min' : '—'}</td></tr>
          <tr><td style="padding:10px 0;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Total</td><td style="padding:10px 0;font-weight:700;font-size:18px;color:#C8B89A">${price ? price + ' €' : '—'}</td></tr>
        </table>
        ${notes ? `<div style="margin-top:20px;padding:16px;background:#F5F0E8;border-radius:8px"><p style="color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">Notes</p><p style="margin:0">${notes}</p></div>` : ''}
        <p style="margin-top:28px;font-size:13px;color:#7C6E5F">Répondez à cet e-mail pour confirmer le rendez-vous avec ${name}. Une fois confirmé, pensez à cliquer sur 'Confirmer' dans votre espace admin pour envoyer la confirmation au client.</p>
      </div>
    </div>` : `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2C2A">
      <div style="background:#C8B89A;padding:32px 40px;border-radius:12px 12px 0 0">
        <h1 style="color:#FBF5ED;font-size:24px;margin:0;font-weight:400">Nouveau message</h1>
        <p style="color:#F0DECF;margin:6px 0 0;font-size:14px">eloisewerle.com</p>
      </div>
      <div style="background:#FDFAF5;padding:32px 40px;border:1px solid #E8E0D5;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em;width:40%">De</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;font-weight:600">${name}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">E-mail</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5"><a href="mailto:${email}" style="color:#C8B89A">${email}</a></td></tr>
          ${subject ? `<tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Sujet</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${subject}</td></tr>` : ''}
        </table>
        <div style="padding:20px;background:#F5F0E8;border-radius:8px;line-height:1.7">${message.replace(/\n/g,'<br>')}</div>
        <p style="margin-top:28px;font-size:13px;color:#7C6E5F">Répondez à cet e-mail pour répondre directement à ${name}.</p>
      </div>
    </div>`;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — email not sent');
    return res.status(200).json({ ok: true, warn: 'no_api_key' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Site Eloïse <hello@eloisewerle.com>',
        to: ['eloiserose.werle@gmail.com', 'lise.werle@gmail.com'],
        reply_to: email,
        subject: emailSubject,
        html,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Email service error' });
    }

    // Confirmation email to the client for bookings
    if (isBooking && clientEmail && clientEmail !== email) {
      const clientHtml = `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2C2C2A">
          <div style="background:#C8B89A;padding:32px 40px;border-radius:12px 12px 0 0">
            <h1 style="color:#FBF5ED;font-size:24px;margin:0;font-weight:400">Votre demande a bien été reçue ✓</h1>
            <p style="color:#F0DECF;margin:6px 0 0;font-size:14px">Eloïse Werle — eloisewerle.com</p>
          </div>
          <div style="background:#FDFAF5;padding:32px 40px;border:1px solid #E8E0D5;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:1.05rem;margin:0 0 24px">Bonjour ${name},<br><br>Votre demande de réservation a bien été envoyée à Eloïse. Vous recevrez la confirmation de votre rendez-vous sous peu.</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em;width:40%">Soin</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;font-weight:600">${service || '—'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Lieu</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${location || '—'}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Date</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${date || '—'}${time ? ' à ' + time : ''}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #E8E0D5;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Durée</td><td style="padding:10px 0;border-bottom:1px solid #E8E0D5">${duration ? duration + ' min' : '—'}</td></tr>
              <tr><td style="padding:10px 0;color:#7C6E5F;font-size:13px;text-transform:uppercase;letter-spacing:.1em">Total</td><td style="padding:10px 0;font-weight:700;font-size:18px;color:#C8B89A">${price ? price + ' €' : '—'}</td></tr>
            </table>
            <p style="margin-top:28px;color:#7C6E5F;font-size:13px">Vous recevrez un email de confirmation une fois votre rendez-vous validé par Eloïse.</p>
          </div>
        </div>`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Eloïse Werle <hello@eloisewerle.com>',
          to: [clientEmail],
          reply_to: 'eloiserose.werle@gmail.com',
          subject: `Demande de réservation reçue — ${service || 'séance'}`,
          html: clientHtml,
        }),
      }).catch(e => console.error('Client email error:', e));
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Fetch error:', e);
    return res.status(500).json({ error: 'Network error' });
  }
}
