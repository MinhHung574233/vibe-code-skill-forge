/** Vietnamese strings: tools. Key = the exact English source string. */
/* Learning UI and Developer Tools UI, then Developer Tools lessons and daily tips. */
export const tools: Record<string, string> = {
  'Code example': 'Ví dụ mã',
  Practice: 'Luyện tập',
  'Your progress': 'Tiến độ của bạn',
  '{done} of {total} lessons': '{done}/{total} bài học',
  '{done} of {total} lessons completed': 'Đã hoàn thành {done}/{total} bài học',
  'Learning paths': 'Lộ trình học',
  'Pass each lesson’s 3-question quiz (2 correct) to complete it.':
    'Vượt qua bài kiểm tra 3 câu của mỗi bài học (đúng 2 câu) để hoàn thành bài đó.',
  beginner: 'cơ bản',
  intermediate: 'trung cấp',
  advanced: 'nâng cao',
  Complete: 'Hoàn thành',
  Path: 'Lộ trình',
  'Path not found': 'Không tìm thấy lộ trình',
  'This learning path does not exist.': 'Lộ trình học này không tồn tại.',
  '{n} min': '{n} phút',
  Done: 'Xong',
  'Tip:': 'Mẹo:',
  Lesson: 'Bài học',
  'Lesson not found': 'Không tìm thấy bài học',
  'This lesson does not exist.': 'Bài học này không tồn tại.',
  '{n} min read': 'Đọc {n} phút',
  'Take the quiz': 'Làm bài kiểm tra',
  Correct: 'Đúng',
  'Right.': 'Chính xác.',
  'Not quite.': 'Chưa đúng.',
  'Check answers': 'Kiểm tra đáp án',
  'Answer all 3 questions': 'Hãy trả lời cả 3 câu hỏi',
  '{correct} of {total} correct': 'Đúng {correct}/{total} câu',
  'Lesson complete.': 'Bạn đã hoàn thành bài học.',
  'You need 2 correct answers to complete the lesson. Read it again and retry.':
    'Bạn cần đúng ít nhất 2 câu để hoàn thành bài học. Hãy đọc lại bài rồi thử lại nhé.',
  'Next lesson': 'Bài tiếp theo',
  'Try the quiz again': 'Làm lại bài kiểm tra',
  'Back to {title}': 'Quay lại {title}',
  'Developer Tools': 'Công cụ lập trình',
  'Daily developer tip · {category}': 'Mẹo lập trình mỗi ngày · {category}',
  'Browse all {n} tips': 'Xem tất cả {n} mẹo',
  Tips: 'Mẹo',
  All: 'Tất cả',
  '{n} tips': '{n} mẹo',

  // Developer Tools lessons, daily tips and tip labels
  'Git and GitLab': 'Git và GitLab',
  'Branching, undoing mistakes safely, and the merge request workflow.':
    'Làm việc với nhánh, hoàn tác sai sót an toàn và quy trình merge request.',
  'Branches, merge and rebase': 'Branch, merge và rebase',
  'Keep a feature branch up to date without making a mess.':
    'Giữ feature branch luôn cập nhật mà không làm lịch sử rối tung.',
  'A branch is a cheap, movable pointer to a commit. You create one for each piece of work so main stays releasable.':
    'Branch là một con trỏ nhẹ, di chuyển được, trỏ tới một commit. Bạn tạo một branch cho mỗi phần việc để main luôn sẵn sàng phát hành.',
  'To bring in new work from main you can merge it, which adds a merge commit and keeps history as it happened, or rebase, which replays your commits on top of the latest main for a straight history.':
    'Để lấy công việc mới từ main về, bạn có thể merge (tạo thêm một merge commit và giữ lịch sử đúng như đã diễn ra) hoặc rebase (phát lại các commit của bạn lên trên main mới nhất để có lịch sử thẳng hàng).',
  'Never rebase commits that other people have already pulled.':
    'Đừng bao giờ rebase những commit mà người khác đã pull về.',
  'Resolve conflicts, then git add the files and git rebase --continue.':
    'Giải quyết xung đột, sau đó git add các file rồi git rebase --continue.',
  '--force-with-lease refuses to overwrite remote commits you have not seen.':
    '--force-with-lease từ chối ghi đè các commit trên remote mà bạn chưa thấy.',
  'git pull --rebase keeps your local commits on top instead of creating a merge commit.':
    'git pull --rebase giữ các commit cục bộ của bạn nằm trên cùng thay vì tạo một merge commit.',
  'Which command replays your branch on top of the latest main?':
    'Lệnh nào phát lại branch của bạn lên trên main mới nhất?',
  'git reset --hard origin/main': 'git reset --hard origin/main',
  'git clean -fd': 'git clean -fd',
  'git rebase origin/main': 'git rebase origin/main',
  'git stash': 'git stash',
  'rebase re-applies your commits one by one onto the new base. reset --hard would throw your commits away.':
    'rebase áp dụng lại từng commit của bạn lên base mới. reset --hard sẽ vứt bỏ các commit của bạn.',
  'When should you avoid rebasing?': 'Khi nào bạn nên tránh rebase?',
  'On a private feature branch': 'Trên một feature branch riêng của bạn',
  'Before opening a merge request on your own branch':
    'Trước khi mở merge request trên branch của chính bạn',
  'On a branch with a single commit': 'Trên một branch chỉ có một commit',
  'On commits that other people have already pulled': 'Trên những commit mà người khác đã pull về',
  'Rebasing rewrites commits. If others based work on the old ones, their history and yours diverge.':
    'Rebase viết lại các commit. Nếu người khác đã làm tiếp dựa trên các commit cũ, lịch sử của họ và của bạn sẽ rẽ nhánh.',
  'Why is --force-with-lease safer than --force?': 'Vì sao --force-with-lease an toàn hơn --force?',
  'It is faster': 'Nó nhanh hơn',
  'It refuses to overwrite remote commits you have not seen':
    'Nó từ chối ghi đè các commit trên remote mà bạn chưa thấy',
  'It also runs the tests': 'Nó còn chạy cả test',
  'It works without a remote': 'Nó hoạt động mà không cần remote',
  'If someone pushed in the meantime, the lease check fails instead of silently deleting their work.':
    'Nếu trong lúc đó có người đã push, bước kiểm tra lease sẽ thất bại thay vì lặng lẽ xóa mất công sức của họ.',
  'Undoing mistakes safely': 'Hoàn tác sai sót an toàn',
  'restore, amend, revert, reset and reflog.': 'restore, amend, revert, reset và reflog.',
  'Almost everything in Git can be undone, but the right tool depends on where the mistake is: in the working tree, the staging area, a local commit or a pushed commit.':
    'Hầu như mọi thứ trong Git đều hoàn tác được, nhưng công cụ phù hợp tùy thuộc vào chỗ sai nằm ở đâu: trong working tree, vùng staging, một commit cục bộ hay một commit đã push.',
  'reset --soft moves the branch and keeps changes staged.':
    'reset --soft di chuyển branch và giữ các thay đổi ở trạng thái đã staged.',
  'reset --mixed (the default) keeps changes but unstages them.':
    'reset --mixed (mặc định) giữ các thay đổi nhưng bỏ staged.',
  'reset --hard also throws the changes away.': 'reset --hard còn vứt bỏ luôn các thay đổi.',
  'Use revert, not reset, for commits that are already shared.':
    'Với commit đã được chia sẻ, hãy dùng revert chứ không dùng reset.',
  'The reflog records where HEAD has been for about 90 days, so a "lost" commit is usually recoverable.':
    'Reflog ghi lại những nơi HEAD đã đi qua trong khoảng 90 ngày, nên một commit "bị mất" thường vẫn khôi phục được.',
  'A wrong commit is already pushed to main. What is the safe way to undo it?':
    'Một commit sai đã được push lên main. Cách an toàn để hoàn tác là gì?',
  'git reset --hard and force-push main': 'git reset --hard rồi force-push main',
  'Delete the .git folder': 'Xóa thư mục .git',
  'git revert <sha>, which adds a new commit that cancels it':
    'git revert <sha>, lệnh này thêm một commit mới để triệt tiêu commit đó',
  'Revert does not rewrite shared history, so nobody else has to repair their copy.':
    'Revert không viết lại lịch sử đã chia sẻ, nên không ai phải sửa lại bản sao của mình.',
  'Which command shows where HEAD has been, so you can recover lost commits?':
    'Lệnh nào cho biết HEAD đã đi qua những đâu để bạn khôi phục các commit bị mất?',
  'git blame': 'git blame',
  'git remote -v': 'git remote -v',
  'git tag': 'git tag',
  'git reflog': 'git reflog',
  'The reflog lists the previous positions of HEAD and branches.':
    'Reflog liệt kê các vị trí trước đây của HEAD và của các branch.',
  'What does git reset --hard do to uncommitted changes?':
    'git reset --hard làm gì với các thay đổi chưa commit?',
  'Stashes them safely': 'Cất chúng đi an toàn bằng stash',
  'Commits them': 'Commit chúng',
  'Discards them': 'Hủy bỏ chúng',
  'Moves them to a new branch': 'Chuyển chúng sang một branch mới',
  'Uncommitted changes are not in any commit, so --hard overwrites them with no way back.':
    'Các thay đổi chưa commit không nằm trong commit nào, nên --hard ghi đè chúng và không có đường quay lại.',
  'Stash, cherry-pick and bisect': 'Stash, cherry-pick và bisect',
  'Three commands for awkward moments.': 'Ba lệnh cho những lúc khó xử.',
  'git stash puts your uncommitted work aside so you can switch task. git cherry-pick copies a single commit onto the current branch. git bisect finds the commit that introduced a bug by binary search.':
    'git stash cất công việc chưa commit sang một bên để bạn đổi sang việc khác. git cherry-pick sao chép một commit đơn lẻ vào branch hiện tại. git bisect tìm ra commit gây ra lỗi bằng tìm kiếm nhị phân.',
  'Use git stash list to see what you stashed. A named stash is easier to find later than an anonymous one.':
    'Dùng git stash list để xem bạn đã stash những gì. Một stash có tên dễ tìm lại hơn một stash vô danh.',
  'What does git stash push do?': 'git stash push làm gì?',
  'Saves uncommitted changes and gives you a clean working tree':
    'Lưu các thay đổi chưa commit và trả lại cho bạn một working tree sạch',
  'Commits everything to main': 'Commit mọi thứ vào main',
  'Deletes your changes': 'Xóa các thay đổi của bạn',
  'Pushes your branch to the remote': 'Push branch của bạn lên remote',
  'The changes are stored in a stash entry. git stash pop brings them back.':
    'Các thay đổi được lưu trong một stash entry. git stash pop sẽ đưa chúng trở lại.',
  'You need one fix from another branch without merging everything. What do you use?':
    'Bạn cần một bản sửa từ branch khác mà không muốn merge tất cả. Bạn dùng gì?',
  'git merge --abort': 'git merge --abort',
  'git bisect': 'git bisect',
  'git cherry-pick <sha>': 'git cherry-pick <sha>',
  'git revert --all': 'git revert --all',
  'Cherry-pick applies the changes of one chosen commit as a new commit on your branch.':
    'Cherry-pick áp dụng thay đổi của một commit được chọn thành một commit mới trên branch của bạn.',
  'What does git bisect find?': 'git bisect tìm ra điều gì?',
  'The commit that introduced a bug, by binary search through history':
    'Commit gây ra lỗi, bằng cách tìm kiếm nhị phân trong lịch sử',
  'The largest file in the repository': 'File lớn nhất trong repository',
  'Unused branches': 'Các branch không dùng đến',
  'The author with the most commits': 'Tác giả có nhiều commit nhất',
  'You tell Git a good and a bad commit, and it halves the range each time you test one.':
    'Bạn cho Git biết một commit tốt và một commit lỗi, rồi mỗi lần bạn kiểm thử một commit, nó thu hẹp phạm vi đi một nửa.',
  'The GitLab merge request workflow': 'Quy trình merge request trên GitLab',
  'From branch to merged, with a pipeline in between.':
    'Từ branch đến lúc được merge, với một pipeline ở giữa.',
  'The usual flow is: create a branch, push it, open a merge request (MR), let the pipeline run, get a review, resolve the comments, and merge once the pipeline is green.':
    'Quy trình thường gặp: tạo branch, push lên, mở merge request (MR), để pipeline chạy, nhận review, xử lý các góp ý, rồi merge khi pipeline đã xanh.',
  'A minimal .gitlab-ci.yml at the root of the repository.':
    'Một file .gitlab-ci.yml tối giản ở thư mục gốc của repository.',
  'Keep merge requests small: they are reviewed faster and break less.':
    'Giữ merge request nhỏ: chúng được review nhanh hơn và ít gây lỗi hơn.',
  'Write what and why in the description, and link the issue.':
    'Hãy ghi rõ làm gì và vì sao trong phần mô tả, và gắn link tới issue.',
  'Prefix the title with Draft: while it is not ready to merge but you want feedback.':
    'Thêm tiền tố Draft: vào tiêu đề khi MR chưa sẵn sàng để merge nhưng bạn muốn nhận phản hồi.',
  'Resolve every discussion thread before merging.':
    'Giải quyết mọi discussion thread trước khi merge.',
  'Read your own diff in the MR page before asking anyone to review it.':
    'Hãy tự đọc diff của mình trên trang MR trước khi nhờ người khác review.',
  'Which file defines a GitLab CI/CD pipeline?':
    'File nào định nghĩa một pipeline CI/CD của GitLab?',
  'pipeline.json': 'pipeline.json',
  '.gitlab-ci.yml': '.gitlab-ci.yml',
  'gitlab.properties': 'gitlab.properties',
  'build.gradle': 'build.gradle',
  'GitLab looks for .gitlab-ci.yml in the root of the repository.':
    'GitLab tìm .gitlab-ci.yml ở thư mục gốc của repository.',
  'Why keep merge requests small?': 'Vì sao nên giữ merge request nhỏ?',
  'GitLab refuses large ones': 'GitLab từ chối các MR lớn',
  'Small MRs skip the pipeline': 'MR nhỏ được bỏ qua pipeline',
  'They are easier and faster to review, and safer to merge':
    'Chúng dễ và nhanh review hơn, và merge an toàn hơn',
  'It reduces the number of commits needed': 'Nó giảm số commit cần thiết',
  'A reviewer can understand a small change fully, so problems are found before they ship.':
    'Người review có thể hiểu trọn vẹn một thay đổi nhỏ, nên vấn đề được phát hiện trước khi lên production.',
  'What does a Draft merge request signal?': 'Một Draft merge request cho biết điều gì?',
  'It is not ready to merge, but you want early feedback':
    'Nó chưa sẵn sàng để merge, nhưng bạn muốn nhận phản hồi sớm',
  'It has already been merged': 'Nó đã được merge rồi',
  'It cannot be reviewed': 'Nó không thể được review',
  'It will be deleted tomorrow': 'Nó sẽ bị xóa vào ngày mai',
  'Draft MRs cannot be merged until the Draft prefix is removed, so teammates know the state at a glance.':
    'Draft MR không thể merge cho đến khi bỏ tiền tố Draft, nên đồng đội nhìn qua là biết trạng thái.',
  'IntelliJ IDEA': 'IntelliJ IDEA',
  'Move around, refactor and debug faster. Shortcuts are Windows/Linux, with macOS in brackets.':
    'Di chuyển, refactor và debug nhanh hơn. Phím tắt dành cho Windows/Linux, kèm macOS trong ngoặc.',
  'Navigating code quickly': 'Điều hướng code nhanh chóng',
  'Find any file, class or action without touching the mouse.':
    'Tìm bất kỳ file, class hay action nào mà không cần chạm chuột.',
  'Search Everywhere: press Shift twice.': 'Search Everywhere: nhấn Shift hai lần.',
  'Go to class: Ctrl+N (Cmd+O). Go to file: Ctrl+Shift+N (Cmd+Shift+O).':
    'Go to class: Ctrl+N (Cmd+O). Go to file: Ctrl+Shift+N (Cmd+Shift+O).',
  'Find action by name: Ctrl+Shift+A (Cmd+Shift+A).':
    'Find action theo tên: Ctrl+Shift+A (Cmd+Shift+A).',
  'Recent files: Ctrl+E (Cmd+E).': 'Recent files: Ctrl+E (Cmd+E).',
  'Go to declaration: Ctrl+B (Cmd+B). Go to implementation: Ctrl+Alt+B (Cmd+Alt+B).':
    'Go to declaration: Ctrl+B (Cmd+B). Go to implementation: Ctrl+Alt+B (Cmd+Alt+B).',
  'Find usages: Alt+F7 (Option+F7).': 'Find usages: Alt+F7 (Option+F7).',
  'Back and forward: Ctrl+Alt+Left / Right (Cmd+[ and Cmd+]).':
    'Quay lại và tiến tới: Ctrl+Alt+Left / Right (Cmd+[ và Cmd+]).',
  'Camel-case search works everywhere: typing OrdSer finds OrderService. If you forget a shortcut, Find action will show it next to the command.':
    'Tìm kiếm theo camel-case hoạt động ở mọi nơi: gõ OrdSer sẽ tìm ra OrderService. Nếu quên một phím tắt, Find action sẽ hiển thị nó bên cạnh lệnh.',
  'Use Ctrl+E to jump between the few files you are editing, instead of searching each time.':
    'Dùng Ctrl+E để nhảy giữa vài file bạn đang sửa, thay vì tìm kiếm mỗi lần.',
  'Which input opens Search Everywhere?': 'Tổ hợp nào mở Search Everywhere?',
  'Press Ctrl twice': 'Nhấn Ctrl hai lần',
  'Press Shift twice': 'Nhấn Shift hai lần',
  'Press Alt+F4': 'Press Alt+F4',
  'Press Ctrl+Z': 'Press Ctrl+Z',
  'Double Shift searches files, classes, symbols and actions. Double Ctrl opens Run Anything instead.':
    'Nhấn đúp Shift tìm file, class, symbol và action. Nhấn đúp Ctrl thì mở Run Anything.',
  'Which shortcut runs a command by typing its name?':
    'Phím tắt nào chạy một lệnh bằng cách gõ tên của nó?',
  'Ctrl+Shift+A (Cmd+Shift+A), Find Action': 'Ctrl+Shift+A (Cmd+Shift+A), Find Action',
  'Ctrl+B (Cmd+B)': 'Ctrl+B (Cmd+B)',
  'Alt+F7': 'Alt+F7',
  'Ctrl+E (Cmd+E)': 'Ctrl+E (Cmd+E)',
  'Find Action works like a command palette and shows the shortcut of the command.':
    'Find Action hoạt động như command palette và hiển thị phím tắt của lệnh.',
  'You are on an interface method and want its implementation. What do you press?':
    'Bạn đang ở một method của interface và muốn tới phần implementation. Bạn nhấn gì?',
  'Ctrl+Alt+B (Cmd+Alt+B)': 'Ctrl+Alt+B (Cmd+Alt+B)',
  'Shift+F6': 'Shift+F6',
  'Ctrl+Alt+L (Cmd+Alt+L)': 'Ctrl+Alt+L (Cmd+Alt+L)',
  F9: 'F9',
  'Go to implementation jumps from the interface to the classes that implement it.':
    'Go to implementation nhảy từ interface tới các class cài đặt nó.',
  'Refactoring and debugging': 'Refactor và debug',
  'Safe renames, extractions and the debugger controls.':
    'Đổi tên an toàn, trích xuất code và các điều khiển của debugger.',
  'Rename: Shift+F6. It updates every real usage, and only those.':
    'Rename: Shift+F6. Nó cập nhật mọi chỗ dùng thật sự, và chỉ những chỗ đó.',
  'Extract method: Ctrl+Alt+M (Cmd+Alt+M). Extract variable: Ctrl+Alt+V (Cmd+Alt+V).':
    'Extract method: Ctrl+Alt+M (Cmd+Alt+M). Extract variable: Ctrl+Alt+V (Cmd+Alt+V).',
  'Reformat code: Ctrl+Alt+L (Cmd+Alt+L). Optimise imports: Ctrl+Alt+O (Ctrl+Option+O).':
    'Reformat code: Ctrl+Alt+L (Cmd+Alt+L). Optimize imports: Ctrl+Alt+O (Ctrl+Option+O).',
  'Debug: click the gutter to set a breakpoint, then Shift+F9.':
    'Debug: bấm vào lề (gutter) để đặt breakpoint, rồi nhấn Shift+F9.',
  'Step over F8, step into F7, step out Shift+F8, resume F9.':
    'Step over F8, step into F7, step out Shift+F8, resume F9.',
  'Evaluate expression: Alt+F8 (Option+F8).': 'Evaluate expression: Alt+F8 (Option+F8).',
  'Right-click a breakpoint to add a condition, so it only stops when, for example, orderId == 42. A log message on a breakpoint prints a value without stopping or editing code.':
    'Bấm chuột phải vào breakpoint để thêm điều kiện, để nó chỉ dừng khi, ví dụ, orderId == 42. Một log message trên breakpoint sẽ in ra giá trị mà không dừng chương trình hay sửa code.',
  'Prefer a conditional breakpoint to a temporary if statement that you might forget to remove.':
    'Hãy dùng breakpoint có điều kiện thay cho một câu lệnh if tạm thời mà bạn có thể quên xóa.',
  'Which debugger command runs the current line without entering the methods it calls?':
    'Lệnh debugger nào chạy dòng hiện tại mà không đi vào bên trong các method mà nó gọi?',
  'Step into (F7)': 'Step into (F7)',
  'Step over (F8)': 'Step over (F8)',
  'Resume (F9)': 'Resume (F9)',
  'Step out (Shift+F8)': 'Step out (Shift+F8)',
  'Step over executes the line as one step. Step into would go inside the called method.':
    'Step over thực thi dòng lệnh như một bước duy nhất. Step into sẽ đi vào bên trong method được gọi.',
  'Why use the IDE’s Rename instead of find and replace?':
    'Vì sao nên dùng Rename của IDE thay vì tìm và thay thế?',
  'It is the only way to type a new name': 'Đó là cách duy nhất để gõ một cái tên mới',
  'It renames files on other computers': 'Nó đổi tên file trên các máy tính khác',
  'It removes unused code': 'Nó xóa code không dùng',
  'It updates every real usage and only those':
    'Nó cập nhật mọi chỗ dùng thật sự, và chỉ những chỗ đó',
  'The IDE understands the code, so it does not touch an unrelated variable that happens to share the name.':
    'IDE hiểu code, nên nó không đụng tới một biến không liên quan chỉ vì tình cờ trùng tên.',
  'How do you stop a breakpoint only when orderId is 42?':
    'Làm sao để breakpoint chỉ dừng khi orderId là 42?',
  'Delete the breakpoint': 'Xóa breakpoint',
  'Add System.exit(0) to the code': 'Thêm System.exit(0) vào code',
  'It cannot be done': 'Không thể làm được',
  'Right-click the breakpoint and add a condition':
    'Bấm chuột phải vào breakpoint và thêm một điều kiện',
  'A breakpoint condition is evaluated each time it is reached and only stops when it is true.':
    'Điều kiện của breakpoint được đánh giá mỗi lần chương trình chạm tới nó và chỉ dừng khi điều kiện đúng.',
  'Live templates and generating code': 'Live template và sinh code',
  'Let the IDE type the boilerplate.': 'Để IDE gõ thay bạn phần code lặp đi lặp lại.',
  'Live templates expand with Tab: fori (indexed loop), iter (for-each), sout (System.out.println), psvm (main method).':
    'Live template mở rộng bằng phím Tab: fori (vòng lặp có chỉ số), iter (for-each), sout (System.out.println), psvm (method main).',
  'Generate: Alt+Insert (Cmd+N) creates constructors, getters, equals and tests.':
    'Generate: Alt+Insert (Cmd+N) tạo constructor, getter, equals và test.',
  'Alt+Enter shows quick-fixes and context actions at the caret.':
    'Alt+Enter hiển thị quick-fix và các context action tại vị trí con trỏ.',
  'Select the next occurrence: Alt+J (Ctrl+G). Several carets: Alt+Shift+Click (Option+Shift+Click).':
    'Chọn lần xuất hiện tiếp theo: Alt+J (Ctrl+G). Nhiều con trỏ: Alt+Shift+Click (Option+Shift+Click).',
  'Comment a line: Ctrl+/ (Cmd+/). Surround with if, try or a loop: Ctrl+Alt+T (Cmd+Alt+T).':
    'Comment một dòng: Ctrl+/ (Cmd+/). Bao quanh bằng if, try hoặc vòng lặp: Ctrl+Alt+T (Cmd+Alt+T).',
  'Local History records every edit, even if you never committed. In the editor use VCS → Local History → Show History to get an old version back.':
    'Local History ghi lại mọi chỉnh sửa, kể cả khi bạn chưa từng commit. Trong editor, dùng VCS → Local History → Show History để lấy lại một phiên bản cũ.',
  'You can add your own live templates in Settings → Editor → Live Templates.':
    'Bạn có thể thêm live template của riêng mình trong Settings → Editor → Live Templates.',
  'What does typing fori and pressing Tab do?': 'Gõ fori rồi nhấn Tab sẽ làm gì?',
  'Formats the file': 'Định dạng lại file',
  'Runs the tests': 'Chạy test',
  'Expands a live template for a for loop with an index':
    'Mở rộng một live template cho vòng lặp for có chỉ số',
  'Opens the debugger': 'Mở debugger',
  'Live templates are abbreviations that expand into code with fields you fill in.':
    'Live template là các từ viết tắt mở rộng thành đoạn code có các trường để bạn điền vào.',
  'You deleted code and never committed it. Where can IntelliJ still recover it?':
    'Bạn đã xóa code và chưa từng commit. IntelliJ vẫn có thể khôi phục nó ở đâu?',
  'Only git reflog': 'Chỉ có git reflog',
  'The recycle bin': 'Thùng rác',
  'Local History': 'Local History',
  'It cannot be recovered': 'Không thể khôi phục',
  'IntelliJ keeps its own history of changes independent of Git.':
    'IntelliJ tự giữ lịch sử thay đổi của riêng nó, độc lập với Git.',
  'Which shortcut shows quick-fixes and context actions at the caret?':
    'Phím tắt nào hiển thị quick-fix và context action tại vị trí con trỏ?',
  'Ctrl+Alt+L': 'Ctrl+Alt+L',
  F8: 'F8',
  'Alt+Enter': 'Alt+Enter',
  'Alt+Enter is the “do what I mean” key: fix an error, add an import, convert a loop.':
    'Alt+Enter là phím “làm đúng ý tôi”: sửa lỗi, thêm import, chuyển đổi một vòng lặp.',
  'DevOps basics': 'DevOps cơ bản',
  'Containers, delivery pipelines and knowing what your service is doing.':
    'Container, pipeline phân phối và cách biết service của bạn đang làm gì.',
  'Docker: images and containers': 'Docker: image và container',
  'Package a Spring Boot service the right way.': 'Đóng gói một service Spring Boot đúng cách.',
  'An image is a packaged template of an application and its dependencies. A container is a running instance of an image. Containers are isolated from each other and start in seconds.':
    'Image là một mẫu đóng gói của ứng dụng cùng các dependency của nó. Container là một phiên bản đang chạy của một image. Các container được cô lập với nhau và khởi động trong vài giây.',
  'A multi-stage build: the final image has the JRE and the jar, not the build tools.':
    'Một multi-stage build: image cuối cùng chỉ có JRE và file jar, không có công cụ build.',
  'Add a .dockerignore so the build context stays small.':
    'Thêm một file .dockerignore để build context luôn nhỏ gọn.',
  'Do not bake secrets into an image; pass them at run time.':
    'Đừng nhúng secret vào image; hãy truyền chúng vào lúc chạy.',
  'docker compose up -d starts a local stack, such as your service plus a database.':
    'docker compose up -d khởi động một stack cục bộ, chẳng hạn service của bạn cộng với một database.',
  'docker logs -f <container> follows the output.':
    'docker logs -f <container> theo dõi output liên tục.',
  'Run the process as a non-root user inside the container when you can.':
    'Hãy chạy tiến trình bằng người dùng không phải root bên trong container khi có thể.',
  'What is the difference between an image and a container?':
    'Image và container khác nhau ở điểm nào?',
  'They are two names for the same thing': 'Chúng là hai tên gọi của cùng một thứ',
  'A container is a file on disk; an image is a process':
    'Container là một file trên đĩa; image là một tiến trình',
  'An image only exists on Windows': 'Image chỉ tồn tại trên Windows',
  'An image is a template; a container is a running instance of it':
    'Image là một mẫu; container là một phiên bản đang chạy của nó',
  'You can start many containers from one image.':
    'Bạn có thể khởi động nhiều container từ một image.',
  'What is the main benefit of a multi-stage build?': 'Lợi ích chính của multi-stage build là gì?',
  'The build runs without Docker': 'Quá trình build chạy mà không cần Docker',
  'The final image holds only what is needed to run, not the build tools':
    'Image cuối cùng chỉ chứa những gì cần để chạy, không có công cụ build',
  'It makes the code compile faster': 'Giúp code biên dịch nhanh hơn',
  'It encrypts the image': 'Nó mã hóa image',
  'Smaller images start faster, download faster and have less to attack.':
    'Image nhỏ hơn thì khởi động nhanh hơn, tải về nhanh hơn và có ít bề mặt bị tấn công hơn.',
  'Where should an API key for the service come from?': 'API key của service nên đến từ đâu?',
  'Injected at run time, for example an environment variable or a secrets manager':
    'Được đưa vào lúc chạy, ví dụ qua biến môi trường hoặc một secrets manager',
  'Written into the Dockerfile': 'Được ghi thẳng vào Dockerfile',
  'Committed in the source code': 'Được commit trong source code',
  'Printed in the logs': 'Được in ra trong log',
  'Anything baked into an image can be read by anyone who can pull the image.':
    'Bất cứ thứ gì nhúng vào image đều có thể bị đọc bởi bất kỳ ai pull được image đó.',
  'CI/CD pipelines': 'Pipeline CI/CD',
  'Fast feedback, safe releases.': 'Phản hồi nhanh, phát hành an toàn.',
  'Continuous integration means merging small changes often, with an automatic build and tests on each one. Continuous delivery means every change that passes is ready to release. Continuous deployment goes further and releases it automatically.':
    'Continuous integration nghĩa là merge các thay đổi nhỏ thường xuyên, với build và test tự động cho từng thay đổi. Continuous delivery nghĩa là mọi thay đổi vượt qua kiểm tra đều sẵn sàng để phát hành. Continuous deployment đi xa hơn và tự động phát hành luôn.',
  'Order jobs so the quick checks run first: build, then unit tests, then slower integration tests.':
    'Sắp xếp các job để những bước kiểm tra nhanh chạy trước: build, rồi unit test, rồi các integration test chậm hơn.',
  'Build once, then promote the same artifact through staging to production.':
    'Build một lần, rồi đưa cùng một artifact đi qua staging lên production.',
  'Make rollback easy: keep the previous version and a one-step way to redeploy it.':
    'Làm cho rollback dễ dàng: giữ lại phiên bản trước và có cách deploy lại chỉ bằng một bước.',
  'Feature flags let you ship code switched off and enable it later.':
    'Feature flag cho phép bạn đưa code lên khi đang tắt và bật nó sau.',
  'A canary release sends a small share of traffic to the new version first.':
    'Canary release gửi một phần nhỏ traffic tới phiên bản mới trước.',
  'A flaky test that people ignore is worse than no test. Fix it or delete it.':
    'Một flaky test mà mọi người cứ bỏ qua còn tệ hơn là không có test. Hãy sửa nó hoặc xóa nó.',
  'What does continuous integration mean?': 'Continuous integration nghĩa là gì?',
  'Merging small changes often, with an automatic build and tests on each one':
    'Merge các thay đổi nhỏ thường xuyên, với build và test tự động cho từng thay đổi',
  'Deploying only once a year': 'Chỉ deploy mỗi năm một lần',
  'Running tests by hand before each release': 'Chạy test bằng tay trước mỗi lần phát hành',
  'Keeping one branch per developer forever': 'Giữ mỗi lập trình viên một branch riêng mãi mãi',
  'The goal is to find integration problems within minutes, while the change is still small.':
    'Mục tiêu là phát hiện các vấn đề tích hợp trong vài phút, khi thay đổi vẫn còn nhỏ.',
  'What is a canary release?': 'Canary release là gì?',
  'Releasing to a small share of users first and watching before rolling out wider':
    'Phát hành cho một phần nhỏ người dùng trước và theo dõi rồi mới mở rộng ra',
  'Releasing only on Fridays': 'Chỉ phát hành vào thứ Sáu',
  'Releasing without tests': 'Phát hành mà không có test',
  'Releasing the old version again': 'Phát hành lại phiên bản cũ',
  'If the canary shows errors, only a few users are affected and you can roll back quickly.':
    'Nếu canary báo lỗi, chỉ một vài người dùng bị ảnh hưởng và bạn có thể rollback nhanh chóng.',
  'Which pipeline order gives the fastest feedback?':
    'Thứ tự pipeline nào cho phản hồi nhanh nhất?',
  'Run the slowest tests first': 'Chạy các test chậm nhất trước',
  'Run the quick checks, such as build and unit tests, first':
    'Chạy các bước kiểm tra nhanh trước, chẳng hạn build và unit test',
  'Deploy first, then test': 'Deploy trước, test sau',
  'Run all jobs in a random order': 'Chạy tất cả các job theo thứ tự ngẫu nhiên',
  'Failing fast means a broken change is reported in minutes instead of after the slow jobs finish.':
    'Fail fast nghĩa là một thay đổi hỏng được báo trong vài phút thay vì sau khi các job chậm chạy xong.',
  'Logs, metrics and traces': 'Log, metric và trace',
  'Know what your service is doing in production.':
    'Biết service của bạn đang làm gì trên production.',
  'Observability rests on three signals. Logs are events with detail. Metrics are numbers over time, such as requests per second. Traces follow one request through several services.':
    'Observability dựa trên ba tín hiệu. Log là các sự kiện kèm chi tiết. Metric là các con số theo thời gian, chẳng hạn số request mỗi giây. Trace theo dõi một request đi qua nhiều service.',
  'Track rate, errors and duration for every service (the RED method).':
    'Theo dõi rate, errors và duration cho mọi service (phương pháp RED).',
  'Log in a structured format and include a correlation id so one request can be followed across services.':
    'Ghi log theo định dạng có cấu trúc và kèm một correlation id để theo dõi một request xuyên qua các service.',
  'Alert on symptoms users feel, such as error rate or slow responses, rather than on every internal cause.':
    'Đặt cảnh báo theo các triệu chứng mà người dùng cảm nhận được, như tỷ lệ lỗi hay phản hồi chậm, thay vì theo từng nguyên nhân bên trong.',
  'In Spring Boot, the Actuator module exposes health and metrics endpoints.':
    'Trong Spring Boot, module Actuator cung cấp các endpoint health và metrics.',
  'Expose only the Actuator endpoints you need, and protect them.':
    'Chỉ mở những endpoint Actuator mà bạn cần, và hãy bảo vệ chúng.',
  'Never log passwords, tokens or full card numbers.':
    'Không bao giờ ghi log mật khẩu, token hay số thẻ đầy đủ.',
  'What are the three signals of observability?': 'Ba tín hiệu của observability là gì?',
  'Build, test and deploy': 'Build, test và deploy',
  'CPU, RAM and disk': 'CPU, RAM và ổ đĩa',
  'Commits, branches and tags': 'Commit, branch và tag',
  'Together they tell you what happened, how often, and where time went.':
    'Gộp lại, chúng cho bạn biết điều gì đã xảy ra, xảy ra bao nhiêu lần, và thời gian bị mất ở đâu.',
  'What does a correlation id help with?': 'Correlation id giúp ích cho việc gì?',
  'Making the database faster': 'Làm database nhanh hơn',
  'Encrypting log files': 'Mã hóa file log',
  'Following one request across several services in the logs':
    'Theo dõi một request xuyên qua nhiều service trong log',
  'Counting lines of code': 'Đếm số dòng code',
  'Every service logs the same id for a request, so you can search for it and see the whole story.':
    'Mọi service ghi cùng một id cho một request, nên bạn có thể tìm kiếm nó và thấy toàn bộ câu chuyện.',
  'Which Spring Boot module exposes health and metrics endpoints?':
    'Module Spring Boot nào cung cấp các endpoint health và metrics?',
  'Spring Batch': 'Spring Batch',
  'Spring Security': 'Spring Security',
  Actuator: 'Actuator',
  'Spring Web': 'Spring Web',
  'Spring Boot Actuator adds production-ready endpoints such as /actuator/health.':
    'Spring Boot Actuator thêm các endpoint sẵn sàng cho production, chẳng hạn /actuator/health.',
  'Create and switch in one step': 'Tạo và chuyển branch chỉ trong một bước',
  'git switch -c creates a branch and moves to it. git switch - returns to the previous branch.':
    'git switch -c tạo một branch và chuyển sang nó. git switch - quay lại branch trước đó.',
  'Unstage without losing work': 'Bỏ staged mà không mất công việc',
  'git restore --staged removes a file from the next commit but keeps your edits.':
    'git restore --staged đưa một file ra khỏi commit tiếp theo nhưng vẫn giữ nguyên các chỉnh sửa của bạn.',
  'Fix the last commit': 'Sửa commit cuối cùng',
  'Forgot a file or made a typo in the message? Amend the commit, but only if you have not pushed it.':
    'Quên một file hoặc gõ sai trong message? Hãy amend commit, nhưng chỉ khi bạn chưa push nó.',
  'See the shape of history': 'Nhìn thấy hình dạng của lịch sử',
  'A compact graph of branches makes it easy to see where things diverged.':
    'Một đồ thị gọn của các branch giúp bạn dễ thấy chỗ chúng rẽ nhánh.',
  'Name your stashes': 'Đặt tên cho các stash',
  'A message makes a stash easy to find when you have several.':
    'Một message giúp dễ tìm lại stash khi bạn có nhiều stash.',
  'Nothing is lost for a while': 'Chưa mất gì trong một thời gian',
  'The reflog lists where HEAD has been. It can bring back commits after a bad reset.':
    'Reflog liệt kê những nơi HEAD đã đi qua. Nó có thể đưa các commit trở lại sau một lần reset sai.',
  'Review what you are about to commit': 'Xem lại những gì bạn sắp commit',
  'git diff shows unstaged changes. Add --staged to see exactly what the next commit contains.':
    'git diff cho thấy các thay đổi chưa staged. Thêm --staged để thấy chính xác commit tiếp theo chứa gì.',
  'Blame only the lines you care about': 'Chỉ blame những dòng bạn quan tâm',
  'Limit blame to a range of lines to see who last changed them and why.':
    'Giới hạn blame trong một khoảng dòng để xem ai đã sửa chúng lần cuối và vì sao.',
  'Pull without merge commits': 'Pull mà không tạo merge commit',
  'Rebasing your local commits on top of the remote keeps history linear.':
    'Rebase các commit cục bộ của bạn lên trên remote giúp lịch sử luôn thẳng hàng.',
  'Force-push more safely': 'Force-push an toàn hơn',
  'After rewriting your own branch, --force-with-lease refuses to overwrite commits you have not seen.':
    'Sau khi viết lại branch của chính bạn, --force-with-lease từ chối ghi đè các commit mà bạn chưa thấy.',
  'Preview before deleting': 'Xem trước khi xóa',
  'git clean removes untracked files for good. Run it with -n first to see what it would delete.':
    'git clean xóa vĩnh viễn các file chưa được theo dõi. Hãy chạy với -n trước để xem nó sẽ xóa những gì.',
  'Resolve the same conflict once': 'Giải quyết cùng một xung đột chỉ một lần',
  'rerere remembers how you resolved a conflict and applies it again when it recurs, for example during repeated rebases.':
    'rerere ghi nhớ cách bạn đã giải quyết một xung đột và áp dụng lại khi nó xuất hiện lần nữa, chẳng hạn trong các lần rebase lặp lại.',
  'Tidy old branches': 'Dọn các branch cũ',
  'List the branches already merged into main, then delete the ones you no longer need.':
    'Liệt kê các branch đã được merge vào main, rồi xóa những branch bạn không còn cần.',
  'Binary-search a bug': 'Tìm lỗi bằng tìm kiếm nhị phân',
  'Give Git a good and a bad commit, and it finds the first bad one in a handful of steps.':
    'Cho Git một commit tốt và một commit lỗi, nó sẽ tìm ra commit lỗi đầu tiên chỉ sau vài bước.',
  'Mark a commit to be squashed': 'Đánh dấu một commit để squash',
  'A fixup commit joins an earlier commit during an autosquash rebase, so history stays clean.':
    'Một fixup commit sẽ nhập vào một commit trước đó trong lúc autosquash rebase, nên lịch sử luôn gọn gàng.',
  'Search Everywhere': 'Search Everywhere',
  'Press Shift twice to find files, classes, symbols and settings from one box.':
    'Nhấn Shift hai lần để tìm file, class, symbol và cài đặt từ một ô duy nhất.',
  'Find Action': 'Find Action',
  'Forgot where a command lives? Search it by name, and the shortcut is shown next to it.':
    'Quên một lệnh nằm ở đâu? Hãy tìm nó theo tên, và phím tắt sẽ hiển thị ngay cạnh.',
  'Recent files': 'Recent files',
  'Jump between the files you are working on without searching.':
    'Nhảy giữa các file bạn đang làm việc mà không cần tìm kiếm.',
  'Alt+Enter fixes a lot': 'Alt+Enter sửa được rất nhiều thứ',
  'On an error or a warning, Alt+Enter offers fixes: add an import, create a method, convert a loop to a stream.':
    'Trên một lỗi hoặc cảnh báo, Alt+Enter đưa ra các cách sửa: thêm import, tạo method, chuyển một vòng lặp thành stream.',
  'Rename safely': 'Đổi tên an toàn',
  'The IDE’s rename updates every real usage, including in tests and comments if you tick the options.':
    'Rename của IDE cập nhật mọi chỗ dùng thật sự, kể cả trong test và comment nếu bạn tick các tùy chọn.',
  'Extract method': 'Extract method',
  'Select a block of code and extract it to a new method. The IDE finds the parameters for you.':
    'Chọn một khối code và trích xuất nó thành một method mới. IDE tự tìm các tham số giúp bạn.',
  'Reformat on the way out': 'Reformat trước khi commit',
  'Reformat the file and optimise imports before you commit, so diffs stay about real changes.':
    'Reformat file và optimize import trước khi commit, để diff chỉ tập trung vào những thay đổi thật sự.',
  'Evaluate while debugging': 'Đánh giá biểu thức khi debug',
  'While stopped at a breakpoint, evaluate any expression, even one that calls methods, without editing code.':
    'Khi đang dừng ở một breakpoint, hãy đánh giá bất kỳ biểu thức nào, kể cả biểu thức có gọi method, mà không cần sửa code.',
  'Conditional breakpoints': 'Breakpoint có điều kiện',
  'Right-click a breakpoint to stop only when a condition is true, such as userId == 42.':
    'Bấm chuột phải vào breakpoint để chỉ dừng khi một điều kiện đúng, chẳng hạn userId == 42.',
  'IntelliJ keeps its own history of edits. Use it to recover code you never committed.':
    'IntelliJ tự giữ lịch sử chỉnh sửa của riêng nó. Hãy dùng nó để khôi phục code mà bạn chưa từng commit.',
  'Select the next occurrence': 'Chọn lần xuất hiện tiếp theo',
  'Select a word and add the next match as another caret to edit them together.':
    'Chọn một từ và thêm kết quả khớp tiếp theo làm một con trỏ nữa để sửa chúng cùng lúc.',
  'Generate boilerplate': 'Sinh code lặp',
  'Constructors, getters, equals and hashCode, and test classes can be generated in a keystroke.':
    'Constructor, getter, equals và hashCode, và các class test có thể được sinh ra chỉ với một tổ hợp phím.',
  'Follow container logs': 'Theo dõi log của container',
  'Stream the output of a running container, starting from the last lines.':
    'Xem liên tục output của một container đang chạy, bắt đầu từ những dòng cuối.',
  'Start a local stack': 'Khởi động một stack cục bộ',
  'Docker Compose starts your service and its database together from one file.':
    'Docker Compose khởi động service của bạn và database của nó cùng lúc từ một file.',
  'Use a .dockerignore': 'Dùng .dockerignore',
  'List target/, .git and node_modules so they are not sent to the build, which makes builds faster and images smaller.':
    'Liệt kê target/, .git và node_modules để chúng không bị gửi vào quá trình build, giúp build nhanh hơn và image nhỏ hơn.',
  'Multi-stage builds': 'Multi-stage build',
  'Build in one stage and copy only the result into a small runtime image. The build tools stay out of production.':
    'Build ở một stage rồi chỉ sao chép kết quả vào một runtime image nhỏ. Các công cụ build không đi lên production.',
  'What is wrong with that pod?': 'Pod đó bị làm sao?',
  'describe shows events such as image pull errors and failed probes. logs shows the application output.':
    'describe hiển thị các sự kiện như lỗi pull image và probe thất bại. logs hiển thị output của ứng dụng.',
  'Health endpoints': 'Health endpoint',
  'Expose a health endpoint, such as Spring Boot Actuator’s /actuator/health, so load balancers and orchestrators can tell when to restart or route traffic.':
    'Hãy mở một health endpoint, chẳng hạn /actuator/health của Spring Boot Actuator, để load balancer và orchestrator biết khi nào cần restart hoặc điều hướng traffic.',
  'See headers and status': 'Xem header và status',
  'curl -i prints the response headers with the body, which is handy when debugging an API.':
    'curl -i in header của response cùng với body, rất tiện khi debug một API.',
  'Search a project': 'Tìm kiếm trong một dự án',
  'Search all files for text, with line numbers. Add -i to ignore case.':
    'Tìm văn bản trong tất cả các file, kèm số dòng. Thêm -i để bỏ qua chữ hoa chữ thường.',
  'Read JSON in the terminal': 'Đọc JSON trong terminal',
  'jq formats and filters JSON, which makes API responses readable.':
    'jq định dạng và lọc JSON, giúp các response của API dễ đọc hơn.',
  'Search your command history': 'Tìm trong lịch sử lệnh của bạn',
  'In most shells, Ctrl+R searches earlier commands as you type.':
    'Ở hầu hết các shell, Ctrl+R tìm các lệnh trước đó khi bạn gõ.',
  'Try Java without a project': 'Thử Java mà không cần dự án',
  'jshell is a Java REPL: test a stream pipeline or an API call in seconds.':
    'jshell là một Java REPL: thử một stream pipeline hoặc một lời gọi API chỉ trong vài giây.',
  'A stuck JVM?': 'JVM bị treo?',
  'Take a thread dump to see what every thread is doing, then look for threads that are BLOCKED or waiting on the same lock.':
    'Lấy một thread dump để xem mỗi thread đang làm gì, rồi tìm các thread đang BLOCKED hoặc đang chờ cùng một lock.',
  'Turn on GC logging': 'Bật GC logging',
  'GC logs cost almost nothing and help a lot when diagnosing memory or pause problems.':
    'GC log gần như không tốn gì và giúp ích rất nhiều khi chẩn đoán vấn đề bộ nhớ hoặc thời gian dừng.',
  'Why is that library on my classpath?': 'Vì sao thư viện đó có trên classpath của tôi?',
  'The dependency tree shows which dependency pulls in which library, so you can find and exclude conflicts.':
    'Dependency tree cho biết dependency nào kéo theo thư viện nào, để bạn tìm ra và loại trừ các xung đột.',
  'Package without running tests': 'Đóng gói mà không chạy test',
  'When you only need the jar, skip the tests. Run them in CI.':
    'Khi bạn chỉ cần file jar, hãy bỏ qua test. Chạy chúng trong CI.',
  Git: 'Git',
  IntelliJ: 'IntelliJ',
  DevOps: 'DevOps',
  Shell: 'Shell',
  'Java & Maven': 'Java & Maven',
};
