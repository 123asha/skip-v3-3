import { useEffect, useRef, useState } from 'react';

export default function BreakoutGame() {
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

    // Ball
    let ballX = width / 2;
    let ballY = height - 60;
    let ballDX = 3;
    let ballDY = -3;
    const ballRadius = 8;

    // Paddle
    let paddleX = width / 2 - 40;
    const paddleWidth = 80;
    const paddleHeight = 10;
    const paddleY = height - 30;

    // Bricks - forming "SKIP DESIGN"
    const brickRowCount = 8;
    const brickColumnCount = 12;
    const brickWidth = 45;
    const brickHeight = 15;
    const brickPadding = 3;
    const brickOffsetTop = 80;
    const brickOffsetLeft = 20;

    // Letter patterns (1 = brick, 0 = empty)
    const skipPattern = [
      [0,1,1,1,0,0,1,0,1,0,1,1,1,0,1,1,1,1],
      [1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0,0],
      [0,1,1,0,0,0,1,1,1,0,0,1,0,0,1,1,1,0],
      [0,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,0,0],
      [1,1,1,0,0,0,1,0,1,0,1,1,1,0,1,0,0,0],
    ];

    const designPattern = [
      [1,1,1,0,1,1,1,0,0,1,1,0,1,1,1,0,1,0,1,0,1,0,1],
      [1,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,1,0,1,1,0],
      [1,0,1,0,1,1,0,0,0,1,1,0,0,1,0,0,1,1,1,0,1,0,1],
      [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,1,0,0],
      [1,1,1,0,1,1,1,0,1,1,0,0,1,1,1,0,1,0,1,0,1,0,0],
    ];

    interface Brick {
      x: number;
      y: number;
      status: number;
    }

    const bricks: Brick[] = [];

    // Create SKIP
    for (let r = 0; r < skipPattern.length; r++) {
      for (let c = 0; c < skipPattern[r].length; c++) {
        if (skipPattern[r][c] === 1) {
          bricks.push({
            x: brickOffsetLeft + c * (brickWidth + brickPadding),
            y: brickOffsetTop + r * (brickHeight + brickPadding),
            status: 1
          });
        }
      }
    }

    // Create DESIGN (below SKIP)
    for (let r = 0; r < designPattern.length; r++) {
      for (let c = 0; c < designPattern[r].length; c++) {
        if (designPattern[r][c] === 1) {
          bricks.push({
            x: brickOffsetLeft + c * (brickWidth + brickPadding),
            y: brickOffsetTop + 120 + r * (brickHeight + brickPadding),
            status: 1
          });
        }
      }
    }

    // Mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      paddleX = mouseX - paddleWidth / 2;
      if (paddleX < 0) paddleX = 0;
      if (paddleX + paddleWidth > width) paddleX = width - paddleWidth;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Collision detection
    function collisionDetection() {
      for (const brick of bricks) {
        if (brick.status === 1) {
          if (
            ballX > brick.x &&
            ballX < brick.x + brickWidth &&
            ballY > brick.y &&
            ballY < brick.y + brickHeight
          ) {
            ballDY = -ballDY;
            brick.status = 0;
          }
        }
      }
    }

    // Draw functions
    function drawBall() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#231f20';
      ctx.fill();
      ctx.closePath();
    }

    function drawPaddle() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight);
      ctx.fillStyle = '#231f20';
      ctx.fill();
      ctx.closePath();
    }

    function drawBricks() {
      if (!ctx) return;
      for (const brick of bricks) {
        if (brick.status === 1) {
          ctx.beginPath();
          ctx.rect(brick.x, brick.y, brickWidth, brickHeight);
          ctx.fillStyle = '#231f20';
          ctx.fill();
          ctx.closePath();
        }
      }
    }

    // Game loop
    function draw() {
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      drawBricks();
      drawBall();
      drawPaddle();
      collisionDetection();

      // Ball movement
      if (ballX + ballDX > width - ballRadius || ballX + ballDX < ballRadius) {
        ballDX = -ballDX;
      }
      if (ballY + ballDY < ballRadius) {
        ballDY = -ballDY;
      } else if (ballY + ballDY > height - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
          ballDY = -ballDY;
        } else {
          // Reset ball
          ballX = width / 2;
          ballY = height - 60;
          ballDX = 3;
          ballDY = -3;
        }
      }

      ballX += ballDX;
      ballY += ballDY;

      if (isActive) {
        requestAnimationFrame(draw);
      }
    }

    setIsActive(true);
    draw();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      setIsActive(false);
    };
  }, [isActive]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
