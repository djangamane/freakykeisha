
import React from 'react';

interface ScoreDonutProps {
  score: number;
}

const ScoreDonut: React.FC<ScoreDonutProps> = ({ score }) => {
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (value: number) => {
    if (value > 75) return 'text-red-500';
    if (value > 50) return 'text-orange-400';
    if (value > 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTrackColor = (value: number) => {
    if (value > 75) return 'stroke-red-500';
    if (value > 50) return 'stroke-orange-400';
    if (value > 25) return 'stroke-yellow-400';
    return 'stroke-green-400';
  }

  const textColor = getScoreColor(score);
  const trackColor = getTrackColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle
          className="text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${trackColor} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${textColor}`}>{score}</span>
        <span className="text-xs font-medium text-gray-400">BIAS SCORE</span>
      </div>
    </div>
  );
};

export default ScoreDonut;
