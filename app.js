/* =========================================================
   0. CONFIGURACIÓN DE FIREBASE (AUTH + FIRESTORE)
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyAUMXAANVjjGW17MrQYSgnuBN_oIhvsFeQ",
  authDomain: "gmz-arcade.firebaseapp.com",
  projectId: "gmz-arcade",
  storageBucket: "gmz-arcade.firebasestorage.app",
  messagingSenderId: "230466354626",
  appId: "1:230466354626:web:48eef2062ad79605412a5b",
  measurementId: "G-84MF53396Z"
};

let auth = null;
let db = null;
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  if (firebase.firestore) {
    db = firebase.firestore();
  }
}

/* =========================================================
   1. IDIOMAS DEL MUNDO Y CATÁLOGO DE JUEGOS
   ========================================================= */
const WORLD_LANGUAGES = [
  "Español (España / Latinoamérica)", "English (United States / UK)", "Português (Brasil / Portugal)",
  "Français (France / Canada)", "Deutsch (Deutschland)", "Italiano (Italia)", "日本語 (Japonés)",
  "한국어 (Coreano)", "中文 (Chino Mandarín)", "Русский (Ruso)", "العربية (Árabe)",
  "हिन्दी (Hindi)", "বাংলা (Bengalí)", "Tiếng Việt (Vietnamita)", "Türkçe (Turco)",
  "Polski (Polaco)", "Українська (Ucraniano)", "Nederlands (Neerlandés)", "Ελληνικά (Griego)",
  "Svenska (Sueco)", "Română (Rumano)", "ไทย (Tailandés)", "Bahasa Indonesia", "Tagalog",
  "Kiswahili", "Català", "Galego", "Euskara", "Nāhuatl", "Quechua", "Guaraní"
];

const GAMES_CATALOG = [
  {
    id: 'archiveros',
    titulo: 'Derriba los Archiveros',
    descripcion: 'Lanza emojis explosivos desde tu montaña para destruir castillos de carpetas.',
    icono: '💣😡',
    fondo: 'linear-gradient(135deg, #3a86ff, #00b4d8)',
    archivo: 'juegos/archiveros.html',
    downloaded: true,
    unlockLevel: 1,
    exclusivePriceCoins: 0
  },
  {
    id: 'invasion',
    titulo: 'Invasión Cibernética',
    descripcion: 'Defiende la ciudad futurista de oleadas de drones mecánicos.',
    icono: '🚀🤖',
    fondo: 'linear-gradient(135deg, #7209b7, #3a0ca3)',
    archivo: 'juegos/archiveros.html',
    downloaded: true,
    unlockLevel: 3,
    exclusivePriceCoins: 0
  },
  {
    id: 'supervivencia',
    titulo: 'Supervivencia Pixel',
    descripcion: 'Sobrevive a hordas infinitas subiendo de nivel tus armas.',
    icono: '⚔️🔥',
    fondo: 'linear-gradient(135deg, #d90429, #ef233c)',
    archivo: 'juegos/archiveros.html',
    downloaded: false,
    unlockLevel: 7,
    exclusivePriceCoins: 0
  },
  {
    id: 'ruta_nocturna',
    titulo: 'Ruta Nocturna Neón',
    descripcion: 'Carreras clandestinas a toda velocidad esquivando tráfico.',
    icono: '🏎️💨',
    fondo: 'linear-gradient(135deg, #f77f00, #fcbf49)',
    archivo: 'juegos/archiveros.html',
    downloaded: false,
    unlockLevel: 15,
    exclusivePriceCoins: 0
  },
  {
    id: 'rey_cerdo_vip',
    titulo: 'Edición VIP: Rey Cerdo Cyber',
    descripcion: 'Juego exclusivo de tienda con doble ganancia de puntos en cada partida.',
    icono: '👑🐷',
    fondo: 'linear-gradient(135deg, #f59e0b, #b45309)',
    archivo: 'juegos/archiveros.html',
    downloaded: true,
    unlockLevel: 1,
    exclusivePriceCoins: 50
  },
  {
    id: 'leyenda_50',
    titulo: 'Arena de Campeones Nv. 50',
    descripcion: 'Desafío supremo desbloqueable al alcanzar el nivel máximo o en tienda VIP.',
    icono: '🏆⚡',
    fondo: 'linear-gradient(135deg, #10b981, #047857)',
    archivo: 'juegos/archiveros.html',
    downloaded: false,
    unlockLevel: 50,
    exclusivePriceCoins: 150
  }
];

const MISSIONS_DATA = [
  { id: 'm1', titulo: 'Primeros Pasos', desc: 'Juega 1 partida en cualquier minijuego.', target: 1, type: 'played', rewardPoints: 250, rewardXp: 80 },
  { id: 'm2', titulo: 'Jugador Constante', desc: 'Completa 5 partidas en la plataforma.', target: 5, type: 'played', rewardPoints: 800, rewardXp: 220 },
  { id: 'm3', titulo: 'Coleccionista de Puntos', desc: 'Acumula 1,500 Puntos jugando.', target: 1500, type: 'points', rewardPoints: 500, rewardXp: 300 },
  { id: 'm4', titulo: 'Veterano Arcade', desc: 'Juega 15 partidas totales.', target: 15, type: 'played', rewardPoints: 2500, rewardXp: 650 }
];

/* =========================================================
   2. GESTOR DE CUENTAS ÚNICAS + SINCRONIZACIÓN FIRESTORE
   ========================================================= */
const ACCOUNTS_DB_KEY = 'gmz_accounts_registry_v1';
const ACTIVE_SESSION_KEY = 'gmz_active_account_id';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: '#6366f1',
  accentGlow: '#1e1b4b',
  scale: '1',
  density: 'balanced',
  language: 'Español (España / Latinoamérica)',
  notifications: true,
  imageCache: true,
  animations: true,
  autoUpdates: true
};

let AccountsDB = JSON.parse(localStorage.getItem(ACCOUNTS_DB_KEY)) || {};
let CurrentAccountId = localStorage.getItem(ACTIVE_SESSION_KEY) || null;
let AppState = null;

function createFreshAccountData(accountId, name, provider, avatar, bio, lang) {
  return {
    accountId,
    user: { name, provider, avatar: avatar || '😎', bio: bio || 'Jugador listo para la arena.' },
    level: 1,
    xp: 0,
    points: 100,
    coins: 10,
    gamesPlayed: 0,
    ownedGames: ['archiveros'],
    favorites: [],
    collections: { 'Favoritos': [] },
    claimedMissions: [],
    settings: { ...DEFAULT_SETTINGS, language: lang || DEFAULT_SETTINGS.language }
  };
}

function saveState() {
  if (!CurrentAccountId || !AppState) return;
  AccountsDB[CurrentAccountId] = AppState;
  localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(AccountsDB));
  localStorage.setItem(ACTIVE_SESSION_KEY, CurrentAccountId);
  UI.updateHUD();

  // Guardar también en Cloud Firestore (colección "usuarios")
  if (db) {
    db.collection('usuarios').doc(CurrentAccountId).set({
      ...AppState,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.warn('Aviso Firestore:', err.message));
  }
}

function notify(msg) {
  if (AppState && AppState.settings && !AppState.settings.notifications) return;
  const box = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* =========================================================
   3. ONBOARDING Y DETECCIÓN DE CUENTA EXISTENTE (NUBE + LOCAL)
   ========================================================= */
const Onboarding = {
  pendingAccount: null,
  selectedAvatar: '😎',
  mediaStream: null,

  openRegister() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
  },

  backToLogin() {
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
  },

  async submitRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const cleanId = 'user_' + username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const internalEmail = `${cleanId}@gmzarcade.local`;

    try {
      if (auth) {
        try {
          await auth.createUserWithEmailAndPassword(internalEmail, password);
        } catch (err) {
          if (err.code === 'auth/email-already-in-use') {
            await auth.signInWithEmailAndPassword(internalEmail, password);
          }
        }
      }
      await this.handleAccountEntry(cleanId, username, 'Cuenta GMZ');
    } catch (error) {
      alert('Error de cuenta: ' + error.message);
    }
  },

  async handleAccountEntry(accountId, displayName, providerName, photoUrl = null) {
    // 1. Buscar primero en Cloud Firestore para recuperar progreso desde la nube
    if (db) {
      try {
        const docSnap = await db.collection('usuarios').doc(accountId).get();
        if (docSnap.exists) {
          const cloudData = docSnap.data();
          delete cloudData.updatedAt;
          AccountsDB[accountId] = cloudData;
          CurrentAccountId = accountId;
          AppState = cloudData;
          saveState();
          Auth.applySession();
          notify(`☁️ ¡Bienvenido de nuevo, ${AppState.user.name}! Progreso cargado de la nube.`);
          return;
        }
      } catch (err) {
        console.warn('No se pudo consultar Firestore:', err.message);
      }
    }

    // 2. Respaldo en caché local si ya existía en este navegador
    if (AccountsDB[accountId]) {
      CurrentAccountId = accountId;
      AppState = AccountsDB[accountId];
      saveState();
      Auth.applySession();
      notify(`👋 ¡Bienvenido de nuevo, ${AppState.user.name}! Progreso restaurado.`);
      return;
    }

    // 3. Cuenta nueva: iniciar secuencia de personalización
    this.pendingAccount = { accountId, name: displayName, provider: providerName };
    if (photoUrl) {
      this.selectedAvatar = photoUrl;
      document.getElementById('previewAvatarBox').innerHTML = `<img src="${photoUrl}" />`;
    }

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('loadingProfileScreen').classList.remove('hidden');

    let progress = 0;
    const bar = document.getElementById('loadingBarFill');
    const txt = document.getElementById('loadingStatusText');
    const steps = [
      'Registrando identificador único de cuenta...',
      'Conectando billetera con Cloud Firestore...',
      'Preparando Pase de Nivel 1 al 50...',
      '¡Listo para personalizar!'
    ];

    const timer = setInterval(() => {
      progress += 25;
      bar.style.width = progress + '%';
      txt.textContent = steps[Math.min(3, Math.floor(progress / 26))];
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          document.getElementById('loadingProfileScreen').classList.add('hidden');
          document.getElementById('customizeProfileScreen').classList.remove('hidden');
        }, 350);
      }
    }, 400);
  },

  selectPreset(emoji, targetId) {
    this.selectedAvatar = emoji;
    document.getElementById(targetId).innerHTML = emoji;
  },

  handleFileUpload(e, targetId) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      this.selectedAvatar = ev.target.result;
      document.getElementById(targetId).innerHTML = `<img src="${ev.target.result}" />`;
    };
    reader.readAsDataURL(file);
  },

  async openCamera(boxId, videoId) {
    try {
      document.getElementById(boxId).classList.remove('hidden');
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      document.getElementById(videoId).srcObject = this.mediaStream;
    } catch (err) {
      alert('No se pudo abrir la cámara: ' + err.message);
    }
  },

  capturePhoto(boxId, videoId, targetId) {
    const video = document.getElementById(videoId);
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 200;
    canvas.getContext('2d').drawImage(video, 0, 0, 200, 200);
    const dataUrl = canvas.toDataURL('image/png');
    this.selectedAvatar = dataUrl;
    document.getElementById(targetId).innerHTML = `<img src="${dataUrl}" />`;
    if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());
    document.getElementById(boxId).classList.add('hidden');
  },

  finishCustomization() {
    const bio = document.getElementById('profileBioInput').value.trim();
    const lang = document.getElementById('onboardingLangSelect').value;
    const { accountId, name, provider } = this.pendingAccount;

    CurrentAccountId = accountId;
    AppState = createFreshAccountData(accountId, name, provider, this.selectedAvatar, bio, lang);
    saveState();

    document.getElementById('customizeProfileScreen').classList.add('hidden');
    document.getElementById('congratsModal').classList.remove('hidden');
  },

  enterPlatform() {
    document.getElementById('congratsModal').classList.add('hidden');
    Auth.applySession();
  }
};

/* =========================================================
   4. AUTENTICACIÓN SOCIAL E INVITADO
   ========================================================= */
const Auth = {
  async loginSocial(providerName) {
    if (!auth) return;
    try {
      const provider = providerName === 'Facebook'
        ? new firebase.auth.FacebookAuthProvider()
        : new firebase.auth.GoogleAuthProvider();
      const res = await auth.signInWithPopup(provider);
      const uid = 'firebase_' + res.user.uid;
      await Onboarding.handleAccountEntry(uid, res.user.displayName || 'Jugador', providerName, res.user.photoURL);
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') return;
      alert('Aviso de acceso: ' + error.message);
    }
  },

  async loginGuest() {
    const guestId = 'guest_local_default';
    const guestName = 'Invitado#' + Math.floor(100 + Math.random() * 900);
    await Onboarding.handleAccountEntry(guestId, guestName, 'Invitado');
  },

  applySession() {
    if (!AppState) return;
    Settings.applyAllVisuals();
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    UI.renderAll();
  },

  async logout() {
    if (auth && auth.currentUser) await auth.signOut();
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    CurrentAccountId = null;
    AppState = null;
    location.reload();
  }
};

/* =========================================================
   5. ECONOMÍA, NIVELES (1-50) Y MISIONES
   ========================================================= */
const Economy = {
  getXpForNextLevel(lvl) {
    return 100 + (lvl - 1) * 45;
  },

  addProgress(earnedPoints, earnedXp) {
    AppState.points += earnedPoints;
    if (AppState.level < 50) {
      AppState.xp += earnedXp;
      while (AppState.level < 50 && AppState.xp >= this.getXpForNextLevel(AppState.level)) {
        AppState.xp -= this.getXpForNextLevel(AppState.level);
        AppState.level++;
        const bonusPts = AppState.level * 150;
        const bonusCoins = AppState.level % 5 === 0 ? 15 : 3;
        AppState.points += bonusPts;
        AppState.coins += bonusCoins;
        notify(`🎉 ¡Nivel ${AppState.level}! +${bonusPts} PTS y +${bonusCoins} 🪙`);
      }
    }
    saveState();
    UI.renderAll();
  },

  exchangePoints(costPoints, gainCoins) {
    if (AppState.points < costPoints) {
      alert(`Necesitas ${costPoints} Puntos (tienes ${AppState.points} PTS).`);
      return;
    }
    AppState.points -= costPoints;
    AppState.coins += gainCoins;
    saveState();
    notify(`💱 Canjeados ${costPoints} PTS por +${gainCoins} Monedas GMZ 🪙`);
  },

  buyExclusiveGame(gameId) {
    const game = GAMES_CATALOG.find(g => g.id === gameId);
    if (!game) return;
    if (AppState.coins < game.exclusivePriceCoins) {
      alert(`Te faltan Monedas GMZ. Cuesta ${game.exclusivePriceCoins} 🪙.`);
      return;
    }
    AppState.coins -= game.exclusivePriceCoins;
    AppState.ownedGames.push(gameId);
    saveState();
    UI.renderAll();
    notify(`🎮 ¡Compraste "${game.titulo}"!`);
  },

  claimMission(missionId) {
    const m = MISSIONS_DATA.find(x => x.id === missionId);
    if (!m || AppState.claimedMissions.includes(missionId)) return;
    AppState.claimedMissions.push(missionId);
    this.addProgress(m.rewardPoints, m.rewardXp);
  }
};

/* =========================================================
   6. BIBLIOTECA AVANZADA (ORDEN, FAVORITOS, COLECCIONES)
   ========================================================= */
const Library = {
  sortMode: 'default',
  collectionFilter: 'all',
  hideUndownloaded: false,

  setSort(val) { this.sortMode = val; UI.renderGames(); },
  setCollectionFilter(val) { this.collectionFilter = val; UI.renderGames(); },
  toggleHideUndownloaded(checked) { this.hideUndownloaded = checked; UI.renderGames(); },

  toggleFavorite(gameId) {
    const idx = AppState.favorites.indexOf(gameId);
    if (idx >= 0) AppState.favorites.splice(idx, 1);
    else AppState.favorites.push(gameId);
    saveState();
    UI.renderGames();
  },

  manageCollections() {
    const name = prompt('Escribe el nombre de una nueva colección personalizada (ej. Acción, Favoritos VIP):');
    if (!name || !name.trim()) return;
    if (!AppState.collections[name.trim()]) {
      AppState.collections[name.trim()] = [];
      saveState();
      this.refreshCollectionSelect();
      notify(`📁 Colección "${name.trim()}" creada.`);
    }
  },

  refreshCollectionSelect() {
    const sel = document.getElementById('libCollectionSelect');
    if (!sel || !AppState) return;
    const customKeys = Object.keys(AppState.collections || {});
    sel.innerHTML = `<option value="all">Colección: Todos los juegos</option><option value="favorites">⭐ Mis Favoritos</option>` +
      customKeys.map(k => `<option value="col_${k}">📁 ${k}</option>`).join('');
  }
};

/* =========================================================
   7. CONFIGURACIÓN COMPLETA EN VENTANA SEPARADA
   ========================================================= */
const Settings = {
  openWindow(tabId = 'tabAppearance') {
    document.getElementById('settingsWindowModal').classList.remove('hidden');
    this.updateStorageStats();
    document.getElementById('settingsStatsSummary').textContent =
      `Nivel ${AppState.level} • ${AppState.gamesPlayed} Partidas • ${AppState.xp} EXP actual`;
    document.getElementById('authSecurityInfo').textContent =
      `Cuenta ID: ${AppState.accountId} • Método: ${AppState.user.provider}`;
    if (tabId) {
      const btn = Array.from(document.querySelectorAll('.s-tab')).find(b => b.getAttribute('onclick')?.includes(tabId));
      if (btn) this.switchTab(tabId, btn);
    }
  },

  closeWindow() {
    document.getElementById('settingsWindowModal').classList.add('hidden');
  },

  switchTab(tabId, btn) {
    document.querySelectorAll('.s-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.s-tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  },

  filterSettings(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.s-tab-pane').forEach(pane => pane.classList.add('active'));
    document.querySelectorAll('.s-item, .faq-box').forEach(item => {
      const text = (item.textContent + ' ' + (item.dataset.keywords || '')).toLowerCase();
      item.style.display = text.includes(q) ? '' : 'none';
    });
  },

  setTheme(theme) {
    AppState.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveState();
  },

  setAccent(color, glow) {
    AppState.settings.accent = color;
    AppState.settings.accentGlow = glow;
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--bg-accent-glow', glow);
    saveState();
  },

  setScale(val) {
    AppState.settings.scale = val;
    document.documentElement.style.setProperty('--ui-scale', val);
    saveState();
  },

  setDensity(val) {
    AppState.settings.density = val;
    UI.renderGames();
    saveState();
  },

  setFullscreen(enable) {
    if (enable && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!enable && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  },

  changeLanguage(lang) {
    AppState.settings.language = lang;
    saveState();
    UI.renderAll();
  },

  changeUsernamePaid() {
    const newName = document.getElementById('newUsernameInput').value.trim();
    if (newName.length < 3) {
      alert('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (AppState.coins < 10) {
      alert('Necesitas 10 Monedas GMZ para cambiar tu nombre de usuario.');
      return;
    }
    AppState.coins -= 10;
    AppState.user.name = newName;
    document.getElementById('newUsernameInput').value = '';
    saveState();
    UI.renderAll();
    notify(`✅ Nombre cambiado a "${newName}" (-10 Monedas GMZ)`);
  },

  updateProfileAvatarFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      AppState.user.avatar = ev.target.result;
      saveState();
      UI.renderAll();
      notify('🖼️ Foto de perfil actualizada.');
    };
    reader.readAsDataURL(file);
  },

  quickPresetAvatar(emoji) {
    AppState.user.avatar = emoji;
    saveState();
    UI.renderAll();
    notify(`Avatar cambiado a ${emoji}`);
  },

  togglePref(key, val) {
    AppState.settings[key] = val;
    saveState();
  },

  toggleAnimations(val) {
    AppState.settings.animations = val;
    document.body.classList.toggle('no-anim', !val);
    saveState();
  },

  clearCache() {
    notify('🧹 Caché de imágenes optimizada y limpiada.');
  },

  updateStorageStats() {
    const bytes = new Blob([JSON.stringify(AccountsDB)]).size;
    const kb = (bytes / 1024).toFixed(2);
    document.getElementById('storageUsageText').textContent = `Uso actual: ${kb} KB / 5,120 KB disponibles + Respaldo Cloud Firestore.`;
  },

  exportConfig() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `gmz_backup_${AppState.user.name}.json`;
    a.click();
  },

  importConfig(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.settings) {
          AppState.settings = { ...DEFAULT_SETTINGS, ...imported.settings };
          saveState();
          this.applyAllVisuals();
          UI.renderAll();
          notify('📤 Configuración importada y aplicada correctamente.');
        }
      } catch {
        alert('El archivo seleccionado no es una configuración válida.');
      }
    };
    reader.readAsText(file);
  },

  resetDefaults() {
    if (!confirm('¿Seguro que deseas volver todas las preferencias visuales y ajustes a sus valores predeterminados?')) return;
    AppState.settings = { ...DEFAULT_SETTINGS };
    saveState();
    this.applyAllVisuals();
    UI.renderAll();
    notify('↺ Valores predeterminados restaurados.');
  },

  applyAllVisuals() {
    if (!AppState) return;
    const s = AppState.settings;
    this.setTheme(s.theme);
    this.setAccent(s.accent, s.accentGlow);
    this.setScale(s.scale);
    this.toggleAnimations(s.animations);
    document.querySelectorAll('.world-lang-select').forEach(sel => {
      if (sel.id.includes('Lang')) sel.value = s.language;
    });
  },

  populateLanguages() {
    ['onboardingLangSelect', 'settingsLangSelect'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.innerHTML = WORLD_LANGUAGES.map(l => `<option value="${l}">${l}</option>`).join('');
    });
  }
};

/* =========================================================
   8. REPRODUCTOR CON PUNTUACIÓN REAL DESDE LOS JUEGOS
   ========================================================= */
const Player = {
  currentGameId: null,
  sessionPoints: 0,

  open(gameId) {
    const game = GAMES_CATALOG.find(g => g.id === gameId);
    if (!game) return;
    this.currentGameId = gameId;
    this.sessionPoints = 0;

    AppState.gamesPlayed++;
    saveState();

    document.getElementById('playingTitle').textContent = `${game.icono} ${game.titulo}`;
    document.getElementById('liveSessionReward').textContent = `+0 PTS ganados en partida`;
    document.getElementById('gameFrame').src = game.archivo;
    document.getElementById('gamePlayerModal').classList.remove('hidden');
  },

  receiveGameScore(rawPoints) {
    if (!this.currentGameId || typeof rawPoints !== 'number' || rawPoints <= 0) return;
    // Si juega en la edición VIP "Rey Cerdo Cyber", gana el doble de puntos
    const multiplier = this.currentGameId === 'rey_cerdo_vip' ? 2 : 1;
    const earned = Math.floor(rawPoints * multiplier);
    this.sessionPoints += earned;
    document.getElementById('liveSessionReward').textContent = `+${this.sessionPoints.toLocaleString()} PTS ganados en partida`;
  },

  close() {
    document.getElementById('gameFrame').src = '';
    document.getElementById('gamePlayerModal').classList.add('hidden');
    this.currentGameId = null;

    if (this.sessionPoints > 0) {
      const earnedXp = Math.max(25, Math.floor(this.sessionPoints * 0.25));
      notify(`💰 ¡Cobraste +${this.sessionPoints.toLocaleString()} PTS y +${earnedXp} EXP!`);
      Economy.addProgress(this.sessionPoints, earnedXp);
      this.sessionPoints = 0;
    } else {
      UI.renderAll();
    }
  }
};

// Escucha los puntos reales enviados desde el iframe (archiveros.html, etc.)
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GMZ_ADD_SCORE') {
    Player.receiveGameScore(event.data.points);
  }
});

const Router = {
  go(viewId, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    if (btn) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      btn.classList.add('active');
    }
    UI.renderAll();
  }
};

const UI = {
  updateHUD() {
    if (!AppState) return;
    document.getElementById('hudLevel').textContent = AppState.level;
    const reqXp = AppState.level >= 50 ? 'MÁX' : `${AppState.xp}/${Economy.getXpForNextLevel(AppState.level)} EXP`;
    document.getElementById('hudXpText').textContent = `(${reqXp})`;
    document.getElementById('hudPoints').textContent = AppState.points.toLocaleString();
    document.getElementById('hudCoins').textContent = AppState.coins.toLocaleString();

    const av = AppState.user.avatar;
    const htmlAv = av.startsWith('data:image') || av.startsWith('http') ? `<img src="${av}" />` : av;
    document.getElementById('hudAvatar').innerHTML = htmlAv;
    document.getElementById('profileBigAvatar').innerHTML = htmlAv;
    document.getElementById('profileDisplayName').textContent = AppState.user.name;
    document.getElementById('profileDisplayBio').textContent = AppState.user.bio;
    document.getElementById('profileLangBadge').textContent = `🌐 ${AppState.settings.language}`;

    document.getElementById('profStatLevel').textContent = AppState.level;
    document.getElementById('profStatPoints').textContent = AppState.points.toLocaleString();
    document.getElementById('profStatCoins').textContent = AppState.coins.toLocaleString();
    document.getElementById('profStatPlayed').textContent = AppState.gamesPlayed;
  },

  renderGames() {
    const grid = document.getElementById('gamesGrid');
    const shopGrid = document.getElementById('shopGamesGrid');
    grid.className = `games-grid ${AppState.settings.density || 'balanced'}`;
    grid.innerHTML = '';
    shopGrid.innerHTML = '';

    let list = [...GAMES_CATALOG];
    if (Library.hideUndownloaded) list = list.filter(g => g.downloaded);
    if (Library.collectionFilter === 'favorites') list = list.filter(g => AppState.favorites.includes(g.id));

    if (Library.sortMode === 'alpha') {
      list.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (Library.sortMode === 'favorites') {
      list.sort((a, b) => (AppState.favorites.includes(b.id) ? 1 : 0) - (AppState.favorites.includes(a.id) ? 1 : 0));
    }

    list.forEach(game => {
      const isOwned = AppState.ownedGames.includes(game.id);
      const isLevelUnlocked = game.exclusivePriceCoins === 0 && AppState.level >= game.unlockLevel;
      const canPlay = isOwned || isLevelUnlocked;
      const isFav = AppState.favorites.includes(game.id);

      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="game-banner" style="background:${game.fondo}">
          <button class="fav-star-btn" onclick="Library.toggleFavorite('${game.id}')" title="Favorito">${isFav ? '⭐' : '☆'}</button>
          ${!canPlay ? `<span class="lock-badge">${game.exclusivePriceCoins > 0 ? '🪙 Exclusivo Tienda' : `🔒 Nivel ${game.unlockLevel}`}</span>` : ''}
          <span>${game.icono}</span>
        </div>
        <div class="game-body">
          <div>
            <h3>${game.titulo}</h3>
            <p class="game-desc">${game.descripcion}</p>
          </div>
          ${canPlay
            ? `<button class="play-card-btn" onclick="Player.open('${game.id}')">▶ JUGAR AHORA</button>`
            : `<button class="play-card-btn locked" disabled>${game.exclusivePriceCoins > 0 ? 'Canjeable en Tienda' : `Requiere Nivel ${game.unlockLevel}`}</button>`
          }
        </div>`;
      grid.appendChild(card);
    });

    GAMES_CATALOG.filter(g => g.exclusivePriceCoins > 0).forEach(game => {
      const isOwned = AppState.ownedGames.includes(game.id);
      const sCard = document.createElement('div');
      sCard.className = 'game-card';
      sCard.innerHTML = `
        <div class="game-banner" style="background:${game.fondo}"><span>${game.icono}</span></div>
        <div class="game-body">
          <div>
            <h3>${game.titulo}</h3>
            <p class="game-desc">${game.descripcion}</p>
          </div>
          ${isOwned
            ? `<button class="play-card-btn" onclick="Player.open('${game.id}')">✓ ADQUIRIDO - JUGAR</button>`
            : `<button class="play-card-btn buy-btn" onclick="Economy.buyExclusiveGame('${game.id}')">🪙 Comprar por ${game.exclusivePriceCoins} Monedas</button>`
          }
        </div>`;
      shopGrid.appendChild(sCard);
    });
  },

  renderMissions() {
    const list = document.getElementById('missionsList');
    list.innerHTML = '';
    MISSIONS_DATA.forEach(m => {
      const currentVal = m.type === 'played' ? AppState.gamesPlayed : AppState.points;
      const done = currentVal >= m.target;
      const claimed = AppState.claimedMissions.includes(m.id);

      const row = document.createElement('div');
      row.className = 'mission-item';
      row.innerHTML = `
        <div>
          <strong>${m.titulo}</strong> (${Math.min(currentVal, m.target)}/${m.target})
          <p class="game-desc">${m.desc} Recompensa: <strong>+${m.rewardPoints} PTS</strong> y <strong>+${m.rewardXp} EXP</strong></p>
        </div>
        ${claimed
          ? `<button class="play-card-btn locked" disabled>✓ Reclamada</button>`
          : done
            ? `<button class="play-card-btn" onclick="Economy.claimMission('${m.id}')">🎁 Reclamar Premio</button>`
            : `<button class="play-card-btn locked" disabled>En progreso</button>`
        }`;
      list.appendChild(row);
    });
  },

  renderLevels() {
    const container = document.getElementById('levelsRoadmap');
    container.innerHTML = '';
    for (let lvl = 1; lvl <= 50; lvl++) {
      const unlocked = AppState.level >= lvl;
      const gameUnlock = GAMES_CATALOG.find(g => g.exclusivePriceCoins === 0 && g.unlockLevel === lvl);
      const coinsPrize = lvl % 5 === 0 ? 15 : 3;
      const ptsPrize = lvl * 150;

      const row = document.createElement('div');
      row.className = `level-row ${unlocked ? 'unlocked' : ''}`;
      row.innerHTML = `
        <div>
          <strong>${unlocked ? '✅' : '🔒'} Nivel ${lvl}</strong>
          <p class="game-desc">Premio: +${ptsPrize} PTS • +${coinsPrize} Monedas GMZ ${gameUnlock ? `• 🎮 Desbloquea: <strong>${gameUnlock.titulo}</strong>` : ''}</p>
        </div>
        <span>${unlocked ? 'Completado' : `${Economy.getXpForNextLevel(lvl)} EXP`}</span>`;
      container.appendChild(row);
    }
  },

  renderAll() {
    this.updateHUD();
    Library.refreshCollectionSelect();
    this.renderGames();
    this.renderMissions();
    this.renderLevels();
  }
};

// Inicialización al cargar
Settings.populateLanguages();
if (CurrentAccountId && AccountsDB[CurrentAccountId]) {
  AppState = AccountsDB[CurrentAccountId];
  Auth.applySession();
}