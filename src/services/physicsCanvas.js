import javascriptIcon from '../assets/icons/JavaScript.svg';
import nextIcon from '../assets/icons/Next.js.svg';
import nodeIcon from '../assets/icons/Node.js.svg';
import pythonIcon from '../assets/icons/Python.svg';
import dockerIcon from '../assets/icons/Docker.svg';
import mysqlIcon from '../assets/icons/MySQL.svg';
import cssIcon from '../assets/icons/CSS3.svg';
import htmlIcon from '../assets/icons/HTML5.svg';
import reactIcon from '../assets/icons/React.svg';
import tailwindIcon from '../assets/icons/TailwindCSS.svg';
import prismaIcon from '../assets/icons/Prisma.svg';
import stripeIcon from '../assets/icons/Stripe.svg';
import tsIcon from '../assets/icons/TypeScript.svg';
import gitIcon from '../assets/icons/Git.svg';

const ICON_PRESETS = [
  { name: 'React', src: reactIcon, color: '#61dafb' },
  { name: 'Next.js', src: nextIcon, color: '#ffffff' },
  { name: 'TypeScript', src: tsIcon, color: '#3178c6' },
  { name: 'JavaScript', src: javascriptIcon, color: '#f7df1e' },
  { name: 'Python', src: pythonIcon, color: '#3776ab' },
  { name: 'Docker', src: dockerIcon, color: '#2496ed' },
  { name: 'Tailwind', src: tailwindIcon, color: '#38bdf8' },
  { name: 'Node.js', src: nodeIcon, color: '#5fa04e' },
  { name: 'Prisma', src: prismaIcon, color: '#bc80bb' },
  { name: 'Stripe', src: stripeIcon, color: '#635bff' },
  { name: 'MySQL', src: mysqlIcon, color: '#00758f' },
  { name: 'Git', src: gitIcon, color: '#f05032' }
];

// Preload icon images for canvas drawing
const imageCache = new Map();
function getCachedImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

// Preload all
ICON_PRESETS.forEach(item => getCachedImage(item.src));

export class PhysicsCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.bodies = [];
    this.isRunning = false;
    this.animFrameId = null;

    // Simulation params
    this.gravity = 0.38;
    this.friction = 0.985;
    this.restitution = 0.78; // Bounciness

    // Dragging & Mouse physics
    this.draggedBody = null;
    this.dragOffset = { x: 0, y: 0 };
    this.mouseHistory = [];
    this.isHoveringBody = false;
    this.isDragging = false;
    this.lastDragEndTime = 0;

    this.onResize = this.resize.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);

    this.init();
  }

  isCurrentlyInteracting() {
    return this.isDragging || (Date.now() - this.lastDragEndTime < 350);
  }

  init() {
    if (!this.ctx) return;

    this.resize();
    window.addEventListener('resize', this.onResize);

    const parent = this.canvas.parentElement || this.canvas;
    parent.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    parent.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);

    this.spawnBodies();
    this.start();
  }

  resize() {
    if (!this.ctx || !this.canvas || !this.canvas.parentElement) return;

    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 800;
    this.height = rect.height || 600;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx && typeof this.ctx.scale === 'function') {
      this.ctx.scale(dpr, dpr);
    }

    // Keep existing bodies inside new bounds
    this.bodies.forEach(b => {
      if (b.x > this.width - b.radius) b.x = this.width - b.radius;
      if (b.y > this.height - b.radius) b.y = this.height - b.radius;
    });
  }

  spawnBodies() {
    this.bodies = [];
    const count = Math.min(10, Math.max(6, Math.floor(this.width / 110)));
    const radius = Math.min(30, Math.max(22, this.width / 38));

    const presets = [...ICON_PRESETS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const preset = presets[i % presets.length];
      const img = getCachedImage(preset.src);

      // Random initial position dropping from top area
      const x = radius + Math.random() * (this.width - radius * 2);
      const y = radius + Math.random() * (this.height * 0.4);
      const vx = (Math.random() - 0.5) * 6;
      const vy = Math.random() * 3;
      const angle = (Math.random() - 0.5) * 0.5;
      const angularVelocity = (Math.random() - 0.5) * 0.08;

      this.bodies.push({
        id: i,
        x,
        y,
        vx,
        vy,
        radius,
        mass: radius * radius,
        angle,
        angularVelocity,
        img,
        name: preset.name,
        color: preset.color,
        isGrabbed: false
      });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.update();
      this.draw();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    const parent = this.canvas ? (this.canvas.parentElement || this.canvas) : null;
    if (parent) {
      parent.removeEventListener('mousedown', this.onMouseDown);
      parent.removeEventListener('touchstart', this.onTouchStart);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }

  getPointerPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : (e.clientX !== undefined ? e.clientX : 0);
    const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : (e.clientY !== undefined ? e.clientY : 0);
    
    const scaleX = rect.width ? this.width / rect.width : 1;
    const scaleY = rect.height ? this.height / rect.height : 1;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  findBodyAt(pos) {
    let closestBody = null;
    let minDistanceSq = Infinity;

    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      const dx = pos.x - b.x;
      const dy = pos.y - b.y;
      const distSq = dx * dx + dy * dy;

      // Generous grab radius covering the entire icon + generous hit margin
      const hitRadius = Math.max(b.radius * 1.85, 48);
      const hitRadiusSq = hitRadius * hitRadius;

      // Also check bounding box for square corner hits
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const isInsideBox = absDx <= hitRadius * 0.95 && absDy <= hitRadius * 0.95;

      if (distSq <= hitRadiusSq || isInsideBox) {
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closestBody = b;
        }
      }
    }
    return closestBody;
  }

  handleMouseDown(e) {
    if (e.target.closest && e.target.closest('a, button, .project-modal-arrow-btn, .project-modal-close-btn, .project-modal-dot, .project-modal-gallery-img')) {
      return;
    }

    const pos = this.getPointerPos(e);
    const body = this.findBodyAt(pos);
    if (body) {
      this.draggedBody = body;
      this.isDragging = true;
      body.isGrabbed = true;
      this.dragOffset = { x: pos.x - body.x, y: pos.y - body.y };
      this.mouseHistory = [{ x: pos.x, y: pos.y, t: Date.now() }];
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity = 0;
      this.canvas.style.cursor = 'grabbing';
      if (this.canvas.parentElement) {
        this.canvas.parentElement.style.cursor = 'grabbing';
      }
    }
  }

  handleMouseMove(e) {
    const pos = this.getPointerPos(e);

    if (this.draggedBody) {
      this.draggedBody.x = pos.x - this.dragOffset.x;
      this.draggedBody.y = pos.y - this.dragOffset.y;

      // Keep inside bounds while dragging
      this.draggedBody.x = Math.max(this.draggedBody.radius, Math.min(this.width - this.draggedBody.radius, this.draggedBody.x));
      this.draggedBody.y = Math.max(this.draggedBody.radius, Math.min(this.height - this.draggedBody.radius, this.draggedBody.y));

      const now = Date.now();
      this.mouseHistory.push({ x: pos.x, y: pos.y, t: now });
      if (this.mouseHistory.length > 5) {
        this.mouseHistory.shift();
      }
    } else {
      const hovered = this.findBodyAt(pos);
      if (hovered && !this.isHoveringBody) {
        this.canvas.style.cursor = 'grab';
        if (this.canvas.parentElement) this.canvas.parentElement.style.cursor = 'grab';
        this.isHoveringBody = true;
      } else if (!hovered && this.isHoveringBody) {
        this.canvas.style.cursor = 'default';
        if (this.canvas.parentElement) this.canvas.parentElement.style.cursor = 'default';
        this.isHoveringBody = false;
      }
    }
  }

  handleMouseUp() {
    if (this.draggedBody) {
      if (this.mouseHistory.length >= 2) {
        const oldest = this.mouseHistory[0];
        const latest = this.mouseHistory[this.mouseHistory.length - 1];
        const dt = Math.max(16, latest.t - oldest.t);
        const vx = ((latest.x - oldest.x) / dt) * 16;
        const vy = ((latest.y - oldest.y) / dt) * 16;

        // Apply throwing impulse
        this.draggedBody.vx = Math.max(-25, Math.min(25, vx * 1.3));
        this.draggedBody.vy = Math.max(-25, Math.min(25, vy * 1.3));
        this.draggedBody.angularVelocity = (vx * 0.02);
      }
      this.draggedBody.isGrabbed = false;
      this.draggedBody = null;
      this.mouseHistory = [];
      this.isDragging = false;
      this.lastDragEndTime = Date.now();
      this.canvas.style.cursor = 'default';
      if (this.canvas.parentElement) {
        this.canvas.parentElement.style.cursor = 'default';
      }
      this.isHoveringBody = false;
    }
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      if (e.target.closest && e.target.closest('a, button, .project-modal-arrow-btn, .project-modal-close-btn, .project-modal-dot, .project-modal-gallery-img')) {
        return;
      }

      const pos = this.getPointerPos(e);
      const body = this.findBodyAt(pos);
      if (body) {
        e.preventDefault();
        this.draggedBody = body;
        this.isDragging = true;
        body.isGrabbed = true;
        this.dragOffset = { x: pos.x - body.x, y: pos.y - body.y };
        this.mouseHistory = [{ x: pos.x, y: pos.y, t: Date.now() }];
        body.vx = 0;
        body.vy = 0;
        body.angularVelocity = 0;
      }
    }
  }

  handleTouchMove(e) {
    if (this.draggedBody && e.touches.length === 1) {
      e.preventDefault();
      const pos = this.getPointerPos(e);
      this.draggedBody.x = pos.x - this.dragOffset.x;
      this.draggedBody.y = pos.y - this.dragOffset.y;

      this.draggedBody.x = Math.max(this.draggedBody.radius, Math.min(this.width - this.draggedBody.radius, this.draggedBody.x));
      this.draggedBody.y = Math.max(this.draggedBody.radius, Math.min(this.height - this.draggedBody.radius, this.draggedBody.y));

      const now = Date.now();
      this.mouseHistory.push({ x: pos.x, y: pos.y, t: now });
      if (this.mouseHistory.length > 5) {
        this.mouseHistory.shift();
      }
    }
  }

  handleTouchEnd() {
    this.handleMouseUp();
  }

  update() {
    const len = this.bodies.length;

    // 1. Integration & Boundaries
    for (let i = 0; i < len; i++) {
      const b = this.bodies[i];

      if (!b.isGrabbed) {
        // Gravity
        b.vy += this.gravity;

        // Air Resistance
        b.vx *= this.friction;
        b.vy *= this.friction;
        b.angularVelocity *= 0.985;

        // Position update
        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.angularVelocity;

        // Floor collision
        if (b.y + b.radius > this.height) {
          b.y = this.height - b.radius;
          b.vy = -b.vy * this.restitution;
          b.vx *= 0.96;
          b.angularVelocity = (b.vx / b.radius) * 0.4;
          if (Math.abs(b.vy) < 0.3) b.vy = 0;
        }

        // Ceiling collision
        if (b.y - b.radius < 0) {
          b.y = b.radius;
          b.vy = -b.vy * this.restitution;
        }

        // Left wall
        if (b.x - b.radius < 0) {
          b.x = b.radius;
          b.vx = -b.vx * this.restitution;
          b.angularVelocity = -(b.vy / b.radius) * 0.3;
        }

        // Right wall
        if (b.x + b.radius > this.width) {
          b.x = this.width - b.radius;
          b.vx = -b.vx * this.restitution;
          b.angularVelocity = (b.vy / b.radius) * 0.3;
        }
      }
    }

    // 2. Inter-body Collisions (Impulse resolution with positional correction)
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const b1 = this.bodies[i];
        const b2 = this.bodies[j];

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = b1.radius + b2.radius;

        if (distSq < minDist * minDist && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          // Positional separation to prevent overlapping
          const overlap = 0.5 * (minDist - dist);
          if (!b1.isGrabbed) {
            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
          }
          if (!b2.isGrabbed) {
            b2.x += nx * overlap;
            b2.y += ny * overlap;
          }

          // Relative velocity
          const rvx = b1.vx - b2.vx;
          const rvy = b1.vy - b2.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          // Only resolve if velocities are separating
          if (velAlongNormal > 0) {
            const e = this.restitution;
            const impulse = ((1 + e) * velAlongNormal) / (1 / b1.mass + 1 / b2.mass);

            const ix = impulse * nx;
            const iy = impulse * ny;

            if (!b1.isGrabbed) {
              b1.vx -= (ix / b1.mass);
              b1.vy -= (iy / b1.mass);
            }
            if (!b2.isGrabbed) {
              b2.vx += (ix / b2.mass);
              b2.vy += (iy / b2.mass);
            }

            // Add spin on bounce
            const tx = -ny;
            const ty = nx;
            const tangentVel = rvx * tx + rvy * ty;
            if (!b1.isGrabbed) b1.angularVelocity += tangentVel * 0.003;
            if (!b2.isGrabbed) b2.angularVelocity -= tangentVel * 0.003;
          }
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];

      this.ctx.save();
      this.ctx.translate(b.x, b.y);
      this.ctx.rotate(b.angle);

      // Subtle shadow for realistic physics floating/dragging depth
      this.ctx.shadowColor = b.isGrabbed ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)';
      this.ctx.shadowBlur = b.isGrabbed ? 22 : 10;
      this.ctx.shadowOffsetY = b.isGrabbed ? 10 : 4;

      // Draw pure SVG Icon (No circle background, no border)
      if (b.img && b.img.complete && b.img.naturalWidth > 0) {
        const iconSize = b.radius * (b.isGrabbed ? 2.3 : 2.0);
        this.ctx.drawImage(b.img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
      }

      this.ctx.restore();
    }
  }
}
