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

function precomputeVariations() {
    PIECE_DEFS.forEach(piece => {
        let uniqueShapes = new Set();
        let variations = [];
        let currentShape = piece.base;

        for (let flip = 0; flip < 2; flip++) {
            for (let rot = 0; rot < 4; rot++) {
                currentShape = rotateShape(currentShape);
                let normalized = normalizeShape([...currentShape]);
                let shapeString = JSON.stringify(normalized);
                if (!uniqueShapes.has(shapeString)) {
                    uniqueShapes.add(shapeString);
                    variations.push(normalized);
                }
            }
            currentShape = flipShape(currentShape);
        }
        pieceVariations[piece.id] = variations;
    });
}

function canPlace(board, emptyIndex, shape) {
    const rootX = emptyIndex % BOARD_COLS;
    const rootY = Math.floor(emptyIndex / BOARD_COLS);
    for (let pt of shape) {
        const x = rootX + pt[0];
        const y = rootY + pt[1];
        if (x < 0 || x >= BOARD_COLS || y < 0 || y >= BOARD_ROWS) return false;
        const targetIndex = y * BOARD_COLS + x;
        if (board[targetIndex] !== 0) return false;
    }
    return true;
}

function arePiecesTouching(board, p1, p2) {
    for (let i = 0; i < TOTAL_CELLS; i++) {
        if (board[i] === p1) {
            const x = i % BOARD_COLS;
            const y = Math.floor(i / BOARD_COLS);
            if (x > 0 && board[i - 1] === p2) return true;
            if (x < BOARD_COLS - 1 && board[i + 1] === p2) return true;
            if (y > 0 && board[i - BOARD_COLS] === p2) return true;
            if (y < BOARD_ROWS - 1 && board[i + BOARD_COLS] === p2) return true;
        }
    }
    return false;
}

function isPlacementValidForConditions(board, placedPieceId) {
    for (let cond of conditions) {
        if (cond.pieces.includes(placedPieceId)) {
            let otherPieceId = cond.pieces[0] === placedPieceId ? cond.pieces[1] : cond.pieces[0];
            if (board.includes(otherPieceId)) {
                let touching = arePiecesTouching(board, placedPieceId, otherPieceId);
                if (cond.type === 'must_touch' && !touching) return false;
                if (cond.type === 'cannot_touch' && touching) return false;
            }
        }
    }
    return true;
}

function placePiece(board, emptyIndex, shape, pieceId) {
    const rootX = emptyIndex % BOARD_COLS;
    const rootY = Math.floor(emptyIndex / BOARD_COLS);
    for (let pt of shape) {
        board[(rootY + pt[1]) * BOARD_COLS + (rootX + pt[0])] = pieceId;
    }
}

function removePiece(board, emptyIndex, shape) {
    const rootX = emptyIndex % BOARD_COLS;
    const rootY = Math.floor(emptyIndex / BOARD_COLS);
    for (let pt of shape) {
        board[(rootY + pt[1]) * BOARD_COLS + (rootX + pt[0])] = 0;
    }
}

function solveRecursive(board, remainingPieces) {
    let emptyIndex = 0;
    while (emptyIndex < TOTAL_CELLS && board[emptyIndex] !== 0) { emptyIndex++; }

    if (emptyIndex === TOTAL_CELLS) {
        for (let cond of conditions) {
            if (cond.type === 'must_touch') {
                if (!board.includes(cond.pieces[0]) || !board.includes(cond.pieces[1])) {
                    return false; // Reject solution if both aren't on the board
                }
            }
        }
        allSolutions.push([...board]); 
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
                    if (solveRecursive(board, nextPieces)) return true; 
                }
                removePiece(board, emptyIndex, shape);
            }
        }
    }
    return false;
}