import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  RefreshCw, 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Code, 
  Share2, 
  Palette,
  Maximize2,
  ChevronRight
} from 'lucide-react';

// --- Utility Functions ---

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; 
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const getLuminance = (r, g, b) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

// Simplified Color Quantization
const extractProminentColors = (ctx, width, height, sampleRate = 10) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const colorMap = {};
  const positionMap = {}; 

  const quantizationFactor = 64; 

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a < 128) continue; 

      const qr = Math.floor(r / quantizationFactor) * quantizationFactor;
      const qg = Math.floor(g / quantizationFactor) * quantizationFactor;
      const qb = Math.floor(b / quantizationFactor) * quantizationFactor;
      
      const key = `${qr},${qg},${qb}`;
      
      if (!colorMap[key]) {
        colorMap[key] = { count: 0, r: qr, g: qg, b: qb };
        positionMap[key] = { x, y }; 
      }
      colorMap[key].count++;
    }
  }

  const sortedColors = Object.values(colorMap).sort((a, b) => b.count - a.count);
  const palette = [];
  const usedKeys = new Set();
  
  const getActualColorAt = (x, y) => {
     const index = (y * width + x) * 4;
     return { r: data[index], g: data[index + 1], b: data[index + 2] };
  };

  let count = 0;
  for (let i = 0; i < sortedColors.length; i++) {
    if (count >= 5) break;
    const c = sortedColors[i];
    const key = `${c.r},${c.g},${c.b}`;
    const pos = positionMap[key];
    
    if (!usedKeys.has(key)) {
      const actual = getActualColorAt(pos.x, pos.y);
      const hsl = rgbToHsl(actual.r, actual.g, actual.b);
      palette.push({
        id: Date.now() + count,
        x: pos.x,
        y: pos.y,
        color: rgbToHex(actual.r, actual.g, actual.b),
        r: actual.r, g: actual.g, b: actual.b,
        h: hsl.h, s: hsl.s, l: hsl.l
      });
      usedKeys.add(key);
      count++;
    }
  }

  while (palette.length < 5) {
     const rx = Math.floor(Math.random() * width);
     const ry = Math.floor(Math.random() * height);
     const actual = getActualColorAt(rx, ry);
     const hsl = rgbToHsl(actual.r, actual.g, actual.b);
     palette.push({
         id: Date.now() + palette.length,
         x: rx,
         y: ry,
         color: rgbToHex(actual.r, actual.g, actual.b),
         r: actual.r, g: actual.g, b: actual.b,
         h: hsl.h, s: hsl.s, l: hsl.l
     });
  }
  return palette;
};

// --- Custom Hooks ---

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (ev) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return mousePosition;
};

// --- Components ---

const LoadingScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setOpacity(0), 400); 
                    setTimeout(onComplete, 1000); 
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 150);
        return () => clearInterval(timer);
    }, [onComplete]);

    if (opacity === 0) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ADD4E5] transition-opacity duration-700 ease-out"
            style={{ opacity }}
        >
             <div className="font-serif text-5xl italic text-[#017CC3] tracking-tighter mb-8 animate-pulse drop-shadow-sm">
                Prisma<span className="text-white font-sans not-italic text-sm tracking-[0.3em] ml-3 uppercase font-semibold">Studio</span>
             </div>
             <div className="w-64 h-[1px] bg-white/50 overflow-hidden relative">
                 <div 
                    className="absolute top-0 left-0 h-full bg-[#017CC3] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                 />
             </div>
        </div>
    );
};

const CustomCursor = ({ isHovering }) => {
    const { x, y } = useMousePosition();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouch) setIsVisible(true);
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            className="fixed top-0 left-0 pointer-events-none z-[100] mix-blend-multiply hidden md:block"
            style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
        >
            <div 
                className={`
                    absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#017CC3] transition-all duration-300 ease-out
                    ${isHovering ? 'w-12 h-12 bg-[#FFE9D2]/50 border-opacity-50' : 'w-5 h-5 bg-transparent'}
                `}
            />
             <div 
                className={`
                    absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#017CC3] transition-all duration-150 ease-out
                    ${isHovering ? 'w-1 h-1' : 'w-1.5 h-1.5'}
                `}
            />
        </div>
    );
};

const ColorCard = ({ colorData, onClick, onDelete, isActive, onMouseEnter, onMouseLeave, index }) => {
  return (
    <div 
      onClick={() => onClick(colorData)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        group relative flex items-center p-4 gap-5
        bg-white/80 backdrop-blur-md rounded-xl border border-white/40 transition-all duration-500 cursor-none
        hover:shadow-xl hover:shadow-[#017CC3]/10 hover:bg-white
        animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards
        ${isActive 
          ? 'border-[#017CC3] shadow-lg shadow-[#017CC3]/10 scale-[1.01]' 
          : 'hover:translate-x-1'
        }
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Color Preview */}
      <div 
        className="w-12 h-12 rounded-lg shadow-sm flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ring-1 ring-black/5"
        style={{ backgroundColor: colorData.color }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-serif text-2xl text-[#017CC3] leading-none mb-2 tracking-wide font-medium">
          {colorData.color}
        </h3>
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-sans font-semibold text-[#017CC3]/60 tracking-widest uppercase">
                HSL {colorData.h}° {colorData.s}% {colorData.l}%
            </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(colorData.id);
          }}
          className="p-2 text-[#017CC3]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
         <button 
          className="p-2 text-[#017CC3]/40 hover:text-[#017CC3] hover:bg-[#ADD4E5]/30 rounded-lg transition-colors"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
};

const Indicator = ({ x, y, color, isActive, onMouseDown, containerWidth, containerHeight, onMouseEnter, onMouseLeave }) => {
  const left = (x / containerWidth) * 100;
  const top = (y / containerHeight) * 100;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-none group z-20 touch-none"
      style={{ left: `${left}%`, top: `${top}%` }}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Target Crosshair */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none`}>
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/80 drop-shadow-md"></div>
          <div className="absolute top-0 left-1/2 h-full w-[1px] bg-white/80 drop-shadow-md"></div>
      </div>

      {/* Main Ring */}
      <div 
        className={`
          relative w-5 h-5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${isActive ? 'scale-150 ring-2 ring-[#017CC3] ring-offset-2 ring-offset-white' : 'hover:scale-125 ring-1 ring-white'}
        `}
        style={{ backgroundColor: color, border: '2px solid white' }}
      />
      
      {/* Elegant Tag */}
      <div className={`
        absolute left-1/2 -translate-x-1/2 mt-5 px-3 py-1.5 
        bg-white/90 backdrop-blur-xl shadow-xl border border-[#ADD4E5]/30
        text-[#017CC3] text-xs font-serif italic whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0
        pointer-events-none z-30 rounded-full
      `}>
        {color}
      </div>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, onMouseEnter, onMouseLeave }) => {
  const baseStyle = "px-6 py-3.5 rounded-xl font-sans text-xs tracking-[0.15em] uppercase font-semibold transition-all flex items-center gap-3 active:scale-95 cursor-none backdrop-blur-sm shadow-lg";
  const variants = {
    // Champagne Button (Warmth against Blue BG)
    primary: "bg-[#FFE9D2] text-[#017CC3] hover:bg-white hover:shadow-[0_10px_20px_-5px_rgba(255,233,210,0.8)] border border-[#FFE9D2]/50",
    // Steel Blue Outline
    secondary: "bg-[#017CC3]/10 text-[#017CC3] border border-[#017CC3]/20 hover:bg-[#017CC3]/20 hover:border-[#017CC3]/40 shadow-none hover:shadow-lg",
    ghost: "text-[#017CC3]/70 hover:text-[#017CC3] hover:bg-white/20 bg-transparent shadow-none",
  };

  return (
    <button 
        onClick={onClick} 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
      {Icon && <Icon size={14} />}
    </button>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [palette, setPalette] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Hover state for custom cursor
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Logic ---

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageSrc(event.target.result);
        setDimensions({ width: img.width, height: img.height });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const extracted = extractProminentColors(ctx, img.width, img.height, Math.max(1, Math.floor(Math.min(img.width, img.height) / 50)));
        setPalette(extracted);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadSampleImage = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const grd = ctx.createLinearGradient(0, 0, 800, 600);
      grd.addColorStop(0, "#FFE9D2"); // Champagne
      grd.addColorStop(0.5, "#ADD4E5"); // Light Blue
      grd.addColorStop(1, "#017CC3"); // Steel Blue
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,800,600);
      
      const dataUrl = canvas.toDataURL();
      const img = new Image();
      img.onload = () => {
          setImage(img);
          setImageSrc(dataUrl);
          setDimensions({width: 800, height: 600});
          const extracted = extractProminentColors(ctx, 800, 600, 20);
          setPalette(extracted);
      };
      img.src = dataUrl;
  };

  const clearImage = () => {
    setImage(null);
    setImageSrc(null);
    setPalette([]);
  };

  const getColorAtPosition = (x, y) => {
    if (!image) return { hex: '#000000', r: 0, g: 0, b: 0, h:0, s:0, l:0 };
    const canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, x, y, 1, 1, 0, 0, 1, 1);
    const p = ctx.getImageData(0, 0, 1, 1).data;
    const hsl = rgbToHsl(p[0], p[1], p[2]);
    return {
      hex: rgbToHex(p[0], p[1], p[2]),
      r: p[0], g: p[1], b: p[2],
      h: hsl.h, s: hsl.s, l: hsl.l
    };
  };

  const handleAddColor = () => {
      if (!image) return;
      const offsetX = Math.floor((Math.random() - 0.5) * 50);
      const offsetY = Math.floor((Math.random() - 0.5) * 50);
      let newX = Math.floor(dimensions.width / 2) + offsetX;
      let newY = Math.floor(dimensions.height / 2) + offsetY;
      newX = Math.max(0, Math.min(newX, dimensions.width - 1));
      newY = Math.max(0, Math.min(newY, dimensions.height - 1));

      const c = getColorAtPosition(newX, newY);
      setPalette(prev => [...prev, { id: Date.now(), x: newX, y: newY, color: c.hex, ...c }]);
  };

  const handleRemoveColor = (id) => setPalette(prev => prev.filter(p => p.id !== id));

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging || activeId === null || !containerRef.current || !image) return;
    const rect = containerRef.current.getBoundingClientRect();
    let relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    let relativeY = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const scaleX = dimensions.width / rect.width;
    const scaleY = dimensions.height / rect.height;
    const nativeX = Math.floor(relativeX * scaleX);
    const nativeY = Math.floor(relativeY * scaleY);
    const c = getColorAtPosition(nativeX, nativeY);

    setPalette(prev => prev.map(p => p.id === activeId ? { ...p, x: nativeX, y: nativeY, color: c.hex, ...c } : p));
  }, [isDragging, activeId, dimensions, image]);

  const handleEndDrag = () => { setIsDragging(false); setActiveId(null); };

  useEffect(() => {
    const onMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouch = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onUp = () => handleEndDrag();
    if (isDragging) {
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onTouch, { passive: false }); window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouch); window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, handleMove]);

  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setToast(`Copied ${text}`);
        setTimeout(() => setToast(null), 2000);
      }
    } catch (err) {
      console.error('Unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const exportCSS = () => {
      const css = `:root {\n${palette.map((p, i) => `  --color-${i + 1}: ${p.color};`).join('\n')}\n}`;
      copyToClipboard(css);
      setToast('Copied CSS Variables');
      setTimeout(() => setToast(null), 2000);
  };

  const exportJSON = () => {
      const json = JSON.stringify(palette.map(({color, r, g, b}) => ({hex: color, rgb: {r,g,b}})), null, 2);
      copyToClipboard(json);
      setToast('Copied JSON');
      setTimeout(() => setToast(null), 2000);
  };

  const onEnter = () => setIsHoveringInteractive(true);
  const onLeave = () => setIsHoveringInteractive(false);

  // --- Render ---

  return (
    <>
    {/* Style Injection for Typography */}
    <style>
    {`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        /* Hide default cursor to use custom one on desktop */
        @media (min-width: 768px) {
            body { cursor: none; }
            a, button, input { cursor: none; }
        }
    `}
    </style>

    {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
    <CustomCursor isHovering={isHoveringInteractive} />

    {/* Main Container - LIGHT BLUE PREMIUM THEME */}
    <div className="flex flex-col h-screen bg-[#ADD4E5] text-[#017CC3] font-sans overflow-hidden selection:bg-[#FFE9D2] selection:text-[#017CC3]">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(white_1px,transparent_1px)] [background-size:40px_40px] opacity-20"></div>
          {/* Subtle Champagne Glow Top Left */}
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#FFE9D2] rounded-full blur-[150px] opacity-40 mix-blend-soft-light"></div>
          {/* Steel Blue Deep Glow Bottom Right */}
          <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[#017CC3] rounded-full blur-[180px] opacity-20 mix-blend-multiply"></div>
      </div>

      {/* Navigation */}
      <nav className={`
          flex-none h-24 px-10 flex items-center justify-between z-20 transition-all duration-700 delay-300
          border-b border-white/20 bg-white/30 backdrop-blur-xl
          ${loading ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}
      `}>
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 border border-white/40 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg shadow-[#017CC3]/10">
             <Palette size={20} strokeWidth={1.5} className="text-[#017CC3]" />
           </div>
           <div>
              <h1 className="text-3xl font-serif italic font-medium tracking-tight text-[#017CC3] leading-none drop-shadow-sm">Prisma<span className="text-white font-sans not-italic text-[10px] tracking-[0.25em] ml-2 uppercase font-bold opacity-90">Studio</span></h1>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {image && (
               <Button onClick={clearImage} variant="ghost" onMouseEnter={onEnter} onMouseLeave={onLeave}>Clear</Button>
           )}
           <Button onClick={() => fileInputRef.current?.click()} variant="primary" icon={Upload} onMouseEnter={onEnter} onMouseLeave={onLeave}>
              {image ? 'New Image' : 'Upload Image'}
           </Button>
           <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Left: Interactive Palette Panel (Glassy White) */}
        <div className={`
            w-full md:w-[480px] flex flex-col bg-white/40 backdrop-blur-2xl border-r border-white/30 shadow-[20px_0_40px_-10px_rgba(1,124,195,0.1)]
            transition-all duration-700 delay-500
            ${loading ? 'opacity-0 -translate-x-10' : 'opacity-100 translate-x-0'}
        `}>
           
           {/* Toolbar */}
           <div className="flex items-center justify-between p-8 border-b border-white/30">
              <h2 className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-[#017CC3]">Extracted Palette</h2>
              <div className="flex items-center gap-2">
                 {image && (
                   <>
                     <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="p-3 text-[#017CC3] hover:text-[#017CC3] hover:bg-white/40 rounded-xl transition-colors relative cursor-none"
                        title="Export"
                        onMouseEnter={onEnter} onMouseLeave={onLeave}
                     >
                        <Download size={18} strokeWidth={1.5} />
                        {showExportMenu && (
                            <div className="absolute top-full right-0 mt-4 w-60 bg-white/80 border border-white/50 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50 backdrop-blur-xl">
                                <button onClick={exportCSS} className="flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/60 rounded-xl text-[#017CC3] transition-colors font-sans cursor-none font-medium">
                                    <Code size={16}/> Copy CSS Variables
                                </button>
                                <button onClick={exportJSON} className="flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/60 rounded-xl text-[#017CC3] transition-colors font-sans cursor-none font-medium">
                                    <Code size={16}/> Copy JSON
                                </button>
                            </div>
                        )}
                     </button>
                     <button 
                        onClick={handleAddColor}
                        className="p-3 text-[#017CC3] hover:text-[#017CC3] hover:bg-white/40 rounded-xl transition-colors cursor-none"
                        title="Add Color"
                        onMouseEnter={onEnter} onMouseLeave={onLeave}
                     >
                        <Plus size={18} strokeWidth={1.5} />
                     </button>
                   </>
                 )}
              </div>
           </div>

           {/* Scrollable List */}
           <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-thin scrollbar-thumb-white/40">
              {!image ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                      <div className="mb-6 font-serif text-6xl text-white italic drop-shadow-sm">?</div>
                      <p className="text-sm text-[#017CC3] font-sans tracking-widest max-w-[200px] leading-relaxed uppercase font-semibold">
                        Upload to Reveal
                      </p>
                  </div>
              ) : (
                palette.map((swatch, idx) => (
                  <ColorCard 
                    key={swatch.id}
                    index={idx}
                    colorData={swatch} 
                    onClick={(s) => copyToClipboard(s.color)}
                    onDelete={handleRemoveColor}
                    isActive={swatch.id === activeId}
                    onMouseEnter={onEnter}
                    onMouseLeave={onLeave}
                  />
                ))
              )}
           </div>

           {/* Footer Action */}
           {image && (
               <div className="p-8 border-t border-white/30 bg-white/30 backdrop-blur-sm animate-in fade-in duration-700">
                   <Button 
                      onClick={() => copyToClipboard(palette.map(p => p.color).join(', '))} 
                      variant="secondary" 
                      className="w-full justify-center py-4"
                      icon={Copy}
                      onMouseEnter={onEnter} onMouseLeave={onLeave}
                    >
                       Copy All Hex Codes
                   </Button>
               </div>
           )}
        </div>

        {/* Right: Workspace */}
        <div 
            className={`
                flex-1 relative flex items-center justify-center overflow-hidden
                transition-all duration-1000 delay-500
                ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
        >
           {!image ? (
               <div 
                className="text-center group cursor-none relative" 
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={onEnter} onMouseLeave={onLeave}
               >
                   {/* Glow behind drop area */}
                   <div className="absolute inset-0 bg-white rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
                   
                   <div className="w-32 h-32 border border-white/40 rounded-full flex items-center justify-center mx-auto mb-10 transition-all duration-500 group-hover:scale-105 group-hover:border-white bg-white/20 backdrop-blur-md relative z-10 shadow-xl shadow-[#017CC3]/10">
                       <Upload size={32} strokeWidth={1.5} className="text-white group-hover:text-[#017CC3] transition-colors duration-500" />
                   </div>
                   
                   <h3 className="text-5xl font-serif italic text-white mb-6 tracking-tight drop-shadow-md relative z-10">Drop Image Here</h3>
                   
                   <div className="flex items-center justify-center gap-8 mt-10 relative z-10">
                       <span className="text-xs font-sans uppercase tracking-[0.2em] text-[#017CC3] border-b border-transparent group-hover:border-[#017CC3]/50 pb-1 transition-all font-semibold">Browse Files</span>
                       <button 
                         onClick={(e) => { e.stopPropagation(); loadSampleImage(); }} 
                         className="text-xs font-sans uppercase tracking-[0.2em] text-[#017CC3]/70 hover:text-white transition-colors cursor-none font-semibold"
                        >
                           Try Sample
                       </button>
                   </div>
               </div>
           ) : (
               <div className="relative w-full h-full p-16 flex items-center justify-center">
                    <div 
                        ref={containerRef}
                        className="relative shadow-[0_50px_100px_-20px_rgba(1,124,195,0.2)] rounded-lg overflow-hidden select-none ring-1 ring-white/40 bg-white/20 backdrop-blur-sm"
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        <img 
                            src={imageSrc} 
                            alt="Workspace" 
                            className="block max-w-full max-h-[calc(100vh-12rem)] object-contain touch-none pointer-events-none"
                        />
                        <div className="absolute inset-0 z-10">
                            {palette.map((p) => (
                                <Indicator 
                                    key={p.id}
                                    x={p.x} y={p.y} color={p.color}
                                    isActive={activeId === p.id}
                                    containerWidth={dimensions.width}
                                    containerHeight={dimensions.height}
                                    onMouseDown={(e) => { setIsDragging(true); setActiveId(p.id); }}
                                    onMouseEnter={onEnter}
                                    onMouseLeave={onLeave}
                                />
                            ))}
                        </div>
                    </div>
               </div>
           )}
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#FFE9D2] text-[#017CC3] px-8 py-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(1,124,195,0.2)] flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-white/50">
          <span className="w-2 h-2 bg-[#017CC3] rounded-full animate-pulse"/>
          <span className="font-sans text-xs tracking-widest uppercase font-bold">{toast}</span>
        </div>
      )}
    </div>
    </>
  );
}