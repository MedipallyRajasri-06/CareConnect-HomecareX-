import { useState, useRef } from 'react';
import { Camera, Video, UploadCloud, X, Play, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function MediaUpload({ media = [], onChange, maxItems = 4, className = '' }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [activePreview, setActivePreview] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (media.length + files.length > maxItems) {
      toast.error(`You can attach up to ${maxItems} photos or videos in total.`);
      return;
    }

    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported photo or video file.`);
        return;
      }

      // Check file size (e.g. 25MB max)
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max file size is 25MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const item = {
          url: uploadEvent.target.result,
          type: isVideo ? 'video' : 'photo',
          name: file.name,
          size: file.size,
        };
        onChange([...media, item]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('video');
    const item = {
      url,
      type: isVideo ? 'video' : 'photo',
      name: isVideo ? 'Problem Video' : 'Problem Photo',
    };
    onChange([...media, item]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (index) => {
    onChange(media.filter((_, i) => i !== index));
    if (activePreview?.index === index) setActivePreview(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span>Problem Photos & Videos</span>
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Optional
            </span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Help the professional diagnose the issue accurately and bring the right replacement parts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon size={12} />
          <span>{showUrlInput ? 'Hide URL' : 'Add by URL'}</span>
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste image or video link (https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#D98C2B] outline-none"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Attach
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Media Thumbnails Grid + Upload Trigger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {media.map((item, idx) => (
          <div
            key={idx}
            className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 flex items-center justify-center shadow-xs"
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover opacity-85"
                muted
                playsInline
              />
            ) : (
              <img
                src={item.url}
                alt={item.name || `Problem preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            )}

            {/* Type badge */}
            <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white flex items-center gap-1 backdrop-blur-xs">
              {item.type === 'video' ? (
                <>
                  <Video size={10} className="text-amber-400" /> Video
                </>
              ) : (
                <>
                  <ImageIcon size={10} className="text-emerald-400" /> Photo
                </>
              )}
            </span>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
              title="Remove"
            >
              <X size={12} />
            </button>

            {/* Preview overlay trigger */}
            <button
              type="button"
              onClick={() => setActivePreview({ ...item, index: idx })}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity cursor-pointer text-white text-xs font-semibold"
            >
              {item.type === 'video' ? (
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-xs">
                  <Play size={16} className="fill-white" />
                </div>
              ) : (
                <span>View Full</span>
              )}
            </button>
          </div>
        ))}

        {media.length < maxItems && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#D98C2B] bg-slate-50/70 hover:bg-amber-50/40 p-4 aspect-video text-slate-500 hover:text-[#925611] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#D98C2B] transition-colors">
              <Camera size={18} />
              <span className="text-xs font-bold">+</span>
              <Video size={18} />
            </div>
            <span className="text-[11px] font-semibold text-center leading-tight">
              Attach Photo/Video
            </span>
            <span className="text-[9px] text-slate-400">Click to upload</span>
          </button>
        )}
      </div>

      {/* Lightbox / Video Modal Preview */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setActivePreview(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="p-2 flex items-center justify-center max-h-[75vh]">
              {activePreview.type === 'video' ? (
                <video
                  src={activePreview.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto rounded-lg"
                />
              ) : (
                <img
                  src={activePreview.url}
                  alt="Problem photo"
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              )}
            </div>
            <div className="px-4 py-2.5 bg-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>{activePreview.name || 'Problem Attachment'}</span>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="text-amber-400 hover:underline font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
