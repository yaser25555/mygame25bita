import React, { useState, useEffect } from 'react';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const initialCardsData = [
  'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D',
  'E', 'E', 'F', 'F', 'G', 'G', 'H', 'H',
];

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffledValues = shuffleArray([...initialCardsData]);
    const newCards: Card[] = shuffledValues.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(newCards);
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setGameStarted(false);
  };

  const handleCardClick = (clickedCard: Card) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (flippedCards.length === 2 || clickedCard.isFlipped || clickedCard.isMatched) {
      return;
    }

    const newFlippedCards = [...flippedCards, clickedCard.id];
    setFlippedCards(newFlippedCards);

    const newCards = cards.map(card =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    if (newFlippedCards.length === 2) {
      setMoves(prevMoves => prevMoves + 1);
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = newCards.find(card => card.id === firstCardId);
      const secondCard = newCards.find(card => card.id === secondCardId);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstCardId || card.id === secondCardId
                ? { ...card, isMatched: true } : card
            )
          );
          setMatches(prevMatches => prevMatches + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(card =>
              card.id === firstCardId || card.id === secondCardId
                ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matches === initialCardsData.length / 2 && gameStarted) {
      alert(`تهانينا! لقد فزت في ${moves} حركة!`);
      setGameStarted(false);
    }
  }, [matches, moves, gameStarted]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">لعبة الذاكرة</h2>
      <div className="text-white mb-4">
        <p>الحركات: {moves}</p>
        <p>المطابقات: {matches}/{initialCardsData.length / 2}</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => (
          <div
            key={card.id}
            className={`w-20 h-20 flex items-center justify-center rounded-lg cursor-pointer
              ${card.isFlipped || card.isMatched ? 'bg-purple-600' : 'bg-gray-600'}
              ${card.isMatched ? 'opacity-50' : ''}
              ${flippedCards.length === 2 && !card.isFlipped && !card.isMatched ? 'pointer-events-none' : ''}
            `}
            onClick={() => handleCardClick(card)}
          >
            {(card.isFlipped || card.isMatched) && (
              <span className="text-white text-3xl font-bold">{card.value}</span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={initializeGame}
        className="mt-6 px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition duration-300"
      >
        إعادة اللعب
      </button>
    </div>
  );
};

export default MemoryGame;