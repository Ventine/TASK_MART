class RoutineManager {
    constructor() {
        this.labels = { 
            matematicas: '🧮', 
            ciencias: '🔬', 
            humanidades: '🌍', 
            lectura: '📖', 
            imagen: '🎨', 
            extra: '🎀' 
        };

        this.DOM = {
            btnGenerate: document.getElementById('btnGenerate'),
            taskList: document.getElementById('taskList'),
            actionButtons: document.getElementById('actionButtons'),
            btnAccept: document.getElementById('btnAccept'),
            btnReject: document.getElementById('btnReject'),
            btnReset: document.getElementById('btnReset'),
            routineTracker: document.getElementById('routineTracker'),
            pendingTasks: document.getElementById('pendingTasks'),
            completedTasks: document.getElementById('completedTasks'),
            pendingCount: document.getElementById('pendingCount'),
            completedCount: document.getElementById('completedCount'),
            historySection: document.getElementById('historySection'),
            historyList: document.getElementById('historyList'),
            btnShowPendingPool: document.getElementById('btnShowPendingPool'),
            btnShowCompletedPool: document.getElementById('btnShowCompletedPool'),
            inputCustomTask: document.getElementById('inputCustomTask'),
            btnAddCustom: document.getElementById('btnAddCustom'),
            btnShowCustom: document.getElementById('btnShowCustom'),
            btnShowChart: document.getElementById('btnShowChart')
        };

        this.tempSelection = null;
        this.loadState();
        this.bindEvents();
        this.checkTodayStatus();
        this.renderHistory();
    }

    generateDefaultPool() {
        const baseTopics = {
            matematicas: [
                'Fracciones y Decimales', 'Regla de Tres Simple', 'Porcentajes Básicos', 
                'Ley de los Signos', 'Despeje de Ecuaciones (x)', 'Áreas y Perímetros', 
                'Teorema de Pitágoras', 'Lectura de Gráficas de Barras', 'Probabilidad con Monedas/Dados',
                'Jerarquía de Operaciones', 'Propiedades de los Exponentes', 'Plano Cartesiano'
            ],
            ciencias: [
                'Estados de la Materia', 'Partes de la Célula', 'La Tabla Periódica (Bases)', 
                'Fotosíntesis Explicada', 'Leyes de Newton (Conceptos)', 'El Ciclo del Agua', 
                'Tipos de Energía', 'Ecosistemas y Cadenas Alimenticias', 'Estructura del Átomo', 
                'Sistemas del Cuerpo Humano (Resumen)'
            ],
            humanidades: [
                'Línea de Tiempo de la Historia', 'Ramas del Poder Público (Col)', 'Continentes y Océanos', 
                '¿Qué es la Democracia?', 'Civilizaciones: Egipto y Grecia', 'Derechos Humanos Básicos', 
                'Geografía Básica de Colombia', 'La Revolución Industrial', 'Sectores de la Economía', 
                'Símbolos Patrios y Cultura'
            ],
            lectura: [
                'Identificar la Idea Principal', 'Diferencia entre Hecho y Opinión', 'Sinónimos y Antónimos', 
                'Uso de Signos de Puntuación', 'Tipos de Textos (Narrativo vs Expositivo)', 'Resumen de Cuentos Cortos', 
                'Prefijos y Sufijos', 'El Tono del Autor', 'Comprensión Literal', 
                'Figuras Literarias (Metáfora y Símil)'
            ],
            imagen: [
                'Figuras Geométricas 2D y 3D', 'Simetría Básica (Espejo)', 'Completar la Serie Gráfica', 
                'Rotación de Figuras a 90°', 'Identificar Sombras Simples', 'Plegado de Papel (Básico)', 
                'Diferencias entre Dos Imágenes', 'Vistas (Frente, Arriba, Lado)', 'Rompecabezas Visuales', 
                'Trazos Continuos sin Levantar el Lápiz'
            ]
        };

        const studyMethods = [
            'viendo videos de YT 🎬', 
            'con un taller 📝', 
            'haciendo un resumen 📓', 
            'investigando en internet 🔍', 
            'haciendo tarjetas para memorizar 🗂️',
            'dibujando un mapa mental 🧠',
            'leyendo un artículo y subrayando 📖',
            'estudiando con libro 📖'
        ];

        const pool = {};
        for (const [cat, topics] of Object.entries(baseTopics)) {
            pool[cat] = topics.map(topic => {
                const method = studyMethods[Math.floor(Math.random() * studyMethods.length)];
                const hours = [1, 1.5, 2][Math.floor(Math.random() * 3)];
                return { text: `${topic} ${method}`, hours: hours };
            });
        }
        return pool;
    }

    loadState() {
        try {
            let savedBlueprint = localStorage.getItem('masterBlueprintUnalV4');
            if (!savedBlueprint) {
                savedBlueprint = JSON.stringify(this.generateDefaultPool());
                localStorage.setItem('masterBlueprintUnalV4', savedBlueprint);
            }
            this.defaultTasks = JSON.parse(savedBlueprint);

            const savedPool = localStorage.getItem('taskPool');
            if (savedPool) {
                let parsed = JSON.parse(savedPool);
                if (parsed['matematicas'] && typeof parsed['matematicas'][0] === 'string') {
                    throw new Error("Formato antiguo detectado");
                }
                this.currentPool = parsed;
            } else {
                this.currentPool = structuredClone(this.defaultTasks);
            }

            this.todaySchedule = JSON.parse(localStorage.getItem('todayTracker')) || null;
            this.lastGeneratedDate = localStorage.getItem('lastGeneratedDate');
            this.history = JSON.parse(localStorage.getItem('routineHistory')) || [];
            
            // Cargar materias en descanso guardadas
            this.restingCats = JSON.parse(localStorage.getItem('restingCats')) || [];
        } catch (error) {
            console.log("Actualizando sistema a la versión V4...");
            this.resetSystem(true);
        }
    }

    getTodayDate() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    checkTodayStatus() {
        const today = this.getTodayDate();
        if (this.lastGeneratedDate === today && this.todaySchedule) {
            this.lockUI();
            this.renderTracker();
        }
    }

    generateRoutine() {
        let validCombo = false;
        let attempts = 0;
        let bestFallback = null;
        let bestFallbackDiff = 999;
        const categorias = Object.keys(this.currentPool);

        while (!validCombo && attempts < 200) {
            attempts++;
            let tempSched = {};
            let tempIndices = {};
            let currentHours = 0;
            let resting = [];
            
            let shuffledCats = [...categorias].sort(() => Math.random() - 0.5);

            for (const cat of shuffledCats) {
                let options = this.currentPool[cat];
                
                if (options.length === 0) continue; // Si ya dominó la materia, la ignoramos visualmente

                let randIdx = Math.floor(Math.random() * options.length);
                let taskObj = options[randIdx];

                if (currentHours + taskObj.hours <= 4.5) {
                    let chanceToStudy = currentHours < 1.5 ? 0.9 : 0.4;
                    
                    if (Math.random() < chanceToStudy) {
                        tempSched[cat] = { 
                            name: `${taskObj.text} (⏱️ ${taskObj.hours}h)`, 
                            rawTask: taskObj, // Guardamos la data cruda para la lógica de devolver a la biblioteca
                            done: false,
                            hours: taskObj.hours
                        };
                        tempIndices[cat] = randIdx;
                        currentHours += taskObj.hours;
                    } else {
                        resting.push(cat); // Se va a descanso, no se genera como tarea
                    }
                } else {
                    resting.push(cat);
                }
            }

            if (currentHours >= 1.5 && currentHours <= 4.5) {
                validCombo = true;
                this.tempSelection = { schedule: tempSched, indicesToRemove: tempIndices, totalHours: currentHours, restingCats: resting };
            } else {
                let diff = Math.abs(currentHours - 3);
                if (diff < bestFallbackDiff && currentHours > 0) {
                    bestFallbackDiff = diff;
                    bestFallback = { schedule: tempSched, indicesToRemove: tempIndices, totalHours: currentHours, restingCats: resting };
                }
            }
        }

        if (!validCombo && bestFallback) this.tempSelection = bestFallback;

        this.renderPreview(this.tempSelection);
        
        this.DOM.taskList.classList.remove('pop-animation');
        void this.DOM.taskList.offsetWidth; 
        this.DOM.taskList.classList.add('pop-animation');

        this.DOM.btnGenerate.hidden = true;
        this.DOM.actionButtons.hidden = false;
        this.DOM.taskList.hidden = false;
    }

    renderPreview(selection) {
        this.DOM.taskList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        // Tareas a estudiar
        for (const [key, taskObj] of Object.entries(selection.schedule)) {
            const div = document.createElement('div');
            div.className = 'task-item';
            const catName = key.startsWith('custom') ? 'extra' : key;
            div.innerHTML = `<span class="task-category">${this.labels[catName]} ${catName.toUpperCase()}</span><span class="task-name">${taskObj.name}</span>`;
            fragment.appendChild(div);
        }

        // Leyenda de materias en descanso
        if (selection.restingCats && selection.restingCats.length > 0) {
            const legend = document.createElement('div');
            legend.className = 'resting-legend';
            legend.innerHTML = `☁️ <strong>Hoy descansas en:</strong> ${selection.restingCats.map(c => this.labels[c] + ' ' + c.toUpperCase()).join(', ')}`;
            fragment.appendChild(legend);
        }

        this.DOM.taskList.appendChild(fragment);
    }

    acceptRoutine() {
        if (!this.tempSelection) return;
        
        // ¡MAGIA DE RETENCIÓN! Ya no eliminamos las tareas del Pool aquí.
        // Solo las eliminaremos si marca la casilla de completado.

        this.restingCats = this.tempSelection.restingCats;
        const today = this.getTodayDate();
        this.todaySchedule = this.tempSelection.schedule;
        
        this.saveData(today);
        this.DOM.taskList.hidden = true; 
        this.lockUI();
        this.renderTracker();
        
        Swal.fire({ 
            title: '¡Plan Guardado!', 
            text: `Hoy tu meta es un estudio relajado de ${this.tempSelection.totalHours} horas. ¡Disfruta el proceso! 💕`, 
            icon: 'info', 
            confirmButtonColor: '#f9a8d4' 
        });
    }

    renderTracker() {
        this.DOM.routineTracker.hidden = false;
        this.DOM.pendingTasks.innerHTML = '';
        this.DOM.completedTasks.innerHTML = '';
        let pending = 0, completed = 0;

        // Limpiar leyenda antigua
        let oldLegend = document.getElementById('trackerRestingLegend');
        if (oldLegend) oldLegend.remove();

        // Agregar nueva leyenda
        if (this.restingCats && this.restingCats.length > 0) {
            const legend = document.createElement('div');
            legend.id = 'trackerRestingLegend';
            legend.className = 'resting-legend';
            legend.innerHTML = `☁️ <strong>Hoy descansas en:</strong> ${this.restingCats.map(c => this.labels[c] + ' ' + c.toUpperCase()).join(', ')}`;
            this.DOM.routineTracker.insertBefore(legend, this.DOM.pendingTasks.parentElement);
        }

        for (const [category, taskObj] of Object.entries(this.todaySchedule)) {
            const div = document.createElement('label');
            div.className = `task-row ${taskObj.done ? 'completed' : ''}`;
            
            const isCustom = category.startsWith('custom');
            const labelIcon = this.labels[isCustom ? 'extra' : category];
            const labelText = isCustom ? 'EXTRA' : category.toUpperCase();

            div.innerHTML = `
                <input type="checkbox" class="task-checkbox" data-cat="${category}" ${taskObj.done ? 'checked' : ''}>
                <div class="task-info">
                    <span class="task-cat">${labelIcon} ${labelText}</span>
                    <span class="task-title">${taskObj.name}</span>
                </div>
            `;
            if (taskObj.done) { this.DOM.completedTasks.appendChild(div); completed++; } 
            else { this.DOM.pendingTasks.appendChild(div); pending++; }
        }
        this.DOM.pendingCount.textContent = pending;
        this.DOM.completedCount.textContent = completed;
        if (pending === 0 && completed > 0) this.DOM.completedTasks.parentElement.setAttribute('open', '');
    }

    addCustomTask() {
        const taskName = this.DOM.inputCustomTask.value.trim();
        if (!taskName) return;
        const customId = `custom_${Date.now()}`;
        this.todaySchedule[customId] = { name: taskName, done: false, isCustom: true };
        this.DOM.inputCustomTask.value = ''; 
        this.saveData(this.getTodayDate());
        this.renderTracker();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Anotado 🎀', showConfirmButton: false, timer: 1500 });
    }

    toggleTask(category) {
        const taskObj = this.todaySchedule[category];
        taskObj.done = !taskObj.done;
        
        if (taskObj.done) {
            this.playPopSound();
            // REMOVER de la biblioteca (Pool) solo si lo completó
            if (!taskObj.isCustom && taskObj.rawTask) {
                const poolArr = this.currentPool[category];
                if (poolArr) {
                    const idx = poolArr.findIndex(t => t.text === taskObj.rawTask.text);
                    if (idx > -1) poolArr.splice(idx, 1);
                }
            }
        } else {
            // DEVOLVER a la biblioteca si desmarca la casilla
            if (!taskObj.isCustom && taskObj.rawTask) {
                const poolArr = this.currentPool[category];
                if (poolArr) {
                    const exists = poolArr.some(t => t.text === taskObj.rawTask.text);
                    if (!exists) poolArr.push(taskObj.rawTask);
                }
            }
        }

        this.saveData(this.getTodayDate());
        this.renderTracker();
        this.checkVictory();
    }

    playPopSound() {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    checkVictory() {
        const todasCompletadas = Object.values(this.todaySchedule).every(t => t.done === true);
        
        if (todasCompletadas) {
            const today = this.getTodayDate();
            const existingIndex = this.history.findIndex(h => h.date === today);
            const historialSimple = {};
            for(let key in this.todaySchedule) historialSimple[key] = this.todaySchedule[key].name;

            if (existingIndex === -1) {
                this.history.push({ date: today, schedule: historialSimple });
                if (this.history.length > 5) this.history.shift();
                localStorage.setItem('routineHistory', JSON.stringify(this.history));
                this.renderHistory();
            }
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
            
            const poolEmpty = Object.values(this.currentPool).every(arr => arr.length === 0);

            if (poolEmpty) {
                Swal.fire({ 
                    title: '¡TEMARIO MAESTRO! 🎓', 
                    text: 'Has dominado todos los temas básicos de la semana. Tómate un merecido descanso, la caché se reiniciará para un nuevo nivel.', 
                    icon: 'success', 
                    confirmButtonColor: '#d9f99d' 
                }).then(() => {
                    this.resetSystem(false, true);
                });
            } else {
                Swal.fire({ title: '¡Día Productivo! 🌸', text: 'Terminaste todo tu estudio de hoy. ¡Lo estás haciendo súper bien!', icon: 'success', confirmButtonColor: '#d9f99d', color: '#4a4e69' });
            }
        }
    }

    saveData(todayDate) {
        localStorage.setItem('taskPool', JSON.stringify(this.currentPool));
        localStorage.setItem('todayTracker', JSON.stringify(this.todaySchedule));
        localStorage.setItem('lastGeneratedDate', todayDate);
        localStorage.setItem('restingCats', JSON.stringify(this.restingCats || []));
    }

    rejectRoutine() { this.generateRoutine(); }

    lockUI() {
        this.DOM.actionButtons.hidden = true;
        this.DOM.btnGenerate.hidden = false;
        this.DOM.btnGenerate.textContent = '¡A estudiar! 📚✨';
        this.DOM.btnGenerate.disabled = true;
    }

    renderHistory() {
        const today = this.getTodayDate();
        const pastRecords = this.history.filter(r => r.date !== today).slice(-2).reverse();
        if (pastRecords.length === 0) { this.DOM.historySection.hidden = true; return; }

        this.DOM.historySection.hidden = false;
        this.DOM.historyList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const dFormat = new Intl.DateTimeFormat('es-CO', { weekday: 'long', month: 'long', day: 'numeric' });

        pastRecords.forEach(record => {
            const card = document.createElement('div');
            card.className = 'history-card';
            const [y, m, d] = record.date.split('-');
            let badgesHtml = '';
            for (const [key, task] of Object.entries(record.schedule)) {
                badgesHtml += `<span class="badge">${this.labels[key.startsWith('custom') ? 'extra' : key] || '✅'} ${task}</span>`;
            }
            card.innerHTML = `<div class="history-date">📅 ${dFormat.format(new Date(y, m - 1, d))}</div><div class="history-badges">${badgesHtml}</div>`;
            fragment.appendChild(card);
        });
        this.DOM.historyList.appendChild(fragment);
    }

    resetSystem(silent = false, keepHistory = false) {
        const executeReset = () => {
            const savedHistory = keepHistory ? JSON.stringify(this.history) : null;
            
            localStorage.clear(); 
            
            if (savedHistory) localStorage.setItem('routineHistory', savedHistory);

            const newBlueprint = JSON.stringify(this.generateDefaultPool());
            localStorage.setItem('masterBlueprintUnalV4', newBlueprint);
            this.defaultTasks = JSON.parse(newBlueprint);

            this.currentPool = structuredClone(this.defaultTasks);
            this.todaySchedule = null;
            this.lastGeneratedDate = null;
            this.restingCats = [];
            this.history = keepHistory ? JSON.parse(savedHistory) : [];
            
            this.DOM.btnGenerate.textContent = '🐣 Generar Mi Día de Estudio';
            this.DOM.btnGenerate.disabled = false;
            this.DOM.taskList.hidden = true;
            this.DOM.actionButtons.hidden = true;
            this.DOM.routineTracker.hidden = true;
            this.renderHistory();
        };

        if (silent) { executeReset(); return; }

        Swal.fire({
            title: '¿Reiniciar ciclo?', text: "Se limpiarán tus temas pendientes y horarios actuales. ¡Adelante si estás lista para un nuevo reto! 🌸", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#f9a8d4', cancelButtonColor: '#c9ada7', confirmButtonText: 'Sí, empezar de cero'
        }).then((result) => {
            if (result.isConfirmed) { 
                executeReset(); 
                Swal.fire('Ciclo Nuevo', 'El temario se ha llenado con nuevos retos divertidos. ¡Con toda! 💕', 'success'); 
            }
        });
    }

    showProgressChart() {
        const consumedTasks = {};
        let totalConsumed = 0;

        for (const cat in this.defaultTasks) {
            const originalCount = this.defaultTasks[cat].length;
            const currentCount = this.currentPool[cat].length;
            consumedTasks[cat] = originalCount - currentCount;
            totalConsumed += consumedTasks[cat];
        }

        if (totalConsumed === 0) {
            Swal.fire({ title: 'Aún no hay datos', text: 'Completa algunos temas para ver tu gráfica 🌸', icon: 'info', confirmButtonColor: '#f9a8d4', customClass: { popup: 'custom-swal' } });
            return;
        }

        const labels = Object.keys(consumedTasks).filter(c => consumedTasks[c] > 0).map(c => `${this.labels[c]} ${c.toUpperCase()}`);
        const data = Object.values(consumedTasks).filter(v => v > 0);

        Swal.fire({
            title: '📊 Tu Progreso UNAL',
            html: '<div style="width: 100%; max-width: 300px; margin: auto;"><canvas id="progressChart"></canvas></div>',
            confirmButtonColor: '#c4b5fd',
            confirmButtonText: '¡A seguir así!',
            customClass: { popup: 'custom-swal' },
            didOpen: () => {
                const ctx = document.getElementById('progressChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: ['#fbcfe8', '#d9f99d', '#fed7aa', '#c4b5fd', '#bae6fd'],
                            borderWidth: 3,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: { plugins: { legend: { position: 'bottom', labels: { font: { family: 'Nunito', weight: 'bold' } } } } }
                });
            }
        });
    }

    buildModalHTML(dataObject, emptyTitle, emptySub, isGold = false) {
        let html = '<div class="swal-grid">';
        let totalItems = 0;

        for (const [category, tasks] of Object.entries(dataObject)) {
            totalItems += tasks.length;
            html += `
                <div class="swal-category-card ${isGold ? 'gold-card' : ''}">
                    <span class="swal-cat-icon">${this.labels[category] || '🎯'}</span>
                    <div class="swal-cat-title">${category}</div>
            `;
            if (tasks.length === 0) {
                html += `<div class="swal-empty-cat">Dominado ✨</div>`;
            } else {
                html += `<ul class="swal-tags ${isGold ? 'gold-tags' : ''}">`;
                tasks.forEach(task => {
                    let textObj = typeof task === 'object' ? `${task.text} (${task.hours}h)` : task;
                    html += `<li>${textObj}</li>`
                });
                html += `</ul>`;
            }
            html += `</div>`;
        }
        html += '</div>';

        if (totalItems === 0) {
            return `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🐹</div>
                    <h3 style="color: var(--text-main); font-weight: 800;">${emptyTitle}</h3>
                    <p style="color: var(--text-muted);">${emptySub}</p>
                </div>
            `;
        }
        return html;
    }

    showPendingPool() {
        const formattedPool = {};
        for (const [cat, items] of Object.entries(this.currentPool)) {
            formattedPool[cat] = items;
        }
        const htmlContent = this.buildModalHTML(formattedPool, '¡Temario devorado!', 'No te quedan temas en la lista. ¡Estás súper preparada!', false);
        Swal.fire({ 
            title: '🎒 Temario Restante', 
            html: htmlContent, 
            width: '800px',
            showConfirmButton: true,
            confirmButtonText: 'A seguir estudiando',
            confirmButtonColor: '#f9a8d4',
            customClass: { popup: 'custom-swal' }
        });
    }

    showCompletedPool() {
        const consumedTasks = {};
        for (const cat in this.defaultTasks) {
            const original = [...this.defaultTasks[cat]];
            const current = [...this.currentPool[cat]];
            current.forEach(item => {
                const idx = original.findIndex(o => o.text === item.text);
                if (idx > -1) original.splice(idx, 1);
            });
            consumedTasks[cat] = original; 
        }
        
        const htmlContent = this.buildModalHTML(consumedTasks, 'Aún no arrancas', 'Pronto empezarás a dominar este temario. ¡Da el primer paso hoy!', true);
        Swal.fire({ 
            title: '🏆 Temas Dominados', 
            html: htmlContent, 
            width: '800px',
            confirmButtonText: '¡Qué orgullo!',
            confirmButtonColor: '#fcd34d',
            customClass: { popup: 'custom-swal' }
        });
    }

    showCustomTasks() {
        const customTasks = Object.values(this.todaySchedule || {}).filter(t => t.isCustom);
        let htmlContent = '';
        if (customTasks.length === 0) {
            htmlContent = `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🧘‍♀️</div>
                    <h3 style="color: var(--text-main); font-weight: 800;">Día tranquilo</h3>
                    <p style="color: var(--text-muted);">No tienes tareas extra pendientes por hoy.</p>
                </div>
            `;
        } else {
            htmlContent = '<div class="swal-grid" style="grid-template-columns: 1fr;">';
            htmlContent += `<div class="swal-category-card" style="border-color: #cbd5e1;">`;
            htmlContent += `<span class="swal-cat-icon">🎀</span><div class="swal-cat-title">Extras de Hoy</div>`;
            htmlContent += `<ul class="swal-tags" style="align-items: center;">`;
            customTasks.forEach(t => htmlContent += `<li style="width: 80%;">${t.name}</li>`);
            htmlContent += `</ul></div></div>`;
        }

        Swal.fire({
            title: '🌸 Tareas Extra',
            html: htmlContent,
            confirmButtonColor: '#c9ada7',
            confirmButtonText: 'Entendido',
            width: '450px',
            customClass: { popup: 'custom-swal' }
        });
    }

    bindEvents() {
        this.DOM.btnGenerate.addEventListener('click', () => this.generateRoutine());
        this.DOM.btnAccept.addEventListener('click', () => this.acceptRoutine());
        this.DOM.btnReject.addEventListener('click', () => this.rejectRoutine());
        this.DOM.btnReset.addEventListener('click', () => this.resetSystem());
        
        this.DOM.btnShowPendingPool.addEventListener('click', () => this.showPendingPool());
        this.DOM.btnShowCompletedPool.addEventListener('click', () => this.showCompletedPool());
        if(this.DOM.btnShowChart) this.DOM.btnShowChart.addEventListener('click', () => this.showProgressChart());
        
        this.DOM.btnAddCustom.addEventListener('click', () => this.addCustomTask());
        this.DOM.btnShowCustom.addEventListener('click', () => this.showCustomTasks());
        
        this.DOM.inputCustomTask.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCustomTask();
        });

        this.DOM.routineTracker.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const categoria = e.target.getAttribute('data-cat');
                this.toggleTask(categoria);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new RoutineManager());

// REGISTRO DE PWA (Service Worker)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA Lista y funcionando offline 🚀', reg.scope))
            .catch(err => console.error('Error registrando PWA:', err));
    });
}