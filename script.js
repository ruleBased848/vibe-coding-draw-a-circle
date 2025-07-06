const canvas = document.getElementById('draw-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let points = [];

canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  points = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  const pos = getMousePos(e);
  ctx.moveTo(pos.x, pos.y);
  points.push(pos);
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const pos = getMousePos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  points.push(pos);
});

canvas.addEventListener('mouseup', () => {
  drawing = false;
});

canvas.addEventListener('mouseleave', () => {
  drawing = false;
});

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

document.getElementById('reset-btn').onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points = [];
  document.getElementById('score-value').textContent = '-';
};

document.getElementById('submit-btn').onclick = () => {
  if (points.length < 10) {
    alert('Please draw a circle first!');
    return;
  }
  // Fit a circle to the points
  const {cx, cy, r} = fitCircle(points);
  // Calculate average deviation
  let totalDeviation = 0;
  for (const p of points) {
    const dist = Math.hypot(p.x - cx, p.y - cy);
    totalDeviation += Math.abs(dist - r);
  }
  const avgDeviation = totalDeviation / points.length;
  // Normalize score: 100 = perfect, 0 = very bad
  // Score drops off quickly for large deviations
  let score = Math.max(0, 100 - avgDeviation * 3);
  score = Math.round(score);
  document.getElementById('score-value').textContent = score;
  // Draw fitted circle overlay
  drawOverlay(cx, cy, r);
};

// Least squares circle fit (Kasa method)
function fitCircle(pts) {
  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0, sumX3 = 0, sumY3 = 0, sumX2Y = 0, sumXY2 = 0;
  const n = pts.length;
  for (const p of pts) {
    const x = p.x, y = p.y;
    const x2 = x * x, y2 = y * y;
    sumX += x;
    sumY += y;
    sumX2 += x2;
    sumY2 += y2;
    sumXY += x * y;
    sumX3 += x2 * x;
    sumY3 += y2 * y;
    sumX2Y += x2 * y;
    sumXY2 += x * y2;
  }
  const C = n * sumX2 - sumX * sumX;
  const D = n * sumXY - sumX * sumY;
  const E = n * sumY2 - sumY * sumY;
  const G = 0.5 * (n * sumX3 + n * sumXY2 - (sumX2 + sumY2) * sumX);
  const H = 0.5 * (n * sumY3 + n * sumX2Y - (sumX2 + sumY2) * sumY);
  const denom = C * E - D * D;
  let cx = 0, cy = 0;
  if (Math.abs(denom) > 1e-6) {
    cx = (G * E - D * H) / denom;
    cy = (C * H - D * G) / denom;
  } else {
    // Fallback: use centroid
    cx = sumX / n;
    cy = sumY / n;
  }
  // Average radius
  let r = 0;
  for (const p of pts) {
    r += Math.hypot(p.x - cx, p.y - cy);
  }
  r /= n;
  return {cx, cy, r};
}

function drawOverlay(cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
