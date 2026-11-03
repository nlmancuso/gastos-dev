import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDwRTcVpwoHJfTZ-eUr5ileTks5LN-npOE",
    authDomain: "gastos-334ff.firebaseapp.com",
    projectId: "gastos-334ff",
    storageBucket: "gastos-334ff.firebasestorage.app",
    messagingSenderId: "140017165186",
    appId: "1:140017165186:web:2b6d7d57896696bef3a59b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.db = db;
window.auth = auth;

let unsubscribeSnapshot = null;
let unsubscribeHormiga = null;
let unsubscribeInvitaciones = null;

const categoriasDefault = [
    { nombre: "Gastos Fijo", color: "#10b981", esTarjeta: false, vencimientoUnicoEnBloque: false },
    { nombre: "Servicios", color: "#f97316", esTarjeta: false, vencimientoUnicoEnBloque: false },
    { nombre: "Santander Visa", color: "#ef4444", esTarjeta: true, vencimientoUnicoEnBloque: true },
    { nombre: "Ciudad Visa", color: "#3b82f6", esTarjeta: true, vencimientoUnicoEnBloque: true },
    { nombre: "Mercado Pago", color: "#f59e0b", esTarjeta: true, vencimientoUnicoEnBloque: true },
    { nombre: "Santander Amex", color: "#f97316", esTarjeta: true, vencimientoUnicoEnBloque: true }
];

const subcategoriasDefault = [
    { id: "sub_alquiler", nombre: "Alquiler / Expensas", porcentajeAumento: 0 },
    { id: "sub_servicios_basicos", nombre: "Servicios Básicos (Luz/Gas/Agua)", porcentajeAumento: 0 },
    { id: "sub_conectividad", nombre: "Internet / Cable / Telefonía", porcentajeAumento: 0 },
    { id: "sub_suscripciones", nombre: "Streaming y Suscripciones", porcentajeAumento: 0 }
];

const categoriasHormigaDefault = [
    { nombre: "Kiosco", color: "#f59e0b" },
    { nombre: "Panadería", color: "#d97706" },
    { nombre: "Ferretería", color: "#78716c" },
    { nombre: "Cafetería", color: "#b45309" },
    { nombre: "Supermercado Rápido", color: "#10b981" },
    { nombre: "Transporte / Peaje", color: "#3b82f6" },
    { nombre: "Propinas", color: "#ec4899" },
    { nombre: "Varios", color: "#64748b" }
];

const dInit = new Date();
const defaultLocalMonth = `${dInit.getFullYear()}-${String(dInit.getMonth() + 1).padStart(2, '0')}`;

const appStateLimpioBase = {
    currentMonth: defaultLocalMonth,
    gastos: [],
    excepcionesMonto: {},
    excepcionesCategoria: {},
    excepcionesVencimiento: {},
    excepcionesVencimientoGrid: {},
    excepcionesEstado: {},
    excepcionesEliminacion: {},
    excepcionesEliminacionSoloMes: {},
    aumentosIndividuales: {},
    subcategorias: JSON.parse(JSON.stringify(subcategoriasDefault)),
    sueldos: {},
    cuentasBancarias: [],
    categorias: JSON.parse(JSON.stringify(categoriasDefault)),
    recurrentesPreferidos: [],
    sortColumn: 'concepto',
    sortAscending: true,
    grupoInfo: null
};

if (auth.currentUser) {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.classList.add('hidden');
}

window.appState = window.appState || JSON.parse(JSON.stringify(appStateLimpioBase));

window.hormigaState = window.hormigaState || {
    gastos: [],
    categorias: JSON.parse(JSON.stringify(categoriasHormigaDefault)),
    sortColumn: 'fecha',
    sortAscending: false,
    filtrosCategorias: [],
    filtrosHormigaCatGrafico: []
};

window.filtrosTemporales = [];
window.categoriasAbiertasMap = {};
window.filtrosGraficoTotales = [];
window.filtrosGraficoEvolCat = [];
window.filtrosGraficoBalance = [];
window.filtrosRecurrentesGrid = [];

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

window.showLoading = function() {
    const login = document.getElementById('loginOverlay');
    const loading = document.getElementById('loadingOverlay');
    const appContent = document.getElementById('appContent');
    if (login) login.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    if (appContent) appContent.classList.add('hidden');
};

window.showLogin = function() {
    const login = document.getElementById('loginOverlay');
    const loading = document.getElementById('loadingOverlay');
    const appContent = document.getElementById('appContent');
    if (login) login.classList.remove('hidden');
    if (loading) loading.classList.add('hidden');
    if (appContent) appContent.classList.add('hidden');
};

window.showApp = function() {
    const login = document.getElementById('loginOverlay');
    const loading = document.getElementById('loadingOverlay');
    const appContent = document.getElementById('appContent');
    if (login) login.classList.add('hidden');
    if (loading) loading.classList.add('hidden');
    if (appContent) appContent.classList.remove('hidden');
};

window.poblarSelectorVistas = async function(vistaSeleccionadaActual) {
    const selector = document.getElementById('selectorVista');
    if (!selector) return;

    const user = auth.currentUser;
    if (!user) return;

    selector.innerHTML = '';

    const optPersonal = document.createElement('option');
    optPersonal.value = "personal";
    optPersonal.textContent = `🏠 Mi Espacio Personal (${user.email.split('@')[0]})`;
    selector.appendChild(optPersonal);

    try {
        const grupoId = "T3E2kcXODg2OLm7i1Roq";
        const grupoRef = doc(db, "app_data", grupoId);
        const grupoSnap = await getDoc(grupoRef);

        if (grupoSnap.exists()) {
            const data = grupoSnap.data();
            const miembros = data.appState?.grupoInfo?.miembros || {};
            const esMiembro = miembros[user.uid] !== undefined || user.email === "nicolaslmancuso@gmail.com";

            if (esMiembro) {
                const optGrupo = document.createElement('option');
                optGrupo.value = grupoId;
                optGrupo.textContent = `👥 Grupo Control de Gastos`;
                selector.appendChild(optGrupo);
            }
        }
    } catch (e) {
        console.error("Error al verificar membresía del grupo:", e);
    }

    selector.value = vistaSeleccionadaActual || "personal";
};

window.mostrarTabAuth = function(tab) {
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const btnLogin = document.getElementById('btnTabLogin');
    const btnRegister = document.getElementById('btnTabRegister');
    const loginError = document.getElementById('loginError');

    if (loginError) loginError.classList.add('hidden');

    if (tab === 'login') {
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        btnLogin.className = "flex-1 pb-3 text-sm font-bold text-amber-500 border-b-2 border-amber-500";
        btnRegister.className = "flex-1 pb-3 text-sm font-bold text-slate-400 hover:text-slate-200";
    } else {
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        btnRegister.className = "flex-1 pb-3 text-sm font-bold text-emerald-400 border-b-2 border-emerald-400";
        btnLogin.className = "flex-1 pb-3 text-sm font-bold text-slate-400 hover:text-slate-200";
    }
};

window.handleLogin = async function(e) {
    if (e) e.preventDefault();
    const emailEl = document.getElementById('loginEmail');
    const passEl = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

    if (!emailEl || !passEl) return;
    const email = emailEl.value.trim();
    const pass = passEl.value;

    if (loginError) loginError.classList.add('hidden');
    window.showLoading();

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        window.showLogin();
        if (loginError) {
            loginError.innerText = "Correo o contraseña incorrectos.";
            loginError.classList.remove('hidden');
        }
    }
};

// Registro con Envío de Verificación vía EmailJS (Plantilla Welcome)
window.handleRegister = async function(e) {
    if (e) e.preventDefault();
    const emailEl = document.getElementById('registerEmail');
    const passEl = document.getElementById('registerPassword');
    const loginError = document.getElementById('loginError');

    if (!emailEl || !passEl) return;
    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;

    if (loginError) loginError.classList.add('hidden');
    window.showLoading();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // 1. Crear enlace de verificación único apuntando a tu app con parámetros de estado
        const linkVerificacion = `https://nlmancuso.github.io/gastos-dev/?verified=true&uid=${user.uid}`;

        // 2. Enviar mail usando EmailJS con la plantilla correcta (template_j01kfcn)
        try {
            if (typeof emailjs !== 'undefined') {
                await emailjs.send('service_hib3aln', 'template_j01kfcn', {
                    to_email: email,
                    to_name: email.split('@')[0],
                    link_verificacion: linkVerificacion
                });
            }
        } catch (emailErr) {
            console.error("Error al enviar email mediante EmailJS:", emailErr);
        }

        // 3. Crear su Espacio Personal en Firestore con emailVerificado en false
        const personalDocId = `personal_${user.uid}`;
        const personalDocRef = doc(db, "app_data", personalDocId);

        localStorage.setItem("ultima_vista_id", "personal");

        await setDoc(personalDocRef, {
            appState: JSON.parse(JSON.stringify(appStateLimpioBase)),
            creadoEl: new Date().toISOString(),
            emailVerificado: false
        });

        // 4. Desloguear obligatoriamente para que deba validar el correo
        await signOut(auth);

        alert("¡Cuenta creada con éxito! Por favor revisá tu casilla de correo y hacé clic en el botón de verificación antes de ingresar.");
        window.showLogin();
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        window.showLogin();
        window.mostrarTabAuth('register');
        if (loginError) {
            let msg = "No se pudo crear la cuenta.";
            if (error.code === 'auth/email-already-in-use') msg = "El correo ya se encuentra registrado.";
            if (error.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
            loginError.innerText = msg;
            loginError.classList.remove('hidden');
        }
    }
};

window.cerrarSesion = function() {
    window.showLogin();
    signOut(auth);
};

// Procesar verificación instantánea al cargar la URL con parámetros
function verificarDesdeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const isVerified = urlParams.get('verified') === 'true';
    const uid = urlParams.get('uid');

    if (isVerified && uid) {
        // Guardamos de inmediato en localStorage la marca asociada a este UID
        localStorage.setItem(`verified_${uid}`, 'true');
        alert("¡Cuenta verificada con éxito! Ya podés iniciar sesión.");
        // Limpiamos la URL y recargamos limpiamente para evitar conflictos de asincronía
        window.location.replace(window.location.pathname);
    }
}

// Ejecutar verificación de manera prioritaria al cargar el script
verificarDesdeURL();

window.cambiarVistaSeleccionada = async function(vistaId) {
    if (!vistaId) return;
    
    localStorage.setItem("ultima_vista_id", vistaId);
    window.showLoading();

    let targetDocId = (vistaId === "personal") ? `personal_${auth.currentUser.uid}` : vistaId;

    window.currentGrupo = targetDocId;
    window.docRef = doc(db, "app_data", targetDocId);

    if (unsubscribeSnapshot) unsubscribeSnapshot();

    unsubscribeSnapshot = onSnapshot(window.docRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.appState) {
                window.appState = { ...window.appState, ...data.appState };
            }
        } else {
            if (targetDocId.startsWith("personal_")) {
                window.appState = JSON.parse(JSON.stringify(appStateLimpioBase));
                await setDoc(window.docRef, { 
                    appState: window.appState, 
                    creadoEl: new Date().toISOString() 
                });
            } else {
                window.saveDataToCloud();
            }
        }
        triggerPageRenders();
        window.showApp();
    });
};

// Observador de estado de sesión blindado con localStorage
onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.showLoading();

        // Validar verificación local o admin principal
        const estaVerificadoLocal = localStorage.getItem(`verified_${user.uid}`) === 'true';
        const esAdminPrincipal = user.email === "nicolaslmancuso@gmail.com";

        if (!estaVerificadoLocal && !esAdminPrincipal) {
            alert("Tu cuenta aún no ha sido verificada. Por favor hacé clic en el botón del correo que te enviamos para poder ingresar.");
            await signOut(auth);
            window.showLogin();
            return;
        }

        const dLocal = new Date();
        const currentLocalMonthStr = `${dLocal.getFullYear()}-${String(dLocal.getMonth() + 1).padStart(2, '0')}`;
        
        let vistaGuardada = localStorage.getItem("ultima_vista_id") || "personal";
        await window.poblarSelectorVistas(vistaGuardada);

        let targetDocId = (vistaGuardada === "personal") ? `personal_${user.uid}` : vistaGuardada;
        const docRef = doc(db, "app_data", targetDocId);
        window.docRef = docRef;
        window.currentGrupo = targetDocId;
        window.docHormigaRef = doc(db, "app_data_hormiga", user.uid);

        if (unsubscribeSnapshot) unsubscribeSnapshot();
        if (unsubscribeHormiga) unsubscribeHormiga();

        unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.appState) {
                    window.appState = { ...window.appState, ...data.appState };
                    if (!window.appState.subcategorias) window.appState.subcategorias = JSON.parse(JSON.stringify(subcategoriasDefault));
                    if (!window.appState.aumentosIndividuales) window.appState.aumentosIndividuales = {};
                    if (!window.appState.excepcionesEliminacionSoloMes) window.appState.excepcionesEliminacionSoloMes = {};
                    if (!window.appState.currentMonth) window.appState.currentMonth = currentLocalMonthStr;
                }
            } else {
                if (targetDocId.startsWith("personal_")) {
                    window.appState = JSON.parse(JSON.stringify(appStateLimpioBase));
                    await setDoc(docRef, { 
                        appState: window.appState, 
                        creadoEl: new Date().toISOString() 
                    });
                } else {
                    window.saveDataToCloud();
                }
            }
            triggerPageRenders();
            window.showApp();
        });

        unsubscribeHormiga = onSnapshot(window.docHormigaRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.hormigaState) {
                    window.hormigaState = { ...window.hormigaState, ...data.hormigaState };
                } else {
                    window.hormigaState = {
                        gastos: [],
                        categorias: JSON.parse(JSON.stringify(categoriasHormigaDefault)),
                        sortColumn: 'fecha',
                        sortAscending: false,
                        filtrosCategorias: [],
                        filtrosHormigaCatGrafico: []
                    };
                }
            } else {
                window.hormigaState = {
                    gastos: [],
                    categorias: JSON.parse(JSON.stringify(categoriasHormigaDefault)),
                    sortColumn: 'fecha',
                    sortAscending: false,
                    filtrosCategorias: [],
                    filtrosHormigaCatGrafico: []
                };
                window.saveHormigaDataToCloud();
            }
            triggerPageRenders();
        });

        escucharInvitacionesUsuario(user.email);

        const userName = user.email ? user.email.split('@')[0] : 'Usuario';
        const grupoDisplay = document.getElementById('grupoStatus');
        if (grupoDisplay) grupoDisplay.innerHTML = `👤 ${userName}`;
    } else {
        window.showLogin();
        if (unsubscribeSnapshot) { unsubscribeSnapshot(); unsubscribeSnapshot = null; }
        if (unsubscribeHormiga) { unsubscribeHormiga(); unsubscribeHormiga = null; }
        if (unsubscribeInvitaciones) { unsubscribeInvitaciones(); unsubscribeInvitaciones = null; }
    }
});

function escucharInvitacionesUsuario(userEmail) {
    if (unsubscribeInvitaciones) unsubscribeInvitaciones();

    const q = query(
        collection(db, "invitaciones"), 
        where("destinatarioEmail", "==", userEmail.toLowerCase()),
        where("estado", "==", "PENDIENTE")
    );

    unsubscribeInvitaciones = onSnapshot(q, (snapshot) => {
        const invitaciones = [];
        snapshot.forEach(docSnap => {
            invitaciones.push({ id: docSnap.id, ...docSnap.data() });
        });
        window.renderBandejaNotificaciones(invitaciones);
    });
}

window.toggleBandejaNotificaciones = function() {
    const drop = document.getElementById('dropdownNotificaciones');
    if (drop) drop.classList.toggle('hidden');
};

window.renderBandejaNotificaciones = function(invitaciones) {
    const badge = document.getElementById('badgeNotificaciones');
    const lista = document.getElementById('listaNotificaciones');
    if (!badge || !lista) return;

    if (invitaciones.length > 0) {
        badge.innerText = invitaciones.length;
        badge.classList.remove('hidden');
        lista.innerHTML = '';

        invitaciones.forEach(inv => {
            lista.innerHTML += `
                <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                    <p class="text-slate-300">
                        <strong class="text-amber-400">${inv.remitenteEmail}</strong> te invitó a unirte a <strong>${inv.grupoNombre}</strong> (${inv.rol}).
                    </p>
                    <div class="flex gap-2 justify-end">
                        <button onclick="responderInvitacion('${inv.id}', '${inv.grupoId}', '${inv.rol}', 'RECHAZADO')" class="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg font-semibold text-[11px]">
                            Rechazar
                        </button>
                        <button onclick="responderInvitacion('${inv.id}', '${inv.grupoId}', '${inv.rol}', 'ACEPTADO')" class="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg font-bold text-[11px]">
                            Aceptar
                        </button>
                    </div>
                </div>
            `;
        });
    } else {
        badge.classList.add('hidden');
        lista.innerHTML = `<p class="text-xs text-slate-500 text-center py-2">No tenés notificaciones pendientes.</p>`;
    }
};

window.responderInvitacion = async function(invitacionId, grupoId, rol, nuevoEstado) {
    try {
        const user = auth.currentUser;
        const invRef = doc(db, "invitaciones", invitacionId);
        await updateDoc(invRef, { estado: nuevoEstado });

        if (nuevoEstado === 'ACEPTADO') {
            const grupoRef = doc(db, "app_data", grupoId);
            const grupoSnap = await getDoc(grupoRef);

            if (grupoSnap.exists()) {
                const data = grupoSnap.data();
                const grupoInfo = data.appState.grupoInfo || { miembros: {} };
                grupoInfo.miembros[user.uid] = { email: user.email, rol: rol };

                await updateDoc(grupoRef, { "appState.grupoInfo": grupoInfo });
            }

            alert("¡Te uniste al grupo con éxito!");
            await window.poblarSelectorVistas(grupoId);
            window.cambiarVistaSeleccionada(grupoId);
        } else {
            alert("Has rechazado la invitación.");
        }
    } catch (e) {
        console.error("Error al responder invitación:", e);
    }
};

window.salirDelGrupoActual = async function() {
    if (!confirm("¿Deseás salir de este grupo? Ya no tendrás acceso a sus datos.")) return;

    try {
        const user = auth.currentUser;
        const grupoId = window.currentGrupo;
        const grupoRef = doc(db, "app_data", grupoId);
        const grupoSnap = await getDoc(grupoRef);

        if (grupoSnap.exists()) {
            const data = grupoSnap.data();
            const miembros = data.appState.grupoInfo?.miembros || {};
            delete miembros[user.uid];

            await updateDoc(grupoRef, { "appState.grupoInfo.miembros": miembros });
            alert("Has salido del grupo correctamente.");
            await window.poblarSelectorVistas("personal");
            window.cambiarVistaSeleccionada("personal");
        }
    } catch (e) {
        console.error("Error al salir del grupo:", e);
    }
};

window.saveDataToCloud = async function() {
    try {
        if (!window.docRef) return;
        await setDoc(window.docRef, { appState: JSON.parse(JSON.stringify(window.appState)) });
    } catch (e) { console.error(e); }
};

window.saveHormigaDataToCloud = async function() {
    try {
        if (!window.docHormigaRef) return;
        await setDoc(window.docHormigaRef, { hormigaState: JSON.parse(JSON.stringify(window.hormigaState)) });
    } catch (e) { console.error("Error guardando hormiga:", e); }
};

function actualizarVisibilidadBotonesAdmin() {
    const user = auth.currentUser;
    const userEmail = user ? user.email : '';
    const userUid = user ? user.uid : null;

    if (window.appState && !window.appState.grupoInfo && userUid) {
        window.appState.grupoInfo = {
            adminUid: userUid,
            miembros: {
                [userUid]: { email: userEmail, rol: 'admin' }
            },
            invitacionesPendientes: []
        };
    }

    const grupoInfo = window.appState ? window.appState.grupoInfo : null;
    const esAdmin = userEmail === "nicolaslmancuso@gmail.com" || !grupoInfo || (grupoInfo && grupoInfo.adminUid === userUid);

    const btnConfigCat = document.getElementById('btnConfigCat');
    const btnGestionGrupo = document.getElementById('btnGestionGrupo');

    if (esAdmin) {
        if (btnConfigCat) { btnConfigCat.classList.remove('hidden'); btnConfigCat.style.display = 'inline-flex'; }
        if (btnGestionGrupo) { btnGestionGrupo.classList.remove('hidden'); btnGestionGrupo.style.display = 'inline-flex'; }
    } else {
        if (btnConfigCat) { btnConfigCat.classList.add('hidden'); btnConfigCat.style.display = 'none'; }
        if (btnGestionGrupo) { btnGestionGrupo.classList.add('hidden'); btnGestionGrupo.style.display = 'none'; }
    }
}

function triggerPageRenders() {
    actualizarVisibilidadBotonesAdmin();
    if (typeof renderApp === 'function') renderApp();
    if (typeof renderCharts === 'function') renderCharts();
    if (typeof renderSaldosApp === 'function') renderSaldosApp();
    if (typeof renderHormigaApp === 'function') renderHormigaApp();
}

window.navigateMonth = function(direction) {
    let [year, month] = (window.appState.currentMonth || defaultLocalMonth).split('-').map(Number);
    month += direction;
    if (month > 12) { month = 1; year++; } if (month < 1) { month = 12; year--; }
    window.appState.currentMonth = `${year}-${String(month).padStart(2, '0')}`;
    triggerPageRenders();
};

window.formatMonthDisplay = function(ymStr) {
    if (!ymStr) return '';
    const [year, month] = ymStr.split('-').map(Number);
    return `${monthNames[month - 1]} ${year}`;
};

window.formatFechaVencimientoSimple = function(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fechaStr;
};

window.sumarUnMesAFecha = function(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return '';
    let y = parseInt(partes[0]), m = parseInt(partes[1]), d = parseInt(partes[2]);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    const ultimoDiaMes = new Date(y, m, 0).getDate();
    if (d > ultimoDiaMes) d = ultimoDiaMes;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

window.getSueldoForMonth = function(targetMonth) {
    const sueldos = window.appState.sueldos || {};
    if (sueldos[targetMonth] !== undefined) return parseFloat(sueldos[targetMonth]) || 0;
    let keys = Object.keys(sueldos).sort();
    let sueldoAplicar = 0;
    for (let k of keys) { if (k <= targetMonth) sueldoAplicar = parseFloat(sueldos[k]) || 0; else break; }
    return sueldoAplicar;
};

window.getPorcentajeAumentoGasto = function(gasto) {
    if (window.appState.aumentosIndividuales?.[gasto.id] !== undefined && window.appState.aumentosIndividuales[gasto.id] !== '') {
        return parseFloat(window.appState.aumentosIndividuales[gasto.id]) || 0;
    }
    if (gasto.subcategoriaId) {
        const subcat = (window.appState.subcategorias || []).find(s => s.id === gasto.subcategoriaId);
        if (subcat && subcat.porcentajeAumento) {
            return parseFloat(subcat.porcentajeAumento) || 0;
        }
    }
    return 0;
};

window.getCalculatedDataForMonth = function(targetMonth) {
    const sueldoActual = window.getSueldoForMonth(targetMonth);
    let items = [];
    let totalFijos = 0, totalTarjetas = 0;
    let totalesPorCat = {};
    (window.appState.categorias || categoriasDefault).forEach(cat => totalesPorCat[cat.nombre] = 0);
    const hoyStr = new Date().toISOString().slice(0, 10);

    (window.appState.gastos || []).forEach(gasto => {
        const mesEliminacion = window.appState.excepcionesEliminacion?.[gasto.id];
        if (mesEliminacion && targetMonth >= mesEliminacion) return;

        const borradoPuntual = window.appState.excepcionesEliminacionSoloMes?.[`${gasto.id}_${targetMonth}`];
        if (borradoPuntual) return;

        const excepcionCatKey = `${gasto.id}_${targetMonth}`;
        const categoriaAplicar = window.appState.excepcionesCategoria?.[excepcionCatKey] ?? gasto.categoria;
        const startYM = gasto.startMonth || targetMonth;
        
        let montoAplicar = undefined;
        let baseMonthStr = startYM;

        if (window.appState.excepcionesMonto?.[excepcionCatKey] !== undefined) {
            montoAplicar = parseFloat(window.appState.excepcionesMonto[excepcionCatKey]);
            baseMonthStr = targetMonth;
        } else {
            let [tY, tM] = targetMonth.split('-').map(Number);
            let foundMonto = null;
            let foundMonthStr = null;

            for (let i = 0; i < 36; i++) {
                let checkYM = `${tY}-${String(tM).padStart(2, '0')}`;
                if (window.appState.excepcionesMonto?.[`${gasto.id}_${checkYM}`] !== undefined) {
                    foundMonto = parseFloat(window.appState.excepcionesMonto[`${gasto.id}_${checkYM}`]);
                    foundMonthStr = checkYM;
                    break;
                }
                tM--; if (tM < 1) { tM = 12; tY--; }
            }
            if (foundMonto !== null) {
                montoAplicar = foundMonto;
                baseMonthStr = foundMonthStr;
            } else {
                montoAplicar = parseFloat(gasto.monto);
                baseMonthStr = startYM;
            }
        }
        
        const totalCuotas = parseInt(gasto.cuotas) || 1;
        const baseEsFijo = (gasto.categoria || '').toLowerCase().includes('fijo') || (gasto.categoria || '').toLowerCase().includes('servicio');
        const catEsFijo = categoriaAplicar.toLowerCase().includes('fijo') || categoriaAplicar.toLowerCase().includes('servicio');
        const isRecurrente = gasto.isRecurrente || baseEsFijo || catEsFijo;

        const pctAumento = window.getPorcentajeAumentoGasto(gasto);
        if (isRecurrente && pctAumento > 0 && targetMonth > baseMonthStr) {
            const [bY, bM] = baseMonthStr.split('-').map(Number);
            const [tY, tM] = targetMonth.split('-').map(Number);
            const diffMeses = (tY - bY) * 12 + (tM - bM);

            if (diffMeses > 0) {
                let montoCalculado = montoAplicar;
                for (let m = 0; m < diffMeses; m++) {
                    montoCalculado = montoCalculado * (1 + (pctAumento / 100));
                }
                montoAplicar = Math.round(montoCalculado * 100) / 100;
            }
        }

        let generatedItems = [];
        if (totalCuotas > 1) {
            const montoCuota = montoAplicar / totalCuotas;
            const [sYear, sMonth] = startYM.split('-').map(Number);
            for (let i = 0; i < totalCuotas; i++) {
                let fYear = sYear, fMonth = sMonth + i;
                while (fMonth > 12) { fMonth -= 12; fYear++; }
                let mStr = `${fYear}-${String(fMonth).padStart(2, '0')}`;
                if (mStr === targetMonth) {
                    let vencFinal = gasto.vencimiento || '';
                    for (let step = 0; step < i; step++) vencFinal = window.sumarUnMesAFecha(vencFinal);
                    
                    const gridKey = `${gasto.id}_${targetMonth}`;
                    const vencimientoAplicar = window.appState.excepcionesVencimientoGrid?.[gridKey] !== undefined
                        ? window.appState.excepcionesVencimientoGrid[gridKey]
                        : (window.appState.excepcionesVencimiento?.[gridKey] !== undefined ? window.appState.excepcionesVencimiento[gridKey] : vencFinal);

                    const estadoKey = `${gasto.id}_${targetMonth}`;
                    const estadoGuardado = window.appState.excepcionesEstado?.[estadoKey];
                    let estadoAplicar = estadoGuardado || (vencimientoAplicar && vencimientoAplicar !== 'dd/mm/aaaa' && hoyStr > vencimientoAplicar ? 'VENCIDO' : 'PENDIENTE');

                    generatedItems.push({ id: gasto.id, concepto: gasto.concepto, categoria: categoriaAplicar, tipo: `Cuota ${i + 1}/${totalCuotas}`, monto: montoCuota, vencimiento: vencimientoAplicar, estado: estadoAplicar, isRecurrente: false, subcategoriaId: gasto.subcategoriaId });
                }
            }
        } else if (isRecurrente) {
            if (targetMonth >= startYM) {
                const [sY, sM] = startYM.split('-').map(Number);
                const [tY, tM] = targetMonth.split('-').map(Number);
                const diffMeses = (tY - sY) * 12 + (tM - sM);
                
                let vencCalculado = gasto.vencimiento || '';
                for (let step = 0; step < diffMeses; step++) vencCalculado = window.sumarUnMesAFecha(vencCalculado);

                const gridKey = `${gasto.id}_${targetMonth}`;
                let vencimientoAplicar = window.appState.excepcionesVencimientoGrid?.[gridKey] !== undefined 
                    ? window.appState.excepcionesVencimientoGrid[gridKey] 
                    : (window.appState.excepcionesVencimiento?.[`${gasto.id}_${targetMonth}`] !== undefined 
                        ? window.appState.excepcionesVencimiento[`${gasto.id}_${targetMonth}`] 
                        : vencCalculado);

                const estadoKey = `${gasto.id}_${targetMonth}`;
                const estadoGuardado = window.appState.excepcionesEstado?.[estadoKey];
                let estadoAplicar = estadoGuardado || (vencimientoAplicar && vencimientoAplicar !== 'dd/mm/aaaa' && hoyStr > vencimientoAplicar ? 'VENCIDO' : 'PENDIENTE');

                const tipoStr = (baseEsFijo || catEsFijo) ? 'Recurrente' : 'Débito Automático';
                generatedItems.push({ id: gasto.id, concepto: gasto.concepto, categoria: categoriaAplicar, tipo: tipoStr, monto: montoAplicar, vencimiento: vencimientoAplicar, estado: estadoAplicar, isRecurrente: true, subcategoriaId: gasto.subcategoriaId });
            }
        } else {
            if (targetMonth === startYM) {
                const gridKey = `${gasto.id}_${targetMonth}`;
                const vencimientoAplicar = window.appState.excepcionesVencimientoGrid?.[gridKey] !== undefined ? window.appState.excepcionesVencimientoGrid[gridKey] : (window.appState.excepcionesVencimiento?.[gridKey] !== undefined ? window.appState.excepcionesVencimiento[gridKey] : (gasto.vencimiento ?? ''));

                const estadoKey = `${gasto.id}_${targetMonth}`;
                const estadoGuardado = window.appState.excepcionesEstado?.[estadoKey];
                let estadoAplicar = estadoGuardado || (vencimientoAplicar && vencimientoAplicar !== 'dd/mm/aaaa' && hoyStr > vencimientoAplicar ? 'VENCIDO' : 'PENDIENTE');

                generatedItems.push({ id: gasto.id, concepto: gasto.concepto, categoria: categoriaAplicar, tipo: 'Débito', monto: montoAplicar, vencimiento: vencimientoAplicar, estado: estadoAplicar, isRecurrente: false, subcategoriaId: gasto.subcategoriaId });
            }
        }

        generatedItems.forEach(gi => {
            const catObj = (window.appState.categorias || categoriasDefault).find(c => c.nombre === gi.categoria);
            const esTarjetaCat = catObj ? catObj.esTarjeta : true;
            if (!esTarjetaCat) totalFijos += gi.monto;
            else totalTarjetas += gi.monto;
            if (totalesPorCat[gi.categoria] !== undefined) totalesPorCat[gi.categoria] += gi.monto;
            items.push(gi);
        });
    });
    return { sueldoActual, items, totalFijos, totalTarjetas, totalesPorCat };
};

// Modal Eliminar Gasto
let gastoAEliminarId = null;
let tipoEliminacionSeleccionado = null;

window.deleteGasto = function(id) {
    const gasto = (window.appState.gastos || []).find(g => g.id === id);
    if (!gasto) return;

    gastoAEliminarId = id;
    tipoEliminacionSeleccionado = null;
    const currentMonth = window.appState.currentMonth || defaultLocalMonth;
    const monthText = window.formatMonthDisplay ? window.formatMonthDisplay(currentMonth) : currentMonth;

    const elNombre = document.getElementById('eliminarGastoNombre');
    const elMesTexto = document.getElementById('eliminarGastoMesTexto');
    if (elNombre) elNombre.innerText = `"${gasto.concepto}"`;
    if (elMesTexto) elMesTexto.innerText = monthText;
    
    const pasoSeleccion = document.getElementById('eliminarPasoSeleccion');
    const pasoConfirmacion = document.getElementById('eliminarPasoConfirmacion');
    if (pasoSeleccion) pasoSeleccion.classList.remove('hidden');
    if (pasoConfirmacion) pasoConfirmacion.classList.add('hidden');

    document.querySelectorAll('.eliminarGastoMesRef').forEach(el => el.innerText = monthText);

    const modalEliminar = document.getElementById('modalEliminarGasto');
    if (modalEliminar) modalEliminar.classList.remove('hidden');
};

window.solicitarConfirmacionEliminacion = function(tipoEliminacion) {
    if (!gastoAEliminarId) return;

    tipoEliminacionSeleccionado = tipoEliminacion;
    const gasto = (window.appState.gastos || []).find(g => g.id === gastoAEliminarId);
    const currentMonth = window.appState.currentMonth || defaultLocalMonth;
    const monthText = window.formatMonthDisplay ? window.formatMonthDisplay(currentMonth) : currentMonth;

    let textoModalidad = '';
    if (tipoEliminacion === 'solo_mes') {
        textoModalidad = `ÚNICAMENTE para el mes de ${monthText}`;
    } else if (tipoEliminacion === 'mes_y_futuros') {
        textoModalidad = `A PARTIR de ${monthText} y hacia todos los meses futuros`;
    } else if (tipoEliminacion === 'todo') {
        textoModalidad = `COMPLETAMENTE de la base de datos (todo el historial pasado, presente y futuro)`;
    }

    const txtDetalle = document.getElementById('eliminarConfirmacionDetalleText');
    if (txtDetalle) {
        txtDetalle.innerHTML = `¿Realmente deseás eliminar el gasto <strong class="text-white">"${gasto ? gasto.concepto : ''}"</strong> de forma <strong class="text-amber-400">${textoModalidad}</strong>?`;
    }

    const pasoSeleccion = document.getElementById('eliminarPasoSeleccion');
    const pasoConfirmacion = document.getElementById('eliminarPasoConfirmacion');
    if (pasoSeleccion) pasoSeleccion.classList.add('hidden');
    if (pasoConfirmacion) pasoConfirmacion.classList.remove('hidden');
};

window.volverASeleccionEliminacion = function() {
    tipoEliminacionSeleccionado = null;
    const pasoSeleccion = document.getElementById('eliminarPasoSeleccion');
    const pasoConfirmacion = document.getElementById('eliminarPasoConfirmacion');
    if (pasoSeleccion) pasoSeleccion.classList.remove('hidden');
    if (pasoConfirmacion) pasoConfirmacion.classList.add('hidden');
};

window.ejecutarEliminacionGasto = function() {
    if (!gastoAEliminarId || !tipoEliminacionSeleccionado) return;

    const id = gastoAEliminarId;
    const tipo = tipoEliminacionSeleccionado;
    const currentActiveMonth = window.appState.currentMonth || defaultLocalMonth;

    if (!window.appState.excepcionesEliminacion) window.appState.excepcionesEliminacion = {};
    if (!window.appState.excepcionesEliminacionSoloMes) window.appState.excepcionesEliminacionSoloMes = {};

    if (tipo === 'solo_mes') {
        window.appState.excepcionesEliminacionSoloMes[`${id}_${currentActiveMonth}`] = true;
    } else if (tipo === 'mes_y_futuros') {
        window.appState.excepcionesEliminacion[id] = currentActiveMonth;
    } else if (tipo === 'todo') {
        window.appState.gastos = (window.appState.gastos || []).filter(g => g.id !== id);
        delete window.appState.excepcionesEliminacion[id];
        if (window.appState.aumentosIndividuales) delete window.appState.aumentosIndividuales[id];
        
        Object.keys(window.appState.excepcionesEliminacionSoloMes || {}).forEach(k => {
            if (k.startsWith(`${id}_`)) delete window.appState.excepcionesEliminacionSoloMes[k];
        });
    }

    window.saveDataToCloud();
    if (typeof window.closeModal === 'function') window.closeModal('modalEliminarGasto');
    gastoAEliminarId = null;
    tipoEliminacionSeleccionado = null;
    triggerPageRenders();
};

// Modal Gestión de Grupo
window.openModalGestionGrupo = function() {
    renderMiembrosGrupo();
    const modal = document.getElementById('modalGestionGrupo');
    if (modal) modal.classList.remove('hidden');
};

function renderMiembrosGrupo() {
    const container = document.getElementById('listaMiembrosGrupo');
    const containerPendientes = document.getElementById('containerInvitacionesPendientes');
    const listaPendientes = document.getElementById('listaInvitacionesPendientes');
    const badgeCant = document.getElementById('badgeCantMiembros');
    if (!container) return;

    container.innerHTML = '';
    
    const userEmail = auth.currentUser ? auth.currentUser.email : 'usuario@ejemplo.com';
    const userUid = auth.currentUser ? auth.currentUser.uid : 'uid_actual';

    if (!window.appState.grupoInfo) {
        window.appState.grupoInfo = {
            adminUid: userUid,
            miembros: {
                [userUid]: { email: userEmail, rol: 'admin' }
            },
            invitacionesPendientes: []
        };
    }

    const grupoInfo = window.appState.grupoInfo;
    const esAdmin = userEmail === "nicolaslmancuso@gmail.com" || grupoInfo.adminUid === userUid;

    const formInvitar = document.getElementById('containerFormInvitar');
    if (formInvitar) {
        if (esAdmin) formInvitar.classList.remove('hidden');
        else formInvitar.classList.add('hidden');
    }

    const miembrosArr = Object.entries(grupoInfo.miembros || {});
    if (badgeCant) badgeCant.innerText = `${miembrosArr.length} activo(s)`;

    miembrosArr.forEach(([uid, info]) => {
        const esElAdmin = uid === grupoInfo.adminUid || info.email === "nicolaslmancuso@gmail.com";
        const esYoMismo = uid === userUid;

        container.innerHTML += `
            <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg ${esElAdmin ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' : 'bg-slate-900 text-slate-400'} flex items-center justify-center font-bold text-[11px]">
                        <i class="fa-solid ${esElAdmin ? 'fa-crown' : 'fa-user'}"></i>
                    </div>
                    <div>
                        <span class="font-bold text-white block">${info.email} ${esYoMismo ? '<span class="text-[10px] text-emerald-400 font-normal">(Tú)</span>' : ''}</span>
                        <span class="text-[10px] text-slate-500 uppercase font-semibold">${esElAdmin ? 'admin' : (info.rol || 'miembro')}</span>
                    </div>
                </div>
                ${(esAdmin && !esYoMismo) ? `
                    <div class="flex items-center gap-1.5">
                        <select onchange="cambiarRolMiembro('${uid}', this.value)" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300">
                            <option value="editor" ${info.rol === 'editor' ? 'selected' : ''}>Editor</option>
                            <option value="lector" ${info.rol === 'lector' ? 'selected' : ''}>Lector</option>
                        </select>
                        <button onclick="removerMiembroGrupo('${uid}')" class="text-rose-400 hover:text-rose-300 p-1.5" title="Quitar miembro"><i class="fa-solid fa-user-xmark"></i></button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    const pendientes = grupoInfo.invitacionesPendientes || [];
    if (pendientes.length > 0 && listaPendientes && containerPendientes) {
        containerPendientes.classList.remove('hidden');
        listaPendientes.innerHTML = '';
        pendientes.forEach((inv, idx) => {
            listaPendientes.innerHTML += `
                <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <span class="text-slate-400">${inv.email} <span class="text-[10px] text-amber-400">(${inv.rol})</span></span>
                    ${esAdmin ? `<button onclick="cancelarInvitacion(${idx})" class="text-rose-400 hover:text-rose-300 p-1"><i class="fa-solid fa-xmark"></i></button>` : ''}
                </div>
            `;
        });
    } else if (containerPendientes) {
        containerPendientes.classList.add('hidden');
    }
}

window.handleInvitarMiembro = async function(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('inputInvitarEmail');
    const rolSelect = document.getElementById('selectInvitarRol');
    if (!emailInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const rol = rolSelect ? rolSelect.value : 'editor';
    if (!email) return;

    if (!window.appState.grupoInfo) {
        window.appState.grupoInfo = { adminUid: auth.currentUser.uid, miembros: {}, invitacionesPendientes: [] };
    }
    if (!window.appState.grupoInfo.invitacionesPendientes) {
        window.appState.grupoInfo.invitacionesPendientes = [];
    }

    const yaEsMiembro = Object.values(window.appState.grupoInfo.miembros || {}).some(m => m.email === email);
    if (yaEsMiembro) {
        alert("Ese usuario ya pertenece al grupo.");
        return;
    }

    try {
        await addDoc(collection(db, "invitaciones"), {
            grupoId: window.currentGrupo,
            grupoNombre: "Grupo Control de Gastos",
            remitenteEmail: auth.currentUser.email,
            destinatarioEmail: email,
            rol: rol,
            estado: "PENDIENTE",
            fecha: new Date().toISOString()
        });

        if (typeof emailjs !== 'undefined') {
            emailjs.send('service_hib3aln', 'template_9tbnrfg', {
                to_email: email,
                para_correo_electrónico: email,
                rol_invitado: rol.toUpperCase(),
                remitente: auth.currentUser.email
            });
        }

        window.appState.grupoInfo.invitacionesPendientes.push({ email, rol, fecha: new Date().toISOString() });
        emailInput.value = '';

        window.saveDataToCloud();
        renderMiembrosGrupo();
        alert(`¡Invitación enviada con éxito a ${email}!`);
    } catch (err) {
        console.error("Error al enviar invitación:", err);
    }
};

window.removerMiembroGrupo = function(uid) {
    if (confirm("¿Seguro de remover a este integrante del grupo?")) {
        delete window.appState.grupoInfo.miembros[uid];
        window.saveDataToCloud();
        renderMiembrosGrupo();
    }
};

window.cancelarInvitacion = function(index) {
    if (window.appState.grupoInfo?.invitacionesPendientes) {
        window.appState.grupoInfo.invitacionesPendientes.splice(index, 1);
        window.saveDataToCloud();
        renderMiembrosGrupo();
    }
};
