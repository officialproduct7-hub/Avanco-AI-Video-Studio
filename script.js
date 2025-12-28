:root {
    --bg: #050505;
    --glass: rgba(255, 255, 255, 0.03);
    --border: rgba(255, 255, 255, 0.08);
    --primary: #6366f1;
    --accent: #a855f7;
    --danger: #ef4444;
    --text: #f8fafc;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow: hidden; height: 100vh; }

#app-container { display: flex; height: 100vh; }

.glass { background: var(--glass); backdrop-filter: blur(12px); border: 1px solid var(--border); }

/* Sidebar */
#sidebar { width: 320px; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.logo-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px var(--primary); }
.gradient-text { background: linear-gradient(to right, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1.5rem; }

.section-box { display: flex; flex-direction: column; gap: 10px; }
.section-box label { font-size: 0.7rem; text-transform: uppercase; font-weight: 900; color: #555; }

/* Inputs */
input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; color: white; padding: 10px; font-size: 0.9rem; outline: none; }
input:focus, textarea:focus { border-color: var(--primary); }
textarea { resize: none; width: 100%; height: 100px; }

.input-group { display: flex; gap: 5px; }
.api-status { font-size: 0.7rem; font-weight: bold; }
.status-ok { color: #22c55e; }
.status-err { color: var(--danger); }

/* Workspace */
#workspace { flex: 1; display: flex; flex-direction: column; }
header { height: 80px; padding: 0 30px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
.project-header { display: flex; flex-direction: column; gap: 5px; }
#project-name-input { background: transparent; border: none; font-size: 1.2rem; font-weight: 700; width: 300px; padding: 0; }
.duration-selector { display: flex; gap: 15px; font-size: 0.8rem; font-weight: 600; color: #777; }

.content-scroll { flex: 1; overflow-y: auto; padding: 30px; }
.max-width-wrapper { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px; }

/* Video Player */
.video-card { border-radius: 20px; overflow: hidden; }
.video-container { aspect-ratio: 16/9; background: black; position: relative; }
video { width: 100%; height: 100%; object-fit: contain; }
#subtitle-overlay { position: absolute; bottom: 10%; width: 100%; text-align: center; pointer-events: none; }
#subtitle-overlay p { display: inline-block; background: rgba(0,0,0,0.8); padding: 5px 15px; border-radius: 5px; font-size: 0.9rem; }

.export-bar { padding: 15px; display: flex; gap: 10px; border-top: 1px solid var(--border); }

/* Storyboard */
.storyboard-list { display: flex; flex-direction: column; gap: 15px; }
.scene-item { display: flex; gap: 20px; padding: 20px; border-radius: 15px; background: rgba(255,255,255,0.02); transition: 0.2s; position: relative; }
.scene-item:hover { background: rgba(255,255,255,0.05); }

.scene-num { width: 30px; height: 30px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; }
.scene-content { flex: 1; }
.scene-actions { display: flex; flex-direction: column; gap: 10px; }

.add-scene-box { padding: 20px; border-radius: 15px; display: flex; flex-direction: column; gap: 15px; }
.audio-options { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }

/* Buttons */
button { cursor: pointer; border: none; border-radius: 8px; font-weight: 700; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
.btn-primary { background: var(--primary); color: white; padding: 10px 20px; }
.btn-primary:hover { filter: brightness(1.2); }
.btn-accent { background: var(--accent); color: white; padding: 12px 25px; }
.btn-primary-outline { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 10px 20px; }
.btn-icon { width: 35px; height: 35px; justify-content: center; }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
.btn-danger:hover { background: var(--danger); color: white; }

.hidden { display: none !important; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
