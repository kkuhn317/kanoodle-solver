/* Note: Ensure state.js and solver.js are loaded before script.js in your HTML */

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

function setupConditionsUI() {
    const container = document.createElement('div');
    container.style.marginTop = '10px';
    container.style.marginBottom = '20px';
    container.style.marginLeft = 'auto';
    container.style.marginRight = 'auto';
    container.style.padding = '15px';
    container.style.backgroundColor = '#1a1a1a';
    container.style.borderRadius = '8px';
    container.style.width = '100%';
    container.style.maxWidth = '600px';

    const title = document.createElement('h3');
    title.innerText = 'Solver Conditions';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    title.style.color = '#aaaaaa';
    title.style.fontSize = '1.1rem';
    container.appendChild(title);

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.justifyContent = 'center';
    controls.style.marginBottom = '10px';

    const p1Select = document.createElement('select');
    p1Select.id = 'cond-piece1';
    
    const typeSelect = document.createElement('select');
    typeSelect.id = 'cond-type';
    typeSelect.innerHTML = `
        <option value="must_touch">Must Touch</option>
        <option value="cannot_touch">Cannot Touch</option>
    `;
    
    const p2Select = document.createElement('select');
    p2Select.id = 'cond-piece2';

    const btnAdd = document.createElement('button');
    btnAdd.innerText = 'Add';
    btnAdd.addEventListener('click', () => {
        const p1 = p1Select.value;
        const p2 = p2Select.value;
        const type = typeSelect.value;
        if (p1 === p2) {
            alert('Please select two different pieces.');
            return;
        }
        if (conditions.some(c => (c.pieces.includes(p1) && c.pieces.includes(p2)))) {
            alert('A condition between these pieces already exists. Remove it first.');
            return;
        }
        conditions.push({ type, pieces: [p1, p2] });
        renderConditions();
    });

    [p1Select, typeSelect, p2Select].forEach(sel => {
        sel.style.padding = '5px';
        sel.style.backgroundColor = '#242424';
        sel.style.color = '#fff';
        sel.style.border = '1px solid #4a4a4a';
        sel.style.borderRadius = '4px';
    });

    controls.appendChild(p1Select);
    controls.appendChild(typeSelect);
    controls.appendChild(p2Select);
    controls.appendChild(btnAdd);

    container.appendChild(controls);

    const list = document.createElement('div');
    list.id = 'conditions-list';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '5px';
    container.appendChild(list);

    const paletteContainer = document.getElementById('palette');
    paletteContainer.parentNode.insertBefore(container, paletteContainer.nextSibling);
}

function updateConditionSelects() {
    const p1Select = document.getElementById('cond-piece1');
    const p2Select = document.getElementById('cond-piece2');
    if (!p1Select || !p2Select) return;
    
    p1Select.innerHTML = '';
    p2Select.innerHTML = '';
    
    PIECE_DEFS.forEach(p => {
        const opt1 = document.createElement('option');
        opt1.value = p.id;
        opt1.innerText = p.id;
        p1Select.appendChild(opt1);
        
        const opt2 = document.createElement('option');
        opt2.value = p.id;
        opt2.innerText = p.id;
        p2Select.appendChild(opt2);
    });
    
    if (PIECE_DEFS.length > 1) {
        p2Select.selectedIndex = 1;
    }
}

function renderConditions() {
    const list = document.getElementById('conditions-list');
    if (!list) return;
    list.innerHTML = '';
    
    conditions.forEach((cond, index) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.backgroundColor = '#2a2a2a';
        item.style.padding = '8px 12px';
        item.style.borderRadius = '4px';
        
        const text = document.createElement('span');
        const actionStr = cond.type === 'must_touch' ? 'MUST TOUCH' : 'CANNOT TOUCH';
        
        const getPieceColor = (id) => {
            const p = PIECE_DEFS.find(p => p.id === id);
            return p ? (p.color === '#000000' ? '#aaaaaa' : p.color) : '#fff';
        };
        
        text.innerHTML = `<span style="color:${getPieceColor(cond.pieces[0])}; font-weight:bold;">${cond.pieces[0]}</span> 
                          <span style="color:#888; font-size:0.9em; margin:0 5px;">${actionStr}</span> 
                          <span style="color:${getPieceColor(cond.pieces[1])}; font-weight:bold;">${cond.pieces[1]}</span>`;
        
        const btnRemove = document.createElement('button');
        btnRemove.innerText = 'Remove';
        btnRemove.style.padding = '4px 8px';
        btnRemove.style.backgroundColor = '#d32f2f';
        btnRemove.style.border = 'none';
        btnRemove.style.fontSize = '0.8rem';
        btnRemove.addEventListener('click', () => {
            conditions.splice(index, 1);
            renderConditions();
        });
        
        item.appendChild(text);
        item.appendChild(btnRemove);
        list.appendChild(item);
    });
}

function initializeUI() {
    precomputeVariations();
    
    // Build Board
    boardElement.innerHTML = ''; 
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_COLS}, 45px)`; // Dynamically set shape width
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.id = `cell-${i}`;
        
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
    const paletteContainer = document.getElementById('palette');
    paletteContainer.innerHTML = '';
    
    PIECE_DEFS.forEach(piece => {
        const btn = document.createElement('div');
        btn.className = 'palette-piece';
        btn.id = `palette-${piece.id}`;
        
        // Find dimensions of the piece to create a mini-grid
        let maxX = 0, maxY = 0;
        piece.base.forEach(pt => {
            if (pt[0] > maxX) maxX = pt[0];
            if (pt[1] > maxY) maxY = pt[1];
        });
        
        btn.style.gridTemplateColumns = `repeat(${maxX + 1}, 12px)`;
        btn.style.gridTemplateRows = `repeat(${maxY + 1}, 12px)`;
        
        // Draw the mini cells
        for (let y = 0; y <= maxY; y++) {
            for (let x = 0; x <= maxX; x++) {
                const cell = document.createElement('div');
                const isFilled = piece.base.some(pt => pt[0] === x && pt[1] === y);
                if (isFilled) {
                    cell.className = 'mini-cell';
                    cell.style.backgroundColor = piece.color;
                    if (piece.color === '#000000') {
                        cell.style.border = '1px solid #555';
                    }
                } else {
                    // Empty space filler
                    cell.style.width = '12px';
                    cell.style.height = '12px';
                }
                btn.appendChild(cell);
            }
        }
        
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
        if (boardState[i] === 0) {
            cellUi.style.backgroundColor = '#4a4a4a'; 
            cellUi.style.border = 'none';
        } else {
            const pieceDef = PIECE_DEFS.find(p => p.id === boardState[i]);
            cellUi.style.backgroundColor = pieceDef.color; 
            if (pieceDef.color === '#000000') {
                cellUi.style.border = '2px solid #555';
            } else {
                cellUi.style.border = 'none';
            }
        }
    }
}

// --- Placement Logic ---
function selectPiece(pieceId) {
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
        if (usedPieces.has(piece.id)) btn.classList.add('used');
        else if (activePieceId === piece.id) btn.classList.add('selected');
    });
}

function actionRotate() {
    if (!activePieceId || !currentActiveShape) return;
    currentActiveShape = normalizeShape(rotateShape(currentActiveShape));
    updateCursorPieceUI();
    if (lastHoveredIndex !== -1) handleHover(lastHoveredIndex); 
}

function actionFlip() {
    if (!activePieceId || !currentActiveShape) return;
    currentActiveShape = normalizeShape(flipShape(currentActiveShape));
    updateCursorPieceUI();
    if (lastHoveredIndex !== -1) handleHover(lastHoveredIndex); 
}

function handleHover(index) {
    lastHoveredIndex = index;
    clearHoverVisuals();
    if (!activePieceId || !currentActiveShape) return;
    
    if (canPlace(boardState, index, currentActiveShape)) {
        const rootX = index % BOARD_COLS;
        const rootY = Math.floor(index / BOARD_COLS);
        for (let pt of currentActiveShape) {
            const cellIndex = (rootY + pt[1]) * BOARD_COLS + (rootX + pt[0]);
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
    if (allSolutions.length > 0) {
        allSolutions = [];
        currentSolutionIndex = -1;
        updateNavUI();
        btnSolve.innerText = "Find All Solutions";
        btnSolve.disabled = false;
        btnResetStart.style.display = 'none';
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
    cursorPiece.style.display = 'grid';
    const pieceDef = PIECE_DEFS.find(p => p.id === activePieceId);
    
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    currentActiveShape.forEach(pt => {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
    });
    
    cursorPiece.style.gridTemplateColumns = `repeat(${maxX - minX + 1}, 45px)`;
    cursorPiece.style.gridTemplateRows = `repeat(${maxY - minY + 1}, 45px)`;
    cursorPiece.innerHTML = '';
    
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const cell = document.createElement('div');
            if (currentActiveShape.some(pt => pt[0] === x && pt[1] === y)) {
                cell.style.width = '45px';
                cell.style.height = '45px';
                cell.style.backgroundColor = pieceDef.color;
                cell.style.borderRadius = '50%';
                cell.style.opacity = '0.8';
                if (pieceDef.color === '#000000') {
                    cell.style.border = '2px solid #555';
                }
            }
            cursorPiece.appendChild(cell);
        }
    }
    
    // Offset so the "root" block (0,0) is exactly centered on the cursor tip
    const centerX = (-minX * 53) + 22.5; // 45px width + 8px gap = 53px spacing. 22.5px is half the 45px cell.
    const centerY = (-minY * 53) + 22.5;
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
}

// --- Event Listeners ---
document.getElementById('btn-rotate').addEventListener('click', actionRotate);
document.getElementById('btn-flip').addEventListener('click', actionFlip);

document.addEventListener('keydown', (e) => {
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
    boardState.fill(0);
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

btnSolve.addEventListener('click', () => {
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

    btnSolve.innerText = "Solving... (This may take a moment)";
    btnSolve.disabled = true;
    startingBoardState = [...boardState];
    
    setTimeout(() => {
        allSolutions = [];
        let remainingPieces = PIECE_DEFS.filter(p => !usedPieces.has(p.id));
        solveRecursive(boardState, remainingPieces);
        
        if (allSolutions.length >= MAX_SOLUTIONS) {
            btnSolve.innerText = `Found ${MAX_SOLUTIONS}+ Solutions (Capped)`;
        } else {
            btnSolve.innerText = `Found ${allSolutions.length} Solutions!`;
        }

        if (allSolutions.length > 0) {
            showSolution(0);
            btnResetStart.style.display = 'inline-block';
        } else {
            alert("No solutions found for this starting layout.");
            btnSolve.innerText = "Find All Solutions";
            btnSolve.disabled = false;
            btnResetStart.style.display = 'none';
        }
    }, 50);
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