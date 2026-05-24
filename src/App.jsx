
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import CountUp from "react-countup";

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
  Menu,
  X,	
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
export default function App() {

  // =========================
  // SOCKET
  // =========================
  const [socket, setSocket] = useState(null);
  // =========================
  // AUTH
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      const res = await axios.get(
        "http://localhost:5000/api/logs"
      );

      setLogs(res.data.logs || []);

    } catch (err) {

      console.log(err);

    }

  };

  // =========================
  // SOCKET REALTIME
  // =========================
  useEffect(() => {

    if (isAuthenticated) {

      fetchLogs();

      const newSocket = io("http://localhost:5000");

      setSocket(newSocket);

      newSocket.on("new_log", (newLog) => {

        setLogs((prev) => [

          newLog,
          ...prev,

        ]);

      });

      return () => {

        newSocket.disconnect();

      };

    }

  }, [isAuthenticated]);

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {

    try {

      const res = await axios.post(
        "http://localhost:5000/api/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      setIsAuthenticated(true);

      alert("Login Successful");

    } catch (err) {

      alert("Invalid Credentials");

      console.log(err);

    }

  };

  // =========================
  // SIGNUP
  // =========================
  const handleSignup = async () => {

    try {

      await axios.post(
        "http://localhost:5000/api/signup",
        {
          name,
          email,
          password,
        }
      );

      alert("Account Created");

      setIsLogin(true);

    } catch (err) {

      alert("Signup Failed");

      console.log(err);

    }

  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {

    localStorage.removeItem("token");

    setIsAuthenticated(false);

  };

  // =========================
  // STATS
  // =========================
  const totalRequests = logs.length;

  const attackRequests = logs.filter(
    (log) => log.attack === true
  ).length;

  const safeRequests = logs.filter(
    (log) => log.attack === false
  ).length;

  const blockedIPs = [

    ...new Set(

      logs
        .filter((log) => log.attack === true)
        .map((log) => log.ip)

    ),

  ];

// =========================
// ANALYTICS DATA
// =========================

const pieData = [
  {
    name: "Safe",
    value: safeRequests,
  },
  {
    name: "Attacks",
    value: attackRequests,
  },
];

const severityData = [
  {
    name: "Low",
    value: logs.filter(
      (log) => log.severity === "LOW"
    ).length,
  },
  {
    name: "Medium",
    value: logs.filter(
      (log) => log.severity === "MEDIUM"
    ).length,
  },
  {
    name: "High",
    value: logs.filter(
      (log) => log.severity === "HIGH"
    ).length,
  },
  {
    name: "Critical",
    value: logs.filter(
      (log) => log.severity === "CRITICAL"
    ).length,
  },
];

const COLORS = [
  "#22c55e",
  "#ef4444",
];

  // =========================
  // AUTH PAGE
  // =========================
  if (!isAuthenticated) {

    return (

      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=2070&auto=format&fit=crop')",   
	}}
      >

        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <motion.div

          initial={{
            opacity: 0,
            y: 40,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          className="transform-gpu  relative z-10  bg-slate-900/80 border border-cyan-500/30 p-6 sm:p-10 rounded-3xl w-[95%] max-w-[420px] shadow-2xl backdrop-blur-xl"
	    >

          <div className="text-center mb-8">

            <div className="flex justify-center mb-5">

              <div className="bg-cyan-500/20 p-5 rounded-3xl shadow-lg shadow-cyan-500/30">

                <Shield
                  className="text-cyan-400"
                  size={50}
                />

              </div>

            </div>

            <h1 className="text-5xl font-bold text-cyan-400">
              SentinelX
            </h1>

            <p className="text-slate-400 mt-3">
              AI Cyber Security Monitoring
            </p>

          </div>

          {!isLogin && (

            <div className="mb-4">

              <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-4 rounded-2xl border border-slate-700">

                <User size={18} />

                <input
                  type="text"
                  placeholder="Full Name"
                  className="bg-transparent outline-none w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

              </div>

            </div>

          )}

          <div className="mb-4">

            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-4 rounded-2xl border border-slate-700">

              <Mail size={18} />

              <input
                type="email"
                placeholder="Email Address"
                className="bg-transparent outline-none w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

            </div>

          </div>

          <div className="mb-6">

            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-4 rounded-2xl border border-slate-700">

              <Lock size={18} />

              <input
                type="password"
                placeholder="Password"
                className="bg-transparent outline-none w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

            </div>

          </div>

          <motion.button
whileHover={{
  scale: 1.04,
  y: -10,
  rotateX: 4,
  rotateY: 4,
}}           
            whileTap={{
              scale: 0.97,
            }}

            onClick={
              isLogin
                ? handleLogin
                : handleSignup
            }

            className="w-full bg-cyan-500 hover:bg-cyan-400 transition-all py-4 rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/30"
          >

            {isLogin ? "LOGIN" : "CREATE ACCOUNT"}

          </motion.button>

          <div className="text-center mt-6">

            <button

              onClick={() =>
                setIsLogin(!isLogin)
              }

              className="text-cyan-400 hover:underline"
            >

              {isLogin
                ? "Create New Account"
                : "Already Have Account? Login"}

            </button>

          </div>

        </motion.div>

      </div>

    );

  }

  // =========================
  // DASHBOARD
  // =========================
  return (

<div
  className="flex flex-col lg:flex-row min-h-screen text-white bg-cover bg-center overflow-hidden"

	  style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=2070&auto=format&fit=crop')",
      }}
    >

     <div className="absolute inset-0 bg-black/75 backdrop-blur-sm"></div>

<div className="absolute inset-0 opacity-[0.08]">

  <div
    className="w-full h-full"
    style={{
      backgroundImage: `
        linear-gradient(rgba(0,255,255,0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)
      `,
      backgroundSize: "40px 40px",
    }}
  />

</div>
	  {/* MOBILE TOPBAR */}

<div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-cyan-500/20 p-4 flex items-center justify-between">

  <h1 className="text-2xl font-bold text-cyan-400">
    SentinelX
  </h1>

  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="text-cyan-400"
  >
    {sidebarOpen ? <X size={30} /> : <Menu size={30} />}
  </button>

</div>


      {/* SIDEBAR */}
     <div
  className={`fixed lg:relative top-0 left-0 h-full lg:h-auto z-40 w-[85%] sm:w-72 bg-slate-900/80 border-r border-cyan-500/20 p-6 backdrop-blur-xl transition-transform duration-300 ${
    sidebarOpen
      ? "translate-x-0"
      : "-translate-x-full lg:translate-x-0"
  }`}
>

        <div className="flex items-center gap-4 mb-12">

          <div className="bg-cyan-500/20 p-4 rounded-3xl shadow-lg shadow-cyan-500/30">

            <Shield
              className="text-cyan-400"
              size={36}
            />

          </div>

          <div>

            <h1 className="text-3xl font-bold text-cyan-400">
              SentinelX
            </h1>

            <p className="text-slate-400 text-sm">
              SOC Dashboard
            </p>

          </div>

        </div>

        <div className="space-y-4">

          {[
            {
              name: "dashboard",
              icon: <LayoutDashboard size={20} />,
              label: "Dashboard",
            },
            {
              name: "logs",
              icon: <FileWarning size={20} />,
              label: "Threat Logs",
            },
            {
              name: "analytics",
              icon: <BarChart3 size={20} />,
              label: "Analytics",
            },
            {
              name: "blocked",
              icon: <Ban size={20} />,
              label: "Blocked IPs",
            },
          ].map((item, index) => (

            <motion.button

              key={index}

              whileHover={{
                scale: 1.05,
                x: 5,
              }}

              whileTap={{
                scale: 0.95,
              }}

             onClick={() => {
  setPage(item.name);
  setSidebarOpen(false);
}}
           

className={`transform-gpu w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${
                page === item.name
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-500/30"
                  : "bg-slate-800/50 hover:bg-slate-700/60"
              }`}
            >

              {item.icon}

              {item.label}

            </motion.button>

          ))}

          <motion.button

            whileHover={{
              scale: 1.05,
            }}

            whileTap={{
              scale: 0.95,
            }}

            onClick={handleLogout}

            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500 hover:bg-red-600 mt-10"
          >

            <LogOut size={20} />

            Logout

          </motion.button>

        </div>

      </div>

      {/* MAIN */}
<div className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 mt-20 lg:mt-0 overflow-auto">

  <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>

  <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>



{/* TOPBAR */}
        <div className="flex items-center justify-between mb-10">

          <div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
	SentinelX Dashboard
            </h1>

            <p className="text-slate-400 mt-2">
              Real-Time AI Threat Monitoring
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>

            <span className="text-green-400 font-semibold">
              SYSTEM ACTIVE
            </span>

          </div>

        </div>



<motion.div
  key={page}

  initial={{
    opacity: 0,
    y: 20,
  }}

  animate={{
    opacity: 1,
    y: 0,
  }}

  transition={{
    duration: 0.4,
  }}
>
	{/* STATS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6 mb-10">

  {[
    {
      title: "Total Requests",
      value: totalRequests,
      color: "cyan",
      icon: <Activity size={35} />,
    },
    {
      title: "Attack Requests",
      value: attackRequests,
      color: "red",
      icon: <AlertTriangle size={35} />,
    },
    {
      title: "Safe Requests",
      value: safeRequests,
      color: "green",
      icon: <Shield size={35} />,
    },
    {
      title: "Blocked IPs",
      value: blockedIPs.length,
      color: "orange",
      icon: <Ban size={35} />,
    },
  ].map((card, index) => (

    <motion.div
      key={index}

      whileHover={{
        scale: 1.03,
        y: -6,
      }}

      transition={{
        type: "spring",
        stiffness: 180,
        damping: 18,
      }}

className={`transform-gpu rounded-3xl p-6 border backdrop-blur-xl shadow-2xl ${
              card.color === "cyan"
          ? "bg-cyan-500/10 border-cyan-400/30 shadow-cyan-500/20 hover:shadow-cyan-500/40"
          : card.color === "red"
          ? "bg-red-500/10 border-red-400/30 shadow-red-500/20 hover:shadow-red-500/40"
          : card.color === "green"
          ? "bg-green-500/10 border-green-400/30 shadow-green-500/20 hover:shadow-green-500/40"
          : "bg-orange-500/10 border-orange-400/30 shadow-orange-500/20 hover:shadow-orange-500/40"
      }`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-slate-300">
            {card.title}
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-5">
           
{card.value}
	  </h1>

        </div>

        {card.icon}

      </div>

    </motion.div>

  ))}

</div>
	{/* THREAT LOGS */}

        {page === "logs" && (

        <div className="transform-gpu bg-slate-900/70 border border-cyan-400/20 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)]">
		<h2 className="text-3xl font-bold text-cyan-400 mb-6">
              Live Threat Logs
            </h2>

           <div className="overflow-x-auto rounded-2xl">         

           <table className="min-w-[900px] w-full">

		<thead>

                  <tr className="text-left border-b border-slate-700 text-slate-400">

                    <th className="pb-4">IP</th>
                    <th className="pb-4">URL</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Severity</th>
                    <th className="pb-4">Country</th>

                  </tr>

                </thead>

                <tbody>

                  {logs.map((log, index) => (

                    <tr
                      key={index}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition"
                    >

                      <td className="py-4">
                        {log.ip}
                      </td>

                      <td className="py-4">
                        {log.url}
                      </td>

                      <td className="py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            log.attack
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >

                          {log.attack ? "Attack" : "Safe"}

                        </span>

                      </td>

                      <td className="py-4">
                        {log.attack_type}
                      </td>

                      <td className="py-4">
                        {log.severity}
                      </td>

                      <td className="py-4">
                        {log.country}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

</motion.div>

{page === "analytics" && (

  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

    {/* PIE CHART CARD */}
    <div className="bg-slate-900/60 border border-cyan-400/20 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)]">

      <h2 className="text-3xl font-bold text-cyan-400 mb-8">
        Threat Distribution
      </h2>

      <div className="w-full h-[420px]">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <defs>

              <linearGradient id="safeColor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>

              <linearGradient id="attackColor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>

            </defs>

            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={140}
              paddingAngle={8}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >

              <Cell fill="url(#safeColor)" />

              <Cell fill="url(#attackColor)" />

            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #06b6d4",
                borderRadius: "16px",
                color: "#fff",
              }}
            />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>

    {/* ANALYTICS CARD */}
    <div className="bg-slate-900/60 border border-cyan-400/20 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)]">

      <h2 className="text-3xl font-bold text-cyan-400 mb-8">
        Threat Intelligence
      </h2>

      <div className="space-y-6">

        <div className="bg-slate-800/40 p-5 rounded-2xl">
          <p className="text-slate-400">
            Total Threats Detected
          </p>

          <h1 className="text-5xl font-bold text-red-400 mt-2">
            {attackRequests}
          </h1>
        </div>

        <div className="bg-slate-800/40 p-5 rounded-2xl">
          <p className="text-slate-400">
            Safe Traffic
          </p>

          <h1 className="text-5xl font-bold text-green-400 mt-2">
            {safeRequests}
          </h1>
        </div>

        <div className="bg-slate-800/40 p-5 rounded-2xl">
          <p className="text-slate-400">
            Blocked IP Addresses
          </p>

          <h1 className="text-5xl font-bold text-orange-400 mt-2">
            {blockedIPs.length}
          </h1>
        </div>

      </div>

    </div>

  </div>

)}

{/* BAR CHART */}
{page === "analytics" && (

<div className="bg-slate-900/70 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-xl mt-6">   

	<h2 className="text-2xl font-bold text-cyan-400 mb-6">
        Threat Severity
      </h2>

      <div className="h-[350px]">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={severityData}>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis dataKey="name" stroke="#94a3b8" />

            <YAxis stroke="#94a3b8" />

            <Tooltip />

            <Bar
              dataKey="value"
              fill="#06b6d4"
              radius={[10, 10, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>


    </div>

)}

</div>

</div>

  );

}
