import { useEffect, useRef, useState } from 'react';

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size
    const width = 612;
    const height = 352;
    canvas.width = width;
    canvas.height = height;

    const gridSize = 20;
    const tileCount = width / gridSize;

    // Snake - starts long
    let snake = [];
    const initialLength = 15;
    for (let i = 0; i < initialLength; i++) {
      snake.push({ x: 15 - i, y: 10 });
    }

    let velocityX = 1;
    let velocityY = 0;

    // Food
    let foodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
    let foodY = Math.floor(Math.random() * (height / gridSize - 2)) + 1;

    // Keyboard control
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && velocityY === 0) {
        velocityX = 0;
        velocityY = -1;
      } else if (e.key === 'ArrowDown' && velocityY === 0) {
        velocityX = 0;
        velocityY = 1;
      } else if (e.key === 'ArrowLeft' && velocityX === 0) {
        velocityX = -1;
        velocityY = 0;
      } else if (e.key === 'ArrowRight' && velocityX === 0) {
        velocityX = 1;
        velocityY = 0;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Game loop
    function draw() {
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Move snake
      const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

      // Wall collision - wrap around
      if (head.x < 0) head.x = tileCount - 1;
      if (head.x >= tileCount) head.x = 0;
      if (head.y < 0) head.y = height / gridSize - 1;
      if (head.y >= height / gridSize) head.y = 0;

      snake.unshift(head);

      // Check food collision
      if (head.x === foodX && head.y === foodY) {
        // REVERSE: Remove from tail instead of growing
        if (snake.length > 1) {
          snake.pop();
          snake.pop(); // Remove 2 segments
        }

        // New food
        foodX = Math.floor(Math.random() * (tileCount - 2)) + 1;
        foodY = Math.floor(Math.random() * (height / gridSize - 2)) + 1;
      } else {
        snake.pop();
      }

      // Draw snake
      ctx.fillStyle = '#231f20';
      for (const segment of snake) {
        ctx.fillRect(
          segment.x * gridSize + 1,
          segment.y * gridSize + 1,
          gridSize - 2,
          gridSize - 2
        );
      }

      // Draw food
      ctx.fillStyle = '#8382fc';
      ctx.fillRect(
        foodX * gridSize + 1,
        foodY * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );

      // Game over check
      if (snake.length < 2) {
        // Reset
        snake = [];
        for (let i = 0; i < initialLength; i++) {
          snake.push({ x: 15 - i, y: 10 });
        }
      }

      if (isActive) {
        setTimeout(() => requestAnimationFrame(draw), 100);
      }
    }

    setIsActive(true);
    draw();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      setIsActive(false);
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 text-[10px] text-[#231f20] opacity-50">
        Используй стрелки ←↑→↓
      </div>
    </div>
  );
}
