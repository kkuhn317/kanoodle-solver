// ==========================================
// GAME CONSTANTS & GLOBAL STATE
// ==========================================

const GAMES = {
    'kanoodle': {
        name: 'Kanoodle',
        cols: 11,
        rows: 5,
        pieces: [
            { id: 'white',  color: '#ffffff', base: [[0,0], [1,0], [0,1]] },
            { id: 'lime',   color: '#a2ca74', base: [[0,0], [1,0], [0,1], [1,1]] },
            { id: 'orange', color: '#ff5722', base: [[0,0], [0,1], [0,2], [1,2]] },
            { id: 'green',  color: '#2e7d32', base: [[1,0], [2,0], [0,1], [1,1], [3,0]] },
            { id: 'purple', color: '#7b1fa2', base: [[0,0], [0,1], [0,2], [0,3]] },
            { id: 'blue',   color: '#1565c0', base: [[0,0], [0,1], [0,2], [0,3], [1,3]] },
            { id: 'cyan',   color: '#b2ebf2', base: [[0,0], [0,1], [0,2], [1,2], [2,2]] },
            { id: 'red',    color: '#d32f2f', base: [[0,0], [1,0], [0,1], [1,1], [0,2]] },
            { id: 'yellow', color: '#ffeb3b', base: [[0,0], [2,0], [0,1], [1,1], [2,1]] },
            { id: 'pink',   color: '#e91e63', base: [[0,0], [0,1], [1,1], [1,2], [2,2]] },
            { id: 'grey',   color: '#9e9e9e', base: [[1,0], [0,1], [1,1], [2,1], [1,2]] },
            { id: 'peach',  color: '#ff8383', base: [[0,0], [1,0], [2,0], [3,0], [1,1]] }
        ]
    },
    'kanoodle_jr': {
        name: 'Kanoodle Jr.',
        cols: 5,
        rows: 5,
        pieces: [
            { id: 'jr_green', color: '#2e7d32', base: [[0,0], [1,0], [0,1], [1,1], [0,2]] },
            { id: 'jr_red', color: '#d32f2f', base: [[0,0], [0,1], [0,2], [1,2]] },
            { id: 'jr_orange', color: '#ff5722', base: [[0,0], [1,0], [0,1]] },
            { id: 'jr_blue', color: '#1565c0', base: [[0,0], [1,0], [1,1], [2,1]] },
            { id: 'jr_yellow', color: '#ffeb3b', base: [[0,0], [1,0], [2,0], [1,1]] },
            { id: 'jr_pink', color: '#e91e63', base: [[0,0], [0,1], [1,1], [1,2], [2,2]] }
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

const FAN_PIECE_DEFS = [
    { id: 'black1', color: '#000000', base: [[0,1], [1,1], [2,1], [2,2], [0,0]] },     // 5-big S
    { id: 'black2', color: '#000000', base: [[0,0], [1,0], [2,0], [1,1]] }             // 4-big T
];

// State Variables
let boardState = new Array(TOTAL_CELLS).fill(0); 
let startingBoardState = new Array(TOTAL_CELLS).fill(0);
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

// Helper to dynamically change game types
function setGameType(gameId) {
    currentGame = gameId;
    BOARD_COLS = GAMES[gameId].cols;
    BOARD_ROWS = GAMES[gameId].rows;
    TOTAL_CELLS = BOARD_COLS * BOARD_ROWS;
    
    PIECE_DEFS = [...GAMES[gameId].pieces];
    
    boardState = new Array(TOTAL_CELLS).fill(0);
    startingBoardState = new Array(TOTAL_CELLS).fill(0);
    
    usedPieces.clear();
    activePieceId = null;
    currentActiveShape = null; 
    allSolutions = [];
    currentSolutionIndex = -1;
    conditions = [];
}