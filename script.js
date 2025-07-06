// main.js

const canvas = document.getElementById('draw-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let points = [];

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('touchstart', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', endDraw);
canvas.addEventListener('touchend', endDraw);

function getPos(e) {
  if (e.touches) {
    return {
      x: e.touches[0].clientX - canvas.getBoundingClientRect().left,
      y: e.touches[0].clientY - canvas.getBoundingClientRect().top
    };
  } else {
    return {
      x: e.offsetX,
      y: e.offsetY
    };
  }
}

function startDraw(e) {
  drawing = true;
  points = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  const pos = getPos(e);
  ctx.moveTo(pos.x, pos.y);
  points.push([pos.x, pos.y]);
  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  points.push([pos.x, pos.y]);
  e.preventDefault();
}

function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
  e.preventDefault();
}

document.getElementById('reset-btn').onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points = [];
  document.getElementById('rating-display').textContent = '';
};

document.getElementById('submit-btn').onclick = () => {
  if (points.length < 10) {
    document.getElementById('rating-display').textContent = 'Draw a circle first!';
    return;
  }
  // Fit circle to points
  const circle = fitCircle(points);
  // Check if the path is a complete circle
  const isComplete = isCircleComplete(points, circle);
  if (!isComplete) {
    document.getElementById('rating-display').textContent = 'Please draw a full circle!';
    drawFittedCircle(circle, '#e74c3c');
    return;
  }
  // Calculate score
  const score = computeScore(points, circle);
  document.getElementById('rating-display').textContent = `Score: ${score}/100`;
  drawFittedCircle(circle, '#27ae60');
};

// Least squares circle fit (Kasa method)
function fitCircle(pts) {
  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0, sumX3 = 0, sumY3 = 0, sumX2Y = 0, sumXY2 = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const x = pts[i][0], y = pts[i][1];
    sumX += x;
    sumY += y;
    sumX2 += x * x;
    sumY2 += y * y;
    sumXY += x * y;
    sumX3 += x * x * x;
    sumY3 += y * y * y;
    sumX2Y += x * x * y;
    sumXY2 += x * y * y;
  }
  const C = n * sumX2 - sumX * sumX;
  const D = n * sumXY - sumX * sumY;
  const E = n * sumY2 - sumY * sumY;
  const G = 0.5 * (n * sumX3 + n * sumXY2 - (sumX2 + sumY2) * sumX);
  const H = 0.5 * (n * sumY3 + n * sumX2Y - (sumX2 + sumY2) * sumY);
  const denom = C * E - D * D;
  let cx = (G * E - D * H) / denom;
  let cy = (C * H - D * G) / denom;
  // Average radius
  let r = 0;
  for (let i = 0; i < n; i++) {
    r += Math.hypot(pts[i][0] - cx, pts[i][1] - cy);
  }
  r /= n;
  return { cx, cy, r };
}

// Check if the path is a complete circle (by angle coverage)
function isCircleComplete(pts, circle) {
  const angles = pts.map(([x, y]) => Math.atan2(y - circle.cy, x - circle.cx));
  angles.sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < angles.length; i++) {
    maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
  }
  // Also check gap between last and first (circle wraps)
  maxGap = Math.max(maxGap, 2 * Math.PI - (angles[angles.length - 1] - angles[0]));
  // If the largest gap is less than 1/3 of a circle, consider it complete
  return maxGap < (Math.PI * 2) / 3;
}

// Compute score (lower mean deviation = higher score)
function computeScore(pts, circle) {
  let totalDev = 0;
  for (let i = 0; i < pts.length; i++) {
    const d = Math.abs(Math.hypot(pts[i][0] - circle.cx, pts[i][1] - circle.cy) - circle.r);
    totalDev += d;
  }
  const meanDev = totalDev / pts.length;
  // Normalize: 0 deviation = 100, 20px deviation = 0
  let score = 100 - (meanDev / 20) * 100;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return score;
}

// Draw the fitted circle overlay
function drawFittedCircle(circle, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.r, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
