@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
  --primary: #2563eb;
  --bg: #050505;
  --border: rgba(255, 255, 255, 0.08);
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg);
  color: #f5f5f5;
  -webkit-font-smoothing: antialiased;
}

.gradient-text {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #737373;
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-item:hover, .nav-item.active {
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
}

.nav-item.active {
  color: #3b82f6;
  border-left: 3px solid #3b82f6;
  padding-left: 13px;
}

.animate-in {
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }

.hidden { display: none !important; }

button:disabled { opacity: 0.5; cursor: not-allowed; }

select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23444' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px;
}
