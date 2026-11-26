/** Vietnamese strings: chess. Key = the exact English source string. */
export const chess: Record<string, string> = {
  // ---- screens ---------------------------------------------------------------------------------
  Chess: 'Cờ vua',
  Practice: 'Luyện tập',
  Play: 'Chơi',
  Puzzles: 'Thế cờ',
  Openings: 'Khai cuộc',
  Lines: 'Các biến',
  Train: 'Rèn luyện',
  'Game in progress': 'Ván đang chơi',
  '{level} engine, you play {color}, {n} moves played.':
    'Máy mức {level}, bạn chơi quân {color}, đã đi {n} nước.',
  'Resume game': 'Tiếp tục ván',
  'Puzzle rating': 'Điểm hạng thế cờ',
  '{n} rated': '{n} lần tính điểm',
  'Play rating': 'Điểm hạng khi chơi',
  '{n} rated games': '{n} ván tính điểm',
  'Puzzles solved': 'Thế cờ đã giải',
  'Puzzle streak': 'Chuỗi thế cờ',
  day: 'ngày',
  days: 'ngày',
  'SkillForge ratings are only comparable with themselves. They are not FIDE or online ratings.':
    'Điểm hạng của SkillForge chỉ so sánh được với chính nó. Đây không phải điểm hạng FIDE hay điểm hạng trực tuyến.',
  'Record against the engine: {wins} won, {draws} drawn, {losses} lost.':
    'Thành tích với máy: thắng {wins}, hòa {draws}, thua {losses}.',
  '{n} tactics, picked near your rating': '{n} bài chiến thuật, chọn gần với điểm hạng của bạn',
  'Play the engine': 'Chơi với máy',
  'Three levels, undo and resign': 'Ba mức, có hoàn tác và xin thua',
  '{n} lines to drill': '{n} biến để luyện',

  // ---- play ------------------------------------------------------------------------------------
  'New game': 'Ván mới',
  'Engine level': 'Mức của máy',
  Easy: 'Dễ',
  Medium: 'Trung bình',
  Hard: 'Khó',
  'Looks two moves ahead and sometimes plays a slightly weaker move. Good for learning.':
    'Nhìn trước hai nước và đôi khi đi một nước hơi yếu. Phù hợp để học.',
  'Searches several moves deep for up to 0.7 seconds a move. Punishes simple blunders.':
    'Tính sâu vài nước, tối đa 0,7 giây mỗi nước. Trừng phạt những sai lầm đơn giản.',
  'Searches as deep as it can in 1.4 seconds a move. It is a hobby-grade engine, not a master.':
    'Tính sâu hết mức có thể trong 1,4 giây mỗi nước. Đây chỉ là máy cờ nghiệp dư, không phải kiện tướng.',
  'You play': 'Bạn chơi quân',
  'Your colour': 'Màu quân của bạn',
  White: 'Trắng',
  Black: 'Đen',
  Random: 'Ngẫu nhiên',
  'Start game': 'Bắt đầu ván',
  'The engine runs on this device, so it works offline. Finished games with at least {n} of your moves change your play rating and earn XP.':
    'Máy cờ chạy ngay trên thiết bị này nên dùng được khi không có mạng. Ván đã kết thúc có ít nhất {n} nước đi của bạn sẽ thay đổi điểm hạng khi chơi và nhận XP.',
  'Replace the game in progress?': 'Thay thế ván đang chơi?',
  'Starting a new game discards the unfinished one. It will not be rated.':
    'Bắt đầu ván mới sẽ bỏ ván chưa xong. Ván đó sẽ không được tính điểm.',
  'Start new game': 'Bắt đầu ván mới',
  'The game could not be saved. Check storage space in Settings and try again.':
    'Không thể lưu ván cờ. Hãy kiểm tra dung lượng lưu trữ trong Cài đặt rồi thử lại.',
  'The engine stopped unexpectedly. Resign or start a new game.':
    'Máy cờ bị dừng đột ngột. Hãy xin thua hoặc bắt đầu ván mới.',
  'Your move': 'Đến lượt bạn',
  'Engine is thinking…': 'Máy đang suy nghĩ…',
  'Check. Your move': 'Chiếu. Đến lượt bạn',
  'Check. Engine to move': 'Chiếu. Đến lượt máy',
  '{level} engine · you play {color}': 'Máy mức {level} · bạn chơi quân {color}',
  Material: 'Chênh lệch quân',
  Even: 'Cân bằng',
  'Game board': 'Bàn cờ ván chơi',
  'You won': 'Bạn đã thắng',
  'You lost': 'Bạn đã thua',
  Draw: 'Hòa',
  'by resignation': 'do xin thua',
  'by checkmate': 'bằng chiếu hết',
  'by stalemate': 'do hòa cờ (hết nước đi)',
  'by threefold repetition': 'do lặp lại thế cờ ba lần',
  'by fifty-move rule': 'theo luật 50 nước',
  'by insufficient material': 'do không đủ quân để chiếu hết',
  'by {reason}': 'bởi {reason}',
  'Play rating {value} ({delta})': 'Điểm hạng khi chơi {value} ({delta})',
  'Not rated: games need at least {n} of your moves.':
    'Không tính điểm: ván cần có ít nhất {n} nước đi của bạn.',
  Moves: 'Các nước đi',
  'No moves yet': 'Chưa có nước đi',
  Undo: 'Hoàn tác',
  Resign: 'Xin thua',
  'Resign this game?': 'Xin thua ván này?',
  'It counts as a loss.': 'Ván này sẽ tính là thua.',
  'Promote pawn to': 'Phong cấp tốt thành',
  Queen: 'Hậu',
  Rook: 'Xe',
  Bishop: 'Tượng',
  Knight: 'Mã',

  // ---- board (spoken names) --------------------------------------------------------------------
  '{square}, white pawn': '{square}, tốt trắng',
  '{square}, white knight': '{square}, mã trắng',
  '{square}, white bishop': '{square}, tượng trắng',
  '{square}, white rook': '{square}, xe trắng',
  '{square}, white queen': '{square}, hậu trắng',
  '{square}, white king': '{square}, vua trắng',
  '{square}, black pawn': '{square}, tốt đen',
  '{square}, black knight': '{square}, mã đen',
  '{square}, black bishop': '{square}, tượng đen',
  '{square}, black rook': '{square}, xe đen',
  '{square}, black queen': '{square}, hậu đen',
  '{square}, black king': '{square}, vua đen',
  '{square}, empty': '{square}, ô trống',
  selected: 'đã chọn',
  capture: 'bắt quân',
  'legal move': 'nước đi hợp lệ',
  'king in check': 'vua đang bị chiếu',
  hint: 'gợi ý',
  'Chess board': 'Bàn cờ',

  // ---- puzzles ---------------------------------------------------------------------------------
  'Solved! Well spotted.': 'Đã giải! Bạn nhìn ra rất tốt.',
  'Solved. Try the next one without help.': 'Đã giải. Hãy thử bài tiếp theo mà không cần trợ giúp.',
  'That is not the move. Try again.': 'Đó chưa phải nước đúng. Hãy thử lại.',
  'Correct. Keep going.': 'Chính xác. Tiếp tục nào.',
  'Here is the solution. It will not count as solved.':
    'Đây là đáp án. Bài này sẽ không được tính là đã giải.',
  'find mate in {n}': 'tìm nước chiếu hết trong {n} nước',
  'win material': 'thắng quân',
  '{color} to move: {goal}': '{color} đi: {goal}',
  'Difficulty {n}': 'Độ khó {n}',
  'Your rating': 'Điểm hạng của bạn',
  'Puzzle board': 'Bàn cờ thế cờ',
  'Practice, no XP': 'Luyện tập, không có XP',
  'The idea wins {gain} pawns of material once the opponent has replied.':
    'Ý tưởng này thắng được quân trị giá {gain} tốt sau khi đối thủ đáp lại.',
  'Next puzzle': 'Thế cờ tiếp theo',
  Hint: 'Gợi ý',
  'More hint': 'Gợi ý thêm',
  'Show solution': 'Xem đáp án',
  'Hints and a shown solution count against the first attempt at a puzzle.':
    'Gợi ý và đáp án đã xem sẽ bị tính vào lần thử đầu tiên của thế cờ.',
  'Mate in 1': 'Chiếu hết trong 1 nước',
  'Mate in 2': 'Chiếu hết trong 2 nước',
  'Mate in 3': 'Chiếu hết trong 3 nước',
  'Back rank': 'Hàng cuối',
  'Smothered mate': 'Chiếu hết ngạt',
  'Arabian mate': 'Chiếu hết kiểu Ả Rập',
  'Ladder mate': 'Chiếu hết bậc thang',
  Battery: 'Bộ đôi quân (battery)',
  Fork: 'Đòn đôi',
  Pin: 'Ghim',
  Skewer: 'Xiên',
  'Hanging piece': 'Quân bị treo',
  'Discovered attack': 'Tấn công lộ (discovered attack)',

  // ---- openings screens ------------------------------------------------------------------------
  'Play the main line move by move. The app plays the other side and tells you when you leave the book.':
    'Đi theo biến chính từng nước một. Ứng dụng đi bên còn lại và báo khi bạn đi ra ngoài sách khai cuộc.',
  'Sound, commonly played lines, not a complete repertoire.':
    'Các biến vững, được chơi phổ biến, không phải bộ khai cuộc đầy đủ.',
  '{eco} · you play {color} · {n} moves': '{eco} · bạn chơi quân {color} · {n} nước',
  '{eco} · you play {color}': '{eco} · bạn chơi quân {color}',
  'That is not the book move here. Try again, or use a hint.':
    'Đây không phải nước trong sách khai cuộc. Hãy thử lại hoặc dùng gợi ý.',
  'Shown from the book. Play it next time without help.':
    'Nước này lấy từ sách khai cuộc. Lần sau hãy tự đi không cần trợ giúp.',
  'Line complete': 'Hoàn thành biến',
  'Your move {done} of {total}': 'Nước của bạn {done}/{total}',
  'Opponent is moving…': 'Đối thủ đang đi…',
  'Opening board': 'Bàn cờ khai cuộc',
  'Moves so far': 'Các nước đã đi',
  'No mistakes or hints. Nicely drilled.': 'Không sai lầm, không gợi ý. Luyện rất tốt.',
  '{n} slip or hint this time. Run it again to make it automatic.':
    '{n} lần sai hoặc dùng gợi ý lần này. Hãy luyện lại để đi thật tự nhiên.',
  '{n} slips or hints this time. Run it again to make it automatic.':
    '{n} lần sai hoặc dùng gợi ý lần này. Hãy luyện lại để đi thật tự nhiên.',
  'Drill again': 'Luyện lại',
  'Show move': 'Xem nước đi',
  'The ideas': 'Các ý tưởng',

  // ---- opening: Italian Game -------------------------------------------------------------------
  'Italian Game (Giuoco Pianissimo)': 'Khai cuộc Ý (Giuoco Pianissimo)',
  'A calm, classical plan: develop quickly, castle, and prepare a central break with d4.':
    'Kế hoạch điềm tĩnh, cổ điển: triển khai quân nhanh, nhập thành và chuẩn bị đột phá trung tâm bằng d4.',
  'The bishop on c4 eyes f7, Black’s weakest square.':
    'Tượng ở c4 nhắm vào f7, ô yếu nhất của Đen.',
  'c3 and d3 build a solid centre; d4 comes later when it is prepared.':
    'c3 và d3 tạo trung tâm vững chắc; d4 sẽ đến sau khi đã chuẩn bị xong.',
  'Castle early and keep the e4 pawn protected with Re1.':
    'Nhập thành sớm và giữ tốt e4 được bảo vệ bằng Re1.',
  'Claim the centre and open lines for the bishop and queen.':
    'Chiếm trung tâm và mở đường cho tượng và hậu.',
  'Attack e5 while developing a knight.': 'Tấn công e5 đồng thời triển khai một mã.',
  'Aim at f7, which only the king defends.': 'Nhắm vào f7, ô chỉ có vua bảo vệ.',
  'Prepare d4 to build a strong pawn centre.': 'Chuẩn bị d4 để xây dựng trung tâm tốt vững mạnh.',
  'The quiet version: keep the centre solid and manoeuvre.':
    'Phiên bản điềm tĩnh: giữ trung tâm vững và cơ động quân.',
  'Castle early; the king is safer and the rook joins the game.':
    'Nhập thành sớm; vua an toàn hơn và xe tham gia ván cờ.',
  'Protects e4 and watches the e-file.': 'Bảo vệ e4 và kiểm soát cột e.',
  'Keep the bishop on the a2-g8 diagonal, out of reach of ...b5.':
    'Giữ tượng trên đường chéo a2-g8, ngoài tầm của ...b5.',
  'Stops ...Bg4, which would pin the knight on f3.': 'Ngăn ...Bg4, nước sẽ ghim mã ở f3.',
  'The knight heads for f1 and g3 or for c4.': 'Mã hướng tới f1 rồi g3, hoặc tới c4.',

  // ---- opening: Ruy Lopez ----------------------------------------------------------------------
  'Ruy Lopez (Closed, Chigorin)': 'Ruy Lopez (Thế đóng, Chigorin)',
  'White pressures the knight that guards e5 and builds slowly for a central break.':
    'Trắng gây sức ép lên mã bảo vệ e5 và xây dựng từ từ để đột phá trung tâm.',
  'Bb5 attacks the defender of e5; the threat is rarely carried out, the pressure is the point.':
    'Bb5 tấn công quân bảo vệ e5; đe dọa này hiếm khi được thực hiện, mục đích chính là tạo sức ép.',
  'Re1 supports e4, so ...Nxe4 is never a free pawn.':
    'Re1 bảo vệ e4, nên ...Nxe4 không bao giờ là ăn tốt miễn phí.',
  'c3 and d4 are the plan; the bishop retreats to c2 or b3 and keeps its diagonal.':
    'Kế hoạch là c3 và d4; tượng lùi về c2 hoặc b3 và giữ đường chéo của mình.',
  'Pressure on the knight that defends e5.': 'Gây sức ép lên mã đang bảo vệ e5.',
  'Keep the tension; there is no need to trade the bishop yet.':
    'Giữ căng thẳng; chưa cần đổi tượng lúc này.',
  'Protects e4 so that ...Nxe4 is no longer a threat.':
    'Bảo vệ e4 để ...Nxe4 không còn là mối đe dọa.',
  'The bishop keeps its long-term diagonal toward f7.': 'Tượng giữ đường chéo lâu dài hướng về f7.',
  'Prepare d4 and give the bishop a retreat on c2.': 'Chuẩn bị d4 và tạo chỗ lùi c2 cho tượng.',
  'Takes g4 away from Black’s bishop before the centre opens.':
    'Lấy ô g4 khỏi tượng của Đen trước khi trung tâm được mở.',
  'The central break White has been preparing.': 'Cú đột phá trung tâm mà Trắng đã chuẩn bị.',

  // ---- opening: Queen’s Gambit Declined --------------------------------------------------------
  'Queen’s Gambit Declined': 'Gambit Hậu từ chối (Queen’s Gambit Declined)',
  'White offers a c-pawn to pull Black’s centre pawn away, then builds pressure on d5.':
    'Trắng đưa tốt c ra để kéo tốt trung tâm của Đen đi chỗ khác, rồi tạo sức ép lên d5.',
  'The “gambit” is not a real sacrifice: after ...dxc4 White regains the pawn with Bxc4.':
    'Gambit này không phải hy sinh thật: sau ...dxc4 Trắng lấy lại tốt bằng Bxc4.',
  'Nc3 and Bg5 pile pressure on d5 and pin the knight on f6.':
    'Nc3 và Bg5 dồn sức ép lên d5 và ghim mã ở f6.',
  'The rook comes to the half-open c-file once Black plays ...c6.':
    'Xe đến cột c nửa mở khi Đen đi ...c6.',
  'Take space in the centre; the pawn is protected by the queen.':
    'Chiếm không gian ở trung tâm; tốt được hậu bảo vệ.',
  'Challenge d5 and fight for the centre.': 'Thách thức d5 và tranh giành trung tâm.',
  'Pin the f6 knight against the queen and add pressure on d5.':
    'Ghim mã f6 với hậu và tăng sức ép lên d5.',
  'Solid: supports d4 and opens the bishop on f1.':
    'Vững chắc: bảo vệ d4 và mở đường cho tượng ở f1.',
  'Rook to the c-file, where the play will be.': 'Xe lên cột c, nơi cuộc chơi sẽ diễn ra.',
  'The pawn is regained and White’s pieces are active.':
    'Đã lấy lại tốt và quân Trắng hoạt động tích cực.',
  'Trade the bishop that was cramping Black’s position.': 'Đổi tượng đang bó hẹp thế cờ của Đen.',

  // ---- opening: London System ------------------------------------------------------------------
  'London System': 'Hệ thống London',
  'A set-up you can play against almost anything: bishop out, solid pawns, simple plans.':
    'Một thế trận có thể chơi chống lại hầu như mọi cách: đưa tượng ra, tốt vững chắc, kế hoạch đơn giản.',
  'Develop the dark-squared bishop to f4 before closing the diagonal with e3.':
    'Đưa tượng ô đen ra f4 trước khi đóng đường chéo bằng e3.',
  'c3 and Nbd2 make a compact structure; Ne5 is the favourite outpost.':
    'c3 và Nbd2 tạo thế trận gọn chắc; Ne5 là tiền đồn được ưa thích.',
  'If Black attacks the bishop, retreat it to g3 instead of giving it up.':
    'Nếu Đen tấn công tượng, hãy lùi nó về g3 thay vì bỏ nó.',
  'Get the bishop outside the pawn chain before playing e3.':
    'Đưa tượng ra ngoài chuỗi tốt trước khi đi e3.',
  'Support d4 against ...c5 and ...Nc6 pressure.': 'Bảo vệ d4 trước sức ép của ...c5 và ...Nc6.',
  'Keeps the c-pawn on c3 and prepares Ngf3.': 'Giữ tốt c ở c3 và chuẩn bị Ngf3.',
  'Offer a trade only on your terms; the bishop stays on the diagonal.':
    'Chỉ đề nghị đổi quân theo điều kiện của bạn; tượng vẫn ở trên đường chéo.',
  'A strong outpost, supported by the d4 pawn.': 'Một tiền đồn mạnh, được tốt d4 hỗ trợ.',
  'Bolster the knight and claim more space.': 'Củng cố mã và chiếm thêm không gian.',

  // ---- opening: English Opening ----------------------------------------------------------------
  'English Opening (Reversed Sicilian)': 'Khai cuộc Anh (Sicilian đảo ngược)',
  'White plays a flank pawn first and fights for the centre from the side.':
    'Trắng đi tốt cánh trước và tranh trung tâm từ bên cạnh.',
  'c4 controls d5 without committing a centre pawn.':
    'c4 kiểm soát d5 mà không phải dùng tốt trung tâm.',
  'After ...e5 this is a Sicilian with an extra tempo for White.':
    'Sau ...e5, đây là thế Sicilian với thêm một nhịp cho Trắng.',
  'A kingside fianchetto with g3 and Bg2 keeps the king safe and the long diagonal open.':
    'Fianchetto cánh vua với g3 và Bg2 giữ vua an toàn và đường chéo dài luôn mở.',
  'Control d5 from the flank.': 'Kiểm soát d5 từ cánh.',
  'Prepare the fianchetto: the bishop will aim at the queenside.':
    'Chuẩn bị fianchetto: tượng sẽ nhắm về cánh hậu.',
  'Pressure on d5 and the long diagonal.': 'Gây sức ép lên d5 và đường chéo dài.',
  'Prepare b4 and take b4 away from Black’s pieces.':
    'Chuẩn bị b4 và không cho quân Đen dùng ô b4.',
  'Expand on the queenside.': 'Mở rộng ở cánh hậu.',

  // ---- opening: Sicilian Najdorf ---------------------------------------------------------------
  'Sicilian Defence, Najdorf': 'Phòng thủ Sicilian, biến Najdorf',
  'Black fights for the centre with a flank pawn and gets a sharp, unbalanced game.':
    'Đen tranh trung tâm bằng một tốt cánh và có ván cờ sắc bén, mất cân bằng.',
  '...c5 trades a wing pawn for White’s centre pawn, so the structure is asymmetrical.':
    '...c5 đổi một tốt cánh lấy tốt trung tâm của Trắng, nên cấu trúc tốt bất đối xứng.',
  '...a6 is the Najdorf move: it stops Nb5 and Bb5+ and prepares ...b5 or ...e5.':
    '...a6 là nước đặc trưng của Najdorf: ngăn Nb5 và Bb5+ và chuẩn bị ...b5 hoặc ...e5.',
  '...e5 kicks the d4 knight; Black accepts a hole on d5 for a firm centre.':
    '...e5 đuổi mã ở d4; Đen chấp nhận một lỗ hổng ở d5 để có trung tâm vững.',
  'Fight for d4 from the side and unbalance the game.':
    'Tranh d4 từ bên cạnh và làm ván cờ mất cân bằng.',
  'Supports ...Nf6 and ...cxd4 without blocking the bishop.':
    'Hỗ trợ ...Nf6 và ...cxd4 mà không chặn tượng.',
  'Hit the e4 pawn and develop.': 'Tấn công tốt e4 và triển khai quân.',
  'The Najdorf: stops Nb5 and Bb5+, and prepares ...e5 or ...b5.':
    'Najdorf: ngăn Nb5 và Bb5+, đồng thời chuẩn bị ...e5 hoặc ...b5.',
  'Drive the knight away and take space in the centre.':
    'Đuổi mã đi và chiếm không gian ở trung tâm.',
  'Watch d5 and prepare ...Nbd7 and ...Be7.': 'Canh ô d5 và chuẩn bị ...Nbd7 và ...Be7.',
  'Develop the last minor piece; Black is ready for ...b5 and ...Rc8.':
    'Triển khai quân nhẹ cuối cùng; Đen sẵn sàng cho ...b5 và ...Rc8.',

  // ---- opening: French Defence -----------------------------------------------------------------
  'French Defence (Steinitz)': 'Phòng thủ Pháp (Steinitz)',
  'Black builds a solid pawn chain and undermines White’s centre from the base.':
    'Đen xây chuỗi tốt vững chắc và phá trung tâm của Trắng từ gốc.',
  '...d5 challenges e4 at once; the price is a passive bishop on c8.':
    '...d5 thách thức e4 ngay lập tức; cái giá là tượng ở c8 bị thụ động.',
  'After e5 Black attacks the chain at its base with ...c5 and ...Nc6.':
    'Sau e5, Đen tấn công chuỗi tốt tại gốc bằng ...c5 và ...Nc6.',
  '...cxd4 and ...Bc5 give the pieces active squares.':
    '...cxd4 và ...Bc5 mang lại những ô hoạt động cho quân.',
  'Prepare ...d5 with a solid structure.': 'Chuẩn bị ...d5 với cấu trúc vững chắc.',
  'Challenge the centre immediately.': 'Thách thức trung tâm ngay lập tức.',
  'The knight must move; from d7 it also supports ...c5.':
    'Mã phải di chuyển; từ d7 nó cũng hỗ trợ ...c5.',
  'Hit the base of the pawn chain at d4.': 'Đánh vào gốc chuỗi tốt tại d4.',
  'Pressure on the d4 knight and a good diagonal for the bishop.':
    'Gây sức ép lên mã ở d4 và có đường chéo tốt cho tượng.',

  // ---- opening: Caro-Kann ----------------------------------------------------------------------
  'Caro-Kann Defence (Classical)': 'Phòng thủ Caro-Kann (Cổ điển)',
  'Black supports d5 with a pawn and develops the c8 bishop before locking it in.':
    'Đen bảo vệ d5 bằng một tốt và triển khai tượng c8 trước khi bị nhốt lại.',
  '...c6 prepares ...d5 without blocking the c8 bishop, the opening’s main idea.':
    '...c6 chuẩn bị ...d5 mà không chặn tượng c8, đây là ý tưởng chính của khai cuộc.',
  'After ...dxe4 the bishop goes to f5 or g6 outside the pawn chain.':
    'Sau ...dxe4, tượng ra f5 hoặc g6, ngoài chuỗi tốt.',
  'Black ends up with a very solid structure and no weak pawns.':
    'Đen có cấu trúc rất vững chắc và không có tốt yếu.',
  'Prepare ...d5 and keep the light-squared bishop free.':
    'Chuẩn bị ...d5 và giữ tượng ô trắng được tự do.',
  'Develop the bishop outside the pawn chain before ...e6.':
    'Triển khai tượng ra ngoài chuỗi tốt trước ...e6.',
  'Stops Ng5 and makes h7 available to the bishop if White plays h5.':
    'Ngăn Ng5 và dành ô h7 cho tượng nếu Trắng đi h5.',
  'Trade the bishop that eyed Black’s kingside.': 'Đổi tượng đang nhắm vào cánh vua của Đen.',

  // ---- opening: King’s Indian ------------------------------------------------------------------
  'King’s Indian Defence (Classical)': 'Phòng thủ Ấn Độ của Vua (Cổ điển)',
  'Black lets White build a big centre, then attacks it with pieces and pawn breaks.':
    'Đen để Trắng xây trung tâm lớn, rồi tấn công nó bằng quân và các cú đột phá tốt.',
  'The g7 bishop is the key piece; its diagonal grows as the centre closes.':
    'Tượng ở g7 là quân then chốt; đường chéo của nó mở rộng khi trung tâm bị đóng.',
  'After ...e5 and d5 Black plays ...Ne7 and the ...f5 break on the kingside.':
    'Sau ...e5 và d5, Đen đi ...Ne7 và đột phá ...f5 ở cánh vua.',
  'It is a sharp, committal opening: White usually attacks on the queenside.':
    'Đây là khai cuộc sắc bén, đã chọn là phải theo đến cùng: Trắng thường tấn công ở cánh hậu.',
  'Prepare to fianchetto the bishop.': 'Chuẩn bị fianchetto tượng.',
  'Strike at the big centre.': 'Tấn công vào trung tâm lớn.',
  'Reroute the knight toward the kingside break.':
    'Đưa mã sang đường khác, hướng tới cú đột phá ở cánh vua.',
  'The thematic break: Black attacks on the kingside.':
    'Cú đột phá đặc trưng: Đen tấn công ở cánh vua.',

  // ---- opening: Scandinavian -------------------------------------------------------------------
  'Scandinavian Defence': 'Phòng thủ Scandinavian (Bắc Âu)',
  'Black challenges e4 at once and recaptures with the queen.':
    'Đen thách thức e4 ngay lập tức và bắt lại bằng hậu.',
  '...d5 forces matters on move one; after exd5 Qxd5 the queen comes out early.':
    '...d5 buộc ván cờ vào thế căng ngay nước đầu; sau exd5 Qxd5 hậu ra sớm.',
  'Black keeps tempo by moving the queen away from Nc3 to a5.':
    'Đen giữ nhịp bằng cách đưa hậu tránh Nc3 sang a5.',
  'Develop the bishop to f5 before playing ...e6.': 'Đưa tượng ra f5 trước khi đi ...e6.',
  'Challenge the e4 pawn immediately.': 'Thách thức tốt e4 ngay lập tức.',
  'Step off the d-file; from a5 the queen pins the c3 knight against the king’s side.':
    'Rời khỏi cột d; từ a5 hậu ghim mã c3 về phía vua.',
  'Bring the bishop out before closing the diagonal with ...e6.':
    'Đưa tượng ra trước khi đóng đường chéo bằng ...e6.',
};
