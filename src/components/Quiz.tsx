import { useState, useEffect, useCallback } from 'react';
import { quizItems, quizSlots } from '../data/texts';

interface Props {
  onClose: () => void;
}

interface DragItem {
  id: string;
  label: string;
}

export default function Quiz({ onClose }: Props) {
  const [availableItems, setAvailableItems] = useState<DragItem[]>(
    [...quizItems].sort(() => Math.random() - 0.5).map(item => ({ id: item.id, label: item.label }))
  );
  const [placedItems, setPlacedItems] = useState<Record<number, DragItem | null>>({
    0: null, 1: null, 2: null, 3: null,
  });
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'wrong' | null>>({
    0: null, 1: null, 2: null, 3: null,
  });
  const [selectedItem, setSelectedItem] = useState<DragItem | null>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const handleItemClick = (item: DragItem) => {
    setSelectedItem(item);
  };

  const handleSlotClick = (slotId: number) => {
    const item = selectedItem;
    if (!item) return;

    const correctSlot = quizItems.find(q => q.id === item.id)?.correctSlot;
    setAttempts(prev => prev + 1);

    if (correctSlot === slotId) {
      // Правильно!
      setPlacedItems(prev => ({ ...prev, [slotId]: item }));
      setAvailableItems(prev => prev.filter(i => i.id !== item.id));
      setFeedback(prev => ({ ...prev, [slotId]: 'correct' }));
      setScore(prev => prev + 1);
      setSelectedItem(null);
    } else {
      // Неправильно
      setFeedback(prev => ({ ...prev, [slotId]: 'wrong' }));
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, [slotId]: null }));
      }, 1500);
    }
  };

  const handleRemoveItem = (slotId: number) => {
    const item = placedItems[slotId];
    if (item) {
      setAvailableItems(prev => [...prev, item]);
      setPlacedItems(prev => ({ ...prev, [slotId]: null }));
      setFeedback(prev => ({ ...prev, [slotId]: null }));
      setScore(prev => prev - 1);
    }
  };

  // Проверка завершения — через useEffect (правильный паттерн React)
  useEffect(() => {
    const allPlaced = Object.values(placedItems).every(item => item !== null);
    if (allPlaced && !completed) {
      setCompleted(true);
    }
  }, [placedItems, completed]);

  const handleReset = useCallback(() => {
    setAvailableItems([...quizItems].sort(() => Math.random() - 0.5).map(item => ({ id: item.id, label: item.label })));
    setPlacedItems({ 0: null, 1: null, 2: null, 3: null });
    setFeedback({ 0: null, 1: null, 2: null, 3: null });
    setSelectedItem(null);
    setCompleted(false);
    setScore(0);
    setAttempts(0);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white text-xl md:text-2xl font-bold">🧩 Собери цикл круговорота воды!</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Содержание */}
        <div className="overflow-y-auto p-4 md:p-6 flex-1">
          <p className="text-gray-600 mb-4 text-base md:text-lg">
            {selectedItem
              ? `✅ Выбрано: «${selectedItem.label}». Теперь нажмите на нужный слот ниже:`
              : 'Нажмите на название процесса, затем на правильный слот в схеме:'}
          </p>

          {/* Схема со слотами */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
            {quizSlots.map(slot => (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`rounded-xl p-4 border-2 transition-all min-h-[110px] flex flex-col justify-center cursor-pointer ${
                  feedback[slot.id] === 'correct'
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                    : feedback[slot.id] === 'wrong'
                    ? 'border-red-400 bg-red-50 animate-pulse'
                    : placedItems[slot.id]
                    ? 'border-blue-300 bg-blue-50'
                    : selectedItem
                    ? 'border-blue-400 bg-blue-50 hover:bg-blue-100 hover:border-blue-500'
                    : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="text-sm text-gray-500 mb-1">{slot.hint}</div>
                <div className="text-base font-medium text-gray-700 mb-2">{slot.label}</div>
                {placedItems[slot.id] ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium">
                      {placedItems[slot.id]!.label}
                    </span>
                    {feedback[slot.id] === 'correct' && <span className="text-green-500 text-xl">✅</span>}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveItem(slot.id); }}
                      className="text-gray-400 hover:text-red-500 text-sm ml-auto px-2 py-1 rounded hover:bg-red-50"
                    >
                      ↩️ Вернуть
                    </button>
                  </div>
                ) : (
                  <div className={`text-sm italic ${selectedItem ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                    {selectedItem ? '👆 Нажмите сюда, чтобы разместить' : 'Выберите процесс выше...'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Доступные элементы */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-700 mb-3">Доступные процессы:</h3>
            <div className="flex flex-wrap gap-3">
              {availableItems.length === 0 ? (
                <p className="text-green-600 font-medium text-lg">🎉 Все процессы размещены!</p>
              ) : (
                availableItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all shadow-md select-none text-lg ${
                      selectedItem?.id === item.id
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105 ring-2 ring-green-300'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:scale-105 active:scale-95'
                    }`}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Результат */}
          {completed && (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">Отлично! Цикл собран!</h3>
              <p className="text-green-600 text-lg">
                Вы правильно расположили все 4 этапа круговорота воды!
              </p>
              <p className="text-gray-600 mt-2">
                Попыток: {attempts} | Правильных с первого раза: {score}
              </p>
              <p className="text-gray-500 mt-2 text-sm">
                Помните: круговорот воды — это бесконечный процесс, в котором вода постоянно перемещается между океаном, атмосферой и сушей.
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all"
              >
                🔄 Пройти ещё раз
              </button>
            </div>
          )}

          {/* Инструкция */}
          <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-amber-700 text-sm">
              💡 <strong>Как играть:</strong> Нажмите на название процесса → затем нажмите на правильный слот.
              Если ошибётесь — слот подсветится красным, попробуйте снова.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
