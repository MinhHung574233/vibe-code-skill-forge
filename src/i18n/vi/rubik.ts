/** Vietnamese strings: rubik. Key = the exact English source string. */
export const rubik: Record<string, string> = {
  // ---- Navigation and shared labels ----
  Practice: 'Luyện tập',
  Rubik: 'Rubik',
  'Rubik’s Cube': 'Rubik’s Cube',
  More: 'Xem thêm',
  Delete: 'Xóa',
  Best: 'Tốt nhất',
  Solves: 'Lần giải',
  Ao5: 'Ao5',
  Ao12: 'Ao12',

  // ---- Scramble and timer ----
  Scramble: 'Xáo trộn',
  'Scramble moves': 'Các bước xáo trộn',
  'The cube after the scramble {scramble}': 'Khối rubik sau khi xáo trộn {scramble}',
  'New scramble': 'Xáo trộn mới',
  'Hide cube': 'Ẩn khối',
  'Show cube': 'Hiện khối',
  Inspection: 'Quan sát',
  'Cube timer {time}. {hint}.': 'Đồng hồ bấm giờ {time}. {hint}.',
  'Solve time': 'Thời gian giải',
  'Touch to start the 15 second inspection': 'Chạm để bắt đầu 15 giây quan sát',
  'Touch and hold, then let go to start': 'Chạm và giữ, rồi thả ra để bắt đầu',
  'Inspecting. Touch and hold, then let go to start':
    'Đang quan sát. Chạm và giữ, rồi thả ra để bắt đầu',
  'Keep holding…': 'Tiếp tục giữ…',
  'Let go to start': 'Thả ra để bắt đầu',
  'Touch to stop': 'Chạm để dừng',

  // ---- Last solve, stats, session ----
  'Last solve': 'Lần giải gần nhất',
  'Last solve result': 'Kết quả lần giải gần nhất',
  '{n} this session': '{n} trong buổi này',
  'Best {time}': 'Tốt nhất {time}',
  'Last {n} solves': '{n} lần giải gần nhất',
  'Solve {n}: {result}': 'Lần giải {n}: {result}',
  'Your last {n} solve times in seconds; lower is faster.':
    'Thời gian {n} lần giải gần nhất, tính bằng giây; càng thấp càng nhanh.',
  'Finish session': 'Kết thúc buổi luyện tập',
  'Finishing saves this session for your streak, goals and XP.':
    'Kết thúc buổi luyện tập sẽ lưu buổi này vào chuỗi ngày, mục tiêu và XP của bạn.',
  'Could not save that solve. Your device may be out of storage.':
    'Không thể lưu lần giải này. Có thể thiết bị của bạn đã hết dung lượng.',
  'Delete this solve?': 'Xóa lần giải này?',
  'It will be removed from your times and averages.':
    'Lần giải này sẽ bị xóa khỏi thời gian và các mức trung bình của bạn.',

  // ---- Solve history ----
  'Solve history': 'Lịch sử giải',
  'Every solve, with penalties': 'Mọi lần giải, kèm hình phạt thời gian',
  'No solves yet': 'Chưa có lần giải nào',
  'Time your first solve and it will show up here.':
    'Hãy bấm giờ lần giải đầu tiên, nó sẽ hiện ở đây.',
  'Newest first. +2 and DNF apply to averages as in competition rules.':
    'Mới nhất trước. +2 và DNF được tính vào mức trung bình như trong luật thi đấu.',
  'Delete solve {result} from {date}': 'Xóa lần giải {result} ngày {date}',

  // ---- Algorithm trainer ----
  Algorithms: 'Công thức',
  '2-look OLL and all 21 PLL, with pictures': '2-look OLL và đủ 21 PLL, có hình minh họa',
  'Algorithm set': 'Bộ công thức',
  PLL: 'PLL',
  '2-look OLL': '2-look OLL',
  Learning: 'Đang học',
  Learned: 'Đã thuộc',
  'Case picture for {name}': 'Hình minh họa trường hợp {name}',
  'Moves for {name}': 'Các bước của {name}',
  '{learned} of {total} learned. Notation is for a yellow-top cube with green in front. The pictures show the case each algorithm solves.':
    'Đã thuộc {learned}/{total}. Ký hiệu dành cho khối rubik có mặt trên màu vàng và mặt trước màu xanh lá. Các hình minh họa cho thấy trường hợp mà mỗi công thức giải quyết.',

  // ---- Algorithm names (set and case names are proper names; descriptions are translated) ----
  'Line (two edges, opposite)': 'Đường thẳng (hai cạnh đối nhau)',
  'L shape (two edges, adjacent)': 'Hình chữ L (hai cạnh kề nhau)',
  'Dot (no edges)': 'Chấm (không có cạnh nào)',
  Sune: 'Sune',
  'Anti-Sune': 'Anti-Sune',
  'H (all four corners twisted)': 'H (cả bốn góc bị xoay)',
  Pi: 'Pi',
  'U (headlights)': 'U (đèn pha)',
  T: 'T',
  L: 'L',
  'Ua perm': 'Ua perm',
  'Ub perm': 'Ub perm',
  'H perm': 'H perm',
  'Z perm': 'Z perm',
  'Aa perm': 'Aa perm',
  'Ab perm': 'Ab perm',
  'E perm': 'E perm',
  'T perm': 'T perm',
  'Ja perm': 'Ja perm',
  'Jb perm': 'Jb perm',
  'F perm': 'F perm',
  'Y perm': 'Y perm',
  'Ra perm': 'Ra perm',
  'Rb perm': 'Rb perm',
  'V perm': 'V perm',
  'Na perm': 'Na perm',
  'Nb perm': 'Nb perm',
  'Ga perm': 'Ga perm',
  'Gb perm': 'Gb perm',
  'Gc perm': 'Gc perm',
  'Gd perm': 'Gd perm',

  // ---- How to recognise each case ----
  'Two yellow edges form a horizontal line. Hold the line left-to-right.':
    'Hai cạnh vàng tạo thành một đường ngang. Xoay khối để đường nằm từ trái sang phải.',
  'Two yellow edges form an L. Hold the L at the back-left.':
    'Hai cạnh vàng tạo thành hình chữ L. Đặt chữ L ở góc sau bên trái.',
  'Only the centre is yellow. Do the line algorithm and the L algorithm back to back.':
    'Chỉ có tâm màu vàng. Thực hiện công thức đường thẳng rồi ngay sau đó là công thức chữ L.',
  'One corner twisted up; a yellow sticker faces the front on the lower left.':
    'Một góc xoay lên trên; có một miếng dán vàng hướng ra mặt trước ở phía dưới bên trái.',
  'The mirror of Sune: one corner up, a yellow sticker faces the front on the right.':
    'Đối xứng của Sune: một góc hướng lên, có một miếng dán vàng hướng ra mặt trước ở bên phải.',
  'No yellow on top corners; yellow stickers face the front and back as pairs.':
    'Không có màu vàng ở các góc trên; các miếng dán vàng hướng ra mặt trước và mặt sau theo từng cặp.',
  'No yellow on top corners; yellow on the left and right sides forms a pair, plus a single.':
    'Không có màu vàng ở các góc trên; màu vàng ở mặt trái và mặt phải tạo thành một cặp, cộng thêm một miếng đơn.',
  'Two yellow headlights on the front, no yellow on the back corners.':
    'Hai đèn pha vàng ở mặt trước, không có màu vàng ở các góc sau.',
  'Two yellow corners on the right side with a yellow sticker facing the front.':
    'Hai góc vàng ở bên phải, có một miếng dán vàng hướng ra mặt trước.',
  'Two yellow corners diagonal, a yellow sticker facing the front at the lower right.':
    'Hai góc vàng nằm chéo nhau, có một miếng dán vàng hướng ra mặt trước ở phía dưới bên phải.',
  'Corners solved; three edges cycle, the solved edge is at the back.':
    'Các góc đã đúng; ba cạnh hoán đổi vòng, cạnh đã đúng nằm ở phía sau.',
  'Corners solved; three edges cycle the other way, the solved edge is at the back.':
    'Các góc đã đúng; ba cạnh hoán đổi vòng theo chiều ngược lại, cạnh đã đúng nằm ở phía sau.',
  'Corners solved; the opposite edges are swapped in both pairs.':
    'Các góc đã đúng; các cạnh đối diện được đổi chỗ ở cả hai cặp.',
  'Corners solved; two adjacent edge pairs are swapped.':
    'Các góc đã đúng; hai cặp cạnh kề nhau được đổi chỗ.',
  'Edges fit the sides; three corners cycle. Headlights on the left side.':
    'Các cạnh khớp với các mặt bên; ba góc hoán đổi vòng. Đèn pha ở bên trái.',
  'Edges fit the sides; three corners cycle the other way. Headlights on the left.':
    'Các cạnh khớp với các mặt bên; ba góc hoán đổi vòng theo chiều ngược lại. Đèn pha ở bên trái.',
  'No headlights; all four corners need to swap diagonally.':
    'Không có đèn pha; cả bốn góc cần đổi chỗ theo đường chéo.',
  'Headlights on the left, and a solved block on the right.':
    'Đèn pha ở bên trái, và một khối đã đúng ở bên phải.',
  'Headlights on the front; swap the corners next to them.':
    'Đèn pha ở mặt trước; đổi chỗ các góc nằm cạnh chúng.',
  'Headlights on the back; swap the corners next to them.':
    'Đèn pha ở mặt sau; đổi chỗ các góc nằm cạnh chúng.',
  'Headlights on the right, and the colour on the left matches in the front.':
    'Đèn pha ở bên phải, và màu ở bên trái trùng với màu ở mặt trước.',
  'No headlights; two diagonal corners swap.': 'Không có đèn pha; hai góc chéo nhau đổi chỗ.',
  'Headlights on the left; a three-colour block on the front.':
    'Đèn pha ở bên trái; một khối ba màu ở mặt trước.',
  'Headlights on the right; a block on the left.': 'Đèn pha ở bên phải; một khối ở bên trái.',
  'No headlights; diagonal corners and two edges swap.':
    'Không có đèn pha; hai góc chéo và hai cạnh đổi chỗ.',
  'No headlights; two diagonal pairs swap.': 'Không có đèn pha; hai cặp chéo đổi chỗ.',
  'No headlights; two diagonal pairs swap, the mirror of Na.':
    'Không có đèn pha; hai cặp chéo đổi chỗ, đối xứng của Na.',
  'No headlights, a solved corner pair and a 3-colour bar on the left.':
    'Không có đèn pha, một cặp góc đã đúng và một thanh ba màu ở bên trái.',
  'No headlights, a solved corner pair and a 3-colour bar on the front.':
    'Không có đèn pha, một cặp góc đã đúng và một thanh ba màu ở mặt trước.',
  'No headlights, a solved corner pair and a 3-colour bar on the back.':
    'Không có đèn pha, một cặp góc đã đúng và một thanh ba màu ở mặt sau.',
  'No headlights, a solved corner pair and a 3-colour bar on the right.':
    'Không có đèn pha, một cặp góc đã đúng và một thanh ba màu ở bên phải.',
};
