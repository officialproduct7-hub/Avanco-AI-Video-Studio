:root {
    --bg: #050505;
    --glass: rgba(255, 255, 255, 0.03);
    --border: rgba(255, 255, 255, 0.08);
    --primary: #6366f1;
    --accent: #a855f7;
    --danger: #ef4444;
    --text: #f8fafc;
    --text-dim: #94a3b8;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; height: 100vh; overflow: hidden; }

#app-container { display: flex; height: 100vh; }

.glass { background: var(--glass); backdrop-filter: blur(12px); border: 1px solid var(--border); }

/* Sidebar */
#sidebar { width: 320px; padding: 25px; display: flex; flex-direction: column; gap: 30px; }
.brand { display: flex; align-items: center; gap: 12px; }
.logo-icon { width: 42px; height: 42px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
.gradient-text { background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.5px; }

label { font-size: 0.7rem; text-transform: uppercase; font-weight: 900; color: var(--text-dim); display: block; margin-bottom: 8px; letter-spacing: 1px; }

/* Main Workspace */
#workspace { flex: 1; display: flex; flex-direction: column; }
header { height: 90px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }

#project-name { background: transparent; border: none; font-size: 1.4rem; font-weight: 800; color: white; outline: none; width: 300px; }
.project-settings { display: flex; gap: 10px; margin-top: 5px; }
select, input, textarea { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: white; border-radius: 8px; padding: 8px; font-size: 0.85rem; outline: none; }

.content-scroll { flex: 1; overflow-y: auto; padding: 40px; }
.max-width-wrapper { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }

/* Storyboard */
#storyboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.scene-card { border-radius: 20px; overflow: hidden; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.scene-card:hover { border-color: var(--primary); transform: translateY(-4px); }

.scene-media-preview { aspect-ratio: 16/9; background: #000; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.scene-media-preview video, .scene-media-preview img { width: 100%; height: 100%; object-fit: cover; }
.media-placeholder { opacity: 0.2; display: flex; flex-direction: column; align-items: center; gap: 10px; }

.scene-body { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.scene-prompt { width: 100%; height: 80px; resize: none; border-color: transparent; transition: 0.2s; }
.scene-prompt:focus { border-color: var(--primary); background: rgba(255,255,255,0.08); }

.media-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-upload { font-size: 0.7rem; padding: 8px; background: rgba(255,255,255,0.05); color: var(--text-dim); text-align: center; border-radius: 6px; cursor: pointer; border: 1px dashed var(--border); transition: 0.2s; }
.btn-upload:hover { border-color: var(--primary); color: white; }

/* Buttons */
button { cursor: pointer; border: none; border-radius: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
.btn-primary { background: var(--primary); color: white; padding: 12px 24px; }
.btn-accent { background: var(--accent); color: white; padding: 12px 28px; box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
.btn-primary-outline { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 10px 20px; }
.btn-primary-outline:hover { background: var(--primary); border-color: var(--primary); }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 8px; }
.btn-danger:hover { background: var(--danger); color: white; }
.btn-sm { padding: 6px 12px; font-size: 0.75rem; }

.hidden { display: none !important; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }

/* Render Player */
.player-wrapper { position: relative; aspect-ratio: 16/9; background: #000; border-radius: 18px; overflow: hidden; }
#subtitle-display { position: absolute; bottom: 10%; left: 0; width: 100%; text-align: center; pointer-events: none; }
#subtitle-display p { display: inline-block; background: rgba(0,0,0,0.8); color: white; padding: 6px 16px; border-radius: 8px; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1); }
