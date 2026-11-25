import { diffDays } from '@/core/time/localDate';

export type TipCategory = 'git' | 'intellij' | 'devops' | 'shell' | 'java';

export interface Tip {
  id: string;
  category: TipCategory;
  title: string;
  text: string;
  /** A command or shortcut to try. */
  example?: string;
}

export const TIP_LABELS: Record<TipCategory, string> = {
  git: 'Git',
  intellij: 'IntelliJ',
  devops: 'DevOps',
  shell: 'Shell',
  java: 'Java & Maven',
};

/** Bundled tips: one is shown per day, so the Daily Developer Tip works offline. */
export const TIPS: readonly Tip[] = [
  {
    id: 'git-switch',
    category: 'git',
    title: 'Create and switch in one step',
    text: 'git switch -c creates a branch and moves to it. git switch - returns to the previous branch.',
    example: 'git switch -c feature/search',
  },
  {
    id: 'git-unstage',
    category: 'git',
    title: 'Unstage without losing work',
    text: 'git restore --staged removes a file from the next commit but keeps your edits.',
    example: 'git restore --staged app.js',
  },
  {
    id: 'git-amend',
    category: 'git',
    title: 'Fix the last commit',
    text: 'Forgot a file or made a typo in the message? Amend the commit, but only if you have not pushed it.',
    example: 'git commit --amend --no-edit',
  },
  {
    id: 'git-graph',
    category: 'git',
    title: 'See the shape of history',
    text: 'A compact graph of branches makes it easy to see where things diverged.',
    example: 'git log --oneline --graph --decorate --all',
  },
  {
    id: 'git-stash-msg',
    category: 'git',
    title: 'Name your stashes',
    text: 'A message makes a stash easy to find when you have several.',
    example: 'git stash push -m "wip: login form"',
  },
  {
    id: 'git-reflog',
    category: 'git',
    title: 'Nothing is lost for a while',
    text: 'The reflog lists where HEAD has been. It can bring back commits after a bad reset.',
    example: 'git reflog',
  },
  {
    id: 'git-diff-staged',
    category: 'git',
    title: 'Review what you are about to commit',
    text: 'git diff shows unstaged changes. Add --staged to see exactly what the next commit contains.',
    example: 'git diff --staged',
  },
  {
    id: 'git-blame-range',
    category: 'git',
    title: 'Blame only the lines you care about',
    text: 'Limit blame to a range of lines to see who last changed them and why.',
    example: 'git blame -L 10,30 src/App.java',
  },
  {
    id: 'git-pull-rebase',
    category: 'git',
    title: 'Pull without merge commits',
    text: 'Rebasing your local commits on top of the remote keeps history linear.',
    example: 'git pull --rebase',
  },
  {
    id: 'git-lease',
    category: 'git',
    title: 'Force-push more safely',
    text: 'After rewriting your own branch, --force-with-lease refuses to overwrite commits you have not seen.',
    example: 'git push --force-with-lease',
  },
  {
    id: 'git-clean-dry',
    category: 'git',
    title: 'Preview before deleting',
    text: 'git clean removes untracked files for good. Run it with -n first to see what it would delete.',
    example: 'git clean -n',
  },
  {
    id: 'git-rerere',
    category: 'git',
    title: 'Resolve the same conflict once',
    text: 'rerere remembers how you resolved a conflict and applies it again when it recurs, for example during repeated rebases.',
    example: 'git config --global rerere.enabled true',
  },
  {
    id: 'git-merged',
    category: 'git',
    title: 'Tidy old branches',
    text: 'List the branches already merged into main, then delete the ones you no longer need.',
    example: 'git branch --merged main',
  },
  {
    id: 'git-bisect',
    category: 'git',
    title: 'Binary-search a bug',
    text: 'Give Git a good and a bad commit, and it finds the first bad one in a handful of steps.',
    example: 'git bisect start; git bisect bad; git bisect good v1.0',
  },
  {
    id: 'git-fixup',
    category: 'git',
    title: 'Mark a commit to be squashed',
    text: 'A fixup commit joins an earlier commit during an autosquash rebase, so history stays clean.',
    example: 'git commit --fixup <sha>',
  },
  {
    id: 'ij-search',
    category: 'intellij',
    title: 'Search Everywhere',
    text: 'Press Shift twice to find files, classes, symbols and settings from one box.',
    example: 'Shift Shift',
  },
  {
    id: 'ij-action',
    category: 'intellij',
    title: 'Find Action',
    text: 'Forgot where a command lives? Search it by name, and the shortcut is shown next to it.',
    example: 'Ctrl+Shift+A (Cmd+Shift+A)',
  },
  {
    id: 'ij-recent',
    category: 'intellij',
    title: 'Recent files',
    text: 'Jump between the files you are working on without searching.',
    example: 'Ctrl+E (Cmd+E)',
  },
  {
    id: 'ij-alt-enter',
    category: 'intellij',
    title: 'Alt+Enter fixes a lot',
    text: 'On an error or a warning, Alt+Enter offers fixes: add an import, create a method, convert a loop to a stream.',
    example: 'Alt+Enter',
  },
  {
    id: 'ij-rename',
    category: 'intellij',
    title: 'Rename safely',
    text: 'The IDE’s rename updates every real usage, including in tests and comments if you tick the options.',
    example: 'Shift+F6',
  },
  {
    id: 'ij-extract',
    category: 'intellij',
    title: 'Extract method',
    text: 'Select a block of code and extract it to a new method. The IDE finds the parameters for you.',
    example: 'Ctrl+Alt+M (Cmd+Alt+M)',
  },
  {
    id: 'ij-reformat',
    category: 'intellij',
    title: 'Reformat on the way out',
    text: 'Reformat the file and optimise imports before you commit, so diffs stay about real changes.',
    example: 'Ctrl+Alt+L, Ctrl+Alt+O',
  },
  {
    id: 'ij-evaluate',
    category: 'intellij',
    title: 'Evaluate while debugging',
    text: 'While stopped at a breakpoint, evaluate any expression, even one that calls methods, without editing code.',
    example: 'Alt+F8 (Option+F8)',
  },
  {
    id: 'ij-conditional',
    category: 'intellij',
    title: 'Conditional breakpoints',
    text: 'Right-click a breakpoint to stop only when a condition is true, such as userId == 42.',
  },
  {
    id: 'ij-local-history',
    category: 'intellij',
    title: 'Local History',
    text: 'IntelliJ keeps its own history of edits. Use it to recover code you never committed.',
    example: 'VCS → Local History → Show History',
  },
  {
    id: 'ij-multi-caret',
    category: 'intellij',
    title: 'Select the next occurrence',
    text: 'Select a word and add the next match as another caret to edit them together.',
    example: 'Alt+J (Ctrl+G)',
  },
  {
    id: 'ij-generate',
    category: 'intellij',
    title: 'Generate boilerplate',
    text: 'Constructors, getters, equals and hashCode, and test classes can be generated in a keystroke.',
    example: 'Alt+Insert (Cmd+N)',
  },
  {
    id: 'dk-logs',
    category: 'devops',
    title: 'Follow container logs',
    text: 'Stream the output of a running container, starting from the last lines.',
    example: 'docker logs -f --tail 100 <container>',
  },
  {
    id: 'dk-compose',
    category: 'devops',
    title: 'Start a local stack',
    text: 'Docker Compose starts your service and its database together from one file.',
    example: 'docker compose up -d',
  },
  {
    id: 'dk-ignore',
    category: 'devops',
    title: 'Use a .dockerignore',
    text: 'List target/, .git and node_modules so they are not sent to the build, which makes builds faster and images smaller.',
  },
  {
    id: 'dk-multistage',
    category: 'devops',
    title: 'Multi-stage builds',
    text: 'Build in one stage and copy only the result into a small runtime image. The build tools stay out of production.',
  },
  {
    id: 'k8s-pods',
    category: 'devops',
    title: 'What is wrong with that pod?',
    text: 'describe shows events such as image pull errors and failed probes. logs shows the application output.',
    example: 'kubectl describe pod <name>; kubectl logs <name>',
  },
  {
    id: 'devops-health',
    category: 'devops',
    title: 'Health endpoints',
    text: 'Expose a health endpoint, such as Spring Boot Actuator’s /actuator/health, so load balancers and orchestrators can tell when to restart or route traffic.',
  },
  {
    id: 'sh-curl',
    category: 'shell',
    title: 'See headers and status',
    text: 'curl -i prints the response headers with the body, which is handy when debugging an API.',
    example: 'curl -i https://example.com/api/health',
  },
  {
    id: 'sh-grep',
    category: 'shell',
    title: 'Search a project',
    text: 'Search all files for text, with line numbers. Add -i to ignore case.',
    example: 'grep -rn "OrderService" src/',
  },
  {
    id: 'sh-jq',
    category: 'shell',
    title: 'Read JSON in the terminal',
    text: 'jq formats and filters JSON, which makes API responses readable.',
    example: 'curl -s https://example.com/api/users | jq ".[0].name"',
  },
  {
    id: 'sh-history',
    category: 'shell',
    title: 'Search your command history',
    text: 'In most shells, Ctrl+R searches earlier commands as you type.',
    example: 'Ctrl+R',
  },
  {
    id: 'java-jshell',
    category: 'java',
    title: 'Try Java without a project',
    text: 'jshell is a Java REPL: test a stream pipeline or an API call in seconds.',
    example: 'jshell',
  },
  {
    id: 'java-threaddump',
    category: 'java',
    title: 'A stuck JVM?',
    text: 'Take a thread dump to see what every thread is doing, then look for threads that are BLOCKED or waiting on the same lock.',
    example: 'jcmd <pid> Thread.print',
  },
  {
    id: 'java-gclog',
    category: 'java',
    title: 'Turn on GC logging',
    text: 'GC logs cost almost nothing and help a lot when diagnosing memory or pause problems.',
    example: 'java -Xlog:gc -jar app.jar',
  },
  {
    id: 'mvn-tree',
    category: 'java',
    title: 'Why is that library on my classpath?',
    text: 'The dependency tree shows which dependency pulls in which library, so you can find and exclude conflicts.',
    example: './mvnw dependency:tree',
  },
  {
    id: 'mvn-fast',
    category: 'java',
    title: 'Package without running tests',
    text: 'When you only need the jar, skip the tests. Run them in CI.',
    example: './mvnw -q package -DskipTests',
  },
];

/** The tip for a calendar day. Stable all day, and cycles through every tip. */
export function tipForDate(localDate: string): Tip {
  const days = diffDays('2026-01-01', localDate);
  const index = ((days % TIPS.length) + TIPS.length) % TIPS.length;
  return TIPS[index] as Tip;
}
