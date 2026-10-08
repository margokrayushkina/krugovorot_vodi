import { infoData } from '../data/texts';

interface Props {
  onClose: () => void;
}

export default function Glossary({ onClose }: Props) {
  const items = Object.values(infoData);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white text-2xl font-bold">📖 Справочник</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xl transition-all"
          >
            ✕
          </button>
        </div>

        {/* Содержание */}
        <div className="overflow-y-auto p-6 flex-1">
          <p className="text-gray-600 mb-4 text-lg">
            Основные понятия и процессы круговорота воды в природе:
          </p>
          <div className="space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Дополнительная информация */}
          <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-2">🌍 Интересные факты</h3>
            <ul className="space-y-2 text-green-700">
              <li>• 97% воды на Земле — солёная (в океанах)</li>
              <li>• Только 3% — пресная, и лишь 1% доступен для использования</li>
              <li>• Капля воды может находиться в атмосфере 9-10 дней</li>
              <li>• Океан испаряет около 505 000 км³ воды в год</li>
              <li>• Один большой дуб испаряет до 150 литров воды в день</li>
              <li>• Круговорот воды существует на Земле уже миллиарды лет</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
