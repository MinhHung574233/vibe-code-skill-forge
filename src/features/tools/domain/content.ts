import { question as q, type Path } from '@/features/learning/domain/learning';

/** Developer Tools lessons: Git and GitLab, IntelliJ IDEA, and DevOps basics. */
export const TOOLS_PATHS: readonly Path[] = [
  {
    id: 'git-gitlab',
    title: 'Git and GitLab',
    summary: 'Branching, undoing mistakes safely, and the merge request workflow.',
    level: 'intermediate',
    lessons: [
      {
        id: 'git-branching',
        title: 'Branches, merge and rebase',
        minutes: 5,
        summary: 'Keep a feature branch up to date without making a mess.',
        blocks: [
          {
            kind: 'p',
            text: 'A branch is a cheap, movable pointer to a commit. You create one for each piece of work so main stays releasable.',
          },
          {
            kind: 'p',
            text: 'To bring in new work from main you can merge it, which adds a merge commit and keeps history as it happened, or rebase, which replays your commits on top of the latest main for a straight history.',
          },
          {
            kind: 'code',
            code: `git switch -c feature/login
git fetch origin
git rebase origin/main        # replay your commits on the latest main
git push --force-with-lease   # only for a branch that only you use`,
          },
          {
            kind: 'list',
            items: [
              'Never rebase commits that other people have already pulled.',
              'Resolve conflicts, then git add the files and git rebase --continue.',
              '--force-with-lease refuses to overwrite remote commits you have not seen.',
            ],
          },
          {
            kind: 'tip',
            text: 'git pull --rebase keeps your local commits on top instead of creating a merge commit.',
          },
        ],
        quiz: [
          q(
            'Which command replays your branch on top of the latest main?',
            'git rebase origin/main',
            ['git reset --hard origin/main', 'git clean -fd', 'git stash'],
            'rebase re-applies your commits one by one onto the new base. reset --hard would throw your commits away.',
          ),
          q(
            'When should you avoid rebasing?',
            'On commits that other people have already pulled',
            [
              'On a private feature branch',
              'Before opening a merge request on your own branch',
              'On a branch with a single commit',
            ],
            'Rebasing rewrites commits. If others based work on the old ones, their history and yours diverge.',
          ),
          q(
            'Why is --force-with-lease safer than --force?',
            'It refuses to overwrite remote commits you have not seen',
            ['It is faster', 'It also runs the tests', 'It works without a remote'],
            'If someone pushed in the meantime, the lease check fails instead of silently deleting their work.',
          ),
        ],
      },
      {
        id: 'git-undo',
        title: 'Undoing mistakes safely',
        minutes: 6,
        summary: 'restore, amend, revert, reset and reflog.',
        blocks: [
          {
            kind: 'p',
            text: 'Almost everything in Git can be undone, but the right tool depends on where the mistake is: in the working tree, the staging area, a local commit or a pushed commit.',
          },
          {
            kind: 'code',
            code: `git restore --staged app.js     # unstage a file (keeps your edits)
git restore app.js              # discard edits in the file (cannot be undone)
git commit --amend              # fix the last local commit
git revert 3f2a9c1              # undo a pushed commit with a new commit
git reflog                      # find a commit you lost, then git switch -c rescue <sha>`,
          },
          {
            kind: 'list',
            items: [
              'reset --soft moves the branch and keeps changes staged.',
              'reset --mixed (the default) keeps changes but unstages them.',
              'reset --hard also throws the changes away.',
              'Use revert, not reset, for commits that are already shared.',
            ],
          },
          {
            kind: 'tip',
            text: 'The reflog records where HEAD has been for about 90 days, so a "lost" commit is usually recoverable.',
          },
        ],
        quiz: [
          q(
            'A wrong commit is already pushed to main. What is the safe way to undo it?',
            'git revert <sha>, which adds a new commit that cancels it',
            ['git reset --hard and force-push main', 'Delete the .git folder', 'git clean -fd'],
            'Revert does not rewrite shared history, so nobody else has to repair their copy.',
          ),
          q(
            'Which command shows where HEAD has been, so you can recover lost commits?',
            'git reflog',
            ['git blame', 'git remote -v', 'git tag'],
            'The reflog lists the previous positions of HEAD and branches.',
          ),
          q(
            'What does git reset --hard do to uncommitted changes?',
            'Discards them',
            ['Stashes them safely', 'Commits them', 'Moves them to a new branch'],
            'Uncommitted changes are not in any commit, so --hard overwrites them with no way back.',
          ),
        ],
      },
      {
        id: 'git-stash-pick',
        title: 'Stash, cherry-pick and bisect',
        minutes: 5,
        summary: 'Three commands for awkward moments.',
        blocks: [
          {
            kind: 'p',
            text: 'git stash puts your uncommitted work aside so you can switch task. git cherry-pick copies a single commit onto the current branch. git bisect finds the commit that introduced a bug by binary search.',
          },
          {
            kind: 'code',
            code: `git stash push -m "wip login form"
git switch main
# ...fix something, then come back
git switch feature/login
git stash pop

git cherry-pick 3f2a9c1        # take one fix from another branch

git bisect start
git bisect bad                 # current commit is broken
git bisect good v1.4.0         # this older tag was fine
# Git checks out the middle: test it, then mark: git bisect good / bad
git bisect reset               # finished`,
          },
          {
            kind: 'tip',
            text: 'Use git stash list to see what you stashed. A named stash is easier to find later than an anonymous one.',
          },
        ],
        quiz: [
          q(
            'What does git stash push do?',
            'Saves uncommitted changes and gives you a clean working tree',
            [
              'Commits everything to main',
              'Deletes your changes',
              'Pushes your branch to the remote',
            ],
            'The changes are stored in a stash entry. git stash pop brings them back.',
          ),
          q(
            'You need one fix from another branch without merging everything. What do you use?',
            'git cherry-pick <sha>',
            ['git merge --abort', 'git bisect', 'git revert --all'],
            'Cherry-pick applies the changes of one chosen commit as a new commit on your branch.',
          ),
          q(
            'What does git bisect find?',
            'The commit that introduced a bug, by binary search through history',
            [
              'The largest file in the repository',
              'Unused branches',
              'The author with the most commits',
            ],
            'You tell Git a good and a bad commit, and it halves the range each time you test one.',
          ),
        ],
      },
      {
        id: 'gitlab-mr',
        title: 'The GitLab merge request workflow',
        minutes: 5,
        summary: 'From branch to merged, with a pipeline in between.',
        blocks: [
          {
            kind: 'p',
            text: 'The usual flow is: create a branch, push it, open a merge request (MR), let the pipeline run, get a review, resolve the comments, and merge once the pipeline is green.',
          },
          {
            kind: 'code',
            code: `stages: [build, test]

build:
  stage: build
  script:
    - ./mvnw -q package -DskipTests

test:
  stage: test
  script:
    - ./mvnw -q test`,
            caption: 'A minimal .gitlab-ci.yml at the root of the repository.',
          },
          {
            kind: 'list',
            items: [
              'Keep merge requests small: they are reviewed faster and break less.',
              'Write what and why in the description, and link the issue.',
              'Prefix the title with Draft: while it is not ready to merge but you want feedback.',
              'Resolve every discussion thread before merging.',
            ],
          },
          {
            kind: 'tip',
            text: 'Read your own diff in the MR page before asking anyone to review it.',
          },
        ],
        quiz: [
          q(
            'Which file defines a GitLab CI/CD pipeline?',
            '.gitlab-ci.yml',
            ['pipeline.json', 'gitlab.properties', 'build.gradle'],
            'GitLab looks for .gitlab-ci.yml in the root of the repository.',
          ),
          q(
            'Why keep merge requests small?',
            'They are easier and faster to review, and safer to merge',
            [
              'GitLab refuses large ones',
              'Small MRs skip the pipeline',
              'It reduces the number of commits needed',
            ],
            'A reviewer can understand a small change fully, so problems are found before they ship.',
          ),
          q(
            'What does a Draft merge request signal?',
            'It is not ready to merge, but you want early feedback',
            ['It has already been merged', 'It cannot be reviewed', 'It will be deleted tomorrow'],
            'Draft MRs cannot be merged until the Draft prefix is removed, so teammates know the state at a glance.',
          ),
        ],
      },
    ],
  },
  {
    id: 'intellij',
    title: 'IntelliJ IDEA',
    summary:
      'Move around, refactor and debug faster. Shortcuts are Windows/Linux, with macOS in brackets.',
    level: 'beginner',
    lessons: [
      {
        id: 'idea-navigation',
        title: 'Navigating code quickly',
        minutes: 4,
        summary: 'Find any file, class or action without touching the mouse.',
        blocks: [
          {
            kind: 'list',
            items: [
              'Search Everywhere: press Shift twice.',
              'Go to class: Ctrl+N (Cmd+O). Go to file: Ctrl+Shift+N (Cmd+Shift+O).',
              'Find action by name: Ctrl+Shift+A (Cmd+Shift+A).',
              'Recent files: Ctrl+E (Cmd+E).',
              'Go to declaration: Ctrl+B (Cmd+B). Go to implementation: Ctrl+Alt+B (Cmd+Alt+B).',
              'Find usages: Alt+F7 (Option+F7).',
              'Back and forward: Ctrl+Alt+Left / Right (Cmd+[ and Cmd+]).',
            ],
          },
          {
            kind: 'p',
            text: 'Camel-case search works everywhere: typing OrdSer finds OrderService. If you forget a shortcut, Find action will show it next to the command.',
          },
          {
            kind: 'tip',
            text: 'Use Ctrl+E to jump between the few files you are editing, instead of searching each time.',
          },
        ],
        quiz: [
          q(
            'Which input opens Search Everywhere?',
            'Press Shift twice',
            ['Press Ctrl twice', 'Press Alt+F4', 'Press Ctrl+Z'],
            'Double Shift searches files, classes, symbols and actions. Double Ctrl opens Run Anything instead.',
          ),
          q(
            'Which shortcut runs a command by typing its name?',
            'Ctrl+Shift+A (Cmd+Shift+A), Find Action',
            ['Ctrl+B (Cmd+B)', 'Alt+F7', 'Ctrl+E (Cmd+E)'],
            'Find Action works like a command palette and shows the shortcut of the command.',
          ),
          q(
            'You are on an interface method and want its implementation. What do you press?',
            'Ctrl+Alt+B (Cmd+Alt+B)',
            ['Shift+F6', 'Ctrl+Alt+L (Cmd+Alt+L)', 'F9'],
            'Go to implementation jumps from the interface to the classes that implement it.',
          ),
        ],
      },
      {
        id: 'idea-refactor-debug',
        title: 'Refactoring and debugging',
        minutes: 6,
        summary: 'Safe renames, extractions and the debugger controls.',
        blocks: [
          {
            kind: 'list',
            items: [
              'Rename: Shift+F6. It updates every real usage, and only those.',
              'Extract method: Ctrl+Alt+M (Cmd+Alt+M). Extract variable: Ctrl+Alt+V (Cmd+Alt+V).',
              'Reformat code: Ctrl+Alt+L (Cmd+Alt+L). Optimise imports: Ctrl+Alt+O (Ctrl+Option+O).',
              'Debug: click the gutter to set a breakpoint, then Shift+F9.',
              'Step over F8, step into F7, step out Shift+F8, resume F9.',
              'Evaluate expression: Alt+F8 (Option+F8).',
            ],
          },
          {
            kind: 'p',
            text: 'Right-click a breakpoint to add a condition, so it only stops when, for example, orderId == 42. A log message on a breakpoint prints a value without stopping or editing code.',
          },
          {
            kind: 'tip',
            text: 'Prefer a conditional breakpoint to a temporary if statement that you might forget to remove.',
          },
        ],
        quiz: [
          q(
            'Which debugger command runs the current line without entering the methods it calls?',
            'Step over (F8)',
            ['Step into (F7)', 'Resume (F9)', 'Step out (Shift+F8)'],
            'Step over executes the line as one step. Step into would go inside the called method.',
          ),
          q(
            'Why use the IDE’s Rename instead of find and replace?',
            'It updates every real usage and only those',
            [
              'It is the only way to type a new name',
              'It renames files on other computers',
              'It removes unused code',
            ],
            'The IDE understands the code, so it does not touch an unrelated variable that happens to share the name.',
          ),
          q(
            'How do you stop a breakpoint only when orderId is 42?',
            'Right-click the breakpoint and add a condition',
            ['Delete the breakpoint', 'Add System.exit(0) to the code', 'It cannot be done'],
            'A breakpoint condition is evaluated each time it is reached and only stops when it is true.',
          ),
        ],
      },
      {
        id: 'idea-productivity',
        title: 'Live templates and generating code',
        minutes: 4,
        summary: 'Let the IDE type the boilerplate.',
        blocks: [
          {
            kind: 'list',
            items: [
              'Live templates expand with Tab: fori (indexed loop), iter (for-each), sout (System.out.println), psvm (main method).',
              'Generate: Alt+Insert (Cmd+N) creates constructors, getters, equals and tests.',
              'Alt+Enter shows quick-fixes and context actions at the caret.',
              'Select the next occurrence: Alt+J (Ctrl+G). Several carets: Alt+Shift+Click (Option+Shift+Click).',
              'Comment a line: Ctrl+/ (Cmd+/). Surround with if, try or a loop: Ctrl+Alt+T (Cmd+Alt+T).',
            ],
          },
          {
            kind: 'p',
            text: 'Local History records every edit, even if you never committed. In the editor use VCS → Local History → Show History to get an old version back.',
          },
          {
            kind: 'tip',
            text: 'You can add your own live templates in Settings → Editor → Live Templates.',
          },
        ],
        quiz: [
          q(
            'What does typing fori and pressing Tab do?',
            'Expands a live template for a for loop with an index',
            ['Formats the file', 'Runs the tests', 'Opens the debugger'],
            'Live templates are abbreviations that expand into code with fields you fill in.',
          ),
          q(
            'You deleted code and never committed it. Where can IntelliJ still recover it?',
            'Local History',
            ['Only git reflog', 'The recycle bin', 'It cannot be recovered'],
            'IntelliJ keeps its own history of changes independent of Git.',
          ),
          q(
            'Which shortcut shows quick-fixes and context actions at the caret?',
            'Alt+Enter',
            ['Ctrl+Alt+L', 'Shift+F6', 'F8'],
            'Alt+Enter is the “do what I mean” key: fix an error, add an import, convert a loop.',
          ),
        ],
      },
    ],
  },
  {
    id: 'devops-basics',
    title: 'DevOps basics',
    summary: 'Containers, delivery pipelines and knowing what your service is doing.',
    level: 'intermediate',
    lessons: [
      {
        id: 'docker-basics',
        title: 'Docker: images and containers',
        minutes: 6,
        summary: 'Package a Spring Boot service the right way.',
        blocks: [
          {
            kind: 'p',
            text: 'An image is a packaged template of an application and its dependencies. A container is a running instance of an image. Containers are isolated from each other and start in seconds.',
          },
          {
            kind: 'code',
            code: `FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY . .
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre
COPY --from=build /src/target/app.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]`,
            caption:
              'A multi-stage build: the final image has the JRE and the jar, not the build tools.',
          },
          {
            kind: 'list',
            items: [
              'Add a .dockerignore so the build context stays small.',
              'Do not bake secrets into an image; pass them at run time.',
              'docker compose up -d starts a local stack, such as your service plus a database.',
              'docker logs -f <container> follows the output.',
            ],
          },
          {
            kind: 'tip',
            text: 'Run the process as a non-root user inside the container when you can.',
          },
        ],
        quiz: [
          q(
            'What is the difference between an image and a container?',
            'An image is a template; a container is a running instance of it',
            [
              'They are two names for the same thing',
              'A container is a file on disk; an image is a process',
              'An image only exists on Windows',
            ],
            'You can start many containers from one image.',
          ),
          q(
            'What is the main benefit of a multi-stage build?',
            'The final image holds only what is needed to run, not the build tools',
            [
              'The build runs without Docker',
              'It makes the code compile faster',
              'It encrypts the image',
            ],
            'Smaller images start faster, download faster and have less to attack.',
          ),
          q(
            'Where should an API key for the service come from?',
            'Injected at run time, for example an environment variable or a secrets manager',
            ['Written into the Dockerfile', 'Committed in the source code', 'Printed in the logs'],
            'Anything baked into an image can be read by anyone who can pull the image.',
          ),
        ],
      },
      {
        id: 'ci-cd',
        title: 'CI/CD pipelines',
        minutes: 5,
        summary: 'Fast feedback, safe releases.',
        blocks: [
          {
            kind: 'p',
            text: 'Continuous integration means merging small changes often, with an automatic build and tests on each one. Continuous delivery means every change that passes is ready to release. Continuous deployment goes further and releases it automatically.',
          },
          {
            kind: 'list',
            items: [
              'Order jobs so the quick checks run first: build, then unit tests, then slower integration tests.',
              'Build once, then promote the same artifact through staging to production.',
              'Make rollback easy: keep the previous version and a one-step way to redeploy it.',
              'Feature flags let you ship code switched off and enable it later.',
              'A canary release sends a small share of traffic to the new version first.',
            ],
          },
          {
            kind: 'tip',
            text: 'A flaky test that people ignore is worse than no test. Fix it or delete it.',
          },
        ],
        quiz: [
          q(
            'What does continuous integration mean?',
            'Merging small changes often, with an automatic build and tests on each one',
            [
              'Deploying only once a year',
              'Running tests by hand before each release',
              'Keeping one branch per developer forever',
            ],
            'The goal is to find integration problems within minutes, while the change is still small.',
          ),
          q(
            'What is a canary release?',
            'Releasing to a small share of users first and watching before rolling out wider',
            [
              'Releasing only on Fridays',
              'Releasing without tests',
              'Releasing the old version again',
            ],
            'If the canary shows errors, only a few users are affected and you can roll back quickly.',
          ),
          q(
            'Which pipeline order gives the fastest feedback?',
            'Run the quick checks, such as build and unit tests, first',
            [
              'Run the slowest tests first',
              'Deploy first, then test',
              'Run all jobs in a random order',
            ],
            'Failing fast means a broken change is reported in minutes instead of after the slow jobs finish.',
          ),
        ],
      },
      {
        id: 'observability',
        title: 'Logs, metrics and traces',
        minutes: 5,
        summary: 'Know what your service is doing in production.',
        blocks: [
          {
            kind: 'p',
            text: 'Observability rests on three signals. Logs are events with detail. Metrics are numbers over time, such as requests per second. Traces follow one request through several services.',
          },
          {
            kind: 'list',
            items: [
              'Track rate, errors and duration for every service (the RED method).',
              'Log in a structured format and include a correlation id so one request can be followed across services.',
              'Alert on symptoms users feel, such as error rate or slow responses, rather than on every internal cause.',
              'In Spring Boot, the Actuator module exposes health and metrics endpoints.',
            ],
          },
          {
            kind: 'code',
            code: `management:
  endpoints:
    web:
      exposure:
        include: health,metrics`,
            caption: 'Expose only the Actuator endpoints you need, and protect them.',
          },
          { kind: 'tip', text: 'Never log passwords, tokens or full card numbers.' },
        ],
        quiz: [
          q(
            'What are the three signals of observability?',
            'Logs, metrics and traces',
            ['Build, test and deploy', 'CPU, RAM and disk', 'Commits, branches and tags'],
            'Together they tell you what happened, how often, and where time went.',
          ),
          q(
            'What does a correlation id help with?',
            'Following one request across several services in the logs',
            ['Making the database faster', 'Encrypting log files', 'Counting lines of code'],
            'Every service logs the same id for a request, so you can search for it and see the whole story.',
          ),
          q(
            'Which Spring Boot module exposes health and metrics endpoints?',
            'Actuator',
            ['Spring Batch', 'Spring Security', 'Spring Web'],
            'Spring Boot Actuator adds production-ready endpoints such as /actuator/health.',
          ),
        ],
      },
    ],
  },
];
