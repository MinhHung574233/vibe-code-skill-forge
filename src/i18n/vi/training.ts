/** Vietnamese strings: training. Key = the exact English source string. */
export const training: Record<string, string> = {
  // --- Time formatting (core/training/analytics) ---
  '{n} min': '{n} phút',
  '{h} h': '{h} giờ',
  '{h} h {m} min': '{h} giờ {m} phút',

  // --- Recommendations (core/training/recommend) ---
  'Add your first skill': 'Thêm kỹ năng đầu tiên của bạn',
  'Skills let you see progress for what you practise.':
    'Kỹ năng giúp bạn theo dõi tiến độ của những gì bạn luyện tập.',
  'Keep your {n}-day streak': 'Giữ chuỗi {n} ngày của bạn',
  'You have not trained today. A session keeps the streak alive.':
    'Hôm nay bạn chưa luyện tập. Một buổi luyện tập sẽ giữ chuỗi ngày.',
  '{minutes} min to today’s goal': 'Còn {minutes} phút để đạt mục tiêu hôm nay',
  '{name} has not been trained yet.': 'Bạn chưa luyện tập {name}.',
  '{name} is your top-priority skill, trained least recently.':
    '{name} là kỹ năng ưu tiên cao nhất của bạn và đã lâu chưa được luyện tập.',
  '{name}: {left} min left this week': '{name}: còn {left} phút trong tuần này',
  'Weekly goal {goal} min, {done} done.': 'Mục tiêu tuần {goal} phút, đã đạt {done}.',

  // --- Activity types (core/training/config) ---
  'Practice session': 'Buổi luyện tập',
  'Vocabulary session': 'Buổi học từ vựng',
  'Java lesson': 'Bài học Java',
  'Chess puzzle': 'Thế cờ vua',
  'Rubik session': 'Buổi luyện Rubik',
  'Daily challenge': 'Thử thách mỗi ngày',
  Game: 'Ván chơi',
  'Developer Tools lesson': 'Bài học Developer Tools',

  // --- Achievements (core/training/achievements) ---
  'First session': 'Buổi luyện tập đầu tiên',
  'Finish your first training session.': 'Hoàn thành buổi luyện tập đầu tiên của bạn.',
  'Getting serious': 'Bắt đầu nghiêm túc',
  'Finish 10 training sessions.': 'Hoàn thành 10 buổi luyện tập.',
  'First hour': 'Giờ luyện tập đầu tiên',
  'Train for 60 minutes in total.': 'Luyện tập tổng cộng 60 phút.',
  '7-day streak': 'Chuỗi 7 ngày',
  'Train 7 days in a row.': 'Luyện tập 7 ngày liên tiếp.',
  '30-day streak': 'Chuỗi 30 ngày',
  'Train 30 days in a row.': 'Luyện tập 30 ngày liên tiếp.',
  '100 words': '100 từ',
  'Learn your first 100 vocabulary words.': 'Học 100 từ vựng đầu tiên của bạn.',
  'Java path complete': 'Hoàn thành lộ trình Java',
  'Complete your first Java learning path.': 'Hoàn thành lộ trình học Java đầu tiên của bạn.',
  'Personal best': 'Kỷ lục cá nhân',
  'Set a new personal best on the cube.': 'Lập kỷ lục cá nhân mới với khối Rubik.',
  English: 'Tiếng Anh',
  'Java & Spring Boot': 'Java & Spring Boot',
  'Rubik’s Cube': 'Rubik’s Cube',
  'Needs the {module} module': 'Cần mô-đun {module}',

  // --- Skill model (features/skills) ---
  Mind: 'Trí tuệ',
  Language: 'Ngôn ngữ',
  Technical: 'Kỹ thuật',
  Games: 'Trò chơi',
  Custom: 'Tùy chọn',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
  'High priority': 'Ưu tiên cao',
  'Medium priority': 'Ưu tiên trung bình',
  'Low priority': 'Ưu tiên thấp',
  'Give the skill a name.': 'Hãy đặt tên cho kỹ năng.',
  'Keep the name under 60 characters.': 'Hãy giữ tên dưới 60 ký tự.',
  'Keep the description under 200 characters.': 'Hãy giữ mô tả dưới 200 ký tự.',
  'A weekly goal must be at least 10 minutes.': 'Mục tiêu tuần phải ít nhất 10 phút.',
  'That weekly goal is more than a week has room for.':
    'Mục tiêu tuần này nhiều hơn số thời gian một tuần có thể chứa.',
  'Enter a whole number of minutes.': 'Hãy nhập một số phút nguyên.',
  'The skill could not be saved.': 'Không thể lưu kỹ năng.',
  'That skill no longer exists.': 'Kỹ năng này không còn tồn tại.',
  'That is not a valid skill.': 'Kỹ năng này không hợp lệ.',

  // --- Skills list ---
  Skills: 'Kỹ năng',
  Add: 'Thêm',
  'No skills yet': 'Chưa có kỹ năng nào',
  'A skill is something you practise. Track time and goals for each one.':
    'Kỹ năng là thứ bạn luyện tập. Theo dõi thời gian và mục tiêu cho từng kỹ năng.',
  'Add the 7 suggested skills': 'Thêm 7 kỹ năng gợi ý',
  'Create my own': 'Tự tạo kỹ năng',
  'No archived skills.': 'Không có kỹ năng nào đã lưu trữ.',
  'Hide archived': 'Ẩn mục đã lưu trữ',
  'Show archived': 'Hiện mục đã lưu trữ',
  Archived: 'Đã lưu trữ',
  '{name} weekly goal': 'Mục tiêu tuần của {name}',
  '{done} of {goal} this week': '{done} / {goal} trong tuần này',
  '{done} this week · no weekly goal': '{done} trong tuần này · chưa có mục tiêu tuần',

  // --- Skill detail ---
  Skill: 'Kỹ năng',
  'Skill not found': 'Không tìm thấy kỹ năng',
  'It may have been deleted.': 'Có thể kỹ năng đã bị xóa.',
  'That did not work.': 'Thao tác không thành công.',
  'This week': 'Tuần này',
  'Goal {goal} a week': 'Mục tiêu {goal} mỗi tuần',
  'No weekly goal. Add one with Edit.': 'Chưa có mục tiêu tuần. Hãy thêm bằng nút Sửa.',
  Sessions: 'Buổi luyện tập',
  'Total time': 'Tổng thời gian',
  'Start a session': 'Bắt đầu buổi luyện tập',
  'No sessions yet': 'Chưa có buổi luyện tập nào',
  'Start a session for this skill to see your time here.':
    'Hãy bắt đầu một buổi luyện tập cho kỹ năng này để xem thời gian của bạn ở đây.',
  Manage: 'Quản lý',
  Edit: 'Sửa',
  Archive: 'Lưu trữ',
  Unarchive: 'Bỏ lưu trữ',
  'Delete skill': 'Xóa kỹ năng',
  'Delete “{name}”?': 'Xóa “{name}”?',
  'The skill is removed. Sessions you already recorded are kept in your totals and history.':
    'Kỹ năng sẽ bị xóa. Các buổi luyện tập bạn đã ghi vẫn được giữ trong tổng số và lịch sử.',

  // --- Skill form ---
  'Edit skill': 'Sửa kỹ năng',
  'New skill': 'Kỹ năng mới',
  Name: 'Tên',
  Category: 'Danh mục',
  Priority: 'Mức ưu tiên',
  'Weekly goal (minutes)': 'Mục tiêu tuần (phút)',
  'Optional. Progress shows against it on Home and the skill page.':
    'Không bắt buộc. Tiến độ sẽ so với mục tiêu này trên Trang chủ và trang kỹ năng.',
  'e.g. 120': 'ví dụ: 120',
  Notes: 'Ghi chú',
  'Save changes': 'Lưu thay đổi',
  'Add skill': 'Thêm kỹ năng',
  Cancel: 'Hủy',

  // --- Dashboard ---
  Home: 'Trang chủ',
  'Your status': 'Trạng thái của bạn',
  '{n}-day streak': 'Chuỗi {n} ngày',
  'No streak yet': 'Chưa có chuỗi ngày',
  'Level {level}': 'Cấp độ {level}',
  'Daily training goal': 'Mục tiêu luyện tập mỗi ngày',
  Today: 'Hôm nay',
  'Loading…': 'Đang tải…',
  'No training yet. Your goal is {goal} min a day.':
    'Hôm nay bạn chưa luyện tập. Mục tiêu của bạn là {goal} phút mỗi ngày.',
  'Goal reached: {time} today.': 'Đã đạt mục tiêu: {time} hôm nay.',
  '{time} of {goal} min.': '{time} trên {goal} phút.',
  'Train today to keep your streak.': 'Hãy luyện tập hôm nay để giữ chuỗi ngày.',
  '{into} / {span} XP': '{into} / {span} XP',
  '{xp} XP': '{xp} XP',
  'Progress to next level': 'Tiến độ đến cấp độ tiếp theo',
  'Next up': 'Tiếp theo',
  'You are on track': 'Bạn đang đi đúng hướng',
  'Nothing needs your attention right now.': 'Hiện chưa có gì cần bạn chú ý.',
  'Developer tip of the day': 'Mẹo lập trình mỗi ngày',
  'Your skills': 'Kỹ năng của bạn',
  'Add the skills you practise to track time and goals for each.':
    'Hãy thêm các kỹ năng bạn luyện tập để theo dõi thời gian và mục tiêu cho từng kỹ năng.',
  'Add skills': 'Thêm kỹ năng',
  '{done} / {goal} this week': '{done} / {goal} trong tuần này',
  '{done} this week': '{done} trong tuần này',
  'Recent activity': 'Hoạt động gần đây',
  'No activity yet': 'Chưa có hoạt động nào',
  'Finished sessions show up here, newest first.':
    'Các buổi luyện tập đã hoàn thành sẽ hiện ở đây, mới nhất trước.',

  // --- Progress ---
  Progress: 'Tiến độ',
  Period: 'Khoảng thời gian',
  '7 days': '7 ngày',
  '30 days': '30 ngày',
  'Same as the previous period': 'Bằng kỳ trước',
  'Nothing in the previous period': 'Kỳ trước không có dữ liệu',
  'Up {percent}% on the previous period': 'Tăng {percent}% so với kỳ trước',
  'Down {percent}% on the previous period': 'Giảm {percent}% so với kỳ trước',
  'No specific skill': 'Không chọn kỹ năng cụ thể',
  'Deleted skill': 'Kỹ năng đã xóa',
  'No training recorded yet': 'Chưa ghi nhận buổi luyện tập nào',
  'Finish a session and your time, consistency and trends appear here.':
    'Hoàn thành một buổi luyện tập và thời gian, độ đều đặn cùng xu hướng của bạn sẽ hiện ở đây.',
  'Time trained': 'Thời gian luyện tập',
  'Active days': 'Số ngày luyện tập',
  'Consistency {percent}%': 'Độ đều đặn {percent}%',
  'Average / active day': 'Trung bình mỗi ngày luyện tập',
  'Daily minutes': 'Số phút mỗi ngày',
  '{time} over the last {range} days, trained on {active} of {total} days.':
    '{time} trong {range} ngày qua, bạn đã luyện tập {active} trên {total} ngày.',
  'Where the time went': 'Thời gian đã dùng vào đâu',
  'No sessions in this period.': 'Không có buổi luyện tập nào trong khoảng thời gian này.',
  'Time by skill': 'Thời gian theo kỹ năng',
  Achievements: 'Thành tích',
  'Achievements unlock from your real activity. Some need modules that are not built yet.':
    'Thành tích được mở khóa từ hoạt động thực tế của bạn. Một số cần các mô-đun chưa có.',
  'Unlocked {date}': 'Đã mở khóa {date}',
  '{title} progress': 'Tiến độ {title}',
  History: 'Lịch sử',
  'No history yet': 'Chưa có lịch sử',
  'Finished sessions are listed here, newest first.':
    'Các buổi luyện tập đã hoàn thành được liệt kê ở đây, mới nhất trước.',

  // --- Session list ---
  Logged: 'Đã ghi tay',
  'Delete {title} session from {day}': 'Xóa buổi {title} ngày {day}',
  Delete: 'Xóa',
  'Delete this session?': 'Xóa buổi luyện tập này?',
  'Its time, XP and streak credit are removed. Achievements you already unlocked stay.':
    'Thời gian, XP và điểm chuỗi ngày của buổi này sẽ bị gỡ. Thành tích bạn đã mở khóa vẫn được giữ.',

  // --- Session complete sheet ---
  'Already saved': 'Đã lưu rồi',
  'Session saved': 'Đã lưu buổi luyện tập',
  'This session was already recorded. Nothing changed.':
    'Buổi luyện tập này đã được ghi nhận. Không có gì thay đổi.',
  '+{xp} XP': '+{xp} XP',
  'No XP this time': 'Lần này không có XP',
  'Level up! You are now level {level}.': 'Lên cấp! Bạn đã đạt cấp độ {level}.',
  Unlocked: 'Đã mở khóa',
  Done: 'Xong',

  // --- Manual log ---
  'Log a session': 'Ghi một buổi luyện tập',
  'That date is in the future.': 'Ngày này ở tương lai.',
  Minutes: 'Số phút',
  'e.g. 30': 'ví dụ: 30',
  Day: 'Ngày',
  'Logged sessions count for your time, goals and streak. XP is only earned by timed sessions.':
    'Buổi ghi tay được tính vào thời gian, mục tiêu và chuỗi ngày của bạn. XP chỉ có từ các buổi luyện tập bấm giờ.',
  'Save session': 'Lưu buổi luyện tập',
  'Pick a date.': 'Hãy chọn một ngày.',
  'Enter the minutes.': 'Hãy nhập số phút.',
  'Use whole minutes.': 'Hãy dùng số phút nguyên.',
  'At least 1 minute.': 'Ít nhất 1 phút.',
  'At most 12 hours (720 minutes).': 'Nhiều nhất 12 giờ (720 phút).',

  // --- Session screen ---
  'Training session': 'Buổi luyện tập',
  Practice: 'Luyện tập',
  'Start a timer, practise, then finish to save it. Timed sessions of {minutes} minutes or more earn XP and count for your streak.':
    'Hãy bấm giờ, luyện tập, rồi kết thúc để lưu. Buổi bấm giờ từ {minutes} phút trở lên nhận XP và được tính vào chuỗi ngày của bạn.',
  Start: 'Bắt đầu',
  'Elapsed time': 'Thời gian đã trôi qua',
  'Keeps counting if you lock your phone. Finish when you are done.':
    'Đồng hồ vẫn chạy khi bạn khóa điện thoại. Hãy kết thúc khi bạn xong.',
  'Optional: what you worked on.': 'Không bắt buộc: bạn đã luyện gì.',
  'This timer ran for over 12 hours, which is too long to save. Discard it and start again.':
    'Đồng hồ này đã chạy hơn 12 giờ, quá lâu để lưu. Hãy hủy buổi này và bắt đầu lại.',
  'Finish and save': 'Kết thúc và lưu',
  'Finish (after 1 minute)': 'Kết thúc (sau 1 phút)',
  Discard: 'Bỏ',
  'Discard this session?': 'Bỏ buổi luyện tập này?',
  'The time so far will not be saved.': 'Thời gian đã chạy sẽ không được lưu.',

  // --- Training engine and session rules ---
  'XP is turned off for this activity.': 'XP đã bị tắt cho hoạt động này.',
  'Logged sessions count for time but earn no XP.':
    'Buổi ghi tay được tính vào thời gian nhưng không có XP.',
  'Sessions under 5 minutes earn no XP.': 'Buổi luyện tập dưới 5 phút không có XP.',
  'Invalid session.': 'Buổi luyện tập không hợp lệ.',
  'Unknown activity type.': 'Loại hoạt động không xác định.',
  'A session cannot end in the future.': 'Buổi luyện tập không thể kết thúc ở tương lai.',
  'A session must end after it starts.': 'Buổi luyện tập phải kết thúc sau khi bắt đầu.',
  'A session must last between 1 minute and 12 hours.':
    'Buổi luyện tập phải kéo dài từ 1 phút đến 12 giờ.',
  'That session no longer exists.': 'Buổi luyện tập này không còn tồn tại.',
  'Only practice sessions can be deleted.': 'Chỉ có thể xóa các buổi luyện tập thường.',
};
