import { useRef, useEffect, useCallback } from 'react';

// Типы частиц
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'vapor' | 'rain' | 'surfaceRunoff' | 'underground' | 'transpiration';
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  darkness: number;
  targetDarkness: number;
  drift: number;
}

interface SimulationState {
  particles: Particle[];
  clouds: Cloud[];
  sunIntensity: number;
  paused: boolean;
  activeStage: string | null;
  showLabels: boolean;
  width: number;
  height: number;
  time: number;
}

interface Props {
  sunIntensity: number;
  paused: boolean;
  activeStage: string | null;
  showLabels: boolean;
  onElementClick: (elementId: string) => void;
}

export default function WaterCycleCanvas({ sunIntensity, paused, activeStage, showLabels, onElementClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimulationState>({
    particles: [],
    clouds: [],
    sunIntensity: 0.5,
    paused: false,
    activeStage: null,
    showLabels: true,
    width: 1920,
    height: 1080,
    time: 0,
  });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current.sunIntensity = sunIntensity;
    stateRef.current.paused = paused;
    stateRef.current.activeStage = activeStage;
    stateRef.current.showLabels = showLabels;
  }, [sunIntensity, paused, activeStage, showLabels]);

  const initClouds = useCallback((w: number, h: number) => {
    stateRef.current.clouds = [
      { x: w * 0.35, y: h * 0.12, width: w * 0.14, height: h * 0.07, darkness: 0.2, targetDarkness: 0.2, drift: 0 },
      { x: w * 0.55, y: h * 0.09, width: w * 0.16, height: h * 0.08, darkness: 0.25, targetDarkness: 0.25, drift: 0.5 },
      { x: w * 0.73, y: h * 0.14, width: w * 0.11, height: h * 0.06, darkness: 0.15, targetDarkness: 0.15, drift: 1 },
    ];
  }, []);

  const createParticle = useCallback((type: Particle['type'], w: number, h: number): Particle => {
    const groundY = h * 0.65;
    const waterLevel = h * 0.55;

    switch (type) {
      case 'vapor':
        return {
          x: Math.random() * w * 0.32 + w * 0.03,
          y: waterLevel - Math.random() * 15,
          vx: (Math.random() - 0.3) * 0.4,
          vy: -(1.2 + Math.random() * 1.2),
          type, size: 2 + Math.random() * 2,
          opacity: 0.35 + Math.random() * 0.3,
          life: 0, maxLife: 220 + Math.random() * 100,
        };
      case 'transpiration':
        return {
          x: w * 0.44 + Math.random() * w * 0.16,
          y: groundY - h * 0.08 - Math.random() * h * 0.1,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.6 + Math.random() * 0.8),
          type, size: 1.5 + Math.random() * 1.5,
          opacity: 0.3 + Math.random() * 0.3,
          life: 0, maxLife: 160 + Math.random() * 80,
        };
      case 'rain':
        return {
          x: Math.random() * w * 0.55 + w * 0.32,
          y: h * 0.17 + Math.random() * h * 0.04,
          vx: (Math.random() - 0.5) * 0.3,
          vy: 3.5 + Math.random() * 2.5,
          type, size: 1.5 + Math.random() * 2,
          opacity: 0.7 + Math.random() * 0.3,
          life: 0, maxLife: 140 + Math.random() * 50,
        };
      case 'surfaceRunoff':
        return {
          x: w * 0.52 + Math.random() * w * 0.2,
          y: groundY + Math.random() * 8,
          vx: -(1.2 + Math.random() * 0.8),
          vy: 0.2 + Math.random() * 0.2,
          type, size: 2.5 + Math.random() * 1.5,
          opacity: 0.7 + Math.random() * 0.2,
          life: 0, maxLife: 320 + Math.random() * 100,
        };
      case 'underground':
        return {
          x: w * 0.5 + Math.random() * w * 0.3,
          y: groundY + h * 0.08 + Math.random() * h * 0.12,
          vx: -(0.2 + Math.random() * 0.2),
          vy: 0.05 + Math.random() * 0.05,
          type, size: 2 + Math.random() * 1,
          opacity: 0.4 + Math.random() * 0.2,
          life: 0, maxLife: 600 + Math.random() * 200,
        };
      default:
        return { x: 0, y: 0, vx: 0, vy: 0, type: 'vapor', size: 2, opacity: 0.5, life: 0, maxLife: 100 };
    }
  }, []);

  // Рисуем вспомогательную функцию для скруглённого прямоугольника
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const drawLandscape = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
    const groundY = h * 0.65;
    const waterLevel = h * 0.55;

    // Небо
    const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGradient.addColorStop(0, '#6BB3E0');
    skyGradient.addColorStop(0.4, '#87CEEB');
    skyGradient.addColorStop(0.8, '#B8E4F0');
    skyGradient.addColorStop(1, '#D4F1F9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, groundY + 5);

    // Подземный слой
    const ugGrad = ctx.createLinearGradient(0, groundY, 0, h);
    ugGrad.addColorStop(0, '#8B7355');
    ugGrad.addColorStop(0.08, '#7A6245');
    ugGrad.addColorStop(0.2, '#5C4A30');
    ugGrad.addColorStop(0.5, '#3E3220');
    ugGrad.addColorStop(1, '#2A2015');
    ctx.fillStyle = ugGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Текстура почвы (камешки)
    ctx.fillStyle = 'rgba(100, 80, 60, 0.3)';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5 + 50) % w;
      const sy = groundY + 20 + (i * 73.7) % (h * 0.25);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3 + (i % 4), 2 + (i % 3), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Грунтовые воды
    const gwY = groundY + h * 0.18;
    ctx.fillStyle = 'rgba(30, 100, 200, 0.25)';
    ctx.fillRect(0, gwY, w, h * 0.07);
    ctx.strokeStyle = 'rgba(30, 140, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const y = gwY + Math.sin(x * 0.015 + time * 0.002) * 3;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Океан
    const oceanGrad = ctx.createLinearGradient(0, waterLevel, 0, groundY + h * 0.12);
    oceanGrad.addColorStop(0, '#4FC3F7');
    oceanGrad.addColorStop(0.3, '#2196F3');
    oceanGrad.addColorStop(0.7, '#1565C0');
    oceanGrad.addColorStop(1, '#0D47A1');
    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.moveTo(0, waterLevel);
    for (let x = 0; x <= w * 0.36; x += 3) {
      const waveY = waterLevel + Math.sin(x * 0.025 + time * 0.003) * 5 + Math.sin(x * 0.01 + time * 0.001) * 3;
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(w * 0.36, groundY + h * 0.12);
    ctx.lineTo(0, groundY + h * 0.12);
    ctx.closePath();
    ctx.fill();

    // Блик на воде
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.ellipse(w * 0.15, waterLevel + 15, w * 0.1, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.08, waterLevel + 25, w * 0.05, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Горы (задний план)
    ctx.fillStyle = '#3D6B4F';
    ctx.beginPath();
    ctx.moveTo(w * 0.38, groundY);
    ctx.lineTo(w * 0.5, groundY - h * 0.2);
    ctx.lineTo(w * 0.58, groundY - h * 0.15);
    ctx.lineTo(w * 0.68, groundY - h * 0.28);
    ctx.lineTo(w * 0.78, groundY - h * 0.22);
    ctx.lineTo(w * 0.88, groundY - h * 0.18);
    ctx.lineTo(w * 0.95, groundY - h * 0.12);
    ctx.lineTo(w, groundY - h * 0.06);
    ctx.lineTo(w, groundY);
    ctx.closePath();
    ctx.fill();

    // Горы (передний план)
    ctx.fillStyle = '#4A7C59';
    ctx.beginPath();
    ctx.moveTo(w * 0.42, groundY);
    ctx.lineTo(w * 0.55, groundY - h * 0.22);
    ctx.lineTo(w * 0.63, groundY - h * 0.16);
    ctx.lineTo(w * 0.73, groundY - h * 0.26);
    ctx.lineTo(w * 0.83, groundY - h * 0.19);
    ctx.lineTo(w * 0.92, groundY - h * 0.13);
    ctx.lineTo(w, groundY - h * 0.04);
    ctx.lineTo(w, groundY);
    ctx.closePath();
    ctx.fill();

    // Снежные шапки
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(w * 0.52, groundY - h * 0.19);
    ctx.lineTo(w * 0.55, groundY - h * 0.22);
    ctx.lineTo(w * 0.58, groundY - h * 0.19);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.7, groundY - h * 0.23);
    ctx.lineTo(w * 0.73, groundY - h * 0.26);
    ctx.lineTo(w * 0.76, groundY - h * 0.23);
    ctx.closePath();
    ctx.fill();

    // Холмы
    ctx.fillStyle = '#5D9B4A';
    ctx.beginPath();
    ctx.moveTo(w * 0.36, groundY);
    ctx.quadraticCurveTo(w * 0.44, groundY - h * 0.05, w * 0.52, groundY);
    ctx.fill();
    ctx.fillStyle = '#6AAF55';
    ctx.beginPath();
    ctx.moveTo(w * 0.52, groundY);
    ctx.quadraticCurveTo(w * 0.65, groundY - h * 0.035, w * 0.78, groundY);
    ctx.fill();
    ctx.fillStyle = '#5D9B4A';
    ctx.beginPath();
    ctx.moveTo(w * 0.78, groundY);
    ctx.quadraticCurveTo(w * 0.88, groundY - h * 0.025, w, groundY);
    ctx.fill();

    // Река
    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.66, groundY - h * 0.14);
    ctx.bezierCurveTo(w * 0.6, groundY - h * 0.08, w * 0.55, groundY - h * 0.02, w * 0.48, groundY + h * 0.01);
    ctx.bezierCurveTo(w * 0.44, groundY + h * 0.02, w * 0.4, groundY + h * 0.01, w * 0.36, waterLevel);
    ctx.stroke();
    // Блик на реке
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.64, groundY - h * 0.13);
    ctx.bezierCurveTo(w * 0.58, groundY - h * 0.07, w * 0.53, groundY - h * 0.01, w * 0.46, groundY + h * 0.015);
    ctx.stroke();

    // Деревья
    const treePositions = [
      { x: w * 0.42, s: h * 0.1 },
      { x: w * 0.46, s: h * 0.12 },
      { x: w * 0.5, s: h * 0.09 },
      { x: w * 0.54, s: h * 0.11 },
      { x: w * 0.58, s: h * 0.08 },
      { x: w * 0.62, s: h * 0.1 },
    ];
    treePositions.forEach(t => drawTree(ctx, t.x, groundY - h * 0.01, t.s));

    // Солнце
    const sunX = w * 0.12;
    const sunY = h * 0.12;
    const sunR = w * 0.035;
    const pulse = 1 + Math.sin(time * 0.003) * 0.05;

    // Свечение
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 2.5 * pulse);
    sunGlow.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
    sunGlow.addColorStop(0.4, 'rgba(255, 193, 7, 0.3)');
    sunGlow.addColorStop(1, 'rgba(255, 152, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Диск солнца
    const sunDiskGrad = ctx.createRadialGradient(sunX - sunR * 0.2, sunY - sunR * 0.2, 0, sunX, sunY, sunR);
    sunDiskGrad.addColorStop(0, '#FFF9C4');
    sunDiskGrad.addColorStop(0.7, '#FFD600');
    sunDiskGrad.addColorStop(1, '#FFA000');
    ctx.fillStyle = sunDiskGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Лучи
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.0008;
      const innerR = sunR * 1.3;
      const outerR = sunR * (1.8 + Math.sin(time * 0.005 + i) * 0.2);
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
      ctx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
      ctx.stroke();
    }
  }, []);

  const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - size * 0.06, y - size * 0.35, size * 0.12, size * 0.45);
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.arc(x - size * 0.12, y - size * 0.45, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.12, y - size * 0.45, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.arc(x + size * 0.05, y - size * 0.6, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawClouds = (ctx: CanvasRenderingContext2D, clouds: Cloud[], time: number) => {
    clouds.forEach(cloud => {
      const gray = Math.floor(255 - cloud.darkness * 120);
      const cx = cloud.x + Math.sin(time * 0.0005 + cloud.drift) * 10;

      // Тень облака
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`;
      ctx.beginPath();
      ctx.ellipse(cx + 3, cloud.y + 5, cloud.width * 0.5, cloud.height * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Облако
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${Math.min(255, gray + 5)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cloud.y, cloud.width * 0.45, cloud.height * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - cloud.width * 0.28, cloud.y + cloud.height * 0.08, cloud.width * 0.32, cloud.height * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + cloud.width * 0.28, cloud.y + cloud.height * 0.05, cloud.width * 0.28, cloud.height * 0.33, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + cloud.width * 0.1, cloud.y - cloud.height * 0.15, cloud.width * 0.25, cloud.height * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[], activeStage: string | null) => {
    const stageMap: Record<string, string[]> = {
      evaporation: ['vapor'],
      transpiration: ['transpiration'],
      condensation: ['vapor', 'transpiration'],
      precipitation: ['rain'],
      surfaceRunoff: ['surfaceRunoff'],
      infiltration: ['underground'],
    };

    particles.forEach(p => {
      let opacity = p.opacity * Math.min(1, (1 - p.life / p.maxLife) * 2);
      opacity = Math.max(0, Math.min(1, opacity));

      if (activeStage) {
        const activeTypes = stageMap[activeStage] || [];
        if (!activeTypes.includes(p.type)) {
          opacity *= 0.15;
        } else {
          opacity = Math.min(1, opacity * 1.5);
        }
      }

      ctx.globalAlpha = opacity;

      switch (p.type) {
        case 'vapor':
          ctx.fillStyle = 'rgba(200, 230, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'transpiration':
          ctx.fillStyle = 'rgba(180, 255, 180, 0.8)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rain':
          ctx.fillStyle = '#2196F3';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.4, p.size * 1.8, 0.1, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'surfaceRunoff':
          ctx.fillStyle = '#1E88E5';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'underground':
          ctx.fillStyle = '#1565C0';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    });
    ctx.globalAlpha = 1;
  };

  const drawLabels = (ctx: CanvasRenderingContext2D, w: number, h: number, showLabels: boolean) => {
    if (!showLabels) return;

    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';

    const labels = [
      { text: '☀️ Солнце', x: w * 0.12, y: h * 0.23 },
      { text: '🌊 Океан', x: w * 0.16, y: h * 0.5 },
      { text: '💨 Испарение', x: w * 0.22, y: h * 0.38 },
      { text: '☁️ Конденсация', x: w * 0.55, y: h * 0.05 },
      { text: '🌧️ Осадки', x: w * 0.62, y: h * 0.27 },
      { text: '🏞️ Поверхностный сток', x: w * 0.43, y: h * 0.62 },
      { text: '💧 Подземные воды', x: w * 0.28, y: h * 0.84 },
      { text: '🌿 Транспирация', x: w * 0.52, y: h * 0.5 },
      { text: '⛰️ Горы', x: w * 0.78, y: h * 0.38 },
      { text: '🏞️ Река', x: w * 0.53, y: h * 0.57 },
    ];

    labels.forEach(label => {
      const metrics = ctx.measureText(label.text);
      const padding = 10;
      const rx = label.x - metrics.width / 2 - padding;
      const ry = label.y - 13;
      const rw = metrics.width + padding * 2;
      const rh = 30;

      // Фон
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      roundRect(ctx, rx, ry, rw, rh, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Текст
      ctx.fillStyle = '#2c3e50';
      ctx.fillText(label.text, label.x, label.y + 6);
    });
  };

  const drawCycleArrows = (ctx: CanvasRenderingContext2D, w: number, h: number, showLabels: boolean, time: number) => {
    if (!showLabels) return;

    const dashOffset = time * 0.05;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = -dashOffset;

    // Испарение: океан → вверх
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.5)';
    ctx.lineWidth = 3;
    drawCurvedArrow(ctx, w * 0.2, h * 0.48, w * 0.32, h * 0.18, -0.3);

    // Осадки: облака → вниз
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
    drawCurvedArrow(ctx, w * 0.58, h * 0.2, w * 0.56, h * 0.52, 0.2);

    // Сток: земля → океан
    ctx.strokeStyle = 'rgba(30, 136, 229, 0.5)';
    drawCurvedArrow(ctx, w * 0.45, h * 0.64, w * 0.32, h * 0.57, 0.3);

    // Подземный сток
    ctx.strokeStyle = 'rgba(21, 101, 192, 0.4)';
    drawCurvedArrow(ctx, w * 0.22, h * 0.82, w * 0.08, h * 0.7, 0.4);

    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  };

  const drawCurvedArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, curve: number) => {
    const mx = (x1 + x2) / 2 + curve * (y2 - y1);
    const my = (y1 + y2) / 2 - curve * (x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();

    // Наконечник
    const angle = Math.atan2(y2 - my, x2 - mx);
    const headLen = 14;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.35), y2 - headLen * Math.sin(angle - 0.35));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.35), y2 - headLen * Math.sin(angle + 0.35));
    ctx.stroke();
    ctx.setLineDash([10, 6]);
  };

  // Подсветка активного этапа
  const drawStageHighlight = (ctx: CanvasRenderingContext2D, w: number, h: number, activeStage: string | null, time: number) => {
    if (!activeStage) return;

    const groundY = h * 0.65;
    const waterLevel = h * 0.55;
    const pulse = 0.5 + Math.sin(time * 0.005) * 0.3;

    ctx.globalAlpha = pulse * 0.15;
    ctx.fillStyle = '#FFD600';

    switch (activeStage) {
      case 'evaporation':
        ctx.fillRect(w * 0.02, waterLevel - h * 0.35, w * 0.33, h * 0.35);
        break;
      case 'transpiration':
        ctx.fillRect(w * 0.4, groundY - h * 0.25, w * 0.25, h * 0.2);
        break;
      case 'condensation':
        ctx.fillRect(w * 0.3, h * 0.02, w * 0.5, h * 0.2);
        break;
      case 'precipitation':
        ctx.fillRect(w * 0.3, h * 0.2, w * 0.55, h * 0.4);
        break;
      case 'surfaceRunoff':
        ctx.fillRect(w * 0.35, groundY - h * 0.03, w * 0.3, h * 0.08);
        break;
      case 'infiltration':
        ctx.fillRect(w * 0.1, groundY, w * 0.7, h * 0.25);
        break;
    }
    ctx.globalAlpha = 1;
  };

  // Основной цикл
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    const w = state.width;
    const h = state.height;

    if (!state.paused) {
      state.time++;
      const intensity = state.sunIntensity;
      const groundY = h * 0.65;

      // Спавн частиц
      const spawnRate = intensity;
      if (Math.random() < spawnRate * 0.18) {
        state.particles.push(createParticle('vapor', w, h));
      }
      if (Math.random() < spawnRate * 0.06) {
        state.particles.push(createParticle('transpiration', w, h));
      }
      const avgDarkness = state.clouds.reduce((s, c) => s + c.darkness, 0) / state.clouds.length;
      if (avgDarkness > 0.45 && Math.random() < avgDarkness * 0.35) {
        state.particles.push(createParticle('rain', w, h));
      }
      if (Math.random() < 0.04 * intensity) {
        state.particles.push(createParticle('surfaceRunoff', w, h));
      }
      if (Math.random() < 0.02 * intensity) {
        state.particles.push(createParticle('underground', w, h));
      }

      // Обновление частиц
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.type === 'vapor' || p.type === 'transpiration') {
          p.vx += 0.004;
          p.vy *= 0.999;
          p.x += Math.sin(p.life * 0.05) * 0.3; // лёгкое покачивание
          if (p.y < h * 0.15) {
            state.clouds.forEach(c => {
              if (Math.abs(p.x - c.x) < c.width * 0.6) {
                c.targetDarkness = Math.min(1, c.targetDarkness + 0.003);
              }
            });
            return false;
          }
        }

        if (p.type === 'rain') {
          p.vy += 0.08;
          if (p.y > groundY) {
            if (Math.random() < 0.5) {
              p.type = 'surfaceRunoff';
              p.vx = -(0.8 + Math.random() * 0.8);
              p.vy = 0.2;
              p.life = 0;
              p.maxLife = 250;
            } else {
              p.type = 'underground';
              p.vx = -(0.15 + Math.random() * 0.15);
              p.vy = 0.08;
              p.life = 0;
              p.maxLife = 500;
            }
          }
        }

        if (p.type === 'surfaceRunoff' && p.x < w * 0.36) return false;
        if (p.type === 'underground' && p.x < w * 0.08) return false;
        if (p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50) return false;
        if (p.life > p.maxLife) return false;

        return true;
      });

      // Обновление облаков
      state.clouds.forEach(cloud => {
        cloud.darkness += (cloud.targetDarkness - cloud.darkness) * 0.008;
        if (cloud.darkness > 0.5) cloud.targetDarkness -= 0.001;
        cloud.targetDarkness = Math.max(0.12, cloud.targetDarkness);
      });

      if (state.particles.length > 600) {
        state.particles = state.particles.slice(-600);
      }
    }

    // Отрисовка
    ctx.clearRect(0, 0, w, h);
    drawLandscape(ctx, w, h, state.time);
    drawStageHighlight(ctx, w, h, state.activeStage, state.time);
    drawClouds(ctx, state.clouds, state.time);
    drawParticles(ctx, state.particles, state.activeStage);
    drawCycleArrows(ctx, w, h, state.showLabels, state.time);
    drawLabels(ctx, w, h, state.showLabels);

    animFrameRef.current = requestAnimationFrame(animate);
  }, [createParticle, drawLandscape]);

  // Обработка кликов
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const w = stateRef.current.width;
    const h = stateRef.current.height;
    const groundY = h * 0.65;
    const waterLevel = h * 0.55;

    // Солнце
    if (Math.hypot(x - w * 0.12, y - h * 0.12) < w * 0.05) {
      onElementClick('sun'); return;
    }
    // Океан
    if (x < w * 0.35 && y > waterLevel - 25 && y < groundY + h * 0.12) {
      onElementClick('ocean'); return;
    }
    // Облака
    for (const cloud of stateRef.current.clouds) {
      if (Math.abs(x - cloud.x) < cloud.width * 0.5 && Math.abs(y - cloud.y) < cloud.height * 0.7) {
        onElementClick('cloud'); return;
      }
    }
    // Горы
    if (x > w * 0.5 && x < w && y > groundY - h * 0.3 && y < groundY) {
      onElementClick('mountain'); return;
    }
    // Растения
    if (x > w * 0.4 && x < w * 0.65 && y > groundY - h * 0.14 && y < groundY + h * 0.02) {
      onElementClick('plants'); return;
    }
    // Река
    if (x > w * 0.36 && x < w * 0.66 && y > groundY - h * 0.16 && y < groundY + h * 0.04) {
      onElementClick('river'); return;
    }
    // Подземные воды
    if (y > groundY + h * 0.1 && y < groundY + h * 0.28) {
      onElementClick('groundwater'); return;
    }
    // Зона испарения
    if (x < w * 0.33 && y > h * 0.28 && y < waterLevel) {
      onElementClick('evaporation'); return;
    }
    // Зона осадков
    if (x > w * 0.3 && x < w * 0.8 && y > h * 0.2 && y < h * 0.5) {
      onElementClick('precipitation'); return;
    }
    // Сток
    if (x > w * 0.36 && x < w * 0.6 && y > groundY - h * 0.02 && y < groundY + h * 0.06) {
      onElementClick('surfaceRunoff'); return;
    }
    // Инфильтрация
    if (y > groundY && y < groundY + h * 0.12 && x > w * 0.35) {
      onElementClick('infiltration'); return;
    }
  }, [onElementClick]);

  // Инициализация
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = 1920;
      canvas.height = 1080;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      stateRef.current.width = 1920;
      stateRef.current.height = 1080;
      initClouds(1920, 1080);
    };

    resize();
    window.addEventListener('resize', resize);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate, initClouds]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-full cursor-pointer"
      style={{ display: 'block' }}
    />
  );
}
