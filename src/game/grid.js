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

function slideLine(cells) {
  const filledCells = cells.filter((cell) => cell.value);
  const result = [];
  let score = 0;
  let index = 0;
  const mergedCells = [];

  while (index < filledCells.length) {
    if (index + 1 < filledCells.length && filledCells[index].value === filledCells[index + 1].value) {
      const mergedValue = filledCells[index].value * 2;
      result.push({ value: mergedValue, damage: 0 });
      score += mergedValue;
      mergedCells.push(filledCells[index].key, filledCells[index + 1].key);
      index += 2;
      continue;
    }

    result.push(filledCells[index]);
    index += 1;
  }

  while (result.length < cells.length) {
    result.push({ value: 0, damage: 0 });
  }

  return { line: result, score, mergedCells };
}

function createCellGrid(grid, tileDamage) {
  return grid.map((row, rowIndex) => row.map((value, colIndex) => ({
    value,
    damage: tileDamage[rowIndex][colIndex],
    key: `${rowIndex}-${colIndex}`,
  })));
}

function splitCellGrid(cellGrid) {
  return {
    grid: cellGrid.map((row) => row.map((cell) => cell.value)),
    tileDamage: cellGrid.map((row) => row.map((cell) => cell.damage)),
  };
}

export function slideGrid(grid, tileDamage, direction) {
  const nextCells = createCellGrid(grid, tileDamage);
  let score = 0;
  let moved = false;
  const mergedInto = [];

  const processLine = (line) => {
    const before = line.map((cell) => `${cell.value}:${cell.damage}`).join("|");
    const { line: after, score: gained } = slideLine(line);

    if (after.map((cell) => `${cell.value}:${cell.damage}`).join("|") !== before) {
      moved = true;
    }

    score += gained;
    return after;
  };

  if (direction === "left") {
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
      nextCells[rowIndex] = processLine(nextCells[rowIndex]);
    }
  } else if (direction === "right") {
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
      nextCells[rowIndex] = processLine([...nextCells[rowIndex]].reverse()).reverse();
    }
  } else if (direction === "up") {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      const column = processLine(nextCells.map((row) => row[colIndex]));
      column.forEach((value, rowIndex) => {
        nextCells[rowIndex][colIndex] = value;
      });
    }
  } else if (direction === "down") {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      const column = processLine(nextCells.map((row) => row[colIndex]).reverse()).reverse();
      column.forEach((value, rowIndex) => {
        nextCells[rowIndex][colIndex] = value;
      });
    }
  }

  nextCells.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.value > 0 && !cell.key) {
        mergedInto.push(`${rowIndex}-${colIndex}`);
      }
    });
  });

  const nextState = splitCellGrid(nextCells);
  return { ...nextState, score, moved, mergedCells: mergedInto };
}

export function createEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function createEmptyDamageGrid() {
  return createEmptyGrid();
}

export function addRandomTile(grid, tileDamage) {
  const emptyCells = [];

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      if (!grid[rowIndex][colIndex]) {
        emptyCells.push([rowIndex, colIndex]);
      }
    }
  }

  if (!emptyCells.length) {
    return { grid, tileDamage };
  }

  const [rowIndex, colIndex] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const nextGrid = grid.map((row) => [...row]);
  const nextDamage = tileDamage.map((row) => [...row]);
  nextGrid[rowIndex][colIndex] = Math.random() < 0.85 ? 2 : 4;
  nextDamage[rowIndex][colIndex] = 0;
  return { grid: nextGrid, tileDamage: nextDamage };
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

export function getEffectiveTileValue(value, damage) {
  return Math.max(0, value - damage);
}

export function getEffectiveGrid(grid, tileDamage) {
  return grid.map((row, rowIndex) => row.map((value, colIndex) => getEffectiveTileValue(value, tileDamage[rowIndex][colIndex])));
}

export function getColumnPowers(grid, tileDamage) {
  return Array.from({ length: COLS }, (_, colIndex) => {
    let power = 0;
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
      power += getEffectiveTileValue(grid[rowIndex][colIndex], tileDamage[rowIndex][colIndex]);
    }
    return power;
  });
}

export function applyLaneDamage(grid, tileDamage, lane, damageAmount) {
  if (damageAmount <= 0) {
    return { grid, tileDamage, damageTaken: 0, affectedCells: [] };
  }

  const nextGrid = grid.map((row) => [...row]);
  const nextDamage = tileDamage.map((row) => [...row]);
  let remainingDamage = damageAmount;
  let damageTaken = 0;
  const affectedCells = [];

  for (let rowIndex = 0; rowIndex < ROWS && remainingDamage > 0; rowIndex += 1) {
    const baseValue = nextGrid[rowIndex][lane];
    if (!baseValue) {
      continue;
    }

    const effectiveValue = getEffectiveTileValue(baseValue, nextDamage[rowIndex][lane]);
    if (!effectiveValue) {
      continue;
    }

    const absorbedDamage = Math.min(effectiveValue, remainingDamage);
    nextDamage[rowIndex][lane] = Math.min(baseValue, nextDamage[rowIndex][lane] + absorbedDamage);
    remainingDamage -= absorbedDamage;
    damageTaken += absorbedDamage;
    affectedCells.push({
      key: `${rowIndex}-${lane}`,
      row: rowIndex,
      col: lane,
      damage: absorbedDamage,
    });
  }

  return { grid: nextGrid, tileDamage: nextDamage, damageTaken, affectedCells };
}

export function getTileColors(value) {
  return TILE_COLOR_MAP[value] || ["#3c3a32", "#f9f6f2"];
}
