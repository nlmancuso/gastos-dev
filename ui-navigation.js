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

