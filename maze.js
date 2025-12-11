function randomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = {
            top: true,
            right: true,
            bottom: true,
            left: true,
        };
        this.visited = false;
        this.visitedOrder = 0;
    }

    draw(ctx, cellWidth) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();

        const px = this.x * cellWidth;
        const py = this.y * cellWidth;

        ctx.moveTo(px, py);

        if (this.walls.left) {
            ctx.lineTo(px, py + cellWidth);
        } else {
            ctx.moveTo(px, py + cellWidth);
        }

        if (this.walls.bottom) {
            ctx.lineTo(px + cellWidth, py + cellWidth);
        } else {
            ctx.moveTo(px + cellWidth, py + cellWidth);
        }

        if (this.walls.right) {
            ctx.lineTo(px + cellWidth, py);
        } else {
            ctx.moveTo(px + cellWidth, py);
        }

        if (this.walls.top) {
            ctx.lineTo(px, py);
        } else {
            ctx.moveTo(px, py);
        }

        ctx.stroke();
    }

    // find naboerne i grid vha. this.x og this.y
    unvisitedNeighbors(grid) {
        let neighbors = [];

        // Vi er ikke den nordligste celle
        if (this.y > 0) {
            const nord_x = this.x;
            const nord_y = this.y - 1;
            const nord_nabo = grid[nord_x][nord_y];
            if (!nord_nabo.visited) {
                neighbors.push(nord_nabo);
            }
        }

        // Vi er ikke cellen mest til venstre
        if (this.x > 0) {
            const venstre_x = this.x - 1;
            const venstre_y = this.y;
            const venstre_nabo = grid[venstre_x][venstre_y];
            if (!venstre_nabo.visited) {
                neighbors.push(venstre_nabo);
            }
        }

        // Vi er ikke den sydligste celle
        if (this.y < grid[0].length - 1) {
            const syd_x = this.x;
            const syd_y = this.y + 1;
            const syd_nabo = grid[syd_x][syd_y];
            if (!syd_nabo.visited) {
                neighbors.push(syd_nabo);
            }
        }

        // Vi er ikke cellen mest til højre
        if (this.x < grid.length - 1) {
            const højre_x = this.x + 1;
            const højre_y = this.y;
            const højre_nabo = grid[højre_x][højre_y];
            if (!højre_nabo.visited) {
                neighbors.push(højre_nabo);
            }
        }

        return neighbors;
    }

    punchWallDown(otherCell) {
        const dx = this.x - otherCell.x;
        const dy = this.y - otherCell.y;

        if (dx === 1) {
            // otherCell er til venstre for this
            this.walls.left = false;
            otherCell.walls.right = false;
        } else if (dx === -1) {
            // otherCell er til højre for this
            this.walls.right = false;
            otherCell.walls.left = false;
        } else if (dy === 1) {
            // otherCell er over this
            this.walls.top = false;
            otherCell.walls.bottom = false;
        } else if (dy === -1) {
            // otherCell er under this
            this.walls.bottom = false;
            otherCell.walls.top = false;
        }
    }
}

class Maze {
    constructor(cols, rows, canvas, rand = 0.25, useHybrid = true) {
        this.grid = [];
        this.cols = cols;
        this.rows = rows;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellWidth = canvas.width / cols;
        this.rand = rand;
        this.useHybrid = useHybrid; 
        this.initializeGrid();
    }

    initializeGrid() {
        for (let i = 0; i < this.rows; i += 1) {
            this.grid.push([]);
            for (let j = 0; j < this.cols; j += 1) {
                this.grid[i].push(new Cell(i, j));
            }
        }
    }

    // NY METODE: Fjern alle indre vægge for at starte Recursive Division
    removeAllInnerWalls() {
        for (let i = 0; i < this.rows; i += 1) {
            for (let j = 0; j < this.cols; j += 1) {
                const cell = this.grid[i][j];
                // Behold kun ydervægge
                cell.walls.top = (j === 0);
                cell.walls.bottom = (j === this.cols - 1);
                cell.walls.left = (i === 0);
                cell.walls.right = (i === this.rows - 1);
            }
        }
    }

    // NY METODE: Recursive Division algoritme
    recursiveDivision(x, y, width, height) {
        // Stop hvis området er for småt
        if (width < 2 || height < 2) {
            return;
        }

        // Vælg om vi skal dele horisontalt eller vertikalt
        const horizontal = width < height ? true : (width > height ? false : Math.random() > 0.5);

        if (horizontal) {
            // Del horisontalt
            const wallY = y + randomInteger(0, height - 1);
            const passageX = x + randomInteger(0, width);

            // Tegn vandret væg med ét hul
            for (let i = x; i < x + width; i++) {
                if (i !== passageX) {
                    this.grid[i][wallY].walls.bottom = true;
                    if (wallY + 1 < this.cols) {
                        this.grid[i][wallY + 1].walls.top = true;
                    }
                }
            }

            // Rekursivt del de to nye områder
            this.recursiveDivision(x, y, width, wallY - y + 1);
            this.recursiveDivision(x, wallY + 1, width, y + height - wallY - 1);
        } else {
            // Del vertikalt
            const wallX = x + randomInteger(0, width - 1);
            const passageY = y + randomInteger(0, height);

            // Tegn lodret væg med ét hul
            for (let j = y; j < y + height; j++) {
                if (j !== passageY) {
                    this.grid[wallX][j].walls.right = true;
                    if (wallX + 1 < this.rows) {
                        this.grid[wallX + 1][j].walls.left = true;
                    }
                }
            }

            // Rekursivt del de to nye områder
            this.recursiveDivision(x, y, wallX - x + 1, height);
            this.recursiveDivision(wallX + 1, y, x + width - wallX - 1, height);
        }
    }

    // MODIFICERET: Din originale generate metode (Recursive Backtracking)
    recursiveBacktracking() {
        const start_x = randomInteger(0, this.cols);
        const start_y = randomInteger(0, this.rows);
        let currentCell = this.grid[start_x][start_y];
        let stack = [];
        let visitCounter = 0;

        // Reset visited status
        for (let i = 0; i < this.rows; i += 1) {
            for (let j = 0; j < this.cols; j += 1) {
                this.grid[i][j].visited = false;
            }
        }

        currentCell.visited = true;
        currentCell.visitedOrder = visitCounter++;

        while (currentCell != null) {
            let unvisitedNeighbors = currentCell.unvisitedNeighbors(this.grid);
            if (unvisitedNeighbors.length > 0) {
                const randomNeighborCell = unvisitedNeighbors[randomInteger(0, unvisitedNeighbors.length)];
                currentCell.punchWallDown(randomNeighborCell);
                stack.push(currentCell);
                currentCell = randomNeighborCell;
                currentCell.visited = true;
                currentCell.visitedOrder = visitCounter++;
            } else {
                if (Math.random() < this.rand && stack.length > 0) {
                    const randomIndex = randomInteger(0, stack.length);
                    currentCell = stack[randomIndex];
                    stack.splice(randomIndex, 1);
                } else {
                    currentCell = stack.pop();
                }
            }
        }
    }

    generate() {
        if (this.useHybrid) {
            console.log("🎨 Genererer hybrid labyrint (Division + Backtracking)");
            this.removeAllInnerWalls();
            this.recursiveDivision(0, 0, this.rows, this.cols);
            this.recursiveBacktracking();
        } else {
            console.log("🔄 Genererer normal labyrint (kun Backtracking)");
            this.recursiveBacktracking();
        }
    }

    draw() {
        const totalCells = this.rows * this.cols;
        for (let i = 0; i < this.rows; i += 1) {
            for (let j = 0; j < this.cols; j += 1) {
                const cell = this.grid[i][j];
                
                const hue = (cell.visitedOrder / totalCells) * 360;
                this.ctx.fillStyle = `hsl(${hue}, 70%, 90%)`;
                this.ctx.fillRect(
                    cell.x * this.cellWidth,
                    cell.y * this.cellWidth,
                    this.cellWidth,
                    this.cellWidth
                );
                
                cell.draw(this.ctx, this.cellWidth);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    
    const maze = new Maze(20, 20, canvas, 0.50, true); 

    maze.generate();
    maze.draw();

    console.log(maze);
})
