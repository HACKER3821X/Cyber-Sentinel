import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
} from "recharts";

import {
  Shield,
  Activity,
  AlertTriangle,
  Ban,
  LayoutDashboard,
  FileWarning,
  BarChart3,
  LogOut,
  User,
  Lock,
  Mail,
  Cpu,
  Globe,
  Terminal as TerminalIcon,
  Wifi,
  Server,
  Skull,
  Eye,
  RefreshCw,
  Clock
} from "lucide-react";

import NetworkBackground from "./components/NetworkBackground";

export default function App() {
  // =========================
  // AUTH STATES
  // =========================
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // DASHBOARD STATES
  // =========================
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [blockedIps, setBlockedIps] = useState([]);
  const [threatLevel, setThreatLevel] = useState("SAFE"); // SAFE, ELEVATED, CRITICAL
  const [terminalLogs, setTerminalLogs] = useState([
    "SECURE SYSTEM HANDSHAKE INITIATED...",
    "IP RESOLUTION MODULE ONLINE.",
    "FIREWALL STATUS: ENGAGED [PORT 5000]",
    "SYSTEM STATUS: PENDING USER AUTHENTICATION...",
  ]);

  // =========================
  // TERMINAL SIMULATION FOR LOGIN
  // =========================
  useEffect(() => {
    if (isAuthenticated) return;
    const phrases = [
      "Interceptors active on port 5000...",
      "Analyzing socket connection channels...",
      "Decrypting incoming routing vectors...",
      "Local MongoDB: Connected (v7.0)",
      "Local Redis cache: Listening on port 6379...",
      "Handshake: Success. Awaiting credential verification...",
      "Warning: Port scan activity detected from network subnet...",
      "Signature databases synchronized...",
    ];
    const interval = setInterval(() => {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      const timestamp = new Date().toLocaleTimeString();
      setTerminalLogs((prev) => [
        `[${timestamp}] ${randomPhrase}`,
        ...prev.slice(0, 8),
      ]);
    }, 2800);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // =========================
  // CHECK TOKEN
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // =========================
  // FETCH LOGS
  // =========================
  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/logs");
      const fetchedLogs = res.data.logs || [];
      setLogs(fetchedLogs);
      
      // Update real-time threat level based on attacks in the last logs
      const recentAttacks = fetchedLogs.slice(0, 10).filter(log => log.attack).length;
      if (recentAttacks > 4) setThreatLevel("CRITICAL");
      else if (recentAttacks > 0) setThreatLevel("ELEVATED");
      else setThreatLevel("SAFE");
    } catch (err) {
      console.log("Error fetching logs:", err);
    }
  };

  // =========================
  // FETCH ANALYTICS
  // =========================
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/stats");
      setStats(res.data);
    } catch (err) {
      console.log("Error fetching stats:", err);
    }
  };

  // =========================
  // FETCH BLOCKED IPS
  // =========================
  const fetchBlockedIps = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/blocked-ips");
      setBlockedIps(res.data.blocked || []);
    } catch (err) {
      console.log("Error fetching blocked IPs:", err);
    }
  };

  // =========================
  // SOCKET REALTIME
  // =========================
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchLogs();
    fetchStats();
    fetchBlockedIps();

    const newSocket = io("http://localhost:5000");

    newSocket.on("new_log", (newLog) => {
      setLogs((prev) => [newLog, ...prev]);
      
      // Flash threat level
      if (newLog.attack) {
        setThreatLevel("CRITICAL");
        // Trigger temporary UI alert
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSVvT18=");
        audio.volume = 0.2;
        audio.play().catch(() => {}); // catch autoplay blocks
      }
    });

    // Auto-refresh stats and blocked list periodically
    const pollInterval = setInterval(() => {
      fetchStats();
      fetchBlockedIps();
    }, 8000);

    return () => {
      newSocket.disconnect();
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setIsAuthenticated(true);
    } catch (err) {
      alert("INVALID CREDENTIALS. GATEWAY ACCESS DENIED.");
      console.log(err);
    }
  };

  // =========================
  // SIGNUP
  // =========================
  const handleSignup = async () => {
    try {
      await axios.post("http://localhost:5000/api/signup", {
        name,
        email,
        password,
      });
      alert("ACCOUNT CREATED. PROCEEDING TO GATEWAY.");
      setIsLogin(true);
    } catch (err) {
      alert("REGISTRATION FAILURE. VERIFY SYSTEM POLICIES.");
      console.log(err);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setPage("dashboard");
  };

  // =========================
  // SIDEBAR NAVIGATION
  // =========================
  const handlePageChange = async (pageName) => {
    setPage(pageName);
    if (pageName === "dashboard" || pageName === "logs") {
      await fetchLogs();
    }
    if (pageName === "analytics") {
      await fetchStats();
    }
    if (pageName === "blocked") {
      await fetchBlockedIps();
    }
  };

  // =========================
  // CALCULATE STATS FROM STATE
  // =========================
  const totalRequests = logs.length;
  const attackRequests = logs.filter((log) => log.attack).length;
  const safeRequests = totalRequests - attackRequests;
  const blockedCount = blockedIps.length;

  // Chart data calculations
  const getTimelineData = () => {
    const recentLogs = [...logs].slice(0, 15).reverse();
    let accAttacks = 0;
    let accSafe = 0;
    return recentLogs.map((log, idx) => {
      if (log.attack) accAttacks += 1;
      else accSafe += 1;
      let timeStr = "";
      try {
        timeStr = log.time.split(" ")[1]?.substring(0, 8) || `R${idx}`;
      } catch {
        timeStr = `R${idx}`;
      }
      return {
        time: timeStr,
        Attacks: accAttacks,
        Safe: accSafe,
        Total: accAttacks + accSafe,
      };
    });
  };

  const getAttackTypeData = () => {
    const attackTypes = {};
    logs.forEach((log) => {
      if (log.attack && log.attack_type) {
        attackTypes[log.attack_type] = (attackTypes[log.attack_type] || 0) + 1;
      }
    });
    const COLORS = ["#f87171", "#fb923c", "#facc15", "#c084fc", "#60a5fa"];
    return Object.entries(attackTypes).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));
  };

  // =========================
  // AUTHENTICATION SCREEN
  // =========================
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden font-cyber">
        {/* Particle nodes and grid line visuals */}
        <NetworkBackground />
        <div className="scanlines"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/50 to-black z-0 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Hacker Terminal HUD */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex flex-col h-[480px] bg-slate-950/80 border-2 border-cyan-500/20 rounded-2xl p-6 glow-cyan backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-orbitron">
                <TerminalIcon size={20} className="animate-pulse" />
                <span>CYBER_DECK // SENTINEL_AI</span>
              </div>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/40"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/40"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/40"></span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-sm text-cyan-500/80 space-y-2 select-text">
              {terminalLogs.map((logStr, i) => (
                <div key={i} className="leading-relaxed border-l-2 border-cyan-500/10 pl-2">
                  {logStr}
                </div>
              ))}
              <div className="text-cyan-400 flex items-center gap-2">
                <span>$</span>
                <span className="w-2.5 h-4 bg-cyan-400 animate-pulse"></span>
              </div>
            </div>

            <div className="border-t border-cyan-500/20 pt-4 mt-4 text-xs text-slate-500 flex justify-between items-center">
              <span>SEC_OVERLAY_MOD: STANDBY</span>
              <span>v1.0.4-BETA</span>
            </div>
          </motion.div>

          {/* Login / Sign Up Panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-slate-950/85 border border-cyan-500/30 p-8 lg:p-10 rounded-2xl shadow-2xl glow-cyan backdrop-blur-md relative overflow-hidden"
          >
            {/* Tech Corner Clips */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-cyan-500/10 border border-cyan-500/40 p-4 rounded-full relative animate-cyber-pulse">
                  <Shield className="text-cyan-400" size={42} />
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-cyan-400 font-orbitron tracking-widest cyber-hud-title">
                SENTINEL//AI
              </h1>
              <p className="text-slate-400 mt-2 text-xs uppercase tracking-widest">
                Intrusion Detection Gateway
              </p>
            </div>

            <div className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-4 text-cyan-500/50" size={18} />
                  <input
                    type="text"
                    placeholder="OPERATOR NAME"
                    className="w-full bg-slate-900/50 border border-cyan-500/20 focus:border-cyan-400 outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold transition uppercase text-cyan-400 placeholder:text-cyan-900/50 font-cyber"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-4 text-cyan-500/50" size={18} />
                <input
                  type="email"
                  placeholder="OPERATOR EMAIL"
                  className="w-full bg-slate-900/50 border border-cyan-500/20 focus:border-cyan-400 outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold transition uppercase text-cyan-400 placeholder:text-cyan-900/50 font-cyber"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 text-cyan-500/50" size={18} />
                <input
                  type="password"
                  placeholder="SECRET AUTH KEY"
                  className="w-full bg-slate-900/50 border border-cyan-500/20 focus:border-cyan-400 outline-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold transition text-cyan-400 placeholder:text-cyan-900/50 font-cyber"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isLogin ? handleLogin : handleSignup}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 transition-all py-4 rounded-xl font-bold text-sm tracking-widest font-orbitron text-black shadow-lg shadow-cyan-500/20"
              >
                {isLogin ? "INITIALIZE LOGIN" : "REQUEST CREATION"}
              </motion.button>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-500/70 hover:text-cyan-400 transition text-xs tracking-widest font-orbitron uppercase"
              >
                {isLogin ? "[ Register New Operator ]" : "[ Return to Key Login ]"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN HUD CONTROLS
  // =========================
  return (
    <div className="relative flex min-h-screen text-white bg-black overflow-hidden font-cyber">
      {/* Background elements */}
      <NetworkBackground />
      <div className="scanlines"></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/60 to-black z-0 pointer-events-none"></div>

      {/* SIDEBAR HUD */}
      <div className="relative z-10 w-80 bg-slate-950/70 border-r-2 border-cyan-500/20 p-6 flex flex-col justify-between backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-4 mb-10 border-b border-cyan-500/20 pb-6">
            <div className="bg-cyan-500/10 border border-cyan-400/50 p-3.5 rounded-xl glow-cyan animate-cyber-pulse">
              <Shield className="text-cyan-400" size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-cyan-400 font-orbitron tracking-widest cyber-hud-title">
                SENTINEL_AI
              </h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">
                SOC Control System
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                name: "dashboard",
                icon: <LayoutDashboard size={18} />,
                label: "COMMAND DASHBOARD",
              },
              {
                name: "logs",
                icon: <FileWarning size={18} />,
                label: "THREAT TELEMETRY",
              },
              {
                name: "analytics",
                icon: <BarChart3 size={18} />,
                label: "VECTOR ANALYTICS",
              },
              {
                name: "blocked",
                icon: <Ban size={18} />,
                label: "BLACK-LISTED IPS",
              },
            ].map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePageChange(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-4 rounded-xl transition-all duration-300 font-orbitron text-xs tracking-wider border ${
                  page === item.name
                    ? "bg-cyan-500/15 border-cyan-400 text-cyan-400 shadow-md shadow-cyan-500/25"
                    : "bg-slate-900/35 border-transparent text-slate-400 hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-slate-900/60"
                }`}
              >
                {item.icon}
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950/90 border border-cyan-500/10 p-4 rounded-xl text-slate-500 text-[11px] space-y-2">
            <div className="flex justify-between">
              <span>SEC_STATUS:</span>
              <span className="text-green-400 font-bold">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>WAF_SHIELD:</span>
              <span className="text-cyan-400 font-bold">100%</span>
            </div>
            <div className="flex justify-between">
              <span>ALERT_STAT:</span>
              <span className={threatLevel === "CRITICAL" ? "text-red-400 font-bold" : threatLevel === "ELEVATED" ? "text-yellow-400 font-bold" : "text-green-400 font-bold"}>
                {threatLevel}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 hover:border-red-400 transition-all font-orbitron text-xs font-bold tracking-widest text-red-400"
          >
            <LogOut size={16} />
            DE-AUTHORIZE DECK
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="relative z-10 flex-1 flex flex-col p-8 overflow-y-auto max-h-screen">
        {/* TOP STATUS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/10 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black font-orbitron tracking-widest text-white flex items-center gap-3">
              <span>SENTINEL_OPERATIONS //</span>
              <span className="text-cyan-400 text-2xl animate-text-flicker">
                {page.toUpperCase()}
              </span>
            </h1>
            <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">
              Handshake established // Secure Socket Channel
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-orbitron bg-slate-950/60 border border-cyan-500/20 px-5 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-ping"></span>
              <span className="text-green-400 font-semibold">FEED_ONLINE</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" />
              <span className="text-cyan-400 font-semibold">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "TOTAL INCOMING PACKETS",
              value: totalRequests,
              color: "cyan",
              icon: <Activity size={24} className="text-cyan-400" />,
            },
            {
              title: "ATTACKS DEFLECTED",
              value: attackRequests,
              color: "red",
              icon: <Skull size={24} className="text-red-400 animate-bounce" />,
            },
            {
              title: "SAFE TRAFFIC CHANNELS",
              value: safeRequests,
              color: "green",
              icon: <Shield size={24} className="text-green-400" />,
            },
            {
              title: "ACTIVE BLACK-LISTED IPS",
              value: blockedCount,
              color: "orange",
              icon: <Ban size={24} className="text-orange-400" />,
            },
          ].map((card, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`rounded-xl p-5 border backdrop-blur-xl relative overflow-hidden ${
                card.color === "cyan"
                  ? "bg-cyan-950/10 border-cyan-500/20 glow-cyan"
                  : card.color === "red"
                  ? "bg-red-950/10 border-red-500/20 glow-red"
                  : card.color === "green"
                  ? "bg-green-950/10 border-green-500/20 glow-green"
                  : "bg-orange-950/10 border-orange-500/20 shadow-orange-500/5"
              }`}
            >
              {/* Tech corner line */}
              <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none border-t border-r border-white/20"></div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px] font-bold tracking-widest font-orbitron">{card.title}</p>
                  <h1 className="text-4xl font-extrabold mt-3 font-orbitron text-white">{card.value}</h1>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  {card.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PAGE CONTENT */}
        <AnimatePresence mode="wait">
          {page === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline chart */}
                <div className="lg:col-span-2 bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md relative">
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
                  <div className="flex items-center justify-between mb-6 border-b border-cyan-500/10 pb-4">
                    <h2 className="text-sm font-bold text-cyan-400 font-orbitron tracking-widest flex items-center gap-2">
                      <Activity size={16} />
                      PACKET RATE TELEMETRY // REAL-TIME
                    </h2>
                    <span className="text-[10px] text-slate-500">REFRESH_RATE: 2.4s</span>
                  </div>

                  <div className="h-72 w-full text-xs font-mono">
                    {logs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600">
                        WAITING FOR TARGET TRAFFIC LOGS...
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getTimelineData()}>
                          <defs>
                            <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.05)" />
                          <XAxis dataKey="time" stroke="#0ea5e9" tickLine={false} />
                          <YAxis stroke="#0ea5e9" tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "rgba(3,7,18,0.95)", 
                              borderColor: "rgba(6,182,212,0.3)",
                              color: "#fff",
                              fontFamily: "Share Tech Mono"
                            }} 
                          />
                          <Area type="monotone" dataKey="Safe" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSafe)" />
                          <Area type="monotone" dataKey="Attacks" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Cyber HUD overview card */}
                <div className="bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md relative flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
                  <div>
                    <h2 className="text-sm font-bold text-cyan-400 font-orbitron tracking-widest flex items-center gap-2 mb-4">
                      <Cpu size={16} />
                      SECURITY COGNITIVE MATRIX
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 font-cyber border-l border-cyan-500/20 pl-3">
                      SentinelX shield module is operating normally. Dynamic signature engines check 
                      payload structures against known exploits. AI vector prediction intercepts mutated threat signatures.
                    </p>

                    <div className="space-y-3 font-orbitron text-xs">
                      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                        <span className="text-slate-500">GATEWAY_IP:</span>
                        <span className="text-cyan-400">127.0.0.1</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                        <span className="text-slate-500">AI_DECK_MODEL:</span>
                        <span className="text-green-400">ACTIVE [NB]</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                        <span className="text-slate-500">REDIS_BUFFER:</span>
                        <span className="text-cyan-400 font-semibold">CONNECTED</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                        <span className="text-slate-500">INT_FREQUENCY:</span>
                        <span className="text-cyan-400">5000ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-cyan-500/10 pt-4 flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${threatLevel === "SAFE" ? "bg-green-400 animate-pulse" : "bg-red-500 animate-ping"}`}></div>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-orbitron">
                      {threatLevel === "SAFE" ? "SHIELD CONFIG: OPTIMAL" : "THREAT EVENT DETECTED"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick live alerts feed */}
              <div className="bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-4 mb-4">
                  <h2 className="text-sm font-bold text-cyan-400 font-orbitron tracking-widest flex items-center gap-2">
                    <TerminalIcon size={16} />
                    LIVE FEED LOG STREAM
                  </h2>
                  <button onClick={fetchLogs} className="text-cyan-500/70 hover:text-cyan-400 transition flex items-center gap-1.5 text-xs font-orbitron">
                    <RefreshCw size={12} className="animate-spin" />
                    RE-SYNC FEED
                  </button>
                </div>
                
                <div className="overflow-y-auto max-h-[180px] space-y-2.5 font-mono text-xs pr-2">
                  {logs.slice(0, 5).map((log, idx) => (
                    <div
                      key={idx}
                      className={`border-l-2 py-2 px-3 flex flex-col md:flex-row md:items-center justify-between rounded bg-slate-900/40 gap-2 ${
                        log.attack 
                          ? "border-red-500 text-red-400/95 bg-red-950/5" 
                          : "border-green-500 text-green-400/90"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold font-orbitron border border-current px-1.5 py-0.5 rounded text-[10px]">
                          {log.attack ? "ALRT" : "PASS"}
                        </span>
                        <span>[{log.time?.split(" ")[1] || log.time}]</span>
                        <span>IP: {log.ip}</span>
                        <span className="opacity-80">PATH: {log.url}</span>
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-center font-bold">
                        <span>{log.attack_type}</span>
                        <span className="text-[10px] font-orbitron opacity-75">({log.country})</span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-6 text-slate-600 font-orbitron">
                      NO EVENTS REGISTERED IN STACK BUFFER.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* THREAT TELEMETRY LOGS */}
          {page === "logs" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md relative"
            >
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/10 pb-5 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-cyan-400 font-orbitron tracking-widest flex items-center gap-2">
                    <FileWarning size={20} />
                    THREAT MONITORING TELEMETRY
                  </h2>
                  <p className="text-slate-500 text-[11px] uppercase tracking-wider mt-1">
                    Complete raw traffic packets analyzed
                  </p>
                </div>
                
                <button 
                  onClick={fetchLogs}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl hover:bg-cyan-950/80 transition-all font-orbitron text-xs tracking-wider text-cyan-400"
                >
                  <RefreshCw size={14} />
                  REFRESH LOG DATA
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyan-500/20 text-cyan-400 font-orbitron tracking-wider">
                      <th className="pb-3 pr-4">TIME</th>
                      <th className="pb-3 pr-4">SOURCE IP</th>
                      <th className="pb-3 pr-4">TARGET REQUEST</th>
                      <th className="pb-3 pr-4">DECISION</th>
                      <th className="pb-3 pr-4">ATTACK TYPE</th>
                      <th className="pb-3 pr-4">SEVERITY</th>
                      <th className="pb-3">GEOLOCATION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td className="py-8 text-center text-slate-500" colSpan="7">
                          NO ACTIVE LOGS REPORTED IN DATABASE.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => (
                        <tr
                          key={index}
                          className="border-b border-cyan-500/5 hover:bg-slate-900/30 transition-all duration-150"
                        >
                          <td className="py-3.5 pr-4 text-slate-400">{log.time?.split(" ")[1] || log.time}</td>
                          <td className="py-3.5 pr-4 font-semibold text-white">{log.ip}</td>
                          <td className="py-3.5 pr-4 text-cyan-500/90 break-all select-text font-bold">{log.data || log.url}</td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] font-orbitron border ${
                                log.attack
                                  ? "border-red-500/50 bg-red-950/10 text-red-400"
                                  : "border-green-500/50 bg-green-950/10 text-green-400"
                              }`}
                            >
                              {log.attack ? "DEFLECTED" : "AUTHORIZED"}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-slate-300 font-bold">{log.attack_type}</td>
                          <td className="py-3.5 pr-4 font-orbitron font-extrabold">
                            <span className={
                              log.severity === "CRITICAL" ? "text-red-500" :
                              log.severity === "HIGH" ? "text-orange-500" :
                              log.severity === "MEDIUM" ? "text-yellow-500" : "text-green-500"
                            }>
                              {log.severity}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-400 uppercase">{log.country} ({log.city || "UNKNOWN"})</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* VECTOR ANALYTICS */}
          {page === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stats grid */}
                <div className="lg:col-span-2 bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
                  
                  {[
                    { label: "TOTAL INCOMING", val: stats?.total || 0, desc: "Total request frames" },
                    { label: "TOTAL ATTACKS", val: stats?.attacks || 0, desc: "Blocked intrusions", highlight: "text-red-400" },
                    { label: "SAFE CHANNELS", val: stats?.safe || 0, desc: "Authorized access" },
                    { label: "CRITICAL THREATS", val: stats?.critical || 0, desc: "Highest threat flags", highlight: "text-red-500 font-black" },
                    { label: "HIGH THREATS", val: stats?.high || 0, desc: "Medium threat warnings", highlight: "text-orange-400" },
                    { label: "MEDIUM THREATS", val: stats?.medium || 0, desc: "Lower impact indicators", highlight: "text-yellow-400" },
                    { label: "UNIQUE IP VECTORS", val: stats?.unique_ips || 0, desc: "Total distinct clients", colSpan: "sm:col-span-2 md:col-span-3 border-t border-cyan-500/10 pt-4" }
                  ].map((stat, idx) => (
                    <div key={idx} className={`p-4 bg-slate-900/40 border border-cyan-500/10 rounded-xl ${stat.colSpan || ""}`}>
                      <p className="text-slate-500 text-[10px] font-bold font-orbitron uppercase tracking-wider">{stat.label}</p>
                      <h3 className={`text-3xl font-extrabold mt-2 font-orbitron ${stat.highlight || "text-cyan-400"}`}>{stat.val}</h3>
                      <p className="text-slate-600 text-[10px] mt-1 uppercase font-cyber">{stat.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Pie Chart */}
                <div className="bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md relative flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
                  <div>
                    <h2 className="text-sm font-bold text-cyan-400 font-orbitron tracking-widest flex items-center gap-2 mb-6 border-b border-cyan-500/10 pb-4">
                      <Skull size={16} />
                      THREAT DISTRIBUTION MATRIX
                    </h2>

                    <div className="h-56 w-full flex items-center justify-center">
                      {getAttackTypeData().length === 0 ? (
                        <div className="text-slate-600 text-xs font-orbitron">
                          NO ATTACK VECTOR DATA IN CACHE
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getAttackTypeData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getAttackTypeData().map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(3,7,18,0.95)",
                                borderColor: "rgba(6,182,212,0.3)",
                                color: "#fff",
                                fontFamily: "Share Tech Mono"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 font-cyber text-[11px] mt-4 border-t border-cyan-500/10 pt-4">
                    {getAttackTypeData().map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-400 uppercase">{item.name}:</span>
                        </div>
                        <span className="text-white font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* BLACK-LISTED IPS */}
          {page === "blocked" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-950/75 border border-cyan-500/25 rounded-2xl p-6 glow-cyan backdrop-blur-md relative"
            >
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/10 pb-4 mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-red-400 font-orbitron tracking-widest flex items-center gap-2">
                    <Ban size={20} />
                    IPS TEMPORARILY BANISHED FROM HOST
                  </h2>
                  <p className="text-slate-500 text-[11px] uppercase tracking-wider mt-1">
                    Redis active firewall restrictions (20s TTL)
                  </p>
                </div>

                <button 
                  onClick={fetchBlockedIps}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-950/30 border border-red-500/30 rounded-xl hover:bg-red-950/70 transition-all font-orbitron text-xs tracking-wider text-red-400"
                >
                  <RefreshCw size={14} />
                  SYNC IP LIST
                </button>
              </div>

              {blockedIps.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-cyan-500/10 rounded-xl text-center text-slate-500 font-orbitron">
                  <Shield className="text-green-500/40 mx-auto mb-4" size={42} />
                  NO HIGH-RISK IPS REGISTERED IN FIREWALL BLOCKLIST.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {blockedIps.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-950/10 border border-red-500/30 p-5 rounded-xl glow-red relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Grid overlays */}
                      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-red-400"></div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-red-400"></div>

                      <div>
                        <div className="flex items-center justify-between border-b border-red-500/20 pb-3 mb-3">
                          <h3 className="text-xl font-bold font-orbitron text-red-400">{item.ip}</h3>
                          <span className="text-[9px] font-orbitron px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-red-400">
                            BANNED
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                          REASON: <span className="text-white font-bold">{item.reason || "EXPLOIT SIG MATCH"}</span>
                        </p>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-xs text-red-500/80">
                        <Clock size={14} className="animate-spin" />
                        <span>AUTO-RELEASE IN: {item.ttl}s</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
