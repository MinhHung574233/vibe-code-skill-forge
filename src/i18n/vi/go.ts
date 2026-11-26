/** Vietnamese strings: go. Key = the exact English source string. */
export const go: Record<string, string> = {
  // Names and shared words
  Go: 'Cờ vây',
  Practice: 'Luyện tập',
  Black: 'Đen',
  White: 'Trắng',
  'Black (first)': 'Đen (đi trước)',
  Easy: 'Dễ',
  Medium: 'Trung bình',
  Hard: 'Khó',
  Draw: 'Hòa',
  Pass: 'Bỏ lượt',
  pass: 'bỏ lượt',
  Undo: 'Hoàn tác',
  Resign: 'Xin thua',
  Discard: 'Bỏ',
  Stones: 'Quân',
  Territory: 'Lãnh thổ',
  Total: 'Tổng',
  Komi: 'Komi',
  Continue: 'Tiếp tục',
  'Try again': 'Thử lại',
  Solved: 'Đã giải',
  'Loading…': 'Đang tải…',
  You: 'Bạn',
  'The computer': 'Máy',

  // Home
  'Game in progress': 'Ván đang chơi',
  'you are black': 'bạn cầm quân Đen',
  'you are white': 'bạn cầm quân Trắng',
  '{count} moves played': 'đã đi {count} nước',
  'Resume game': 'Tiếp tục ván',
  'Discard it': 'Bỏ ván này',
  'New game': 'Ván mới',
  Board: 'Bàn cờ',
  'Board size': 'Cỡ bàn cờ',
  Opponent: 'Đối thủ',
  'Opponent level': 'Độ khó của đối thủ',
  'You play': 'Bạn chơi quân',
  'Your colour': 'Màu quân của bạn',
  Handicap: 'Chấp quân',
  None: 'Không',
  '{count} stones': '{count} quân',
  '{count} pts': '{count} điểm',
  'Area (Chinese) scoring. White moves first when Black has handicap stones. The computer is a beginner-level engine: roughly 25 to 15 kyu at best on 9×9, weaker on larger boards. These are estimates, not a rating.':
    'Tính điểm theo diện tích (luật Trung Quốc). Khi Đen có quân chấp thì Trắng đi trước. Máy chỉ là bộ máy cờ mức mới học: tốt nhất khoảng 25 đến 15 kyu trên bàn 9×9, yếu hơn trên bàn lớn. Đây chỉ là ước tính, không phải xếp hạng.',
  'Start game': 'Bắt đầu ván',
  Tsumego: 'Tsumego',
  'Life-and-death problems': 'Bài tập sống chết',
  '{solved} of {total} solved': 'Đã giải {solved}/{total}',
  'Your record': 'Thành tích của bạn',
  'No games yet': 'Chưa có ván nào',
  '{wins} won · {losses} lost': '{wins} thắng · {losses} thua',
  '{wins} won · {losses} lost · {draws} drawn': '{wins} thắng · {losses} thua · {draws} hòa',
  'No finished games yet': 'Chưa có ván nào hoàn thành',
  'Finish a game of at least five moves to see your record.':
    'Hoàn thành một ván có ít nhất năm nước để xem thành tích.',
  'Recent games': 'Các ván gần đây',
  'Won by resignation': 'Thắng do đối thủ xin thua',
  'Lost by resignation': 'Thua do xin thua',
  'Won by {margin}': 'Thắng cách biệt {margin}',
  'Lost by {margin}': 'Thua cách biệt {margin}',
  'Start a new game?': 'Bắt đầu ván mới?',
  'The game in progress will be deleted. It will not be recorded.':
    'Ván đang chơi sẽ bị xóa và không được ghi lại.',
  'Start new game': 'Bắt đầu ván mới',
  'Discard this game?': 'Bỏ ván này?',

  // Play
  Game: 'Ván chơi',
  'No game in progress': 'Không có ván nào đang chơi',
  'Start a new game from the Go home screen.': 'Hãy bắt đầu ván mới từ màn hình chính của Cờ vây.',
  'That point is taken.': 'Điểm này đã có quân.',
  'Not allowed: a stone with no liberties and no capture (suicide).':
    'Không được phép: quân không còn khí và không bắt được quân nào (tự sát).',
  'Not allowed: that would repeat an earlier board position (ko). Play elsewhere first.':
    'Không được phép: nước này lặp lại thế cờ trước đó (ko). Hãy đi chỗ khác trước.',
  'The game is over.': 'Ván cờ đã kết thúc.',
  'That point is not on the board.': 'Điểm này không nằm trên bàn cờ.',
  '{color} resigned.': '{color} đã xin thua.',
  '{who} passed.': '{who} bỏ lượt.',
  '{who} played {where}.': '{who} đi {where}.',
  '{who} played {where} and captured {n} stone.': '{who} đi {where} và bắt {n} quân.',
  '{who} played {where} and captured {n} stones.': '{who} đi {where} và bắt {n} quân.',
  'Both players passed. Tap groups to mark them dead, then accept the result.':
    'Cả hai bên đã bỏ lượt. Chạm vào các nhóm quân để đánh dấu là chết, rồi chấp nhận kết quả.',
  'The computer is thinking…': 'Máy đang suy nghĩ…',
  'The computer passed. Your turn ({color})': 'Máy bỏ lượt. Đến lượt bạn ({color})',
  'Your turn ({color})': 'Đến lượt bạn ({color})',
  'Waiting for the computer…': 'Đang đợi máy…',
  'Captured: {you} {youCount} · {computer} {computerCount}':
    'Quân bị bắt: {you} {youCount} · {computer} {computerCount}',
  '{size} by {size} Go board': 'Bàn cờ vây {size} x {size}',
  'Place stone at {point}': 'Đặt quân tại {point}',
  'Zoom out': 'Thu nhỏ',
  'Zoom in': 'Phóng to',
  Scoring: 'Tính điểm',
  'Area scoring': 'Tính theo diện tích',
  'White (+{komi} komi)': 'Trắng (+{komi} komi)',
  'White + {komi} komi': 'Trắng + {komi} komi',
  '{result} (you win)': '{result} (bạn thắng)',
  '{result} (computer wins)': '{result} (máy thắng)',
  'Auto-mark dead stones (estimate)': 'Tự đánh dấu quân chết (ước tính)',
  'Clear marks': 'Xóa dấu',
  'Resume play': 'Chơi tiếp',
  'Accept result': 'Chấp nhận kết quả',
  'Dead stones are removed, then each side counts its stones and the empty points only it touches. Auto-mark is a random-playout guess: check it before accepting.':
    'Quân chết được nhấc khỏi bàn, sau đó mỗi bên đếm quân của mình và các điểm trống chỉ chạm vào quân của mình. Tự đánh dấu chỉ là phỏng đoán từ các ván chơi thử ngẫu nhiên: hãy kiểm tra lại trước khi chấp nhận.',
  'Move list': 'Danh sách nước đi',
  '{n}. {color} {move}': '{n}. {color} {move}',
  'No moves yet.': 'Chưa có nước đi nào.',
  'Resign this game?': 'Xin thua ván này?',
  'You lose the game and it will not be recorded.':
    'Bạn thua ván này và ván sẽ không được ghi lại.',
  empty: 'trống',
  'black stone': 'quân đen',
  'white stone': 'quân trắng',

  // Result sheet
  'You won': 'Bạn đã thắng',
  'You lost': 'Bạn đã thua',
  '{winner} wins by resignation ({text})': '{winner} thắng do đối thủ xin thua ({text})',
  'The game is a draw.': 'Ván cờ hòa.',
  '{winner} wins by {margin} points ({text})': '{winner} thắng {margin} điểm ({text})',
  'This game was too short to be recorded (it needs at least five of your moves).':
    'Ván này quá ngắn nên không được ghi lại (cần ít nhất năm nước đi của bạn).',

  // Module
  'Page not found': 'Không tìm thấy trang',
  'That Go page does not exist.': 'Trang Cờ vây này không tồn tại.',
  'Back to Go': 'Quay lại Cờ vây',

  // Tsumego screens
  'Level 1 · First steps': 'Cấp độ 1 · Bước đầu',
  'Level 2 · Easy': 'Cấp độ 2 · Dễ',
  'Level 3 · Medium': 'Cấp độ 3 · Trung bình',
  'Level 4 · Hard': 'Cấp độ 4 · Khó',
  'Level 5 · Expert': 'Cấp độ 5 · Cao thủ',
  'Life-and-death problems. {solved} of {total} solved. Every answer is checked by a search of the diagram, not just stored.':
    'Bài tập sống chết. Đã giải {solved}/{total}. Mọi đáp án đều được kiểm tra bằng cách tìm kiếm trên sơ đồ, không chỉ được lưu sẵn.',
  Problem: 'Bài tập',
  Problems: 'Bài tập',
  'Problem not found': 'Không tìm thấy bài tập',
  'Pick a problem from the list.': 'Hãy chọn một bài tập trong danh sách.',
  'That move is not legal here.': 'Nước đi này không hợp lệ ở đây.',
  'That is not the key move. Look for the point that decides the fight.':
    'Đây không phải nước then chốt. Hãy tìm điểm quyết định cuộc giao tranh.',
  'Level {n}': 'Cấp độ {n}',
  'Tsumego diagram. {objective}': 'Sơ đồ tsumego. {objective}',
  'column {col}, row {row}': 'cột {col}, hàng {row}',
  'The triangle marks the group to save or capture. The diagram is the whole fight: nothing outside it can be played.':
    'Hình tam giác đánh dấu nhóm quân cần cứu hoặc cần bắt. Sơ đồ là toàn bộ cuộc giao tranh: không thể đi quân nào ngoài sơ đồ.',
  'Correct!': 'Chính xác!',
  'Not this move': 'Không phải nước này',
  Answer: 'Đáp án',
  'Shown answers do not count as solved. Try it yourself to earn the tick.':
    'Đáp án được xem sẽ không tính là đã giải. Hãy tự thử để nhận dấu tích.',
  'Next problem': 'Bài tiếp theo',
  'Play it again': 'Chơi lại',
  'Show the answer': 'Xem đáp án',

  // Tsumego categories and objectives
  'Vital point': 'Điểm huyệt',
  'Two eyes': 'Hai mắt',
  'False eye': 'Mắt giả',
  Corner: 'Góc',
  'Capturing race': 'Đua khí',
  'Black to play and live': 'Đen đi và sống',
  'White to play and live': 'Trắng đi và sống',
  'Black to play and kill the group with the triangle': 'Đen đi và giết nhóm quân có hình tam giác',
  'White to play and kill the group with the triangle':
    'Trắng đi và giết nhóm quân có hình tam giác',
  'Black to play and win the capturing race': 'Đen đi và thắng cuộc đua khí',
  'White to play and win the capturing race': 'Trắng đi và thắng cuộc đua khí',

  // Tsumego problems: titles
  'Straight three: kill': 'Ba thẳng: giết',
  'Straight three: live': 'Ba thẳng: sống',
  'Bent three in the corner: kill': 'Ba cong ở góc: giết',
  'Bent three in the corner: live': 'Ba cong ở góc: sống',
  'Bulky five in the corner: kill': 'Năm khối ở góc: giết',
  'Bulky five in the corner: live': 'Năm khối ở góc: sống',
  'T-shaped four: kill': 'Bốn hình chữ T: giết',
  'T-shaped four: live': 'Bốn hình chữ T: sống',
  'T-shaped four in the corner: kill': 'Bốn hình chữ T ở góc: giết',
  'T-shaped four in the corner: live': 'Bốn hình chữ T ở góc: sống',
  'Plus-shaped five: kill': 'Năm hình dấu cộng: giết',
  'Plus-shaped five: live': 'Năm hình dấu cộng: sống',
  'Plus with a White stone: kill': 'Dấu cộng có một quân Trắng: giết',
  'Plus with a White stone: live': 'Dấu cộng có một quân Trắng: sống',
  'Bulky five, stone at the tip: kill': 'Năm khối, quân ở đỉnh: giết',
  'Bulky five with a stone inside: live': 'Năm khối có một quân bên trong: sống',
  'Bar with a stone: live': 'Thanh thẳng có một quân: sống',
  'Bent five with a stone: kill': 'Năm cong có một quân: giết',
  'Plus with a stone on top: kill': 'Dấu cộng có quân ở trên: giết',
  'Plus with a stone on top: live': 'Dấu cộng có quân ở trên: sống',
  'Plus with a stone below: kill': 'Dấu cộng có quân ở dưới: giết',
  'Six-point space with a stone: kill': 'Không gian sáu điểm có một quân: giết',
  'Six-point space with a stone: live': 'Không gian sáu điểm có một quân: sống',
  'The false eye': 'Mắt giả',
  'Capturing race 1': 'Đua khí 1',
  'Capturing race 2': 'Đua khí 2',
  'Capturing race 3': 'Đua khí 3',
  'Capturing race 4': 'Đua khí 4',
  'Capturing race 5': 'Đua khí 5',
  'Capturing race 6': 'Đua khí 6',
  'Four points and a stone: live': 'Bốn điểm và một quân: sống',
  'Four points and a stone: kill': 'Bốn điểm và một quân: giết',
  'Take the corner stone': 'Lấy quân ở góc',

  // Tsumego problems: explanations and reasons a tempting move fails
  'The middle of a straight three is the vital point. With White there, Black has only one eye left; an end point lets Black capture the stone and make two eyes.':
    'Điểm giữa của ba thẳng là điểm huyệt. Khi Trắng ở đó, Đen chỉ còn một mắt; nếu đi vào điểm đầu, Đen sẽ bắt quân đó và tạo được hai mắt.',
  'A stone at the end is captured when Black plays the middle point, which leaves two separate eyes.':
    'Quân ở đầu sẽ bị bắt khi Đen đi vào điểm giữa, và để lại hai mắt riêng biệt.',
  'Playing the middle point splits the three-point space into two separate one-point eyes, so the group is alive.':
    'Đi vào điểm giữa sẽ chia không gian ba điểm thành hai mắt một điểm riêng biệt, nên nhóm quân sống.',
  'That leaves a two-point eye, and White kills it by playing inside it.':
    'Nước đó để lại một mắt hai điểm, và Trắng giết nó bằng cách đi vào bên trong.',
  'The corner point is the middle of the bent three and its vital point. Anywhere else, Black takes the stone and has two eyes.':
    'Điểm góc là điểm giữa của ba cong và cũng là điểm huyệt của nó. Đi chỗ khác thì Đen bắt quân và có hai mắt.',
  'Black answers correctly and makes two eyes, so the group lives.':
    'Đen đáp lại đúng và tạo được hai mắt, nên nhóm quân sống.',
  'The corner point cuts the bent three into two one-point eyes. An end point leaves a two-point eye that White kills.':
    'Điểm góc chia ba cong thành hai mắt một điểm. Đi vào điểm đầu sẽ để lại một mắt hai điểm mà Trắng có thể giết.',
  'Black can no longer make two eyes: White kills the group.':
    'Đen không còn tạo được hai mắt nữa: Trắng giết nhóm quân.',
  'In a bulky five the vital point is the one that touches three of the other eye points. Take it and the space can no longer make two eyes.':
    'Trong năm khối, điểm huyệt là điểm chạm vào ba điểm mắt còn lại. Chiếm điểm đó thì không gian không thể tạo được hai mắt.',
  'Black takes the vital point of the bulky five himself: the space is split into two eyes that White cannot both stop.':
    'Đen tự chiếm điểm huyệt của năm khối: không gian bị chia thành hai mắt mà Trắng không thể chặn cả hai.',
  'The centre of the T touches all three other points. White there leaves no way to split the space into two eyes.':
    'Tâm của chữ T chạm vào cả ba điểm còn lại. Trắng ở đó thì không còn cách nào chia không gian thành hai mắt.',
  'Black plays the centre of the T, which makes the three remaining points into separate eyes.':
    'Đen đi vào tâm của chữ T, biến ba điểm còn lại thành các mắt riêng biệt.',
  'The same vital point as in the open, only now the corner stone of the eye space is on the real corner of the board.':
    'Vẫn là điểm huyệt như ở ngoài biên, chỉ khác là quân góc của không gian mắt nằm đúng ở góc thật của bàn cờ.',
  'Black takes the centre of the T and the group has two eyes.':
    'Đen chiếm tâm của chữ T và nhóm quân có hai mắt.',
  'Only the centre of the plus works. A stone on any arm is captured and Black then has four separate eyes.':
    'Chỉ có tâm của dấu cộng là đúng. Quân đặt trên bất kỳ nhánh nào cũng bị bắt và khi đó Đen có bốn mắt riêng biệt.',
  'The centre point turns the plus into four separate one-point eyes. Any other move leaves White the centre.':
    'Điểm tâm biến dấu cộng thành bốn mắt một điểm riêng biệt. Đi nước khác thì Trắng chiếm được tâm.',
  'White already has a stone inside. One more at the centre of the space joins it and Black cannot make two eyes any more.':
    'Trắng đã có một quân bên trong. Thêm một quân ở tâm không gian sẽ nối với nó và Đen không thể tạo hai mắt nữa.',
  'Black plays the centre of the plus. That captures the White stone and leaves four separate eyes.':
    'Đen đi vào tâm của dấu cộng. Nước này bắt quân Trắng và để lại bốn mắt riêng biệt.',
  'The stone at the tip is only a decoy. The point that touches three others is still the one that kills.':
    'Quân ở đỉnh chỉ là mồi nhử. Điểm chạm vào ba điểm khác vẫn là điểm giết được nhóm quân.',
  'Only the point directly above the White stone makes two eyes. The other points leave White the key point.':
    'Chỉ có điểm nằm ngay trên quân Trắng mới tạo được hai mắt. Các điểm khác để Trắng chiếm điểm then chốt.',
  'Of the four empty points only one gives Black two eyes; the others leave White the point that decides.':
    'Trong bốn điểm trống, chỉ một điểm giúp Đen có hai mắt; các điểm khác để Trắng chiếm điểm quyết định.',
  'White plays to the right of its own stone, at the point that touches both the stone and the empty point above it.':
    'Trắng đi sang bên phải quân của mình, tại điểm chạm vào cả quân đó và điểm trống phía trên nó.',
  'White plays directly below its own stone. That joins it to the empty point underneath and leaves Black no way to split the space.':
    'Trắng đi ngay bên dưới quân của mình. Nước này nối nó với điểm trống phía dưới và khiến Đen không còn cách chia không gian.',
  'Black takes the point directly below the White stone, which stops White joining it to the rest of the space.':
    'Đen chiếm điểm ngay bên dưới quân Trắng, ngăn Trắng nối nó với phần còn lại của không gian.',
  'White plays directly above its own stone, in the middle of the top row of the space.':
    'Trắng đi ngay phía trên quân của mình, ở giữa hàng trên cùng của không gian.',
  'A big space, but still one deciding point: directly to the right of the White stone.':
    'Không gian lớn, nhưng vẫn chỉ có một điểm quyết định: ngay bên phải quân Trắng.',
  'Despite the size, only one point makes two eyes: directly to the right of the White stone.':
    'Dù không gian lớn, chỉ có một điểm tạo được hai mắt: ngay bên phải quân Trắng.',
  'The left "eye" is false: the single Black stone at the edge is cut off by the White stone below it. Black must capture that White stone first, which also makes a real second eye.':
    'Con "mắt" bên trái là mắt giả: quân Đen đơn độc ở cạnh bị quân Trắng bên dưới cắt rời. Đen phải bắt quân Trắng đó trước, và việc này cũng tạo ra một mắt thật thứ hai.',
  'Filling a real eye leaves Black one eye at most, and the other is a false eye that White breaks.':
    'Lấp một mắt thật thì Đen chỉ còn nhiều nhất một mắt, còn mắt kia là mắt giả mà Trắng sẽ phá.',
  'Connecting at the false eye wastes it: the cutting stone is still there and the group is left with one eye.':
    'Nối ở mắt giả là lãng phí nó: quân cắt vẫn còn đó và nhóm quân chỉ còn một mắt.',
  'Neither group may run out of liberties first, so the order of moves decides. Only a point on the open side (either of the two points beside White) wins the capturing race for Black; every other first move loses it (each one was checked).':
    'Không nhóm nào được hết khí trước, nên thứ tự nước đi quyết định. Chỉ một điểm ở phía hở (một trong hai điểm cạnh quân Trắng) mới giúp Đen thắng cuộc đua khí; mọi nước đầu tiên khác đều thua (đã kiểm tra từng nước).',
  'This loses the race: White captures first.': 'Nước này thua cuộc đua khí: Trắng bắt trước.',
  'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 5, row 2 wins the capturing race for Black; every other first move loses it (each one was checked).':
    'Không nhóm nào được hết khí trước, nên thứ tự nước đi quyết định. Chỉ điểm ở cột 5, hàng 2 mới giúp Đen thắng cuộc đua khí; mọi nước đầu tiên khác đều thua (đã kiểm tra từng nước).',
  'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 4, row 2 wins the capturing race for Black; every other first move loses it (each one was checked).':
    'Không nhóm nào được hết khí trước, nên thứ tự nước đi quyết định. Chỉ điểm ở cột 4, hàng 2 mới giúp Đen thắng cuộc đua khí; mọi nước đầu tiên khác đều thua (đã kiểm tra từng nước).',
  'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 6, row 3 wins the capturing race for Black; every other first move loses it (each one was checked).':
    'Không nhóm nào được hết khí trước, nên thứ tự nước đi quyết định. Chỉ điểm ở cột 6, hàng 3 mới giúp Đen thắng cuộc đua khí; mọi nước đầu tiên khác đều thua (đã kiểm tra từng nước).',
  'Of the three empty points only the one right next to the White stone gives Black two eyes.':
    'Trong ba điểm trống, chỉ điểm nằm sát quân Trắng mới giúp Đen có hai mắt.',
  'White has one stone inside. The point next to it on the inside is the one that stops Black making two eyes.':
    'Trắng có một quân bên trong. Điểm cạnh nó ở phía trong là điểm ngăn Đen tạo hai mắt.',
  'Only the corner point lives. The other points, including filling an eye, leave Black one eye short.':
    'Chỉ có điểm góc là sống. Các điểm khác, kể cả lấp một mắt, đều khiến Đen thiếu một mắt.',
};
