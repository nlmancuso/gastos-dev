        let currentActiveTab = 'planilla';

        window.switchTab = function(tabName) {
            currentActiveTab = tabName;
            
            document.getElementById('viewPlanilla').classList.add('hidden');
            document.getElementById('viewAnalisis').classList.add('hidden');
            document.getElementById('viewSaldos').classList.add('hidden');
            document.getElementById('viewMensual').classList.add('hidden');
            document.getElementById('viewHormiga').classList.add('hidden');

            document.getElementById('btnTabPlanilla').className = "px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer";
            document.getElementById('btnTabAnalisis').className = "px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer";
            document.getElementById('btnTabSaldos').className = "px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer";
            document.getElementById('btnTabMensual').className = "px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer";
            document.getElementById('btnTabHormiga').className = "px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 cursor-pointer";

            if (tabName === 'planilla') {
                document.getElementById('viewPlanilla').classList.remove('hidden');
                document.getElementById('btnTabPlanilla').className = "px-5 py-2.5 text-sm font-semibold tab-btn-active flex items-center gap-2 cursor-pointer";
                renderPlanillaTab();
            } else if (tabName === 'analisis') {
                document.getElementById('viewAnalisis').classList.remove('hidden');
                document.getElementById('btnTabAnalisis').className = "px-5 py-2.5 text-sm font-semibold tab-btn-active flex items-center gap-2 cursor-pointer";
                initChartRangeInputs();
                initRecurrentesCheckboxesList();
                renderFiltrosGraficosCheckboxes();
                renderCharts();
            } else if (tabName === 'saldos') {
                document.getElementById('viewSaldos').classList.remove('hidden');
                document.getElementById('btnTabSaldos').className = "px-5 py-2.5 text-sm font-semibold tab-btn-active flex items-center gap-2 cursor-pointer";
                renderSaldosApp();
            } else if (tabName === 'mensual') {
                document.getElementById('viewMensual').classList.remove('hidden');
                document.getElementById('btnTabMensual').className = "px-5 py-2.5 text-sm font-semibold tab-btn-active flex items-center gap-2 cursor-pointer";
                renderGastoMensualApp();
            } else if (tabName === 'hormiga') {
                document.getElementById('viewHormiga').classList.remove('hidden');
                document.getElementById('btnTabHormiga').className = "px-5 py-2.5 text-sm font-semibold tab-btn-active flex items-center gap-2 cursor-pointer";
                renderHormigaApp();
            }
        };

        function renderApp() {
            const currentMonth = window.appState.currentMonth || '2026-10';
            if(document.getElementById('displayMonthText')) document.getElementById('displayMonthText').innerText = window.formatMonthDisplay(currentMonth);
            if(document.getElementById('badgeMonth')) document.getElementById('badgeMonth').innerText = window.formatMonthDisplay(currentMonth);

            window.renderActiveView(currentActiveTab, {
                planilla: renderPlanillaTab,
                analisis: renderCharts,
                saldos: renderSaldosApp,
                mensual: renderGastoMensualApp,
                hormiga: renderHormigaApp
            });
        }

        function obtenerItemsPlanillaConSaldo(targetMonth) {
            const pagosIndividuales = window.appState.excepcionesMontoPagado || {};
            const pagosBloque = window.appState.excepcionesMontoPagadoBloque || {};
            const balancesIndividuales = {};
            const balancesBloque = {};
            const ultimosItemsIndividuales = {};
            const categorias = window.appState.categorias || [];
            const gastos = window.appState.gastos || [];
            const mesesConInicio = gastos
                .map(gasto => gasto.startMonth)
                .filter(mes => /^\d{4}-\d{2}$/.test(mes || '') && mes <= targetMonth);
            let mes = mesesConInicio.length ? mesesConInicio.sort()[0] : targetMonth;
            const itemsObjetivo = [];

            const avanzarMes = valor => {
                let [año, numeroMes] = valor.split('-').map(Number);
                numeroMes += 1;
                if (numeroMes > 12) { numeroMes = 1; año += 1; }
                return `${año}-${String(numeroMes).padStart(2, '0')}`;
            };

            while (mes <= targetMonth) {
                let itemsMes = window.getCalculatedDataForMonth(mes).items;
                if (mes !== targetMonth) {
                    itemsMes = itemsMes.filter(item => {
                        const gasto = gastos.find(registro => registro.id === item.id);
                        return gasto && gasto.startMonth;
                    });
                }

                const categoriasActivas = new Set(itemsMes
                    .filter(item => categorias.find(categoria => categoria.nombre === item.categoria)?.vencimientoUnicoEnBloque)
                    .map(item => item.categoria));
                const idsActivos = new Set(itemsMes
                    .filter(item => !categorias.find(categoria => categoria.nombre === item.categoria)?.vencimientoUnicoEnBloque)
                    .map(item => item.id));

                Object.entries(balancesIndividuales).forEach(([id, saldo]) => {
                    if (saldo > 0 && !idsActivos.has(id) && ultimosItemsIndividuales[id]) {
                        itemsMes.push({ ...ultimosItemsIndividuales[id], id, monto: 0, esSaldoArrastrado: true });
                    }
                });
                Object.entries(balancesBloque).forEach(([nombre, saldo]) => {
                    if (saldo > 0 && !categoriasActivas.has(nombre)) {
                        itemsMes.push({
                            id: `saldo_bloque_${encodeURIComponent(nombre)}`,
                            concepto: 'Saldo pendiente de meses anteriores',
                            categoria: nombre,
                            tipo: 'Saldo anterior',
                            monto: 0,
                            vencimiento: '',
                            estado: 'PENDIENTE',
                            esSaldoArrastrado: true
                        });
                    }
                });

                const porCategoriaBloque = new Map();
                const resultadoMes = [];
                itemsMes.forEach(item => {
                    const esBloque = categorias.find(categoria => categoria.nombre === item.categoria)?.vencimientoUnicoEnBloque;
                    if (esBloque) {
                        if (!porCategoriaBloque.has(item.categoria)) porCategoriaBloque.set(item.categoria, []);
                        porCategoriaBloque.get(item.categoria).push(item);
                        return;
                    }

                    const idPago = item.idPago || item.id;
                    const key = `${idPago}_${mes}`;
                    const montoDebido = Math.round(((Number(item.monto) || 0) + (balancesIndividuales[idPago] || 0)) * 100) / 100;
                    const montoPagado = pagosIndividuales[key] !== undefined
                        ? Math.min(Math.max(Number(pagosIndividuales[key]) || 0, 0), montoDebido)
                        : montoDebido;
                    balancesIndividuales[idPago] = Math.max(0, Math.round((montoDebido - montoPagado) * 100) / 100);
                    ultimosItemsIndividuales[idPago] = item;
                    resultadoMes.push({
                        ...item,
                        idPago,
                        monto: montoDebido,
                        montoPagado,
                        montoDebido,
                        esSaldoArrastrado: !!item.esSaldoArrastrado
                    });
                });

                porCategoriaBloque.forEach((gastosCategoria, nombre) => {
                    const saldoAnterior = balancesBloque[nombre] || 0;
                    const montoDebido = Math.round((gastosCategoria.reduce((total, item) => total + (Number(item.monto) || 0), 0) + saldoAnterior) * 100) / 100;
                    const key = `${nombre}_${mes}`;
                    const montoPagado = pagosBloque[key] !== undefined
                        ? Math.min(Math.max(Number(pagosBloque[key]) || 0, 0), montoDebido)
                        : montoDebido;
                    balancesBloque[nombre] = Math.max(0, Math.round((montoDebido - montoPagado) * 100) / 100);
                    gastosCategoria.forEach((item, index) => {
                        resultadoMes.push({
                            ...item,
                            monto: Number(item.monto) || 0,
                            montoPagadoBloque: index === 0 ? montoPagado : undefined,
                            montoDebidoBloque: index === 0 ? montoDebido : undefined,
                            saldoAnteriorBloque: index === 0 ? saldoAnterior : undefined,
                            esSaldoBloqueArrastrado: !!item.esSaldoArrastrado
                        });
                    });
                });

                if (mes === targetMonth) itemsObjetivo.push(...resultadoMes);
                mes = avanzarMes(mes);
            }
            return itemsObjetivo;
        }

        window.actualizarMontoPagadoPlanilla = async function(input, esBloque) {
            if (!window.esUsuarioEditor()) {
                window.mostrarMensajeApp('Acceso restringido', 'Tu permiso en este grupo es de solo lectura.', 'error');
                renderPlanillaTab();
                return;
            }
            const monto = Number(input.value);
            const maximo = Number(input.max);
            if (!Number.isFinite(monto) || monto < 0 || monto > maximo) {
                window.mostrarMensajeApp('Monto no válido', 'El monto pagado debe estar entre cero y el total adeudado.', 'error');
                renderPlanillaTab();
                return;
            }
            const mes = window.appState.currentMonth || '2026-10';
            const id = esBloque
                ? `${decodeURIComponent(input.dataset.categoria)}_${mes}`
                : `${input.dataset.id}_${mes}`;
            try {
                await window.guardarMontoPagadoPlanilla(id, Math.round(monto * 100) / 100, esBloque);
                renderPlanillaTab();
            } catch (error) {
                console.error('Error al guardar el monto pagado:', error);
                window.mostrarMensajeApp('No se pudo guardar el monto pagado', 'Revisá tu conexión y tus permisos e intentá nuevamente.', 'error');
                renderPlanillaTab();
            }
        };

        function renderPlanillaTab() {
            const currentMonth = window.appState.currentMonth || '2026-10';
            const calculo = window.getCalculatedDataForMonth(currentMonth);
            const items = obtenerItemsPlanillaConSaldo(currentMonth);
            const totalFijos = items.reduce((total, item) => {
                const categoria = (window.appState.categorias || []).find(cat => cat.nombre === item.categoria);
                const montoConSaldo = item.montoDebidoBloque !== undefined
                    ? item.montoDebidoBloque - item.monto + (Number(item.monto) || 0)
                    : item.monto;
                return total + (categoria && !categoria.esTarjeta ? montoConSaldo : 0);
            }, 0);
            const totalTarjetas = items.reduce((total, item) => {
                const categoria = (window.appState.categorias || []).find(cat => cat.nombre === item.categoria);
                const montoConSaldo = item.montoDebidoBloque !== undefined
                    ? item.montoDebidoBloque - item.monto + (Number(item.monto) || 0)
                    : item.monto;
                return total + (categoria ? (categoria.esTarjeta ? montoConSaldo : 0) : montoConSaldo);
            }, 0);
            const { sueldoActual } = calculo;
            const totalGastosMes = totalFijos + totalTarjetas;
            const fmt = num => "$ " + num.toLocaleString('es-AR', { minimumFractionDigits: 2 });

            if(document.getElementById('cardSueldo')) document.getElementById('cardSueldo').innerText = fmt(sueldoActual);
            if(document.getElementById('cardGastosFijos')) document.getElementById('cardGastosFijos').innerText = fmt(totalFijos);
            if(document.getElementById('cardTarjetas')) document.getElementById('cardTarjetas').innerText = fmt(totalTarjetas);
            if(document.getElementById('cardGastosTotales')) document.getElementById('cardGastosTotales').innerText = fmt(totalGastosMes);
            if(document.getElementById('cardResto')) document.getElementById('cardResto').innerText = fmt(sueldoActual - totalGastosMes);

            renderFiltrosCategoriasPills();
            window.renderPlanillaAgrupadaTabla(items);
        }

        window.openModalSueldo = function() {
            const currentMonth = window.appState.currentMonth || '2026-10';
            const sueldoVal = window.getSueldoForMonth(currentMonth);
            document.getElementById('inputSueldoMonto').value = sueldoVal;
            document.getElementById('modalSueldo').classList.remove('hidden');
        };

        window.handleSaveSueldo = function(e) {
            e.preventDefault();
            const currentMonth = window.appState.currentMonth || '2026-10';
            const monto = parseFloat(document.getElementById('inputSueldoMonto').value) || 0;
            if (!window.appState.sueldos) window.appState.sueldos = {};
            window.appState.sueldos[currentMonth] = monto;
            window.saveDataToCloud();
            window.closeModal('modalSueldo');
            renderApp();
        };

        function renderFiltrosCategoriasPills() {
            const container = document.getElementById('containerFiltrosCategoriasPills');
            if (!container) return;
            container.innerHTML = '';
            const catList = window.appState.categorias || [];
            if (window.filtrosTemporales === undefined) window.filtrosTemporales = [];

            catList.forEach(cat => {
                const isChecked = window.filtrosTemporales.length === 0 || window.filtrosTemporales.includes(cat.nombre);
                const label = document.createElement('label');
                label.className = `cursor-pointer px-3 py-1.5 rounded-xl text-xs font-semibold border transition inline-flex items-center gap-2 ${isChecked ? 'bg-slate-900 text-white border-slate-700 shadow-md' : 'bg-slate-950/60 text-slate-500 border-slate-900'}`;
                label.innerHTML = `
                    <input type="checkbox" value="${cat.nombre}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroCategoriaPill(this)" class="hidden">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color};"></span>
                    ${cat.nombre}
                `;
                container.appendChild(label);
            });
        }

        window.toggleFiltroCategoriaPill = function(checkbox) {
            const catNombre = checkbox.value;
            const catList = window.appState.categorias || [];
            if (window.filtrosTemporales.length === 0) window.filtrosTemporales = catList.map(c => c.nombre);
            if (checkbox.checked) {
                if (!window.filtrosTemporales.includes(catNombre)) window.filtrosTemporales.push(catNombre);
            } else {
                window.filtrosTemporales = window.filtrosTemporales.filter(c => c !== catNombre);
            }
            if (window.filtrosTemporales.length === catList.length) window.filtrosTemporales = [];
            renderApp();
        };

        window.marcarTodosFiltros = function(marcar) {
            window.filtrosTemporales = marcar ? [] : ['__NINGUNA__'];
            renderApp();
        };

        let draggedRowId = null;
        window.dragStart = function(e) { draggedRowId = e.currentTarget.getAttribute('data-id'); e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; };
        window.dragOver = function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
        window.dropItem = function(e, categoria) {
            e.preventDefault();
            const targetRow = e.target.closest('tr');
            if (!targetRow) return;
            const targetRowId = targetRow.getAttribute('data-id');
            if (!draggedRowId || draggedRowId === targetRowId) return;
            const rows = Array.from(targetRow.parentNode.querySelectorAll('tr[data-id]'));
            let nuevosIds = rows.map(r => r.getAttribute('data-id'));
            const fromIdx = nuevosIds.indexOf(draggedRowId);
            const toIdx = nuevosIds.indexOf(targetRowId);
            if (fromIdx !== -1 && toIdx !== -1) {
                nuevosIds.splice(fromIdx, 1);
                nuevosIds.splice(toIdx, 0, draggedRowId);
                if (!window.appState.ordenItemsCategoria) window.appState.ordenItemsCategoria = {};
                window.appState.ordenItemsCategoria[categoria] = nuevosIds;
                window.saveDataToCloud();
                renderApp();
            }
        };

        window.toggleCategoriaAcordeon = function(catNombre) { window.categoriasAbiertasMap[catNombre] = !window.categoriasAbiertasMap[catNombre]; renderApp(); };
        window.actualizarVencimientoGrid = function(gastoId, monthStr, nuevaFecha, categoriaNombre) {
            if (!window.appState.excepcionesVencimientoGrid) window.appState.excepcionesVencimientoGrid = {};
            const catObj = (window.appState.categorias || []).find(c => c.nombre === categoriaNombre);
            if (catObj && catObj.vencimientoUnicoEnBloque) {
                const calc = window.getCalculatedDataForMonth(monthStr);
                calc.items.forEach(item => { if (item.categoria === categoriaNombre) window.appState.excepcionesVencimientoGrid[`${item.id}_${monthStr}`] = nuevaFecha; });
            } else { window.appState.excepcionesVencimientoGrid[`${gastoId}_${monthStr}`] = nuevaFecha; }
            window.saveDataToCloud(); renderApp();
        };
        window.actualizarEstadoGasto = function(gastoId, monthStr, nuevoEstado) {
            if (!window.appState.excepcionesEstado) window.appState.excepcionesEstado = {};
            window.appState.excepcionesEstado[`${gastoId}_${monthStr}`] = nuevoEstado;
            window.saveDataToCloud(); renderApp();
        };

        window.openModalCatGeneral = function() { 
            renderCatGeneralList(); 
            renderSubcatList();
            document.getElementById('modalCatGeneral').classList.remove('hidden'); 
        };

        function renderCatGeneralList() {
            const container = document.getElementById('listaCatGeneralConfig');
            if (!container) return; container.innerHTML = '';
            (window.appState.categorias || []).forEach((cat, index) => {
                container.innerHTML += `
                    <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2.5 flex-1">
                                <input type="color" value="${cat.color}" onchange="actualizarCatGenCampo(${index}, 'color', this.value)" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 cursor-pointer p-0.5">
                                <input type="text" value="${cat.nombre}" onchange="actualizarCatGenCampo(${index}, 'nombre', this.value)" class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none">
                            </div>
                            <button onclick="eliminarCatGeneral(${index})" class="text-rose-400 hover:text-rose-300 p-2" title="Eliminar"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        </div>
                        <div class="flex items-center gap-2 pt-1 border-t border-slate-900">
                            <input type="checkbox" id="catGenBloque_${index}" ${cat.vencimientoUnicoEnBloque ? 'checked' : ''} onchange="actualizarCatGenCampo(${index}, 'vencimientoUnicoEnBloque', this.checked)" class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 cursor-pointer">
                            <label for="catGenBloque_${index}" class="text-xs text-slate-300 font-semibold cursor-pointer">${cat.vencimientoUnicoEnBloque ? 'Vencimiento único en bloque (Tarjeta)' : 'Vencimiento individual'}</label>
                        </div>
                    </div>`;
            });
        }
        window.actualizarCatGenCampo = function(index, campo, valor) {
            if (!window.appState.categorias[index]) return;
            const nombreAnterior = window.appState.categorias[index].nombre;
            if (campo === 'nombre') {
                const nuevoNombre = valor.trim();
                if (!nuevoNombre) return;
                (window.appState.gastos || []).forEach(g => { if (g.categoria === nombreAnterior) g.categoria = nuevoNombre; });
                window.appState.categorias[index].nombre = nuevoNombre;
            } else { window.appState.categorias[index][campo] = valor; }
            window.saveDataToCloud(); renderApp(); renderCatGeneralList();
        };
        window.agregarCategoriaGeneral = function() {
            const nombre = document.getElementById('nuevaCatGenNombre').value.trim();
            const color = document.getElementById('nuevaCatGenColor').value;
            const vencimientoUnicoEnBloque = document.getElementById('nuevaCatGenBloque').checked;
            if (!nombre) return;
            if (!window.appState.categorias) window.appState.categorias = [];
            window.appState.categorias.push({ nombre, color, esTarjeta: vencimientoUnicoEnBloque, vencimientoUnicoEnBloque });
            document.getElementById('nuevaCatGenNombre').value = ''; document.getElementById('nuevaCatGenBloque').checked = false;
            window.saveDataToCloud(); renderApp(); renderCatGeneralList();
        };
        window.eliminarCatGeneral = function(index) {
            if (window.appState.categorias.length <= 1) return alert("Debe haber al menos una categoría.");
            window.appState.categorias.splice(index, 1);
            window.saveDataToCloud(); renderApp(); renderCatGeneralList();
        };

        window.actualizarVistaPreviaInflacionModal = function() {
            const montoBase = parseFloat(document.getElementById('gastoMonto').value) || 0;
            const pctIndivStr = document.getElementById('gastoPctAumento').value;
            const subcatId = document.getElementById('gastoSubcategoria').value;
            const isRecurrente = document.getElementById('gastoIsRecurrente').checked;
            const startMonth = document.getElementById('gastoStartMonth').value || window.appState.currentMonth;

            let pctAplicar = 0;
            if (pctIndivStr !== '') {
                pctAplicar = parseFloat(pctIndivStr) || 0;
            } else if (subcatId) {
                const subcat = (window.appState.subcategorias || []).find(s => s.id === subcatId);
                if (subcat) pctAplicar = parseFloat(subcat.porcentajeAumento) || 0;
            }

            const container = document.getElementById('containerVistaPreviaInflacion');
            const grid = document.getElementById('gridVistaPrevia6Meses');

            if (montoBase > 0 && pctAplicar > 0 && startMonth && isRecurrente) {
                grid.innerHTML = '';
                let [currY, currM] = startMonth.split('-').map(Number);
                let montoAcum = montoBase;

                for (let i = 0; i < 6; i++) {
                    if (i > 0) montoAcum = montoAcum * (1 + (pctAplicar / 100));
                    const monthText = window.formatMonthDisplay(`${currY}-${String(currM).padStart(2, '0')}`);
                    const fmtMonto = "$ " + montoAcum.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    
                    grid.innerHTML += `<div class="flex justify-between border-b border-slate-800/60 pb-1"><span>${monthText}:</span> <strong class="text-emerald-400">${fmtMonto}</strong></div>`;
                    
                    currM++;
                    if (currM > 12) { currM = 1; currY++; }
                }
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        };

        window.agregarSubcategoriaGeneral = function() {
            const nombre = document.getElementById('nuevaSubcatNombre').value.trim();
            const pct = parseFloat(document.getElementById('nuevaSubcatPct').value) || 0;
            if (!nombre) return;
            if (!window.appState.subcategorias) window.appState.subcategorias = [];
            window.appState.subcategorias.push({ id: `sub_${Date.now()}`, nombre, porcentajeAumento: pct });
            document.getElementById('nuevaSubcatNombre').value = '';
            document.getElementById('nuevaSubcatPct').value = '';
            window.saveDataToCloud();
            renderSubcatList();
        };

        function renderSubcatList() {
            const container = document.getElementById('listaSubcatGeneralConfig');
            if (!container) return;
            container.innerHTML = '';
            (window.appState.subcategorias || []).forEach((s, idx) => {
                container.innerHTML += `
                    <div class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
                        <span class="font-bold text-slate-300">${s.nombre}</span>
                        <div class="flex items-center gap-2">
                            <span class="bg-amber-950 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-800">${s.porcentajeAumento || 0}%</span>
                            <button onclick="eliminarSubcategoria(${idx})" class="text-rose-400 hover:text-rose-300 p-1"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>`;
            });
        }

        window.eliminarSubcategoria = function(idx) {
            window.appState.subcategorias.splice(idx, 1);
            window.saveDataToCloud();
            renderSubcatList();
        };

        window.toggleCuotasInputModal = function(isCuotas) {
            const container = document.getElementById('containerCuotasInput');
            if (!container) return;
            if (isCuotas) {
                container.classList.remove('hidden');
                if (document.getElementById('gastoCuotas').value < 2) document.getElementById('gastoCuotas').value = 2;
            } else {
                container.classList.add('hidden');
                document.getElementById('gastoCuotas').value = 1;
            }
            actualizarCalculoCuotasModal();
        };

        window.actualizarCalculoCuotasModal = function() {
            const montoTotal = parseFloat(document.getElementById('gastoMonto').value) || 0;
            const cantCuotas = parseInt(document.getElementById('gastoCuotas').value) || 1;
            const infoBox = document.getElementById('infoCuotaCalculada');
            const textoBox = document.getElementById('textoCuotaCalculada');
            const isCuotasChecked = document.getElementById('gastoEsCuotasCheck').checked;

            if (isCuotasChecked && cantCuotas > 1 && montoTotal > 0) {
                const valorCuota = montoTotal / cantCuotas;
                const fmt = num => "$ " + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (textoBox) textoBox.innerText = `Valor de cada cuota: ${fmt(valorCuota)} (${cantCuotas} cuotas)`;
                if (infoBox) infoBox.classList.remove('hidden');
            } else {
                if (infoBox) infoBox.classList.add('hidden');
            }
        };

        window.openModalGasto = function() {
            document.getElementById('gastoId').value = ''; 
            document.getElementById('modalGastoTitulo').innerText = "Nuevo Gasto";
            document.getElementById('gastoConcepto').value = ''; 
            document.getElementById('gastoMonto').value = '';
            document.getElementById('gastoPctAumento').value = '';
            document.getElementById('gastoCuotas').value = '1'; 
            document.getElementById('gastoStartMonth').value = window.appState.currentMonth || '2026-10';
            document.getElementById('gastoVencimiento').value = ''; 
            document.getElementById('gastoIsRecurrente').checked = false;
            document.getElementById('gastoEsCuotasCheck').checked = false;
            document.getElementById('containerCuotasInput').classList.add('hidden');
            document.getElementById('containerVistaPreviaInflacion').classList.add('hidden');
            document.getElementById('infoCuotaCalculada').classList.add('hidden');

            const selectCat = document.getElementById('gastoCategoria'); 
            selectCat.innerHTML = '';
            (window.appState.categorias || []).forEach(c => { 
                const opt = document.createElement('option'); 
                opt.value = c.nombre; 
                opt.innerHTML = c.nombre; 
                selectCat.appendChild(opt); 
            });

            const selectSubcat = document.getElementById('gastoSubcategoria'); 
            selectSubcat.innerHTML = '<option value="">Sin Subcategoría</option>';
            (window.appState.subcategorias || []).forEach(s => { 
                const opt = document.createElement('option'); 
                opt.value = s.id; 
                opt.innerHTML = `${s.nombre} (${s.porcentajeAumento || 0}%)`; 
                selectSubcat.appendChild(opt); 
            });

            document.getElementById('modalGasto').classList.remove('hidden');
        };

        window.editGasto = function(id) {
            const gasto = (window.appState.gastos || []).find(g => g.id === id);
            if (!gasto) return;
            const currentActiveMonth = window.appState.currentMonth || '2026-10';

            document.getElementById('gastoId').value = gasto.id; 
            document.getElementById('modalGastoTitulo').innerText = "Editar Gasto";
            document.getElementById('gastoConcepto').value = gasto.concepto; 
            
            const montoActual = window.appState.excepcionesMonto?.[`${id}_${currentActiveMonth}`] !== undefined 
                ? window.appState.excepcionesMonto[`${id}_${currentActiveMonth}`] 
                : gasto.monto;
            const vencActual = window.appState.excepcionesVencimiento?.[`${id}_${currentActiveMonth}`] !== undefined 
                ? window.appState.excepcionesVencimiento[`${id}_${currentActiveMonth}`] 
                : (gasto.vencimiento || '');
            const pctIndiv = window.appState.aumentosIndividuales?.[id] !== undefined ? window.appState.aumentosIndividuales[id] : '';

            document.getElementById('gastoMonto').value = montoActual;
            document.getElementById('gastoPctAumento').value = pctIndiv;
            const cuotasVal = parseInt(gasto.cuotas) || 1;
            document.getElementById('gastoCuotas').value = cuotasVal; 
            document.getElementById('gastoStartMonth').value = gasto.startMonth || window.appState.currentMonth;
            document.getElementById('gastoVencimiento').value = vencActual; 
            document.getElementById('gastoIsRecurrente').checked = !!gasto.isRecurrente;
            
            const esCuotas = cuotasVal > 1;
            document.getElementById('gastoEsCuotasCheck').checked = esCuotas;
            if (esCuotas) {
                document.getElementById('containerCuotasInput').classList.remove('hidden');
                actualizarCalculoCuotasModal();
            } else {
                document.getElementById('containerCuotasInput').classList.add('hidden');
            }

            const selectCat = document.getElementById('gastoCategoria'); selectCat.innerHTML = '';
            const catActual = window.appState.excepcionesCategoria?.[`${id}_${currentActiveMonth}`] !== undefined
                ? window.appState.excepcionesCategoria[`${id}_${currentActiveMonth}`]
                : gasto.categoria;

            (window.appState.categorias || []).forEach(c => { 
                const opt = document.createElement('option'); 
                opt.value = c.nombre; 
                opt.innerHTML = c.nombre; 
                if (c.nombre === catActual) opt.selected = true; 
                selectCat.appendChild(opt); 
            });

            const selectSubcat = document.getElementById('gastoSubcategoria'); 
            selectSubcat.innerHTML = '<option value="">Sin Subcategoría</option>';
            const subcatActual = window.appState.excepcionesSubcategoria?.[`${id}_${currentActiveMonth}`] !== undefined
                ? window.appState.excepcionesSubcategoria[`${id}_${currentActiveMonth}`]
                : gasto.subcategoriaId;

            (window.appState.subcategorias || []).forEach(s => { 
                const opt = document.createElement('option'); 
                opt.value = s.id; 
                opt.innerHTML = `${s.nombre} (${s.porcentajeAumento || 0}%)`; 
                if (s.id === subcatActual) opt.selected = true;
                selectSubcat.appendChild(opt); 
            });

            actualizarVistaPreviaInflacionModal();
            document.getElementById('modalGasto').classList.remove('hidden');
        };

        window.handleSaveGasto = function(e) {
            e.preventDefault();
            const id = document.getElementById('gastoId').value;
            const concepto = document.getElementById('gastoConcepto').value.trim();
            const monto = parseFloat(document.getElementById('gastoMonto').value) || 0;
            const cuotas = parseInt(document.getElementById('gastoCuotas').value) || 1;
            const categoria = document.getElementById('gastoCategoria').value;
            const subcategoriaId = document.getElementById('gastoSubcategoria').value;
            const pctAumentoVal = document.getElementById('gastoPctAumento').value;
            const startMonth = document.getElementById('gastoStartMonth').value;
            const vencimiento = document.getElementById('gastoVencimiento').value;
            const isRecurrente = document.getElementById('gastoIsRecurrente').checked;

            const currentActiveMonth = window.appState.currentMonth || '2026-10';

            if (!window.appState.gastos) window.appState.gastos = [];
            if (!window.appState.aumentosIndividuales) window.appState.aumentosIndividuales = {};
            if (!window.appState.excepcionesMonto) window.appState.excepcionesMonto = {};
            if (!window.appState.excepcionesVencimiento) window.appState.excepcionesVencimiento = {};
            if (!window.appState.excepcionesCategoria) window.appState.excepcionesCategoria = {};
            if (!window.appState.excepcionesSubcategoria) window.appState.excepcionesSubcategoria = {};

            if (id) {
                window.appState.excepcionesMonto[`${id}_${currentActiveMonth}`] = monto;
                window.appState.excepcionesVencimiento[`${id}_${currentActiveMonth}`] = vencimiento;
                window.appState.excepcionesCategoria[`${id}_${currentActiveMonth}`] = categoria;
                window.appState.excepcionesSubcategoria[`${id}_${currentActiveMonth}`] = subcategoriaId;
                window.appState.aumentosIndividuales[id] = pctAumentoVal;

                let [currY, currM] = currentActiveMonth.split('-').map(Number);
                let montoPropagado = monto;
                let fechaPropagada = vencimiento;

                let pctPropagacion = 0;
                if (pctAumentoVal !== '') {
                    pctPropagacion = parseFloat(pctAumentoVal) || 0;
                } else if (subcategoriaId) {
                    const subcat = (window.appState.subcategorias || []).find(s => s.id === subcategoriaId);
                    if (subcat) pctPropagacion = parseFloat(subcat.porcentajeAumento) || 0;
                }

                for (let i = 1; i <= 36; i++) {
                    currM++;
                    if (currM > 12) { currM = 1; currY++; }
                    let nextMonthStr = `${currY}-${String(currM).padStart(2, '0')}`;
                    
                    if (fechaPropagada) {
                        fechaPropagada = window.sumarUnMesAFecha(fechaPropagada);
                        window.appState.excepcionesVencimiento[`${id}_${nextMonthStr}`] = fechaPropagada;
                    }
                    if (pctPropagacion > 0) {
                        montoPropagado = montoPropagado * (1 + (pctPropagacion / 100));
                    }
                    window.appState.excepcionesMonto[`${id}_${nextMonthStr}`] = Math.round(montoPropagado * 100) / 100;
                    window.appState.excepcionesCategoria[`${id}_${nextMonthStr}`] = categoria;
                    window.appState.excepcionesSubcategoria[`${id}_${nextMonthStr}`] = subcategoriaId;
                }

                const idx = window.appState.gastos.findIndex(g => g.id === id);
                if (idx !== -1) {
                    window.appState.gastos[idx].concepto = concepto;
                    window.appState.gastos[idx].cuotas = cuotas;
                    window.appState.gastos[idx].subcategoriaId = subcategoriaId;
                    window.appState.gastos[idx].isRecurrente = isRecurrente;
                }
            } else {
                const newId = Date.now().toString();
                const nuevoGasto = { id: newId, concepto, monto, cuotas, categoria, subcategoriaId, startMonth, vencimiento, isRecurrente };
                window.appState.gastos.push(nuevoGasto);
                if (pctAumentoVal !== '') window.appState.aumentosIndividuales[newId] = pctAumentoVal;
            }

            window.saveDataToCloud();
            window.closeModal('modalGasto');
            renderApp();
        };

let gastoAEliminarId = null;
let tipoEliminacionSeleccionado = null;

// Dispara el modal inicial con la información del gasto y el mes
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
    
    // Resetear vistas del modal a la selección inicial
    const pasoSeleccion = document.getElementById('eliminarPasoSeleccion');
    const pasoConfirmacion = document.getElementById('eliminarPasoConfirmacion');
    if (pasoSeleccion) pasoSeleccion.classList.remove('hidden');
    if (pasoConfirmacion) pasoConfirmacion.classList.add('hidden');

    document.querySelectorAll('.eliminarGastoMesRef').forEach(el => el.innerText = monthText);

    const modalEliminar = document.getElementById('modalEliminarGasto');
    if (modalEliminar) modalEliminar.classList.remove('hidden');
};

// Solicita la confirmación final mostrando qué opción se eligió
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

    // Alternar vista del modal hacia el paso de confirmación
    const pasoSeleccion = document.getElementById('eliminarPasoSeleccion');
    const pasoConfirmacion = document.getElementById('eliminarPasoConfirmacion');
    if (pasoSeleccion) pasoSeleccion.classList.add('hidden');
    if (pasoConfirmacion) pasoConfirmacion.classList.remove('hidden');
};

// Cancela la confirmación y vuelve a la lista de opciones de borrado
window.volverASeleccionEliminacion = function() {
    tipoEliminacionSeleccionado = null;
    const pasoSeleccion = document.getElementById('eliminarPasoSeleccion');
    const pasoConfirmacion = document.getElementById('eliminarPasoConfirmacion');
    if (pasoSeleccion) pasoSeleccion.classList.remove('hidden');
    if (pasoConfirmacion) pasoConfirmacion.classList.add('hidden');
};

// Ejecuta la eliminación definitiva una vez confirmado por el usuario
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

        window.closeModal = function(id) { document.getElementById(id).classList.add('hidden'); };

        // ---------------- SCRIPT ANÁLISIS & GRÁFICOS (CORREGIDO) ----------------
        let chartInstTotales = null; let chartInstEvolCat = null; let chartInstEvolSubcat = null; let chartInstRecurrentesIndiv = null; let chartInstBalance = null;

        function initChartRangeInputs() {
            const currentMonth = window.appState.currentMonth || '2026-10';
            
            if (!window.appState.chartRangeFrom || !window.appState.chartRangeTo) {
                let [cYear, cMonth] = currentMonth.split('-').map(Number);
                let mFrom = cMonth - 3, yFrom = cYear; while (mFrom < 1) { mFrom += 12; yFrom--; }
                const fromStr = `${yFrom}-${String(mFrom).padStart(2, '0')}`;
                let mTo = cMonth + 3, yTo = cYear; while (mTo > 12) { mTo -= 12; yTo++; }
                const toStr = `${yTo}-${String(mTo).padStart(2, '0')}`;
                window.appState.chartRangeFrom = fromStr;
                window.appState.chartRangeTo = toStr;
            }

            const elFrom = document.getElementById('chartMonthFrom'); 
            const elTo = document.getElementById('chartMonthTo');
            if (elFrom) elFrom.value = window.appState.chartRangeFrom; 
            if (elTo) elTo.value = window.appState.chartRangeTo;
        }

        function resetDefaultMonthRange() {
            window.appState.chartRangeFrom = null;
            window.appState.chartRangeTo = null;
            window.saveDataToCloud();
            initChartRangeInputs();
            renderCharts();
        }

        function applyCustomMonthRange() {
            const elFrom = document.getElementById('chartMonthFrom').value; 
            const elTo = document.getElementById('chartMonthTo').value;
            if (elFrom && elTo && elFrom <= elTo) {
                window.appState.chartRangeFrom = elFrom;
                window.appState.chartRangeTo = elTo;
                window.saveDataToCloud();
                renderCharts();
            }
        }

        function initRecurrentesCheckboxesList() {
            const container = document.getElementById('containerFiltrosRecurrentesGrid'); if (!container) return;
            let mapIdsUnicos = new Map();
            (window.appState.gastos || []).forEach(g => {
                const baseEsFijo = (g.categoria || '').toLowerCase().includes('fijo') || (g.categoria || '').toLowerCase().includes('servicio');
                if (g.isRecurrente || baseEsFijo) { if (!mapIdsUnicos.has(g.id)) mapIdsUnicos.set(g.id, g.concepto); }
            });
            if (window.filtrosRecurrentesGrid.length === 0 && window.appState.recurrentesPreferidos?.length > 0) window.filtrosRecurrentesGrid = [...window.appState.recurrentesPreferidos];
            container.innerHTML = '';
            let colorPalette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16']; let colorIdx = 0;
            mapIdsUnicos.forEach((concepto, id) => {
                const isChecked = window.filtrosRecurrentesGrid.length === 0 || window.filtrosRecurrentesGrid.includes(id);
                let color = colorPalette[colorIdx % colorPalette.length]; colorIdx++;
                container.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${id}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroRecurrenteGrid(this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${color};"></span>${concepto}</label>`;
            });
        }
        window.toggleFiltroRecurrenteGrid = function(checkbox) {
            const id = checkbox.value; let mapIdsUnicos = [];
            (window.appState.gastos || []).forEach(g => {
                const baseEsFijo = (g.categoria || '').toLowerCase().includes('fijo') || (g.categoria || '').toLowerCase().includes('servicio');
                if (g.isRecurrente || baseEsFijo) { if (!mapIdsUnicos.includes(g.id)) mapIdsUnicos.push(g.id); }
            });
            if (window.filtrosRecurrentesGrid.length === 0) window.filtrosRecurrentesGrid = [...mapIdsUnicos];
            if (checkbox.checked) { if (!window.filtrosRecurrentesGrid.includes(id)) window.filtrosRecurrentesGrid.push(id); }
            else { window.filtrosRecurrentesGrid = window.filtrosRecurrentesGrid.filter(i => i !== id); }
            if (window.filtrosRecurrentesGrid.length === mapIdsUnicos.length) window.filtrosRecurrentesGrid = [];
            initRecurrentesCheckboxesList(); renderCharts();
        };
        window.marcarTodosRecurrentesGrid = function(marcar) { window.filtrosRecurrentesGrid = marcar ? [] : ['__NINGUNO__']; initRecurrentesCheckboxesList(); renderCharts(); };

        function renderFiltrosGraficosCheckboxes() {
            const catList = window.appState.categorias || [];
            const subcatList = window.appState.subcategorias || [];
            let colorPalette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];

            const contTotales = document.getElementById('containerFiltrosGraficoTotales');
            if (contTotales) {
                contTotales.innerHTML = '';
                [ { nombre: "Gastos Totales", color: "#f43f5e" }, { nombre: "Ingresos / Sueldo", color: "#10b981" } ].forEach(item => {
                    const isChecked = window.filtrosGraficoTotales.length === 0 || window.filtrosGraficoTotales.includes(item.nombre);
                    contTotales.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${item.nombre}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroGrafico('Totales', this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${item.color};"></span>${item.nombre}</label>`;
                });
            }
            const contEvolCat = document.getElementById('containerFiltrosGraficoEvolCat');
            if (contEvolCat) {
                contEvolCat.innerHTML = '';
                catList.forEach(cat => {
                    const isChecked = window.filtrosGraficoEvolCat.length === 0 || window.filtrosGraficoEvolCat.includes(cat.nombre);
                    contEvolCat.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${cat.nombre}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroGrafico('EvolCat', this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${cat.color};"></span>${cat.nombre}</label>`;
                });
            }
            
            // --- INICIALIZACIÓN Y RENDERIZADO CORREGIDO PARA SUBCATEGORÍAS ---
            const contEvolSubcat = document.getElementById('containerFiltrosGraficoEvolSubcat');
            if (contEvolSubcat) {
                if (!window.filtrosGraficoEvolSubcat) {
                    window.filtrosGraficoEvolSubcat = [];
                }
                contEvolSubcat.innerHTML = '';
                subcatList.forEach((sub, idx) => {
                    const color = colorPalette[idx % colorPalette.length];
                    const isChecked = window.filtrosGraficoEvolSubcat.length === 0 || window.filtrosGraficoEvolSubcat.includes(sub.id);
                    contEvolSubcat.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${sub.id}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroGrafico('EvolSubcat', this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${color};"></span>${sub.nombre}</label>`;
                });
            }

            const contBalance = document.getElementById('containerFiltrosGraficoBalance');
            if (contBalance) {
                contBalance.innerHTML = '';
                [ { nombre: "Ingreso / Sueldo", color: "#10b981" }, { nombre: "Gastos Totales", color: "#f43f5e" }, { nombre: "Resto Disponible", color: "#3b82f6" } ].forEach(item => {
                    const isChecked = window.filtrosGraficoBalance.length === 0 || window.filtrosGraficoBalance.includes(item.nombre);
                    contBalance.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${item.nombre}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroGrafico('Balance', this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${item.color};"></span>${item.nombre}</label>`;
                });
            }
        }
        window.toggleFiltroGrafico = function(tipo, checkbox) {
            const val = checkbox.value; let arrRef, fullList;
            if (tipo === 'Totales') { if (window.filtrosGraficoTotales.length === 0) window.filtrosGraficoTotales = ["Gastos Totales", "Ingresos / Sueldo"]; arrRef = window.filtrosGraficoTotales; fullList = ["Gastos Totales", "Ingresos / Sueldo"]; }
            else if (tipo === 'EvolCat') { const catList = window.appState.categorias || []; if (window.filtrosGraficoEvolCat.length === 0) window.filtrosGraficoEvolCat = catList.map(c => c.nombre); arrRef = window.filtrosGraficoEvolCat; fullList = catList.map(c => c.nombre); }
            else if (tipo === 'EvolSubcat') { const subcatList = window.appState.subcategorias || []; if (!window.filtrosGraficoEvolSubcat) window.filtrosGraficoEvolSubcat = []; if (window.filtrosGraficoEvolSubcat.length === 0) window.filtrosGraficoEvolSubcat = subcatList.map(s => s.id); arrRef = window.filtrosGraficoEvolSubcat; fullList = subcatList.map(s => s.id); }
            else if (tipo === 'Balance') { if (window.filtrosGraficoBalance.length === 0) window.filtrosGraficoBalance = ["Ingreso / Sueldo", "Gastos Totales", "Resto Disponible"]; arrRef = window.filtrosGraficoBalance; fullList = ["Ingreso / Sueldo", "Gastos Totales", "Resto Disponible"]; }
            
            if (checkbox.checked) { if (!arrRef.includes(val)) arrRef.push(val); } else { const idx = arrRef.indexOf(val); if (idx !== -1) arrRef.splice(idx, 1); }
            if (arrRef.length === fullList.length) { 
                if (tipo === 'Totales') window.filtrosGraficoTotales = []; 
                if (tipo === 'EvolCat') window.filtrosGraficoEvolCat = []; 
                if (tipo === 'EvolSubcat') window.filtrosGraficoEvolSubcat = []; 
                if (tipo === 'Balance') window.filtrosGraficoBalance = []; 
            }
            renderFiltrosGraficosCheckboxes(); renderCharts();
        };
        window.marcarTodosGrafico = function(tipo, marcar) {
            if (tipo === 'Totales') window.filtrosGraficoTotales = marcar ? [] : ['__NINGUNO__'];
            else if (tipo === 'EvolCat') window.filtrosGraficoEvolCat = marcar ? [] : ['__NINGUNO__'];
            else if (tipo === 'EvolSubcat') window.filtrosGraficoEvolSubcat = marcar ? [] : ['__NINGUNO__'];
            else if (tipo === 'Balance') window.filtrosGraficoBalance = marcar ? [] : ['__NINGUNO__'];
            renderFiltrosGraficosCheckboxes(); renderCharts();
        };

        function renderCharts() {
            if (!window.appState.chartRangeFrom || !window.appState.chartRangeTo) initChartRangeInputs();
            let labelsMonths = [], dataTotales = [], dataIngresos = [], dataResto = [];
            let catList = window.appState.categorias || [];
            let subcatList = window.appState.subcategorias || [];
            let [startYear, startMonth] = window.appState.chartRangeFrom.split('-').map(Number);
            let [endYear, endMonth] = window.appState.chartRangeTo.split('-').map(Number);
            let currY = startYear, currM = startMonth;
            
            let filtrosTotales = window.filtrosGraficoTotales || [];
            let filtrosEvolCat = window.filtrosGraficoEvolCat || [];
            let filtrosEvolSubcat = window.filtrosGraficoEvolSubcat || [];
            let filtrosBalance = window.filtrosGraficoBalance || [];

            let datasetsEvolCat = catList.filter(cat => filtrosEvolCat.length === 0 || filtrosEvolCat.includes(cat.nombre)).map(cat => ({ label: cat.nombre, data: [], borderColor: cat.color, backgroundColor: cat.color, borderWidth: 2, pointRadius: 3, pointStyle: 'rect', fill: false, tension: 0.3 }));
            
            let colorPalette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];
            let datasetsEvolSubcat = subcatList.filter(sub => filtrosEvolSubcat.length === 0 || filtrosEvolSubcat.includes(sub.id)).map((sub, idx) => {
                let color = colorPalette[idx % colorPalette.length];
                return { label: sub.nombre, subId: sub.id, data: [], borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 3, pointStyle: 'rect', fill: false, tension: 0.3 };
            });

            let mapIdToDatasetIndex = {}; let datasetsRecurrentesIndiv = []; let colorIdx = 0; let filtrosRecGrid = window.filtrosRecurrentesGrid;

            (window.appState.gastos || []).forEach(g => {
                const baseEsFijo = (g.categoria || '').toLowerCase().includes('fijo') || (g.categoria || '').toLowerCase().includes('servicio');
                if ((g.isRecurrente || baseEsFijo) && mapIdToDatasetIndex[g.id] === undefined) {
                    if (filtrosRecGrid.length === 0 || filtrosRecGrid.includes(g.id)) {
                        let color = colorPalette[colorIdx % colorPalette.length]; colorIdx++;
                        mapIdToDatasetIndex[g.id] = datasetsRecurrentesIndiv.length;
                        datasetsRecurrentesIndiv.push({ label: g.concepto, data: [], borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 3, pointStyle: 'rect', fill: false, tension: 0.3 });
                    }
                }
            });

            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            while (currY < endYear || (currY === endYear && currM <= endMonth)) {
                let ymStr = `${currY}-${String(currM).padStart(2, '0')}`;
                labelsMonths.push(`${monthNames[currM - 1]} ${currY}`);
                const calc = window.getCalculatedDataForMonth(ymStr);
                const sumaTotalMes = calc.totalFijos + calc.totalTarjetas;
                dataTotales.push(sumaTotalMes); dataIngresos.push(calc.sueldoActual); dataResto.push(calc.sueldoActual - sumaTotalMes);
                
                let valoresMesRecurrente = new Array(datasetsRecurrentesIndiv.length).fill(0);
                calc.items.forEach(item => { if (item.isRecurrente && mapIdToDatasetIndex[item.id] !== undefined) valoresMesRecurrente[mapIdToDatasetIndex[item.id]] += item.monto; });
                datasetsRecurrentesIndiv.forEach((ds, idx) => ds.data.push(valoresMesRecurrente[idx]));
                
                catList.forEach(cat => { if (filtrosEvolCat.length === 0 || filtrosEvolCat.includes(cat.nombre)) { let dsObj = datasetsEvolCat.find(d => d.label === cat.nombre); if (dsObj) dsObj.data.push(calc.totalesPorCat[cat.nombre] || 0); } });

                let totalesPorSubcatMes = {};
                calc.items.forEach(item => {
                    const gridKey = `${item.id}_${ymStr}`;
                    const subId = window.appState.excepcionesSubcategoria?.[gridKey] !== undefined ? window.appState.excepcionesSubcategoria[gridKey] : item.subcategoriaId;
                    if (subId) {
                        totalesPorSubcatMes[subId] = (totalesPorSubcatMes[subId] || 0) + item.monto;
                    }
                });
                datasetsEvolSubcat.forEach(ds => {
                    ds.data.push(totalesPorSubcatMes[ds.subId] || 0);
                });

                currM++; if (currM > 12) { currM = 1; currY++; }
            }

            let datasetsTotales = [];
            if (filtrosTotales.length === 0 || filtrosTotales.includes("Gastos Totales")) {
                datasetsTotales.push({ 
                    label: 'Gastos Totales', 
                    data: dataTotales, 
                    borderColor: '#f43f5e', 
                    backgroundColor: '#f43f5e', 
                    borderWidth: 2, 
                    pointRadius: 3, 
                    pointStyle: 'rect', 
                    fill: false, 
                    tension: 0.3 
                });
            }
            if (filtrosTotales.length === 0 || filtrosTotales.includes("Ingresos / Sueldo")) {
                datasetsTotales.push({ 
                    label: 'Ingresos / Sueldo', 
                    data: dataIngresos, 
                    borderColor: '#10b981', 
                    backgroundColor: '#10b981', 
                    borderWidth: 2, 
                    pointRadius: 3, 
                    pointStyle: 'rect', 
                    fill: false, 
                    tension: 0.3 
                });
            }
            const ctxTotales = document.getElementById('chartEvolucionTotales');
            if (ctxTotales) { if (chartInstTotales) chartInstTotales.destroy(); chartInstTotales = new Chart(ctxTotales, { type: 'line', data: { labels: labelsMonths, datasets: datasetsTotales }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }

            const ctxEvolCat = document.getElementById('chartEvolucionCategorias');
            if (ctxEvolCat) { if (chartInstEvolCat) chartInstEvolCat.destroy(); chartInstEvolCat = new Chart(ctxEvolCat, { type: 'line', data: { labels: labelsMonths, datasets: datasetsEvolCat }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }

            const ctxEvolSubcat = document.getElementById('chartEvolucionSubcategorias');
            if (ctxEvolSubcat) { if (chartInstEvolSubcat) chartInstEvolSubcat.destroy(); chartInstEvolSubcat = new Chart(ctxEvolSubcat, { type: 'line', data: { labels: labelsMonths, datasets: datasetsEvolSubcat }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }

            const ctxRecurrentesIndiv = document.getElementById('chartEvolucionRecurrentesIndiv');
            if (ctxRecurrentesIndiv) { if (chartInstRecurrentesIndiv) chartInstRecurrentesIndiv.destroy(); chartInstRecurrentesIndiv = new Chart(ctxRecurrentesIndiv, { type: 'line', data: { labels: labelsMonths, datasets: datasetsRecurrentesIndiv }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }

            let datasetsBalance = [];
            if (filtrosBalance.length === 0 || filtrosBalance.includes("Ingreso / Sueldo")) datasetsBalance.push({ label: 'Ingreso / Sueldo', data: dataIngresos, backgroundColor: '#10b981', borderRadius: 6 });
            if (filtrosBalance.length === 0 || filtrosBalance.includes("Gastos Totales")) datasetsBalance.push({ label: 'Gastos Totales', data: dataTotales, backgroundColor: '#f43f5e', borderRadius: 6 });
            if (filtrosBalance.length === 0 || filtrosBalance.includes("Resto Disponible")) datasetsBalance.push({ label: 'Resto Disponible', data: dataResto, backgroundColor: '#3b82f6', borderRadius: 6 });

            const ctxBalance = document.getElementById('chartBalanceGeneral');
            if (ctxBalance) { if (chartInstBalance) chartInstBalance.destroy(); chartInstBalance = new Chart(ctxBalance, { type: 'bar', data: { labels: labelsMonths, datasets: datasetsBalance }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }
        }

        // ---------------- SCRIPT SALDOS Y BANCOS ----------------
        function renderSaldosApp() {
            const currentMonth = window.appState.currentMonth || '2026-10';
            const calcData = window.getCalculatedDataForMonth(currentMonth);
            const container = document.getElementById('containerBancosGrid');
            const containerResumen = document.getElementById('containerResumenDisponibles');
            if (!container) return; container.innerHTML = ''; if (containerResumen) containerResumen.innerHTML = '';
            const fmt = num => "$ " + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            let totalDisponibleRealSuma = 0; let tarjetasBancosHtml = '';

            (window.appState.cuentasBancarias || []).forEach(cuenta => {
                const saldosMes = cuenta.saldosPorMes?.[currentMonth] || { bcoSaldo: 0, mpSaldo: 0 };
                const bcoSaldo = parseFloat(saldosMes.bcoSaldo) || 0; const mpSaldo = parseFloat(saldosMes.mpSaldo) || 0;
                const totalIngresos = bcoSaldo + mpSaldo; const catAsociadas = cuenta.categoriasAsociadas || []; const fijosAsociadosIds = cuenta.gastosFijosAsociados || [];
                let totalesTarjetasEspecificas = {}; let vencimientosTarjetas = {}; let gastosFijosCuenta = [];

                calcData.items.forEach(item => {
                    if (item.estado === 'PAGADO') return;
                    const catObj = (window.appState.categorias || []).find(c => c.nombre === item.categoria);
                    const esTarjeta = catObj ? catObj.esTarjeta : true;
                    if (esTarjeta && catAsociadas.includes(item.categoria)) {
                        totalesTarjetasEspecificas[item.categoria] = (totalesTarjetasEspecificas[item.categoria] || 0) + item.monto;
                        if (item.vencimiento && !vencimientosTarjetas[item.categoria]) vencimientosTarjetas[item.categoria] = item.vencimiento;
                    } else if (!esTarjeta && fijosAsociadosIds.includes(item.id)) gastosFijosCuenta.push(item);
                });

                let tarjetasDesglosadasHtml = ''; let sumaTarjetas = 0;
                Object.entries(totalesTarjetasEspecificas).forEach(([nombreCat, montoCat]) => {
                    sumaTarjetas += montoCat; const vencStr = vencimientosTarjetas[nombreCat] ? window.formatFechaVencimientoSimple(vencimientosTarjetas[nombreCat]) : '';
                    tarjetasDesglosadasHtml += `<div class="flex justify-between items-center text-xs text-slate-300 py-1.5 border-b border-slate-800/40 gap-2"><span class="font-semibold shrink-0">${nombreCat}:</span><span class="text-[11px] text-amber-400 font-mono text-center flex-1">${vencStr ? `Venc: ${vencStr}` : ''}</span><span class="text-rose-400 font-bold shrink-0">-$${montoCat.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>`;
                });
                const fijosHtml = gastosFijosCuenta.map(g => {
                    const vencFmt = g.vencimiento ? window.formatFechaVencimientoSimple(g.vencimiento) : '';
                    return `<div class="flex justify-between items-center text-xs text-slate-400 py-1.5 border-b border-slate-800/40 gap-2"><span class="truncate shrink-0 max-w-[140px]">- ${g.concepto} (${g.categoria})</span><span class="text-[11px] text-amber-400 font-mono text-center flex-1">${vencFmt ? `Venc: ${vencFmt}` : ''}</span><span class="text-rose-400 font-semibold shrink-0">-$${g.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>`;
                }).join('');

                const totalGastosFijos = gastosFijosCuenta.reduce((acc, g) => acc + g.monto, 0);
                const totalDescuentosBanco = sumaTarjetas + totalGastosFijos; const disponibleFinal = totalIngresos - totalDescuentosBanco;
                totalDisponibleRealSuma += disponibleFinal;

                tarjetasBancosHtml += `<div class="card-bg p-4 rounded-2xl border border-slate-800 relative"><div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-slate-400 uppercase tracking-wider truncate flex items-center gap-1.5"><i class="fa-solid fa-building-columns text-emerald-400"></i> ${cuenta.nombre}</span></div><h2 class="text-xl font-extrabold my-0.5 ${disponibleFinal >= 0 ? 'text-emerald-400' : 'text-rose-500'}">${fmt(disponibleFinal)}</h2><span class="text-[10px] text-slate-500 font-medium">Disponible Real</span></div>`;

                container.innerHTML += `<div class="card-bg p-5 rounded-2xl flex flex-col justify-between shadow-xl border border-slate-800"><div><div class="flex justify-between items-center mb-3 pb-2 border-b border-slate-800"><h4 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-university text-emerald-400"></i> ${cuenta.nombre}</h4><div class="flex items-center gap-2"><button onclick="editCuenta('${cuenta.id}')" class="text-slate-400 hover:text-white text-xs"><i class="fa-solid fa-pen"></i></button><button onclick="deleteCuenta('${cuenta.id}')" class="text-slate-400 hover:text-rose-400 text-xs"><i class="fa-solid fa-trash-can"></i></button></div></div><div class="space-y-1.5 text-xs mb-4"><div class="flex justify-between text-slate-300"><span>Saldo Banco:</span> <strong>${fmt(bcoSaldo)}</strong></div><div class="flex justify-between text-slate-300"><span>Saldo Mercado Pago:</span> <strong>${fmt(mpSaldo)}</strong></div><div class="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800"><span>Total Saldos:</span> <span>${fmt(totalIngresos)}</span></div></div><div class="space-y-1 mb-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800"><div class="flex justify-between items-center mb-2"><span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Descuentos Aplicados</span><span class="text-[10px] text-slate-500 font-semibold">${window.formatMonthDisplay(currentMonth)}</span></div>${tarjetasDesglosadasHtml}${fijosHtml}${(!tarjetasDesglosadasHtml && !fijosHtml) ? '<p class="text-[11px] text-slate-500 italic py-1">No hay descuentos pendientes.</p>' : `<div class="flex justify-between items-center text-xs text-rose-400 font-bold pt-2 mt-1 border-t border-slate-800/80"><span>Total Descuentos:</span><span>-$${totalDescuentosBanco.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>`}</div></div><div class="pt-3 border-t border-slate-800 flex justify-between items-center"><span class="text-xs font-bold text-slate-300 uppercase">Disponible Real:</span><span class="text-base font-extrabold ${disponibleFinal >= 0 ? 'text-emerald-400' : 'text-rose-500'}">${fmt(disponibleFinal)}</span></div></div>`;
            });

            if (containerResumen) containerResumen.innerHTML = `${tarjetasBancosHtml}<div class="card-bg p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 relative"><div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-coins"></i> DISPONIBLE REAL TOTAL</span></div><h2 class="text-xl font-black my-0.5 ${totalDisponibleRealSuma >= 0 ? 'text-emerald-400' : 'text-rose-500'}">${fmt(totalDisponibleRealSuma)}</h2><span class="text-[10px] text-slate-400 font-medium">Suma Cuentas y Bancos</span></div>`;
        }

        window.openModalCuenta = function() {
            document.getElementById('cuentaId').value = ''; document.getElementById('modalCuentaTitulo').innerText = "Nueva Cuenta / Banco";
            document.getElementById('cuentaNombre').value = ''; document.getElementById('cuentaBcoSaldo').value = ''; document.getElementById('cuentaMpSaldo').value = '';
            renderCategoriasAsociadasCheckboxes([], []); document.getElementById('modalCuenta').classList.remove('hidden');
        };
        window.editCuenta = function(id) {
            const currentMonth = window.appState.currentMonth || '2026-10';
            const cuenta = (window.appState.cuentasBancarias || []).find(c => c.id === id); if (!cuenta) return;
            const saldosMes = cuenta.saldosPorMes?.[currentMonth] || { bcoSaldo: 0, mpSaldo: 0 };
            document.getElementById('cuentaId').value = cuenta.id; document.getElementById('modalCuentaTitulo').innerText = "Configurar Banco y Descuentos";
            document.getElementById('cuentaNombre').value = cuenta.nombre; document.getElementById('cuentaBcoSaldo').value = saldosMes.bcoSaldo; document.getElementById('cuentaMpSaldo').value = saldosMes.mpSaldo;
            renderCategoriasAsociadasCheckboxes(cuenta.categoriasAsociadas || [], cuenta.gastosFijosAsociados || []); document.getElementById('modalCuenta').classList.remove('hidden');
        };
        function renderCategoriasAsociadasCheckboxes(categoriasSeleccionadas = [], gastosFijosSeleccionados = []) {
            const containerCat = document.getElementById('containerCategoriasAsociadas'); const containerFijos = document.getElementById('containerGastosFijosAsociados');
            if (!containerCat || !containerFijos) return; containerCat.innerHTML = ''; containerFijos.innerHTML = '';
            const catList = window.appState.categorias || [];
            catList.filter(c => c.esTarjeta).forEach(cat => {
                const isChecked = categoriasSeleccionadas.includes(cat.nombre);
                containerCat.innerHTML += `<div class="flex items-center gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800"><input type="checkbox" id="catCheck_${cat.nombre}" value="${cat.nombre}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 cursor-pointer"><label for="catCheck_${cat.nombre}" class="text-xs text-slate-300 font-semibold cursor-pointer truncate flex items-center gap-1.5"><span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${cat.color};"></span>${cat.nombre}</label></div>`;
            });
            const currentMonth = window.appState.currentMonth || '2026-10';
            const calcData = window.getCalculatedDataForMonth(currentMonth);
            calcData.items.filter(item => { const catObj = catList.find(c => c.nombre === item.categoria); return catObj ? !catObj.esTarjeta : true; }).forEach(item => {
                const isChecked = gastosFijosSeleccionados.includes(item.id);
                containerFijos.innerHTML += `<div class="flex items-center justify-between p-1.5 bg-slate-950 rounded-lg border border-slate-800"><div class="flex items-center gap-2 truncate"><input type="checkbox" id="fijoCheck_${item.id}" value="${item.id}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 cursor-pointer"><label for="fijoCheck_${item.id}" class="text-xs text-slate-300 font-semibold cursor-pointer truncate">${item.concepto} <span class="text-[10px] text-slate-500">(${item.categoria})</span></label></div><span class="text-xs font-bold text-rose-400 shrink-0">$${item.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>`;
            });
        }
        window.handleSaveCuenta = function(e) {
            e.preventDefault(); const currentMonth = window.appState.currentMonth || '2026-10';
            const id = document.getElementById('cuentaId').value; const nombre = document.getElementById('cuentaNombre').value.trim();
            const bcoSaldo = parseFloat(document.getElementById('cuentaBcoSaldo').value) || 0; const mpSaldo = parseFloat(document.getElementById('cuentaMpSaldo').value) || 0;
            const categoriasAsociadas = Array.from(document.querySelectorAll('#containerCategoriasAsociadas input[type="checkbox"]:checked')).map(cb => cb.value);
            const gastosFijosAsociados = Array.from(document.querySelectorAll('#containerGastosFijosAsociados input[type="checkbox"]:checked')).map(cb => cb.value);
            if (!window.appState.cuentasBancarias) window.appState.cuentasBancarias = [];
            if (id) {
                const idx = window.appState.cuentasBancarias.findIndex(c => c.id === id);
                if (idx !== -1) {
                    if (!window.appState.cuentasBancarias[idx].saldosPorMes) window.appState.cuentasBancarias[idx].saldosPorMes = {};
                    window.appState.cuentasBancarias[idx].saldosPorMes[currentMonth] = { bcoSaldo, mpSaldo };
                    window.appState.cuentasBancarias[idx].nombre = nombre; window.appState.cuentasBancarias[idx].categoriasAsociadas = categoriasAsociadas; window.appState.cuentasBancarias[idx].gastosFijosAsociados = gastosFijosAsociados;
                }
            } else {
                let saldosPorMes = {}; saldosPorMes[currentMonth] = { bcoSaldo, mpSaldo };
                window.appState.cuentasBancarias.push({ id: Date.now().toString(), nombre, saldosPorMes, categoriasAsociadas, gastosFijosAsociados });
            }
            window.saveDataToCloud(); closeModal('modalCuenta'); renderSaldosApp();
        };
        window.deleteCuenta = function(id) { if (confirm("¿Estás seguro de eliminar esta cuenta?")) { window.appState.cuentasBancarias = (window.appState.cuentasBancarias || []).filter(c => c.id !== id); window.saveDataToCloud(); renderSaldosApp(); } };

        // ---------------- SCRIPT GASTOS HORMIGA ----------------
        const categoriasHormigaDefault = [ { nombre: "Kiosco", color: "#f59e0b" }, { nombre: "Panadería", color: "#d97706" }, { nombre: "Ferretería", color: "#78716c" }, { nombre: "Cafetería", color: "#b45309" }, { nombre: "Supermercado Rápido", color: "#10b981" }, { nombre: "Transporte / Peaje", color: "#3b82f6" }, { nombre: "Propinas", color: "#ec4899" }, { nombre: "Varios", color: "#64748b" } ];
        let chartInstHormigaCat = null; let chartInstHormigaEvol = null; let chartInstHormigaEvolCat = null;

        function obtenerFechaLocalParaInput(fecha = new Date()) {
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            return `${año}-${mes}-${dia}`;
        }

        const categoriasGastoMensual = [
            { nombre: 'Alimentación', color: '#10b981' },
            { nombre: 'Hogar', color: '#8b5cf6' },
            { nombre: 'Transporte', color: '#3b82f6' },
            { nombre: 'Salud', color: '#ef4444' },
            { nombre: 'Educación', color: '#06b6d4' },
            { nombre: 'Ocio', color: '#f59e0b' },
            { nombre: 'Otros', color: '#64748b' }
        ];
        let ordenGastosMensuales = { columna: 'fecha', ascendente: false };
        let filtrosCategoriasTablaGastoMensual = [];
        let filtrosCategoriasGraficoGastoMensual = [];
        let chartGastoMensualCategorias = null;
        let chartGastoMensualEvolucion = null;
        let chartGastoMensualEvolucionCategorias = null;
        let chartGastoMensualUsuarios = null;
        let gastoMensualPendienteDeEliminar = null;
        let guardandoGastoMensual = false;

        function obtenerCategoriasGastoMensual() {
            if (!Array.isArray(window.appState.categoriasGastosMensuales)) {
                window.appState.categoriasGastosMensuales = categoriasGastoMensual.map(categoria => ({ ...categoria }));
            }
            return window.appState.categoriasGastosMensuales;
        }

        function renderSelectoresCategoriaGastoMensual() {
            const categorias = obtenerCategoriasGastoMensual();
            const selectorCategoria = document.getElementById('gastoMensualCategoria');
            const categoriaSeleccionada = selectorCategoria.value;

            selectorCategoria.replaceChildren();
            categorias.forEach(categoria => {
                const opcion = document.createElement('option');
                opcion.value = categoria.nombre;
                opcion.textContent = categoria.nombre;
                selectorCategoria.appendChild(opcion);
            });
            if (categorias.some(categoria => categoria.nombre === categoriaSeleccionada)) {
                selectorCategoria.value = categoriaSeleccionada;
            }
            renderFiltrosCategoriasTablaGastoMensual();
        }

        function renderFiltrosCategoriasTablaGastoMensual() {
            const container = document.getElementById('containerFiltrosCategoriasTablaGastoMensual');
            if (!container) return;
            const categorias = obtenerCategoriasGastoMensual();
            const nombres = obtenerNombresCategoriasGastoMensual();
            container.replaceChildren();
            nombres.forEach((nombre, index) => {
                const categoria = categorias.find(item => item.nombre === nombre);
                const color = categoria?.color || ['#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4', '#f59e0b', '#64748b'][index % 7];
                const seleccionado = filtrosCategoriasTablaGastoMensual.length === 0
                    || filtrosCategoriasTablaGastoMensual.includes(nombre);
                const etiqueta = document.createElement('label');
                etiqueta.className = `cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${seleccionado ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = nombre;
                checkbox.checked = seleccionado;
                checkbox.className = 'hidden';
                checkbox.addEventListener('change', () => window.toggleFiltroCategoriaTablaGastoMensual(checkbox));
                const punto = document.createElement('span');
                punto.className = 'w-2 h-2 rounded-full';
                punto.style.backgroundColor = color;
                const texto = document.createElement('span');
                texto.textContent = nombre;
                etiqueta.append(checkbox, punto, texto);
                container.appendChild(etiqueta);
            });
        }

        window.toggleFiltroCategoriaTablaGastoMensual = function(checkbox) {
            const nombres = obtenerNombresCategoriasGastoMensual();
            if (filtrosCategoriasTablaGastoMensual.includes('__NINGUNA__')) {
                filtrosCategoriasTablaGastoMensual = [];
            } else if (filtrosCategoriasTablaGastoMensual.length === 0) {
                filtrosCategoriasTablaGastoMensual = [...nombres];
            }
            if (checkbox.checked) {
                if (!filtrosCategoriasTablaGastoMensual.includes(checkbox.value)) {
                    filtrosCategoriasTablaGastoMensual.push(checkbox.value);
                }
            } else {
                filtrosCategoriasTablaGastoMensual = filtrosCategoriasTablaGastoMensual.filter(nombre => nombre !== checkbox.value);
            }
            if (filtrosCategoriasTablaGastoMensual.length === nombres.length) {
                filtrosCategoriasTablaGastoMensual = [];
            }
            renderFiltrosCategoriasTablaGastoMensual();
            renderGastoMensualApp();
        };

        window.marcarTodasCategoriasTablaGastoMensual = function(marcar) {
            filtrosCategoriasTablaGastoMensual = marcar ? [] : ['__NINGUNA__'];
            renderFiltrosCategoriasTablaGastoMensual();
            renderGastoMensualApp();
        }

        function obtenerNombresCategoriasGastoMensual() {
            return [...new Set([
                ...obtenerCategoriasGastoMensual().map(categoria => categoria.nombre),
                ...(window.appState.gastosMensuales || []).map(gasto => gasto.categoria).filter(Boolean)
            ])];
        }

        function renderFiltrosCategoriasGraficoGastoMensual() {
            const container = document.getElementById('containerFiltrosCategoriasGastoMensual');
            if (!container) return;
            const categorias = obtenerCategoriasGastoMensual();
            const nombresCategorias = obtenerNombresCategoriasGastoMensual();
            container.replaceChildren();

            nombresCategorias.forEach((nombre, index) => {
                const categoria = categorias.find(item => item.nombre === nombre);
                const color = categoria?.color || ['#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4', '#f59e0b', '#64748b'][index % 7];
                const seleccionado = filtrosCategoriasGraficoGastoMensual.length === 0
                    || filtrosCategoriasGraficoGastoMensual.includes(nombre);
                const etiqueta = document.createElement('label');
                etiqueta.className = `cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${seleccionado ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = nombre;
                checkbox.checked = seleccionado;
                checkbox.className = 'hidden';
                checkbox.addEventListener('change', () => window.toggleFiltroCategoriaGastoMensual(checkbox));
                const punto = document.createElement('span');
                punto.className = 'w-2 h-2 rounded-full';
                punto.style.backgroundColor = color;
                const texto = document.createElement('span');
                texto.textContent = nombre;
                etiqueta.append(checkbox, punto, texto);
                container.appendChild(etiqueta);
            });
        }

        window.toggleFiltroCategoriaGastoMensual = function(checkbox) {
            const categorias = obtenerNombresCategoriasGastoMensual();
            if (filtrosCategoriasGraficoGastoMensual.length === 0) {
                filtrosCategoriasGraficoGastoMensual = [...categorias];
            } else if (filtrosCategoriasGraficoGastoMensual.includes('__NINGUNA__')) {
                filtrosCategoriasGraficoGastoMensual = [];
            }

            if (checkbox.checked) {
                if (!filtrosCategoriasGraficoGastoMensual.includes(checkbox.value)) {
                    filtrosCategoriasGraficoGastoMensual.push(checkbox.value);
                }
            } else {
                filtrosCategoriasGraficoGastoMensual = filtrosCategoriasGraficoGastoMensual
                    .filter(nombre => nombre !== checkbox.value);
            }
            if (filtrosCategoriasGraficoGastoMensual.length === categorias.length) {
                filtrosCategoriasGraficoGastoMensual = [];
            }
            renderFiltrosCategoriasGraficoGastoMensual();
            renderGraficosGastoMensual();
        };

        window.marcarTodasCategoriasGastoMensual = function(marcar) {
            filtrosCategoriasGraficoGastoMensual = marcar ? [] : ['__NINGUNA__'];
            renderFiltrosCategoriasGraficoGastoMensual();
            renderGraficosGastoMensual();
        };

        function renderListaCategoriasGastoMensual() {
            const container = document.getElementById('listaCategoriasGastoMensual');
            container.replaceChildren();
            obtenerCategoriasGastoMensual().forEach((categoria, index) => {
                const fila = document.createElement('div');
                fila.className = 'flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800';
                const campos = document.createElement('div');
                campos.className = 'flex items-center gap-2 flex-1';
                const color = document.createElement('input');
                color.type = 'color';
                color.value = categoria.color || '#64748b';
                color.className = 'w-8 h-8 rounded bg-slate-900 border border-slate-800 cursor-pointer p-0.5';
                color.setAttribute('aria-label', `Color de ${categoria.nombre}`);
                color.addEventListener('change', () => actualizarCategoriaGastoMensual(index, 'color', color.value));
                const nombre = document.createElement('input');
                nombre.type = 'text';
                nombre.value = categoria.nombre;
                nombre.maxLength = 40;
                nombre.className = 'flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-white';
                nombre.setAttribute('aria-label', 'Nombre de categoría');
                nombre.addEventListener('change', () => actualizarCategoriaGastoMensual(index, 'nombre', nombre.value));
                const eliminar = document.createElement('button');
                eliminar.type = 'button';
                eliminar.className = 'text-rose-400 hover:text-rose-300 p-2';
                eliminar.title = 'Eliminar categoría';
                eliminar.setAttribute('aria-label', `Eliminar categoría ${categoria.nombre}`);
                eliminar.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i>';
                eliminar.addEventListener('click', () => eliminarCategoriaGastoMensual(index));
                campos.append(color, nombre);
                fila.append(campos, eliminar);
                container.appendChild(fila);
            });
        }

        async function guardarCambiosCategoriasGastoMensual(categorias, gastos) {
            try {
                await window.guardarCategoriasGastoMensual(categorias, gastos);
                renderListaCategoriasGastoMensual();
                renderGastoMensualApp();
            } catch (error) {
                console.error('Error al guardar las categorías de gasto mensual:', error);
                window.mostrarMensajeApp('No se pudieron guardar las categorías', 'Revisá tu conexión y tus permisos e intentá nuevamente.', 'error');
            }
        }

        window.openModalCategoriasGastoMensual = function() {
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Solo los usuarios con permiso de escritura pueden administrar categorías.', 'error');
                return;
            }
            renderListaCategoriasGastoMensual();
            document.getElementById('modalCategoriasGastoMensual').classList.remove('hidden');
        };

        window.agregarCategoriaGastoMensual = async function(event) {
            event.preventDefault();
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Solo los usuarios con permiso de escritura pueden administrar categorías.', 'error');
                return;
            }
            const inputNombre = document.getElementById('nuevaCategoriaGastoMensualNombre');
            const nombre = inputNombre.value.trim();
            const categorias = obtenerCategoriasGastoMensual().map(categoria => ({ ...categoria }));
            if (!nombre) return;
            if (categorias.some(categoria => categoria.nombre.toLocaleLowerCase() === nombre.toLocaleLowerCase())) {
                window.mostrarMensajeApp('Categoría existente', 'Ya hay una categoría con ese nombre.', 'error');
                return;
            }
            categorias.push({ nombre, color: document.getElementById('nuevaCategoriaGastoMensualColor').value });
            await guardarCambiosCategoriasGastoMensual(categorias, window.appState.gastosMensuales || []);
            if (window.appState.categoriasGastosMensuales.some(categoria => categoria.nombre === nombre)) {
                inputNombre.value = '';
            }
        };

        window.actualizarCategoriaGastoMensual = async function(index, campo, valor) {
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Solo los usuarios con permiso de escritura pueden administrar categorías.', 'error');
                return;
            }
            const categorias = obtenerCategoriasGastoMensual().map(categoria => ({ ...categoria }));
            const categoriaActual = categorias[index];
            if (!categoriaActual) return;
            const gastos = (window.appState.gastosMensuales || []).map(gasto => ({ ...gasto }));
            if (campo === 'nombre') {
                const nombre = valor.trim();
                if (!nombre) {
                    renderListaCategoriasGastoMensual();
                    return;
                }
                if (categorias.some((categoria, categoriaIndex) => categoriaIndex !== index && categoria.nombre.toLocaleLowerCase() === nombre.toLocaleLowerCase())) {
                    window.mostrarMensajeApp('Categoría existente', 'Ya hay una categoría con ese nombre.', 'error');
                    renderListaCategoriasGastoMensual();
                    return;
                }
                gastos.forEach(gasto => {
                    if (gasto.categoria === categoriaActual.nombre) gasto.categoria = nombre;
                });
                categoriaActual.nombre = nombre;
            } else if (campo === 'color') {
                categoriaActual.color = valor;
            } else {
                return;
            }
            await guardarCambiosCategoriasGastoMensual(categorias, gastos);
        };

        window.eliminarCategoriaGastoMensual = async function(index) {
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Solo los usuarios con permiso de escritura pueden administrar categorías.', 'error');
                return;
            }
            const categorias = obtenerCategoriasGastoMensual().map(categoria => ({ ...categoria }));
            if (categorias.length <= 1) {
                window.mostrarMensajeApp('No se puede eliminar', 'Debe quedar al menos una categoría.', 'error');
                return;
            }
            categorias.splice(index, 1);
            await guardarCambiosCategoriasGastoMensual(categorias, window.appState.gastosMensuales || []);
        };

        document.getElementById('formNuevaCategoriaGastoMensual').addEventListener('submit', window.agregarCategoriaGastoMensual);

        document.addEventListener('DOMContentLoaded', () => {
            const fechaInput = document.getElementById('gastoMensualFecha');
            if (fechaInput) fechaInput.value = obtenerFechaLocalParaInput();
        });

        function esEditorGastoMensual() {
            return typeof window.esUsuarioEditor === 'function' && window.esUsuarioEditor();
        }

        window.filtrarGastosMensuales = function(categoria) {
            filtrosCategoriasTablaGastoMensual = categoria ? [categoria] : [];
            renderGastoMensualApp();
        };

        window.sortGastosMensuales = function(columna) {
            if (ordenGastosMensuales.columna === columna) {
                ordenGastosMensuales.ascendente = !ordenGastosMensuales.ascendente;
            } else {
                ordenGastosMensuales = { columna, ascendente: columna !== 'fecha' };
            }
            renderGastoMensualApp();
        };

        window.renderGastoMensualApp = function() {
            const mes = window.appState.currentMonth || '2026-10';
            const mesTexto = window.formatMonthDisplay(mes);
            const gastosMes = (Array.isArray(window.appState.gastosMensuales) ? window.appState.gastosMensuales : [])
                .filter(gasto => gasto.fecha && gasto.fecha.slice(0, 7) === mes);
            const editor = esEditorGastoMensual();
            const formulario = document.getElementById('formGastoMensualContainer');
            const tituloFormulario = document.getElementById('tituloFormGastoMensual');
            const formularioCampos = document.getElementById('formGastoMensual');
            const mensajeLectura = document.getElementById('gastoMensualSoloLectura');
            if (formulario) formulario.classList.remove('hidden');
            if (tituloFormulario) tituloFormulario.classList.toggle('hidden', !editor);
            if (formularioCampos) formularioCampos.classList.toggle('hidden', !editor);
            if (mensajeLectura) mensajeLectura.classList.toggle('hidden', editor);
            document.getElementById('btnCategoriasGastoMensual').classList.toggle('hidden', !editor);
            renderSelectoresCategoriaGastoMensual();
            renderFiltrosCategoriasGraficoGastoMensual();

            document.getElementById('badgeGastoMensualMes').textContent = mesTexto;
            document.getElementById('badgeGastoMensualCategoriaMes').textContent = mesTexto;
            const total = gastosMes.reduce((suma, gasto) => suma + (Number(gasto.monto) || 0), 0);
            const hoy = new Date();
            const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
            const [año, numeroMes] = mes.split('-').map(Number);
            const diasMes = new Date(año, numeroMes, 0).getDate();
            const diasContabilizados = mes < mesActual ? diasMes : mes === mesActual ? hoy.getDate() : 0;
            const promedio = diasContabilizados > 0 ? total / diasContabilizados : 0;
            const formatoMoneda = monto => '$ ' + monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            document.getElementById('cardGastoMensualTotal').textContent = formatoMoneda(total);
            document.getElementById('cardGastoMensualPromedio').textContent = formatoMoneda(promedio);
            document.getElementById('cardGastoMensualCantidad').textContent = `${gastosMes.length} gasto${gastosMes.length === 1 ? '' : 's'}`;

            const totalesPorCategoria = new Map();
            gastosMes.forEach(gasto => {
                totalesPorCategoria.set(gasto.categoria, (totalesPorCategoria.get(gasto.categoria) || 0) + (Number(gasto.monto) || 0));
            });
            const resumen = document.getElementById('containerGastoMensualCatTotales');
            resumen.replaceChildren();
            const categoriasConGastos = [...totalesPorCategoria.entries()].sort((a, b) => b[1] - a[1]);
            if (categoriasConGastos.length === 0) {
                const vacio = document.createElement('p');
                vacio.className = 'text-xs text-slate-500 italic text-center py-6';
                vacio.textContent = 'No hay gastos registrados en este mes.';
                resumen.appendChild(vacio);
            } else {
                categoriasConGastos.forEach(([nombre, monto]) => {
                    const categoria = obtenerCategoriasGastoMensual().find(item => item.nombre === nombre);
                    const porcentaje = total > 0 ? (monto / total) * 100 : 0;
                    const fila = document.createElement('div');
                    fila.className = 'p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5';
                    const cabecera = document.createElement('div');
                    cabecera.className = 'flex justify-between items-center text-xs';
                    const etiqueta = document.createElement('span');
                    etiqueta.className = 'font-bold text-white flex items-center gap-2';
                    const punto = document.createElement('span');
                    punto.className = 'w-2.5 h-2.5 rounded-full';
                    punto.style.backgroundColor = categoria ? categoria.color : '#64748b';
                    const nombreCategoria = document.createElement('span');
                    nombreCategoria.textContent = nombre || 'Sin categoría';
                    etiqueta.append(punto, nombreCategoria);
                    const montoCategoria = document.createElement('span');
                    montoCategoria.className = 'font-extrabold text-sky-400';
                    montoCategoria.textContent = `${formatoMoneda(monto)} (${porcentaje.toFixed(1)}%)`;
                    cabecera.append(etiqueta, montoCategoria);
                    const barra = document.createElement('div');
                    barra.className = 'w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80';
                    const progreso = document.createElement('div');
                    progreso.className = 'h-full rounded-full';
                    progreso.style.width = `${porcentaje}%`;
                    progreso.style.backgroundColor = categoria ? categoria.color : '#64748b';
                    barra.appendChild(progreso);
                    fila.append(cabecera, barra);
                    resumen.appendChild(fila);
                });
            }

            const gastosFiltrados = gastosMes
                .filter(gasto => filtrosCategoriasTablaGastoMensual.includes('__NINGUNA__')
                    ? false
                    : filtrosCategoriasTablaGastoMensual.length === 0 || filtrosCategoriasTablaGastoMensual.includes(gasto.categoria || 'Sin categoría'))
                .sort((a, b) => {
                    const valorA = ordenGastosMensuales.columna === 'monto' ? Number(a.monto) || 0 : a[ordenGastosMensuales.columna] || '';
                    const valorB = ordenGastosMensuales.columna === 'monto' ? Number(b.monto) || 0 : b[ordenGastosMensuales.columna] || '';
                    if (valorA < valorB) return ordenGastosMensuales.ascendente ? -1 : 1;
                    if (valorA > valorB) return ordenGastosMensuales.ascendente ? 1 : -1;
                    return 0;
                });
            renderGraficosGastoMensual();

            const tabla = document.getElementById('tablaGastoMensualCuerpo');
            tabla.replaceChildren();
            if (gastosFiltrados.length === 0) {
                const fila = document.createElement('tr');
                const celda = document.createElement('td');
                celda.colSpan = 7;
                celda.className = 'px-6 py-8 text-center text-slate-500';
                celda.textContent = 'No hay gastos mensuales que coincidan.';
                fila.appendChild(celda);
                tabla.appendChild(fila);
                return;
            }

            gastosFiltrados.forEach(gasto => {
                const fila = document.createElement('tr');
                fila.className = 'hover:bg-slate-900/40 transition-colors';
                const fecha = document.createElement('td');
                fecha.className = 'px-5 py-3.5 text-slate-400 text-xs';
                fecha.textContent = gasto.fecha ? gasto.fecha.split('-').reverse().join('/') : '';
                const concepto = document.createElement('td');
                concepto.className = 'px-5 py-3.5 text-white font-bold';
                concepto.textContent = gasto.concepto || '';
                const categoria = document.createElement('td');
                categoria.className = 'px-5 py-3.5 text-slate-300';
                const nombreCategoria = gasto.categoria || 'Sin categoría';
                const categoriaConfig = obtenerCategoriasGastoMensual().find(item => item.nombre === nombreCategoria);
                const colorCategoria = categoriaConfig?.color || '#64748b';
                const etiquetaCategoria = document.createElement('span');
                etiquetaCategoria.className = 'px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white border inline-flex items-center gap-1.5';
                etiquetaCategoria.style.backgroundColor = `${colorCategoria}22`;
                etiquetaCategoria.style.borderColor = `${colorCategoria}55`;
                const puntoCategoria = document.createElement('span');
                puntoCategoria.className = 'w-2 h-2 rounded-full';
                puntoCategoria.style.backgroundColor = colorCategoria;
                const textoCategoria = document.createElement('span');
                textoCategoria.textContent = nombreCategoria;
                etiquetaCategoria.append(puntoCategoria, textoCategoria);
                categoria.appendChild(etiquetaCategoria);
                const medioPago = document.createElement('td');
                medioPago.className = 'px-5 py-3.5 text-slate-400 text-xs';
                medioPago.textContent = gasto.medioPago || 'Efectivo';
                const usuario = document.createElement('td');
                usuario.className = 'px-5 py-3.5 text-slate-400 text-xs';
                usuario.textContent = gasto.usuarioEmail
                    ? gasto.usuarioEmail.split('@')[0]
                    : (gasto.usuarioUid ? `Usuario ${gasto.usuarioUid.slice(0, 8)}` : 'Sin identificar');
                const monto = document.createElement('td');
                monto.className = 'px-5 py-3.5 text-right font-extrabold text-sky-400';
                monto.textContent = formatoMoneda(Number(gasto.monto) || 0);
                const acciones = document.createElement('td');
                acciones.className = 'px-5 py-3.5 text-right';
                if (editor) {
                    const botonEliminar = document.createElement('button');
                    botonEliminar.type = 'button';
                    botonEliminar.className = 'text-slate-400 hover:text-rose-400';
                    botonEliminar.title = 'Eliminar';
                    botonEliminar.setAttribute('aria-label', `Eliminar ${gasto.concepto || 'gasto'}`);
                    botonEliminar.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i>';
                    botonEliminar.addEventListener('click', () => window.deleteGastoMensual(gasto.id));
                    acciones.appendChild(botonEliminar);
                }
                fila.append(fecha, concepto, categoria, medioPago, usuario, monto, acciones);
                tabla.appendChild(fila);
            });
        };

        function renderGraficosGastoMensual() {
            if (typeof Chart === 'undefined') return;
            const gastos = Array.isArray(window.appState.gastosMensuales) ? window.appState.gastosMensuales : [];
            const mesActual = window.appState.currentMonth || '2026-10';
            const [añoActual, numeroMesActual] = mesActual.split('-').map(Number);
            const meses = [];
            for (let desplazamiento = 5; desplazamiento >= 0; desplazamiento--) {
                const fecha = new Date(añoActual, numeroMesActual - 1 - desplazamiento, 1);
                const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                meses.push({ clave, etiqueta: window.formatMonthDisplay(clave) });
            }

            const categoriasConfiguradas = obtenerCategoriasGastoMensual();
            const nombresCategorias = [...new Set([
                ...categoriasConfiguradas.map(categoria => categoria.nombre),
                ...gastos.map(gasto => gasto.categoria).filter(Boolean)
            ])];
            const coloresPredeterminados = ['#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4', '#f59e0b', '#64748b', '#ec4899', '#84cc16', '#fb923c'];
            const colorCategoria = nombre => {
                const indice = categoriasConfiguradas.findIndex(categoria => categoria.nombre === nombre);
                return indice >= 0
                    ? categoriasConfiguradas[indice].color
                    : coloresPredeterminados[(nombresCategorias.indexOf(nombre) + categoriasConfiguradas.length) % coloresPredeterminados.length];
            };
            const gastosMesActual = gastos.filter(gasto => gasto.fecha && gasto.fecha.slice(0, 7) === mesActual);
            const totalesMesPorCategoria = new Map();
            gastosMesActual.forEach(gasto => {
                if (!gasto.categoria) return;
                totalesMesPorCategoria.set(gasto.categoria, (totalesMesPorCategoria.get(gasto.categoria) || 0) + (Number(gasto.monto) || 0));
            });

            const canvasCategorias = document.getElementById('chartGastoMensualCategorias');
            if (canvasCategorias) {
                if (chartGastoMensualCategorias) chartGastoMensualCategorias.destroy();
                const etiquetas = [...totalesMesPorCategoria.keys()];
                chartGastoMensualCategorias = new Chart(canvasCategorias, {
                    type: 'doughnut',
                    data: {
                        labels: etiquetas,
                        datasets: [{
                            data: etiquetas.map(nombre => totalesMesPorCategoria.get(nombre)),
                            backgroundColor: etiquetas.map(colorCategoria),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                display: etiquetas.length > 0,
                                labels: { color: '#cbd5e1' }
                            }
                        }
                    }
                });
            }

            const canvasEvolucion = document.getElementById('chartGastoMensualEvolucion');
            if (canvasEvolucion) {
                if (chartGastoMensualEvolucion) chartGastoMensualEvolucion.destroy();
                const totalesPorMes = meses.map(mes => gastos.reduce((suma, gasto) => (
                    gasto.fecha && gasto.fecha.slice(0, 7) === mes.clave
                        ? suma + (Number(gasto.monto) || 0)
                        : suma
                ), 0));
                chartGastoMensualEvolucion = new Chart(canvasEvolucion, {
                    type: 'bar',
                    data: {
                        labels: meses.map(mes => mes.etiqueta),
                        datasets: [{
                            label: 'Gastos Mensuales',
                            data: totalesPorMes,
                            backgroundColor: '#38bdf8',
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
                        }
                    }
                });
            }

            const canvasEvolucionCategorias = document.getElementById('chartGastoMensualEvolucionCategorias');
            if (canvasEvolucionCategorias) {
                if (chartGastoMensualEvolucionCategorias) chartGastoMensualEvolucionCategorias.destroy();
                const categoriasVisibles = filtrosCategoriasGraficoGastoMensual.includes('__NINGUNA__')
                    ? []
                    : nombresCategorias.filter(nombre => filtrosCategoriasGraficoGastoMensual.length === 0 || filtrosCategoriasGraficoGastoMensual.includes(nombre));
                const datasets = categoriasVisibles.map(nombre => ({
                    label: nombre,
                    data: meses.map(mes => gastos.reduce((suma, gasto) => (
                        gasto.fecha && gasto.fecha.slice(0, 7) === mes.clave && gasto.categoria === nombre
                            ? suma + (Number(gasto.monto) || 0)
                            : suma
                    ), 0)),
                    borderColor: colorCategoria(nombre),
                    backgroundColor: colorCategoria(nombre),
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3
                }));
                chartGastoMensualEvolucionCategorias = new Chart(canvasEvolucionCategorias, {
                    type: 'line',
                    data: {
                        labels: meses.map(mes => mes.etiqueta),
                        datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: datasets.length > 0,
                                position: 'bottom',
                                labels: { color: '#cbd5e1' }
                            }
                        },
                        scales: {
                            x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
                        }
                    }
                });
            }

            renderGraficoGastoMensualPorUsuario(gastos, meses);
        }

        function renderGraficoGastoMensualPorUsuario(gastos, meses) {
            const canvas = document.getElementById('chartGastoMensualUsuarios');
            if (!canvas || typeof Chart === 'undefined') return;
            const totalesPorUsuario = new Map();
            gastos.forEach(gasto => {
                if (!gasto.fecha) return;
                const claveMes = gasto.fecha.slice(0, 7);
                const mesIndice = meses.findIndex(mes => mes.clave === claveMes);
                if (mesIndice < 0) return;

                const claveUsuario = gasto.usuarioUid || (gasto.usuarioEmail ? `email:${gasto.usuarioEmail.toLowerCase()}` : 'sin-identificar');
                const nombreUsuario = gasto.usuarioEmail
                    ? gasto.usuarioEmail.split('@')[0]
                    : (gasto.usuarioUid ? `Usuario ${gasto.usuarioUid.slice(0, 8)}` : 'Sin identificar');
                if (!totalesPorUsuario.has(claveUsuario)) {
                    totalesPorUsuario.set(claveUsuario, {
                        nombre: nombreUsuario,
                        valores: Array(meses.length).fill(0)
                    });
                }
                totalesPorUsuario.get(claveUsuario).valores[mesIndice] += Number(gasto.monto) || 0;
            });

            const colores = ['#38bdf8', '#10b981', '#f59e0b', '#a78bfa', '#f43f5e', '#22d3ee', '#84cc16', '#fb923c'];
            const datasets = [...totalesPorUsuario.values()].map((usuario, indice) => ({
                label: usuario.nombre,
                data: usuario.valores,
                backgroundColor: colores[indice % colores.length],
                borderRadius: 6
            }));

            if (chartGastoMensualUsuarios) chartGastoMensualUsuarios.destroy();
            chartGastoMensualUsuarios = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: meses.map(mes => mes.etiqueta),
                    datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: datasets.length > 0,
                            position: 'bottom',
                            labels: { color: '#cbd5e1' }
                        },
                        tooltip: {
                            callbacks: {
                                label: contexto => `${contexto.dataset.label}: $ ${Number(contexto.raw || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            }
                        }
                    },
                    scales: {
                        x: { stacked: false, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                        y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
                    }
                }
            });
        }

        window.handleSaveGastoMensual = async function(event) {
            event.preventDefault();
            if (guardandoGastoMensual) return;
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Tu permiso en este grupo es de solo lectura.', 'error');
                return;
            }

            const usuarioActual = window.auth?.currentUser;
            if (!usuarioActual) {
                window.mostrarMensajeApp('Sesión no disponible', 'Volvé a iniciar sesión para registrar el gasto.', 'error');
                return;
            }
            const concepto = document.getElementById('gastoMensualConcepto').value.trim();
            const monto = Number(document.getElementById('gastoMensualMonto').value);
            const fecha = document.getElementById('gastoMensualFecha').value;
            if (!concepto || !Number.isFinite(monto) || monto <= 0 || !fecha) {
                window.mostrarMensajeApp('Datos incompletos', 'Ingresá una descripción, un monto mayor a cero y una fecha válida.', 'error');
                return;
            }

            const nuevoGasto = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                concepto,
                monto,
                fecha,
                categoria: document.getElementById('gastoMensualCategoria').value,
                medioPago: document.getElementById('gastoMensualMedioPago').value,
                usuarioUid: usuarioActual.uid,
                usuarioEmail: usuarioActual.email || 'Usuario sin correo'
            };
            const formulario = document.getElementById('formGastoMensual');
            const botonGuardar = formulario.querySelector('button[type="submit"]');
            const textoOriginalBoton = botonGuardar.innerHTML;
            guardandoGastoMensual = true;
            botonGuardar.disabled = true;
            botonGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
            try {
                await window.agregarGastoMensualCompartido(nuevoGasto);
            } catch (error) {
                console.error('Error al guardar el gasto mensual compartido:', error);
                const detalle = error.code === 'permission-denied'
                    ? 'Firestore rechazó la escritura por permisos. Revisá las reglas del grupo.'
                    : 'Revisá tu conexión e intentá nuevamente.';
                window.mostrarMensajeApp('No se pudo guardar', `El gasto no se guardó en Firestore. ${detalle}`, 'error');
                return;
            } finally {
                guardandoGastoMensual = false;
                botonGuardar.disabled = false;
                botonGuardar.innerHTML = textoOriginalBoton;
            }
            document.getElementById('gastoMensualConcepto').value = '';
            document.getElementById('gastoMensualMonto').value = '';
            document.getElementById('gastoMensualFecha').value = obtenerFechaLocalParaInput();
            renderGastoMensualApp();
        };

        window.deleteGastoMensual = function(id) {
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Tu permiso en este grupo es de solo lectura.', 'error');
                return;
            }
            gastoMensualPendienteDeEliminar = (window.appState.gastosMensuales || []).find(gasto => gasto.id === id) || null;
            if (!gastoMensualPendienteDeEliminar) return;
            document.getElementById('nombreGastoMensualAEliminar').textContent = gastoMensualPendienteDeEliminar.concepto || 'este gasto';
            document.getElementById('errorEliminarGastoMensual').classList.add('hidden');
            document.getElementById('modalConfirmarGastoMensual').classList.remove('hidden');
        };

        window.cerrarConfirmacionGastoMensual = function() {
            document.getElementById('modalConfirmarGastoMensual').classList.add('hidden');
            document.getElementById('errorEliminarGastoMensual').classList.add('hidden');
            document.getElementById('btnConfirmarEliminarGastoMensual').disabled = false;
            document.getElementById('btnConfirmarEliminarGastoMensual').textContent = 'Sí, eliminar';
            gastoMensualPendienteDeEliminar = null;
        };

        window.confirmarEliminacionGastoMensual = async function() {
            if (!esEditorGastoMensual()) {
                window.mostrarMensajeApp('Acceso restringido', 'Tu permiso en este grupo es de solo lectura.', 'error');
                window.cerrarConfirmacionGastoMensual();
                return;
            }
            if (!gastoMensualPendienteDeEliminar) return;

            const boton = document.getElementById('btnConfirmarEliminarGastoMensual');
            const mensajeError = document.getElementById('errorEliminarGastoMensual');
            boton.disabled = true;
            boton.textContent = 'Eliminando...';
            mensajeError.classList.add('hidden');
            try {
                await window.eliminarGastoMensualCompartido(gastoMensualPendienteDeEliminar.id);
            } catch (error) {
                console.error('Error al eliminar el gasto mensual compartido:', error);
                const detalle = error.code === 'permission-denied'
                    ? 'Firestore rechazó el borrado por permisos. Verificá que tu usuario tenga permiso de escritura en este grupo y que las reglas de Firestore lo permitan.'
                    : `No se pudo completar la operación (${error.code || 'error desconocido'}). Revisá la conexión e intentá nuevamente.`;
                mensajeError.textContent = `El gasto sigue guardado. ${detalle}`;
                mensajeError.classList.remove('hidden');
                boton.disabled = false;
                boton.textContent = 'Reintentar';
                return;
            }
            window.appState.gastosMensuales = (window.appState.gastosMensuales || [])
                .filter(gasto => gasto.id !== gastoMensualPendienteDeEliminar.id);
            window.cerrarConfirmacionGastoMensual();
            renderGastoMensualApp();
        };

        document.addEventListener('DOMContentLoaded', () => {
            const fechaInput = document.getElementById('hormigaFecha');
            if (fechaInput) fechaInput.value = obtenerFechaLocalParaInput();
        });

        window.sortHormigaData = function(column) {
            if (window.hormigaState.sortColumn === column) {
                window.hormigaState.sortAscending = !window.hormigaState.sortAscending;
            } else {
                window.hormigaState.sortColumn = column;
                window.hormigaState.sortAscending = true;
            }
            renderHormigaApp();
        };

        function renderHormigaApp() {
            const currentMonth = window.appState.currentMonth || '2026-10';
            const monthText = window.formatMonthDisplay(currentMonth);
            if(document.getElementById('badgeHormigaMonth')) document.getElementById('badgeHormigaMonth').innerText = monthText;
            if(document.getElementById('badgeHormigaMonthCat')) document.getElementById('badgeHormigaMonthCat').innerText = monthText;
            
            renderHormigaCategoriasSelect();
            renderFiltrosHormigaEvolCatCheckboxes();

            const itemsHormiga = (window.hormigaState.gastos || []).filter(g => g.fecha && g.fecha.slice(0, 7) === currentMonth);
            const catHormigaList = window.hormigaState.categorias || categoriasHormigaDefault;
            let totalHormiga = 0; itemsHormiga.forEach(g => totalHormiga += parseFloat(g.monto) || 0);
            const [year, month] = currentMonth.split('-').map(Number);
            const diasEnMes = new Date(year, month, 0).getDate();
            const hoy = new Date();
            const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
            const diasTranscurridos = currentMonth < mesActual ? diasEnMes : currentMonth === mesActual ? hoy.getDate() : 0;
            const promedioDiario = diasTranscurridos > 0 ? totalHormiga / diasTranscurridos : 0;
            const fmt = num => "$ " + num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            document.getElementById('cardHormigaTotal').innerText = fmt(totalHormiga);
            document.getElementById('cardHormigaPromedio').innerText = fmt(promedioDiario);
            document.getElementById('cardHormigaCantidad').innerText = `${itemsHormiga.length} compra${itemsHormiga.length === 1 ? '' : 's'}`;

            const containerCatTotales = document.getElementById('containerHormigaCatTotales');
            if (containerCatTotales) {
                containerCatTotales.innerHTML = ''; let totalesPorCat = {};
                catHormigaList.forEach(c => totalesPorCat[c.nombre] = 0);
                itemsHormiga.forEach(g => { if (totalesPorCat[g.categoria] !== undefined) totalesPorCat[g.categoria] += parseFloat(g.monto) || 0; else totalesPorCat[g.categoria] = parseFloat(g.monto) || 0; });
                let categoriasConMonto = catHormigaList.map(cat => ({ ...cat, monto: totalesPorCat[cat.nombre] || 0 })).filter(cat => cat.monto > 0);
                categoriasConMonto.sort((a, b) => b.monto - a.monto);
                if (categoriasConMonto.length === 0) containerCatTotales.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-6">No hay gastos hormiga en este mes.</p>';
                else {
                    categoriasConMonto.forEach(cat => {
                        const porcentaje = totalHormiga > 0 ? ((cat.monto / totalHormiga) * 100).toFixed(1) : 0;
                        containerCatTotales.innerHTML += `<div class="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5"><div class="flex justify-between items-center text-xs"><span class="font-bold text-white flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color};"></span>${cat.nombre}</span><span class="font-extrabold text-amber-400">${fmt(cat.monto)} <span class="text-[10px] text-slate-500 font-normal">(${porcentaje}%)</span></span></div><div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80"><div class="h-full rounded-full transition-all duration-500" style="width: ${porcentaje}%; background-color: ${cat.color};"></div></div></div>`;
                    });
                }
            }

            const tbody = document.getElementById('tablaHormigaCuerpo');
            if (tbody) {
                tbody.innerHTML = ''; let itemsFiltrados = itemsHormiga;
                const filtrosActivos = window.hormigaState.filtrosCategorias || [];
                if (filtrosActivos.length > 0) itemsFiltrados = itemsFiltrados.filter(g => filtrosActivos.includes(g.categoria));

                const sortCol = window.hormigaState.sortColumn || 'fecha';
                const sortAsc = window.hormigaState.sortAscending !== false;
                itemsFiltrados.sort((a, b) => {
                    let valA = a[sortCol] || '';
                    let valB = b[sortCol] || '';
                    if (sortCol === 'monto') {
                        valA = parseFloat(valA) || 0;
                        valB = parseFloat(valB) || 0;
                    }
                    if (valA < valB) return sortAsc ? -1 : 1;
                    if (valA > valB) return sortAsc ? 1 : -1;
                    return 0;
                });

                if (itemsFiltrados.length === 0) tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">No hay gastos hormiga que coincidan.</td></tr>`;
                else {
                    itemsFiltrados.forEach(g => {
                        const catObj = catHormigaList.find(c => c.nombre === g.categoria); const colorCat = catObj ? catObj.color : '#f59e0b';
                        const fechaFmt = g.fecha ? g.fecha.split('-').reverse().join('/') : '';
                        tbody.innerHTML += `<tr class="hover:bg-slate-900/40 transition-colors"><td class="px-5 py-3.5 text-slate-400 text-xs">${fechaFmt}</td><td class="px-5 py-3.5 text-white font-bold">${g.concepto}</td><td class="px-5 py-3.5"><span class="px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white border inline-flex items-center gap-1.5" style="background-color: ${colorCat}22; border-color: ${colorCat}55;"><span class="w-2 h-2 rounded-full" style="background-color: ${colorCat};"></span>${g.categoria}</span></td><td class="px-5 py-3.5 text-slate-400 text-xs">${g.medioPago || 'Efectivo'}</td><td class="px-5 py-3.5 text-right font-extrabold text-amber-400">${fmt(g.monto)}</td><td class="px-5 py-3.5 text-right"><button onclick="deleteGastoHormiga('${g.id}')" class="text-slate-400 hover:text-rose-400" title="Eliminar"><i class="fa-solid fa-trash-can text-xs"></i></button></td></tr>`;
                    });
                }
            }
            renderHormigaCharts();
        }

        function renderHormigaCategoriasSelect() {
            const select = document.getElementById('hormigaCategoriaSelect');
            if (select) {
                const currentVal = select.value; select.innerHTML = '';
                (window.hormigaState.categorias || categoriasHormigaDefault).forEach(cat => { const opt = document.createElement('option'); opt.value = cat.nombre; opt.innerHTML = cat.nombre; select.appendChild(opt); });
                if (currentVal) select.value = currentVal;
            }
            renderFiltrosHormigaCatCheckboxes();
        }
        function renderFiltrosHormigaCatCheckboxes() {
            const container = document.getElementById('containerFiltrosHormigaCat'); if (!container) return; container.innerHTML = '';
            (window.hormigaState.categorias || categoriasHormigaDefault).forEach(cat => {
                const isChecked = !window.hormigaState.filtrosCategorias || window.hormigaState.filtrosCategorias.length === 0 || window.hormigaState.filtrosCategorias.includes(cat.nombre);
                container.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${cat.nombre}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroHormigaCategoria(this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${cat.color};"></span>${cat.nombre}</label>`;
            });
        }

        function renderFiltrosHormigaEvolCatCheckboxes() {
            const container = document.getElementById('containerFiltrosHormigaEvolCat'); if (!container) return; container.innerHTML = '';
            (window.hormigaState.categorias || categoriasHormigaDefault).forEach(cat => {
                const isChecked = !window.hormigaState.filtrosCategorias || window.hormigaState.filtrosCategorias.length === 0 || window.hormigaState.filtrosCategorias.includes(cat.nombre);
                container.innerHTML += `<label class="cursor-pointer px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${isChecked ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900/60 text-slate-500 border-slate-800'}"><input type="checkbox" value="${cat.nombre}" ${isChecked ? 'checked' : ''} onchange="toggleFiltroHormigaCategoria(this)" class="hidden"><span class="w-2 h-2 rounded-full" style="background-color: ${cat.color};"></span>${cat.nombre}</label>`;
            });
        }

        window.toggleFiltroHormigaCategoria = function(checkbox) {
            const catNombre = checkbox.value; const catList = window.hormigaState.categorias || categoriasHormigaDefault;
            if (!window.hormigaState.filtrosCategorias || window.hormigaState.filtrosCategorias.length === 0) window.hormigaState.filtrosCategorias = catList.map(c => c.nombre);
            if (checkbox.checked) { if (!window.hormigaState.filtrosCategorias.includes(catNombre)) window.hormigaState.filtrosCategorias.push(catNombre); }
            else { window.hormigaState.filtrosCategorias = window.hormigaState.filtrosCategorias.filter(c => c !== catNombre); }
            if (window.hormigaState.filtrosCategorias.length === catList.length) window.hormigaState.filtrosCategorias = [];
            renderFiltrosHormigaCatCheckboxes(); renderHormigaApp();
        };
        window.marcarTodosHormiga = function(marcar) { window.hormigaState.filtrosCategorias = marcar ? [] : ['__NINGUNA__']; renderFiltrosHormigaCatCheckboxes(); renderHormigaApp(); };

        function renderHormigaCharts() {
            const currentMonth = window.appState.currentMonth || '2026-10'; const allHormigaGastos = window.hormigaState.gastos || []; const catHormigaList = window.hormigaState.categorias || categoriasHormigaDefault;
            const currentItems = allHormigaGastos.filter(g => g.fecha && g.fecha.slice(0, 7) === currentMonth);
            let catMap = {}; catHormigaList.forEach(c => { catMap[c.nombre] = 0; });
            currentItems.forEach(g => { if (catMap[g.categoria] !== undefined) catMap[g.categoria] += parseFloat(g.monto) || 0; });
            let catLabels = [], catData = [], catColors = [];
            Object.keys(catMap).forEach(cName => { if (catMap[cName] > 0) { catLabels.push(cName); catData.push(catMap[cName]); const found = catHormigaList.find(c => c.nombre === cName); catColors.push(found ? found.color : '#f59e0b'); } });

            const ctxHormigaCat = document.getElementById('chartHormigaCategorias');
            if (ctxHormigaCat) { if (chartInstHormigaCat) chartInstHormigaCat.destroy(); chartInstHormigaCat = new Chart(ctxHormigaCat, { type: 'doughnut', data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: catColors, borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } } } } }); }

            let [cYear, cMonth] = currentMonth.split('-').map(Number); let monthsLabels = [], totalsByMonth = [];
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            for (let i = 5; i >= 0; i--) {
                let m = cMonth - i, y = cYear; while (m < 1) { m += 12; y--; }
                monthsLabels.push(`${monthNames[m - 1]} ${y}`); let totalM = 0;
                allHormigaGastos.forEach(g => { if (g.fecha && g.fecha.slice(0, 7) === `${y}-${String(m).padStart(2, '0')}`) totalM += parseFloat(g.monto) || 0; });
                totalsByMonth.push(totalM);
            }
            const ctxHormigaEvol = document.getElementById('chartHormigaEvolucion');
            if (ctxHormigaEvol) { if (chartInstHormigaEvol) chartInstHormigaEvol.destroy(); chartInstHormigaEvol = new Chart(ctxHormigaEvol, { type: 'bar', data: { labels: monthsLabels, datasets: [{ label: 'Gasto Hormiga Total', data: totalsByMonth, backgroundColor: '#f59e0b', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }

            const filtrosHormigaActivos = window.hormigaState.filtrosCategorias || [];
            let datasetsCatSeparadas = catHormigaList
                .filter(cat => filtrosHormigaActivos.length === 0 || filtrosHormigaActivos.includes(cat.nombre))
                .map(cat => {
                    let dataPorMes = []; let [currY2, currM2] = currentMonth.split('-').map(Number);
                    for (let i = 5; i >= 0; i--) {
                        let m = currM2 - i, y = currY2; while (m < 1) { m += 12; y--; }
                        let ymStr = `${y}-${String(m).padStart(2, '0')}`; let sumaCatMes = 0;
                        allHormigaGastos.forEach(g => { if (g.fecha && g.fecha.slice(0, 7) === ymStr && g.categoria === cat.nombre) sumaCatMes += parseFloat(g.monto) || 0; });
                        dataPorMes.push(sumaCatMes);
                    }
                    return { label: cat.nombre, data: dataPorMes, borderColor: cat.color, backgroundColor: cat.color, borderWidth: 2, fill: false, tension: 0.3 };
                });

            const ctxHormigaEvolCat = document.getElementById('chartHormigaEvolucionCategorias');
            if (ctxHormigaEvolCat) { 
                if (chartInstHormigaEvolCat) chartInstHormigaEvolCat.destroy(); 
                chartInstHormigaEvolCat = new Chart(ctxHormigaEvolCat, { 
                    type: 'line', 
                    data: { labels: monthsLabels, datasets: datasetsCatSeparadas }, 
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } 
                }); 
            }
        }

        window.handleSaveGastoHormiga = function(e) {
            e.preventDefault();
            const concepto = document.getElementById('hormigaConcepto').value; const monto = parseFloat(document.getElementById('hormigaMonto').value);
            const fecha = document.getElementById('hormigaFecha').value; const categoria = document.getElementById('hormigaCategoriaSelect').value; const medioPago = document.getElementById('hormigaMedioPago').value;
            if (!concepto || !monto || !fecha) return;
            window.hormigaState.gastos.push({ id: Date.now().toString(), concepto, monto, fecha, categoria, medioPago });
            window.saveHormigaDataToCloud(); document.getElementById('hormigaConcepto').value = ''; document.getElementById('hormigaMonto').value = ''; renderHormigaApp();
        };
        window.deleteGastoHormiga = function(id) { if (confirm('¿Eliminar este gasto hormiga?')) { window.hormigaState.gastos = window.hormigaState.gastos.filter(g => g.id !== id); window.saveHormigaDataToCloud(); renderHormigaApp(); } };
        window.openModalCatHormiga = function() { renderCatHormigaList(); document.getElementById('modalCatHormiga').classList.remove('hidden'); };
        function renderCatHormigaList() {
            const container = document.getElementById('listaCatHormigaConfig'); container.innerHTML = '';
            (window.hormigaState.categorias || []).forEach((cat, index) => {
                container.innerHTML += `<div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800"><div class="flex items-center gap-2 flex-1"><input type="color" value="${cat.color}" onchange="actualizarCatHormigaCampo(${index}, 'color', this.value)" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 cursor-pointer p-0.5"><input type="text" value="${cat.nombre}" onchange="actualizarCatHormigaCampo(${index}, 'nombre', this.value)" class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-white"></div><button onclick="eliminarCatHormiga(${index})" class="text-rose-400 hover:text-rose-300 p-2" title="Eliminar"><i class="fa-solid fa-trash-can text-xs"></i></button></div>`;
            });
        }
        window.actualizarCatHormigaCampo = function(index, campo, valor) {
            if (!window.hormigaState.categorias[index]) return;
            window.hormigaState.categorias[index][campo] = valor;
            window.saveHormigaDataToCloud(); renderHormigaCategoriasSelect(); renderHormigaApp();
        };
        window.agregarCategoriaHormiga = function() {
            const nombre = document.getElementById('nuevaCatHormigaNombre').value.trim(); const color = document.getElementById('nuevaCatHormigaColor').value;
            if (!nombre) return; window.hormigaState.categorias.push({ nombre, color });
            document.getElementById('nuevaCatHormigaNombre').value = ''; window.saveHormigaDataToCloud(); renderCatHormigaList(); renderHormigaCategoriasSelect(); renderHormigaApp();
        };
        window.eliminarCatHormiga = function(index) {
            if (window.hormigaState.categorias.length <= 1) return alert("Mínimo una categoría.");
            window.hormigaState.categorias.splice(index, 1);
            window.saveHormigaDataToCloud(); renderCatHormigaList(); renderHormigaCategoriasSelect(); renderHormigaApp();
        };

        // ---------------- FUNCIONES DE MÁS / EXPANDIR GRÁFICOS ----------------
        let modalChartInstance = null;

        window.expandirGraficoModal = function(originalCanvasId, titulo) {
            const originalCanvas = document.getElementById(originalCanvasId);
            if (!originalCanvas) return;

            const originalChart = Chart.getChart(originalCanvas);
            if (!originalChart) return;

            document.getElementById('modalGraficoTitulo').innerText = titulo || "Vista Ampliada del Gráfico";

            const modalCanvas = document.getElementById('chartModalCanvas');
            const ctx = modalCanvas.getContext('2d');

            if (modalChartInstance) {
                modalChartInstance.destroy();
            }

            modalChartInstance = new Chart(ctx, {
                type: originalChart.config.type,
                data: JSON.parse(JSON.stringify(originalChart.config.data)),
                options: {
                    ...originalChart.config.options,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        ...originalChart.config.options.plugins,
                        legend: {
                            ...originalChart.config.options.plugins?.legend,
                            display: true,
                            labels: { color: '#cbd5e1', font: { size: 12 } }
                        }
                    }
                }
            });

            document.getElementById('modalGraficoExpandido').classList.remove('hidden');
        };

        window.cerrarGraficoModal = function() {
            document.getElementById('modalGraficoExpandido').classList.add('hidden');
            if (modalChartInstance) {
                modalChartInstance.destroy();
                modalChartInstance = null;
            }
        };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.cerrarGraficoModal();
        });
    
