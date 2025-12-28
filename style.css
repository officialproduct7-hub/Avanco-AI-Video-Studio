import { GoogleGenAI } from "@google/genai";

/**
 * ESTADO GLOBAL DA APLICAÇÃO
 */
const state = {
    apiKey: localStorage.getItem('vinci_api_key') || '',
    projects: JSON.parse(localStorage.getItem('vinci_projects') || '[]'),
    currentProject: {
        id: Date.now().toString(),
        name: 'Novo Vídeo',
        type: 'short', // short ou long
        scenes: [],
        finalVideoUrl: '',
        subtitles: []
    },
    isProcessing: false,
    recorder: null,
    audioBlob: null
};

// Seletores DOM
const els = {
    apiKeyInput: document.getElementById('api-key-input'),
    saveKeyBtn: document.getElementById('save-key-btn'),
    clearKeyBtn: document.getElementById('clear-key-btn'),
    apiStatus: document.getElementById('api-status'),
    projectNameInput: document.getElementById('project-name-input'),
    storyboardList: document.getElementById('storyboard-list'),
    newScenePrompt: document.getElementById('new-scene-prompt'),
    addSceneBtn: document.getElementById('add-scene-btn'),
    generateBtn: document.getElementById('generate-final-btn'),
    mainPlayer: document.getElementById('main-player'),
    loadingSpinner: document.getElementById('loading-spinner'),
    loadingMsg: document.getElementById('loading-msg'),
    recordBtn: document.getElementById('record-btn'),
    audioType: document.getElementById('audio-type'),
    micControls: document.getElementById('mic-controls'),
    uploadControls: document.getElementById('upload-controls'),
    audioFile: document.getElementById('audio-file'),
    exportBar: document.getElementById('export-bar'),
    downloadVideoBtn: document.getElementById('download-video-btn'),
    downloadSrtBtn: document.getElementById('download-srt-btn'),
    projectList: document.getElementById('project-list'),
    newProjectBtn: document.getElementById('new-project-btn')
};

/**
 * INICIALIZAÇÃO
 */
function init() {
    if (state.apiKey) {
        els.apiKeyInput.value = '********';
        updateApiStatus('Chave Ativa', 'status-ok');
    }
    
    renderStoryboard();
    renderProjectList();
    bindEvents();
}

/**
 * EVENTOS
 */
function bindEvents() {
    els.saveKeyBtn.onclick = () => {
        const key = els.apiKeyInput.value.trim();
        if (!key || key === '********') return;
        state.apiKey = key;
        localStorage.setItem('vinci_api_key', key);
        els.apiKeyInput.value = '********';
        updateApiStatus('Salvo com sucesso', 'status-ok');
    };

    els.clearKeyBtn.onclick = () => {
        state.apiKey = '';
        localStorage.removeItem('vinci_api_key');
        els.apiKeyInput.value = '';
        updateApiStatus('Chave removida', 'status-err');
    };

    els.audioType.onchange = (e) => {
        els.micControls.classList.toggle('hidden', e.target.value !== 'mic');
        els.uploadControls.classList.toggle('hidden', e.target.value !== 'upload');
    };

    els.recordBtn.onclick = async () => {
        if (!state.recorder) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            state.recorder = new MediaRecorder(stream);
            let chunks = [];
            state.recorder.ondataavailable = e => chunks.push(e.data);
            state.recorder.onstop = () => {
                state.audioBlob = new Blob(chunks, { type: 'audio/webm' });
                els.recordBtn.innerHTML = '<i class="fa-solid fa-check"></i> Gravado';
            };
            state.recorder.start();
            els.recordBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Parar';
        } else {
            state.recorder.stop();
            state.recorder = null;
        }
    };

    els.addSceneBtn.onclick = () => {
        const prompt = els.newScenePrompt.value.trim();
        if (!prompt) return alert('Descreva a cena!');
        
        const scene = {
            id: Math.random().toString(36).substr(2, 9),
            prompt: prompt,
            audioType: els.audioType.value,
            audioData: state.audioBlob,
            videoUrl: ''
        };
        
        state.currentProject.scenes.push(scene);
        els.newScenePrompt.value = '';
        state.audioBlob = null;
        els.recordBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Gravar';
        renderStoryboard();
    };

    els.generateBtn.onclick = async () => {
        if (state.isProcessing) return;
        if (!state.apiKey) return alert('Configure sua API Key primeiro!');
        if (state.currentProject.scenes.length === 0) return alert('Adicione ao menos uma cena!');

        await generateUnifiedVideo();
    };

    els.downloadVideoBtn.onclick = () => downloadBlob(state.currentProject.finalVideoUrl, 'video.mp4');
    els.downloadSrtBtn.onclick = () => exportSRT();
    
    els.newProjectBtn.onclick = () => {
        state.currentProject = { id: Date.now().toString(), name: 'Novo Vídeo', scenes: [] };
        els.projectNameInput.value = state.currentProject.name;
        els.exportBar.classList.add('hidden');
        renderStoryboard();
    };
}

/**
 * LÓGICA DE GERAÇÃO (UNIFICADA)
 */
async function generateUnifiedVideo() {
    toggleLoading(true, "Iniciando Processamento...");
    const ai = new GoogleGenAI({ apiKey: state.apiKey });
    let currentVideo = null; // Para extensão

    try {
        for (let i = 0; i < state.currentProject.scenes.length; i++) {
            const scene = state.currentProject.scenes[i];
            toggleLoading(true, `Sintetizando Cena ${i+1}...`);

            let config = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: scene.prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            };

            // Se for a segunda cena em diante, estender o vídeo anterior
            if (currentVideo) {
                config.video = currentVideo;
            }

            let operation = await ai.models.generateVideos(config);
            
            // Polling
            while (!operation.done) {
                await new Promise(r => setTimeout(r, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const videoMeta = operation.response?.generatedVideos?.[0]?.video;
            currentVideo = videoMeta; // Atualiza para a próxima extensão
            
            // Atualizar status na UI
            scene.videoUrl = videoMeta.uri;
        }

        // Finalizar e Baixar o arquivo completo
        toggleLoading(true, "Finalizando arquivo único...");
        const finalResp = await fetch(`${currentVideo.uri}&key=${state.apiKey}`);
        const finalBlob = await finalResp.blob();
        state.currentProject.finalVideoUrl = URL.createObjectURL(finalBlob);
        
        // Gerar Legendas Sincronizadas
        toggleLoading(true, "Gerando Legendas...");
        await generateSubtitles(ai);

        els.mainPlayer.src = state.currentProject.finalVideoUrl;
        els.exportBar.classList.remove('hidden');
        saveProject();
        alert("Vídeo Final Gerado com Sucesso!");

    } catch (err) {
        console.error(err);
        if (err.status === 429) alert("Erro de Quota: Muitas requisições. Aguarde 1 minuto.");
        else alert("Erro durante a geração: " + err.message);
    } finally {
        toggleLoading(false);
    }
}

async function generateSubtitles(ai) {
    const fullPrompt = state.currentProject.scenes.map(s => s.prompt).join(" ");
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere legendas sincronizadas (JSON) para este roteiro: "${fullPrompt}". Formato: [{startTime: 0, endTime: 5, text: "..."}]`,
        config: { responseMimeType: "application/json" }
    });
    state.currentProject.subtitles = JSON.parse(response.text);
}

/**
 * UTILITÁRIOS DE UI
 */
function renderStoryboard() {
    els.storyboardList.innerHTML = '';
    state.currentProject.scenes.forEach((scene, index) => {
        const item = document.createElement('div');
        item.className = 'scene-item glass';
        item.innerHTML = `
            <div class="scene-num">${index + 1}</div>
            <div class="scene-content">
                <p class="text-xs font-bold text-indigo-400 mb-1">PROMPT</p>
                <p class="text-sm">${scene.prompt}</p>
                <p class="text-[10px] mt-2 text-neutral-500 uppercase">Áudio: ${scene.audioType}</p>
            </div>
            <div class="scene-actions">
                <button class="btn-icon btn-danger" onclick="removeScene('${scene.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        els.storyboardList.appendChild(item);
    });
}

function renderProjectList() {
    els.projectList.innerHTML = '';
    state.projects.forEach(p => {
        const div = document.createElement('div');
        div.className = 'p-2 border-b border-white/5 cursor-pointer hover:bg-white/5 text-xs truncate';
        div.textContent = p.name;
        div.onclick = () => loadProject(p.id);
        els.projectList.appendChild(div);
    });
}

window.removeScene = (id) => {
    state.currentProject.scenes = state.currentProject.scenes.filter(s => s.id !== id);
    renderStoryboard();
};

function toggleLoading(show, msg = "") {
    state.isProcessing = show;
    els.loadingSpinner.classList.toggle('hidden', !show);
    els.loadingMsg.textContent = msg;
    els.generateBtn.disabled = show;
}

function updateApiStatus(text, className) {
    els.apiStatus.textContent = text;
    els.apiStatus.className = `api-status ${className}`;
}

function saveProject() {
    const idx = state.projects.findIndex(p => p.id === state.currentProject.id);
    if (idx > -1) state.projects[idx] = state.currentProject;
    else state.projects.push(state.currentProject);
    localStorage.setItem('vinci_projects', JSON.stringify(state.projects));
    renderProjectList();
}

function loadProject(id) {
    const p = state.projects.find(x => x.id === id);
    if (p) {
        state.currentProject = p;
        els.projectNameInput.value = p.name;
        if (p.finalVideoUrl) els.mainPlayer.src = p.finalVideoUrl;
        renderStoryboard();
    }
}

function downloadBlob(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportSRT() {
    let srt = "";
    state.currentProject.subtitles.forEach((sub, i) => {
        srt += `${i + 1}\n00:00:${sub.startTime.toString().padStart(2, '0')},000 --> 00:00:${sub.endTime.toString().padStart(2, '0')},000\n${sub.text}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain' });
    downloadBlob(URL.createObjectURL(blob), 'legendas.srt');
}

init();
