// ==========================================
// GEOMETRY ENGINE & CORE SOLVER
// ==========================================

function normalizeShape(shape) {
    shape.sort((a, b) => (a[1] !== b[1]) ? (a[1] - b[1]) : (a[0] - b[0]));
    const rootX = shape[0][0];
    const rootY = shape[0][1];
    return shape.map(pt => [pt[0] - rootX, pt[1] - rootY]);
}

function rotateShape(shape) { return shape.map(pt => [-pt[1], pt[0]]); }
function flipShape(shape) { return shape.map(pt => [-pt[0], pt[1]]); }

function rotateHex(shape) { return shape.map(pt => [-pt[1], pt[0] + pt[1]]); }
function flipHex(shape) { return shape.map(pt => [-pt[0] - pt[1], pt[1]]); }

function precomputeVariations() {
    const gridType = GAMES[currentGame].gridType || 'square';
    const numRotations = gridType === 'triangular' ? 6 : 4;

    PIECE_DEFS.forEach(piece => {
        let uniqueShapes = new Set();
        let variations = [];
        let currentShape = piece.base;

        for (let flip = 0; flip < 2; flip++) {
            for (let rot = 0; rot < numRotations; rot++) {
                currentShape = gridType === 'triangular' ? rotateHex(currentShape) : rotateShape(currentShape);
                let normalized = normalizeShape([...currentShape]);
                let shapeString = JSON.stringify(normalized);
                if (!uniqueShapes.has(shapeString)) {
                    uniqueShapes.add(shapeString);
                    variations.push(normalized);
                }
            }
            currentShape = gridType === 'triangular' ? flipHex(currentShape) : flipShape(currentShape);
        }
        pieceVariations[piece.id] = variations;
    });
}

function getBoardCoords(rootX, rootY, ptX, ptY, gridType) {
    if (gridType === 'triangular') {
        // rootX, rootY are Offset coordinates. ptX, ptY are Axial coordinates.
        const rootQ = rootX - Math.floor(rootY / 2);
        const rootR = rootY;
        const targetQ = rootQ + ptX;
        const targetR = rootR + ptY;
        // Convert back to Offset 
        const targetX = targetQ + Math.floor(targetR / 2);
        const targetY = targetR;
        return [targetX, targetY];
    }
    return [rootX + ptX, rootY + ptY];
}

function canPlace(board, emptyIndex, shape) {
    const rootX = emptyIndex % BOARD_COLS;
    const rootY = Math.floor(emptyIndex / BOARD_COLS);
    const gridType = GAMES[currentGame].gridType || 'square';
    
    for (let pt of shape) {
        const [x, y] = getBoardCoords(rootX, rootY, pt[0], pt[1], gridType);
        if (x < 0 || x >= BOARD_COLS || y < 0 || y >= BOARD_ROWS) return false;
        const targetIndex = y * BOARD_COLS + x;
        if (board[targetIndex] !== 0) return false;
    }
    return true;
}

function getNeighbors(index, gridType) {
    const c = index % BOARD_COLS;
    const r = Math.floor(index / BOARD_COLS);
    let neighbors = [];
    
    const dirs = gridType === 'triangular' 
        ? (r % 2 !== 0 
            ? [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]] 
            : [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]])
        : [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
    dirs.forEach(d => {
        const nc = c + d[0];
        const nr = r + d[1];
        if (nc >= 0 && nc < BOARD_COLS && nr >= 0 && nr < BOARD_ROWS) {
            neighbors.push(nr * BOARD_COLS + nc);
        }
    });
    return neighbors;
}

function arePiecesTouching(board, p1, p2) {
    const gridType = GAMES[currentGame].gridType || 'square';
    for (let i = 0; i < TOTAL_CELLS; i++) {
        if (board[i] === p1) {
            const neighbors = getNeighbors(i, gridType);
            for (let n of neighbors) {
                if (board[n] === p2) return true;
            }
        }
    }
    return false;
}

function hasEmptyNeighbor(board, pieceId) {
    const gridType = GAMES[currentGame].gridType || 'square';
    for (let i = 0; i < TOTAL_CELLS; i++) {
        if (board[i] === pieceId) {
            const neighbors = getNeighbors(i, gridType);
            for (let n of neighbors) {
                if (board[n] === 0) return true;
            }
        }
    }
    return false;
}

function isPlacementValidForConditions(board, placedPieceId) {
    for (let cond of conditions) {
        if (cond.type === 'do_not_use' || cond.type === 'must_use') continue; // Handled pre-flight or post-flight
        
        const p1 = cond.pieces[0];
        const p2 = cond.pieces[1];
        
        if (cond.type === 'must_touch') {
            const p1OnBoard = board.includes(p1);
            const p2OnBoard = board.includes(p2);
            
            if (p1OnBoard && p2OnBoard) {
                if ((placedPieceId === p1 || placedPieceId === p2) && !arePiecesTouching(board, p1, p2)) {
                    return false;
                }
            } else if (p1OnBoard && !p2OnBoard) {
                if (!hasEmptyNeighbor(board, p1)) return false;
            } else if (!p1OnBoard && p2OnBoard) {
                if (!hasEmptyNeighbor(board, p2)) return false;
            }
        } else if (cond.type === 'cannot_touch') {
            if (placedPieceId === p1 || placedPieceId === p2) {
                let otherPieceId = p1 === placedPieceId ? p2 : p1;
                if (board.includes(otherPieceId)) {
                    if (arePiecesTouching(board, placedPieceId, otherPieceId)) return false;
                }
            }
        }
    }
    return true;
}

function placePiece(board, emptyIndex, shape, pieceId) {
    const rootX = emptyIndex % BOARD_COLS;
    const rootY = Math.floor(emptyIndex / BOARD_COLS);
    const gridType = GAMES[currentGame].gridType || 'square';
    for (let pt of shape) {
        const [x, y] = getBoardCoords(rootX, rootY, pt[0], pt[1], gridType);
        board[y * BOARD_COLS + x] = pieceId;
    }
}

function removePiece(board, emptyIndex, shape) {
    const rootX = emptyIndex % BOARD_COLS;
    const rootY = Math.floor(emptyIndex / BOARD_COLS);
    const gridType = GAMES[currentGame].gridType || 'square';
    for (let pt of shape) {
        const [x, y] = getBoardCoords(rootX, rootY, pt[0], pt[1], gridType);
        board[y * BOARD_COLS + x] = 0;
    }
}

let solverIterations = 0;

async function solveRecursive(board, remainingPieces, onProgress) {
    if (!isSolving) return true; // Abort signal

    let emptyIndex = 0;
    while (emptyIndex < TOTAL_CELLS && board[emptyIndex] !== 0) { emptyIndex++; }

    if (emptyIndex === TOTAL_CELLS) {
        for (let cond of conditions) {
            if (cond.type === 'must_touch') {
                if (!board.includes(cond.pieces[0]) || !board.includes(cond.pieces[1])) {
                    return false; // Reject solution if both aren't on the board
                }
            } else if (cond.type === 'must_use') {
                if (!board.includes(cond.pieces[0])) {
                    return false; // Reject solution if required piece is missing
                }
            }
        }
        allSolutions.push([...board]); 
        if (onProgress) onProgress(); 
        if (allSolutions.length >= MAX_SOLUTIONS) return true; 
        return false; 
    }

    for (let i = 0; i < remainingPieces.length; i++) {
        let piece = remainingPieces[i];
        let variations = pieceVariations[piece.id];

        for (let shape of variations) {
            if (canPlace(board, emptyIndex, shape)) {
                placePiece(board, emptyIndex, shape, piece.id);
                    
                if (isPlacementValidForConditions(board, piece.id)) {
                    let nextPieces = remainingPieces.filter(p => p.id !== piece.id);
                    
                    solverIterations++;
                    if (solverIterations % 2500 === 0) {
                        await new Promise(r => setTimeout(r, 0)); // Yield to keep browser responsive
                        if (onProgress) onProgress();
                    }

                    if (await solveRecursive(board, nextPieces, onProgress)) return true; 
                }
                removePiece(board, emptyIndex, shape);
            }
        }
    }
    return false;
}