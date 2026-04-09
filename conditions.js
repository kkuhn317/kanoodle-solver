// ==========================================
// SOLVER CONDITIONS UI
// ==========================================

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
        <option value="do_not_use">Do Not Use</option>
        <option value="must_use">Must Use</option>
    `;
    
    const p2Select = document.createElement('select');
    p2Select.id = 'cond-piece2';

    typeSelect.addEventListener('change', (e) => {
        const isSingle = e.target.value === 'do_not_use' || e.target.value === 'must_use';
        p2Select.style.display = isSingle ? 'none' : 'inline-block';
    });

    const btnAdd = document.createElement('button');
    btnAdd.innerText = 'Add';
    btnAdd.addEventListener('click', () => {
        const p1 = p1Select.value;
        const p2 = p2Select.value;
        const type = typeSelect.value;
        const isSingle = type === 'do_not_use' || type === 'must_use';
        
        if (!isSingle && p1 === p2) {
            alert('Please select two different pieces.');
            return;
        }
        if (isSingle) {
            if (conditions.some(c => (c.type === 'do_not_use' || c.type === 'must_use') && c.pieces[0] === p1)) {
                alert('A usage condition for this piece already exists. Remove it first.');
                return;
            }
            conditions.push({ type, pieces: [p1] });
        } else {
            if (conditions.some(c => c.type !== 'do_not_use' && c.type !== 'must_use' && (c.pieces.includes(p1) && c.pieces.includes(p2)))) {
                alert('A condition between these pieces already exists. Remove it first.');
                return;
            }
            conditions.push({ type, pieces: [p1, p2] });
        }
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
            const colorHex = COLORS[id.replace(/[0-9]/g, '')];
            return colorHex ? (colorHex === '#000000' ? '#aaaaaa' : colorHex) : '#fff';
        };
        
        if (cond.type === 'do_not_use' || cond.type === 'must_use') {
            const labelStr = cond.type === 'do_not_use' ? 'DO NOT USE' : 'MUST USE';
            text.innerHTML = `<span style="color:#888; font-size:0.9em; margin:0 5px;">${labelStr}</span>
                              <span style="color:${getPieceColor(cond.pieces[0])}; font-weight:bold;">${cond.pieces[0]}</span>`;
        } else {
            text.innerHTML = `<span style="color:${getPieceColor(cond.pieces[0])}; font-weight:bold;">${cond.pieces[0]}</span> 
                              <span style="color:#888; font-size:0.9em; margin:0 5px;">${actionStr}</span> 
                              <span style="color:${getPieceColor(cond.pieces[1])}; font-weight:bold;">${cond.pieces[1]}</span>`;
        }
        
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