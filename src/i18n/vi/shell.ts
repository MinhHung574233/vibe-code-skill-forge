/** Vietnamese strings: app shell, shared UI, settings, practice hub, db/services/pwa messages. */
export const shell: Record<string, string> = {
  // Tabs and routes
  Home: 'Trang chủ',
  Skills: 'Kỹ năng',
  Practice: 'Luyện tập',
  Progress: 'Tiến độ',
  Settings: 'Cài đặt',
  Primary: 'Điều hướng chính',
  'Not found': 'Không tìm thấy',
  'Foundation shell. This screen is implemented in milestone {milestone}.':
    'Khung nền tảng. Màn hình này được xây dựng ở mốc {milestone}.',

  // Boot gate
  'Loading SkillForge': 'Đang tải SkillForge',
  'The app could not start.': 'Ứng dụng không thể khởi động.',
  'Reload to finish updating': 'Tải lại để hoàn tất cập nhật',
  'SkillForge was updated in another window. Reload to continue; your data is safe.':
    'SkillForge đã được cập nhật ở một cửa sổ khác. Hãy tải lại để tiếp tục; dữ liệu của bạn vẫn an toàn.',
  Reload: 'Tải lại',

  // Recovery screen
  'Storage is unavailable': 'Không thể dùng bộ nhớ lưu trữ',
  'Your data could not be opened': 'Không thể mở dữ liệu của bạn',
  'The update could not finish': 'Không thể hoàn tất bản cập nhật',
  'This app version is out of date': 'Phiên bản ứng dụng này đã cũ',
  'Your data appears to be missing': 'Dữ liệu của bạn dường như bị mất',
  'That did not work. Your data has not been changed further.':
    'Không thành công. Dữ liệu của bạn không bị thay đổi thêm.',
  'Nothing has been deleted by this app. If you saved a backup file, keep it safe; it is the only guaranteed way to bring this data back.':
    'Ứng dụng này chưa xóa gì cả. Nếu bạn đã lưu tệp sao lưu, hãy giữ cẩn thận; đó là cách duy nhất chắc chắn để lấy lại dữ liệu này.',
  'Close the app completely and open it again while online so the latest version can load. Your data has not been changed.':
    'Hãy đóng hẳn ứng dụng rồi mở lại khi có mạng để tải phiên bản mới nhất. Dữ liệu của bạn không bị thay đổi.',
  'Try again': 'Thử lại',
  'Restore the copy saved before the last update':
    'Khôi phục bản sao đã lưu trước lần cập nhật gần nhất',
  'Continue with empty data': 'Tiếp tục với dữ liệu trống',
  'Restore from a backup file': 'Khôi phục từ tệp sao lưu',
  'Check again': 'Kiểm tra lại',
  'Erase local data and start over': 'Xóa dữ liệu trên máy và bắt đầu lại',
  'Erase all local data?': 'Xóa toàn bộ dữ liệu trên máy?',
  'Everything stored on this device by SkillForge will be deleted, including the saved copy. This cannot be undone.':
    'Mọi thứ SkillForge lưu trên thiết bị này sẽ bị xóa, kể cả bản sao đã lưu. Bạn không thể hoàn tác thao tác này.',
  'Erase everything': 'Xóa tất cả',

  // Status banners
  'An update is ready.': 'Đã có bản cập nhật.',
  Restart: 'Khởi động lại',
  'Some offline files are missing. Connect to the internet to repair.':
    'Thiếu một số tệp ngoại tuyến. Hãy kết nối internet để sửa.',
  Repair: 'Sửa',
  'Back up': 'Sao lưu',
  'Add SkillForge to your Home Screen to use it offline.':
    'Thêm SkillForge vào Màn hình chính để dùng khi không có mạng.',
  How: 'Cách làm',

  // Shared components
  'Back to {label}': 'Quay lại {label}',
  'Something went wrong': 'Đã xảy ra lỗi',
  'Decrease {label}': 'Giảm {label}',
  'Increase {label}': 'Tăng {label}',
  '{percent} percent': '{percent} phần trăm',

  // Date and time words
  today: 'hôm nay',
  yesterday: 'hôm qua',
  '{days} days ago': '{days} ngày trước',
  Today: 'Hôm nay',
  Yesterday: 'Hôm qua',

  // Settings screen
  Appearance: 'Giao diện',
  Theme: 'Chủ đề',
  System: 'Theo hệ thống',
  Light: 'Sáng',
  Dark: 'Tối',
  Auto: 'Tự động',
  Training: 'Luyện tập',
  'Your goal appears on the Home screen. The streak rule decides which days count towards your streak.':
    'Mục tiêu của bạn hiển thị ở màn hình Trang chủ. Quy tắc chuỗi ngày quyết định những ngày nào được tính vào chuỗi.',
  'Daily goal': 'Mục tiêu mỗi ngày',
  'daily goal': 'mục tiêu mỗi ngày',
  'Minutes per day': 'Số phút mỗi ngày',
  '{v} min': '{v} phút',
  'Streak counts days with': 'Chuỗi ngày tính những ngày có',
  'Streak rule': 'Quy tắc chuỗi ngày',
  'Any session': 'Bất kỳ buổi luyện tập nào',
  'Goal reached': 'Đạt mục tiêu',
  Offline: 'Ngoại tuyến',
  'Ready offline': 'Sẵn sàng dùng ngoại tuyến',
  '{n} files saved': 'Đã lưu {n} tệp',
  Incomplete: 'Chưa đầy đủ',
  '{missing} of {expected} files missing': 'Thiếu {missing} trên {expected} tệp',
  'Checking…': 'Đang kiểm tra…',
  'Repairing…': 'Đang sửa…',
  'Not available here': 'Không khả dụng ở đây',
  'Offline mode works in the installed, hosted app':
    'Chế độ ngoại tuyến hoạt động trong ứng dụng đã cài đặt và được lưu trữ trực tuyến',
  'Not checked yet': 'Chưa kiểm tra',
  OK: 'OK',
  Status: 'Trạng thái',
  'SkillForge works without internet once every file is saved on this device. iOS can remove saved files if the phone runs low on space; use Repair while online if this shows Incomplete.':
    'SkillForge chạy được khi không có internet sau khi mọi tệp đã được lưu trên thiết bị này. iOS có thể xóa các tệp đã lưu nếu điện thoại sắp hết dung lượng; hãy dùng Sửa khi có mạng nếu mục này hiện Chưa đầy đủ.',
  'Your data': 'Dữ liệu của bạn',
  'Everything is stored only on this device. A backup file is the only way to recover your data if iOS clears the app’s storage, you delete the Home Screen icon, or you change phones.':
    'Mọi thứ chỉ được lưu trên thiết bị này. Tệp sao lưu là cách duy nhất để lấy lại dữ liệu nếu iOS xóa bộ nhớ của ứng dụng, bạn xóa biểu tượng ở Màn hình chính hoặc đổi điện thoại.',
  'Last backup': 'Lần sao lưu gần nhất',
  Never: 'Chưa bao giờ',
  'Storage used': 'Dung lượng đã dùng',
  '{used} of {quota} available': '{used} trên {quota} khả dụng',
  'Not reported by this browser': 'Trình duyệt này không báo cáo',
  'Storage protection': 'Bảo vệ bộ nhớ',
  'iOS decides; this cannot be confirmed': 'iOS quyết định; không thể xác nhận điều này',
  'Requested for the installed app': 'Đã yêu cầu cho ứng dụng đã cài đặt',
  'Install to the Home Screen first': 'Hãy cài vào Màn hình chính trước',
  Granted: 'Đã cấp',
  'Not granted': 'Chưa cấp',
  Unknown: 'Không rõ',
  'Back up my data': 'Sao lưu dữ liệu của tôi',
  Install: 'Cài đặt',
  'Add to Home Screen': 'Thêm vào Màn hình chính',
  'Required for reliable offline use': 'Cần thiết để dùng ngoại tuyến ổn định',
  'Danger zone': 'Vùng nguy hiểm',
  'Erase all data on this device': 'Xóa toàn bộ dữ liệu trên thiết bị này',
  'Erase all data?': 'Xóa toàn bộ dữ liệu?',
  'Every skill, goal and setting stored by SkillForge on this device will be deleted, along with the safety copy. Back up first if you might want it back. This cannot be undone.':
    'Mọi kỹ năng, mục tiêu và cài đặt SkillForge lưu trên thiết bị này sẽ bị xóa, cùng với bản sao an toàn. Hãy sao lưu trước nếu bạn có thể muốn lấy lại. Bạn không thể hoàn tác thao tác này.',
  'Erasing failed. Nothing more was changed.':
    'Xóa không thành công. Không có gì bị thay đổi thêm.',
  About: 'Giới thiệu',
  SkillForge: 'SkillForge',
  'Version {version}': 'Phiên bản {version}',
  'Data format': 'Định dạng dữ liệu',
  Privacy: 'Quyền riêng tư',
  'No account, no tracking, no network requests. Your data leaves this device only when you export a backup.':
    'Không tài khoản, không theo dõi, không gửi yêu cầu mạng. Dữ liệu của bạn chỉ rời khỏi thiết bị này khi bạn xuất bản sao lưu.',

  // Backup import
  'That file could not be read.': 'Không đọc được tệp đó.',
  'Restore from backup file': 'Khôi phục từ tệp sao lưu',
  'Restoring…': 'Đang khôi phục…',
  'Restore this backup?': 'Khôi phục bản sao lưu này?',
  'Made {date}': 'Tạo lúc {date}',
  'app {version}': 'ứng dụng {version}',
  'Skill goals': 'Mục tiêu kỹ năng',
  'Restoring replaces everything currently on this device. A safety copy of your current data is kept first.':
    'Khôi phục sẽ thay thế mọi thứ hiện có trên thiết bị này. Một bản sao an toàn của dữ liệu hiện tại sẽ được giữ lại trước.',
  'Replace my data': 'Thay thế dữ liệu của tôi',
  'Replace all data on this device?': 'Thay thế toàn bộ dữ liệu trên thiết bị này?',
  'Your current data will be replaced by this backup. This cannot be undone from the app.':
    'Dữ liệu hiện tại của bạn sẽ được thay bằng bản sao lưu này. Bạn không thể hoàn tác trong ứng dụng.',
  Replace: 'Thay thế',

  // Export backup
  'Back up your data': 'Sao lưu dữ liệu của bạn',
  'That did not work. Try another option below.':
    'Không thành công. Hãy thử một lựa chọn khác bên dưới.',
  'This option is not available on this device.': 'Lựa chọn này không khả dụng trên thiết bị này.',
  'Preparing your backup…': 'Đang chuẩn bị bản sao lưu…',
  '{items} items · {kb} KB · {name}': '{items} mục · {kb} KB · {name}',
  'Backup saved. Keep a copy somewhere safe.': 'Đã lưu bản sao lưu. Hãy giữ một bản ở nơi an toàn.',
  'Save to Files or share': 'Lưu vào Tệp hoặc chia sẻ',
  'Download started. Check your Downloads or Files app to confirm it was saved.':
    'Đã bắt đầu tải xuống. Hãy kiểm tra mục Tải xuống hoặc ứng dụng Tệp để xác nhận đã lưu.',
  'Download file': 'Tải tệp xuống',
  'Copied. Paste it into a note or message to yourself.':
    'Đã sao chép. Hãy dán vào ghi chú hoặc nhắn cho chính bạn.',
  'Copy as text': 'Sao chép dưới dạng văn bản',
  'The file contains all your data and is not encrypted. Store it somewhere private, like iCloud Drive.':
    'Tệp chứa toàn bộ dữ liệu của bạn và không được mã hóa. Hãy lưu ở nơi riêng tư, chẳng hạn iCloud Drive.',

  // Install coach
  'Add SkillForge to your Home Screen': 'Thêm SkillForge vào Màn hình chính',
  'Open this page in Safari.': 'Mở trang này trong Safari.',
  'Tap the Share button (the square with an arrow) in the toolbar.':
    'Chạm nút Chia sẻ (hình vuông có mũi tên) trên thanh công cụ.',
  'Scroll down and tap “Add to Home Screen”, then tap Add.':
    'Cuộn xuống và chạm “Thêm vào Màn hình chính”, rồi chạm Thêm.',
  'Open SkillForge from its new icon on your Home Screen.':
    'Mở SkillForge từ biểu tượng mới trên Màn hình chính.',
  'Use SkillForge from the Home Screen icon, not from Safari. The installed app keeps its own storage: anything you add in a Safari tab will not appear in it. Moving data between them is done with a backup.':
    'Hãy dùng SkillForge từ biểu tượng ở Màn hình chính, không dùng từ Safari. Ứng dụng đã cài đặt có bộ nhớ riêng: mọi thứ bạn thêm trong thẻ Safari sẽ không xuất hiện trong đó. Muốn chuyển dữ liệu giữa hai nơi, hãy dùng bản sao lưu.',
  'Got it': 'Đã hiểu',
  'Not now': 'Để sau',

  // Backup reminder
  'You have not backed up yet. A backup is the only way to recover your data if iOS clears it.':
    'Bạn chưa sao lưu lần nào. Bản sao lưu là cách duy nhất để lấy lại dữ liệu nếu iOS xóa nó.',
  'Your last backup was {days} days ago.': 'Lần sao lưu gần nhất của bạn cách đây {days} ngày.',
  '{added} new items since your last backup.': 'Có {added} mục mới kể từ lần sao lưu gần nhất.',
  'Invalid value for setting "{key}".': 'Giá trị không hợp lệ cho cài đặt "{key}".',

  // Practice hub
  Train: 'Rèn luyện',
  'Time yourself on any skill, or log a session you already did. Both feed your goals, streak and progress.':
    'Bấm giờ khi luyện bất kỳ kỹ năng nào, hoặc ghi lại một buổi luyện tập bạn đã làm. Cả hai đều được tính vào mục tiêu, chuỗi ngày và tiến độ của bạn.',
  'Start a session': 'Bắt đầu buổi luyện tập',
  'Log a session': 'Ghi một buổi luyện tập',
  'Training modules': 'Các module luyện tập',
  'Coming soon': 'Sắp ra mắt',

  // Module names (product names stay) and descriptions
  'Java & Spring Boot': 'Java & Spring Boot',
  Caro: 'Caro',
  'Timer, scrambles, Ao5 / Ao12, algorithms': 'Bấm giờ, xáo trộn, Ao5 / Ao12, thuật toán',
  'IT vocabulary, flashcards, spaced repetition': 'Từ vựng IT, thẻ ghi nhớ, lặp lại ngắt quãng',
  'Core to advanced, architecture, performance': 'Từ cơ bản đến nâng cao, kiến trúc, hiệu năng',
  'IntelliJ, Git & GitLab, DevOps tips': 'Mẹo về IntelliJ, Git & GitLab, DevOps',
  'Five in a row against a real engine': 'Năm quân liên tiếp đấu với một engine thật',
  'Puzzles, openings, rating': 'Thế cờ, khai cuộc, điểm xếp hạng',
  '9×9, 13×13, 19×19 and tsumego': '9×9, 13×13, 19×19 và tsumego',

  // Database, backup and service messages
  'This browser is not allowing the app to store data on this device.':
    'Trình duyệt này không cho phép ứng dụng lưu dữ liệu trên thiết bị.',
  'Your data was saved by a newer version of SkillForge. Update the app to open it.':
    'Dữ liệu của bạn được lưu bởi một phiên bản SkillForge mới hơn. Hãy cập nhật ứng dụng để mở.',
  'The saved data could not be inspected.': 'Không thể kiểm tra dữ liệu đã lưu.',
  'The update could not convert your saved data. Your data has not been changed.':
    'Bản cập nhật không thể chuyển đổi dữ liệu đã lưu của bạn. Dữ liệu của bạn không bị thay đổi.',
  'The saved data could not be opened.': 'Không thể mở dữ liệu đã lưu.',
  'Your saved data appears to be missing. iOS may have cleared this app’s storage.':
    'Dữ liệu đã lưu của bạn dường như bị mất. iOS có thể đã xóa bộ nhớ của ứng dụng này.',
  'The saved data could not be read.': 'Không thể đọc dữ liệu đã lưu.',
  'Device storage is full.': 'Bộ nhớ thiết bị đã đầy.',
  'There is no snapshot to restore.': 'Không có bản sao nào để khôi phục.',
  'That file is too large to be a backup.': 'Tệp đó quá lớn để là một bản sao lưu.',
  'This file is not a valid backup (it is not readable JSON).':
    'Tệp này không phải bản sao lưu hợp lệ (không phải JSON đọc được).',
  'This backup file is damaged or incomplete.': 'Tệp sao lưu này bị hỏng hoặc không đầy đủ.',
  'This is not a SkillForge backup file.': 'Đây không phải tệp sao lưu của SkillForge.',
  'This backup was made by a newer version of SkillForge. Update the app, then try again.':
    'Bản sao lưu này được tạo bởi một phiên bản SkillForge mới hơn. Hãy cập nhật ứng dụng rồi thử lại.',
  'The backup contains an unknown table "{name}".':
    'Bản sao lưu chứa một bảng không xác định "{name}".',
  'The backup contains a table this app cannot check: "{name}".':
    'Bản sao lưu chứa một bảng mà ứng dụng này không thể kiểm tra: "{name}".',
  'The backup is damaged: "{name}" entry {n} is not valid.':
    'Bản sao lưu bị hỏng: mục {n} của "{name}" không hợp lệ.',
  'The backup failed its integrity check. The file was changed or is incomplete.':
    'Bản sao lưu không vượt qua kiểm tra toàn vẹn. Tệp đã bị thay đổi hoặc không đầy đủ.',
  'The import failed and the previous data could not be restored automatically.':
    'Nhập dữ liệu không thành công và không thể tự động khôi phục dữ liệu trước đó.',
  'There is not enough free storage on this device to restore the backup. Your previous data was kept.':
    'Thiết bị không đủ dung lượng trống để khôi phục bản sao lưu. Dữ liệu trước đó của bạn vẫn được giữ.',
  'The backup could not be restored. Your previous data was kept.':
    'Không thể khôi phục bản sao lưu. Dữ liệu trước đó của bạn vẫn được giữ.',
};
