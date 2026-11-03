/* Conexión con Firebase: inicio de sesión con Google y Firestore con caché sin conexión.
   Todos los datos viven bajo users/<tu uid>/..., y las reglas solo dejan entrar a esa cuenta. */
import { firebaseConfig } from './firebase-config.js';

const configured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);
if (!configured) {
  window.FB = { configured: false };
  window.dispatchEvent(new Event('fb-ready'));
} else {
  const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [{ initializeApp }, A, F] = await Promise.all([
    import(V + 'firebase-app.js'), import(V + 'firebase-auth.js'), import(V + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  A.setPersistence(auth, A.browserLocalPersistence).catch(() => {});
  let fs;
  try {
    fs = F.initializeFirestore(app, { ignoreUndefinedProperties: true,
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager(), cacheSizeBytes: F.CACHE_SIZE_UNLIMITED }) });
  } catch (e) { console.warn('Sin caché persistente', e); fs = F.initializeFirestore(app, { ignoreUndefinedProperties: true }); }

  const errs = e => { console.error('Base de datos: ' + (e?.code || e?.message || e)); window.dispatchEvent(new CustomEvent('fb-error', { detail: e?.code || 'unknown' })); };
  /* Las escrituras se aplican al instante en local y se suben cuando hay conexión. */
  const db = {
    set: (path, id, data) => { F.setDoc(F.doc(fs, path, id), data).catch(errs); },
    del: (path, id) => { F.deleteDoc(F.doc(fs, path, id)).catch(errs); },
    watch: (path, cb) => F.onSnapshot(F.collection(fs, path), { includeMetadataChanges: true },
      s => cb({ docs: s.docs.map(d => ({ id: d.id, data: d.data() })), fromCache: s.metadata.fromCache, pending: s.metadata.hasPendingWrites }), errs),
    getAll: async path => (await F.getDocs(F.collection(fs, path))).docs.map(d => ({ id: d.id, data: d.data() })),
  };

  let user = null;
  A.onAuthStateChanged(auth, u => { user = u; window.dispatchEvent(new CustomEvent('fb-user', { detail: u })); });
  A.getRedirectResult(auth).catch(e => { if (e?.code) console.warn('Inicio de sesión:', e.code); });
  async function signIn() {
    const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await A.signInWithPopup(auth, p); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request', 'auth/web-storage-unsupported'].includes(e?.code)) return A.signInWithRedirect(auth, p);
      throw e;
    }
  }
  window.FB = { configured: true, db, signIn, signOut: () => A.signOut(auth), user: () => user,
    config: { projectId: firebaseConfig.projectId, apiKey: firebaseConfig.apiKey } };
  window.dispatchEvent(new Event('fb-ready'));
}
