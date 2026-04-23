let bg = { r: 0, g: 50, b: 10 };
let maze, astar;

let solveStarted = false;
let rows = 0, cols = 0, tileSize = 0;

let mnScl = 4, mxScl = 50;
let mazeColor = "#69DF71";

let hunter;
let sclFactor = 1.5;

let hearts = 3, score = -1;
let highscore = 0, lost = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());
  
  let visibleTiles = 18;
  tileSize = round(min(width / visibleTiles, height / visibleTiles));
  
  cols = ceil(width / tileSize / 2) * sclFactor;
  rows = ceil(height / tileSize / 2) * sclFactor;
  
  player = new Player();
  maze = new Maze(cols, rows);
  
  maze.generate(player.x, player.y, 10000);
  
  let cp = maze.checkpoints[maze.currCheckpoint];
  let px = round(player.x / tileSize), py = round(player.y / tileSize);
  
  astar = new AStar();
  astar.init(
    maze.getNode(astar, px, py),
    maze.getNode(astar, cp.x, cp.y)
  );
  
  score = -1;
  hearts = 3;
  
  hunter = new Hunter();
}

function draw() {
  let c = maze.hexRGB(mazeColor);
  background(c.r, c.g, c.b);
  
  push();
  translate(
    width / 2 - player.x - player.size / 2,
    height / 2 - player.y - player.size / 2
  );

  for (let i = 0; i < 100; i++) maze.step();
  maze.display();
  
  if (!astar.solved && solveStarted) astar.run();
  let cp = maze.checkpoints[maze.currCheckpoint];
  
  let cx = cp.x, cy = cp.y;
  let px = round(player.x / tileSize), py = round(player.y / tileSize);

  if (px === cp.x && py === cp.y) {
    score++;
    solveStarted = false;
    
    maze.currCheckpoint++;
    maze.genCheckpoint();
    
    let cp = maze.checkpoints[maze.currCheckpoint];
    let px = round(player.x / tileSize), py = round(player.y / tileSize);

    astar = new AStar();
    astar.init(
      maze.getNode(astar, px, py), 
      maze.getNode(astar, cp.x, cp.y)
    );
    
    for (let y = 0; y < maze.gh; y++) {
      for (let x = 0; x < maze.gw; x++) {
        let n = maze.getNode(astar, x, y);
        
        n.g = Infinity;
        n.f = 0;
        
        n.h = 0;
        n.previous = undefined;
      }
    }
    
    let loc = hunter.randomSpawn();
      
    hunter.x = loc.x * tileSize;
    hunter.y = loc.y * tileSize;
  }
  
  hunter.display();
  if (!lost) hunter.update();
  
  player.display();
  if (!lost) player.update();
  
  display();
  pop();
}

function display() {
  push();
  resetMatrix();
  
  for (let i = 0; i < hearts; i++) {
    drawHeart(10 + 50 * i, 30, 5, -2);
  }
  
  fill(255);
  noStroke();
  
  textSize(20);
  textFont("sans-serif");
  
  textStyle("bold");
  textAlign("left", "top");
  
  text("Score: " + max(0, score) + " | High Score: " + highscore, 10, 5);
  pop();
}

function drawHeart(x, y, s) {
  fill(220, 40, 40);

  let pattern = [
    "01100110",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000"
  ];

  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] == "1") {
        rect(x + c * s, y + r * s, s, s);
      }
    }
  }
}

function keyPressed() {
  let k = key.toLowerCase();
  if (k === "enter") {
    let cp = maze.checkpoints[maze.currCheckpoint];
    let px = round(player.x / tileSize), py = round(player.y / tileSize);

    astar = new AStar();
    astar.init(
      maze.getNode(astar, px, py),
      maze.getNode(astar, cp.x, cp.y)
    );
    
    solveStarted = true;
  }
}

async function reset() {
  lost = true;
  highscore = score > highscore ? score : highscore;
  
  let playerSize = player.size;
  
  for (let s = player.size; s >= 0; s--) {
    player.size = s;
    await new Promise(r => setTimeout(r, 25));
  }
  
  if (player.size <= 0) {
    await new Promise(r => setTimeout(r, 1000));
    
    cols = ceil(width / tileSize / 2) * sclFactor;
    rows = ceil(height / tileSize / 2) * sclFactor;

    player = new Player();
    maze = new Maze(cols, rows);

    maze.generate(player.x, player.y, 10000);

    let cp = maze.checkpoints[maze.currCheckpoint];
    let px = round(player.x / tileSize), py = round(player.y / tileSize);

    astar = new AStar();
    astar.init(
      maze.getNode(astar, px, py),
      maze.getNode(astar, cp.x, cp.y)
    );

    score = 0;
    hearts = 3;

    hunter = new Hunter();
    lost = false;
  }
}

class Player {
  constructor() {
    this.size = tileSize - 10;

    this.x = tileSize + 5;
    this.y = tileSize + 5;

    this.maxSpeed = tileSize * 8;
    this.originSpeed = tileSize * 5;
    
    this.multiplier = 1.016;
    this.speed = this.originSpeed;
        
    this.keys = [false, false, false, false];
    this.init();
  }

  keyDown(e) {
    let k = e.key.toLowerCase();

    if (k === "arrowup" || k === "w") player.keys[0] = true;
    if (k === "arrowdown" || k === "s") player.keys[1] = true;
    if (k === "arrowleft" || k === "a") player.keys[2] = true;
    if (k === "arrowright" || k === "d") player.keys[3] = true;
  }

  keyUp(e) {
    let k = e.key.toLowerCase();

    if (k === "arrowup" || k === "w") player.keys[0] = false;
    if (k === "arrowdown" || k === "s") player.keys[1] = false;
    if (k === "arrowleft" || k === "a") player.keys[2] = false;
    if (k === "arrowright" || k === "d") player.keys[3] = false;
  }

  update() {
    let dx = 0, dy = 0;
    let dt = deltaTime / 1000;

    if (this.keys[0]) dy -= 1;
    if (this.keys[1]) dy += 1;
    if (this.keys[2]) dx -= 1;
    if (this.keys[3]) dx += 1;

    let m = sqrt(dx * dx + dy * dy);
    if (m > 0) {
      dx /= m;
      dy /= m;

      this.speed += tileSize * 12 * dt;
      this.speed = min(this.speed, this.maxSpeed);
    } else {
      this.speed = this.originSpeed;
    }

    dx *= this.speed * dt;
    dy *= this.speed * dt;

    this.x += dx;
    if (this.collides(this.x, this.y)) this.x -= dx;

    this.y += dy;
    if (this.collides(this.x, this.y)) this.y -= dy;
  }

  collides(px, py) {
    let inset = tileSize * 0.18;
  
    let x1 = floor((px + inset) / tileSize);
    let y1 = floor((py + inset) / tileSize);

    let x2 = floor((px + this.size - inset) / tileSize);
    let y2 = floor((py + this.size - inset) / tileSize);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (maze.getCell(x, y).t === 0) return true;
      }
    }

    return false;
  }
  
  display() {
    fill(255, 0, 0);
    noStroke();
    
    rect(this.x, this.y, this.size, this.size);
  }

  init() {
    document.addEventListener("keydown", this.keyDown);
    document.addEventListener("keyup", this.keyUp);
  }
}

class Maze {
  constructor(w, h) {
    this.w = w;
    this.h = h;

    this.gw = w * 2 + 1;
    this.gh = h * 2 + 1;

    this.grid = [];
    this.visited = [];

    this.setVisited(0, 0, true);
    this.getCell(1, 1).t = 1;

    this.stack = [];
    this.add(0, 0);
    
    this.fadeSpeed = 25;
    this.generated = false;
    
    this.checkpoints = [];
    this.currCheckpoint = 0;
    
    this.genCheckpoint();
    this.explored = new Set();
  }

  step() {
    if (this.stack.length === 0) {
      this.generated = true;
      return;
    }

    let i = floor(random(this.stack.length));
    let [cx, cy, nx, ny] = this.stack.splice(i, 1)[0];

    if (!this.visited[ny][nx]) {
      let wx = cx * 2 + 1 + (nx - cx);
      let wy = cy * 2 + 1 + (ny - cy);

      this.getCell(cx * 2 + 1, cy * 2 + 1).t = 1;
      this.getCell(nx * 2 + 1, ny * 2 + 1).t = 1;
      
      this.getCell(wx, wy).t = 1;
      this.setVisited(nx, ny, true);
      
      this.getCell(cx * 2 + 1, cy * 2 + 1).o = 0;
      this.getCell(nx * 2 + 1, ny * 2 + 1).o = 0;
      
      this.getCell(wx, wy).o = 0;
      this.add(nx, ny);
    }
  }

  add(x, y) {
    let dirs = [[1, 0],[-1, 0],[0, 1],[0, -1]];
    
    for (let [dx, dy] of dirs) {
      let nx = x + dx, ny = y + dy;
      
      if (!this.getVisited(nx, ny)) {
        this.stack.push([x, y, nx, ny]);
      }
    }
  }
  
  generate(px, py, steps = 500) {
    for (let s = 0; s < steps; s++) this.step();
  }
    
  isExplored(x, y) {
    return this.explored.has(x + ", " + y);
  }
  
  display() {
    let c = this.hexRGB(mazeColor);

    let startX = floor((player.x - width / 2) / tileSize) - 2;
    let endX = floor((player.x + width / 2) / tileSize) + 2;

    let startY = floor((player.y - height / 2) / tileSize) - 2;
    let endY = floor((player.y + height / 2) / tileSize) + 2;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        let cell = this.getCell(x, y);
        cell.o = min(255, cell.o + this.fadeSpeed);
        
        stroke(c.r - 75, c.g - 75, c.b - 75, cell.o);
        strokeWeight(2);

        if (cell.t === 1) {
          let px = x * tileSize;
          let py = y * tileSize;

          let top = this.getCell(x, y - 1).t === 1;
          let right = this.getCell(x + 1, y).t === 1;
          
          let bottom = this.getCell(x, y + 1).t === 1;
          let left = this.getCell(x - 1, y).t === 1;

          if (!top) line(px, py, px + tileSize, py);
          if (!bottom) line(px + tileSize, py + tileSize, px, py + tileSize);
          
          if (!left) line(px, py + tileSize, px, py);
          if (!right) line(px + tileSize, py, px + tileSize, py + tileSize);
        }
      }
    }

    noStroke();

    for (let node of astar.path) {
      if (node) node.display(color(255, 255, 0));
    }

    fill(0, 200, 0);
    noStroke();
    
    let cp = this.checkpoints[this.currCheckpoint];
    rect(cp.x * tileSize, cp.y * tileSize, tileSize, tileSize);
  }
  
  getNode(astar, x, y) {
    if (astar.nodes[y] === undefined) astar.nodes[y] = [];
    if (astar.nodes[y][x] === undefined) astar.nodes[y][x] = new Node(x, y);

    return astar.nodes[y][x];
  }
  
  getCell(x, y) {
    if (!this.grid[y]) this.grid[y] = [];
    if (!this.grid[y][x]) this.grid[y][x] = { t: 0, o: 0 };

    return this.grid[y][x];
  }

  getVisited(x, y) {
    if (!this.visited[y]) this.visited[y] = [];
    if (!this.visited[y][x]) this.visited[y][x] = false;

    return this.visited[y][x];
  }

  setVisited(x, y, v) {
    if (!this.visited[y]) this.visited[y] = [];
    this.visited[y][x] = v;
  }
  
  genCheckpoint() {
    let cells = [];
    
    let startX = round((player.x - width / 2) / tileSize) - 2;
    let endX = round((player.x + width / 2) / tileSize) + 2;

    let startY = round((player.y - height / 2) / tileSize) - 2;
    let endY = round((player.y + height / 2) / tileSize) + 2;
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let x1 = x, 
            y1 = y;
        let x2 = round(player.x / tileSize), 
            y2 = round(player.y / tileSize);
        
        if (
          this.getCell(x, y).t === 1 &&
          dist(x1, y1, x2, y2) < 40
        ) cells.push({ x, y });
      }
    }
    
    this.checkpoints.push(random(cells));
  }
  
  hexRGB(h, a) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: a || 255
    } : { r: 0, g: 0, b: 0, a: 0 };
  }
}

class Hunter {
  constructor() {
    let loc = this.randomSpawn();
    
    this.x = loc.x * tileSize;
    this.y = loc.y * tileSize;
    
    this.speed = tileSize * 2.5;
    this.astar = new AStar();
    
    this.astar.init(
      maze.getNode(
        this.astar, 
        round(this.x / tileSize), 
        round(this.y / tileSize)
      ),
      maze.getNode(
        this.astar, 
        round(player.x / tileSize), 
        round(player.y / tileSize)
      )
    );
    
    this.path = [];
    this.pathIndex = 0;
    
    this.repathTimer = 0;
    this.c = color(190, 0, 255);
    
    this.timer = 0;
  }
  
  update() {
    let dt = deltaTime / 1000;
    this.repathTimer += dt;

    if ((this.repathTimer > 0.25 && this.isCentered()) || this.path.length === 0) {
      this.recalculatePath();
      this.repathTimer = 0;
    }

    if (this.path.length > 0) {
      if (this.pathIndex >= this.path.length) return;

      let target = this.path[this.pathIndex];
      if (!target) return;

      let tx = target.x * tileSize;
      let ty = target.y * tileSize;

      let dx = tx - this.x;
      let dy = ty - this.y;

      let d = Math.sqrt(dx * dx + dy * dy);
      let step = this.speed * dt;

      if (d < 2) {
        this.pathIndex++;
      } else {
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
      }
    }
    
    if (
      this.hasCollided(this.x, this.y, player.x, player.y)
    ) this.timer += deltaTime;
    if (this.timer / 1000 >= 0.5) {
      this.timer = 0;
      
      hearts--;
      if (hearts <= 0) reset();
      
      let loc = this.randomSpawn();
      
      this.x = loc.x * tileSize;
      this.y = loc.y * tileSize;
    }
  }
  
  recalculatePath() {
    this.astar = new AStar();
    
    let px = round(player.x / tileSize), py = round(player.y / tileSize);
    if (maze.getCell(px, py).t !== 1) return;
    
    let startNode = maze.getNode(
      this.astar, 
      round(this.x / tileSize),
      round(this.y / tileSize)
    );
    let endNode = maze.getNode(
      this.astar, 
      round(player.x / tileSize),
      round(player.y / tileSize)
    );

    this.astar.init(startNode, endNode);
    while (!this.astar.solved) this.astar.run();
    
    this.path = [...this.astar.path].reverse();
    this.pathIndex = 0;
  }
  
  isCentered() {
    let cx = round(this.x / tileSize) * tileSize;
    let cy = round(this.y / tileSize) * tileSize;

    return abs(this.x - cx) < 2 && abs(this.y - cy) < 2;
  }
  
  hasCollided(x1, y1, x2, y2) {
    return (
      x1 < x2 + tileSize &&
      x1 + tileSize > x2 &&
      y1 < y2 + tileSize &&
      y1 + tileSize > y2
    );
  }
  
  calcSteps(start, end) {
    let s = 7, f = 1.5;
    let h = this.heuristic(start, end);
    
    return round((h * s * f) * 1.25);
  }
  
  heuristic(b, a) {
    return abs(a.x - b.x) + abs(a.y - b.y);
  }
  
  randomSpawn() {
    let cells = []; 
    
    let startX = round((player.x - width * 2) / tileSize) - 2; 
    let endX = round((player.x + width * 2) / tileSize) + 2; 
    
    let startY = round((player.y - height * 2) / tileSize) - 2; 
    let endY = round((player.y + height * 2) / tileSize) + 2; 
    
    for (let y = startY; y < endY; y++) { 
      for (let x = startX; x < endX; x++) {
        let px = round(player.x / tileSize);
        let py = round(player.y / tileSize); 
        
        if (
          maze.getCell(x, y).t === 1 && 
          dist(x, y, px, py) <= 150
        ) {
          cells.push({ x, y });
        }
      }
    }
    
    return random(cells);
  }
  
  display() {
    fill(this.c);
    noStroke();
    
    rect(this.x + 2.5, this.y + 2.5, tileSize - 5, tileSize - 5);
  }
}

class AStar {
  constructor() {
    this.nodes = [];
    
    this.openSet = [];
    this.closedSet = [];
    
    this.start = null;
    this.end = null;
    
    this.path = [];
    this.solved = false;
  }
  
  init(start, end) {
    for (let y = 0; y < maze.gh; y++) {
      this.nodes[y] = [];
      
      for (let x = 0; x < maze.gw; x++) {
        this.nodes[y][x] = new Node(x, y);
      }
    }
    
    for (let y = 0; y < maze.gh; y++) {
      for (let x = 0; x < maze.gw; x++) {
        this.nodes[y][x].getNeighbors(this);
      }
    }
    
    let cp = maze.checkpoints[maze.currCheckpoint];
    let px = round(player.x / tileSize), py = round(player.y / tileSize);

    this.start = maze.getNode(this, start.x, start.y);
    this.end = maze.getNode(this, end.x, end.y);

    this.start.g = 0;
    this.start.h = this.start.heuristic(this.start, this.end);
    
    this.start.f = this.start.h;
    this.openSet.push(this.start);
    
    if (!start || !end) {
      this.solved = true;
      return;
    }
  }

  run() {
    if (this.openSet.length === 0) {
      this.solved = true;
      console.log("A* Failed - No Path Found!");
      
      return;
    }

    let current = null;

    for (let node of this.openSet) {
      if (!current || node.f < current.f) {
        current = node;
      }
    }
    
    if (!current) return;
    if (current === this.end) {
      this.buildPath(current);
      this.solved = true;
      
      return;
    }

    this.openSet.splice(this.openSet.indexOf(current), 1);
    this.closedSet.push(current);
    
    for (let neighbor of current.getNeighbors(this)) {
      if (this.closedSet.includes(neighbor)) continue;
      if (maze.getCell(neighbor.x, neighbor.y).t !== 1) continue;
      
      let tempG = current.g + 1;
      let newPath = false;

      if (!this.openSet.includes(neighbor)) {
        this.openSet.push(neighbor);
        newPath = true;
      } else if (tempG < neighbor.g) {
        newPath = true;
      }

      if (newPath) {
        neighbor.g = tempG;
        neighbor.h = neighbor.heuristic(neighbor, this.end);
        
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.previous = current;
      }
    }
    
    this.buildPath(current);
  }

  buildPath(curr) {
    this.path = [];
    let temp = curr;

    while (temp) {
      this.path.push(temp);
      temp = temp.previous;
    }
  }
}

class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    this.f = 0;
    this.g = Infinity;
    this.h = 0;
    
    this.previous = undefined;
  }
  
  display(c) {
    fill(c);
    noStroke();
    
    rect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
  }
  
  getNeighbors(astar) {
    let neighbors = [];

    let dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];

    for (let [dx, dy] of dirs) {
      let nx = this.x + dx;
      let ny = this.y + dy;

      if (maze.getCell(nx, ny).t === 1) {
        neighbors.push(maze.getNode(astar, nx, ny));
      }
    }

    return neighbors;
  }
  
  heuristic(a, b) {
    return abs(a.x - b.x) + abs(a.y - b.y);
  }
}