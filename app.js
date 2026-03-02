class RoutineManager {
    constructor() {
        // Los 5 pilares exactos del examen de la UNAL + Extras
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
            btnShowCustom: document.getElementById('btnShowCustom')
        };

        this.tempSelection = null;
        this.loadState();
        this.bindEvents();
        this.checkTodayStatus();
        this.renderHistory();
    }

    /**
     * BANCO DE DATOS UNAL (Nivel: Principiante / Bases sólidas)
     * Métodos de estudio simplificados y directos.
     */
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

        // Métodos de estudio solicitados: Sencillos y sin términos complejos
        const studyMethods = [
            'viendo videos de YT 🎬', 
            'con un taller 📝', 
            'haciendo un resumen 📓', 
            'investigando en internet 🔍', 
            'haciendo tarjetas para memorizar 🗂️',
            'dibujando un mapa mental 🧠',
            'leyendo un artículo y subrayando 📖'
        ];

        const pool = {};
        for (const [cat, topics] of Object.entries(baseTopics)) {
            pool[cat] = topics.map(topic => {
                const method = studyMethods[Math.floor(Math.random() * studyMethods.length)];
                // Asigna aleatoriamente 1, 1.5 o 2 horas a este tema
                const hours = [1, 1.5, 2][Math.floor(Math.random() * 3)];
                return {
                    text: `${topic} ${method}`,
                    hours: hours
                };
            });
        }
        return pool;
    }

    loadState() {
        try {
            // V3 forzará la actualización de la caché para cargar los nuevos métodos
            let savedBlueprint = localStorage.getItem('masterBlueprintUnalV3');
            if (!savedBlueprint) {
                savedBlueprint = JSON.stringify(this.generateDefaultPool());
                localStorage.setItem('masterBlueprintUnalV3', savedBlueprint);
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
        } catch (error) {
            console.log("Actualizando sistema a la nueva versión...");
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

    /**
     * ALGORITMO MAESTRO DE HORAS (1.5 a 4.5 horas diarias)
     */
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
            
            let shuffledCats = [...categorias].sort(() => Math.random() - 0.5);

            for (const cat of shuffledCats) {
                let options = this.currentPool[cat];
                
                if (options.length === 0) {
                    tempSched[cat] = { name: "✨ Dominado", done: false, hours: 0 };
                    continue;
                }

                let randIdx = Math.floor(Math.random() * options.length);
                let taskObj = options[randIdx];

                // LÍMITE: Máximo 4.5 horas al día
                if (currentHours + taskObj.hours <= 4.5) {
                    // Probabilidad de estudiar: Alta si no hemos llegado a 1.5h
                    let chanceToStudy = currentHours < 1.5 ? 0.9 : 0.4;
                    
                    if (Math.random() < chanceToStudy) {
                        tempSched[cat] = { 
                            name: `${taskObj.text} (⏱️ ${taskObj.hours}h)`, 
                            done: false,
                            hours: taskObj.hours
                        };
                        tempIndices[cat] = randIdx;
                        currentHours += taskObj.hours;
                    } else {
                        tempSched[cat] = { name: "Descanso ☁️", done: false, hours: 0 };
                    }
                } else {
                    tempSched[cat] = { name: "Descanso ☁️", done: false, hours: 0 };
                }
            }

            // Validar si el día armado tiene entre 1.5 y 4.5 horas
            if (currentHours >= 1.5 && currentHours <= 4.5) {
                validCombo = true;
                this.tempSelection = { schedule: tempSched, indicesToRemove: tempIndices, totalHours: currentHours };
            } else {
                let diff = Math.abs(currentHours - 3);
                if (diff < bestFallbackDiff && currentHours > 0) {
                    bestFallbackDiff = diff;
                    bestFallback = { schedule: tempSched, indicesToRemove: tempIndices, totalHours: currentHours };
                }
            }
        }

        if (!validCombo && bestFallback) {
            this.tempSelection = bestFallback;
        }

        this.renderPreview(this.tempSelection.schedule);
        
        this.DOM.taskList.classList.remove('pop-animation');
        void this.DOM.taskList.offsetWidth; 
        this.DOM.taskList.classList.add('pop-animation');

        this.DOM.btnGenerate.hidden = true;
        this.DOM.actionButtons.hidden = false;
        this.DOM.taskList.hidden = false;
    }

    renderPreview(tasks) {
        this.DOM.taskList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        for (const [key, taskObj] of Object.entries(tasks)) {
            const div = document.createElement('div');
            div.className = 'task-item';
            const catName = key.startsWith('custom') ? 'extra' : key;
            div.innerHTML = `<span class="task-category">${this.labels[catName]} ${catName.toUpperCase()}</span><span class="task-name">${taskObj.name}</span>`;
            fragment.appendChild(div);
        }
        this.DOM.taskList.appendChild(fragment);
    }

    acceptRoutine() {
        if (!this.tempSelection) return;
        for (const [category, index] of Object.entries(this.tempSelection.indicesToRemove)) {
            this.currentPool[category].splice(index, 1);
        }
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
        this.todaySchedule[category].done = !this.todaySchedule[category].done;
        this.saveData(this.getTodayDate());
        this.renderTracker();
        this.checkVictory();
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
            localStorage.setItem('masterBlueprintUnalV3', newBlueprint);
            this.defaultTasks = JSON.parse(newBlueprint);

            this.currentPool = structuredClone(this.defaultTasks);
            this.todaySchedule = null;
            this.lastGeneratedDate = null;
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