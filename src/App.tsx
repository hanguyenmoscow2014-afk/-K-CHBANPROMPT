import React, { useState } from "react";
import { 
  FileText, 
  Video, 
  Upload,
  Download,
  Link as LinkIcon, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Image as ImageIcon, 
  Film,
  Type
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Segment {
  timeRange: string;
  content: string;
  imagePrompt: string;
  videoPrompt: string;
}

interface ScriptData {
  segments: Segment[];
  srt: string;
  imagePromptsBlock: string;
  videoPromptsBlock: string;
}

export default function App() {
  const [input, setInput] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const getDirectVideoUrl = () => {
    const urlPattern = /(https?:\/\/[^\s]+(\.mp4|\.mov|\.avi|\.mkv))/i;
    const match = input.match(urlPattern);
    return match ? match[0] : null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        setSourceFile(file);
        // Automatically add context to text input if empty
        if (!input) {
          setInput(`Phân tích và viết lại kịch bản dựa trên video: ${file.name}`);
        }
      } else {
        alert("Vui lòng chọn một tệp video.");
      }
    }
  };

  const downloadSourceFile = () => {
    if (!sourceFile) return;
    const url = URL.createObjectURL(sourceFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = sourceFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, duration }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Lỗi máy chủ (${response.status})`);
      }
      
      setData(result);
    } catch (error: any) {
      console.error("Error generating script:", error);
      setError(error.message || "Không xác định");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, blockName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(blockName);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">MasterScript AI</h1>
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            Biên kịch & Kỹ sư Prompt Chuyên nghiệp
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <h2>Nội dung gốc</h2>
            </div>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors text-sm">
              <Upload size={16} />
              <span>Tải video lên</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {sourceFile && (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <Film size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-900 truncate max-w-[200px] md:max-w-md">
                    {sourceFile.name}
                  </p>
                  <p className="text-xs text-indigo-600">
                    {(sourceFile.size / (1024 * 1024)).toFixed(2)} MB • Tệp video nguồn
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadSourceFile}
                  className="p-2 hover:bg-white rounded-lg text-indigo-600 transition-colors"
                  title="Tải video nguồn"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setSourceFile(null)}
                  className="p-2 hover:bg-white rounded-lg text-red-500 transition-colors"
                  title="Gỡ bỏ"
                >
                  <Check size={18} className="rotate-45" />
                </button>
              </div>
            </div>
          )}

          {getDirectVideoUrl() && !sourceFile && (
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-amber-600 p-2 rounded-lg text-white">
                  <LinkIcon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 truncate max-w-[200px] md:max-w-md">
                    Phát hiện liên kết video trực tiếp
                  </p>
                </div>
              </div>
              <a
                href={getDirectVideoUrl()!}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 hover:bg-white rounded-lg text-amber-600 transition-colors"
                title="Tải video từ liên kết"
              >
                <Download size={18} />
              </a>
            </div>
          )}

          <p className="text-sm text-slate-500">
            Dán liên kết, bản ghi video hoặc bất kỳ văn bản nào để viết lại thành kịch bản sáng tạo chuyên nghiệp.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                Thời lượng kịch bản mong muốn
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng cộng:</span>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {duration >= 60 
                    ? `${Math.floor(duration / 60)} phút ${duration % 60} giây` 
                    : `${duration} giây`
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 relative group">
                <input
                  type="number"
                  min="1"
                  max="7200"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDuration(Math.min(7200, Math.max(0, val)));
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="Nhập số giây..."
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giây</span>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {[
                  { label: "1 Phút", val: 60 },
                  { label: "5 Phút", val: 300 },
                  { label: "10 Phút", val: 600 },
                  { label: "30 Phút", val: 1800 }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setDuration(item.val)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                      duration === item.val 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-slate-400 italic">
                * Hỗ trợ tối đa 7200 giây (120 phút).
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDuration(Math.max(1, duration - 10))}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  -10s
                </button>
                <button 
                  onClick={() => setDuration(Math.min(7200, duration + 10))}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  +10s
                </button>
                <button 
                  onClick={() => setDuration(Math.min(7200, duration + 60))}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  +1m
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <textarea
              className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Dán nội dung của bạn vào đây..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !input}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Viết lại kịch bản
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm"
            >
              <div className="bg-red-600 p-1.5 rounded-lg text-white mt-0.5">
                <Check size={14} className="rotate-45" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Đã xảy ra lỗi khi tạo kịch bản:</p>
                <p className="opacity-80">{error}</p>
                <button 
                  onClick={handleGenerate}
                  className="mt-2 text-red-800 font-bold hover:underline"
                >
                  Thử lại
                </button>
              </div>
            </motion.div>
          )}
        </section>

        <AnimatePresence>
          {data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Output Table */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-900">
                    <Type size={20} />
                    Kịch bản chi tiết
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4 flex items-center gap-2 w-32"><Clock size={14} /> Thời gian</th>
                        <th className="px-6 py-4">Nội dung / Lời thoại</th>
                        <th className="px-6 py-4"><ImageIcon size={14} /> Prompt Ảnh</th>
                        <th className="px-6 py-4"><Film size={14} /> Prompt Video</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.segments.map((seg, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 align-top font-mono text-sm text-indigo-600">{seg.timeRange}</td>
                          <td className="px-6 py-4 align-top text-sm leading-relaxed text-slate-700">{seg.content}</td>
                          <td className="px-6 py-4 align-top text-xs text-slate-500 italic max-w-xs">{seg.imagePrompt}</td>
                          <td className="px-6 py-4 align-top text-xs text-slate-500 italic max-w-xs">{seg.videoPrompt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Code Blocks */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* SRT Block */}
                <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2">
                      <FileText size={18} className="text-indigo-400" />
                      Phụ đề SRT
                    </span>
                    <button 
                      onClick={() => copyToClipboard(data.srt, 'srt')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedBlock === 'srt' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono bg-slate-800/50 p-4 rounded-xl h-48 overflow-y-auto custom-scrollbar">
                    {data.srt}
                  </pre>
                </div>

                {/* Image Prompts Block */}
                <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2">
                      <ImageIcon size={18} className="text-pink-400" />
                      Prompt Hình ảnh
                    </span>
                    <button 
                      onClick={() => copyToClipboard(data.imagePromptsBlock, 'image')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedBlock === 'image' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono bg-slate-800/50 p-4 rounded-xl h-48 overflow-y-auto custom-scrollbar">
                    {data.imagePromptsBlock}
                  </pre>
                </div>

                {/* Video Prompts Block */}
                <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2">
                      <Film size={18} className="text-amber-400" />
                      Prompt Video
                    </span>
                    <button 
                      onClick={() => copyToClipboard(data.videoPromptsBlock, 'video')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedBlock === 'video' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono bg-slate-800/50 p-4 rounded-xl h-48 overflow-y-auto custom-scrollbar">
                    {data.videoPromptsBlock}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!data && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
            <div className="bg-slate-100 p-6 rounded-full">
              <Video size={48} className="opacity-20" />
            </div>
            <p className="text-center max-w-sm">
              Kịch bản sáng tạo chuyên nghiệp của bạn sẽ xuất hiện tại đây sau khi tạo.
            </p>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
