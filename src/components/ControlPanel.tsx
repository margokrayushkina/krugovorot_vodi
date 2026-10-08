import { stages } from '../data/texts';

interface Props {
  paused: boolean;
  onTogglePause: () => void;
  sunIntensity: number;
  onSunIntensityChange: (value: number) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeStage: string | null;
  onSetActiveStage: (stage: string | null) => void;
  onOpenGlossary: () => void;
  onOpenQuiz: () => void;
}

export default function ControlPanel({
  paused,
  onTogglePause,
  sunIntensity,
  onSunIntensityChange,
  showLabels,
  onToggleLabels,
  soundEnabled,
  onToggleSound,
  activeStage,
  onSetActiveStage,
  onOpenGlossary,
  onOpenQuiz,
}: Props) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t-2 border-blue-200 shadow-lg">
      {/* Основная панель */}
      <div className="flex items-center justify-between px-4 py-2 gap-3 flex-wrap">
        {/* Пауза/Старт */}
        <button
          onClick={onTogglePause}
          className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-2xl transition-all active:scale-95 shadow-md"
          title={paused ? 'Запустить' : 'Пауза'}
        >
          {paused ? '▶️' : '⏸️'}
        </button>

        {/* Ползунок солнца */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-[300px]">
          <span className="text-2xl">🌡️</span>
          <div className="flex flex-col flex-1">
            <label className="text-xs text-gray-600 font-medium">Сила солнца</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={sunIntensity}
              onChange={(e) => onSunIntensityChange(parseFloat(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer accent-orange-500"
              style={{
                background: `linear-gradient(to right, #FFB74D 0%, #FF9800 ${sunIntensity * 100}%, #E0E0E0 ${sunIntensity * 100}%)`
              }}
            />
          </div>
        </div>

        {/* Подписи */}
        <button
          onClick={onToggleLabels}
          className={`flex items-center justify-center w-14 h-14 rounded-xl text-xl transition-all active:scale-95 shadow-md ${
            showLabels ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
          }`}
          title="Показать/скрыть подписи"
        >
          🏷️
        </button>

        {/* Звук */}
        <button
          onClick={onToggleSound}
          className={`flex items-center justify-center w-14 h-14 rounded-xl text-xl transition-all active:scale-95 shadow-md ${
            soundEnabled ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
          }`}
          title="Звук вкл/выкл"
        >
          🔊
        </button>

        {/* Справочник */}
        <button
          onClick={onOpenGlossary}
          className="flex items-center justify-center gap-1 h-14 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold transition-all active:scale-95 shadow-md"
          title="Справочник"
        >
          📖 <span className="hidden md:inline">Справочник</span>
        </button>

        {/* Проверь себя */}
        <button
          onClick={onOpenQuiz}
          className="flex items-center justify-center gap-1 h-14 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-lg font-bold transition-all active:scale-95 shadow-md"
          title="Проверь себя"
        >
          🧩 <span className="hidden md:inline">Проверь себя</span>
        </button>
      </div>

      {/* Панель этапов */}
      <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto">
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Этапы:</span>
        <button
          onClick={() => onSetActiveStage(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeStage === null
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Все этапы
        </button>
        {stages.map(stage => (
          <button
            key={stage.id}
            onClick={() => onSetActiveStage(activeStage === stage.id ? null : stage.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeStage === stage.id
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {stage.icon} {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
