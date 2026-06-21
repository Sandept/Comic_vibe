"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { pusherClient } from "@/lib/pusher";

type Panel = {
  id: string;
  created_at: string;
  text: string;
  image_url: string;
};

type Tab = 'studio' | 'vault';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');
  const [panels, setPanels] = useState<Panel[]>([]);
  const [stagingPanel, setStagingPanel] = useState<Panel | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const vaultTopRef = useRef<HTMLDivElement>(null);

  // Fetch initial panels from Supabase
  useEffect(() => {
    const fetchPanels = async () => {
      const { data, error } = await supabase
        .from('panels')
        .select('*')
        .order('created_at', { ascending: false }); // Newest first for the Vault
      
      if (!error && data) {
        setPanels(data);
      }
    };
    fetchPanels();
  }, []);

  // Listen for real-time updates via Pusher
  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe('comic-vibe');
    
    channel.bind('new-panel', async (eventData: { id: string }) => {
      const { data, error } = await supabase
        .from('panels')
        .select('*')
        .eq('id', eventData.id)
        .single();
      
      if (data && !error) {
        setPanels((current) => {
          if (current.some(p => p.id === data.id)) return current;
          return [data, ...current]; // Add to top of Vault
        });
      }
    });

    channel.bind('clear-panels', () => {
      setPanels([]);
    });

    channel.bind('delete-panel', (data: { id: string }) => {
      setPanels((current) => current.filter(p => p.id !== data.id));
    });

    return () => {
      if (pusherClient) pusherClient.unsubscribe('comic-vibe');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setStagingPanel(null); // Clear previous
    const textToSubmit = inputText;
    setInputText("");

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to draw: ${errorData.error || 'Server error'}`);
        setInputText(textToSubmit);
      } else {
        const { panel } = await res.json();
        setStagingPanel(panel);
      }
    } catch (error) {
      console.error("Failed to generate panel:", error);
      alert("Network error. Could not connect to AI.");
      setInputText(textToSubmit);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (panel: Panel) => {
    const a = document.createElement("a");
    a.href = panel.image_url;
    a.download = `comic-vibe-${panel.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveStaging = async () => {
    if (!stagingPanel) return;
    const tempPanel = stagingPanel;
    setStagingPanel(null);
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tempPanel.text, image_url: tempPanel.image_url })
      });
      // Switch to vault to see it added
      setActiveTab('vault');
      vaultTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleCloseStaging = () => {
    setStagingPanel(null);
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* The Halftone Pop-Art Background */}
      <div className="halftone-bg"></div>

      {/* Navigation Bar */}
      <header className="comic-nav sticky top-0 z-50 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-400 border-[3px] border-gray-900 flex items-center justify-center font-black text-xl md:text-2xl shadow-[4px_4px_0px_rgba(17,24,39,1)] shrink-0">
            C!
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase" style={{ textShadow: '3px 3px 0px #111827' }}>
            ComicVibe
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setActiveTab('studio')}
            className={`comic-btn px-4 py-2 md:px-6 md:py-2 rounded-lg text-sm md:text-lg flex-1 md:flex-none whitespace-nowrap ${
              activeTab === 'studio' ? 'comic-btn-yellow bg-yellow-400' : 'bg-white'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`comic-btn px-4 py-2 md:px-6 md:py-2 rounded-lg text-sm md:text-lg flex-1 md:flex-none whitespace-nowrap ${
              activeTab === 'vault' ? 'comic-btn-yellow bg-yellow-400' : 'bg-white'
            }`}
          >
            Database Vault
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-sm font-black text-white uppercase bg-red-500 border-[3px] border-gray-900 px-4 py-2 rounded-full shadow-[4px_4px_0px_rgba(17,24,39,1)]">
          <div className="w-3 h-3 rounded-full bg-yellow-300 animate-pulse border-2 border-gray-900"></div>
          <span>Live Sync</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto w-full h-full p-4 md:p-8">
        
        {/* STUDIO TAB */}
        {activeTab === 'studio' && (
          <div className="max-w-5xl mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500 pt-8">
            
            {!stagingPanel && !isGenerating && (
              <div className="text-center mb-12 bg-white border-[4px] border-gray-900 p-8 rounded-xl shadow-[8px_8px_0px_rgba(17,24,39,1)]">
                <h2 className="text-5xl md:text-7xl font-black mb-4 uppercase text-red-500" style={{ textShadow: '4px 4px 0px #111827' }}>
                  Draw It!
                </h2>
                <p className="text-xl text-gray-900 font-bold uppercase tracking-wider">
                  Type a sentence below and create a comic panel.
                </p>
              </div>
            )}

            {/* Staging Area Display */}
            {stagingPanel && (
              <div className="w-full mb-12 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-500">
                <div className="comic-panel-classic aspect-video w-full group relative">
                  <div className="absolute top-0 left-0 bg-yellow-400 border-b-[4px] border-r-[4px] border-gray-900 text-gray-900 text-sm font-black tracking-widest uppercase px-4 py-2 z-50">
                    STAGING RENDER
                  </div>
                  
                  <img src={stagingPanel.image_url} alt={stagingPanel.text} className="absolute inset-0 w-full h-full object-cover z-0 border-b-[4px] border-gray-900" />
                  
                  <div className="comic-text-classic flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <p className="w-full md:max-w-[60%] text-sm md:text-base">
                      {stagingPanel.text}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap md:flex-nowrap gap-2 z-50 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => setPreviewImage(stagingPanel.image_url)}
                        className="comic-btn px-3 py-2 bg-blue-400 rounded text-base md:text-xl flex-1 md:flex-none"
                        title="Preview"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => handleDownload(stagingPanel)}
                        className="comic-btn px-3 py-2 bg-white rounded text-base md:text-xl flex-1 md:flex-none"
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button 
                        onClick={handleSaveStaging}
                        className="comic-btn comic-btn-orange px-4 py-2 rounded text-sm md:text-lg flex-1 md:flex-none"
                      >
                        💾 Publish!
                      </button>
                      <button 
                        onClick={handleCloseStaging}
                        className="comic-btn comic-btn-red px-3 py-2 rounded text-base md:text-xl flex-1 md:flex-none"
                        title="Discard"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generating State */}
            {isGenerating && (
              <div className="w-full mb-12 aspect-video bg-yellow-300 border-[4px] border-gray-900 shadow-[8px_8px_0px_rgba(17,24,39,1)] rounded-xl flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 border-[6px] border-gray-900 border-t-red-500 rounded-full animate-spin mb-6"></div>
                <p className="text-3xl text-gray-900 font-black uppercase tracking-widest">Drawing...</p>
              </div>
            )}

            {/* Studio Input */}
            <div className="w-full mt-auto md:mt-0 z-40 pb-[env(safe-area-inset-bottom)]">
              <form 
                onSubmit={handleSubmit}
                className="bg-white border-[4px] border-gray-900 p-2 md:p-3 rounded-2xl flex items-center shadow-[8px_8px_0px_rgba(17,24,39,1)]"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isGenerating ? "Wait..." : "Describe a scene..."}
                  disabled={isGenerating}
                  className="flex-1 bg-transparent border-none text-gray-900 text-base md:text-xl font-bold px-2 md:px-4 py-2 md:py-3 focus:outline-none placeholder:text-gray-400 uppercase w-full min-w-0"
                  maxLength={150}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className="comic-btn comic-btn-red px-4 md:px-10 py-3 md:py-4 rounded-xl text-lg md:text-2xl shrink-0"
                >
                  DRAW!
                </button>
              </form>
            </div>
            
          </div>
        )}

        {/* VAULT TAB */}
        {activeTab === 'vault' && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <div ref={vaultTopRef}></div>
            
            <div className="flex justify-between items-end mb-8 bg-white border-[4px] border-gray-900 p-6 shadow-[8px_8px_0px_rgba(17,24,39,1)] rounded-xl inline-block">
              <h2 className="text-5xl font-black uppercase text-orange-500" style={{ textShadow: '3px 3px 0px #111827' }}>
                The Vault
              </h2>
            </div>

            {panels.length === 0 && (
              <div className="text-center py-32 bg-white border-[4px] border-gray-900 shadow-[8px_8px_0px_rgba(17,24,39,1)] rounded-xl">
                <p className="text-4xl text-gray-900 font-black uppercase">No comics yet!</p>
                <button onClick={() => setActiveTab('studio')} className="mt-6 text-red-500 hover:text-red-600 font-black text-2xl uppercase underline decoration-4 underline-offset-4">Go draw one!</button>
              </div>
            )}

            {/* Classic Comic Strip Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
              {panels.map((panel, i) => (
                <div 
                  key={panel.id} 
                  className={`comic-panel-classic group ${i % 3 === 0 ? 'md:col-span-2 aspect-[21/9]' : 'aspect-square'}`}
                >
                  <img src={panel.image_url} alt={panel.text} className="w-full h-full object-cover" />
                  
                  <div className="comic-text-classic">
                    {panel.text}
                  </div>
                  
                  {/* Hover Actions for Saved Panels (Always visible on mobile) */}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <button 
                      onClick={() => setPreviewImage(panel.image_url)}
                      className="comic-btn bg-blue-400 px-2 py-1 md:px-3 md:py-2 rounded text-sm md:text-lg"
                      title="Preview"
                    >
                      👁️
                    </button>
                    <button 
                      onClick={() => handleDownload(panel)}
                      className="comic-btn bg-white px-2 py-1 md:px-3 md:py-2 rounded text-sm md:text-lg"
                      title="Download"
                    >
                      ⬇️
                    </button>
                    <button 
                      onClick={() => handleDeleteSaved(panel.id)}
                      className="comic-btn comic-btn-red px-2 py-1 md:px-3 md:py-2 rounded text-sm md:text-lg"
                      title="Delete from Vault"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* FULL SCREEN IMAGE PREVIEW MODAL */}
        {previewImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Massive X Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-6 right-6 comic-btn comic-btn-red w-14 h-14 rounded-full flex items-center justify-center text-3xl z-50"
              title="Close Preview"
            >
              ❌
            </button>
            
            {/* The Image Wrapper with Comic Border */}
            <div className="relative max-w-full max-h-[90vh] bg-white border-[6px] border-gray-900 shadow-[12px_12px_0px_rgba(249,115,22,1)] rounded-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <img 
                src={previewImage} 
                alt="Full Screen Preview" 
                className="w-auto h-auto max-w-[90vw] max-h-[85vh] object-contain block" 
              />
            </div>
          </div>
        )}

      </main>
      
    </div>
  );
}
