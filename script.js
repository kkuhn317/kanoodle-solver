// --- Event Listeners ---
document.getElementById('btn-rotate').addEventListener('click', actionRotate);
document.getElementById('btn-flip').addEventListener('click', actionFlip);

document.addEventListener('keydown', (e) => {
    if (isSolving) return;
    if (e.key === 'r' || e.key === 'R') actionRotate();
    if (e.key === 'f' || e.key === 'F') actionFlip();
    if (e.key === 'Escape') { 
        activePieceId = null; 
        currentActiveShape = null;
        updatePaletteUI(); 
        updateCursorPieceUI();
        clearHoverVisuals(); 
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    isResetting = true;
    isSolving = false;
    boardState.fill(0);
    if (GAMES[currentGame].invalidCells) {
        GAMES[currentGame].invalidCells.forEach(i => boardState[i] = -1);
    }
    usedPieces.clear();
    activePieceId = null;
    currentActiveShape = null;
    allSolutions = [];
    currentSolutionIndex = -1;
    solverIterations = 0;
    difficultyRating = "";
    btnSolve.innerText = "Find All Solutions";
    btnSolve.disabled = false;
    btnResetStart.style.display = 'none';
    updatePaletteUI();
    updateCursorPieceUI();
    updateNavUI();
    renderBoard();
});

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (activePieceId) {
        cursorPiece.style.left = mouseX + 'px';
        cursorPiece.style.top = mouseY + 'px';
    }
});

btnSolve.addEventListener('click', async () => {
    if (isSolving) {
        isSolving = false; // Stop signal
        btnSolve.innerText = "Stopping...";
        btnSolve.disabled = true;
        return;
    }

    if (allSolutions.length > 0) {
        boardState = [...startingBoardState];
        allSolutions = [];
        currentSolutionIndex = -1;
        updateNavUI();
        updatePaletteUI();
        btnResetStart.style.display = 'none';
        renderBoard();
    }

    // Validate starting board against conditions
    let startingValid = true;
    for (let cond of conditions) {
        if (cond.type === 'do_not_use') {
            if (boardState.includes(cond.pieces[0])) startingValid = false;
        } else if (['must_use', 'touching_edge', 'touching_corner'].includes(cond.type)) {
            // No start validation needed. If it's not on the board yet, the solver will place it.
            if (boardState.includes(cond.pieces[0])) {
                if (cond.type === 'touching_edge' && !isPieceTouchingEdge(boardState, cond.pieces[0])) startingValid = false;
                if (cond.type === 'touching_corner' && !isPieceTouchingCorner(boardState, cond.pieces[0])) startingValid = false;
            }
        } else {
            if (boardState.includes(cond.pieces[0]) && boardState.includes(cond.pieces[1])) {
                let touching = arePiecesTouching(boardState, cond.pieces[0], cond.pieces[1]);
                if (cond.type === 'must_touch' && !touching) startingValid = false;
                if (cond.type === 'cannot_touch' && touching) startingValid = false;
            }
        }
    }
    
    if (!startingValid) {
        alert("The starting layout violates the solver conditions!");
        return;
    }

    if (activePieceId) {
        activePieceId = null;
        currentActiveShape = null;
        updateCursorPieceUI();
        clearHoverVisuals();
        updatePaletteUI();
    }

    let doNotUsePieces = conditions.filter(c => c.type === 'do_not_use').map(c => c.pieces[0]);
    let remainingPieces = PIECE_DEFS.filter(p => !usedPieces.has(p.id) && !doNotUsePieces.includes(p.id));
    
    let emptyCells = boardState.filter(cell => cell === 0).length;
    let availableBlocks = remainingPieces.reduce((sum, p) => sum + p.base.length, 0);
    
    if (availableBlocks < emptyCells) {
        alert("Not enough valid pieces remaining to fill the empty spaces on the board!");
        return;
    }

    isSolving = true;
    isResetting = false;
    btnSolve.innerText = "Stop (Found 0)";
    startingBoardState = [...boardState];
    allSolutions = [];
    solverIterations = 0;
    difficultyRating = "";
    
    // Wait a brief moment so the UI can update the button text
    await new Promise(r => setTimeout(r, 10));

    await solveRecursive(boardState, remainingPieces, () => {
        if (isSolving) btnSolve.innerText = `Stop (Found ${allSolutions.length})`;
    });
    
    if (isResetting) return;

    const wasAborted = !isSolving;
    isSolving = false;

    let avgIters = allSolutions.length > 0 ? Math.floor(solverIterations / allSolutions.length) : solverIterations;
    let diffName = "";
    let diffColor = "";
    if (avgIters < 500) { diffName = "Trivial"; diffColor = COLORS.lime; }
    else if (avgIters < 5000) { diffName = "Easy"; diffColor = COLORS.green; }
    else if (avgIters < 50000) { diffName = "Medium"; diffColor = COLORS.yellow; }
    else if (avgIters < 500000) { diffName = "Hard"; diffColor = COLORS.orange; }
    else { diffName = "Extreme"; diffColor = COLORS.red; }
    
    let stepText = allSolutions.length > 1 ? `(~${avgIters.toLocaleString()} steps/sol)` : `(${avgIters.toLocaleString()} steps)`;
    difficultyRating = `Difficulty: <strong style="color:${diffColor}">${diffName}</strong> <span style="color:#888; font-size:0.9em; margin-left:8px;">${stepText}</span>`;

    if (allSolutions.length >= MAX_SOLUTIONS) {
        btnSolve.innerText = `Found ${MAX_SOLUTIONS}+ Solutions (Capped)`;
    } else if (wasAborted) {
        btnSolve.innerText = `Stopped. Found ${allSolutions.length} Solutions`;
    } else {
        btnSolve.innerText = `Found ${allSolutions.length} Solutions!`;
    }
    
    btnSolve.disabled = false;

    if (allSolutions.length > 0) {
        showSolution(0);
        btnResetStart.style.display = 'inline-block';
    } else {
        if (!wasAborted) alert("No solutions found for this starting layout.");
        boardState = [...startingBoardState];
        btnSolve.innerText = "Find All Solutions";
        btnResetStart.style.display = 'none';
        renderBoard();
    }
});

document.getElementById('btn-prev').addEventListener('click', () => showSolution(currentSolutionIndex - 1));
document.getElementById('btn-next').addEventListener('click', () => showSolution(currentSolutionIndex + 1));

btnResetStart.addEventListener('click', () => {
    boardState = [...startingBoardState];
    allSolutions = [];
    currentSolutionIndex = -1;
    btnSolve.innerText = "Find All Solutions";
    btnSolve.disabled = false;
    btnResetStart.style.display = 'none';
    updatePaletteUI();
    updateNavUI();
    renderBoard();
});

// Boot up
setupFanToggle();
setupGameSelector();
setupConditionsUI();
initializeUI();
renderBoard();