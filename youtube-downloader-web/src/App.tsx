import { useState, useEffect } from 'react';
import { Search, Download, Youtube, Loader2, Music, Video, AlertCircle, Eye, ListVideo, HardDrive, Settings, RefreshCw, Film, History, X, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Format {
  itag: number;
  qualityLabel: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  fileSize?: string;
}

interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  lengthSeconds: string;
  viewCount: string;
  formats: Format[];
}

interface PlaylistItem {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
}

interface PlaylistInfo {
  title: string;
  author: string;
  thumbnail: string;
  itemCount: number;
  views: number;
  items: PlaylistItem[];
}

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  format: string;
  thumbnail: string;
  timestamp: number;
}

type Mode = 'video' | 'playlist';
type TargetFormat = '1080' | '720' | '480' | '360' | 'mp3' | 'm4a' | 'flac' | 'wav';

interface DownloadTask {
  internalId: string;
  url: string;
  title: string;
  thumbnail: string;
  format: string;
  loaderId?: string;
  status: 'pending' | 'preparing' | 'finished' | 'error';
  progress: number;
  statusText: string;
  finalUrl?: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<Mode>('video');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  
  const [selectedItag, setSelectedItag] = useState<number | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('1080');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickPreviewData, setQuickPreviewData] = useState<any>(null);
  
  // Managing active downloads
  const [activeTasks, setActiveTasks] = useState<DownloadTask[]>([]);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yt_download_history');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return []; }
      }
    }
    return [];
  });

  useEffect(() => {
    if (historyOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [historyOpen]);

  useEffect(() => {
    localStorage.setItem('yt_download_history', JSON.stringify(history));
  }, [history]);

  const fetchInfo = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setPlaylistInfo(null);

    const isPlaylistUrl = url.includes('list=');
    const fetchMode = isPlaylistUrl ? 'playlist' : mode;
    if (isPlaylistUrl && mode !== 'playlist') {
      setMode('playlist');
    }

    try {
      if (fetchMode === 'playlist') {
        const res = await fetch(`/api/playlist?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch playlist details');
        setPlaylistInfo(data);
      } else {
        // Instant single video resolving via oembed
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (!res.ok) throw new Error("Could not find video details or video is private.");
        const data = await res.json();
        
        setVideoInfo({
          title: data.title,
          author: data.author_name,
          thumbnail: data.thumbnail_url,
          lengthSeconds: '0', 
          viewCount: '0',
          formats: [] // Unused now
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickPreview = async (videoUrl: string) => {
    if (!videoUrl || videoInfo || playlistInfo) return;
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setQuickPreviewData(data);
      } else {
        setQuickPreviewData(null);
      }
    } catch (err) {
      setQuickPreviewData(null);
    }
  };

  // Active Background Polling for Tasks
  useEffect(() => {
    if (activeTasks.length === 0) return;

    const interval = setInterval(async () => {
      const pendingTasks = activeTasks.filter(t => t.status === 'preparing');
      if (pendingTasks.length === 0) return;

      const updatedTasks = await Promise.all(pendingTasks.map(async (task) => {
        if (!task.loaderId) return task;
        try {
           const pRes = await fetch(`/api/loader/progress?id=${task.loaderId}`);
           const pData = await pRes.json();
           
           if (pData.success === 1 || pData.download_url) {
             return { ...task, status: 'finished', progress: 100, statusText: 'Ready', finalUrl: pData.download_url };
           } else if (pData.text && pData.text.includes("Error")) {
             return { ...task, status: 'error', statusText: 'Error', progress: 0 };
           } else {
             const prog = parseInt(pData.progress, 10);
             return { ...task, progress: isNaN(prog) ? task.progress : (prog / 10), statusText: pData.text || 'Preparing' };
           }
        } catch(e) {
           return task;
        }
      }));

      // Merge back
      let hasChanges = false;
      setActiveTasks(prev => {
        const next = [...prev];
        updatedTasks.forEach(ut => {
          const idx = next.findIndex(n => n.internalId === ut.internalId);
          if (idx !== -1 && (next[idx].progress !== ut.progress || next[idx].status !== ut.status)) {
            next[idx] = ut;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });

    }, 2500);

    return () => clearInterval(interval);
  }, [activeTasks]);


  const executeDownload = async (downloadUrl: string, format: string, title: string, thumbnail: string) => {
    const internalId = Math.random().toString(36).substring(7);
    
    // Add to history
    const newItem: HistoryItem = {
      id: Date.now().toString() + internalId,
      title: title || 'YouTube Video',
      url: downloadUrl,
      format: format,
      thumbnail: thumbnail || '',
      timestamp: Date.now()
    };
    
    setHistory(prev => [newItem, ...prev.filter(i => i.url !== downloadUrl || i.format !== format)].slice(0, 100));

    // Register active task
    setActiveTasks(prev => [{
       internalId, url: downloadUrl, title, thumbnail, format, status: 'pending', progress: 0, statusText: 'Requesting...'
    }, ...prev]);

    // Request download initiator
    try {
        const lRes = await fetch(`/api/loader/download?url=${encodeURIComponent(downloadUrl)}&format=${format}`);
        const lData = await lRes.json();
        
        if (lData.success && lData.id) {
           setActiveTasks(prev => prev.map(t => 
             t.internalId === internalId ? { ...t, status: 'preparing', loaderId: lData.id, statusText: 'Initialized' } : t
           ));
        } else {
           setActiveTasks(prev => prev.map(t => 
             t.internalId === internalId ? { ...t, status: 'error', statusText: lData.message || 'Error initializing' } : t
           ));
        }
    } catch(e) {
        setActiveTasks(prev => prev.map(t => 
          t.internalId === internalId ? { ...t, status: 'error', statusText: 'Network Error' } : t
        ));
    }
  };

  const handleSingleDownload = () => {
    if (!url || !videoInfo) return;
    executeDownload(url, targetFormat, videoInfo.title, videoInfo.thumbnail);
  };

  const handlePlaylistDownloadItem = (item: PlaylistItem) => {
    executeDownload(item.url, targetFormat, item.title, item.thumbnail);
  };

  const handleBatchDownload = () => {
    if (!playlistInfo) return;
    playlistInfo.items.forEach((item, index) => {
      setTimeout(() => {
        handlePlaylistDownloadItem(item);
      }, index * 1000); 
    });
  };

  const removeHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const formatDuration = (secondsStr: string) => {
    const sec = parseInt(secondsStr, 10);
    if (isNaN(sec)) return '0:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (viewsStr: string | number) => {
    const views = typeof viewsStr === 'string' ? parseInt(viewsStr, 10) : viewsStr;
    if (isNaN(views)) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return 'Unknown';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'Unknown';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const timeAgo = (timestamp: number) => {
    const min = Math.floor((Date.now() - timestamp) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-red-500/30">
      
      {/* Top Navigation */}
      <nav className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Youtube className="w-6 h-6 text-red-600" />
            <span className="font-semibold text-white tracking-tight text-lg">Downloader Pro</span>
          </div>
          <button 
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-lg"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 relative z-10">
        
        {/* Header Options */}
        <header className="mb-8 flex justify-center">
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl shadow-lg">
            <button 
              onClick={() => setMode('video')}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'video' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <Film className="w-4 h-4" /> Single Video
            </button>
            <button 
              onClick={() => setMode('playlist')}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'playlist' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <ListVideo className="w-4 h-4" /> Playlist
            </button>
          </div>
        </header>

        {/* Input Area */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl relative z-20">
          <div className="flex flex-col md:flex-row gap-2 relative">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder={mode === 'video' ? 'Paste YouTube Video URL...' : 'Paste YouTube Playlist URL (contains list=)...'}
                className="w-full bg-neutral-800/50 hover:bg-neutral-800 focus:bg-neutral-800 text-white rounded-xl pl-12 pr-4 py-4 outline-none border border-transparent focus:border-neutral-700 transition-all text-lg placeholder:text-neutral-600"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setQuickPreviewData(null); }}
                onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                onBlur={() => fetchQuickPreview(url)}
              />
            </div>
            <button 
              onClick={fetchInfo}
              disabled={loading || !url}
              className="bg-white hover:bg-neutral-200 text-black px-8 py-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze'}
            </button>
          </div>
        </section>

        {/* Quick Preview Card */}
        <AnimatePresence>
          {quickPreviewData && !videoInfo && !playlistInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden relative z-10"
            >
              <div className="flex gap-4 p-4 rounded-xl bg-[#151515] border border-[#222]">
                <img 
                  src={quickPreviewData.thumbnail_url} 
                  alt="Thumbnail" 
                  className="w-24 h-16 rounded-md object-cover brightness-90 border border-[#333]" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col justify-center">
                  <h3 className="text-sm font-medium text-[#DDD] line-clamp-2 leading-snug">
                    {quickPreviewData.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#666]">
                    <CheckCircle2 size={12} className="text-green-500" /> Source verified
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversion Settings Panel */}
        {(videoInfo || playlistInfo) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 bg-neutral-900/50 border border-neutral-800 rounded-xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 w-full">
              <Settings className="w-5 h-5 text-neutral-500" />
              <span className="font-medium">Output Quality & Format:</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              <div className="flex flex-wrap bg-black/20 p-1.5 rounded-xl border border-neutral-800 items-center">
                 <div className="px-3 py-1 text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5 border-r border-neutral-800 mr-1.5 shrink-0"><Video size={14}/> Video</div>
                 <div className="flex flex-wrap gap-1">
                   {(['1080', '720', '480', '360'] as TargetFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTargetFormat(f)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all uppercase ${
                          targetFormat === f 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        {f}p
                      </button>
                    ))}
                 </div>
              </div>
              <div className="flex flex-wrap bg-black/20 p-1.5 rounded-xl border border-neutral-800 items-center">
                 <div className="px-3 py-1 text-xs font-bold text-neutral-500 uppercase flex items-center gap-1.5 border-r border-neutral-800 mr-1.5 shrink-0"><Music size={14}/> Audio</div>
                 <div className="flex flex-wrap gap-1">
                   {(['mp3', 'm4a', 'flac', 'wav'] as TargetFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTargetFormat(f)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all uppercase ${
                          targetFormat === f 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6 flex items-center gap-3 bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* ------------- SINGLE VIDEO UI ------------- */}
          {videoInfo && !playlistInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Media Preview */}
              <div className="lg:col-span-1 space-y-4">
                <div className="aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 relative group">
                  <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md">
                    {formatDuration(videoInfo.lengthSeconds)}
                  </div>
                </div>
                <h2 className="text-xl font-medium text-white line-clamp-2 md:leading-snug">{videoInfo.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                  <span>{videoInfo.author}</span>
                  <div className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> <span>{formatViews(videoInfo.viewCount)}</span></div>
                </div>
              </div>

              {/* Download Options */}
              <div className="lg:col-span-2 space-y-6 bg-neutral-900/40 p-6 md:p-8 rounded-2xl border border-neutral-800/50 flex flex-col justify-center">
                <div className="text-center bg-black/20 rounded-xl border border-neutral-800 p-8">
                   <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                     <Download className="w-8 h-8 text-red-500" />
                   </div>
                   <h3 className="text-xl font-medium text-white mb-2">Ready to Prepare Download</h3>
                   <p className="text-neutral-400 max-w-sm mx-auto text-sm leading-relaxed mb-6">
                      Click below to queue the video for preparation at <strong className="uppercase text-white border-b border-white/30">{targetFormat}{(!targetFormat.match(/mp3|m4a|flac|wav/) ? 'p' : '')}</strong> quality. Handled seamlessly by fast cloud processors, perfectly bypassing any bot checks.
                   </p>
                   <button 
                      onClick={handleSingleDownload}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors focus:ring-4 focus:ring-red-600/30 outline-none shadow-xl shadow-red-900/20 active:scale-[0.99]"
                    >
                      <Download className="w-5 h-5" />
                      Queue Download
                    </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ------------- PLAYLIST UI ------------- */}
          {playlistInfo && !videoInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10 w-full md:w-auto">
                  <div className="shrink-0 relative group">
                    <img src={playlistInfo.thumbnail} alt="Playlist" className="w-full max-w-[200px] sm:w-40 aspect-video object-cover rounded-xl border border-neutral-800 shadow-xl" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <ListVideo className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{playlistInfo.title}</h2>
                    <div className="flex flex-wrap text-sm text-neutral-400 items-center gap-x-5 gap-y-2">
                      <span className="text-neutral-200 font-medium">{playlistInfo.author}</span>
                      <span className="flex items-center gap-1.5"><ListVideo className="w-4 h-4" /> {playlistInfo.itemCount} videos</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {formatViews(playlistInfo.views)} views</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleBatchDownload}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg shrink-0 w-full md:w-auto transition-all shadow-xl shadow-red-900/20 active:scale-95"
                >
                  <Download className="w-5 h-5" /> Download All
                </button>
              </div>

              <div className="grid gap-3">
                {playlistInfo.items.map((item, index) => (
                  <div key={`playlist-${item.id}-${index}`} className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-neutral-800 transition-all shadow-sm">
                    <div className="text-neutral-500 font-mono text-sm w-6 text-center shrink-0">{index + 1}</div>
                    <div className="relative w-full sm:w-32 aspect-video shrink-0 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-white backdrop-blur-sm">{item.duration}</div>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="text-neutral-200 font-medium line-clamp-2 mb-1.5 leading-snug">{item.title}</h4>
                      <p className="text-xs text-neutral-500">{item.author}</p>
                    </div>
                    <button 
                      onClick={() => handlePlaylistDownloadItem(item)}
                      className="bg-neutral-800 hover:bg-white hover:text-black border border-neutral-700 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all w-full sm:w-auto shrink-0 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Get
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Slide-over Panel */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-neutral-950 border-l border-neutral-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="h-16 px-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/50">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-neutral-400" />
                  <h2 className="text-lg font-semibold text-white">Downloads</h2>
                </div>
                <button 
                  onClick={() => setHistoryOpen(false)}
                  className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
                {/* Active Downloads */}
                {activeTasks.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                       Active Downloads <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full">{activeTasks.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {activeTasks.map(task => (
                        <div key={task.internalId} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-sm">
                          <div className="flex justify-between text-xs mb-3">
                            <span className="font-medium text-neutral-200 truncate pr-3 max-w-[200px]">{task.title}</span>
                            <span className="text-neutral-500 uppercase font-bold text-[10px]">{task.format}</span>
                          </div>
                          
                          {task.status === 'finished' ? (
                            <div className="flex gap-2">
                              <a href={task.finalUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg flex justify-center items-center gap-1.5 shadow-lg shadow-green-900/20 transition-colors">
                                <Download size={14} /> Save
                              </a>
                              <button onClick={() => setActiveTasks(prev => prev.filter(t => t.internalId !== task.internalId))} className="px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors"><Trash2 size={14}/></button>
                            </div>
                          ) : task.status === 'error' ? (
                            <div className="text-xs text-red-400 p-2 bg-red-950/30 rounded-lg border border-red-900/30 flex justify-between items-center">
                              {task.statusText}
                              <button onClick={() => setActiveTasks(prev => prev.filter(t => t.internalId !== task.internalId))} className="text-neutral-500 hover:text-white"><Trash2 size={14}/></button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] text-neutral-400 font-medium tracking-tight">
                                  <span className="truncate">{task.statusText}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="tabular-nums">{Math.round(task.progress)}%</span>
                                    <button onClick={() => setActiveTasks(prev => prev.filter(t => t.internalId !== task.internalId))} className="text-neutral-500 hover:text-red-500"><X size={12}/></button>
                                  </div>
                              </div>
                              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-900">
                                  <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Downloads */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Past Downloads</h3>
                      {history.length > 0 && (
                        <button 
                          onClick={clearHistory}
                          className="text-xs text-neutral-500 hover:text-red-400 font-medium transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                   </div>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-neutral-600 text-sm border border-dashed border-neutral-800 rounded-xl">
                      <Clock className="w-8 h-8 opacity-40 mx-auto mb-3" />
                      <p>No past downloads.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl flex gap-3 group relative hover:border-neutral-700 transition-colors"
                        >
                          <div className="w-20 aspect-video bg-neutral-950 rounded-lg overflow-hidden shrink-0 relative">
                            {item.thumbnail ? (
                              <img 
                        src={item.thumbnail || undefined} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-5 h-5 text-neutral-700" />
                              </div>
                            )}
                            <div className="absolute bottom-0 right-0 bg-black/80 px-1 py-0.5 rounded-tl text-[9px] font-bold text-white uppercase backdrop-blur-sm">
                              {item.format}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                            <h4 className="text-sm font-medium text-neutral-200 line-clamp-2 leading-snug">{item.title}</h4>
                            <p className="text-[10px] text-neutral-500 mt-1">{timeAgo(item.timestamp)}</p>
                            <button 
                              onClick={() => executeDownload(item.url, item.format, item.title, item.thumbnail)}
                              className="text-[10px] text-red-500 hover:text-red-400 font-bold self-start flex items-center gap-1 mt-1.5"
                            >
                              <RefreshCw className="w-3 h-3" /> Re-trigger
                            </button>
                          </div>

                          <button 
                            onClick={() => removeHistoryItem(item.id)}
                            className="absolute top-2 right-2 p-1.5 text-neutral-600 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-all"
                            title="Remove from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
      `}</style>
    </div>
  );
}
