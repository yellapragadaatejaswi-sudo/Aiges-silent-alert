import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Calculator as CalcIcon, Shield, Radio, Terminal } from 'lucide-react';

interface LogEntry {
  id: number;
  time: string;
  msg: string;
  type: 'gray' | 'red' | 'green';
}

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [lastAcTap, setLastAcTap] = useState(0);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<null | 'sending' | 'sent' | 'error'>(null);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [newContact, setNewContact] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  const addLog = (msg: string, type: 'gray' | 'red' | 'green' = 'gray') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = { id: logIdRef.current++, time, msg, type };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  useEffect(() => {
    addLog('[SYSTEM] AIGES Initialization sequence complete.');
    addLog('[SYSTEM] Waiting for trigger event...');
    addLog('[INFO] Calculator interface active. Stealth mode ON.', 'green');
    setEmergencyContact('EMERGENCY_CONTACT_NUMBER');
  }, []);

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      
      if (fullEquation.trim() === '8008') {
        addLog('[ADMIN] Secret Code 8008 recognized.', 'green');
        addLog('[ADMIN] Emergency Contact Settings unlocked.', 'green');
        setShowConfig(true);
        setDisplay('CONFIG');
        setEquation('');
        return;
      }

      const sanitized = fullEquation.replace(/[^-+*/.0-9]/g, '');
      const result = new Function(`return ${sanitized}`)();
      setDisplay(String(result));
      setEquation('');
      addLog(`[USER] Calculation performed: ${sanitized} = ${result}`);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleAc = () => {
    const now = Date.now();
    addLog('[USER] Input cleared.');
    
    if (now - lastAcTap < 3000 && lastAcTap !== 0) {
      triggerEmergency();
    }
    
    setLastAcTap(now);
    setDisplay('0');
    setEquation('');
  };

  const triggerEmergency = () => {
    addLog('!!! TRIGGER ACTIVATED !!!', 'red');
    setIsEmergency(true);
    setEmergencyStatus('sending');

    if ("geolocation" in navigator) {
      addLog('[GPS] Fetching precise location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
          addLog(`[GPS] Coord: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° W`);
          addLog('[TWILIO] Sending encrypted SMS payload...');
          
          try {
            const response = await fetch('/api/send-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: mapLink,
                contactNumber: emergencyContact === 'EMERGENCY_CONTACT_NUMBER' ? '' : emergencyContact
              }),
            });
            
            const data = await response.json();
            if (data.success) {
              setEmergencyStatus('sent');
              addLog(`[SUCCESS] Alert sent to: ${emergencyContact === 'EMERGENCY_CONTACT_NUMBER' ? 'Default' : emergencyContact}`, 'green');
            } else {
              setEmergencyStatus('error');
              addLog('[ERROR] Alert transmission failed.', 'red');
            }
          } catch (error) {
            setEmergencyStatus('error');
            addLog('[ERROR] Network error during transmission.', 'red');
          }
        },
        (error) => {
          addLog('[ERROR] Location access denied.', 'red');
          setEmergencyStatus('error');
        }
      );
    } else {
      setEmergencyStatus('error');
    }

    setTimeout(() => {
      setIsEmergency(false);
      setEmergencyStatus(null);
    }, 5000);
  };

  const saveContact = () => {
    setEmergencyContact(newContact);
    setShowConfig(false);
    setDisplay('0');
    addLog(`[ADMIN] Emergency contact updated.`, 'green');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white overflow-hidden p-4">
      <div className="flex w-full max-w-5xl h-auto md:h-[700px] gap-8 flex-col md:flex-row items-center md:items-start justify-center">
        
        {/* Left Side: Phone GUI */}
        <div className="relative w-[340px] h-[650px] bg-[#1a1a1a] rounded-[50px] border-[8px] border-[#333] shadow-2xl overflow-hidden flex flex-col flex-shrink-0 animate-in fade-in zoom-in duration-500">
          <div className="h-6 w-32 bg-[#333] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-10 flex items-center justify-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
             <div className="w-8 h-1 bg-black rounded-full"></div>
          </div>
          
          <div className="flex-grow flex flex-col p-6 pt-16">
            <div className="w-full h-32 flex flex-col items-end justify-end mb-4 pr-2 overflow-hidden">
               <span className="text-gray-500 text-sm h-6 font-mono">{equation}</span>
               <span className="text-6xl font-light tracking-tighter truncate w-full text-right">{display}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <button onClick={handleAc} className="h-16 w-16 rounded-full bg-[#a5a5a5] text-black text-xl font-medium active:bg-[#d1d1d1] transition-all">
                {display === '0' && equation === '' ? 'AC' : 'C'}
              </button>
              <button onClick={() => setDisplay(String(Number(display) * -1))} className="h-16 w-16 rounded-full bg-[#a5a5a5] text-black text-xl font-medium">+/-</button>
              <button onClick={() => setDisplay(String(Number(display) / 100))} className="h-16 w-16 rounded-full bg-[#a5a5a5] text-black text-xl font-medium">%</button>
              <button onClick={() => handleOperator('/')} className="h-16 w-16 rounded-full bg-[#ff9f0a] text-white text-3xl font-medium">÷</button>
              
              <button onClick={() => handleNumber('7')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">7</button>
              <button onClick={() => handleNumber('8')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">8</button>
              <button onClick={() => handleNumber('9')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">9</button>
              <button onClick={() => handleOperator('*')} className="h-16 w-16 rounded-full bg-[#ff9f0a] text-white text-3xl font-medium">×</button>
              
              <button onClick={() => handleNumber('4')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">4</button>
              <button onClick={() => handleNumber('5')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">5</button>
              <button onClick={() => handleNumber('6')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">6</button>
              <button onClick={() => handleOperator('-')} className="h-16 w-16 rounded-full bg-[#ff9f0a] text-white text-3xl font-medium">-</button>
              
              <button onClick={() => handleNumber('1')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">1</button>
              <button onClick={() => handleNumber('2')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">2</button>
              <button onClick={() => handleNumber('3')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">3</button>
              <button onClick={() => handleOperator('+')} className="h-16 w-16 rounded-full bg-[#ff9f0a] text-white text-3xl font-medium">+</button>
              
              <button onClick={() => handleNumber('0')} className="h-16 w-[140px] col-span-2 rounded-full bg-[#333] text-white text-2xl flex items-center pl-7 active:bg-gray-600">0</button>
              <button onClick={() => handleNumber('.')} className="h-16 w-16 rounded-full bg-[#333] text-white text-2xl active:bg-gray-600">.</button>
              <button onClick={calculate} className="h-16 w-16 rounded-full bg-[#ff9f0a] text-white text-3xl font-medium active:bg-[#ffc166]">=</button>
            </div>
          </div>
          
          <div className="h-1 w-32 bg-white opacity-20 mx-auto mb-4 rounded-full"></div>

          {/* Secret Modal */}
          <AnimatePresence>
            {showConfig && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute inset-0 bg-[#0a0a0a]/95 z-20 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">Emergency Config</h2>
                <p className="text-gray-500 text-xs mb-8">Enter the secure contact number for encrypted SMS alerts.</p>
                <input 
                  type="text" 
                  placeholder="+1 (xxx) xxx-xxxx"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-white mb-6 outline-none focus:ring-2 ring-blue-500"
                />
                <div className="flex gap-3 w-full">
                  <button onClick={() => setShowConfig(false)} className="flex-1 bg-[#333] p-4 rounded-xl font-medium">Cancel</button>
                  <button onClick={saveContact} className="flex-1 bg-blue-600 p-4 rounded-xl font-medium">Save</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Security Terminal */}
        <div className="flex-1 flex flex-col h-full py-4 min-w-[320px] md:min-w-[400px]">
          <div className="mb-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-[#ff9f0a]/10 rounded-lg">
                 <Radio className="text-[#ff9f0a] w-6 h-6" />
               </div>
               <h1 className="text-4xl font-bold tracking-tight text-[#ff9f0a]">AIGES <span className="text-white font-thin">Silent Alert</span></h1>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-[0.3em] font-bold">Internal Security Protocol v4.0.2 • Active Deployment</p>
          </div>

          <div className="flex-grow bg-[#111] border border-[#222] rounded-3xl p-6 font-mono text-xs relative overflow-hidden shadow-inner flex flex-col">
            <div className="absolute top-4 right-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[9px] text-red-500 uppercase font-black tracking-widest">Live Monitoring</span>
            </div>
            <div className="flex items-center gap-2 mb-4 text-[#333]">
              <Terminal size={14} />
              <span className="uppercase text-[10px] tracking-widest font-bold">Secure OS Logs</span>
            </div>
            
            <div className="space-y-4 overflow-y-auto max-h-[300px] flex-1 pr-2 scrollbar-hide">
              {logs.map(log => (
                <div key={log.id} className="flex gap-4 group">
                  <span className="text-[#333] font-bold shrink-0">[{log.time}]</span>
                  <span className={`${
                    log.type === 'red' ? 'text-red-500 font-bold' : 
                    log.type === 'green' ? 'text-green-400' : 
                    'text-gray-400'
                  } break-words leading-relaxed`}>
                    {log.msg}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-gray-700 italic">No events recorded...</div>}
            </div>

            {/* Bottom info section */}
            <div className="mt-6 pt-6 border-t border-[#222] grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] text-gray-600 uppercase mb-2 font-bold select-none">Encrypted Payload</p>
                  <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-green-500" 
                      animate={{ width: isEmergency ? '100%' : '15%' }}
                    />
                  </div>
               </div>
               <div>
                  <p className="text-[10px] text-gray-600 uppercase mb-2 font-bold select-none">Relay Status</p>
                  <p className="text-blue-500 text-[10px] items-center flex gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> STANDBY
                  </p>
               </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-5 bg-[#1a1a1a] rounded-2xl border border-[#333] transition-all hover:border-[#444]">
              <p className="text-[10px] text-gray-500 uppercase mb-2 font-bold tracking-widest">Tactical Trigger</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium">Double-tap [AC]</p>
                <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
              </div>
            </div>
            <div className="p-5 bg-[#1a1a1a] rounded-2xl border border-[#333] transition-all hover:border-[#444]">
              <p className="text-[10px] text-gray-500 uppercase mb-2 font-bold tracking-widest">Admin Override</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium">Code: 8008=</p>
                <div className="w-2 h-2 rounded-full bg-[#ff9f0a]/50"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

