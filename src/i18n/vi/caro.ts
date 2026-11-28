/** Vietnamese strings: caro. Key = the exact English source string. */
export const caro: Record<string, string> = {
  Learn: 'Học',
  'Caro handbook': 'Cẩm nang Caro',
  'Rules, shapes, winning combinations and exercises':
    'Luật chơi, các thế cờ, đòn kết hợp thắng và bài tập',
  // Home
  Caro: 'Caro',
  Practice: 'Luyện tập',
  'Game in progress': 'Ván đang chơi',
  '{count} moves': '{count} nước đi',
  Resume: 'Tiếp tục',
  Discard: 'Bỏ',
  'New game': 'Ván mới',
  Level: 'Độ khó',
  Easy: 'Dễ',
  Medium: 'Trung bình',
  Hard: 'Khó',
  'Looks two moves ahead and sometimes plays a weaker move. Undo is allowed.':
    'Nhìn trước hai nước và đôi khi đi một nước yếu hơn. Được hoàn tác.',
  'Searches several moves ahead and finds forcing wins. No undo.':
    'Tính trước nhiều nước và tìm ra các đường thắng ép buộc. Không được hoàn tác.',
  'Searches deepest, up to about a second per move. No undo.':
    'Tính sâu nhất, tối đa khoảng một giây mỗi nước. Không được hoàn tác.',
  Board: 'Bàn cờ',
  'Board size': 'Cỡ bàn cờ',
  '9 × 9 quick': '9 × 9 nhanh',
  'Who moves first': 'Ai đi trước',
  You: 'Bạn',
  Computer: 'Máy',
  'Start game': 'Bắt đầu ván',
  'Could not start the game. Try again.': 'Không thể bắt đầu ván cờ. Hãy thử lại.',
  'Could not discard the game. Try again.': 'Không thể bỏ ván cờ. Hãy thử lại.',
  'Your record': 'Thành tích của bạn',
  'No games yet': 'Chưa có ván nào',
  'Finish a game to start your record. Resigned games are not counted.':
    'Hoàn thành một ván để bắt đầu ghi thành tích. Ván xin thua không được tính.',
  Played: 'Đã chơi',
  'Win rate': 'Tỷ lệ thắng',
  'Win streak': 'Chuỗi thắng',
  'Best {n}': 'Cao nhất {n}',
  'By level': 'Theo độ khó',
  'By game type': 'Theo loại ván',
  Other: 'Khác',
  '{count} played': 'Đã chơi {count} ván',
  '{won} W · {lost} L · {drawn} D': '{won} thắng · {lost} thua · {drawn} hòa',
  'Recent games': 'Các ván gần đây',
  Win: 'Thắng',
  Loss: 'Thua',
  Draw: 'Hòa',
  'Replace the game in progress?': 'Thay thế ván đang chơi?',
  'Starting a new game discards the one you are playing. Nothing is recorded for it.':
    'Bắt đầu ván mới sẽ bỏ ván bạn đang chơi. Ván đó sẽ không được ghi lại.',
  'Start new game': 'Bắt đầu ván mới',
  'Discard this game?': 'Bỏ ván này?',
  'It will be removed and nothing is recorded: no result, no XP.':
    'Ván sẽ bị xóa và không ghi lại gì: không có kết quả, không có XP.',

  // Game types, rules and blocked squares
  'Game type': 'Kiểu chơi',
  Classic: 'Cổ điển',
  'Vietnamese rule': 'Luật Việt Nam',
  Tournament: 'Thi đấu',
  '15 × 15. Five or more in a row wins.': '15 × 15. Năm quân trở lên liền nhau là thắng.',
  '15 × 15. A five blocked at both ends does not win.':
    '15 × 15. Năm quân liền nhau mà bị chặn cả hai đầu thì không thắng.',
  '19 × 19, blocked ends, and 3 blocked squares to fight around.':
    '19 × 19, chặn hai đầu, và 3 ô bị khóa để bạn tranh giành xung quanh.',
  Advanced: 'Nâng cao',
  Rule: 'Luật chơi',
  'Free rule': 'Luật tự do',
  'Blocked ends': 'Chặn hai đầu',
  'Five or more in a row win, even with an opponent stone at both ends. Example: ○●●●●●○ wins.':
    'Năm quân trở lên liền nhau là thắng, kể cả khi có quân đối thủ ở cả hai đầu. Ví dụ: ○●●●●●○ thắng.',
  'Five or more in a row win, unless an opponent stone or a blocked square sits at both ends. Example: ○●●●●●○ does not win, but ○●●●●● does. The edge of the board does not block.':
    'Năm quân trở lên liền nhau là thắng, trừ khi cả hai đầu đều bị quân đối thủ hoặc ô bị khóa chặn. Ví dụ: ○●●●●●○ không thắng, nhưng ○●●●●● thì thắng. Mép bàn cờ không tính là chặn.',
  'Blocked squares': 'Ô bị khóa',
  'Blocked squares are dark: nobody can play there and no line can pass through them.':
    'Ô bị khóa có màu tối: không ai đánh được vào đó và không hàng nào đi xuyên qua được.',
  'Blocked squares are dark: nobody can play there, no line can pass through them, and they count as a block at the end of a line.':
    'Ô bị khóa có màu tối: không ai đánh được vào đó, không hàng nào đi xuyên qua được, và ô này tính là chặn ở đầu một hàng.',
  None: 'Không',
  '{count} squares': '{count} ô',
  '{rule} · {count} blocked squares': '{rule} · {count} ô bị khóa',
  'That five is blocked at both ends, so the game goes on.':
    'Năm quân này bị chặn cả hai đầu nên ván cờ vẫn tiếp tục.',

  // Play
  Play: 'Chơi',
  'You win!': 'Bạn thắng!',
  'The computer wins.': 'Máy thắng.',
  'Draw: the board is full.': 'Hòa: bàn cờ đã đầy.',
  'The computer could not move.': 'Máy không thể đi nước nào.',
  'Computer is thinking…': 'Máy đang suy nghĩ…',
  'Tap the marked cell again, or press Place stone.':
    'Chạm lại vào ô đã đánh dấu, hoặc bấm Đặt quân.',
  'Your move.': 'Đến lượt bạn.',
  'You play filled stones': 'Bạn cầm quân đặc',
  'You play hollow stones': 'Bạn cầm quân rỗng',
  'Try again': 'Thử lại',
  'Could not save your progress. The game is still playable here, but may not resume.':
    'Không thể lưu tiến trình của bạn. Bạn vẫn chơi tiếp được ở đây, nhưng có thể không tiếp tục lại được sau này.',
  'Confirm each move': 'Xác nhận từng nước đi',
  'Place stone': 'Đặt quân',
  Undo: 'Hoàn tác',
  Resign: 'Xin thua',
  'You won': 'Bạn đã thắng',
  'You lost': 'Bạn đã thua',
  '{count} moves on {level}.': '{count} nước đi ở mức {level}.',
  'Games with fewer than {count} of your own moves earn no XP.':
    'Ván có ít hơn {count} nước đi của bạn sẽ không nhận XP.',
  'Try saving again': 'Thử lưu lại',
  'Move list ({count})': 'Danh sách nước đi ({count})',
  '{n}. {who}: {cell}': '{n}. {who}: {cell}',
  'Resign this game?': 'Xin thua ván này?',
  'The game ends and nothing is recorded: no result, no XP.':
    'Ván kết thúc và không ghi lại gì: không có kết quả, không có XP.',

  // Board (accessible names)
  empty: 'trống',
  'your stone': 'quân của bạn',
  'computer stone': 'quân của máy',
  '{cell}, {who}': '{cell}, {who}',
  'Caro board, {size} by {size}': 'Bàn cờ Caro, {size} x {size}',
  'blocked square': 'ô bị khóa',
  'last move': 'nước vừa đi',
  'winning line': 'hàng thắng',
  selected: 'đã chọn',

  // Saving the result
  'The game is not finished.': 'Ván cờ chưa kết thúc.',
  'Could not save the game result. Try again.': 'Không thể lưu kết quả ván cờ. Hãy thử lại.',
  'Could not clear the saved game. Try again.': 'Không thể xóa ván đã lưu. Hãy thử lại.',
  'The engine failed.': 'Bộ máy cờ gặp lỗi.',
};
