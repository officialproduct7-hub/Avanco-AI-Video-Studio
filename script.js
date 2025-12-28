import { GoogleGenAI } from "@google/genai";

/**
 * CONFIGURAÇÃO E ESTADO
 */
const state = {
    apiKey: localStorage.getItem('vinci_api_key') || '',
    projects: JSON.parse(localStorage.getItem('vinci_projects') || '[]'),
    currentProject: {
        id: Date.now().toString(),
        name: 'Novo Projeto',
        aspectRatio: '16:9',
        resolution: '720p',
        scenes: [],
        transition: 'fade'
    },
    isGenerating: false
};

// UI Elements
const els = {
    apiKeyInput: document.getElementById('api-key-input'),
    apiStatus: document.getElementById('api-status'),
    saveKeyBtn: document.getElementById('save-key-btn'),
    clearKeyBtn: document.getElementById('clear-key-btn'),
    projectNameInput: document.getElementById('project-name-input'),
    scenePrompt: document.getElementById('scene-prompt'),
    addSceneBtn: document.getElementById('add-scene-btn'),
    storyboardGrid: document.getElementById('storyboard-grid'),
    loadingIndicator: document.getElementById('loading-indicator'),
    loadingText: document.getElementById('loading-text'),
    previewVideo: document.getElementById('preview-video'),
    stitchBtn: document.getElementById('stitch-btn'),
    projectList: document.getElementById('project-list'),
    exportBtn: document.getElementById('export-btn')
};

/**
 * INICIALIZAÇÃO
 */
function init() {
    if (state.apiKey) {
        els.apiKeyInput.value = '********';
        updateApiStatus('Chave salva', 'status-ok');
    }
    
    bindEvents();
    renderProjectList();
    renderStoryboard();
}

/**
 * EVENTOS
 */
function bindEvents() {
    els.saveKeyBtn.onclick = () => {
        const val = els.apiKeyInput.value.trim();
        if (!val || val === '********') return alert('Insira uma chave válida');
        state.apiKey = val;
        localStorage.setItem('vinci_api_key', val);
        els.apiKeyInput.value = '********';
        updateApiStatus('Chave atualizada', 'status-ok');
    };

    els.clearKeyBtn.onclick = () => {
        state.apiKey = '';
        localStorage.removeItem('vinci_api_key');
        els.apiKeyInput.value = '';
        updateApiStatus('Chave removida', 'status-err');
    };

    els.projectNameInput.onchange = (e) => {
        state.currentProject.name = e.target.value.trim() || 'Sem Nome';
    };

    els.addSceneBtn.onclick = () => {
        const prompt = els.scenePrompt.value.trim();
        if (!prompt) return alert('Descreva a cena antes de adicionar');
        
        const newScene = {
            id: Math.random().toString(36).substr(2, 9),
            prompt: prompt,
            videoUrl: '',
            status: 'pending'
        };

        state.currentProject.scenes.push(newScene);
        els.scenePrompt.value = '';
        renderStoryboard();
    };

    els.stitchBtn.onclick = async () => {
        if (!state.apiKey) return alert('Configure sua API Key primeiro');
        if (state.currentProject.scenes.length === 0) return alert('Adicione cenas ao storyboard');
        
        // Simulação de "Save Project" no Stitch
        saveCurrentProject();
    };

    els.exportBtn.onclick = () => {
        if (!state.currentProject.scenes.length) return;
        downloadProjectConfig();
    };
}

/**
 * LÓGICA DE STORYBOARD
 */
function renderStoryboard() {
    els.storyboardGrid.textContent = ''; // Clear

    state.currentProject.scenes.forEach((scene, index) => {
        const card = document.createElement('div');
        card.className = 'scene-card glass';

        // Thumb
        const thumb = document.createElement('div');
        thumb.className = 'scene-thumb';
        if (scene.videoUrl) {
            const vid = document.createElement('video');
            vid.src = scene.videoUrl;
            vid.muted = true;
            vid.onmouseover = () => vid.play();
            vid.onmouseleave = () => vid.pause();
            thumb.appendChild(vid);
        } else {
            thumb.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center; opacity:0.2">
                <i class="fa-solid fa-film text-4xl"></i>
            </div>`;
        }

        // Scene Number & Move Controls
        const overlay = document.createElement('div');
        overlay.style = "position:absolute; top:8px; left:8px; display:flex; gap:4px; z-index:5";
        overlay.innerHTML = `
            <span style="background:rgba(0,0,0,0.8); padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold">CENA ${index+1}</span>
            <button class="move-up" style="padding:2px; font-size:10px; background:rgba(0,0,0,0.6)"><i class="fa-solid fa-chevron-up"></i></button>
            <button class="move-down" style="padding:2px; font-size:10px; background:rgba(0,0,0,0.6)"><i class="fa-solid fa-chevron-down"></i></button>
        `;
        overlay.querySelector('.move-up').onclick = () => moveScene(index, -1);
        overlay.querySelector('.move-down').onclick = () => moveScene(index, 1);
        thumb.appendChild(overlay);

        // Content
        const info = document.createElement('div');
        info.className = 'scene-info';
        
        const txt = document.createElement('textarea');
        txt.value = scene.prompt;
        txt.onchange = (e) => { scene.prompt = e.target.value; };
        
        const footer = document.createElement('div');
        footer.className = 'scene-footer';
        
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-danger';
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.onclick = () => {
            state.currentProject.scenes.splice(index, 1);
            renderStoryboard();
        };

        const genBtn = document.createElement('button');
        genBtn.className = scene.status === 'completed' ? 'btn-primary-outline' : 'btn-primary';
        genBtn.innerHTML = scene.status === 'generating' ? '<i class="fa-solid fa-spinner fa-spin"></i>' : 
                          (scene.status === 'completed' ? 'Regerar' : 'Gerar');
        genBtn.onclick = () => generateSceneVideo(scene.id);
        genBtn.disabled = state.isGenerating;

        footer.appendChild(delBtn);
        footer.appendChild(genBtn);
        info.appendChild(txt);
        info.appendChild(footer);

        card.appendChild(thumb);
        card.appendChild(info);
        els.storyboardGrid.appendChild(card);
    });
}

function moveScene(idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= state.currentProject.scenes.length) return;
    const temp = state.currentProject.scenes[idx];
    state.currentProject.scenes[idx] = state.currentProject.scenes[target];
    state.currentProject.scenes[target] = temp;
    renderStoryboard();
}

/**
 * INTEGRAÇÃO GEMINI API
 */
async function generateSceneVideo(sceneId) {
    if (!state.apiKey) return alert('Configure a API Key');
    
    const scene = state.currentProject.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    toggleLoading(true, "Gerando vídeo via Google Veo...");
    scene.status = 'generating';
    renderStoryboard();

    try {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const res = document.getElementById('resolution').value;
        const ratio = document.getElementById('aspect-ratio').value;

        // Inicia a geração do vídeo
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: scene.prompt,
            config: {
                numberOfVideos: 1,
                resolution: res,
                aspectRatio: ratio
            }
        });

        // Polling para conclusão
        while (!operation.done) {
            await new Promise(r => setTimeout(r, 8000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadUri) throw new Error("Erro na resposta da API");

        // Fetch do vídeo binário (CORS handle)
        const vidResponse = await fetch(`${downloadUri}&key=${state.apiKey}`);
        if (!vidResponse.ok) throw new Error("Falha ao baixar vídeo");
        
        const blob = await vidResponse.blob();
        scene.videoUrl = URL.createObjectURL(blob);
        scene.status = 'completed';
        
        // Ativar player principal com este vídeo
        els.previewVideo.src = scene.videoUrl;
        els.exportBtn.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        scene.status = 'failed';
        alert(`Erro: ${err.message}`);
    } finally {
        toggleLoading(false);
        renderStoryboard();
    }
}

/**
 * PERSISTÊNCIA E UTILITÁRIOS
 */
function saveCurrentProject() {
    const existingIdx = state.projects.findIndex(p => p.id === state.currentProject.id);
    const projectToSave = { ...state.currentProject, updatedAt: Date.now() };
    
    if (existingIdx > -1) {
        state.projects[existingIdx] = projectToSave;
    } else {
        state.projects.push(projectToSave);
    }
    
    localStorage.setItem('vinci_projects', JSON.stringify(state.projects));
    renderProjectList();
    alert('Projeto salvo localmente!');
}

function renderProjectList() {
    els.projectList.textContent = '';
    state.projects.sort((a,b) => b.updatedAt - a.updatedAt).forEach(p => {
        const item = document.createElement('div');
        item.style = "padding: 10px; border-bottom: 1px solid var(--border); cursor:pointer; font-size:0.8rem";
        item.textContent = p.name;
        item.onclick = () => {
            state.currentProject = p;
            els.projectNameInput.value = p.name;
            renderStoryboard();
        };
        els.projectList.appendChild(item);
    });
}

function updateApiStatus(text, className) {
    els.apiStatus.textContent = text;
    els.apiStatus.className = `api-status ${className}`;
}

function toggleLoading(show, text = "") {
    state.isGenerating = show;
    els.loadingIndicator.className = show ? "" : "hidden";
    els.loadingText.textContent = text;
}

function downloadProjectConfig() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.currentProject));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${state.currentProject.name.replace(/\s+/g, '_')}_config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Start
init();
