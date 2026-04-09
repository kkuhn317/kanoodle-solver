// ==========================================
// GAME CONSTANTS & GLOBAL STATE
// ==========================================

const COLORS = {
    white:   '#ffffff',
    lime:    '#a2ca74',
    orange:  '#ff5722',
    green:   '#2e7d32',
    purple:  '#7b1fa2',
    blue:    '#1565c0',
    cyan:    '#b2ebf2',
    red:     '#d32f2f',
    yellow:  '#ffeb3b',
    magenta: '#e91e63',
    gray:    '#9e9e9e',
    pink:    '#ff8383',
    black:   '#000000'
};

const GAMES = {
    'kanoodle': {
        name: 'Kanoodle',
        gridType: 'square',
        cols: 11,
        rows: 5,
        pieces: [
            { id: 'red',     base: [[0,0], [1,0], [0,1], [1,1], [0,2]] },
            { id: 'orange',  base: [[0,0], [0,1], [0,2], [1,2]] },
            { id: 'yellow',  base: [[0,0], [2,0], [0,1], [1,1], [2,1]] },
            { id: 'lime',    base: [[0,0], [1,0], [0,1], [1,1]] },
            { id: 'green',   base: [[1,0], [2,0], [0,1], [1,1], [3,0]] },
            { id: 'cyan',    base: [[0,0], [0,1], [0,2], [1,2], [2,2]] },
            { id: 'blue',    base: [[0,0], [0,1], [0,2], [0,3], [1,3]] },
            { id: 'purple',  base: [[0,0], [0,1], [0,2], [0,3]] },
            { id: 'magenta', base: [[0,0], [0,1], [1,1], [1,2], [2,2]] },
            { id: 'pink',    base: [[0,0], [1,0], [2,0], [3,0], [1,1]] },
            { id: 'white',   base: [[0,0], [1,0], [0,1]] },
            { id: 'gray',    base: [[1,0], [0,1], [1,1], [2,1], [1,2]] }
            
        ]
    },
    'kanoodle_jr': {
        name: 'Kanoodle Jr.',
        gridType: 'square',
        cols: 5,
        rows: 5,
        pieces: [
            { id: 'red',     base: [[0,0], [0,1], [0,2], [1,2]] },
            { id: 'orange',  base: [[0,0], [1,0], [0,1]] },
            { id: 'yellow',  base: [[0,0], [1,0], [2,0], [1,1]] },
            { id: 'green',   base: [[0,0], [1,0], [0,1], [1,1], [0,2]] },
            { id: 'blue',    base: [[0,0], [1,0], [1,1], [2,1]] },
            { id: 'magenta', base: [[0,0], [0,1], [1,1], [1,2], [2,2]] }
        ]
    },
    'kanoodle_extreme': {
        name: 'Kanoodle Extreme',
        gridType: 'triangular',
        cols: 12,
        rows: 5,
        invalidCells: [0, 23, 47, 48],
        pieces: [
            { id: 'red',     base: [[0,0], [1,0], [2,0], [0,1], [1,1]] },
            { id: 'orange',  base: [[0,1], [1,0], [2,0], [3,0]] },
            { id: 'yellow',  base: [[1,0], [2,0], [3,0], [0,1], [1,1]] },
            { id: 'lime',    base: [[3,1], [0,2], [1,2], [2,2], [0,3]] },
            { id: 'green',   base: [[0,0], [2,0], [0,1], [1,1], [2,1]] },
            { id: 'cyan',    base: [[0,0], [1,0], [2,0], [3,0], [2,1]] },
            { id: 'blue',    base: [[0,0], [0,1], [0,2], [1,2], [2,2]] },
            { id: 'purple',  base: [[0,0], [0,1], [0,2], [1,1]] },
            { id: 'magenta', base: [[0,0], [1,0], [2,0], [3,0], [1,1]] },
            { id: 'pink',    base: [[0,0], [1,0], [1,1], [2,1]] },
            { id: 'white',   base: [[0,0], [1,0], [2,0], [1,1], [0,2]] },
            { id: 'gray',    base: [[0,0], [1,0], [0,1], [1,1]] }
        ]
    },
    'kanoodle_genius': {
        name: 'Kanoodle Genius',
        gridType: 'triangular',
        cols: 6,
        rows: 7,
        invalidCells: [0,5,11,23,35,36,41],
        pieces: [
            { id: 'red',     base: [[0,0], [1,0], [2,0], [0,1], [1,1]] },
            { id: 'yellow',  base: [[1,0], [2,0], [3,0], [0,1], [1,1]] },
            { id: 'lime',    base: [[3,1], [0,2], [1,2], [2,2], [0,3]] },
            { id: 'green',   base: [[0,0], [1,0], [2,0], [0,1], [2,1]] },
            { id: 'cyan',    base: [[0,0], [1,0], [2,0], [3,0], [2,1]] },
            { id: 'blue',    base: [[0,0], [0,1], [0,2], [1,2], [2,2]] },
            { id: 'magenta', base: [[0,0], [1,0], [2,0], [3,0], [1,1]] },
        ]
    },
    'kanoodle_headtohead': {
        name: 'Kanoodle Head to Head',
        rows: 6,
        cols: 6,
        invalidCells: [0,5,30,35],
        gridType: 'square',
        pieces: [
            { id: 'red',     base: [[0,0], [0,1], [0,2], [1,2]] },
            { id: 'orange',  base: [[0,0], [0,1], [0,2], [1,2]] },
            { id: 'yellow',  base: [[0,0], [1,0], [0,1], [1,1]] },
            { id: 'cyan',    base: [[0,0], [1,0], [1,1], [2,1]] },
            { id: 'blue',    base: [[0,0], [1,0], [1,1], [2,1]] },
            { id: 'purple',  base: [[0,0], [1,0], [2,0], [1,1]] },
            { id: 'magenta', base: [[0,0], [1,0], [0,1], [1,1]] },
            { id: 'gray',    base: [[0,0], [1,0], [2,0], [1,1]] }
        ]
    }

};

let currentGame = 'kanoodle';
let BOARD_COLS = GAMES[currentGame].cols;
let BOARD_ROWS = GAMES[currentGame].rows;
let TOTAL_CELLS = BOARD_COLS * BOARD_ROWS; 
let MAX_SOLUTIONS = 1000; 

// The pieces mapped as [x, y] coordinate offsets.
let PIECE_DEFS = [...GAMES[currentGame].pieces];

const FAN_EDITIONS = {
    cyan: [
        { id: 'black1', base: [[0,1], [1,1], [2,1], [2,2], [0,0]] },  // 5-big S
        { id: 'black2', base: [[0,0], [1,0], [2,0], [1,1]] }          // 4-big T
    ],
    magenta: [
        { id: 'black1', base: [[0,0], [0,1], [1,1], [2,1], [1,2]] },
        { id: 'black2', base: [[0,0], [1,0], [1,1], [2,1]] }
    ]
};

// State Variables
let boardState = new Array(TOTAL_CELLS).fill(0); 
let startingBoardState = new Array(TOTAL_CELLS).fill(0);

if (GAMES[currentGame].invalidCells) {
    GAMES[currentGame].invalidCells.forEach(i => {
        boardState[i] = -1;
        startingBoardState[i] = -1;
    });
}

let pieceVariations = {}; 
let allSolutions = [];
let currentSolutionIndex = -1;

// Manual Placement State
let usedPieces = new Set();
let activePieceId = null;
let currentActiveShape = null; 
let lastHoveredIndex = -1;
let mouseX = 0;
let mouseY = 0;
let conditions = [];
let isSolving = false;
let isResetting = false;
let solverIterations = 0;
let difficultyRating = "";

// Helper to dynamically change game types
function setGameType(gameId) {
    isSolving = false;
    isResetting = true;
    currentGame = gameId;
    BOARD_COLS = GAMES[gameId].cols;
    BOARD_ROWS = GAMES[gameId].rows;
    TOTAL_CELLS = BOARD_COLS * BOARD_ROWS;
    
    PIECE_DEFS = [...GAMES[gameId].pieces];
    
    boardState = new Array(TOTAL_CELLS).fill(0);
    startingBoardState = new Array(TOTAL_CELLS).fill(0);
    
    if (GAMES[gameId].invalidCells) {
        GAMES[gameId].invalidCells.forEach(i => {
            boardState[i] = -1;
            startingBoardState[i] = -1;
        });
    }
    
    usedPieces.clear();
    activePieceId = null;
    currentActiveShape = null; 
    allSolutions = [];
    currentSolutionIndex = -1;
    conditions = [];
    solverIterations = 0;
    difficultyRating = "";
}