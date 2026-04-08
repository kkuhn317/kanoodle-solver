const boardElement = document.getElementById('board');
const navContainer = document.getElementById('solution-nav');
const counterText = document.getElementById('solution-counter');
const btnSolve = document.getElementById('btn-solve');

const btnResetStart = document.createElement('button');
btnResetStart.id = 'btn-reset-start';
btnResetStart.innerText = 'Reset to Start';
btnResetStart.style.display = 'none';
document.getElementById('btn-reset').parentNode.insertBefore(btnResetStart, document.getElementById('btn-reset').nextSibling);

const cursorPiece = document.createElement('div');
cursorPiece.id = 'cursor-piece';
document.body.appendChild(cursorPiece);

function setupGameSelector() {
    const selectorContainer = document.createElement('div');
    selectorContainer.style.marginBottom = '20px';
    selectorContainer.style.display = 'flex';
    selectorContainer.style.gap = '10px';
    selectorContainer.style.alignItems = 'center';
    selectorContainer.style.justifyContent = 'center';
    
    const label = document.createElement('label');
    label.innerText = 'Select Game: ';
    label.style.fontWeight = 'bold';
    
    const select = document.createElement('select');
    select.id = 'game-selector';
    select.style.padding = '5px 10px';
    select.style.borderRadius = '4px';
    select.style.backgroundColor = '#1a1a1a';
    select.style.color = '#fff';
    select.style.border = '1px solid #4a4a4a';
    
    Object.keys(GAMES).forEach(gameId => {
        const option = document.createElement('option');
        option.value = gameId;
        option.innerText = GAMES[gameId].name;
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        setGameType(e.target.value);
        
        const fanToggleContainer = document.getElementById('fan-edition-toggle').parentNode;
        if (e.target.value === 'kanoodle') {
            fanToggleContainer.style.display = 'flex';
        } else {
            fanToggleContainer.style.display = 'none';
            document.getElementById('fan-edition-toggle').checked = false;
        }
        
        initializeUI();
        renderBoard();
        
        btnSolve.innerText = "Find All Solutions";
        btnSolve.disabled = false;
        btnResetStart.style.display = 'none';
        updateNavUI();
        updateCursorPieceUI();
    });
    
    selectorContainer.appendChild(label);
    selectorContainer.appendChild(select);
    
    boardElement.parentNode.insertBefore(selectorContainer, boardElement);
}

function initializeUI() {
    precomputeVariations();
    
    const gridType = GAMES[currentGame].gridType || 'square';
    const cellSpace = 53; // 45px width + 8px gap
    const rowHeight = gridType === 'triangular' ? cellSpace * 0.866 : cellSpace;

    // Build Board
    boardElement.innerHTML = ''; 
    boardElement.style.display = 'block';
    boardElement.style.position = 'relative';
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < TOTAL_CELLS; i++) {
        const isInvalid = GAMES[currentGame].invalidCells && GAMES[currentGame].invalidCells.includes(i);
        if (isInvalid) continue;

        const c = i % BOARD_COLS;
        const r = Math.floor(i / BOARD_COLS);
        const x = c * cellSpace + (gridType === 'triangular' && r % 2 !== 0 ? 26.5 : 0);
        const y = r * rowHeight;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }

    if (minX === Infinity) { minX = 0; maxX = 0; minY = 0; maxY = 0; }

    const boardWidth = maxX - minX + 45; // 45px is the exact cell width
    const boardHeight = maxY - minY + 45;
    
    boardElement.style.width = `${boardWidth + 40}px`; // accounting for 20px padding on each side
    boardElement.style.height = `${boardHeight + 40}px`;

    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        cell.style.position = 'absolute';
        
        const c = i % BOARD_COLS;
        const r = Math.floor(i / BOARD_COLS);
        
        const isInvalid = GAMES[currentGame].invalidCells && GAMES[currentGame].invalidCells.includes(i);
        if (isInvalid) {
            cell.style.display = 'none';
        }
        
        const x = c * cellSpace + (gridType === 'triangular' && r % 2 !== 0 ? 26.5 : 0);
        const y = r * rowHeight;
        
        cell.style.left = `${x - minX + 20}px`; // Match container 20px padding
        cell.style.top = `${y - minY + 20}px`;

        cell.addEventListener('mouseenter', () => handleHover(i));
        cell.addEventListener('mouseleave', clearHover);
        cell.addEventListener('click', () => handleClick(i));
        
        boardElement.appendChild(cell);
    }
    
    buildPalette();
    updateConditionSelects();
    renderConditions();
}

function buildPalette() {
    const gridType = GAMES[currentGame].gridType || 'square';
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = '';
    
    const cellW = 12, gap = 2;
    const space = cellW + gap;
    const rowH = gridType === 'triangular' ? space * 0.866 : space;

    PIECE_DEFS.forEach(piece => {
        const btn = document.createElement('div');
        btn.className = 'palette-piece';
        btn.id = `palette-${piece.id}`;
        btn.style.display = 'block';
        btn.style.position = 'relative';
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        piece.base.forEach(pt => {
            let px = gridType === 'triangular' ? (pt[0] + pt[1]/2) * space : pt[0] * space;
            let py = pt[1] * rowH;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
        });
        
        btn.style.width = `${maxX - minX + cellW + 12}px`; // Includes 6px container padding
        btn.style.height = `${maxY - minY + cellW + 12}px`;
        
        piece.base.forEach(pt => {
            const cell = document.createElement('div');
            cell.className = 'mini-cell';
            cell.style.position = 'absolute';
            const pieceColor = COLORS[piece.id.replace(/[0-9]/g, '')];
            cell.style.backgroundColor = pieceColor;
            if (pieceColor === '#000000') cell.style.border = '1px solid #555';
            
            let px = gridType === 'triangular' ? (pt[0] + pt[1]/2) * space : pt[0] * space;
            let py = pt[1] * rowH;
            
            cell.style.left = `${px - minX + 6}px`;
            cell.style.top = `${py - minY + 6}px`;
            btn.appendChild(cell);
        });
        
        btn.addEventListener('click', () => selectPiece(piece.id));
        paletteContainer.appendChild(btn);
    });
}

function setupFanToggle() {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.justifyContent = 'center';
    toggleContainer.style.gap = '8px';
    toggleContainer.style.marginBottom = '15px';
    toggleContainer.style.color = '#aaaaaa';

    const fanToggle = document.createElement('input');
    fanToggle.type = 'checkbox';
    fanToggle.id = 'fan-edition-toggle';

    const fanLabel = document.createElement('label');
    fanLabel.htmlFor = 'fan-edition-toggle';
    fanLabel.innerText = 'Enable Fan Edition Pieces (Black S & T)';
    fanLabel.style.cursor = 'pointer';

    toggleContainer.appendChild(fanToggle);
    toggleContainer.appendChild(fanLabel);

    const paletteContainer = document.getElementById('palette');
    paletteContainer.parentNode.insertBefore(toggleContainer, paletteContainer);

    fanToggle.addEventListener('change', (e) => {
        toggleFanEdition(e.target.checked);
    });
}

function toggleFanEdition(enabled) {
    let wasSolving = isSolving;
    if (isSolving) isSolving = false;
    if (allSolutions.length > 0 || wasSolving) {
        boardState = [...startingBoardState];
    }

    if (enabled) {
        PIECE_DEFS.push(...FAN_PIECE_DEFS);
    } else {
        PIECE_DEFS = PIECE_DEFS.filter(p => !FAN_PIECE_DEFS.some(f => f.id === p.id));
        
        // Clean up any black pieces currently left on the board
        for (let i = 0; i < TOTAL_CELLS; i++) {
            if (FAN_PIECE_DEFS.some(f => f.id === boardState[i])) {
                boardState[i] = 0;
            }
        }
        FAN_PIECE_DEFS.forEach(f => usedPieces.delete(f.id));
        
        if (FAN_PIECE_DEFS.some(f => f.id === activePieceId)) {
            activePieceId = null;
            currentActiveShape = null;
        }
        
        conditions = conditions.filter(c => !FAN_PIECE_DEFS.some(f => c.pieces.includes(f.id)));
    }
    
    precomputeVariations();
    buildPalette();
    updatePaletteUI();
    updateCursorPieceUI();
    renderBoard();
    
    allSolutions = [];
    currentSolutionIndex = -1;
    updateNavUI();
    btnSolve.innerText = "Find All Solutions";
    btnSolve.disabled = false;
    btnResetStart.style.display = 'none';
    updateConditionSelects();
    renderConditions();
}

function renderBoard() {
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cellUi = document.getElementById(`cell-${i}`);
        if (!cellUi || boardState[i] === -1) continue;
        
        if (boardState[i] === 0) {
            cellUi.style.backgroundColor = '#4a4a4a'; 
            cellUi.style.border = 'none';
        } else {
            const pieceDef = PIECE_DEFS.find(p => p.id === boardState[i]);
            const pieceColor = COLORS[pieceDef.id.replace(/[0-9]/g, '')];
            cellUi.style.backgroundColor = pieceColor; 
            if (pieceColor === '#000000') {
                cellUi.style.border = '2px solid #555';
            } else {
                cellUi.style.border = 'none';
            }
        }
    }
}

// --- Placement Logic ---
function selectPiece(pieceId) {
    if (isSolving) return;
    if (allSolutions.length > 0) return;
    if (usedPieces.has(pieceId)) return; 
    
    if (activePieceId === pieceId) {
        activePieceId = null; 
        currentActiveShape = null;
    } else {
        activePieceId = pieceId;
        const pieceDef = PIECE_DEFS.find(p => p.id === pieceId);
        // Load the base shape to start
        currentActiveShape = normalizeShape([...pieceDef.base]);
    }
    updatePaletteUI();
    updateCursorPieceUI();
}

function updatePaletteUI() {
    PIECE_DEFS.forEach(piece => {
        const btn = document.getElementById(`palette-${piece.id}`);
        btn.classList.remove('selected', 'used');
        if (allSolutions.length > 0) {
            btn.classList.add('used');
        } else if (usedPieces.has(piece.id)) {
            btn.classList.add('used');
        } else if (activePieceId === piece.id) {
            btn.classList.add('selected');
        }
    });
}

function actionRotate() {
    if (isSolving) return;
    if (!activePieceId || !currentActiveShape) return;
    const gridType = GAMES[currentGame].gridType || 'square';
    currentActiveShape = normalizeShape(gridType === 'triangular' ? rotateHex(currentActiveShape) : rotateShape(currentActiveShape));
    updateCursorPieceUI();
    if (lastHoveredIndex !== -1) handleHover(lastHoveredIndex); 
}

function actionFlip() {
    if (isSolving) return;
    if (!activePieceId || !currentActiveShape) return;
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
        for (let i = 0; i < TOTAL_CELLS; i++) {
            if (boardState[i] === clickedPieceId) boardState[i] = 0;
        }
        usedPieces.delete(clickedPieceId);
        updatePaletteUI();
        renderBoard();
        clearHoverVisuals();
        return;
    }

    // 2. Place active piece
    if (activePieceId && currentActiveShape) {
        if (canPlace(boardState, index, currentActiveShape)) {
            placePiece(boardState, index, currentActiveShape, activePieceId);
            usedPieces.add(activePieceId);
            activePieceId = null; 
            currentActiveShape = null;
            updatePaletteUI();
            updateCursorPieceUI();
            renderBoard();
            clearHoverVisuals();
        }
    }
}

function updateCursorPieceUI() {
    if (!activePieceId || !currentActiveShape) {
        cursorPiece.style.display = 'none';
        return;
    }
    
    const gridType = GAMES[currentGame].gridType || 'square';
    const cellW = 45, gap = 8;
    const space = cellW + gap;
    const rowH = gridType === 'triangular' ? space * 0.866 : space;
    
    cursorPiece.style.display = 'block';
    cursorPiece.innerHTML = '';
    
    const pieceDef = PIECE_DEFS.find(p => p.id === activePieceId);
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    currentActiveShape.forEach(pt => {
        let px = gridType === 'triangular' ? (pt[0] + pt[1]/2) * space : pt[0] * space;
        let py = pt[1] * rowH;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
    });
    
    cursorPiece.style.width = `${maxX - minX + cellW}px`;
    cursorPiece.style.height = `${maxY - minY + cellW}px`;
    
    currentActiveShape.forEach(pt => {
        const cell = document.createElement('div');
        cell.style.position = 'absolute';
        cell.style.width = '45px';
        cell.style.height = '45px';
        const pieceColor = COLORS[pieceDef.id.replace(/[0-9]/g, '')];
        cell.style.backgroundColor = pieceColor;
        cell.style.borderRadius = '50%';
        cell.style.opacity = '0.8';
        if (pieceColor === '#000000') cell.style.border = '2px solid #555';
        
        let px = gridType === 'triangular' ? (pt[0] + pt[1]/2) * space : pt[0] * space;
        let py = pt[1] * rowH;
        
        cell.style.left = `${px - minX}px`;
        cell.style.top = `${py - minY}px`;
        cursorPiece.appendChild(cell);
    });
    
    // Offset so the "root" block (0,0) is exactly centered on the cursor tip
    const rootPx = gridType === 'triangular' ? 0 : 0; // Since root is always at [0,0] => px=0
    const rootPy = 0;
    const centerX = rootPx - minX + 22.5; 
    const centerY = rootPy - minY + 22.5;
    cursorPiece.style.transform = `translate(-${centerX}px, -${centerY}px)`;
    cursorPiece.style.left = mouseX + 'px';
    cursorPiece.style.top = mouseY + 'px';
}

// --- Solution Navigation ---
function updateNavUI() {
    if (allSolutions.length === 0) {
        navContainer.style.display = 'none';
        return;
    }
    navContainer.style.display = 'flex';
    counterText.innerText = `${currentSolutionIndex + 1} of ${allSolutions.length}`;
    document.getElementById('btn-prev').disabled = currentSolutionIndex === 0;
    document.getElementById('btn-next').disabled = currentSolutionIndex === allSolutions.length - 1;
}

function showSolution(index) {
    if (index < 0 || index >= allSolutions.length) return;
    currentSolutionIndex = index;
    boardState = [...allSolutions[index]]; 
    renderBoard();
    updateNavUI();
    updatePaletteUI();
}

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
        if (boardState.includes(cond.pieces[0]) && boardState.includes(cond.pieces[1])) {
            let touching = arePiecesTouching(boardState, cond.pieces[0], cond.pieces[1]);
            if (cond.type === 'must_touch' && !touching) startingValid = false;
            if (cond.type === 'cannot_touch' && touching) startingValid = false;
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

    isSolving = true;
    btnSolve.innerText = "Stop (Found 0)";
    startingBoardState = [...boardState];
    allSolutions = [];
    
    let remainingPieces = PIECE_DEFS.filter(p => !usedPieces.has(p.id));
    
    // Wait a brief moment so the UI can update the button text
    await new Promise(r => setTimeout(r, 10));

    await solveRecursive(boardState, remainingPieces, () => {
        if (isSolving) btnSolve.innerText = `Stop (Found ${allSolutions.length})`;
    });
    
    const wasAborted = !isSolving;
    isSolving = false;

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