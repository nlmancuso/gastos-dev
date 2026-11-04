<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Control de Gastos</title>
    
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><path fill='%2310b981' d='M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L96 128c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L64 32zm320 224a32 32 0 1 1 0 64 32 32 0 1 1 0-64z'/></svg>">

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script type="module" src="app.js"></script>
    
    <link rel="prefetch" href="index.html">
    <link rel="prefetch" href="app.js">

    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    <script type="text/javascript">
       (function(){
          emailjs.init("Zmrtl0PIB0VCdpBJg");
       })();
    </script>

    <style>
        body { background-color: #0b1120; color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif; }
        .card-bg { background-color: #111827; border: 1px solid #1e293b; }
        .table-header { background-color: #0f172a; border-bottom: 1px solid #1e293b; }
        .text-green-accent { color: #10b981; }
        .text-blue-accent { color: #6366f1; }
        .tab-btn-active { border-bottom: 2px solid #10b981; color: #10b981; font-weight: 700; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.6; cursor: pointer; }
        .dragging { opacity: 0.4; background-color: #1e293b !important; }
        select option {
            background-color: #020617 !important;
            color: #f8fafc !important;
        }
    </style>
</head>
<body class="min-h-screen pb-12">
    <!-- Login Overlay -->
    <div id="loginOverlay" class="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div class="flex border-b border-slate-800 mb-6">
                <button id="btnTabLogin" onclick="mostrarTabAuth('login')" class="flex-1 pb-3 text-sm font-bold text-amber-500 border-b-2 border-amber-500">
                    Iniciar Sesión
                </button>
                <button id="btnTabRegister" onclick="mostrarTabAuth('register')" class="flex-1 pb-3 text-sm font-bold text-slate-400 hover:text-slate-200">
                    Registrarse
                </button>
            </div>

            <form id="formLogin" onsubmit="handleLogin(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Correo Electrónico</label>
                    <input type="email" id="loginEmail" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
                    <input type="password" id="loginPassword" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
                </div>
                <button type="submit" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-colors">
                    Ingresar
                </button>
            </form>

            <form id="formRegister" onsubmit="handleRegister(event)" class="space-y-4 hidden">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Correo Electrónico</label>
                    <input type="email" id="registerEmail" placeholder="sosaleonela2024@gmail.com" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Contraseña</label>
                    <input type="password" id="registerPassword" required minlength="6" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
                </div>
                <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-colors">
                    Crear Cuenta y Espacio
                </button>
            </form>

            <div id="loginError" class="mt-4 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-400 text-xs hidden"></div>
        </div>
    </div>
    
    <div id="loadingOverlay" class="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 hidden">
        <div class="animate-spin w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"></div>
    </div>

    <div id="appContent" class="hidden">
        <header class="max-w-7xl mx-auto px-4 pt-6 pb-2">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400"><i class="fa-solid fa-wallet text-xl"></i></div>
                    <div><h1 class="text-xl font-bold text-white">Control de Gastos</h1><p class="text-xs text-slate-400" id="grupoStatus">Cargando...</p></div>
                </div>
                <div class="flex items-center gap-3">
                    <select id="selectorVista" onchange="cambiarVistaSeleccionada(this.value)" class="bg-slate-900 border border-amber-500/50 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-amber-500 transition-all cursor-pointer shadow-lg shadow-amber-500/5">
                    </select>
                </div>
                <div class="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                    <button onclick="navigateMonth(-1)" class="text-slate-400 hover:text-white px-3 py-1"><i class="fa-solid fa-chevron-left"></i></button>
                    <span id="displayMonthText" class="text-sm font-bold text-white px-4 min-w-[140px] text-center">Cargando...</span>
                    <button onclick="navigateMonth(1)" class="text-slate-400 hover:text-white px-3 py-1"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="openModalGasto()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Nuevo Gasto
                    </button>
                    
                    <button id="btnConfigCat" onclick="openModalCatGeneral()" class="p-2.5 rounded-lg card-bg text-slate-400 hover:text-white transition" title="Configurar Categorías">
                        <i class="fa-solid fa-gear text-sm"></i>
                    </button>
                    
                    <button id="btnGestionGrupo" onclick="openModalGestionGrupo()" class="p-2.5 rounded-lg card-bg text-slate-400 hover:text-emerald-400 transition" title="Gestión del Grupo Familiar">
                        <i class="fa-solid fa-users text-sm"></i>
                    </button>

                    <div class="relative">
                        <button onclick="toggleBandejaNotificaciones()" class="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl relative transition-colors" title="Invitaciones a grupos">
                            <i class="fa-solid fa-bell"></i>
                            <span id="badgeNotificaciones" class="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full hidden">0</span>
                        </button>
                        <div id="dropdownNotificaciones" class="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 hidden z-50 space-y-2">
                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Invitaciones a Grupos</h4>
                            <div id="listaNotificaciones" class="space-y-1.5 max-h-60 overflow-y-auto">
                                <p class="text-xs text-slate-500 text-center py-2">No tenés notificaciones pendientes.</p>
                            </div>
                        </div>
                    </div>

                    <button onclick="cerrarSesion()" class="p-2.5 rounded-lg card-bg text-slate-400 hover:text-rose-400 transition" title="Cerrar Sesión">
                        <i class="fa-solid fa-right-from-bracket text-sm"></i>
                    </button>
                    
                    <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sincronizado
                    </div>
                </div>
            </div>

            <div class="flex border-b border-slate-800 overflow-x-auto">
                <button onclick="switchTab('planilla')" id="btnTabPlanilla" class="px-5 py-2.5 text-sm font-semibold tab-btn-active flex items-center gap-2 cursor-pointer"><i class="fa-solid fa-table-list"></i> Planilla de Gastos</button>
                <button onclick="switchTab('analisis')" id="btnTabAnalisis" class="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer"><i class="fa-solid fa-chart-pie"></i> Análisis y Gráficos</button>
                <button onclick="switchTab('saldos')" id="btnTabSaldos" class="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer"><i class="fa-solid fa-building-columns text-emerald-400"></i> Saldos y Bancos</button>
                <button onclick="switchTab('hormiga')" id="btnTabHormiga" class="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer"><i class="fa-solid fa-cookie-bite text-amber-400"></i> Gastos Hormiga <span class="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-mono">Privado</span></button>
            </div>
        </header>

        <section id="viewPlanilla" class="max-w-7xl mx-auto px-4 py-4 space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div class="card-bg p-5 rounded-2xl">
                    <div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-slate-400 uppercase">INGRESO / SUELDO</span><button onclick="openModalSueldo()" class="text-xs text-emerald-400 hover:underline flex items-center gap-1"><i class="fa-solid fa-pen text-[10px]"></i> Editar</button></div>
                    <h2 id="cardSueldo" class="text-2xl font-extrabold text-green-accent my-1">$ 0,00</h2>
                </div>
                <div class="card-bg p-5 rounded-2xl"><span class="text-xs font-bold text-slate-400 uppercase">GASTOS FIJOS</span><h2 id="cardGastosFijos" class="text-2xl font-extrabold text-amber-500 my-1">$ 0,00</h2></div>
                <div class="card-bg p-5 rounded-2xl"><span class="text-xs font-bold text-slate-400 uppercase">TOTAL TARJETAS</span><h2 id="cardTarjetas" class="text-2xl font-extrabold text-blue-accent my-1">$ 0,00</h2></div>
                <div class="card-bg p-5 rounded-2xl"><span class="text-xs font-bold text-slate-400 uppercase">GASTOS TOTALES</span><h2 id="cardGastosTotales" class="text-2xl font-extrabold text-rose-500 my-1">$ 0,00</h2></div>
                <div class="card-bg p-5 rounded-2xl"><span class="text-xs font-bold text-slate-400 uppercase">RESTO DISPONIBLE</span><h2 id="cardResto" class="text-2xl font-extrabold text-green-accent my-1">$ 0,00</h2></div>
            </div>
            
            <div class="card-bg p-5 rounded-2xl shadow-xl space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-800">
                    <div class="flex items-center gap-3">
                        <h3 class="text-base font-bold text-white">Planilla de Gastos (Agrupada)</h3>
                        <span id="badgeMonth" class="text-xs font-semibold bg-slate-900 text-slate-300 px-3 py-1 rounded-full border border-slate-800">...</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs font-semibold">
                        <span class="text-slate-400">Filtrar:</span>
                        <button onclick="marcarTodosFiltros(true)" class="text-emerald-400 hover:underline">Todos</button>
                        <span class="text-slate-600">|</span>
                        <button onclick="marcarTodosFiltros(false)" class="text-rose-400 hover:underline">Ninguno</button>
                    </div>
                </div>
                <div id="containerFiltrosCategoriasPills" class="flex flex-wrap items-center gap-2 pt-1"></div>
                <div id="containerPlanillaAgrupada" class="space-y-4 pt-2"></div>
            </div>
        </section>

        <!-- (Secciones de análisis, saldos y hormiga se mantienen exactamente igual en tu estructura) -->
        <section id="viewAnalisis" class="max-w-7xl mx-auto px-4 py-4 space-y-6 hidden"></section>
        <section id="viewSaldos" class="max-w-7xl mx-auto px-4 py-4 space-y-6 hidden"></section>
        <section id="viewHormiga" class="max-w-7xl mx-auto px-4 py-4 space-y-6 hidden"></section>
    </div>

    <!-- Modales adicionales (Sueldo, Gasto, etc.) -->
    <div id="modalGasto" class="fixed inset-0 bg-slate-950/80 hidden flex items-center justify-center p-4 z-50 backdrop-blur-sm"></div>

    <script>
        // Render de la planilla agrupada con soporte para Monto Pagado editable y saldo arrastrado
        window.renderPlanillaAgrupadaTabla = function(items) {
            const container = document.getElementById('containerPlanillaAgrupada');
            if (!container) return;
            container.innerHTML = '';

            const filtrosActivos = window.filtrosTemporales || [];
            let itemsFiltrados = items.filter(item => filtrosActivos.length === 0 || filtrosActivos.includes(item.categoria));

            if (itemsFiltrados.length === 0) {
                container.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-8">No hay gastos que coincidan con los filtros seleccionados.</p>';
                return;
            }

            let grupos = {};
            itemsFiltrados.forEach(item => {
                if (!grupos[item.categoria]) grupos[item.categoria] = [];
                grupos[item.categoria].push(item);
            });

            const catList = window.appState.categorias || [];
            const currentMonth = window.appState.currentMonth || '2026-10';
            const fmt = num => "$ " + num.toLocaleString('es-AR', { minimumFractionDigits: 2 });

            Object.entries(grupos).forEach(([categoria, gastosCat]) => {
                const catObj = catList.find(c => c.nombre === categoria);
                const colorCat = catObj ? catObj.color : '#64748b';
                const totalCat = gastosCat.reduce((acc, g) => acc + g.montoPagado, 0);
                const isAbierto = window.categoriasAbiertasMap[categoria] === true;
                const esBloque = catObj ? catObj.vencimientoUnicoEnBloque : false;

                let rowsHtml = '';
                if (isAbierto) {
                    rowsHtml = gastosCat.map(g => {
                        const gridKey = `${g.id}_${currentMonth}`;
                        const vencimientoVal = window.appState.excepcionesVencimientoGrid?.[gridKey] !== undefined ? window.appState.excepcionesVencimientoGrid[gridKey] : (g.vencimiento || '');
                        const estadoVal = g.estado || 'PENDIENTE';

                        const subcatIdActual = window.appState.excepcionesSubcategoria?.[gridKey] !== undefined ? window.appState.excepcionesSubcategoria[gridKey] : g.subcategoriaId;
                        const subcatObj = (window.appState.subcategorias || []).find(s => s.id === subcatIdActual);
                        const subcatNombre = subcatObj ? subcatObj.nombre : '-';

                        const diferencia = g.monto - g.montoPagado;
                        const badgeArrastrado = g.saldoArrastrado > 0 
                            ? `<span class="block text-[10px] text-amber-400 font-normal">(+$${g.saldoArrastrado.toFixed(2)} de deuda anterior)</span>` 
                            : '';
                        const badgePendiente = diferencia > 0 
                            ? `<span class="block text-[10px] text-rose-400 font-bold">Pasa $${diferencia.toFixed(2)} al mes siguiente</span>` 
                            : '';

                        return `
                            <tr class="hover:bg-slate-900/40 transition-colors border-b border-slate-800/40 text-xs">
                                <td class="px-4 py-3 text-white font-bold">${g.concepto}</td>
                                <td class="px-4 py-3 text-slate-400">${g.tipo}</td>
                                <td class="px-4 py-3 text-slate-300 font-medium">${subcatNombre}</td>
                                <td class="px-4 py-3">
                                    <input type="date" value="${vencimientoVal}" onchange="actualizarVencimientoGrid('${g.id}', '${currentMonth}', this.value, '${categoria}')" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-amber-400 font-bold">
                                </td>
                                <td class="px-4 py-3 text-right font-extrabold text-slate-300">
                                    ${fmt(g.monto)}
                                    ${badgeArrastrado}
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <input type="number" step="0.01" value="${g.montoPagado}" onchange="actualizarMontoPagado('${g.id}', '${currentMonth}', this.value)" class="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-emerald-400 text-right focus:outline-none">
                                    ${badgePendiente}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <select onchange="actualizarEstadoGasto('${g.id}', '${currentMonth}', this.value)" class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-bold ${estadoVal === 'PAGADO' ? 'text-emerald-400' : (estadoVal === 'VENCIDO' ? 'text-rose-400' : 'text-amber-500')} cursor-pointer">
                                        <option value="PENDIENTE" ${estadoVal === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                                        <option value="PAGADO" ${estadoVal === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
                                        <option value="VENCIDO" ${estadoVal === 'VENCIDO' ? 'selected' : ''}>VENCIDO</option>
                                    </select>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <button onclick="deleteGasto('${g.id}')" class="text-slate-400 hover:text-rose-400 p-1"><i class="fa-solid fa-trash-can text-xs"></i></button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }

                container.innerHTML += `
                    <div class="bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800/80 mb-3">
                        <div class="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 flex justify-between items-center cursor-pointer" onclick="toggleCategoriaAcordeon('${categoria}')">
                            <div class="flex items-center gap-3">
                                <span class="w-3 h-3 rounded-full" style="background-color: ${colorCat};"></span>
                                <span class="text-sm font-bold text-white">${categoria}</span>
                                <span class="text-[11px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">${gastosCat.length} ítem(s)</span>
                            </div>
                            <span class="text-sm font-extrabold text-emerald-400">TOTAL PAGADO: ${fmt(totalCat)}</span>
                        </div>
                        ${isAbierto ? `
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="table-header text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            <th class="px-4 py-3">CONCEPTO</th>
                                            <th class="px-4 py-3">TIPO</th>
                                            <th class="px-4 py-3">SUBCATEGORÍA</th>
                                            <th class="px-4 py-3">VENCIMIENTO</th>
                                            <th class="px-4 py-3 text-right">MONTO ORIG.</th>
                                            <th class="px-4 py-3 text-right">MONTO PAGADO</th>
                                            <th class="px-4 py-3 text-center">ESTADO</th>
                                            <th class="px-4 py-3 text-right">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-800/60 text-sm font-medium">
                                        ${rowsHtml}
                                    </tbody>
                                </table>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        };

        window.toggleCategoriaAcordeon = function(catNombre) { 
            window.categoriasAbiertasMap[catNombre] = !window.categoriasAbiertasMap[catNombre]; 
            renderApp(); 
        };
    </script>
</body>
</html>
