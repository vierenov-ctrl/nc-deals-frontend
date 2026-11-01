/* Bulle « Assistant NC Deals » (en bas à gauche). Elle ne s'affiche que si le serveur a une clé IA configurée.
   À inclure en bas de page : <script src="assistant.js" defer></script> */
(function () {
  var API = (typeof BACKEND !== 'undefined' ? BACKEND : 'https://api.ncdeals.nc') + '/api/assistant';
  var CLE = 'ncdeals_assistant';
  var ACCUEIL = "Bonjour 👋 Je suis l'assistant NC Deals. Je réponds à vos questions sur les bons plans, les achats et la publication d'offres pour les commerçants.";
  var IDEES = ['Comment acheter un bon plan ?', "C'est payant pour moi ?", 'Je suis commerçant, comment publier ?', 'Quelles offres en ce moment ?'];

  var css = '' +
    '.nca-bouton{position:fixed;left:20px;bottom:20px;z-index:600;display:flex;align-items:center;gap:8px;padding:12px 18px;background:#1a6b3a;color:#fff;border:none;border-radius:30px;font:700 .88rem "Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}' +
    '.nca-bouton:focus-visible,.nca-fenetre button:focus-visible{outline:3px solid #7ee8a2;outline-offset:2px}' +
    '.nca-fenetre{position:fixed;left:20px;bottom:20px;z-index:1001;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 40px);display:flex;flex-direction:column;background:#fff;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.28);font:15px/1.5 "Segoe UI",Arial,sans-serif;color:#1a3a1a;overflow:hidden}' +
    '.nca-fenetre[hidden]{display:none}' +
    '.nca-tete{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(135deg,#0d3d22,#1a6b3a);color:#fff}' +
    '.nca-tete b{font-size:1rem}.nca-tete small{display:block;opacity:.8;font-size:.75rem}' +
    '.nca-fermer{margin-left:auto;background:none;border:none;color:#fff;font-size:1.5rem;line-height:1;cursor:pointer;padding:0 4px}' +
    '.nca-fil{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f0f4f0}' +
    '.nca-msg{max-width:85%;padding:9px 13px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.nca-bot{align-self:flex-start;background:#fff;border:1px solid #d0e8d0;border-bottom-left-radius:4px}' +
    '.nca-moi{align-self:flex-end;background:#1a6b3a;color:#fff;border-bottom-right-radius:4px}' +
    '.nca-bot a{color:#1a6b3a;font-weight:600}' +
    '.nca-idees{display:flex;flex-wrap:wrap;gap:6px}' +
    '.nca-idee{border:1.5px solid #d0e8d0;background:#fff;color:#1a6b3a;border-radius:20px;padding:6px 11px;font:600 .8rem "Segoe UI",Arial,sans-serif;cursor:pointer}' +
    '.nca-form{display:flex;gap:8px;padding:10px;border-top:1px solid #d0e8d0;background:#fff}' +
    '.nca-form input{flex:1;min-width:0;padding:10px 14px;border:2px solid #d0e8d0;border-radius:22px;font:inherit;font-size:.92rem;color:#1a3a1a;outline:none}' +
    '.nca-form input:focus{border-color:#1a6b3a}' +
    '.nca-form button{border:none;background:#1a6b3a;color:#fff;border-radius:22px;padding:0 16px;font:700 .88rem "Segoe UI",Arial,sans-serif;cursor:pointer}' +
    '.nca-form button:disabled{opacity:.5;cursor:default}' +
    '.nca-note{font-size:.7rem;color:#6a8a6a;text-align:center;padding:0 10px 8px;background:#fff}' +
    '@media (max-width:600px){.nca-bouton{bottom:82px}.nca-fenetre{left:10px;bottom:10px;max-width:calc(100vw - 20px);max-height:calc(100vh - 20px)}}';

  var historique = [];
  try { historique = JSON.parse(sessionStorage.getItem(CLE) || '[]'); } catch (e) {}
  var fil, saisie, envoyer, fenetre, bouton, occupe = false;

  function sauver() { try { sessionStorage.setItem(CLE, JSON.stringify(historique.slice(-20))); } catch (e) {} }
  function echapper(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mettreEnForme(t) {
    return echapper(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/https:\/\/(?:www\.)?ncdeals\.nc\/[^\s)<]*/g, function (u) { return '<a href="' + u + '">' + (u.indexOf('offre.html') > -1 ? "Voir l'offre" : u.replace('https://', '')) + '</a>'; });
  }
  function bulle(qui, texte) {
    var d = document.createElement('div');
    d.className = 'nca-msg ' + (qui === 'user' ? 'nca-moi' : 'nca-bot');
    if (qui === 'user') d.textContent = texte; else d.innerHTML = mettreEnForme(texte);
    fil.appendChild(d); fil.scrollTop = fil.scrollHeight;
    return d;
  }
  function afficher() {
    fil.innerHTML = '';
    bulle('assistant', ACCUEIL);
    if (!historique.length) {
      var box = document.createElement('div'); box.className = 'nca-idees';
      IDEES.forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'nca-idee'; b.textContent = q;
        b.onclick = function () { poser(q); }; box.appendChild(b);
      });
      fil.appendChild(box);
    }
    historique.forEach(function (m) { bulle(m.role, m.content); });
  }
  function poser(texte) {
    texte = (texte || '').trim();
    if (!texte || occupe) return;
    var idees = fil.querySelector('.nca-idees'); if (idees) idees.remove();
    historique.push({ role: 'user', content: texte }); bulle('user', texte);
    saisie.value = ''; occupe = true; envoyer.disabled = true;
    var attente = bulle('assistant', '…');
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: historique }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(x.j.error || 'erreur');
        attente.innerHTML = mettreEnForme(x.j.reponse);
        historique.push({ role: 'assistant', content: x.j.reponse });
      })
      .catch(function (e) {
        historique.pop();
        attente.textContent = (e && e.message && e.message !== 'erreur' && e.message.indexOf('fetch') < 0) ? e.message : "Je n'arrive pas à répondre pour le moment. Réessayez dans un instant.";
      })
      .then(function () { occupe = false; envoyer.disabled = false; sauver(); fil.scrollTop = fil.scrollHeight; });
  }
  function ouvrir(oui) {
    fenetre.hidden = !oui; bouton.style.display = oui ? 'none' : 'flex';
    if (oui) { afficher(); saisie.focus(); }
  }
  function construire() {
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    bouton = document.createElement('button'); bouton.type = 'button'; bouton.className = 'nca-bouton';
    bouton.innerHTML = '<span aria-hidden="true">💬</span> Une question ?';
    fenetre = document.createElement('div'); fenetre.className = 'nca-fenetre'; fenetre.hidden = true;
    fenetre.setAttribute('role', 'dialog'); fenetre.setAttribute('aria-label', 'Assistant NC Deals');
    fenetre.innerHTML = '<div class="nca-tete"><div><b>Assistant NC Deals</b><small>Réponse en quelques secondes</small></div>' +
      '<button type="button" class="nca-fermer" aria-label="Fermer">×</button></div>' +
      '<div class="nca-fil" aria-live="polite"></div>' +
      '<form class="nca-form"><input type="text" maxlength="1000" placeholder="Écrivez votre question…" aria-label="Votre question"><button type="submit">Envoyer</button></form>' +
      '<div class="nca-note">Assistant IA : pour une commande précise, l\'équipe NC Deals a le dernier mot.</div>';
    document.body.appendChild(bouton); document.body.appendChild(fenetre);
    fil = fenetre.querySelector('.nca-fil'); saisie = fenetre.querySelector('input'); envoyer = fenetre.querySelector('.nca-form button');
    bouton.onclick = function () { ouvrir(true); };
    fenetre.querySelector('.nca-fermer').onclick = function () { ouvrir(false); bouton.focus(); };
    fenetre.querySelector('form').onsubmit = function (e) { e.preventDefault(); poser(saisie.value); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !fenetre.hidden) ouvrir(false); });
  }
  // On ne montre la bulle que si l'assistant est activé côté serveur
  fetch(API + '/statut').then(function (r) { return r.json(); })
    .then(function (j) { if (j && j.actif) construire(); })
    .catch(function () {});
})();
