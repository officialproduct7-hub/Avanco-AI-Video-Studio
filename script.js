
import { GoogleGenAI } from "@google/genai";

/**
 * AVANCO AI STUDIO v3.0 - VOICE MULTI-MASTER PATCH
 * Features: Reordenação de Galeria, Múltiplas Vozes IA com Preview, Render Master
 */

// --- ESTADO GLOBAL ---
const state = {
    apiKey: localStorage.getItem('GEMINI_API_KEY') || '',
    view: 'images',
    gallery: JSON.parse(localStorage.getItem('avanco_gallery_v2.7') || '[]'),
    storyboard: JSON.parse(localStorage.getItem('avanco_storyboard_v2.7') || '[]'),
    isProcessing: false,
    activeSceneIdForGallery: null,
    blobBuffer: new Map(),
    draggedItemIndex: null // Rastreador de drag
};

const VOICES = [
    { id: 'Zephyr', name: 'Zephyr (Suave/Amigável)' },
    { id: 'Puck', name: 'Puck (Jovem/Energético)' },
    { id: 'Charon', name: 'Charon (Narrador Profundo)' },
    { id: 'Kore', name: 'Kore (Sério/Profissional)' },
    { id: 'Fenrir', name: 'Fenrir (Firme/Autoridade)' }
];

// --- UTILITÁRIOS ---

function getFormattedDate() {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${YYYY}${MM}${DD}-${HH}${mm}${ss}`;
}

function toggleProcessing(val) {
    state.isProcessing = val;
    const loader = document.getElementById('global-loader');
    if (loader) {
        if (val) loader.classList.remove('hidden'); else loader.classList.add('hidden');
    }
    document.querySelectorAll('button').forEach(b => b.disabled = val);
}

// --- CONFIGURAÇÕES E API KEY ---

function initApiKeyModule() {
    const input = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('saveApiKeyBtn');
    const clearBtn = document.getElementById('clearApiKeyBtn');
    const statusEl = document.getElementById('apiKeyStatus');

    const updateStatus = () => {
        const key = (localStorage.getItem('GEMINI_API_KEY') || '').trim();
        if (key) {
            if (statusEl) {
                statusEl.textContent = "CHAVE ATIVA ✅";
                statusEl.className = "text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center pt-2";
            }
            if (input) input.value = key;
            state.apiKey = key;
        } else {
            if (statusEl) {
                statusEl.textContent = "CHAVE NÃO CONFIGURADA ×";
                statusEl.className = "text-[10px] font-bold text-red-400 uppercase tracking-widest text-center pt-2";
            }
            if (input) input.value = '';
            state.apiKey = '';
        }
    };

    if (saveBtn) {
        saveBtn.onclick = () => {
            const val = input ? input.value.trim() : '';
            if (!val) { alert("Insira uma chave válida."); return; }
            localStorage.setItem('GEMINI_API_KEY', val);
            updateStatus();
            alert("API Key salva e ativada!");
        };
    }

    if (clearBtn) {
        clearBtn.onclick = () => {
            localStorage.removeItem('GEMINI_API_KEY');
            updateStatus();
        };
    }

    updateStatus();
}

// --- NAVEGAÇÃO ---

window.showView = (viewName) => {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${viewName}`);
    if (navBtn) navBtn.classList.add('active');

    const titles = {
        'images': 'Imagens Flow',
        'storyboard': 'Storyboard',
        'render': 'Minha Galeria',
        'settings': 'Configurações'
    };
    
    const titleEl = document.getElementById('view-title');
    if (titleEl) titleEl.textContent = titles[viewName] || 'Avanco Studio';
    
    state.view = viewName;

    if (viewName === 'render') renderGallery();
    if (viewName === 'images') renderGallery(); 
    if (viewName === 'storyboard') renderStoryboard();
};

// --- MÓDULO IMAGENS FLOW & ESTOQUE ---

async function generateImageFlow() {
    if (!state.apiKey) {
        alert("Configure sua API Key primeiro na barra lateral!");
        showView('settings');
        return;
    }

    const promptInput = document.getElementById('imagePrompt');
    const prompt = promptInput ? promptInput.value.trim() : '';
    if (!prompt) { alert("Descreva a imagem que deseja gerar."); return; }

    toggleProcessing(true);

    try {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const modelName = 'gemini-2.5-flash-image';
        const style = document.getElementById('imageStyle').value;
        const ratio = document.getElementById('imageRatio').value;
        
        const response = await ai.models.generateContent({
            model: modelName,
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
    if (img) img.src = dataUrl;
    if (area) {
        area.classList.remove('hidden');
        area.scrollIntoView({ behavior: 'smooth' });
    }

    const saveBtn = document.getElementById('btn-save-to-gallery');
    if (saveBtn) {
        saveBtn.onclick = () => addToGallery(dataUrl, 'image');
    }
}

// --- SISTEMA DE UPLOAD ---

function handleFileUpload(input, type) {
    if (!input || !input.files) return;
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target.result;
        if (type === 'video') {
            const videoBlobUrl = URL.createObjectURL(file);
            state.blobBuffer.set(videoBlobUrl, file);
            addToGallery(videoBlobUrl, 'video', file.name);
        } else {
            addToGallery(result, 'image', file.name);
        }
        input.value = '';
    };
    reader.readAsDataURL(file);
}

function addToGallery(url, type, name = '') {
    const timestamp = getFormattedDate();
    const fileName = name || `avanco-${type}-${timestamp}`;
    const item = { 
        id: Date.now(), 
        url: url, 
        type: type, 
        name: fileName,
        createdAt: Date.now(),
        isLocal: url.startsWith('blob:') || url.length > 500000
    };

    state.gallery.unshift(item);
    saveGalleryState();
    renderGallery();
}

function saveGalleryState() {
    const persistent = state.gallery.map(item => {
        if (item.url.startsWith('blob:') || (item.url.length > 500000 && item.type === 'image')) {
            return { ...item, url: 'local_file_ref' };
        }
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

    state.gallery.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'gallery-card animate-in';
        card.setAttribute('draggable', true);
        
        // Eventos de Drag & Drop
        card.addEventListener('dragstart', (e) => {
            state.draggedItemIndex = index;
            setTimeout(() => card.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            state.draggedItemIndex = null;
            document.querySelectorAll('.gallery-card').forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (state.draggedItemIndex !== index) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            if (state.draggedItemIndex === null || state.draggedItemIndex === index) return;
            
            const items = [...state.gallery];
            const [movedItem] = items.splice(state.draggedItemIndex, 1);
            items.splice(index, 0, movedItem);
            
            state.gallery = items;
            saveGalleryState();
            renderGallery();
        });

        const isVideo = item.type === 'video';
        const isExpired = item.url === 'local_file_ref';
        
        card.innerHTML = `
            ${isVideo ? 
                `<div class="w-full h-full flex flex-col items-center justify-center bg-black pointer-events-none">
                    <i class="fa-solid fa-play text-blue-500 text-2xl mb-1"></i>
                    <span class="text-[7px] text-white/30 uppercase font-black">${isExpired ? 'Pendente' : 'Vídeo'}</span>
                </div>` : 
                (isExpired ? 
                    `<div class="w-full h-full flex flex-col items-center justify-center bg-neutral-900 pointer-events-none">
                        <i class="fa-solid fa-cloud-arrow-up text-neutral-700 text-xl mb-1"></i>
                        <span class="text-[6px] text-neutral-600 font-bold uppercase text-center px-4">Reenvie para baixar</span>
                    </div>` : 
                    `<img src="${item.url}" loading="lazy" class="pointer-events-none">`)
            }
            <div class="overlay">
                <p class="text-[8px] font-black uppercase text-white/80 truncate w-full text-center px-2">${item.name}</p>
                <div class="flex gap-2">
                    <button onclick="downloadMedia('${item.url}', '${item.name}', '${item.type}')" class="bg-blue-600 text-white p-2 rounded-lg text-xs hover:bg-blue-500 transition-all" title="Baixar"><i class="fa-solid fa-download"></i></button>
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

window.downloadMedia = async (url, name, type) => {
    if (url === 'local_file_ref') {
        alert("Este arquivo local expirou. Reenvie o arquivo no estoque.");
        return;
    }

    try {
        const timestamp = getFormattedDate();
        let fileName = name;
        if (!name.includes(timestamp)) {
            const ext = type === 'video' ? 'webm' : 'png';
            fileName = `avanco-${type}-${timestamp}.${ext}`;
        }

        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
        alert("Erro ao processar download.");
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
        voiceName: 'Kore',
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
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');

    state.storyboard.forEach((scene, index) => {
        const card = document.createElement('div');
        card.className = 'scene-card animate-in';
        card.innerHTML = `
            <div class="scene-main">
                <div class="scene-thumb" onclick="openGalleryForScene(${scene.id})">
                    <span class="badge">CENA ${index + 1}</span>
                    ${scene.image && scene.image !== 'local_file_ref' ? 
                        (scene.type === 'video' ? '<i class="fa-solid fa-play text-blue-500"></i>' : `<img src="${scene.image}">`) : 
                        '<div class="flex flex-col items-center gap-2 opacity-30"><i class="fa-solid fa-plus text-2xl"></i><span class="text-[8px] font-black uppercase">Vincular</span></div>'}
                </div>
                <div class="space-y-4">
                    <textarea oninput="updateSceneProp(${scene.id}, 'text', this.value)" class="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs focus:border-blue-500/50 outline-none resize-none h-20 transition-all text-white" placeholder="Texto da narração...">${scene.text || ''}</textarea>
                    
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-3">
                            <select onchange="updateSceneProp(${scene.id}, 'voiceName', this.value)" class="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none text-neutral-400 focus:text-white">
                                ${VOICES.map(v => `<option value="${v.id}" ${scene.voiceName === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}
                            </select>
                            <button onclick="previewVoiceSample('${scene.id}')" class="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-blue-400 hover:text-white transition-all" title="Ouvir amostra">
                                <i class="fa-solid fa-volume-high"></i>
                            </button>
                            <button onclick="generateSceneVoiceOver(${scene.id})" class="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap">
                                <i class="fa-solid fa-microphone-lines mr-1"></i> Gerar Voz IA
                            </button>
                        </div>
                        
                        <div class="audio-controls">
                            ${scene.audioUrl ? `
                                <button onclick="previewAudio('${scene.audioUrl}')" class="toggle-btn active flex items-center gap-2">
                                    <i class="fa-solid fa-play"></i> Ouvir Voz IA
                                </button>
                            ` : `
                                <span class="text-[8px] text-neutral-600 font-black uppercase px-2 italic">Aguardando geração de voz...</span>
                            `}
                            <button onclick="toggleSceneSubtitle(${scene.id})" class="toggle-btn ${scene.subtitleEnabled ? 'active' : ''} ml-auto">Legenda: ${scene.subtitleEnabled ? 'ON' : 'OFF'}</button>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col gap-2 justify-between">
                    <div class="space-y-1">
                        <label class="text-[8px] uppercase font-black text-neutral-600 tracking-tighter">Tempo (s):</label>
                        <input type="number" value="${scene.duration}" onchange="updateSceneProp(${scene.id}, 'duration', parseFloat(this.value))" class="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs w-full outline-none font-bold text-white">
                    </div>
                    <button onclick="removeScene(${scene.id})" class="text-neutral-700 hover:text-red-500 p-2 text-right transition-colors"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

window.previewVoiceSample = async (id) => {
    const scene = state.storyboard.find(s => s.id == id);
    if (!scene) return;
    const voiceName = scene.voiceName || 'Kore';
    
    if (!state.apiKey) { alert("API Key necessária."); return; }

    try {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Esta é uma prévia da voz ${voiceName}.` }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName } }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audio.play();
        }
    } catch (e) {
        console.error(e);
    }
};

window.generateSceneVoiceOver = async (id) => {
    const scene = state.storyboard.find(s => s.id === id);
    if (!scene || !scene.text.trim()) {
        alert("Insira um texto para a narração primeiro.");
        return;
    }
    if (!state.apiKey) {
        alert("API Key necessária.");
        return;
    }

    toggleProcessing(true);
    try {
        const ai = new GoogleGenAI({ apiKey: state.apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Diga com naturalidade e clareza: ${scene.text}` }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: scene.voiceName || 'Kore' }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            scene.audioUrl = `data:audio/wav;base64,${base64Audio}`;
            saveStoryboard();
            renderStoryboard();
        } else {
            throw new Error("Não foi possível gerar o áudio.");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao gerar voz: " + err.message);
    } finally {
        toggleProcessing(false);
    }
};

window.previewAudio = (url) => {
    const audio = new Audio(url);
    audio.play();
};

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
    if (!grid || !modal) return;
    grid.innerHTML = '';

    if (state.gallery.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-10 text-center text-neutral-600 text-[10px] font-black uppercase">O Estoque está vazio</div>';
    } else {
        state.gallery.forEach(img => {
            const div = document.createElement('div');
            div.className = 'gallery-card group relative';
            div.onclick = () => selectGalleryImageForScene(img.url, img.type);
            div.innerHTML = `
                ${img.type === 'video' ? `<div class="w-full h-full flex items-center justify-center bg-black"><i class="fa-solid fa-play text-blue-500"></i></div>` : `<img src="${img.url}">`}
                <div class="overlay opacity-0 group-hover:opacity-100 flex items-center justify-center"><i class="fa-solid fa-link text-white text-xl"></i></div>
            `;
            grid.appendChild(div);
        });
    }
    modal.classList.remove('hidden');
};

window.closeGalleryModal = () => { 
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.add('hidden'); 
};

function selectGalleryImageForScene(url, type) {
    const scene = state.storyboard.find(s => s.id === state.activeSceneIdForGallery);
    if (scene) {
        if (url === 'local_file_ref') { alert("Arquivo expirado."); return; }
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

    if (!canvas || !ctx) return;

    canvas.width = ratio === '16:9' ? 1280 : 720;
    canvas.height = ratio === '16:9' ? 720 : 1280;

    if (overlay) overlay.classList.remove('hidden');
    if (doneArea) doneArea.classList.add('hidden');
    toggleProcessing(true);

    try {
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const downloadBtn = document.getElementById('downloadVideoBtn');
            const timestamp = getFormattedDate();
            
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `avanco-video-${timestamp}.webm`;
                    a.click();
                };
            }

            if (overlay) overlay.classList.add('hidden');
            if (doneArea) doneArea.classList.remove('hidden');
            toggleProcessing(false);
            addToGallery(url, 'video', `avanco-render-${timestamp}`);
        };

        mediaRecorder.start();

        for (const scene of state.storyboard) {
            const frameDuration = scene.duration * 1000;
            const startTime = Date.now();

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

            // Toca Voz IA se gerada, senão usa Fallback SpeechSynthesis
            if (scene.audioUrl) {
                const audio = new Audio(scene.audioUrl);
                audio.play();
            } else if (scene.text) {
                const utt = new SpeechSynthesisUtterance(scene.text);
                utt.lang = 'pt-BR';
                window.speechSynthesis.speak(utt);
            }

            while (Date.now() - startTime < frameDuration) {
                ctx.fillStyle = "#000";
                ctx.fillRect(0,0, canvas.width, canvas.height);
                
                const cw = canvas.width; const ch = canvas.height;
                const mw = (scene.type === 'video') ? media.videoWidth : media.width;
                const mh = (scene.type === 'video') ? media.videoHeight : media.height;
                const s = Math.max(cw/mw, ch/mh);
                ctx.drawImage(media, (cw - mw*s)/2, (ch - mh*s)/2, mw*s, mh*s);

                if (scene.subtitleEnabled && scene.text) {
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(50, ch-100, cw-100, 60);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px Inter';
                    ctx.textAlign = 'center';
                    ctx.fillText(scene.text, cw/2, ch-60);
                }
                await new Promise(r => requestAnimationFrame(r));
            }
            window.speechSynthesis.cancel();
        }
        mediaRecorder.stop();
    } catch (e) {
        console.error(e);
        if (overlay) overlay.classList.add('hidden');
        toggleProcessing(false);
    }
}

// --- UTILITÁRIOS GLOBAIS ---

window.setSceneAudioType = (id, type) => {
    const scene = state.storyboard.find(s => s.id === id);
    if (scene) { scene.audioType = type; saveStoryboard(); renderStoryboard(); }
};

window.toggleSceneSubtitle = (id) => {
    const scene = state.storyboard.find(s => s.id === id);
    if (scene) { scene.subtitleEnabled = !scene.subtitleEnabled; saveStoryboard(); renderStoryboard(); }
};

window.clearAllData = () => {
    if (confirm("Resetar sistema?")) { localStorage.clear(); location.reload(); }
};

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    initApiKeyModule();
    showView('images');

    const genBtn = document.getElementById('generateImageBtn');
    if (genBtn) genBtn.onclick = generateImageFlow;

    const renderBtn = document.getElementById('startRenderBtn');
    if (renderBtn) renderBtn.onclick = startRender;

    const imgInp = document.getElementById('imageUploadInput');
    const imgInpGal = document.getElementById('imageUploadInputGal');
    const vidInpGal = document.getElementById('videoUploadInputGal');

    if (imgInp) imgInp.onchange = (e) => handleFileUpload(e.target, 'image');
    if (imgInpGal) imgInpGal.onchange = (e) => handleFileUpload(e.target, 'image');
    if (vidInpGal) vidInpGal.onchange = (e) => handleFileUpload(e.target, 'video');
});
