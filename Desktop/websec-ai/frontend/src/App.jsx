import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

import {
  Shield,
  Activity,
  AlertTriangle,
  Ban,
  Globe,
  LayoutDashboard,
  FileWarning,
  BarChart3,
} from "lucide-react";

export default function App() {
  const socket = io("http://localhost:5000");

  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState("dashboard");

  // Fetch Logs
  const fetchLogs = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/logs"
      );

      setLogs(res.data.reverse());

    } catch (err) {

      console.log(err);

    }

  };

  // Auto Refresh
  useEffect(() => {

  fetchLogs();

  socket.on("new_log", (newLog) => {

    setLogs((prevLogs) => [

      newLog,

      ...prevLogs,

    ]);

  });

  return () => {

    socket.off("new_log");

  };

}, []);   

  // Stats
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

  return (

    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 p-6">

        {/* Logo */}
        <div className="flex items-center gap-4 mb-12">

          <div className="bg-cyan-500/20 p-3 rounded-2xl">

            <Shield className="text-cyan-400" size={36} />

          </div>

          <div>

            <h1 className="text-3xl font-bold text-cyan-400">
              SentinelX
            </h1>

            <p className="text-slate-400 text-sm">
              AI Security Platform
            </p>

          </div>

        </div>

        {/* Navigation */}
        <div className="space-y-4">

          {/* Dashboard */}
          <motion.button

            whileHover={{
              scale: 1.03,
              x: 5,
            }}

            whileTap={{
              scale: 0.97,
            }}

            onClick={() => setPage("dashboard")}

            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 border ${
              page === "dashboard"
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/20"
                : "hover:bg-slate-800 border-transparent"
            }`}
          >

            <LayoutDashboard size={22} />

            Dashboard

          </motion.button>

          {/* Logs */}
          <motion.button

            whileHover={{
              scale: 1.03,
              x: 5,
            }}

            whileTap={{
              scale: 0.97,
            }}

            onClick={() => setPage("logs")}

            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 border ${
              page === "logs"
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/20"
                : "hover:bg-slate-800 border-transparent"
            }`}
          >

            <FileWarning size={22} />

            Threat Logs

          </motion.button>

          {/* Analytics */}
          <motion.button

            whileHover={{
              scale: 1.03,
              x: 5,
            }}

            whileTap={{
              scale: 0.97,
            }}

            onClick={() => setPage("analytics")}

            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 border ${
              page === "analytics"
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/20"
                : "hover:bg-slate-800 border-transparent"
            }`}
          >

            <BarChart3 size={22} />

            Analytics

          </motion.button>

          {/* Blocked */}
          <motion.button

            whileHover={{
              scale: 1.03,
              x: 5,
            }}

            whileTap={{
              scale: 0.97,
            }}

            onClick={() => setPage("blocked")}

            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 border ${
              page === "blocked"
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/20"
                : "hover:bg-slate-800 border-transparent"
            }`}
          >

            <Ban size={22} />

            Blocked IPs

          </motion.button>

        </div>

      </div>

      {/* Main Content */}
      <motion.div

        initial={{
          opacity: 0,
          y: 10,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          duration: 0.4,
        }}

        className="flex-1 p-6"
      >

        {/* Topbar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl px-8 py-5 mb-10">

          <div>

            <h1 className="text-3xl font-bold">
              SentinelX SOC Dashboard
            </h1>

            <p className="text-slate-400 mt-1">
              Real-Time AI Threat Monitoring
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>

            <span className="text-green-400 font-medium">
              System Active
            </span>

          </div>

        </div>

        {/* Dashboard */}
        {page === "dashboard" && (

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* Total */}
            <motion.div

              whileHover={{
                scale: 1.03,
                y: -5,
              }}

              className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 shadow-2xl"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-white/80">
                    Total Requests
                  </p>

                  <h2 className="text-5xl font-bold mt-4">
                    {totalRequests}
                  </h2>

                </div>

                <Activity size={45} />

              </div>

            </motion.div>

            {/* Attacks */}
            <motion.div

              whileHover={{
                scale: 1.03,
                y: -5,
              }}

              className="bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-6 shadow-2xl"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-white/80">
                    Attack Requests
                  </p>

                  <h2 className="text-5xl font-bold mt-4">
                    {attackRequests}
                  </h2>

                </div>

                <AlertTriangle size={45} />

              </div>

            </motion.div>

            {/* Blocked */}
            <motion.div

              whileHover={{
                scale: 1.03,
                y: -5,
              }}

              className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl p-6 shadow-2xl"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-white/80">
                    Blocked IPs
                  </p>

                  <h2 className="text-5xl font-bold mt-4">
                    {blockedIPs.length}
                  </h2>

                </div>

                <Ban size={45} />

              </div>

            </motion.div>

            {/* Safe */}
            <motion.div

              whileHover={{
                scale: 1.03,
                y: -5,
              }}

              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-2xl"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-white/80">
                    Safe Requests
                  </p>

                  <h2 className="text-5xl font-bold mt-4">
                    {safeRequests}
                  </h2>

                </div>

                <Shield size={45} />

              </div>

            </motion.div>

          </div>

        )}

        {/* Logs */}
        {page === "logs" && (

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">

            <h2 className="text-3xl font-bold text-cyan-400 mb-8">
              Live Threat Logs
            </h2>

            <div className="overflow-x-auto">
<table className="w-full text-left">

  <thead>

    <tr className="border-b border-slate-700 text-slate-400">

      <th className="pb-4">IP Address</th>

      <th className="pb-4">URL</th>

      <th className="pb-4">Status</th>

      <th className="pb-4">Attack Type</th>

      <th className="pb-4">Severity</th>

      <th className="pb-4">Country</th>

      <th className="pb-4">Time</th>

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
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              log.attack
                ? "bg-red-500/20 text-red-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >

            {log.attack ? "Attack" : "Safe"}

          </span>

        </td>

        <td className="py-4">

          <span className="text-cyan-400">

            {log.attack_type || "Normal Traffic"}

          </span>

        </td>

        <td className="py-4">

          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              log.severity === "CRITICAL"
                ? "bg-red-500/20 text-red-400"
                : log.severity === "HIGH"
                ? "bg-orange-500/20 text-orange-400"
                : log.severity === "MEDIUM"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-green-500/20 text-green-400"
            }`}
          >

            {log.severity || "SAFE"}

          </span>

        </td>

        <td className="py-4">

          <span className="text-cyan-400">

            {log.country || "Unknown"}

          </span>

        </td>

        <td className="py-4 text-slate-400">

          {log.time}

        </td>

      </tr>

    ))}

  </tbody>

</table>              

            </div>

          </div>

        )}

        {/* Analytics */}
        {page === "analytics" && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">

              <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                Threat Analytics
              </h2>

              <p className="text-slate-400">
                AI detected malicious traffic.
              </p>

              <h1 className="text-7xl font-bold text-red-400 mt-8">
                {attackRequests}
              </h1>

            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">

              <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                Safe Traffic
              </h2>

              <p className="text-slate-400">
                Legitimate requests processed.
              </p>

              <h1 className="text-7xl font-bold text-green-400 mt-8">
                {safeRequests}
              </h1>

            </div>

          </div>

        )}

        {/* Blocked IPs */}
        {page === "blocked" && (

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">

            <h2 className="text-3xl font-bold text-orange-400 mb-8">
              Blocked IP Addresses
            </h2>

            <div className="space-y-4">

              {blockedIPs.length === 0 && (

                <div className="text-slate-500">
                  No blocked IPs yet
                </div>

              )}

              {blockedIPs.map((ip, index) => (

                <motion.div

                  whileHover={{
                    scale: 1.02,
                  }}

                  key={index}

                  className="bg-slate-800 px-6 py-5 rounded-2xl flex items-center justify-between"
                >

                  <span className="font-medium">
                    {ip}
                  </span>

                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                    BLOCKED
                  </span>

                </motion.div>

              ))}

            </div>

          </div>

        )}

        {/* Footer */}
        <div className="mt-12 flex items-center gap-2 text-slate-500 text-sm">

          <Globe size={16} />

           AI Security Monitoring System

        </div>

      </motion.div>

    </div>

  );
}
