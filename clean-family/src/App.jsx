import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Home, Settings, Sparkles, Droplets, Moon, X,
  Timer, Baby, User, UserCheck, Play, Pause,
  Sofa, Shirt, Utensils, Zap, LogOut, ArrowRight, AlertTriangle, ShieldCheck, Wand2, Star
} from 'lucide-react';

// ========================================================
// 1. CONFIGURACIÓN - REEMPLAZA ESTO CON TUS DATOS DE FIREBASE
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyDJrf--Wmxd8lwu9vTuxl_0bk3GuSWz6SA",
  authDomain: "cleanfamily-web.firebaseapp.com",
  projectId: "cleanfamily-web",
  storageBucket: "cleanfamily-web.firebasestorage.app",
  messagingSenderId: "1067889035624",
  appId: "1:1067889035624:web:c1866800324474639baedd"
};
// ========================================================

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "cleanfamily-prod-v1";
const DEFAULT_HOUSE = "MI-CASA-FAMILIAR";

// --- CONSTANTES DE DISEÑO ---
const ROLES = [
  { id: 'dad', label: 'Papá', icon: <User className="w-8 h-8" />, color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { id: 'mom', label: 'Mamá', icon: <UserCheck className="w-8 h-8" />, color: 'bg-pink-500', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  { id: 'kid', label: 'Hijo', icon: <Baby className="w-8 h-8" />, color: 'bg-yellow-400', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
];

const ZONES = [
  { id: 'living', name: 'Sala', icon: <Sofa className="w-5 h-5" />, color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'kitchen', name: 'Cocina', icon: <Utensils className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'bathroom', name: 'Baño', icon: <Droplets className="w-5 h-5" />, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'bedroom', name: 'Cuarto', icon: <Moon className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'laundry', name: 'Ropa', icon: <Shirt className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'toys', name: 'Jugar', icon: <Sparkles className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
];

// PLAN FAMILIAR COMPLETO (22 TAREAS)
const FULL_FAMILY_PLAN = [
  { title: 'Guardar mis juguetes', zone: 'toys', points: 50, assignee: 'kid', kidFriendly: true, isVisitCritical: true },
  { title: 'Poner ropa sucia en el cesto', zone: 'bedroom', points: 20, assignee: 'kid', kidFriendly: true, isVisitCritical: true },
  { title: 'Hacer mi cama (estirar)', zone: 'bedroom', points: 30, assignee: 'kid', kidFriendly: true, isVisitCritical: false },
  { title: 'Poner servilletas en la mesa', zone: 'kitchen', points: 15, assignee: 'kid', kidFriendly: true, isVisitCritical: true },
  { title: 'Emparejar calcetines limpios', zone: 'laundry', points: 40, assignee: 'kid', kidFriendly: true, isVisitCritical: false },
  { title: 'Limpiar mesa baja (toallita)', zone: 'living', points: 25, assignee: 'kid', kidFriendly: true, isVisitCritical: true },
  { title: 'Ordenar zapatos entrada', zone: 'living', points: 20, assignee: 'kid', kidFriendly: true, isVisitCritical: true },
  { title: 'Cepillarme los dientes', zone: 'bathroom', points: 10, assignee: 'kid', kidFriendly: true, isVisitCritical: false },
  { title: 'Lavar platos / Lavavajillas', zone: 'kitchen', points: 40, assignee: 'dad', kidFriendly: false, isVisitCritical: true },
  { title: 'Sacar la basura', zone: 'kitchen', points: 20, assignee: 'dad', kidFriendly: false, isVisitCritical: true },
  { title: 'Limpiar encimeras', zone: 'kitchen', points: 25, assignee: 'dad', kidFriendly: false, isVisitCritical: true },
  { title: 'Limpiar nevera (dentro)', zone: 'kitchen', points: 70, assignee: 'dad', kidFriendly: false, isVisitCritical: false },
  { title: 'Poner lavadora y tender', zone: 'laundry', points: 50, assignee: 'dad', kidFriendly: false, isVisitCritical: false },
  { title: 'Doblar ropa limpia', zone: 'laundry', points: 60, assignee: 'dad', kidFriendly: false, isVisitCritical: false },
  { title: 'Limpieza profunda baños', zone: 'bathroom', points: 100, assignee: 'mom', kidFriendly: false, isVisitCritical: true },
  { title: 'Repasar inodoro y lavabo', zone: 'bathroom', points: 30, assignee: 'mom', kidFriendly: false, isVisitCritical: true },
  { title: 'Fregar suelos', zone: 'living', points: 80, assignee: 'mom', kidFriendly: false, isVisitCritical: true },
  { title: 'Barrer zona común', zone: 'living', points: 30, assignee: 'mom', kidFriendly: true, isVisitCritical: true },
  { title: 'Limpiar cristales', zone: 'living', points: 90, assignee: 'mom', kidFriendly: false, isVisitCritical: true },
  { title: 'Sacar el polvo muebles', zone: 'living', points: 40, assignee: 'mom', kidFriendly: true, isVisitCritical: true },
  { title: 'Cambiar sábanas', zone: 'bedroom', points: 60, assignee: 'mom', kidFriendly: false, isVisitCritical: false },
  { title: 'Ventilar la casa', zone: 'living', points: 10, assignee: 'all', kidFriendly: true, isVisitCritical: true },
];

// --- UTILIDADES ---
const safeStorage = {
  getItem: (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
  setItem: (key, value) => { try { localStorage.setItem(key, value); } catch (e) { } },
  removeItem: (key) => { try { localStorage.removeItem(key); } catch (e) { } }
};

// --- COMPONENTE: TEMPORIZADOR ---
const SpeedCleanTimer = ({ isActive, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0 && isActive) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-50 p-4 shadow-2xl animate-in slide-in-from-top duration-500">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full animate-pulse"><Timer className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Modo Visita Activo</p>
            <h3 className="text-2xl font-black tabular-nums leading-none">{formatTime(timeLeft)}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><X className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState({ points: 0, level: 1 });
  
  const [isVisitMode, setIsVisitMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [filterZone, setFilterZone] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', zone: 'living', points: 20, assignee: 'all', isVisitCritical: false, kidFriendly: true });

  // 1. Inicialización de Auth
  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    init();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // 2. Cargar Rol Guardado
  useEffect(() => {
    const saved = safeStorage.getItem('cleanfamily_role');
    if (saved) setSelectedRole(saved);
  }, []);

  // 3. Sincronización con Firestore
  useEffect(() => {
    if (!user || !selectedRole) return;

    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', `h_${DEFAULT_HOUSE}`);
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
    const unsubStats = onSnapshot(statsRef, (snap) => {
      if (snap.exists()) setUserStats(snap.data());
      else setDoc(statsRef, { points: 0, level: 1 });
    });

    return () => { unsubTasks(); unsubStats(); };
  }, [user, selectedRole]);

  // --- ACCIONES ---
  const handleJoin = (roleId) => {
    safeStorage.setItem('cleanfamily_role', roleId);
    setSelectedRole(roleId);
  };

  const handleLogout = () => {
    safeStorage.removeItem('cleanfamily_role');
    setSelectedRole(null);
    setTasks([]);
  };

  const seedFamilyPlan = async () => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', `h_${DEFAULT_HOUSE}`);
    try {
      const promises = FULL_FAMILY_PLAN.map(task => 
        addDoc(colRef, { ...task, completed: false, createdAt: serverTimestamp() })
      );
      await Promise.all(promises);
    } catch (e) { console.error(e); }
  };

  const toggleTask = async (task) => {
    if (!user) return;
    const taskRef = doc(db, 'artifacts', appId, 'public', 'data', `h_${DEFAULT_HOUSE}`, task.id);
    const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'stats');
    const isDone = !task.completed;

    try {
      await updateDoc(taskRef, { completed: isDone, completedBy: isDone ? selectedRole : null });
      if (isDone) {
        await updateDoc(statsRef, { 
          points: (userStats.points || 0) + (task.points || 10),
          level: Math.floor(((userStats.points || 0) + (task.points || 10)) / 500) + 1
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `h_${DEFAULT_HOUSE}`), {
        ...newTask, completed: false, createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewTask({ title: '', zone: 'living', points: 20, assignee: 'all', isVisitCritical: false, kidFriendly: true });
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (id) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', `h_${DEFAULT_HOUSE}`, id)); } catch(e) {}
  };

  // --- FILTRADO ---
  const visibleTasks = useMemo(() => {
    let list = tasks;
    if (isVisitMode) {
      list = list.filter(t => t.isVisitCritical || ['living', 'bathroom'].includes(t.zone));
      list = list.filter(t => !t.completed);
    } else {
      if (filterZone !== 'all') list = list.filter(t => t.zone === filterZone);
      if (selectedRole === 'kid') {
        list = list.filter(t => t.kidFriendly || t.assignee === 'kid' || t.assignee === 'all');
      }
    }
    return list.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  }, [tasks, isVisitMode, filterZone, selectedRole]);

  const activeRole = ROLES.find(r => r.id === selectedRole);

  // --- VISTAS ---
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Iniciando CleanFamily...</span>
    </div>
  );

  if (!selectedRole) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm space-y-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="inline-block p-4 rounded-[2rem] bg-indigo-600 mb-4 shadow-2xl shadow-indigo-500/20">
            <Home className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">CleanFamily</h1>
          <p className="text-slate-400 text-lg font-medium">¿Quién va a limpiar hoy?</p>
        </div>
        
        <div className="grid gap-4">
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => handleQuickJoin(role.id)}
              className="group flex items-center gap-4 p-5 rounded-[2rem] bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 hover:bg-slate-750 transition-all active:scale-95 text-left"
            >
              <div className={`p-4 rounded-2xl ${role.bg} ${role.text} transition-transform group-hover:scale-110`}>{role.icon}</div>
              <div className="flex-grow">
                <span className="block text-xl font-bold">{role.label}</span>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Acceso Instantáneo</span>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-32 transition-colors duration-700 ${isVisitMode ? 'bg-orange-50' : 'bg-slate-50'}`}>
      <SpeedCleanTimer isActive={isVisitMode} onClose={() => setIsVisitMode(false)} />
      
      {/* HEADER */}
      <header className={`px-6 pt-12 pb-8 rounded-b-[3rem] shadow-xl transition-all duration-500 ${isVisitMode ? 'bg-orange-600 text-white mt-16' : 'bg-white text-slate-900'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 opacity-60 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Hogar Seguro</span>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight">
              {isVisitMode ? '¡MODO VISITA!' : `Hola, ${activeRole?.label}`}
            </h1>
            {!isVisitMode && (
              <div className="flex items-center gap-3 mt-3">
                <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-100">
                  <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" /> {userStats.points || 0} XP
                </div>
                <div className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter">Nivel {userStats.level || 1}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className={`p-3 rounded-2xl shadow-sm ${isVisitMode ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 hover:text-red-500 transition-colors'}`}>
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {!isVisitMode && (
          <button 
            onClick={() => setIsVisitMode(true)} 
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 text-white p-5 rounded-3xl flex items-center justify-between shadow-xl shadow-orange-200 active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Zap className="w-6 h-6 fill-current" /></div>
              <div className="text-left">
                <span className="block font-black uppercase text-xs tracking-widest opacity-80">Botón de Pánico</span>
                <span className="block text-lg font-bold leading-none">¡Llega Visita!</span>
              </div>
            </div>
            <Play className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="px-6 mt-8">
        {!isVisitMode && (
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-4">
            <button 
              onClick={() => setFilterZone('all')} 
              className={`flex-shrink-0 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filterZone === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              Todo
            </button>
            {ZONES.map(z => (
              <button 
                key={z.id} 
                onClick={() => setFilterZone(z.id)} 
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${filterZone === z.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {z.icon} {z.name}
              </button>
            ))}
          </div>
        )}

        {/* LISTA DE MISIONES */}
        <div className="space-y-4 pb-12">
          {tasks.length === 0 ? (
            <div className="text-center py-16 px-8 animate-in fade-in slide-in-from-bottom-10">
              <div className="bg-indigo-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl shadow-indigo-100">
                <Wand2 className="w-12 h-12 text-indigo-500" />
              </div>
              <h3 className="font-black text-slate-800 text-2xl mb-2 tracking-tight">Tu Casa está Vacía</h3>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed max-w-xs mx-auto font-medium">
                Carga el Plan Familiar con 22 misiones diseñadas para que Papá, Mamá e Hijo trabajen en equipo.
              </p>
              <button 
                onClick={seedFamilyPlan} 
                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-indigo-300 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Cargar Plan Familiar
              </button>
            </div>
          ) : (
            <>
              {visibleTasks.length === 0 ? (
                <div className="text-center py-20 opacity-30 font-black text-slate-400 text-xs uppercase tracking-widest">
                  No hay misiones pendientes
                </div>
              ) : (
                visibleTasks.map(task => {
                  const zone = ZONES.find(z => z.id === task.zone) || ZONES[0];
                  const isKidView = selectedRole === 'kid';
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`relative group bg-white p-5 rounded-[2rem] flex items-center gap-5 transition-all border-2 shadow-sm ${task.completed ? 'opacity-40 border-transparent bg-slate-50 grayscale' : 'border-white hover:border-indigo-100'}`}
                    >
                      <button 
                        onClick={() => toggleTask(task)} 
                        className="flex-shrink-0 active:scale-75 transition-transform"
                      >
                        {task.completed ? (
                          <CheckCircle2 className={`w-12 h-12 ${isKidView ? 'text-yellow-400' : 'text-green-500'}`} />
                        ) : (
                          <Circle className={`w-12 h-12 text-slate-200 stroke-[1.5] ${isKidView ? 'w-14 h-14 text-slate-200' : ''}`} />
                        )}
                      </button>
                      
                      <div className="flex-grow min-w-0">
                        <h3 className={`font-black truncate ${isKidView ? 'text-xl text-slate-800' : 'text-base text-slate-700'} ${task.completed ? 'line-through text-slate-400 font-bold' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase border-2 ${zone.color}`}>
                            {zone.name}
                          </span>
                          {!task.completed && (
                            <span className="text-[10px] font-black text-indigo-500 ml-auto flex items-center gap-1 bg-indigo-50 px-3 py-0.5 rounded-full">
                              +{task.points || 10} XP
                            </span>
                          )}
                        </div>
                      </div>

                      {!isKidView && (
                        <button 
                          onClick={() => deleteTask(task.id)} 
                          className="p-2 text-slate-200 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </main>

      {/* BOTÓN FLOTANTE: AÑADIR */}
      {!isVisitMode && (
        <button 
          onClick={() => setIsAdding(true)} 
          className={`fixed bottom-10 right-8 w-20 h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40 border-4 border-white ${selectedRole === 'kid' ? 'bg-yellow-400 text-yellow-900 shadow-yellow-200' : 'bg-slate-900 text-white shadow-slate-300'}`}
        >
          <Plus className="w-10 h-10 stroke-[3]" />
        </button>
      )}

      {/* MODAL: NUEVA MISIÓN */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Nueva Misión</h2>
              <button onClick={() => setIsAdding(false)} className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">¿Qué hay que hacer?</label>
                <input 
                  type="text" required placeholder="Ej: Limpiar el horno..." autoFocus 
                  className="w-full px-6 py-5 bg-slate-50 border-none rounded-3xl font-black text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Zona</label>
                  <select 
                    className="w-full bg-slate-50 p-5 rounded-3xl font-black text-sm text-slate-700 outline-none appearance-none" 
                    value={newTask.zone} 
                    onChange={e => setNewTask({...newTask, zone: e.target.value})}
                  >
                    {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Asignar a</label>
                  <select 
                    className="w-full bg-slate-50 p-5 rounded-3xl font-black text-sm text-slate-700 outline-none appearance-none" 
                    value={newTask.assignee} 
                    onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                  >
                    <option value="all">Toda la Familia</option>
                    <option value="dad">Solo Papá</option>
                    <option value="mom">Solo Mamá</option>
                    <option value="kid">Solo el Hijo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                 <button 
                  type="button" 
                  onClick={() => setNewTask(p => ({...p, isVisitCritical: !p.isVisitCritical}))} 
                  className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-[2rem] border-4 transition-all ${newTask.isVisitCritical ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-50 bg-slate-50 text-slate-300'}`}
                 >
                    <Zap className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Prioridad Visita</span>
                 </button>
                 <button 
                  type="button" 
                  onClick={() => setNewTask(p => ({...p, kidFriendly: !p.kidFriendly}))} 
                  className={`flex-1 flex flex-col items-center gap-2 p-5 rounded-[2rem] border-4 transition-all ${newTask.kidFriendly ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-slate-50 bg-slate-50 text-slate-300'}`}
                 >
                    <Baby className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Apta para Niños</span>
                 </button>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all mt-4"
              >
                Crear Misión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}