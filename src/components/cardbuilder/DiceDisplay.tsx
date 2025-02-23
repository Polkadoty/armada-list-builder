import { ICON_MAP } from '@/constants/icons';

interface DiceDisplayProps {
  count: number;
  colors: ('red' | 'blue' | 'black')[];
}

// Add these style constants
const DICE_COLORS = {
    red: '#FF0000',
    blue: '#1b9ae7',
    black: '#000000'
  };

export function DiceDisplay({ count, colors }: DiceDisplayProps) {
  const diceSize = '13pt';
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    gap: '0px'
  };

  const renderDie = (index: number) => {
    const diceStyle: React.CSSProperties = {
      fontFamily: 'icons',
      fontSize: diceSize,
      color: DICE_COLORS[colors[index]],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textShadow: '0 0 1px rgba(0, 0, 0, 0.5)',
      lineHeight: '12px',
      height: '12px',
      padding: '0',
      margin: '0 -1px' // Negative margin to bring dice closer horizontally
    };

    return (
      <span key={index} style={diceStyle}>
        {ICON_MAP.die}
      </span>
    );
  };

  const renderDice = () => {
    if (count === 0) return null;

    const dice = Array(count).fill(null).map((_, index) => renderDie(index));

    if (count === 1) {
      return <div style={{ ...containerStyle, justifyContent: 'center' }}>{dice}</div>;
    }

    if (count === 2) {
      return <div style={{ ...containerStyle, justifyContent: 'center', gap: '4px' }}>{dice}</div>;
    }

    if (count === 3) {
      return (
        <div style={containerStyle}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '14px', gap: '4px' }}>
            {dice.slice(0, 2)}
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '14px', marginTop: '-13px' }}>
            {dice[2]}
          </div>
        </div>
      );
    }

    if (count === 4) {
      return (
        <div style={containerStyle}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '14px', gap: '3px' }}>
            {dice.slice(0, 2)}
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '14px', gap: '3px', marginTop: '-13px', paddingLeft: `${parseInt(diceSize) * 1.1}px` }}>
            {dice.slice(2, 4)}
          </div>
        </div>
      );
    }
  };

  return renderDice();
} 