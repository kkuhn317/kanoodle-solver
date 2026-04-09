// ==========================================
// USER INTERACTION & PLACEMENT LOGIC
// ==========================================

function selectPiece(pieceId) {
    if (isSolving) return;
    if (allSolutions.length > 0) return;
    if (pieceId !== 'blocker' && usedPieces.has(pieceId)) return; 
    
    if (activePieceId === pieceId) {
        activePieceId = null; 
        currentActiveShape = null;
    } else {
        activePieceId = pieceId;
        if (pieceId === 'blocker') {
            currentActiveShape = [[0,0]];
        } else {
            const pieceDef = PIECE_DEFS.find(p => p.id === pieceId);
            // Load the base shape to start
            currentActiveShape = normalizeShape([...pieceDef.base]);
        }
    }
    updatePaletteUI();
    updateCursorPieceUI();
}

function actionRotate() {
    if (isSolving) return;
    if (!activePieceId || !currentActiveShape || activePieceId === 'blocker') return;
    const gridType = GAMES[currentGame].gridType || 'square';
    currentActiveShape = normalizeShape(gridType === 'triangular' ? rotateHex(currentActiveShape) : rotateShape(currentActiveShape));
    updateCursorPieceUI();
    if (lastHoveredIndex !== -1) handleHover(lastHoveredIndex); 
}

function actionFlip() {
    if (isSolving) return;
    if (!activePieceId || !currentActiveShape || activePieceId === 'blocker') return;
    const gridType = GAMES[currentGame].gridType || 'square';
    currentActiveShape = normalizeShape(gridType === 'triangular' ? flipHex(currentActiveShape) : flipShape(currentActiveShape));
    updateCursorPieceUI();
    if (lastHoveredIndex !== -1) handleHover(lastHoveredIndex); 
}

function handleHover(index) {
    if (isSolving) return;
    if (boardState[index] === -1) return;
    lastHoveredIndex = index;
    clearHoverVisuals();
    if (!activePieceId || !currentActiveShape) return;
    
    if (canPlace(boardState, index, currentActiveShape)) {
        const rootX = index % BOARD_COLS;
        const rootY = Math.floor(index / BOARD_COLS);
        const gridType = GAMES[currentGame].gridType || 'square';
        
        for (let pt of currentActiveShape) {
            const [x, y] = getBoardCoords(rootX, rootY, pt[0], pt[1], gridType);
            const cellIndex = y * BOARD_COLS + x;
            document.getElementById(`cell-${cellIndex}`).style.boxShadow = 'inset 0 0 0 3px white';
        }
    }
}

function clearHoverVisuals() {
    for (let i = 0; i < TOTAL_CELLS; i++) {
        document.getElementById(`cell-${i}`).style.boxShadow = 'none';
    }
}

function clearHover() {
    lastHoveredIndex = -1;
    clearHoverVisuals();
}

function handleClick(index) {
    if (isSolving) return;
    if (boardState[index] === -1) return;
    if (allSolutions.length > 0) {
        allSolutions = [];
        currentSolutionIndex = -1;
        boardState = [...startingBoardState];
        updateNavUI();
        updatePaletteUI();
        btnSolve.innerText = "Find All Solutions";
        btnSolve.disabled = false;
        btnResetStart.style.display = 'none';
        renderBoard();
        return;
    }

    // 1. Remove piece if clicked on occupied cell
    if (boardState[index] !== 0) {
        const clickedPieceId = boardState[index];
        if (clickedPieceId === 'blocker') {
            boardState[index] = 0;
        } else {
            for (let i = 0; i < TOTAL_CELLS; i++) {
                if (boardState[i] === clickedPieceId) boardState[i] = 0;
            }
            usedPieces.delete(clickedPieceId);
        }
        updatePaletteUI();
        renderBoard();
        clearHoverVisuals();
        return;
    }

    // 2. Place active piece
    if (activePieceId && currentActiveShape) {
        if (canPlace(boardState, index, currentActiveShape)) {
            placePiece(boardState, index, currentActiveShape, activePieceId);
            if (activePieceId !== 'blocker') {
                usedPieces.add(activePieceId);
                activePieceId = null; 
                currentActiveShape = null;
            }
            updatePaletteUI();
            updateCursorPieceUI();
            renderBoard();
            clearHoverVisuals();
        }
    }
}