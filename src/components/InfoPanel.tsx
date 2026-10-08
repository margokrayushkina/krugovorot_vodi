import { infoData } from '../data/texts';

interface Props {
  elementId: string | null;
  onClose: () => void;
}

export default function InfoPanel({ elementId, onClose }: Props) {
  if (!elementId || !infoData[elementId]) return null;
  const info = infoData[elementId];

  return (
    <div className="absolute top-4 right-4 w-[380px] max-w-[90vw] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden animate-slide-in z-50">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-4 flex items-center justify-between">
        <h3 className="text-white text-xl font-bold">{info.title}</h3>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xl transition-all"
        >
          ✕
        </button>
      </div>
      {/* Содержание */}
      <div className="p-5">
        <div className="text-4xl mb-3">{info.icon}</div>
        <p className="text-gray-800 text-lg leading-relaxed">
          {info.description}
        </p>
      </div>
      {/* Подсказка */}
      <div className="px-5 pb-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <p className="text-blue-700 text-sm">
            💡 Нажимайте на другие элементы схемы, чтобы узнать больше!
          </p>
        </div>
      </div>
    </div>
  );
}
