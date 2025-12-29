import { GoogleGenAI } from "https://esm.run/@google/genai";
/**
 * AVANCO AI STUDIO v2.7 - MASTER PATCH
 * Core Features: Imagem IA, Upload (Híbrido), Download Master, Persistência Metadados
 */

// --- ESTADO GLOBAL ---
const state = {
    apiKey: localStorage.getItem('GEMINI_API_KEY') || '',
    view: 'images',
    // O estoque armazena objetos { id, url, type, name, size }
    gallery: JSON.parse(localStorage.getItem('avanco_gallery_v2.7') || '[]'),
    storyboard: JSON.parse(localStorage.getItem('avanco_storyboard_v2.7') || '[]'),
    isProcessing: false,
    activeSceneIdForGallery: null,
    // Buffer para blobs locais que não persistem em string no localStorage
    blobBuffer: new Map()
};

// --- CONFIGURAÇÕES E API KEY ---

function initApiKeyModule() {
    const input = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('saveApiKeyBtn');
    const clearBtn = document.getElementById('clearApiKeyBtn');
    const statusEl = document.getElementById('apiKeyStatus');

    const updateStatus = () => {
        const key = (localStorage.getItem('GEMINI_API_KEY') || '').trim();
        if (key) {
            statusEl.textContent = "CHAVE ATIVA ✅";
            statusEl.className = "text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center pt-2";
            input.value = key;
            state.apiKey = key;
        } else {
            statusEl.textContent = "CHAVE NÃO CONFIGURADA ×";
            statusEl.className = "text-[10px] font-bold text-red-400 uppercase tracking-widest text-center pt-2";
            input.value = '';
            state.apiKey = '';
        }
    };

    saveBtn.onclick = () => {
        const val = input.value.trim();
        if (!val) { alert("Insira uma chave válida."); return; }
        localStorage.setItem('GEMINI_API_KEY', val);
        updateStatus();
        alert("API Key salva e ativada!");
    };

    clearBtn.onclick = () => {
        localStorage.removeItem('GEMINI_API_KEY');
        updateStatus();
    };

    updateStatus();
}

// --- NAVEGAÇÃO ---

window.showView = (viewName) => {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`nav-${viewName}`)?.classList.add('active');

    const titles = {
        'images': 'Imagens Flow',
        'storyboard': 'Storyboard',
        'render': 'Minha Galeria',
        'settings': 'Configurações'
    };
    
    const titleEl = document.getElementById('view-title');
    if (titleEl) titleEl.textContent = titles[viewName];
    
    state.view = viewName;

    if (viewName === 'render') renderGallery();
    if (viewName === 'storyboard') renderStoryboard();
    if (viewName === 'images') renderGallery(); // Mostra prévia do estoque na tela de criação
};

// --- MÓDULO IMAGENS FLOW & ESTOQUE ---

async function generateImageFlow() {
    if (!state.apiKey) {
        alert("Configure sua API Key primeiro na barra lateral!");
        showView('settings');
        return;
    }

    const promptInput = document.getElementById('imagePrompt');
    const prompt = promptInput.value.trim();
    if (!prompt) { alert("Descreva a imagem que deseja gerar."); return; }

    toggleProcessing(true);

    try {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const model = 'gemini-2.5-flash-image';
        const style = document.getElementById('imageStyle').value;
        const ratio = document.getElementById('imageRatio').value;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: `High quality cinematic ${style}, ${prompt}` }] },
            config: { imageConfig: { aspectRatio: ratio } }
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!part) throw new Error("A IA não retornou dados de imagem.");
        
        const imageData = `data:image/png;base64,${part.inlineData.data}`;
        displayImageResult(imageData);

    } catch (err) {
        console.error(err);
        alert("Erro na API: " + err.message);
    } finally {
        toggleProcessing(false);
    }
}

function displayImageResult(dataUrl) {
    const area = document.getElementById('image-result-area');
    const img = document.getElementById('image-preview');
    img.src = dataUrl;
    area.classList.remove('hidden');
    area.scrollIntoView({ behavior: 'smooth' });

    const saveBtn = document.getElementById('btn-save-to-gallery');
    saveBtn.onclick = () => addToGallery(dataUrl, 'image');
}

// --- SISTEMA DE UPLOAD ---

function handleFileUpload(input, type) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024 && type === 'image') {
        alert("Imagem muito grande. Limite 10MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const url = e.target.result;
        // Se for vídeo, URL.createObjectURL é melhor que dataURL para o player
        if (type === 'video') {
            const videoBlobUrl = URL.createObjectURL(file);
            state.blobBuffer.set(videoBlobUrl, file);
            addToGallery(videoBlobUrl, 'video', file.name);
        } else {
            addToGallery(url, 'image', file.name);
        }
        input.value = '';
    };
    reader.readAsDataURL(file);
}

function addToGallery(url, type, name = '') {
    const fileName = name || `avanco-${type}-${Date.now()}`;
    const item = { 
        id: Date.now(), 
        url: url, 
        type: type, 
        name: fileName,
        isLocal: url.startsWith('blob:') 
    };

    state.gallery.unshift(item);
    saveGalleryState();
    renderGallery();
    
    // Se estiver no modal de seleção, refresca o modal também
    if (!document.getElementById('gallery-modal').classList.contains('hidden')) {
        openGalleryForScene(state.activeSceneIdForGallery);
    }
}

function saveGalleryState() {
    // Filtramos blobs locais da persistência direta para não quebrar o localStorage
    const persistent = state.gallery.map(item => {
        if (item.url.startsWith('blob:')) return { ...item, url: 'local_file_ref' };
        return item;
    });
    localStorage.setItem('avanco_gallery_v2.7', JSON.stringify(persistent));
}

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (state.gallery.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-10 text-center text-neutral-800 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-3xl">Acervo Vazio</div>';
        return;
    }

    state.gallery.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card animate-in';
        const isVideo = item.type === 'video';
        
        card.innerHTML = `
            ${isVideo ? `<div class="w-full h-full flex items-center justify-center bg-black"><i class="fa-solid fa-play text-indigo-500 text-2xl"></i></div>` : `<img src="${item.url}" loading="lazy">`}
            <div class="overlay">
                <p class="text-[8px] font-black uppercase text-white/50 truncate w-full text-center">${item.name}</p>
                <div class="flex gap-2">
                    <button onclick="downloadMedia('${item.url}', '${item.name}', '${item.type}')" class="bg-blue-600/20 text-blue-400 p-2 rounded-lg text-xs hover:bg-blue-600 hover:text-white transition-all"><i class="fa-solid fa-download"></i></button>
                    <button onclick="deleteFromGallery(${item.id})" class="bg-red-500/20 text-red-500 p-2 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-all"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.deleteFromGallery = (id) => {
    state.gallery = state.gallery.filter(g => g.id !== id);
    saveGalleryState();
    renderGallery();
};

// --- SISTEMA DE DOWNLOAD ---

window.downloadMedia = async (url, name, type) => {
    if (url === 'local_file_ref') {
        alert("Este arquivo local expirou. Faça o upload novamente.");
        return;
    }

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        const ext = type === 'video' ? 'mp4' : 'png';
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        a.href = blobUrl;
        a.download = `avanco-${type}-${dateStr}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        alert("Erro ao baixar arquivo.");
    }
};

// --- STORYBOARD ---

window.addStoryboardScene = (imgUrl = '') => {
    const scene = {
        id: Date.now(),
        image: imgUrl,
        type: 'image',
        text: '',
        duration: 4,
        audioType: 'tts',
        audioUrl: '',
        subtitleEnabled: true
    };
    state.storyboard.push(scene);
    saveStoryboard();
    renderStoryboard();
};

function saveStoryboard() {
    localStorage.setItem('avanco_storyboard_v2.7', JSON.stringify(state.storyboard));
}

function renderStoryboard() {
    const list = document.getElementById('storyboard-list');
    const empty = document.getElementById('storyboard-empty');
    if (!list) return;
    list.innerHTML = '';

    if (state.storyboard.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    state.storyboard.forEach((scene, index) => {
        const card = document.createElement('div');
        card.className = 'scene-card animate-in';
        card.innerHTML = `
            <div class="scene-main">
                <div class="scene-thumb" onclick="openGalleryForScene(${scene.id})">
                    <span class="badge">CENA ${index + 1}</span>
                    ${scene.image ? (scene.type === 'video' ? '<i class="fa-solid fa-play text-indigo-500"></i>' : `<img src="${scene.image}">`) : '<div class="flex flex-col items-center gap-2 opacity-30"><i class="fa-solid fa-plus text-2xl"></i><span class="text-[8px] font-black uppercase">Vincular</span></div>'}
                </div>
                <div class="space-y-4">
                    <textarea oninput="updateSceneProp(${scene.id}, 'text', this.value)" class="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs focus:border-blue-500/50 outline-none resize-none h-20 transition-all" placeholder="Texto da narração...">${scene.text || ''}</textarea>
                    <div class="audio-controls">
                        <button onclick="setSceneAudioType(${scene.id}, 'tts')" class="toggle-btn ${scene.audioType === 'tts' ? 'active' : ''}">Voz IA</button>
                        <button onclick="toggleSceneSubtitle(${scene.id})" class="toggle-btn ${scene.subtitleEnabled ? 'active' : ''}">Legenda: ${scene.subtitleEnabled ? 'ON' : 'OFF'}</button>
                    </div>
                </div>
                <div class="flex flex-col gap-2 justify-between">
                    <div class="space-y-1">
                        <label class="text-[8px] uppercase font-black text-neutral-600 tracking-tighter">Tempo (s):</label>
                        <input type="number" value="${scene.duration}" onchange="updateSceneProp(${scene.id}, 'duration', parseFloat(this.value))" class="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs w-full outline-none font-bold">
                    </div>
                    <button onclick="removeScene(${scene.id})" class="text-neutral-700 hover:text-red-500 p-2 text-right transition-colors"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

window.updateSceneProp = (id, prop, val) => {
    const scene = state.storyboard.find(s => s.id === id);
    if (scene) { scene[prop] = val; saveStoryboard(); }
};

window.removeScene = (id) => {
    state.storyboard = state.storyboard.filter(s => s.id !== id);
    saveStoryboard();
    renderStoryboard();
};

window.openGalleryForScene = (id) => {
    state.activeSceneIdForGallery = id;
    const modal = document.getElementById('gallery-modal');
    const grid = document.getElementById('modal-grid');
    grid.innerHTML = '';

    if (state.gallery.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-10 text-center text-neutral-600 text-[10px] font-black uppercase">O Estoque está vazio</div>';
    } else {
        state.gallery.forEach(img => {
            const div = document.createElement('div');
            div.className = 'gallery-card group relative';
            div.onclick = () => selectGalleryImageForScene(img.url, img.type);
            div.innerHTML = `
                ${img.type === 'video' ? `<div class="w-full h-full flex items-center justify-center bg-black"><i class="fa-solid fa-play text-indigo-500"></i></div>` : `<img src="${img.url}">`}
                <div class="overlay opacity-0 group-hover:opacity-100 flex items-center justify-center"><i class="fa-solid fa-link text-white text-xl"></i></div>
            `;
            grid.appendChild(div);
        });
    }
    modal.classList.remove('hidden');
};

window.closeGalleryModal = () => { document.getElementById('gallery-modal').classList.add('hidden'); };

function selectGalleryImageForScene(url, type) {
    const scene = state.storyboard.find(s => s.id === state.activeSceneIdForGallery);
    if (scene) {
        if (url === 'local_file_ref') { alert("Arquivo expirado. Re-envie no estoque."); return; }
        scene.image = url;
        scene.type = type;
        saveStoryboard();
        renderStoryboard();
        closeGalleryModal();
    }
}

// --- RENDERIZAÇÃO MASTER ---

async function startRender() {
    if (state.storyboard.length === 0) { alert("Adicione cenas."); return; }
    
    const canvas = document.getElementById('renderCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('render-overlay');
    const doneArea = document.getElementById('render-done');
    const ratio = document.getElementById('renderRatio').value;

    canvas.width = ratio === '16:9' ? 1280 : 720;
    canvas.height = ratio === '16:9' ? 720 : 1280;

    overlay.classList.remove('hidden');
    doneArea.classList.add('hidden');
    toggleProcessing(true);

    try {
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            document.getElementById('downloadVideoBtn').onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = `avanco-master-${Date.now()}.webm`;
                a.click();
            };
            overlay.classList.add('hidden');
            doneArea.classList.remove('hidden');
            toggleProcessing(false);
        };

        mediaRecorder.start();

        for (const scene of state.storyboard) {
            const frameDuration = scene.duration * 1000;
            const startTime = Date.now();

            // Setup mídia (Imagem ou Vídeo)
            let media;
            if (scene.type === 'video') {
                media = document.createElement('video');
                media.src = scene.image;
                media.muted = true;
                media.play();
            } else {
                media = new Image();
                media.src = scene.image;
            }
            await new Promise(r => {
                if (scene.type === 'video') media.oncanplay = r;
                else media.onload = r;
            });

            // Narração (TTS Simples)
            if (scene.audioType === 'tts' && scene.text) {
                const utt = new SpeechSynthesisUtterance(scene.text);
                utt.lang = 'pt-BR';
                window.speechSynthesis.speak(utt);
            }

            while (Date.now() - startTime < frameDuration) {
                ctx.fillStyle = "#000";
                ctx.fillRect(0,0, canvas.width, canvas.height);
                
                // Desenha mídia centralizada
                const cw = canvas.width; const ch = canvas.height;
                const mw = (scene.type === 'video') ? media.videoWidth : media.width;
                const mh = (scene.type === 'video') ? media.videoHeight : media.height;
                const s = Math.max(cw/mw, ch/mh);
                ctx.drawImage(media, (cw - mw*s)/2, (ch - mh*s)/2, mw*s, mh*s);

                // Legenda
                if (scene.subtitleEnabled && scene.text) {
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(50, ch-100, cw-100, 60);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 20px Inter';
                    ctx.textAlign = 'center';
                    ctx.fillText(scene.text, cw/2, ch-65);
                }
                await new Promise(r => requestAnimationFrame(r));
            }
            window.speechSynthesis.cancel();
        }
        mediaRecorder.stop();
    } catch (e) {
        console.error(e);
        overlay.classList.add('hidden');
        toggleProcessing(false);
    }
}

// --- UTILITÁRIOS ---

function toggleProcessing(val) {
    state.isProcessing = val;
    const loader = document.getElementById('global-loader');
    if (val) loader.classList.remove('hidden'); else loader.classList.add('hidden');
    document.querySelectorAll('button').forEach(b => b.disabled = val);
}

window.clearAllData = () => {
    if (confirm("Resetar sistema? Isso limpará o estoque e projetos.")) {
        localStorage.clear();
        location.reload();
    }
};

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    initApiKeyModule();
    showView('images');

    // Handlers de Geração e Render
    const genBtn = document.getElementById('generateImageBtn');
    if (genBtn) genBtn.onclick = generateImageFlow;

    const renderBtn = document.getElementById('startRenderBtn');
    if (renderBtn) renderBtn.onclick = startRender;

    // Handlers de Upload
    document.getElementById('imageUploadInput').onchange = (e) => handleFileUpload(e.target, 'image');
    document.getElementById('imageUploadInputGal').onchange = (e) => handleFileUpload(e.target, 'image');
    document.getElementById('videoUploadInputGal').onchange = (e) => handleFileUpload(e.target, 'video');
});