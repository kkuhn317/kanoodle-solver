// ==========================================
// UI SETUP & RENDERING
// ==========================================

const boardElement = document.getElementById('board');
const navContainer = document.getElementById('solution-nav');
const counterText = document.getElementById('solution-counter');
const btnSolve = document.getElementById('btn-solve');

document.getElementById('btn-reset').style.backgroundColor = '#d32f2f';
document.getElementById('btn-reset').style.color = '#ffffff';

const btnResetStart = document.createElement('button');
btnResetStart.id = 'btn-reset-start';
btnResetStart.innerText = 'Reset to Start';
btnResetStart.style.display = 'none';
document.getElementById('btn-reset').parentNode.insertBefore(btnResetStart, document.getElementById('btn-reset').nextSibling);

const btnHeatmap = document.createElement('button');
btnHeatmap.id = 'btn-heatmap';
btnHeatmap.innerText = 'View Heatmap';
btnHeatmap.style.display = 'none';
btnResetStart.parentNode.insertBefore(btnHeatmap, btnResetStart.nextSibling);

btnHeatmap.addEventListener('click', () => {
    isHeatmapMode = !isHeatmapMode;
    if (isHeatmapMode) {
        btnHeatmap.innerText = 'Exit Heatmap';
        if (!activePieceId || activePieceId === 'blocker') {
            const firstValidPiece = PIECE_DEFS.find(p => !usedPieces.has(p.id));
            activePieceId = firstValidPiece ? firstValidPiece.id : PIECE_DEFS[0].id;
        }
    } else {
        btnHeatmap.innerText = 'View Heatmap';
        activePieceId = null;
    }
    updateNavUI();
    updatePaletteUI();
    renderBoard();
});

const difficultyBadge = document.createElement('div');
difficultyBadge.id = 'difficulty-badge';
navContainer.parentNode.insertBefore(difficultyBadge, navContainer.nextSibling);

const heatmapStats = document.createElement('div');
heatmapStats.id = 'heatmap-stats';
heatmapStats.style.display = 'none';
heatmapStats.style.textAlign = 'center';
heatmapStats.style.marginTop = '5px';
heatmapStats.style.color = '#aaaaaa';
difficultyBadge.parentNode.insertBefore(heatmapStats, difficultyBadge.nextSibling);

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
        
        const fanToggleContainer = document.getElementById('fan-edition-select').parentNode;
        if (e.target.value === 'kanoodle') {
            fanToggleContainer.style.display = 'flex';
        } else {
            fanToggleContainer.style.display = 'none';
            document.getElementById('fan-edition-select').value = 'none';
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

    const blockerBtn = document.createElement('div');
    blockerBtn.className = 'palette-piece blocker-style';
    blockerBtn.id = 'palette-blocker';
    blockerBtn.addEventListener('click', () => selectPiece('blocker'));
    paletteContainer.appendChild(blockerBtn);
}

function setupFanToggle() {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.justifyContent = 'center';
    toggleContainer.style.gap = '8px';
    toggleContainer.style.marginBottom = '15px';
    toggleContainer.style.color = '#aaaaaa';

    const fanLabel = document.createElement('label');
    fanLabel.htmlFor = 'fan-edition-select';
    fanLabel.innerText = 'Fan Edition Pieces:';
    fanLabel.style.fontWeight = 'bold';

    const fanSelect = document.createElement('select');
    fanSelect.id = 'fan-edition-select';
    fanSelect.style.padding = '5px 10px';
    fanSelect.style.borderRadius = '4px';
    fanSelect.style.backgroundColor = '#1a1a1a';
    fanSelect.style.color = '#fff';
    fanSelect.style.border = '1px solid #4a4a4a';
    
    fanSelect.innerHTML = `
        <option value="none">None</option>
        <option value="cyan">Cyan Edition</option>
        <option value="magenta">Magenta Edition</option>
    `;

    toggleContainer.appendChild(fanLabel);
    toggleContainer.appendChild(fanSelect);

    const paletteContainer = document.getElementById('palette');
    paletteContainer.parentNode.insertBefore(toggleContainer, paletteContainer);

    fanSelect.addEventListener('change', (e) => {
        toggleFanEdition(e.target.value);
    });
}

function toggleFanEdition(edition) {
    let wasSolving = isSolving;
    if (isSolving) isSolving = false;
    isResetting = true;
    isHeatmapMode = false;
    if (typeof btnHeatmap !== 'undefined') {
        btnHeatmap.style.display = 'none';
        btnHeatmap.innerText = 'View Heatmap';
    }
    if (allSolutions.length > 0 || wasSolving) {
        boardState = [...startingBoardState];
    }
    const allFanIds = ['black1', 'black2'];

    PIECE_DEFS = PIECE_DEFS.filter(p => !allFanIds.includes(p.id));
    
    // Clean up any black pieces currently left on the board
    for (let i = 0; i < TOTAL_CELLS; i++) {
        if (allFanIds.includes(boardState[i])) {
            boardState[i] = 0;
        }
    }
    allFanIds.forEach(id => usedPieces.delete(id));
    
    if (allFanIds.includes(activePieceId)) {
        activePieceId = null;
        currentActiveShape = null;
    }
    
    conditions = conditions.filter(c => !allFanIds.some(id => c.pieces.includes(id)));

    if (edition !== 'none') {
        PIECE_DEFS.push(...FAN_EDITIONS[edition]);
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

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function renderHeatmap() {
    if (activePieceId && activePieceId !== 'blocker') {
        let totalUses = 0;
        for (let sol of allSolutions) {
            if (sol.includes(activePieceId)) totalUses++;
        }
        let totalPct = allSolutions.length > 0 ? (totalUses / allSolutions.length) * 100 : 0;
        const pieceDef = PIECE_DEFS.find(p => p.id === activePieceId);
        const pieceColor = COLORS[pieceDef.id.replace(/[0-9]/g, '')] || '#fff';
        heatmapStats.innerHTML = `Piece <strong style="color:${pieceColor === '#000000' ? '#aaaaaa' : pieceColor}">${activePieceId}</strong> is used in <strong>${Math.round(totalPct)}%</strong> of solutions.`;
    } else {
        heatmapStats.innerHTML = 'Select a piece to view its heatmap.';
    }

    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cellUi = document.getElementById(`cell-${i}`);
        if (!cellUi || boardState[i] === -1) continue;
        
        cellUi.classList.remove('blocker-style');
        
        if (!activePieceId) {
            cellUi.style.backgroundColor = '#4a4a4a';
            cellUi.style.border = 'none';
            cellUi.innerText = '';
            continue;
        }
        
        let count = 0;
        for (let sol of allSolutions) {
            if (sol[i] === activePieceId) count++;
        }
        let pct = allSolutions.length > 0 ? count / allSolutions.length : 0;
        
        const pieceDef = PIECE_DEFS.find(p => p.id === activePieceId);
        const pieceColor = COLORS[pieceDef.id.replace(/[0-9]/g, '')];
        
        if (pct === 0) {
            cellUi.style.backgroundColor = '#4a4a4a';
            cellUi.style.border = 'none';
            cellUi.innerText = '';
            cellUi.style.textShadow = 'none';
        } else {
            const rgb = hexToRgb(pieceColor === '#000000' ? '#aaaaaa' : pieceColor);
            if (rgb) {
                cellUi.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0.15, pct)})`;
                cellUi.innerText = Math.round(pct * 100) + '%';
                cellUi.style.color = '#fff';
                cellUi.style.textShadow = '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000';
                cellUi.style.display = 'flex';
                cellUi.style.alignItems = 'center';
                cellUi.style.justifyContent = 'center';
                cellUi.style.fontSize = '13px';
                cellUi.style.fontWeight = 'bold';
                cellUi.style.border = 'none';
            }
        }
    }
}

function renderBoard() {
    if (isHeatmapMode) {
        renderHeatmap();
        return;
    }
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cellUi = document.getElementById(`cell-${i}`);
        if (!cellUi || boardState[i] === -1) continue;
        
        cellUi.classList.remove('blocker-style');
        cellUi.innerText = ''; 
        cellUi.style.textShadow = 'none'; 
        
        if (boardState[i] === 0) {
            cellUi.style.backgroundColor = '#4a4a4a'; 
            cellUi.style.border = 'none';
        } else if (boardState[i] === 'blocker') {
            cellUi.classList.add('blocker-style');
            cellUi.style.backgroundColor = '';
            cellUi.style.border = '';
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

function updatePaletteUI() {
    const allPieceIds = PIECE_DEFS.map(p => p.id).concat(['blocker']);
    allPieceIds.forEach(id => {
        const btn = document.getElementById(`palette-${id}`);
        if (!btn) return;
        btn.classList.remove('selected', 'used');
        if (allSolutions.length > 0) {
            if (isHeatmapMode) {
                if (id === 'blocker') {
                    btn.classList.add('used');
                } else if (activePieceId === id) {
                    btn.classList.add('selected');
                }
            } else {
                btn.classList.add('used');
            }
        } else if (id !== 'blocker' && usedPieces.has(id)) {
            btn.classList.add('used');
        } else if (activePieceId === id) {
            btn.classList.add('selected');
        }
    });
}

function updateCursorPieceUI() {
    if (!activePieceId || !currentActiveShape) {
        cursorPiece.style.display = 'none';
        return;
    }
    
    if (activePieceId === 'blocker') {
        cursorPiece.style.display = 'block';
        cursorPiece.innerHTML = '';
        cursorPiece.style.width = '45px';
        cursorPiece.style.height = '45px';
        const cell = document.createElement('div');
        cell.className = 'blocker-style';
        cell.style.position = 'absolute';
        cell.style.width = '45px';
        cell.style.height = '45px';
        cell.style.borderRadius = '50%';
        cell.style.opacity = '0.8';
        cursorPiece.appendChild(cell);
        
        cursorPiece.style.transform = `translate(-22.5px, -22.5px)`;
        cursorPiece.style.left = mouseX + 'px';
        cursorPiece.style.top = mouseY + 'px';
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

function updateNavUI() {
    if (allSolutions.length === 0) {
        navContainer.style.display = 'none';
        difficultyBadge.style.display = 'none';
        heatmapStats.style.display = 'none';
        return;
    }
    navContainer.style.display = isHeatmapMode ? 'none' : 'flex';
    difficultyBadge.style.display = isHeatmapMode ? 'none' : 'block';
    heatmapStats.style.display = isHeatmapMode ? 'block' : 'none';
    difficultyBadge.innerHTML = difficultyRating;
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