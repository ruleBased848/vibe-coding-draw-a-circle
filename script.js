const canvas = document.getElementById('draw-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let path = [];

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
  path = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pos = getPos(e);
  path.push(pos);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  e.preventDefault();
}

function draw(e) {
  if (!drawing) return;
  const pos = getPos(e);
  path.push(pos);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = '#1976d2';
  ctx.lineWidth = 2;
  ctx.stroke();
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
  path = [];
  document.getElementById('rating-display').textContent = '';
};

document.getElementById('submit-btn').onclick = () => {
  if (path.length < 20) {
    document.getElementById('rating-display').textContent = 'Please draw a full circle!';
    return;
  }

  // Fit a circle to the path using least squares
  const {cx, cy, r} = fitCircle(path);

  // Prohibit very small circles
  if (r < 50) {
    document.getElementById('rating-display').textContent = 'Circle is too small! Draw a larger one.';
    return;
  }

  // Check if the path forms a complete circle (angle coverage)
  const coverage = getAngleCoverage(path, cx, cy);
  if (coverage < 300) { // degrees
    document.getElementById('rating-display').textContent = 'Please draw a more complete circle!';
    return;
  }

  // Calculate average deviation from the fitted circle
  const avgDev = averageDeviation(path, cx, cy, r);

  // Normalize score: lower deviation = higher score
  let score = Math.max(0, 100 - avgDev * 2);
  score = Math.round(score);

  // Draw overlay: fitted circle and deviation lines
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawUserPath(path);
  drawFittedCircle(cx, cy, r);
  drawDeviations(path, cx, cy, r);

  document.getElementById('rating-display').textContent = `Score: ${score}/100`;
};

// --- Helper functions ---
function fitCircle(points) {
  // Kasa method (simple least squares circle fit)
  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0, sumR = 0;
  let N = points.length;
  for (let p of points) {
    sumX += p.x;
    sumY += p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
    sumXY += p.x * p.y;
  }
  let C = N * sumX2 - sumX * sumX;
  let D = N * sumXY - sumX * sumY;
  let E = N * sumY2 - sumY * sumY;
  let G = 0.5 * (N * (sumX2 + sumY2) - (sumX * sumX + sumY * sumY));
  let a = (G * E - D * D) / (C * E - D * D);
  let b = (C * G - D * G) / (C * E - D * D);
  let cx = sumX / N + a;
  let cy = sumY / N + b;
  // Compute radius as mean distance to center
  let r = 0;
  for (let p of points) {
    r += Math.hypot(p.x - cx, p.y - cy);
  }
  r /= N;
  return {cx, cy, r};
}

function getAngleCoverage(points, cx, cy) {
  // Compute angles of all points relative to center
  let angles = points.map(p => Math.atan2(p.y - cy, p.x - cx));
  // Normalize to [0, 2pi)
  angles = angles.map(a => (a < 0 ? a + 2 * Math.PI : a));
  angles.sort((a, b) => a - b);
  // Find largest gap between consecutive angles
  let maxGap = 0;
  for (let i = 1; i < angles.length; ++i) {
    maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
  }
  // Also check gap between last and first (wrap around)
  maxGap = Math.max(maxGap, 2 * Math.PI - (angles[angles.length - 1] - angles[0]));
  // Coverage is 360 - largest gap (in degrees)
  return 360 - (maxGap * 180 / Math.PI);
}

function averageDeviation(points, cx, cy, r) {
  let sum = 0;
  for (let p of points) {
    let d = Math.abs(Math.hypot(p.x - cx, p.y - cy) - r);
    sum += d;
  }
  return sum / points.length;
}

function drawUserPath(points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; ++i) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = '#1976d2';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawFittedCircle(cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.closePath();
}

function drawDeviations(points, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let p of points) {
    let angle = Math.atan2(p.y - cy, p.x - cx);
    let px = cx + r * Math.cos(angle);
    let py = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.closePath();
  }
  ctx.restore();
}
