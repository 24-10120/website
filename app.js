document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================
     1. Navigation and Header Styles
     ========================================== */
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  /* ==========================================
     2. Scroll Reveal Animation
     ========================================== */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Animate once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================
     3. Interactive Mini Chess Puzzle
     ========================================== */
  // Board State Setup
  // 4x4 Grid representation:
  // Row 0: [ BK,  . ,  . ,  . ]  (Black King at a4)
  // Row 1: [  . ,  . ,  . ,  . ]
  // Row 2: [  . , WK ,  . ,  . ]  (White King at b2)
  // Row 3: [  . ,  . ,  . , WR ]  (White Rook at d1)
  const initialBoard = [
    ['♚', '', '', ''],
    ['', '', '', ''],
    ['', '♔', '', ''],
    ['', '', '', '♖']
  ];

  let boardState = JSON.parse(JSON.stringify(initialBoard));
  let selectedPiece = null; // { row, col }
  const chessBoard = document.getElementById('chess-puzzle-board');
  const chessStatus = document.getElementById('chess-puzzle-status');

  function renderChessBoard() {
    chessBoard.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.classList.add('chess-cell');
        // Alternating colors
        if ((r + c) % 2 === 0) {
          cell.classList.add('light');
        } else {
          cell.classList.add('dark');
        }

        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.textContent = boardState[r][c];

        // Highlight selected
        if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
          cell.classList.add('selected');
        }

        // Highlight valid moves for selected Rook
        if (selectedPiece && boardState[selectedPiece.row][selectedPiece.col] === '♖') {
          if (isValidRookMove(selectedPiece.row, selectedPiece.col, r, c)) {
            cell.classList.add('valid-move');
          }
        }

        cell.addEventListener('click', () => handleCellClick(r, c));
        chessBoard.appendChild(cell);
      }
    }
  }

  function isValidRookMove(fromR, fromC, toR, toC) {
    // Cannot move to the same spot
    if (fromR === toR && fromC === toC) return false;
    // Rook moves horizontally or vertically
    if (fromR !== toR && fromC !== toC) return false;
    
    // Check if path is blocked (in our 4x4, only Rook can move, and path is clear except the destination)
    if (fromR === toR) {
      const step = fromC < toC ? 1 : -1;
      for (let col = fromC + step; col !== toC; col += step) {
        if (boardState[fromR][col] !== '') return false;
      }
    } else {
      const step = fromR < toR ? 1 : -1;
      for (let row = fromR + step; row !== toR; row += step) {
        if (boardState[row][fromC] !== '') return false;
      }
    }
    
    // Destination cannot contain white pieces
    const destPiece = boardState[toR][toC];
    if (destPiece === '♔' || destPiece === '♖') return false;

    return true;
  }

  function handleCellClick(row, col) {
    const piece = boardState[row][col];

    // Case 1: Selecting the White Rook
    if (piece === '♖') {
      selectedPiece = { row, col };
      chessStatus.textContent = '룩(♖)을 어디로 이동시킬까요? (보라색 칸 클릭)';
      renderChessBoard();
      return;
    }

    // Case 2: Moving the selected piece
    if (selectedPiece) {
      const fromR = selectedPiece.row;
      const fromC = selectedPiece.col;

      if (isValidRookMove(fromR, fromC, row, col)) {
        // Perform move
        boardState[row][col] = boardState[fromR][fromC];
        boardState[fromR][fromC] = '';
        selectedPiece = null;
        renderChessBoard();

        // Check if the move is the solution (Rook to Row 0, Col 3 - d4 checkmate)
        if (row === 0 && col === 3) {
          chessStatus.style.color = '#00f2fe';
          chessStatus.innerHTML = '<strong>축하합니다! 완벽한 체크메이트입니다! 🎉</strong>';
          // Play a small glow effect
          chessBoard.style.boxShadow = '0 0 30px rgba(0, 242, 254, 0.6)';
        } else {
          chessStatus.style.color = '#ff3366';
          chessStatus.textContent = '체크메이트가 아닙니다. 1.5초 후 초기화됩니다!';
          setTimeout(() => {
            resetPuzzle();
          }, 1500);
        }
      } else {
        // Invalid move or clicking elsewhere, reset selection
        selectedPiece = null;
        chessStatus.style.color = 'var(--text-secondary)';
        chessStatus.textContent = '잘못된 이동입니다. 룩(♖)을 다시 선택하세요.';
        renderChessBoard();
      }
    }
  }

  function resetPuzzle() {
    boardState = JSON.parse(JSON.stringify(initialBoard));
    selectedPiece = null;
    chessStatus.style.color = 'var(--accent-cyan)';
    chessStatus.textContent = '룩(♖)을 선택한 뒤 올바른 칸으로 이동하세요!';
    chessBoard.style.boxShadow = 'inset 0 0 20px rgba(0, 0, 0, 0.6)';
    renderChessBoard();
  }

  // Initialize Puzzle Board
  renderChessBoard();

  /* ==========================================
     4. Guestbook LocalStorage Logic
     ========================================== */
  const gbForm = document.getElementById('gb-form');
  const gbNameInput = document.getElementById('gb-name');
  const gbRelationInput = document.getElementById('gb-relation');
  const gbMessageInput = document.getElementById('gb-message');
  const gbMessagesList = document.getElementById('gb-messages-list');

  // Pre-populate with some sample greeting messages if empty
  const defaultMessages = [
    {
      id: 1,
      name: '김민준',
      relation: '친구',
      message: '영준아 웹사이트 대박 멋지다! 체스 실력 많이 늘었네 ㅋㅋ 학교에서 한 판 두자!',
      date: '2026-06-01 10:10'
    },
    {
      id: 2,
      name: '이수아',
      relation: '자운고 동급생',
      message: 'INFJ의 감성이 그대로 묻어나는 예쁜 사이트네요! 고3 수험생활 화이팅입니다 👍',
      date: '2026-06-01 10:35'
    }
  ];

  function getMessages() {
    const data = localStorage.getItem('youngjun_guestbook');
    if (!data) {
      localStorage.setItem('youngjun_guestbook', JSON.stringify(defaultMessages));
      return defaultMessages;
    }
    return JSON.parse(data);
  }

  function saveMessages(messages) {
    localStorage.setItem('youngjun_guestbook', JSON.stringify(messages));
  }

  function renderMessages() {
    const messages = getMessages();
    gbMessagesList.innerHTML = '';

    if (messages.length === 0) {
      gbMessagesList.innerHTML = '<div class="no-messages">등록된 방명록이 없습니다. 첫 메시지를 남겨보세요!</div>';
      return;
    }

    // Sort by id descending so newest messages appear at the top
    const sortedMessages = [...messages].sort((a, b) => b.id - a.id);

    sortedMessages.forEach(msg => {
      const item = document.createElement('div');
      item.classList.add('guestbook-item');

      const relationBadge = msg.relation ? ` (${msg.relation})` : '';

      item.innerHTML = `
        <div class="guestbook-meta">
          <span class="guestbook-author">${escapeHtml(msg.name)}<span style="color: var(--text-muted); font-weight: normal;">${escapeHtml(relationBadge)}</span></span>
          <span class="guestbook-date">${msg.date}</span>
        </div>
        <div class="guestbook-message">${escapeHtml(msg.message).replace(/\n/g, '<br>')}</div>
        <button class="guestbook-delete" data-id="${msg.id}" aria-label="메시지 삭제">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;

      gbMessagesList.appendChild(item);
    });

    // Attach delete event listeners
    const deleteButtons = gbMessagesList.querySelectorAll('.guestbook-delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        deleteMessage(id);
      });
    });
  }

  function deleteMessage(id) {
    let messages = getMessages();
    messages = messages.filter(msg => msg.id !== id);
    saveMessages(messages);
    renderMessages();
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Handle form submission
  gbForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = gbNameInput.value.trim();
    const relation = gbRelationInput.value.trim();
    const message = gbMessageInput.value.trim();

    if (!name || !message) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg = {
      id: Date.now(),
      name,
      relation,
      message,
      date: formattedDate
    };

    const messages = getMessages();
    messages.push(newMsg);
    saveMessages(messages);
    renderMessages();

    // Reset inputs
    gbNameInput.value = '';
    gbRelationInput.value = '';
    gbMessageInput.value = '';

    // Scroll to new message
    gbMessagesList.scrollTop = 0;
  });

  // Initial Message Load
  renderMessages();
});
