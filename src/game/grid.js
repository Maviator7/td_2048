import { COLS, ROWS } from "./constants";

const TILE_COLOR_MAP = {
  2: ["#eee4da", "#776e65"],
  4: ["#ede0c8", "#776e65"],
  8: ["#f2b179", "#fff"],
  16: ["#f59563", "#fff"],
  32: ["#f67c5f", "#fff"],
  64: ["#f65e3b", "#fff"],
  128: ["#edcf72", "#f9f6f2"],
  256: ["#edcc61", "#f9f6f2"],
  512: ["#edc850", "#f9f6f2"],
  1024: ["#edc53f", "#f9f6f2"],
  2048: ["#edc22e", "#f9f6f2"],
};

function slideLine(line) {
  const numbers = line.filter(Boolean);
  const result = [];
  let score = 0;
  let index = 0;

  while (index < numbers.length) {
    if (index + 1 < numbers.length && numbers[index] === numbers[index + 1]) {
      const mergedValue = numbers[index] * 2;
      result.push(mergedValue);
      score += mergedValue;
      index += 2;
      continue;
    }

    result.push(numbers[index]);
    index += 1;
  }

  while (result.length < line.length) {
    result.push(0);
  }

  return { line: result, score };
}

export function slideGrid(grid, direction) {
  const nextGrid = grid.map((row) => [...row]);
  let score = 0;
  let moved = false;

  const processLine = (line) => {
    const before = line.join();
    const { line: after, score: gained } = slideLine(line);

    if (after.join() !== before) {
      moved = true;
    }

    score += gained;
    return after;
  };

  if (direction === "left") {
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
      nextGrid[rowIndex] = processLine(nextGrid[rowIndex]);
    }
  } else if (direction === "right") {
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
      nextGrid[rowIndex] = processLine([...nextGrid[rowIndex]].reverse()).reverse();
    }
  } else if (direction === "up") {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      const column = processLine(nextGrid.map((row) => row[colIndex]));
      column.forEach((value, rowIndex) => {
        nextGrid[rowIndex][colIndex] = value;
      });
    }
  } else if (direction === "down") {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      const column = processLine(nextGrid.map((row) => row[colIndex]).reverse()).reverse();
      column.forEach((value, rowIndex) => {
        nextGrid[rowIndex][colIndex] = value;
      });
    }
  }

  return { grid: nextGrid, score, moved };
}

export function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function addRandomTile(grid) {
  const emptyCells = [];

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      if (!grid[rowIndex][colIndex]) {
        emptyCells.push([rowIndex, colIndex]);
      }
    }
  }

  if (!emptyCells.length) {
    return grid;
  }

  const [rowIndex, colIndex] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const nextGrid = grid.map((row) => [...row]);
  nextGrid[rowIndex][colIndex] = Math.random() < 0.85 ? 2 : 4;
  return nextGrid;
}

export function canMove(grid) {
  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      if (!grid[rowIndex][colIndex]) {
        return true;
      }

      if (colIndex + 1 < COLS && grid[rowIndex][colIndex] === grid[rowIndex][colIndex + 1]) {
        return true;
      }

      if (rowIndex + 1 < ROWS && grid[rowIndex][colIndex] === grid[rowIndex + 1][colIndex]) {
        return true;
      }
    }
  }

  return false;
}

export function findMergedCells(previousGrid, nextGrid) {
  const mergedCells = [];

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      if (nextGrid[rowIndex][colIndex] !== previousGrid[rowIndex][colIndex] && nextGrid[rowIndex][colIndex] > 0) {
        mergedCells.push(`${rowIndex}-${colIndex}`);
      }
    }
  }

  return mergedCells;
}

export function getColumnPowers(grid) {
  return Array.from({ length: COLS }, (_, colIndex) => {
    let power = 0;
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
      power += grid[rowIndex][colIndex];
    }
    return power;
  });
}

export function getTileColors(value) {
  return TILE_COLOR_MAP[value] || ["#3c3a32", "#f9f6f2"];
}
