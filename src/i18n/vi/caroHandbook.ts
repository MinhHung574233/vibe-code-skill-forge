/** Vietnamese strings: Caro handbook. Key = the exact English source string. */
export const caroHandbook: Record<string, string> = {
  // Chapters, diagrams and exercises (the English text in content.ts is the key)
  'The symbols used in the diagrams.': 'Các ký hiệu dùng trong sơ đồ.',
  'Filled stone: the first player.': 'Quân đặc: người đi trước.',
  'Hollow stone: the second player.': 'Quân rỗng: người đi sau.',
  'Hatched square: an obstacle. Nobody can play there.':
    'Ô gạch chéo: ô bị khóa. Không ai được đánh vào đó.',
  'Dashed square with a letter: a square to look at, or a suggested move.':
    'Ô nét đứt có chữ: ô cần chú ý, hoặc nước đi gợi ý.',
  'Green ring: part of a winning line.': 'Vòng xanh: một phần của hàng thắng.',
  'Red cross: an end square of a row that decides if a five wins.':
    'Dấu chéo đỏ: ô ở đầu hàng, quyết định hàng năm quân có thắng hay không.',
  'Dot: a square that matters.': 'Chấm: một ô quan trọng.',
  'Thick line: the real edge of the board. If there is none, the board goes on beyond the picture and the squares you cannot see are empty.':
    'Đường kẻ đậm: mép thật của bàn cờ. Nếu không có, bàn cờ còn kéo dài ra ngoài hình và các ô bạn không thấy đều trống.',
  'The goal and the basics': 'Mục tiêu và những điều cơ bản',
  'Five in a row, who moves first, and the three board sizes.':
    'Năm quân liên tiếp, ai đi trước, và ba cỡ bàn cờ.',
  'Caro (also called gomoku) is a game for two. You take turns putting one stone on an empty square. The first player to make a row of five of their own stones wins.':
    'Caro (còn gọi là gomoku) là trò chơi của hai người. Hai bên lần lượt đặt một quân vào một ô trống. Ai tạo được hàng năm quân của mình trước sẽ thắng.',
  'The row can run across, up and down, or along a diagonal. The five stones must touch each other with no gap.':
    'Hàng có thể nằm ngang, dọc hoặc chéo. Năm quân phải liền nhau, không có ô trống xen giữa.',
  'Three winning fives: across, up and down, and along a diagonal. The green ring marks each line.':
    'Ba hàng năm quân thắng: ngang, dọc và chéo. Vòng xanh đánh dấu từng hàng.',
  'Who plays what': 'Ai đánh quân nào',
  'The first player moves first and plays the filled stones. The second player plays the hollow stones. Moving first is an advantage, because you are always one move ahead. As the second player, defend carefully and wait for a chance.':
    'Người đi trước đánh trước và dùng quân đặc. Người đi sau dùng quân rỗng. Đi trước là một lợi thế vì bạn luôn hơn một nước. Nếu đi sau, hãy phòng thủ cẩn thận và chờ cơ hội.',
  'If the board fills up and nobody has five, the game is a draw.':
    'Nếu bàn cờ đầy mà không ai có năm quân thì ván cờ hòa.',
  'Board sizes': 'Cỡ bàn cờ',
  '15 by 15 is the standard board. It has room for long plans.':
    '15 × 15 là bàn cờ tiêu chuẩn. Có đủ chỗ cho những kế hoạch dài.',
  '9 by 9 is a fast game. The edges come into play quickly, so every move counts.':
    '9 × 9 là ván chơi nhanh. Các mép bàn cờ xuất hiện rất nhanh nên nước nào cũng quan trọng.',
  '19 by 19 is the large board. There is plenty of room, so attacks take longer to build.':
    '19 × 19 là bàn cờ lớn. Có nhiều chỗ nên mỗi đợt tấn công cần nhiều thời gian hơn để xây dựng.',
  'A whole 9 by 9 board. The thick line is the edge of the board. The first stone usually goes in the centre.':
    'Cả một bàn cờ 9 × 9. Đường kẻ đậm là mép bàn cờ. Quân đầu tiên thường đặt ở giữa bàn.',
  'Every move has two jobs': 'Mỗi nước đi có hai việc',
  'On each turn you can build your own row, or stop your opponent. The best moves often do both at once. The next chapters teach you the shapes to look for.':
    'Mỗi lượt, bạn có thể xây hàng của mình hoặc chặn đối thủ. Những nước hay nhất thường làm cả hai việc cùng lúc. Các chương sau sẽ dạy bạn những thế cần tìm.',
  'Read the board before every move. First look at what your opponent threatens, then at what you can make.':
    'Hãy đọc bàn cờ trước mỗi nước đi. Trước tiên xem đối thủ đang đe dọa gì, rồi xem bạn có thể tạo ra gì.',
  'Rule variants': 'Các biến thể luật',
  'Freestyle, blocked ends (chặn hai đầu) and obstacle squares.':
    'Luật tự do, luật chặn hai đầu và các ô bị khóa.',
  'Caro is played with slightly different rules in different places. The app knows two ways to decide a win, and it can add obstacle squares to the board.':
    'Caro có những luật hơi khác nhau ở mỗi nơi. Ứng dụng biết hai cách để xác định thắng, và có thể thêm các ô bị khóa lên bàn cờ.',
  Freestyle: 'Luật tự do',
  'Five or more stones in a row win. Nothing else matters. It does not matter what stands at the ends of the row.':
    'Từ năm quân trở lên liên tiếp là thắng. Không có điều kiện nào khác. Không quan trọng đầu hàng có gì.',
  'Freestyle: the first player plays A and makes five. Both ends are blocked by hollow stones, but it still wins.':
    'Luật tự do: người đi trước đánh A và tạo thành năm quân. Cả hai đầu đều bị quân rỗng chặn nhưng vẫn thắng.',
  'Blocked ends (chặn hai đầu)': 'Chặn hai đầu',
  'Many Vietnamese players know this rule as chặn hai đầu. Now you must look at the two squares at the ends of your row. A row of five or more wins unless both ends are blocked.':
    'Nhiều người chơi Việt Nam biết luật này với tên chặn hai đầu. Lúc này bạn phải xem hai ô ở hai đầu hàng của mình. Hàng từ năm quân trở lên thắng, trừ khi cả hai đầu đều bị chặn.',
  'An end is blocked when an opponent stone or an obstacle square stands there. One blocked end is fine: you still win. Two blocked ends: the five does not count, and the game simply goes on.':
    'Một đầu bị chặn khi có quân đối thủ hoặc ô bị khóa nằm ở đó. Chặn một đầu thì không sao: bạn vẫn thắng. Chặn cả hai đầu thì năm quân không được tính và ván cờ cứ thế tiếp tục.',
  'Blocked ends: one end is blocked (the cross), the other is free (the dot). A makes five and wins.':
    'Chặn hai đầu: một đầu bị chặn (dấu chéo), đầu kia còn trống (chấm). Đánh A tạo năm quân và thắng.',
  'The same row, but now both ends are blocked (two crosses). A makes five, but it does not win.':
    'Cùng hàng đó, nhưng lúc này cả hai đầu đều bị chặn (hai dấu chéo). Đánh A tạo năm quân nhưng không thắng.',
  'The edge of the board is not a blocker. A five that touches the edge always wins, because at most one of its ends can be blocked.':
    'Mép bàn cờ không phải là vật chặn. Năm quân chạm mép luôn thắng, vì nhiều nhất chỉ có một đầu bị chặn.',
  'The left end of this five is the edge of the board (the thick line). The edge is not a blocker, so only one end is blocked and A wins.':
    'Đầu bên trái của hàng năm quân này là mép bàn cờ (đường kẻ đậm). Mép bàn không chặn, nên chỉ một đầu bị chặn và A thắng.',
  'Obstacle squares': 'Ô bị khóa',
  'Some games have obstacle squares. They are drawn with a hatch pattern. Nobody can play on them. A line of stones cannot pass through one. Under the blocked rule an obstacle also counts as a blocker at the end of a row.':
    'Một số ván có các ô bị khóa. Chúng được vẽ bằng nét gạch chéo. Không ai được đánh vào đó. Hàng quân không thể đi xuyên qua ô bị khóa. Theo luật chặn hai đầu, ô bị khóa cũng được tính là vật chặn ở đầu hàng.',
  'An obstacle cuts a line in two. These four stones look close to a five, but they can never make one.':
    'Ô bị khóa cắt một hàng làm đôi. Bốn quân này trông gần thành năm, nhưng không bao giờ thành được.',
  'An obstacle works as a wall. Here it blocks one end and an opponent stone blocks the other, so five at A does not win.':
    'Ô bị khóa hoạt động như một bức tường. Ở đây nó chặn một đầu còn quân đối thủ chặn đầu kia, nên năm quân tại A không thắng.',
  'Freestyle: five or more wins, always.': 'Luật tự do: từ năm quân trở lên luôn thắng.',
  'Blocked ends: five or more wins unless both ends are blocked.':
    'Chặn hai đầu: từ năm quân trở lên thắng, trừ khi cả hai đầu đều bị chặn.',
  'Obstacles: nobody plays there, lines cannot cross them, and they block the end of a row.':
    'Ô bị khóa: không ai đánh vào đó, hàng không đi xuyên qua được, và chúng chặn đầu hàng.',
  'Before you play, check which rule the game uses. The same five can win in one rule and not in the other.':
    'Trước khi đánh, hãy kiểm tra ván dùng luật nào. Cùng một hàng năm quân có thể thắng theo luật này nhưng không thắng theo luật kia.',
  'Shapes and their names': 'Các thế cờ và tên gọi',
  'Two, three, four and five: the names, and which ones force a reply.':
    'Hai, ba, bốn và năm: tên gọi, và thế nào buộc đối thủ phải đáp.',
  'Strong players think in shapes. Learn the names and you will read the board much faster. In the pictures below, the dots and letters show the squares that matter.':
    'Người giỏi nghĩ theo thế. Học tên các thế, bạn sẽ đọc bàn cờ nhanh hơn nhiều. Trong các hình dưới đây, các chấm và chữ cái chỉ những ô quan trọng.',
  Two: 'Hai',
  'A two: two stones side by side with room around them. It is not a threat yet, but it is how every attack starts.':
    'Thế hai: hai quân đứng cạnh nhau, xung quanh còn chỗ. Chưa phải là đe dọa, nhưng mọi đợt tấn công đều bắt đầu từ đây.',
  Three: 'Ba',
  'Three stones in a line are where it gets serious. There are three kinds.':
    'Ba quân thẳng hàng là lúc bắt đầu nghiêm trọng. Có ba loại.',
  'An open three: both ends are free. Playing A or B makes an open four. If the opponent ignores it, you win.':
    'Ba hở: cả hai đầu đều trống. Đánh A hoặc B tạo bốn hở. Nếu đối thủ bỏ qua, bạn thắng.',
  'A closed three: one end is blocked. It can only become a closed four, so it forces nothing yet.':
    'Ba bị chặn: một đầu bị chặn. Nó chỉ có thể thành bốn bị chặn, nên chưa buộc đối thủ phải đáp.',
  'A split three: a gap in the middle. Filling the gap at A makes an open four, so it is as strong as an open three.':
    'Ba cách quãng: có một ô trống ở giữa. Lấp ô trống tại A tạo bốn hở, nên nó mạnh như ba hở.',
  Four: 'Bốn',
  'An open four: A and B both finish the five. The opponent can block only one of them, so you win.':
    'Bốn hở: A và B đều hoàn thành năm quân. Đối thủ chỉ chặn được một ô, nên bạn thắng.',
  'A closed four (also called a dead four): only A finishes the five. The opponent must block A at once.':
    'Bốn bị chặn (còn gọi là bốn chết): chỉ A hoàn thành năm quân. Đối thủ phải chặn A ngay.',
  'A split four: four stones with one gap. The gap A is the only winning square, and the opponent must fill it.':
    'Bốn cách quãng: bốn quân có một ô trống. Ô trống A là ô thắng duy nhất, và đối thủ phải lấp nó.',
  Five: 'Năm',
  'Five in a row. The game is over.': 'Năm quân liên tiếp. Ván cờ kết thúc.',
  'Which shapes force a reply?': 'Thế nào buộc đối thủ phải đáp?',
  'A four always forces a reply. The opponent must block it, unless they can win first.':
    'Bốn luôn buộc đối thủ phải đáp. Họ phải chặn, trừ khi họ thắng trước.',
  'An open three forces a reply too. The opponent may block either end, or the gap of a split three.':
    'Ba hở cũng buộc đối thủ phải đáp. Họ có thể chặn một trong hai đầu, hoặc ô trống của ba cách quãng.',
  'A closed three or a two forces nothing. You can ignore them for now.':
    'Ba bị chặn hoặc thế hai không buộc gì cả. Bạn có thể tạm bỏ qua.',
  'A five ends the game.': 'Năm quân kết thúc ván cờ.',
  'An open three needs room on both sides. A three beside the board edge or an obstacle may be only a closed three, because it cannot become an open four.':
    'Ba hở cần chỗ ở cả hai phía. Ba quân nằm cạnh mép bàn hoặc ô bị khóa có thể chỉ là ba bị chặn, vì nó không thể thành bốn hở.',
  'Winning combinations': 'Các đòn phối hợp thắng',
  'Open four, 4-3, 3-3 and 4-4: threats that cannot all be blocked.':
    'Bốn hở, 4-3, 3-3 và 4-4: những đe dọa không thể chặn hết.',
  'One threat can always be blocked. To win, you need a threat the opponent cannot stop. There are four ways to get one.':
    'Một đe dọa lúc nào cũng chặn được. Để thắng, bạn cần một đe dọa mà đối thủ không ngăn nổi. Có bốn cách để có nó.',
  'Open four': 'Bốn hở',
  'An open four has two finishing squares. The opponent can block only one, and you finish the other. You get an open four from an open three that the opponent ignored, or from a split three.':
    'Bốn hở có hai ô hoàn thành. Đối thủ chỉ chặn được một ô, bạn hoàn thành ở ô kia. Bạn có bốn hở từ ba hở mà đối thủ bỏ qua, hoặc từ ba cách quãng.',
  'Two finishing squares, A and B. Whichever one the opponent blocks, you play the other.':
    'Hai ô hoàn thành, A và B. Đối thủ chặn ô nào, bạn đánh ô còn lại.',
  'Make an open four: a four with two squares that finish the five.':
    'Tạo một bốn hở: bốn quân có hai ô hoàn thành năm.',
  'Filling the gap joins your stones into four in a row, and both ends are empty. The computer can block only one end, and you finish the other.':
    'Lấp ô trống nối các quân của bạn thành bốn quân liền nhau, và cả hai đầu đều trống. Máy chỉ chặn được một đầu, và bạn hoàn thành ở đầu kia.',
  'That does not make an open four. Look at your row: two stones, a gap, then two more.':
    'Như vậy chưa tạo bốn hở. Hãy nhìn hàng của bạn: hai quân, một ô trống, rồi hai quân nữa.',
  'That also makes four stones, but with a gap: only one square, the gap, finishes the five. The computer fills it and your four is dead.':
    'Nước này cũng tạo bốn quân, nhưng có ô trống xen giữa: chỉ một ô, chính là ô trống đó, hoàn thành năm quân. Máy lấp nó và bốn của bạn chết.',
  'Four-three (4-3)': 'Bốn-ba (4-3)',
  'One stone makes a four and an open three at the same time. The opponent must block the four. Then you turn the three into an open four.':
    'Một quân tạo ra bốn và ba hở cùng lúc. Đối thủ phải chặn bốn. Sau đó bạn biến ba thành bốn hở.',
  'A makes a four in the row (the left end is blocked, so only one square finishes it) and an open three in the column. The opponent must block the four, and then the column becomes an open four.':
    'A tạo bốn ở hàng ngang (đầu bên trái bị chặn, nên chỉ một ô hoàn thành) và ba hở ở hàng dọc. Đối thủ phải chặn bốn, rồi hàng dọc trở thành bốn hở.',
  'Find the move that makes a four and an open three at the same time (a 4-3).':
    'Tìm nước đi tạo bốn và ba hở cùng lúc (4-3).',
  'The column becomes four, with one open end, so the computer must block below it. Your row now has a split three with open ends. Next you fill its gap for an open four, and nothing can stop it.':
    'Hàng dọc thành bốn, còn một đầu mở, nên máy phải chặn ở phía dưới. Hàng ngang của bạn lúc này có ba cách quãng với hai đầu mở. Tiếp theo bạn lấp ô trống để có bốn hở, và không gì ngăn được.',
  'Look for the square where your column and your row meet.':
    'Hãy tìm ô nơi hàng dọc và hàng ngang của bạn gặp nhau.',
  'That also makes a four, but the computer blocks the gap, which is exactly the square your row needed. You are left with nothing.':
    'Nước này cũng tạo bốn, nhưng máy chặn vào ô trống, đúng ô mà hàng ngang của bạn cần. Bạn không còn gì.',
  'That makes a three in the row but no four. The computer has time to block it.':
    'Nước này tạo ba ở hàng ngang nhưng không có bốn. Máy có thời gian để chặn.',
  'Three-three (3-3)': 'Ba-ba (3-3)',
  'One stone makes two open threes at once. The opponent can block only one. You turn the other into an open four.':
    'Một quân tạo hai ba hở cùng lúc. Đối thủ chỉ chặn được một. Bạn biến cái còn lại thành bốn hở.',
  'In this app a 3-3 or a 4-4 is always allowed. Some tournament rules ban them for the first player, but not here.':
    'Trong ứng dụng này, 3-3 hoặc 4-4 luôn được phép. Một số luật thi đấu cấm chúng với người đi trước, nhưng ở đây thì không.',
  'Two diagonals cross at A. Playing A makes two open threes at once, a V shape. The opponent blocks one, and you make an open four with the other.':
    'Hai đường chéo cắt nhau tại A. Đánh A tạo hai ba hở cùng lúc, hình chữ V. Đối thủ chặn một, và bạn tạo bốn hở với cái kia.',
  'Find the move that makes two open threes at once (a 3-3).':
    'Tìm nước đi tạo hai ba hở cùng lúc (3-3).',
  'This stone adds a third stone to the diagonal and a third stone to the row. Both threes are open. The computer can block only one, and you turn the other into an open four.':
    'Quân này thêm quân thứ ba vào đường chéo và quân thứ ba vào hàng ngang. Cả hai ba đều hở. Máy chỉ chặn được một, và bạn biến cái kia thành bốn hở.',
  'Look for the square that sits on two of your lines at once.':
    'Hãy tìm ô nằm trên hai hàng của bạn cùng lúc.',
  'That makes only one three, on the diagonal. The computer blocks it and you have nothing left.':
    'Nước này chỉ tạo một ba, trên đường chéo. Máy chặn nó và bạn không còn gì.',
  'That makes only one three, in the row. A single threat is easy to block.':
    'Nước này chỉ tạo một ba, ở hàng ngang. Một đe dọa đơn lẻ rất dễ bị chặn.',
  'Four-four (4-4)': 'Bốn-bốn (4-4)',
  'One stone makes two fours at once. Each four has its own finishing square, and the opponent can block only one.':
    'Một quân tạo hai bốn cùng lúc. Mỗi bốn có ô hoàn thành riêng, và đối thủ chỉ chặn được một.',
  'A makes a four in the row and a four in the column. The row needs the square to its left, the column the square above it. The opponent cannot block both.':
    'A tạo bốn ở hàng ngang và bốn ở hàng dọc. Hàng ngang cần ô bên trái, hàng dọc cần ô phía trên. Đối thủ không chặn được cả hai.',
  'Find the move that makes two fours at once (a 4-4).': 'Tìm nước đi tạo hai bốn cùng lúc (4-4).',
  'The row becomes four and needs the square to its right. The column becomes four with a gap and needs the square above. Two different finishing squares: the computer can block only one.':
    'Hàng ngang thành bốn và cần ô bên phải. Hàng dọc thành bốn có ô trống xen giữa và cần ô phía trên. Hai ô hoàn thành khác nhau: máy chỉ chặn được một.',
  'Find the square where your row and your column both become four.':
    'Hãy tìm ô mà ở đó hàng ngang và hàng dọc của bạn cùng thành bốn.',
  'That makes a four in the column only. The computer blocks the square below it, which is also the square your row needed.':
    'Nước này chỉ tạo bốn ở hàng dọc. Máy chặn ô phía dưới, cũng là ô mà hàng ngang của bạn cần.',
  'That makes a four in the row only, with a gap. The computer fills the gap, which also kills your column.':
    'Nước này chỉ tạo bốn ở hàng ngang, có ô trống xen giữa. Máy lấp ô trống, và cũng giết luôn hàng dọc của bạn.',
  'Tempo: keep the initiative': 'Nhịp độ: giữ quyền chủ động',
  'The player who makes threats while the opponent only answers has the initiative. In Japanese this is called sente. Every four forces a reply, and so does every open three. After the reply it is your move again, so you keep the initiative.':
    'Người liên tục tạo đe dọa trong khi đối thủ chỉ biết đáp có quyền chủ động. Tiếng Nhật gọi là sente. Mỗi bốn đều buộc đối thủ phải đáp, ba hở cũng vậy. Sau khi đối thủ đáp, lại đến lượt bạn, nên bạn giữ được quyền chủ động.',
  'Attack: make threats that the opponent must answer.':
    'Tấn công: tạo những đe dọa mà đối thủ phải đáp.',
  'Do not waste your fours. A four that is blocked is gone. Spend it when it finishes the game or builds a second line.':
    'Đừng lãng phí các bốn. Một bốn đã bị chặn là mất. Hãy dùng nó khi nó kết thúc ván cờ hoặc tạo thêm một hàng thứ hai.',
  'Defend: answer a threat with a move that also builds your own line, if you can.':
    'Phòng thủ: nếu có thể, hãy đáp lại đe dọa bằng một nước cũng xây hàng của chính bạn.',
  'Before you make a threat, ask yourself: after the reply, do I have another threat? If yes, keep going. If not, you may be handing the move to your opponent.':
    'Trước khi tạo một đe dọa, hãy tự hỏi: sau khi đối thủ đáp, mình còn đe dọa nào khác không? Nếu có, hãy tiếp tục. Nếu không, bạn có thể đang nhường nước cho đối thủ.',
  Defence: 'Phòng thủ',
  'Block fours, handle open threes, counter-attack, and do not block too early.':
    'Chặn bốn, xử lý ba hở, phản công, và đừng chặn quá sớm.',
  'Defence is half of Caro. A good defender does not just stop threats: they choose the block that helps them.':
    'Phòng thủ là một nửa của caro. Người phòng thủ giỏi không chỉ chặn đe dọa: họ chọn nước chặn có lợi cho mình.',
  'Block a four at once': 'Chặn bốn ngay lập tức',
  'If the opponent has a four, you must stop the finishing square this move, unless you can win first. There is no second chance. Look carefully: a split four hides its finishing square in the middle of the row.':
    'Nếu đối thủ có bốn, bạn phải chặn ô hoàn thành ngay nước này, trừ khi bạn thắng trước. Không có cơ hội thứ hai. Hãy nhìn kỹ: bốn cách quãng giấu ô hoàn thành ở giữa hàng.',
  'The hollow stones have a closed four. A is the only square that finishes it, so A is where you block.':
    'Các quân rỗng có một bốn bị chặn. A là ô duy nhất hoàn thành nó, nên A là nơi bạn chặn.',
  'The computer has four hollow stones on a diagonal, with a gap. Stop the five.':
    'Máy có bốn quân rỗng trên một đường chéo, với một ô trống xen giữa. Hãy ngăn năm quân.',
  'The diagonal has four stones and one gap. The gap is the only square that makes five, so filling it is the only way to stop it.':
    'Đường chéo có bốn quân và một ô trống. Ô trống là ô duy nhất tạo năm quân, nên lấp nó là cách duy nhất để ngăn.',
  'The computer will make five next move. Find the square that completes its five.':
    'Nước sau máy sẽ tạo năm quân. Hãy tìm ô hoàn thành năm quân của máy.',
  'That blocks one end, but the computer still fills the gap and makes five.':
    'Nước này chặn một đầu, nhưng máy vẫn lấp ô trống và tạo năm quân.',
  'You have a four, and the computer has an open three. What do you play?':
    'Bạn có bốn, còn máy có ba hở. Bạn đánh nước nào?',
  'You have a four, so you can make five right now. A win beats every defence. Always check for your own five before you block.':
    'Bạn có bốn, nên có thể tạo năm quân ngay bây giờ. Thắng được thì hơn mọi cách phòng thủ. Luôn kiểm tra năm quân của chính mình trước khi chặn.',
  'Look at your own row of four stones. Is there a square that makes five?':
    'Hãy nhìn hàng bốn quân của bạn. Có ô nào tạo năm quân không?',
  'Blocking the three is a good habit, but here you can win at once. Always look for your own five first.':
    'Chặn ba là một thói quen tốt, nhưng ở đây bạn có thể thắng ngay. Luôn tìm năm quân của chính mình trước.',
  'Facing an open three': 'Đối mặt với ba hở',
  'An open three must be answered now, or the opponent makes an open four. You can block either end. For a split three you can also fill the gap.':
    'Phải đáp ba hở ngay, nếu không đối thủ sẽ có bốn hở. Bạn có thể chặn một trong hai đầu. Với ba cách quãng, bạn còn có thể lấp ô trống.',
  'Blocking at A or at B both stop the open four. Which one? The one that also hurts the opponent, or helps you.':
    'Chặn tại A hay tại B đều ngăn được bốn hở. Chọn bên nào? Bên vừa gây khó cho đối thủ, hoặc giúp ích cho bạn.',
  'Look at the opponent’s other stones. If one end of the three is also on another of their lines, block that end. You stop two lines with one stone.':
    'Hãy nhìn các quân khác của đối thủ. Nếu một đầu của ba cũng nằm trên một hàng khác của họ, hãy chặn đầu đó. Bạn chặn được hai hàng bằng một quân.',
  'The computer has an open three in the row and two stones in the column. Where do you block?':
    'Máy có ba hở ở hàng ngang và hai quân ở hàng dọc. Bạn chặn ở đâu?',
  'Both ends of the three stop it, but the right end is also where the column would join in. By taking it you stop the three and break the second line at the same time.':
    'Chặn đầu nào của ba cũng ngăn được nó, nhưng đầu bên phải cũng là nơi hàng dọc sẽ nhập vào. Chiếm nó, bạn vừa ngăn ba vừa phá hàng thứ hai cùng lúc.',
  'The computer keeps a winning move after that. Find the end of the row that is also on its second line.':
    'Sau nước đó máy vẫn còn nước thắng. Hãy tìm đầu của hàng ngang cũng nằm trên hàng thứ hai của máy.',
  'That stops one end, but the computer plays the other end. It makes a four and a three together (a 4-3) and wins.':
    'Nước này chặn một đầu, nhưng máy đánh đầu kia. Nó tạo bốn và ba cùng lúc (4-3) và thắng.',
  'That is too far. The computer plays the key square and makes a four and a three together (a 4-3).':
    'Nước này quá xa. Máy đánh vào ô then chốt và tạo bốn và ba cùng lúc (4-3).',
  'That stops the column, but the row is still an open three. The computer makes an open four.':
    'Nước này chặn hàng dọc, nhưng hàng ngang vẫn là ba hở. Máy tạo bốn hở.',
  'Counter-attack': 'Phản công',
  'Blocking is not the only answer. A four forces the opponent to reply, so if your fours lead to a win, play them. But check carefully. A counter-attack works only if you win before the opponent’s threat becomes a four of their own that you have to answer.':
    'Chặn không phải là cách đáp duy nhất. Bốn buộc đối thủ phải đáp, nên nếu các bốn của bạn dẫn đến thắng, hãy đánh chúng. Nhưng phải kiểm tra kỹ. Phản công chỉ hiệu quả nếu bạn thắng trước khi đe dọa của đối thủ trở thành bốn mà bạn phải đáp.',
  'The computer has an open three, but you have a faster win. Find the move.':
    'Máy có ba hở, nhưng bạn có đường thắng nhanh hơn. Hãy tìm nước đi.',
  'Your row becomes a four, so the computer must block it. That block does not stop your column, which is now an open three. You make an open four next, and you win before the computer’s three matters.':
    'Hàng ngang của bạn thành bốn, nên máy phải chặn. Nước chặn đó không ngăn được hàng dọc của bạn, lúc này đã là ba hở. Bạn tạo bốn hở ngay sau đó, và thắng trước khi ba của máy kịp có tác dụng.',
  'Look for the square that makes a four in the row and a three in the column.':
    'Hãy tìm ô tạo bốn ở hàng ngang và ba ở hàng dọc.',
  'Blocking is slow here. You have a faster win: a four first, then an open four.':
    'Chặn ở đây là chậm. Bạn có đường thắng nhanh hơn: bốn trước, rồi bốn hở.',
  'Do not block too early': 'Đừng chặn quá sớm',
  'You do not need to block a two, or a closed three. If you block every small shape, the opponent keeps the initiative and builds somewhere else. Block when a shape becomes a real threat: an open three or a four.':
    'Bạn không cần chặn thế hai hay ba bị chặn. Nếu chặn mọi thế nhỏ, đối thủ giữ quyền chủ động và xây dựng chỗ khác. Hãy chặn khi một thế trở thành đe dọa thật: ba hở hoặc bốn.',
  'This closed three is not urgent. The hollow stones can make only a closed four, and you can block that when it comes.':
    'Ba bị chặn này chưa khẩn cấp. Các quân rỗng chỉ có thể tạo bốn bị chặn, và bạn chặn nó khi nó xuất hiện.',
  'A four: block it now.': 'Bốn: chặn ngay.',
  'An open three: block it now, with the best end.': 'Ba hở: chặn ngay, ở đầu tốt nhất.',
  'A closed three or a two: keep building your own attack.':
    'Ba bị chặn hoặc thế hai: cứ tiếp tục xây đợt tấn công của bạn.',
  'Before you block, check whether you have a four or an open four of your own. Attack first, defend second.':
    'Trước khi chặn, hãy kiểm tra xem bạn có bốn hoặc bốn hở của riêng mình không. Tấn công trước, phòng thủ sau.',
  'Opening principles': 'Nguyên tắc khai cuộc',
  'The first moves: centre, connection, shape and the initiative.':
    'Những nước đầu: trung tâm, kết nối, thế cờ và quyền chủ động.',
  'The first few moves decide who gets the initiative. You do not need to memorise openings. A few simple habits will take you far.':
    'Vài nước đầu quyết định ai giành quyền chủ động. Bạn không cần thuộc lòng các khai cuộc. Vài thói quen đơn giản sẽ đưa bạn đi xa.',
  'Play near the centre. A stone in the centre touches many lines. A stone near the edge has little room.':
    'Đánh gần trung tâm. Một quân ở trung tâm chạm nhiều hàng. Một quân gần mép có ít chỗ.',
  "Stay connected. Play close to your own stones and to your opponent's stones. A stone far away does nothing.":
    'Giữ kết nối. Đánh gần quân của mình và quân của đối thủ. Một quân ở xa chẳng làm được gì.',
  'Build shape, not solid rows. Two stones with one gap, or on a diagonal, are flexible and hard to block. A solid row of three is easy to block.':
    'Xây thế, đừng xây hàng đặc. Hai quân cách một ô hoặc nằm chéo thì linh hoạt và khó chặn. Một hàng ba liền nhau thì dễ bị chặn.',
  'Make every stone work in more than one direction. A stone that is part of two lines is worth twice as much.':
    'Cho mỗi quân làm việc theo nhiều hướng. Một quân nằm trên hai hàng có giá trị gấp đôi.',
  'Take the initiative early. Make small threats that the opponent must answer, so that you decide where the game is played.':
    'Giành quyền chủ động sớm. Tạo những đe dọa nhỏ mà đối thủ phải đáp, để bạn quyết định ván cờ diễn ra ở đâu.',
  'The first stones': 'Những quân đầu tiên',
  'The first player usually starts in the centre of the board.':
    'Người đi trước thường bắt đầu ở giữa bàn cờ.',
  'The first stone goes in the centre. From here it can reach every direction.':
    'Quân đầu tiên đặt ở giữa. Từ đây nó với tới mọi hướng.',
  "The second player's first stone touches the centre stone. If it touches from the side (up, down, left or right), the opening is called direct. If it touches at a corner, along a diagonal, it is called indirect.":
    'Quân đầu tiên của người đi sau chạm vào quân ở giữa. Nếu chạm từ cạnh (trên, dưới, trái hoặc phải), khai cuộc gọi là trực tiếp. Nếu chạm ở góc, theo đường chéo, gọi là gián tiếp.',
  'A direct opening: the hollow stone touches the filled stone from the side.':
    'Khai cuộc trực tiếp: quân rỗng chạm quân đặc từ cạnh.',
  'An indirect opening: the hollow stone touches the filled stone at a corner.':
    'Khai cuộc gián tiếp: quân rỗng chạm quân đặc ở góc.',
  'Strong players give names to every third move of both kinds. You do not need them. Remember the ideas: stay close, stay near the centre, and look for lines that cross.':
    'Người giỏi đặt tên cho từng nước thứ ba của cả hai loại. Bạn không cần chúng. Hãy nhớ các ý chính: ở gần, ở gần trung tâm, và tìm những hàng cắt nhau.',
  Shape: 'Thế cờ',
  'Three stones, each pair on a line with one gap (the dots). Every gap is a future three, and the stones work together in three directions.':
    'Ba quân, từng cặp nằm trên một hàng với một ô trống (các chấm). Mỗi ô trống là một ba tương lai, và các quân phối hợp theo ba hướng.',
  'As the second player, stay close and wait. The first player will often make a loose move, and then you can take the initiative.':
    'Khi đi sau, hãy ở gần và chờ đợi. Người đi trước thường đánh một nước lỏng lẻo, và khi đó bạn giành quyền chủ động.',
  'Obstacles and the blocked rule': 'Ô bị khóa và luật chặn hai đầu',
  'Check both ends, use walls, and avoid dead lines.':
    'Kiểm tra hai đầu, dùng tường chắn, và tránh các hàng chết.',
  'In the blocked-ends rule, stones of the opponent act as walls, and so do obstacle squares. A row that wins in one place can be worthless in another. This chapter is about reading the walls.':
    'Theo luật chặn hai đầu, quân của đối thủ hoạt động như tường, các ô bị khóa cũng vậy. Một hàng thắng ở chỗ này có thể vô giá trị ở chỗ khác. Chương này nói về việc đọc các bức tường.',
  'Check both ends before you celebrate': 'Kiểm tra hai đầu trước khi mừng',
  'Every time you make five, look at the two squares at its ends. If both are walls, the five does not win and the game goes on. The same is true for your opponent.':
    'Mỗi lần tạo năm quân, hãy nhìn hai ô ở hai đầu. Nếu cả hai đều là tường, năm quân không thắng và ván cờ tiếp tục. Đối thủ của bạn cũng vậy.',
  'Blocked-ends rule. Find the five that really wins.':
    'Luật chặn hai đầu. Tìm hàng năm thật sự thắng.',
  'The five in the column has a free square above it. Only one end is blocked, so the five wins.':
    'Hàng năm ở cột có một ô trống phía trên. Chỉ một đầu bị chặn, nên hàng năm thắng.',
  'That does not make five. Count the stones in the column.':
    'Nước này không tạo năm quân. Hãy đếm các quân ở hàng dọc.',
  'That makes five in the row, but both ends are blocked: an opponent stone on the left and an obstacle on the right. It does not win.':
    'Nước này tạo năm quân ở hàng ngang, nhưng cả hai đầu đều bị chặn: quân đối thủ bên trái và ô bị khóa bên phải. Nó không thắng.',
  'Some fours are harmless': 'Có những bốn vô hại',
  'A four is only a threat if its finishing square makes a five that wins. If both ends of that five would be walls, the four threatens nothing. You do not have to block it.':
    'Bốn chỉ là đe dọa nếu ô hoàn thành của nó tạo ra năm quân thắng. Nếu cả hai đầu của năm quân đó đều là tường, bốn không đe dọa gì. Bạn không phải chặn nó.',
  'The hollow stones have four in a row, but the left end is an obstacle and the right end is a filled stone. If they play the dot, the five is blocked at both ends and does not win.':
    'Các quân rỗng có bốn quân liền nhau, nhưng đầu bên trái là ô bị khóa và đầu bên phải là quân đặc. Nếu chúng đánh vào chấm, năm quân bị chặn cả hai đầu và không thắng.',
  'Blocked-ends rule. The computer has four in a row. Do you need to block it? Make an open four.':
    'Luật chặn hai đầu. Máy có bốn quân liền nhau. Bạn có cần chặn không? Hãy tạo một bốn hở.',
  'The four of the computer has an obstacle on one end and your stone on the other. Even if it fills the gap, that five is blocked at both ends and does not win. So you ignore it and make an open four.':
    'Bốn của máy có ô bị khóa ở một đầu và quân của bạn ở đầu kia. Dù máy lấp ô trống, hàng năm đó bị chặn cả hai đầu và không thắng. Vì vậy bạn bỏ qua nó và tạo một bốn hở.',
  'Do not block. Look for the move that gives you two ways to finish a five.':
    'Đừng chặn. Hãy tìm nước cho bạn hai cách hoàn thành năm quân.',
  'That blocks a five that could never win. You wasted your move.':
    'Nước này chặn một hàng năm không bao giờ thắng được. Bạn đã phí một nước.',
  'That only makes a closed four. The computer fills the gap and your four is dead.':
    'Nước này chỉ tạo bốn bị chặn. Máy lấp ô trống và bốn của bạn chết.',
  'Use obstacles as walls': 'Dùng ô bị khóa làm tường',
  'Build towards open space. A row that points at an obstacle loses one end.':
    'Hãy xây về phía có nhiều chỗ trống. Một hàng hướng thẳng vào ô bị khóa mất một đầu.',
  'Push your opponent towards obstacles. Their row that runs into an obstacle needs its other end free. Block it there and the row is dead.':
    'Đẩy đối thủ về phía các ô bị khóa. Hàng của họ đi vào ô bị khóa cần đầu kia còn trống. Chặn ở đó thì hàng chết.',
  'Count the free squares in a line. You need at least five in a row, and at least one free end when you finish.':
    'Đếm các ô trống trên một đường. Bạn cần ít nhất năm ô liền nhau, và ít nhất một đầu trống khi hoàn thành.',
  'An obstacle at the end of a three. It is only a closed three: it can become a closed four, but it never becomes an open four.':
    'Một ô bị khóa ở đầu của ba. Đó chỉ là ba bị chặn: nó có thể thành bốn bị chặn, nhưng không bao giờ thành bốn hở.',
  'Avoid lines whose both ends are dead': 'Tránh những hàng mà cả hai đầu đều chết',
  'Before you spend stones on a row, check that you can still finish it. If the room between two walls is smaller than five squares, the row can never win.':
    'Trước khi dồn quân vào một hàng, hãy kiểm tra xem bạn còn hoàn thành được nó không. Nếu chỗ giữa hai bức tường nhỏ hơn năm ô, hàng đó không bao giờ thắng.',
  'Only four free squares between two obstacles. No five fits here, however many stones you add. Do not waste moves on this line.':
    'Chỉ có bốn ô trống giữa hai ô bị khóa. Không có năm quân nào vừa ở đây, dù bạn thêm bao nhiêu quân. Đừng phí nước đi vào đường này.',
  'Blocked-ends rule. Make an open four that really wins.':
    'Luật chặn hai đầu. Hãy tạo một bốn hở thật sự thắng.',
  'The column becomes four in a row, and both ends are free. Whichever end the computer blocks, you finish the other.':
    'Hàng dọc thành bốn quân liền nhau, và cả hai đầu đều trống. Máy chặn đầu nào, bạn hoàn thành đầu kia.',
  'Look for a line where the five can still be finished with a free end.':
    'Hãy tìm một hàng mà năm quân vẫn hoàn thành được với một đầu trống.',
  'That makes four in the row, but the five would be blocked at both ends, by an obstacle and by a hollow stone. It threatens nothing.':
    'Nước này tạo bốn ở hàng ngang, nhưng năm quân sẽ bị chặn cả hai đầu, bởi một ô bị khóa và một quân rỗng. Nó không đe dọa gì.',
  'Walls change what counts as a threat. Before you attack or defend, ask: if this five is made, would it win?':
    'Tường làm thay đổi thế nào là một đe dọa. Trước khi tấn công hoặc phòng thủ, hãy hỏi: nếu hàng năm này được tạo ra, nó có thắng không?',
  'How to beat the app': 'Cách đánh bại ứng dụng',
  'Honest tips about how the computer plays, and how to find its weak spots.':
    'Những lời khuyên thẳng thắn về cách máy chơi, và cách tìm điểm yếu của nó.',
  'No trick wins every game. But once you know how the computer thinks, you can play to its weak spots. These tips come from how the engine is built, not from guesses.':
    'Không có mẹo nào thắng mọi ván. Nhưng khi biết máy suy nghĩ thế nào, bạn có thể đánh vào điểm yếu của nó. Những lời khuyên này dựa trên cách động cơ được xây dựng, không phải đoán mò.',
  'How the computer plays': 'Máy chơi như thế nào',
  'At every move it first asks two questions. Can I make five? Must I block a four? Only then does it search.':
    'Ở mỗi nước, trước tiên nó tự hỏi hai câu. Mình có tạo được năm quân không? Mình có phải chặn một bốn không? Chỉ sau đó nó mới tìm kiếm.',
  'It looks several moves ahead. Easy looks about two moves ahead, Medium about six and Hard up to about twelve.':
    'Nó nhìn trước nhiều nước. Mức Dễ nhìn trước khoảng hai nước, mức Trung bình khoảng sáu và mức Khó tới khoảng mười hai.',
  'Medium and Hard also look for a win made only of fours, a chain of fours that ends in a five or in a double threat.':
    'Trung bình và Khó còn tìm đường thắng chỉ gồm các bốn, một chuỗi bốn kết thúc bằng năm quân hoặc một đe dọa kép.',
  'Hard thinks for up to about a second per move.':
    'Mức Khó suy nghĩ tối đa khoảng một giây mỗi nước.',
  'Its strong points': 'Điểm mạnh của máy',
  'It never forgets a four. Even Easy blocks your four and completes its own five. Do not hope for a missed four.':
    'Nó không bao giờ quên một bốn. Ngay cả mức Dễ cũng chặn bốn của bạn và hoàn thành năm quân của mình. Đừng hy vọng nó bỏ sót một bốn.',
  'It is very good at forced sequences. A loose attack made of fours that do not lead to a win just burns your fours, and it will answer each one.':
    'Nó rất giỏi các chuỗi ép buộc. Một đợt tấn công lỏng lẻo gồm các bốn không dẫn đến thắng chỉ đốt hết các bốn của bạn, và nó sẽ đáp từng cái một.',
  'It is strong at defending a single threat. One open three on its own will be blocked.':
    'Nó phòng thủ tốt trước một đe dọa đơn lẻ. Một ba hở đứng một mình sẽ bị chặn.',
  'Its weak points': 'Điểm yếu của máy',
  'Easy sometimes plays a weaker move on purpose. On Easy you may also use undo, so you can try an idea and take it back.':
    'Mức Dễ đôi khi cố ý đánh một nước yếu hơn. Ở mức Dễ bạn cũng có thể hoàn tác, nên có thể thử một ý tưởng rồi rút lại.',
  'The engine searches forcing moves much deeper than quiet moves. A plan that needs several quiet moves to set up may be beyond what it sees.':
    'Động cơ tìm các nước ép buộc sâu hơn nhiều so với các nước yên tĩnh. Một kế hoạch cần vài nước yên tĩnh để chuẩn bị có thể nằm ngoài tầm nhìn của nó.',
  'A plan that works': 'Một kế hoạch hiệu quả',
  'Build with quiet stones. Put stones so that two of your lines cross at an empty square. Make your first double threat from stones that look harmless.':
    'Xây bằng những quân yên tĩnh. Đặt quân sao cho hai hàng của bạn cắt nhau tại một ô trống. Tạo đe dọa kép đầu tiên từ những quân trông vô hại.',
  'Then make the double threat: a 4-3, a 3-3 or a 4-4. A single threat gets blocked. A double threat cannot.':
    'Rồi tạo đe dọa kép: 4-3, 3-3 hoặc 4-4. Một đe dọa đơn lẻ sẽ bị chặn. Đe dọa kép thì không.',
  'Hold the initiative. Make the computer answer you, and do not waste your fours.':
    'Giữ quyền chủ động. Buộc máy phải đáp bạn, và đừng lãng phí các bốn.',
  'Check its replies. After each move, look at what its new stone does. It often blocks and builds at the same time.':
    'Kiểm tra nước đáp của máy. Sau mỗi nước, hãy xem quân mới của nó làm gì. Nó thường vừa chặn vừa xây cùng lúc.',
  'Check threats in the same order every move: its fours, its open threes, and only then your own plans.':
    'Kiểm tra các đe dọa theo cùng một thứ tự ở mọi nước: các bốn của máy, các ba hở của máy, rồi mới đến kế hoạch của bạn.',
  'How to practise': 'Cách luyện tập',
  'Start on Easy and use undo to learn. When you win often, move up to Medium, then Hard.':
    'Bắt đầu ở mức Dễ và dùng hoàn tác để học. Khi bạn thắng thường xuyên, hãy lên Trung bình, rồi Khó.',
  'Play first against Hard: moving first is an advantage. Later try playing second.':
    'Hãy đi trước khi đấu với mức Khó: đi trước là một lợi thế. Sau đó hãy thử đi sau.',
  'Take your time. The computer never gets tired, but you do. Read every move.':
    'Cứ từ từ. Máy không bao giờ mệt, còn bạn thì có. Hãy đọc kỹ từng nước.',
  'Lost a game? Look for the move where it first got a four-three or a three-three. Ask what you could have blocked a move earlier.':
    'Thua một ván? Hãy tìm nước mà máy lần đầu có bốn-ba hoặc ba-ba. Hỏi xem bạn có thể chặn gì sớm hơn một nước.',

  // Screen, diagram descriptions and exercise feedback
  'Four quiet stones that look harmless: a pair in a row and a pair in a column. Playing A makes two open threes at once.':
    'Bốn quân yên tĩnh trông vô hại: một cặp ở hàng ngang và một cặp ở hàng dọc. Đánh A tạo hai ba hở cùng lúc.',
  'top side': 'phía trên',
  'bottom side': 'phía dưới',
  'left side': 'phía trái',
  'right side': 'phía phải',
  'Board section, {rows} rows by {cols} columns.': 'Một phần bàn cờ, {rows} hàng, {cols} cột.',
  'No stones.': 'Chưa có quân nào.',
  'First player (filled stones): {cells}.': 'Người đi trước (quân đặc): {cells}.',
  'Second player (ring stones): {cells}.': 'Người đi sau (quân rỗng): {cells}.',
  'Blocked squares: {cells}.': 'Ô bị khóa: {cells}.',
  'Board edge: {sides}.': 'Mép bàn cờ: {sides}.',
  'Suggested move: {cells}.': 'Nước đi gợi ý: {cells}.',
  'Winning line: {cells}.': 'Hàng thắng: {cells}.',
  'End cells: {cells}.': 'Ô ở đầu hàng: {cells}.',
  'Look here: {cells}.': 'Hãy nhìn: {cells}.',
  'Wrong move: {cells}.': 'Nước sai: {cells}.',
  'first-player stone': 'quân đặc (người đi trước)',
  'second-player stone': 'quân rỗng (người đi sau)',
  'empty square': 'ô trống',
  'Row {row}, column {col}: {what}': 'Hàng {row}, cột {col}: {what}',
  'Exercise {n}': 'Bài tập {n}',
  Solved: 'Đã giải',
  'You play the filled stones. Tap a square.': 'Bạn đánh quân đặc. Chạm vào một ô.',
  'Exercise board: {prompt}': 'Bàn cờ bài tập: {prompt}',
  'Correct!': 'Chính xác!',
  'Not quite.': 'Chưa đúng.',
  'Answer shown.': 'Đáp án đây.',
  'Try again': 'Thử lại',
  'Show the answer': 'Xem đáp án',
  Tip: 'Mẹo',
  'Chapter {n} of {total}': 'Chương {n} trên {total}',
  '{n} min read': 'Đọc {n} phút',
  Chapters: 'Các chương',
  'Next: {title}': 'Tiếp: {title}',
  'Previous: {title}': 'Trước: {title}',
  'All chapters': 'Tất cả các chương',
  'Caro handbook': 'Cẩm nang Caro',
  'Short chapters with diagrams and exercises. Each one takes two to five minutes.':
    'Các chương ngắn có sơ đồ và bài tập. Mỗi chương mất từ hai đến năm phút.',
  'Continue where you left off': 'Tiếp tục chỗ đang đọc',
  'Exercises solved: {done} of {total}': 'Bài tập đã giải: {done} trên {total}',
  'Exercises {done} of {total}': 'Bài tập {done}/{total}',
  'How to read the diagrams': 'Cách đọc sơ đồ',
};
