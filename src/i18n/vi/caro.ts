/** Vietnamese strings: caro. Key = the exact English source string. */
export const caro: Record<string, string> = {
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
  '{n}. {who}: row {row}, column {col}': '{n}. {who}: hàng {row}, cột {col}',
  'Resign this game?': 'Xin thua ván này?',
  'The game ends and nothing is recorded: no result, no XP.':
    'Ván kết thúc và không ghi lại gì: không có kết quả, không có XP.',

  // Board (accessible names)
  empty: 'trống',
  'your stone': 'quân của bạn',
  'computer stone': 'quân của máy',
  'Row {row}, column {col}, {who}': 'Hàng {row}, cột {col}, {who}',
  'Caro board, {size} by {size}': 'Bàn cờ Caro, {size} x {size}',
  'last move': 'nước vừa đi',
  'winning line': 'hàng thắng',
  selected: 'đã chọn',

  // Saving the result
  'The game is not finished.': 'Ván cờ chưa kết thúc.',
  'Could not save the game result. Try again.': 'Không thể lưu kết quả ván cờ. Hãy thử lại.',
  'Could not clear the saved game. Try again.': 'Không thể xóa ván đã lưu. Hãy thử lại.',
  'The engine failed.': 'Bộ máy cờ gặp lỗi.',
};
