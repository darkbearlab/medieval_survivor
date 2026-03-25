/**
 * PathFinder — A* on a uniform grid.
 * Grid cells map to BUILDING_GRID-sized squares in world space.
 */
export class PathFinder {
  constructor(cellSize, gridW, gridH) {
    this.cellSize = cellSize;
    this.gridW    = gridW;
    this.gridH    = gridH;
    this.grid     = new Uint8Array(gridW * gridH); // 0=open, 1=blocked
  }

  setBlocked(worldX, worldY, blocked) {
    const gx = Math.floor(worldX / this.cellSize);
    const gy = Math.floor(worldY / this.cellSize);
    if (gx >= 0 && gx < this.gridW && gy >= 0 && gy < this.gridH) {
      this.grid[gy * this.gridW + gx] = blocked ? 1 : 0;
    }
  }

  isBlocked(gx, gy) {
    if (gx < 0 || gx >= this.gridW || gy < 0 || gy >= this.gridH) return true;
    return this.grid[gy * this.gridW + gx] === 1;
  }

  /**
   * Returns array of world-space {x,y} waypoints, or null if no path found.
   * Waypoints are cell centres.
   */
  findPath(fromX, fromY, toX, toY) {
    const cs = this.cellSize;
    const sx = Math.floor(fromX / cs);
    const sy = Math.floor(fromY / cs);
    let   ex = Math.floor(toX   / cs);
    let   ey = Math.floor(toY   / cs);

    // If target cell is blocked, widen search to adjacent open cell
    if (this.isBlocked(ex, ey)) {
      const adj = [[0,-1],[0,1],[-1,0],[1,0]];
      let found = false;
      for (const [dx, dy] of adj) {
        if (!this.isBlocked(ex+dx, ey+dy)) { ex += dx; ey += dy; found = true; break; }
      }
      if (!found) return null;
    }
    if (sx === ex && sy === ey) return [];

    const W   = this.gridW;
    const key = (x, y) => y * W + x;

    // Min-heap
    const heap = new _MinHeap();
    const closed  = new Uint8Array(W * this.gridH);
    const gCost   = new Float32Array(W * this.gridH).fill(Infinity);
    const parent  = new Int32Array(W * this.gridH).fill(-1);

    const startK = key(sx, sy);
    gCost[startK] = 0;
    heap.push({ x: sx, y: sy, f: _h(sx, sy, ex, ey) });

    const DIRS     = [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1],[1,-1],[1,1]];
    const DIR_COST = [1,1,1,1,1.414,1.414,1.414,1.414];

    while (!heap.isEmpty()) {
      const cur  = heap.pop();
      const curK = key(cur.x, cur.y);
      if (closed[curK]) continue;
      closed[curK] = 1;

      if (cur.x === ex && cur.y === ey) {
        // Reconstruct
        const path = [];
        let k = curK;
        while (k !== startK) {
          const px = k % W;
          const py = Math.floor(k / W);
          path.unshift({ x: px * cs + cs / 2, y: py * cs + cs / 2 });
          k = parent[k];
        }
        return path;
      }

      for (let d = 0; d < DIRS.length; d++) {
        const nx = cur.x + DIRS[d][0];
        const ny = cur.y + DIRS[d][1];
        if (this.isBlocked(nx, ny)) continue;
        // Diagonal: prevent corner-cutting
        if (d >= 4) {
          if (this.isBlocked(cur.x + DIRS[d][0], cur.y)) continue;
          if (this.isBlocked(cur.x, cur.y + DIRS[d][1])) continue;
        }
        const nk = key(nx, ny);
        if (closed[nk]) continue;
        const tentG = gCost[curK] + DIR_COST[d];
        if (tentG < gCost[nk]) {
          gCost[nk]  = tentG;
          parent[nk] = curK;
          heap.push({ x: nx, y: ny, f: tentG + _h(nx, ny, ex, ey) });
        }
      }
    }
    return null; // no path
  }
}

function _h(x, y, ex, ey) {
  return Math.abs(x - ex) + Math.abs(y - ey);
}

class _MinHeap {
  constructor() { this.d = []; }
  push(item) {
    this.d.push(item);
    let i = this.d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.d[p].f <= this.d[i].f) break;
      [this.d[p], this.d[i]] = [this.d[i], this.d[p]]; i = p;
    }
  }
  pop() {
    const top  = this.d[0];
    const last = this.d.pop();
    if (this.d.length > 0) {
      this.d[0] = last;
      let i = 0;
      while (true) {
        let s = i, l = 2*i+1, r = 2*i+2;
        if (l < this.d.length && this.d[l].f < this.d[s].f) s = l;
        if (r < this.d.length && this.d[r].f < this.d[s].f) s = r;
        if (s === i) break;
        [this.d[s], this.d[i]] = [this.d[i], this.d[s]]; i = s;
      }
    }
    return top;
  }
  isEmpty() { return this.d.length === 0; }
}
