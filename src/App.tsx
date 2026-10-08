import { useState, useCallback } from 'react';
import WaterCycleCanvas from './components/WaterCycleCanvas';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import Glossary from './components/Glossary';
import Quiz from './components/Quiz';

type Screen = 'main' | 'glossary' | 'quiz';

export default function App() {
  const [paused, setPaused] = useState(false);
  const [sunIntensity, setSunIntensity] = useState(0.5);
  const [showLabels, setShowLabels] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('main');

  const handleElementClick = useCallback((elementId: string) => {
    setSelectedElement(elementId);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedElement(null);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-100 select-none">
      {/* Основная симуляция */}
      <div className="absolute inset-0" style={{ bottom: screen === 'main' ? '100px' : '0' }}>
        <WaterCycleCanvas
          sunIntensity={sunIntensity}
          paused={paused}
          activeStage={activeStage}
          showLabels={showLabels}
          onElementClick={handleElementClick}
        />
      </div>

      {/* Информационная плашка */}
      {screen === 'main' && selectedElement && (
        <InfoPanel elementId={selectedElement} onClose={handleCloseInfo} />
      )}

      {/* Заголовок */}
      {screen === 'main' && (
        <div className="absolute top-3 left-3 z-40">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border border-blue-200">
            <h1 className="text-base md:text-xl font-bold text-blue-800 leading-tight">
              💧 Круговорот воды в природе
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Нажимайте на элементы схемы для изучения</p>
          </div>
        </div>
      )}

      {/* Индикатор паузы */}
      {paused && screen === 'main' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-4 text-white text-2xl font-bold">
            ⏸️ Пауза
          </div>
        </div>
      )}

      {/* Индикатор активного этапа */}
      {activeStage && screen === 'main' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-yellow-400/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-yellow-500">
            <p className="text-yellow-900 font-bold text-sm md:text-base">
              🔍 Режим демонстрации: {activeStage === 'evaporation' ? '💨 Испарение' :
                activeStage === 'condensation' ? '☁️ Конденсация' :
                activeStage === 'precipitation' ? '🌧️ Осадки' :
                activeStage === 'surfaceRunoff' ? '🏞️ Поверхностный сток' :
                activeStage === 'infiltration' ? '💧 Инфильтрация' :
                '🌿 Транспирация'}
            </p>
          </div>
        </div>
      )}

      {/* Панель управления */}
      {screen === 'main' && (
        <ControlPanel
          paused={paused}
          onTogglePause={() => setPaused(!paused)}
          sunIntensity={sunIntensity}
          onSunIntensityChange={setSunIntensity}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          activeStage={activeStage}
          onSetActiveStage={setActiveStage}
          onOpenGlossary={() => setScreen('glossary')}
          onOpenQuiz={() => setScreen('quiz')}
        />
      )}

      {/* Справочник */}
      {screen === 'glossary' && (
        <Glossary onClose={() => setScreen('main')} />
      )}

      {/* Мини-игра */}
      {screen === 'quiz' && (
        <Quiz onClose={() => setScreen('main')} />
      )}
    </div>
  );
}
