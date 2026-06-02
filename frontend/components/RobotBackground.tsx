'use client';

import { useEffect, useState } from 'react';

interface Robot {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'boxy' | 'round' | 'tiny';
  color: string;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const ROBOT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#a78bfa', // light purple
  '#c4b5fd', // lavender
  '#818cf8', // medium indigo
  '#4f46e5', // deep indigo
];

export default function RobotBackground() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [blinking, setBlinking] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Generate robots at random positions
    const generatedRobots: Robot[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      size: Math.random() * 30 + 30, // 30-60px
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 4, // 4-7s float
      type: i % 3 === 0 ? 'boxy' : i % 3 === 1 ? 'round' : 'tiny',
      color: ROBOT_COLORS[Math.floor(Math.random() * ROBOT_COLORS.length)],
    }));

    // Generate stars
    const generatedStars: Star[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
    }));

    setRobots(generatedRobots);
    setStars(generatedStars);

    // Random blinking
    const blinkInterval = setInterval(() => {
      const randomRobot = Math.floor(Math.random() * 12);
      setBlinking((prev) => ({ ...prev, [randomRobot]: true }));
      setTimeout(() => {
        setBlinking((prev) => ({ ...prev, [randomRobot]: false }));
      }, 200);
    }, 800);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900" />

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: Math.random() * 0.6 + 0.2,
            animation: `twinkle ${Math.random() * 2 + 2}s ease-in-out ${star.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* Robots */}
      {robots.map((robot) => (
        <div
          key={robot.id}
          className="absolute"
          style={{
            left: `${robot.x}%`,
            top: `${robot.y}%`,
            animation: `float ${robot.duration}s ease-in-out ${robot.delay}s infinite alternate`,
            opacity: 0.15,
          }}
        >
          {robot.type === 'boxy' && (
            <BoxyRobot
              size={robot.size}
              color={robot.color}
              isBlinking={blinking[robot.id]}
            />
          )}
          {robot.type === 'round' && (
            <RoundRobot
              size={robot.size}
              color={robot.color}
              isBlinking={blinking[robot.id]}
            />
          )}
          {robot.type === 'tiny' && (
            <TinyRobot
              size={robot.size * 0.7}
              color={robot.color}
              isBlinking={blinking[robot.id]}
            />
          )}
        </div>
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(-2deg); }
          100% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes blink {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }
        @keyframes antenna-wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}


// ─── BOXY ROBOT (WALL-E aesthetic) ──────────────────────

function BoxyRobot({ size, color, isBlinking }: { size: number; color: string; isBlinking: boolean }) {
  const s = size;

  return (
    <svg width={s} height={s * 1.4} viewBox="0 0 60 84" fill="none">
      {/* Antenna */}
      <line x1="30" y1="0" x2="30" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'antenna-wave 2s ease-in-out infinite', transformOrigin: '30px 12px' }} />
      <circle cx="30" cy="0" r="3" fill={color} style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }} />

      {/* Head */}
      <rect x="8" y="12" width="44" height="32" rx="6" fill={color} />

      {/* Eyes */}
      <rect
        x="13" y="22"
        width="14" height={isBlinking ? 2 : 12}
        rx="4"
        fill="white"
        style={{ transition: 'height 0.1s', transformOrigin: '20px 28px' }}
      />
      <rect
        x="33" y="22"
        width="14" height={isBlinking ? 2 : 12}
        rx="4"
        fill="white"
        style={{ transition: 'height 0.1s', transformOrigin: '40px 28px' }}
      />
      {/* Pupils */}
      {!isBlinking && (
        <>
          <circle cx="22" cy="28" r="3" fill="#1e1b4b" />
          <circle cx="42" cy="28" r="3" fill="#1e1b4b" />
          <circle cx="23" cy="27" r="1" fill="white" />
          <circle cx="43" cy="27" r="1" fill="white" />
        </>
      )}

      {/* Mouth */}
      <rect x="18" y="38" width="24" height="4" rx="2" fill="white" opacity="0.6" />
      {/* Smile dots */}
      <circle cx="22" cy="40" r="1.5" fill={color} />
      <circle cx="30" cy="40" r="1.5" fill={color} />
      <circle cx="38" cy="40" r="1.5" fill={color} />

      {/* Body */}
      <rect x="10" y="46" width="40" height="28" rx="6" fill={color} opacity="0.85" />
      {/* Chest button */}
      <circle cx="30" cy="56" r="5" fill="white" opacity="0.6"
        style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
      <circle cx="30" cy="56" r="2.5" fill={color} />
      {/* Side vents */}
      <rect x="13" y="65" width="8" height="3" rx="1.5" fill="white" opacity="0.4" />
      <rect x="39" y="65" width="8" height="3" rx="1.5" fill="white" opacity="0.4" />

      {/* Arms */}
      <rect x="0" y="48" width="10" height="18" rx="5" fill={color} opacity="0.75" />
      <rect x="50" y="48" width="10" height="18" rx="5" fill={color} opacity="0.75" />

      {/* Legs */}
      <rect x="14" y="74" width="12" height="10" rx="4" fill={color} opacity="0.7" />
      <rect x="34" y="74" width="12" height="10" rx="4" fill={color} opacity="0.7" />
    </svg>
  );
}


// ─── ROUND ROBOT (Baymax aesthetic) ─────────────────────

function RoundRobot({ size, color, isBlinking }: { size: number; color: string; isBlinking: boolean }) {
  const s = size;

  return (
    <svg width={s} height={s * 1.3} viewBox="0 0 70 91" fill="none">
      {/* Antenna */}
      <line x1="35" y1="0" x2="35" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        style={{ animation: 'antenna-wave 2.5s ease-in-out infinite', transformOrigin: '35px 10px' }} />
      <circle cx="35" cy="0" r="4" fill={color}
        style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />

      {/* Head — big round */}
      <ellipse cx="35" cy="26" rx="24" ry="22" fill={color} />

      {/* Eyes */}
      <ellipse
        cx="25" cy="24"
        rx="6" ry={isBlinking ? 1 : 7}
        fill="white"
        style={{ transition: 'ry 0.1s' }}
      />
      <ellipse
        cx="45" cy="24"
        rx="6" ry={isBlinking ? 1 : 7}
        fill="white"
        style={{ transition: 'ry 0.1s' }}
      />
      {!isBlinking && (
        <>
          <circle cx="26" cy="24" r="3" fill="#1e1b4b" />
          <circle cx="46" cy="24" r="3" fill="#1e1b4b" />
          <circle cx="27" cy="22" r="1.2" fill="white" />
          <circle cx="47" cy="22" r="1.2" fill="white" />
        </>
      )}

      {/* Smile line */}
      <path d="M 24 36 Q 35 44 46 36" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />

      {/* Body — big puffy oval */}
      <ellipse cx="35" cy="65" rx="26" ry="23" fill={color} opacity="0.85" />

      {/* Chest heart glow */}
      <path d="M 29 62 C 29 59 33 57 35 60 C 37 57 41 59 41 62 C 41 66 35 70 35 70 C 35 70 29 66 29 62 Z"
        fill="white" opacity="0.5"
        style={{ animation: 'glow-pulse 1.8s ease-in-out infinite' }} />

      {/* Arms */}
      <ellipse cx="8" cy="60" rx="7" ry="14" fill={color} opacity="0.75" />
      <ellipse cx="62" cy="60" rx="7" ry="14" fill={color} opacity="0.75" />

      {/* Legs */}
      <ellipse cx="26" cy="84" rx="9" ry="7" fill={color} opacity="0.7" />
      <ellipse cx="44" cy="84" rx="9" ry="7" fill={color} opacity="0.7" />
    </svg>
  );
}


// ─── TINY ROBOT (Mini helper bot) ───────────────────────

function TinyRobot({ size, color, isBlinking }: { size: number; color: string; isBlinking: boolean }) {
  const s = size;

  return (
    <svg width={s} height={s * 1.2} viewBox="0 0 40 48" fill="none">
      {/* Antenna */}
      <line x1="20" y1="0" x2="20" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="0" r="2.5" fill={color}
        style={{ animation: 'glow-pulse 1.2s ease-in-out infinite' }} />

      {/* Head */}
      <rect x="6" y="8" width="28" height="20" rx="8" fill={color} />

      {/* Single visor eye */}
      <rect
        x="9" y="14"
        width="22"
        height={isBlinking ? 2 : 8}
        rx="4"
        fill="white"
        style={{ transition: 'height 0.1s' }}
        opacity="0.9"
      />
      {!isBlinking && (
        <>
          <circle cx="17" cy="18" r="2.5" fill="#1e1b4b" />
          <circle cx="27" cy="18" r="2.5" fill="#1e1b4b" />
          <circle cx="18" cy="17" r="1" fill="white" />
          <circle cx="28" cy="17" r="1" fill="white" />
        </>
      )}

      {/* Body */}
      <rect x="9" y="30" width="22" height="16" rx="5" fill={color} opacity="0.85" />
      <circle cx="20" cy="38" r="3" fill="white" opacity="0.5"
        style={{ animation: 'glow-pulse 1.5s ease-in-out infinite' }} />

      {/* Arms */}
      <rect x="1" y="31" width="8" height="10" rx="4" fill={color} opacity="0.75" />
      <rect x="31" y="31" width="8" height="10" rx="4" fill={color} opacity="0.75" />
    </svg>
  );
}