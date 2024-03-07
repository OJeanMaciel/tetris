import { useEffect, useRef, useState } from 'react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';


const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = ['#928b8b', '#FFD700', '#FF4500', '#00CED1', '#FF1493', '#32CD32', '#8A2BE2', '#FFA500'];

const SHAPES = [
  [[1, 1, 1, 1]],                                 // I
  [[1, 1], [1, 1]],                               // O
  [[1, 1, 1], [0, 1, 0]],                         // T
  [[1, 1, 1], [0, 0, 1]],                         // L
  [[1, 1, 1], [1, 0, 0]],                         // J
  [[1, 1, 0], [0, 1, 1]],                         // S
  [[0, 1, 1], [1, 1, 0]]                          // Z
];

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const Tetris = () => {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [linesRemoved, setLinesRemoved] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const audioRef = useRef(new Audio('/src/asset/Tetris.mp3'));
  audioRef.current.loop = true;


  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(context);
    drawPiece(context);

    const interval = setInterval(() => {
      moveDown();
    }, 1000);

    return () => clearInterval(interval);
  }, [grid, currentPiece, currentPosition]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.keyCode) {
        case 37: // left arrow
          moveLeft();
          break;
        case 39: // right arrow
          moveRight();
          break;
        case 38: // up arrow
          rotatePiece();
          break;
        case 40: // down arrow
          moveDown();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPiece, currentPosition, grid]);

  const handleTouchStart = (event) => {
    const touchX = event.touches[0].clientX;
    const middleX = window.innerWidth / 2;

    if (touchX < middleX) {
      moveLeft();
    } else {
      moveRight();
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (isAudioEnabled) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  useEffect(() => {
    if (isAudioEnabled) {
      audioRef.current.play().catch((error) => console.error("Audio play failed:", error));
    } else {
      audioRef.current.pause();
    }
  }, [isAudioEnabled]);

  const handleTouchEnd = (event) => {
    rotatePiece();
  };

  const drawGrid = (context) => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        context.fillStyle = grid[y][x] ? COLORS[grid[y][x]] : '#FFFFFF';
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = '#000000';
        context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  };

  const drawPiece = (context) => {
    if (!currentPiece) return;
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          context.fillStyle = currentPiece.color;
          context.fillRect((currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          context.strokeStyle = '#000000';
          context.strokeRect((currentPosition.x + x) * BLOCK_SIZE, (currentPosition.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  };

  const moveDown = () => {
    if (currentPiece && canMove(currentPosition.x, currentPosition.y + 1, currentPiece.shape)) {
      setCurrentPosition((prev) => ({ ...prev, y: prev.y + 1 }));
    } else {
      mergePiece();
      removeCompleteLines();
      const newPiece = generateRandomPiece();
      if (canMove(4, 0, newPiece.shape)) {
        setCurrentPiece(newPiece);
        setCurrentPosition({ x: 4, y: 0 });
      } else {
        setIsGameOver(true); // Define o jogo como terminado
      }
    }
  };

  const canMove = (x, y, shape) => {
    return shape.every((row, dy) =>
      row.every((cell, dx) => {
        let newX = x + dx;
        let newY = y + dy;
        return (
          cell === 0 ||
          (newX >= 0 && newX < COLS && newY < ROWS && grid[newY][newX] === 0)
        );
      })
    );
  };

  const moveLeft = () => {
    if (currentPiece && canMove(currentPosition.x - 1, currentPosition.y, currentPiece.shape)) {
      setCurrentPosition((prev) => ({ ...prev, x: prev.x - 1 }));
    }
  };

  const moveRight = () => {
    if (currentPiece && canMove(currentPosition.x + 1, currentPosition.y, currentPiece.shape)) {
      setCurrentPosition((prev) => ({ ...prev, x: prev.x + 1 }));
    }
  };

  const rotatePiece = () => {
    if (!currentPiece) return;
    const newShape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map((row) => row[index]).reverse());
    if (canMove(currentPosition.x, currentPosition.y, newShape)) {
      setCurrentPiece({ ...currentPiece, shape: newShape });
    }
  };

  const mergePiece = () => {
    if (!currentPiece) return;
    const newGrid = [...grid];
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          newGrid[currentPosition.y + y][currentPosition.x + x] = COLORS.indexOf(currentPiece.color) + 1;
        }
      });
    });
    setGrid(newGrid);
    setCurrentPiece(null);
  };

  const removeCompleteLines = () => {
    const completedLinesIndices = grid.reduce((acc, row, index) => {
      if (row.every((cell) => cell !== 0)) acc.push(index);
      return acc;
    }, []);

    if (completedLinesIndices.length > 0) {
      const animatedGrid = grid.map((row, index) =>
        completedLinesIndices.includes(index) ? row.map(() => 8) : row
      );
      setGrid(animatedGrid);

      setTimeout(() => {
        const newGrid = grid.filter((_, index) => !completedLinesIndices.includes(index));
        while (newGrid.length < ROWS) {
          newGrid.unshift(Array(COLS).fill(0));
        }
        setGrid(newGrid);
        setLinesRemoved((prev) => prev + completedLinesIndices.length);
      }, 500);
    }
  };

  const generateRandomPiece = () => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * (COLORS.length - 1))];
    return { shape, color };
  };

  const restartGame = () => {
    setGrid(createEmptyGrid());
    setCurrentPiece(null);
    setCurrentPosition({ x: 0, y: 0 });
    setLinesRemoved(0);
    setIsGameOver(false);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}> 
        <span>Score: {linesRemoved} </span>
      <button onClick={toggleAudio} >
      <audio src="/src/asset/Tetris.mp3" autoPlay loop></audio>

        {isAudioEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
      </button>
      </div>

      <canvas
        ref={canvasRef}
        width={COLS * BLOCK_SIZE}
        height={ROWS * BLOCK_SIZE}
        style={{ border: '1px solid #000000', backgroundColor: '#FFFFFF' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      ></canvas>
      {isGameOver && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#0bbdc4' , padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
        <h2>Game Over</h2>
        <p>Score: {linesRemoved}</p>
        <button onClick={restartGame}>Restart</button>
        </div>
      )}
    </>
  );
  
};

export default Tetris;
