import { question as q, type Path } from '@/features/learning/domain/learning';

/** Java and Spring Boot lessons: three paths, from the language core to architecture and performance. */
export const JAVA_PATHS: readonly Path[] = [
  {
    id: 'java-core',
    title: 'Java core',
    summary: 'The language features you use every day, and the habits that keep code correct.',
    level: 'beginner',
    lessons: [
      {
        id: 'java-oop-records',
        title: 'Classes, interfaces and records',
        minutes: 5,
        summary: 'Contracts, implementations and immutable data carriers.',
        blocks: [
          {
            kind: 'p',
            text: 'A class bundles data with the behaviour that works on it. An interface lists what something can do without saying how, so callers depend on the contract and not on one implementation.',
          },
          {
            kind: 'code',
            code: `interface PaymentGateway {
    Receipt charge(Money amount);
}

class CardGateway implements PaymentGateway {
    public Receipt charge(Money amount) {
        return new Receipt(amount); // call the card provider here
    }
}`,
          },
          {
            kind: 'p',
            text: 'Since Java 16 a record is the short way to write an immutable data carrier. The compiler generates the constructor, the accessors, equals, hashCode and toString.',
          },
          { kind: 'code', code: 'record Money(long cents, String currency) { }' },
          {
            kind: 'tip',
            text: 'Prefer composition over inheritance: give a class a PaymentGateway to use instead of extending a base class to reuse code.',
          },
        ],
        quiz: [
          q(
            'What does a Java record generate for you?',
            'A constructor, accessors, equals, hashCode and toString',
            ['Only getters and setters', 'A database table', 'A thread-safe singleton'],
            'A record is a compact immutable data class; the compiler writes the boilerplate members.',
          ),
          q(
            'Why do callers depend on an interface rather than on a class?',
            'They can swap implementations without changing the caller',
            [
              'It makes the code compile faster',
              'Interfaces are always faster at runtime',
              'Interfaces hold mutable state for every instance',
            ],
            'Depending on the contract keeps callers independent of how the work is done, which also makes testing with fakes easy.',
          ),
          q(
            'Which statement about records is true?',
            'Record components are final, so a record is shallowly immutable',
            [
              'A record can extend another class',
              'Record fields can be reassigned with setters',
              'Records only work with Spring',
            ],
            'Record fields cannot be reassigned. They are only shallowly immutable: a List inside a record can still be changed.',
          ),
        ],
      },
      {
        id: 'java-collections',
        title: 'Collections: List, Set and Map',
        minutes: 6,
        summary: 'Choose the right collection and avoid hashCode traps.',
        blocks: [
          {
            kind: 'p',
            text: 'A List keeps order and allows duplicates. A Set holds no duplicates. A Map links a key to a value.',
          },
          {
            kind: 'code',
            code: `List<String> names = new ArrayList<>();
Set<Integer> ids = new HashSet<>();
Map<String, Integer> scores = new HashMap<>();
scores.merge("Linh", 1, Integer::sum); // add 1, or start at 1`,
          },
          {
            kind: 'p',
            text: 'HashMap and HashSet find items with hashCode() and equals(). If you override equals() you must override hashCode() so that equal objects have equal hash codes. Otherwise lookups fail in ways that are hard to see.',
          },
          {
            kind: 'list',
            items: [
              'ArrayList: fast access by index; slow to insert in the middle.',
              'HashMap: fast lookup by key on average; no order.',
              'TreeMap: keys kept sorted; lookups cost O(log n).',
              'List.of(...), Set.of(...), Map.of(...) make small immutable collections.',
            ],
          },
          {
            kind: 'tip',
            text: 'Need to find a user by id quickly? Keep a Map<Long, User>, not a List you loop over.',
          },
        ],
        quiz: [
          q(
            'Two objects are equal by equals() but have different hashCode() values. What can happen in a HashSet?',
            'Both can be stored as if they were different objects',
            [
              'Nothing, hashCode is optional',
              'The program will not compile',
              'The set throws an exception on add',
            ],
            'The set uses hashCode to choose a bucket first, so an equal object can land in another bucket and is never compared.',
          ),
          q(
            'Which collection keeps its keys sorted?',
            'TreeMap',
            ['HashMap', 'ArrayList', 'HashSet'],
            'TreeMap is a sorted map. HashMap and HashSet give no order guarantee.',
          ),
          q(
            'You need to look up a user by id many times. What is the best fit?',
            'Map<Long, User>',
            ['List<User> and a loop', 'Set<User> and contains', 'Queue<User>'],
            'A hash map finds a key in constant time on average; looping a list takes time proportional to its size.',
          ),
        ],
      },
      {
        id: 'java-streams',
        title: 'Lambdas and streams',
        minutes: 6,
        summary: 'Describe data pipelines, and know when a plain loop is better.',
        blocks: [
          {
            kind: 'p',
            text: 'A lambda is a short function written inline, such as x -> x * 2. A method reference such as User::name is shorthand for a lambda that calls one method.',
          },
          {
            kind: 'p',
            text: 'A stream describes a pipeline: a source, some intermediate steps and one terminal step. The intermediate steps are lazy. Nothing runs until the terminal step is called.',
          },
          {
            kind: 'code',
            code: `List<String> names = users.stream()
    .filter(User::isActive)
    .map(User::name)
    .sorted()
    .toList();`,
          },
          {
            kind: 'list',
            items: [
              'Intermediate: filter, map, sorted, distinct, limit.',
              'Terminal: toList, collect, count, forEach, reduce, findFirst.',
              'Do not change outside variables from inside a lambda; build a result instead.',
            ],
          },
          {
            kind: 'tip',
            text: 'A plain for loop is fine, and often clearer, when you need early exits or you change several variables.',
          },
        ],
        quiz: [
          q(
            'When does a stream pipeline actually run?',
            'When a terminal operation such as toList() is called',
            [
              'As soon as filter() is called',
              'When the stream is created',
              'Every 10 ms in the background',
            ],
            'Intermediate operations only describe work. The terminal operation starts it.',
          ),
          q(
            'What does User::name mean?',
            'A method reference equal to u -> u.name()',
            ['A static field called name', 'A new User object', 'A code comment'],
            'It is a method reference: a shorter way to write a lambda that only calls one method.',
          ),
          q(
            'Which of these is a terminal operation?',
            'count',
            ['map', 'filter', 'sorted'],
            'count() produces a result and ends the pipeline. map, filter and sorted return another stream.',
          ),
        ],
      },
      {
        id: 'java-exceptions',
        title: 'Exceptions done right',
        minutes: 5,
        summary: 'Checked vs unchecked, try-with-resources and keeping the cause.',
        blocks: [
          {
            kind: 'p',
            text: 'Checked exceptions (subclasses of Exception that are not RuntimeException) must be handled or declared. Unchecked exceptions (RuntimeException and its subclasses) do not. Use unchecked exceptions for programming errors and for failures the caller cannot fix.',
          },
          {
            kind: 'code',
            code: `try (var in = Files.newBufferedReader(path)) {
    return in.readLine();
} catch (IOException e) {
    throw new UncheckedIOException("Cannot read " + path, e);
}`,
            caption:
              'try-with-resources closes the reader for you, even if an exception is thrown.',
          },
          {
            kind: 'list',
            items: [
              'Never swallow an exception silently. At least log it.',
              'When you wrap an exception, pass the original as the cause.',
              'Catch the most specific type you can handle.',
              'Do not use exceptions for normal control flow.',
            ],
          },
          {
            kind: 'tip',
            text: 'The message should say what you were doing and with what, for example the file name.',
          },
        ],
        quiz: [
          q(
            'What does try-with-resources do?',
            'Closes AutoCloseable resources automatically, even when an exception is thrown',
            [
              'Retries the block three times',
              'Makes every exception checked',
              'Disables garbage collection',
            ],
            'Resources declared in the parentheses are closed in reverse order when the block ends, normally or not.',
          ),
          q(
            'Why pass the original exception as the cause when you wrap it?',
            'So the stack trace of the root problem is not lost',
            [
              'It makes the code faster',
              'The compiler requires it',
              'It turns the exception into a checked one',
            ],
            'The cause keeps the first failure visible in logs, which is where you usually find the real bug.',
          ),
          q(
            'Which of these is an unchecked exception?',
            'IllegalArgumentException',
            ['IOException', 'SQLException', 'Exception'],
            'IllegalArgumentException extends RuntimeException, so it is not checked by the compiler.',
          ),
        ],
      },
      {
        id: 'java-concurrency',
        title: 'Concurrency basics',
        minutes: 6,
        summary: 'Race conditions, executors, atomics and virtual threads.',
        blocks: [
          {
            kind: 'p',
            text: 'A thread runs code independently of others. Most concurrency bugs come from several threads changing shared mutable state at the same time. This is called a race condition.',
          },
          {
            kind: 'code',
            code: `ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(() -> compute());
int result = future.get(); // waits for the answer
pool.shutdown();`,
          },
          {
            kind: 'list',
            items: [
              'Prefer immutable data: nothing to race on.',
              'Use ConcurrentHashMap, not HashMap, when threads share a map.',
              'Use AtomicInteger or LongAdder for shared counters.',
              'Always shut down an ExecutorService you create.',
            ],
          },
          {
            kind: 'p',
            text: 'Java 21 added virtual threads: very cheap threads for tasks that mostly wait on blocking I/O. Executors.newVirtualThreadPerTaskExecutor() starts one per task.',
          },
          {
            kind: 'tip',
            text: 'count++ is three steps (read, add, write). Two threads can both read the same value and one update is lost.',
          },
        ],
        quiz: [
          q(
            'Two threads run count++ on a shared int with no synchronisation. What can go wrong?',
            'Updates can be lost, because this is a race condition',
            [
              'The JVM prevents it automatically',
              'The code will not compile',
              'count always becomes negative',
            ],
            'count++ reads, adds and writes. Two threads can read the same old value, so one increment disappears.',
          ),
          q(
            'Which class is designed for a safe shared counter?',
            'AtomicInteger',
            ['ArrayList', 'StringBuilder', 'HashMap'],
            'AtomicInteger offers atomic operations such as incrementAndGet() without explicit locks.',
          ),
          q(
            'What are virtual threads (Java 21) best for?',
            'Many concurrent tasks that mostly wait on blocking I/O',
            [
              'CPU-heavy number crunching on every core',
              'Replacing the garbage collector',
              'Running code without a JVM',
            ],
            'Virtual threads are cheap, so you can have one per request even when most of them are waiting on the network or a database.',
          ),
        ],
      },
    ],
  },
  {
    id: 'spring-boot',
    title: 'Spring Boot essentials',
    summary: 'Build a small service: beans, REST endpoints, data access, configuration and tests.',
    level: 'intermediate',
    lessons: [
      {
        id: 'spring-di',
        title: 'Dependency injection and beans',
        minutes: 5,
        summary: 'How Spring creates and wires your objects.',
        blocks: [
          {
            kind: 'p',
            text: 'Spring’s container creates objects, called beans, and passes each one the other beans it needs. You declare what you need; Spring supplies it. This is dependency injection.',
          },
          {
            kind: 'code',
            code: `@Service
class OrderService {
    private final PaymentGateway gateway;

    OrderService(PaymentGateway gateway) { // constructor injection
        this.gateway = gateway;
    }
}`,
          },
          {
            kind: 'list',
            items: [
              'Prefer constructor injection: dependencies are explicit and final, and you can build the class in a plain unit test.',
              'Beans are singletons by default: one shared instance.',
              '@Component, @Service, @Repository and @RestController are found by component scanning from the package of your @SpringBootApplication class.',
              'Use @Configuration with @Bean methods for objects from third-party libraries.',
            ],
          },
          {
            kind: 'tip',
            text: 'Two beans of the same type? Mark one @Primary or pick one with @Qualifier.',
          },
        ],
        quiz: [
          q(
            'Why prefer constructor injection over field injection?',
            'Dependencies are explicit and final, and the class is easy to unit test without Spring',
            [
              'It is faster at runtime',
              'Field injection is not allowed in Spring Boot',
              'It removes the need for beans',
            ],
            'With a constructor you can create the object in a test by passing fakes, and the fields can be final.',
          ),
          q(
            'What is the default scope of a Spring bean?',
            'Singleton',
            ['Prototype', 'Request', 'Session'],
            'By default Spring creates one instance of a bean and shares it, so beans must not keep per-request state.',
          ),
          q(
            'Where does component scanning start with @SpringBootApplication?',
            'In the package of the annotated class and its sub-packages',
            [
              'Only in the default package',
              'In every package on the classpath',
              'Only in classes named *Service',
            ],
            'Put the main class in the root package of your application so all your beans are found.',
          ),
        ],
      },
      {
        id: 'spring-rest',
        title: 'Building a REST controller',
        minutes: 6,
        summary: 'Endpoints, validation, DTOs and one place for errors.',
        blocks: [
          {
            kind: 'p',
            text: 'A @RestController maps HTTP requests to methods. Spring converts JSON to objects and back using Jackson.',
          },
          {
            kind: 'code',
            code: `@RestController
@RequestMapping("/api/orders")
class OrderController {
    private final OrderService service;

    OrderController(OrderService service) { this.service = service; }

    @GetMapping("/{id}")
    OrderDto get(@PathVariable long id) { return service.find(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    OrderDto create(@Valid @RequestBody CreateOrder request) {
        return service.create(request);
    }
}`,
          },
          {
            kind: 'list',
            items: [
              'Return DTOs, not JPA entities: the API stays stable when the database model changes.',
              'Validate input with Bean Validation: @Valid, @NotBlank, @Positive.',
              'Handle errors in one place with @RestControllerAdvice and @ExceptionHandler.',
              'Use meaningful status codes: 201 created, 400 invalid input, 404 not found, 409 conflict.',
            ],
          },
          {
            kind: 'tip',
            text: 'Keep controllers thin: parse, call a service, return. Business rules belong in the service.',
          },
        ],
        quiz: [
          q(
            'Which annotation reads a JSON request body into an object?',
            '@RequestBody',
            ['@PathVariable', '@ResponseStatus', '@Autowired'],
            '@RequestBody tells Spring to deserialise the body. @PathVariable reads a value from the URL path.',
          ),
          q(
            'Where do you turn exceptions into HTTP error responses once for the whole app?',
            'A @RestControllerAdvice class with @ExceptionHandler methods',
            ['A try/catch in every controller method', 'The repository layer', 'application.yml'],
            'A controller advice centralises error mapping so every endpoint returns the same error format.',
          ),
          q(
            'Why return DTOs instead of JPA entities from controllers?',
            'The API contract stays independent of the database model, and no fields leak by accident',
            [
              'Entities cannot be turned into JSON',
              'Spring forbids returning entities',
              'DTOs are required by HTTP',
            ],
            'Entities can be serialised, but doing so ties your API to your tables and can expose internal fields or lazy data.',
          ),
        ],
      },
      {
        id: 'spring-data',
        title: 'Spring Data JPA and transactions',
        minutes: 6,
        summary: 'Repositories from interfaces, and transactions that roll back.',
        blocks: [
          {
            kind: 'p',
            text: 'With Spring Data JPA you write a repository interface and Spring implements it. Simple queries are derived from the method name.',
          },
          {
            kind: 'code',
            code: `interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByActiveTrueOrderByNameAsc();
}`,
          },
          {
            kind: 'p',
            text: '@Transactional on a method runs it in one database transaction. By default it commits when the method returns and rolls back when a RuntimeException escapes. A checked exception does not roll back unless you set rollbackFor.',
          },
          {
            kind: 'code',
            code: `@Transactional
public void transfer(long from, long to, long cents) {
    accounts.withdraw(from, cents);
    accounts.deposit(to, cents); // if this fails, the withdrawal is undone
}`,
          },
          {
            kind: 'tip',
            text: 'Put @Transactional on service methods that form one business operation, not on controllers.',
          },
        ],
        quiz: [
          q(
            'By default, which exception makes @Transactional roll back?',
            'A RuntimeException (unchecked)',
            [
              'Only checked exceptions',
              'Every exception, checked or not',
              'None; you must call rollback yourself',
            ],
            'Spring rolls back on unchecked exceptions and errors by default. Use rollbackFor to include checked ones.',
          ),
          q(
            'What does findByEmail(String email) in a Spring Data repository do?',
            'Spring derives a query that selects users by the email column',
            [
              'Nothing until you write the SQL',
              'Loads every user and filters in memory',
              'Deletes the user',
            ],
            'Spring Data parses the method name and builds the query for you.',
          ),
          q(
            'Where should @Transactional normally go?',
            'On service methods that make up one business operation',
            [
              'On controller methods only',
              'On entity fields',
              'On every repository method separately',
            ],
            'The service method is the natural boundary: all its steps succeed together or none of them do.',
          ),
        ],
      },
      {
        id: 'spring-config-test',
        title: 'Configuration, profiles and testing',
        minutes: 6,
        summary: 'Settings per environment, and the right test for each layer.',
        blocks: [
          {
            kind: 'p',
            text: 'Spring Boot reads settings from application.yml (or .properties). Profiles let one file hold different values for dev and production, and environment variables override file values.',
          },
          {
            kind: 'code',
            code: `app:
  payment:
    timeout: 3s
---
spring:
  config:
    activate:
      on-profile: dev
app:
  payment:
    timeout: 10s`,
            caption: 'Run with the dev profile: SPRING_PROFILES_ACTIVE=dev',
          },
          {
            kind: 'code',
            code: `@ConfigurationProperties(prefix = "app.payment")
record PaymentProperties(Duration timeout) { }`,
            caption:
              'Typed settings. Register with @ConfigurationPropertiesScan on your application class.',
          },
          {
            kind: 'list',
            items: [
              'Unit tests: plain JUnit and Mockito for logic. Fastest.',
              '@WebMvcTest: only the web layer, for controllers.',
              '@DataJpaTest: only repositories, with an in-memory or container database.',
              '@SpringBootTest: the full application. Slowest, so use it sparingly.',
            ],
          },
          {
            kind: 'tip',
            text: 'Never commit passwords. Read them from environment variables or a secrets manager.',
          },
        ],
        quiz: [
          q(
            'Which annotation loads only the web layer for fast controller tests?',
            '@WebMvcTest',
            ['@SpringBootTest', '@DataJpaTest', '@Configuration'],
            '@WebMvcTest starts controllers, filters and MVC infrastructure but not the whole application.',
          ),
          q(
            'How do you activate the dev profile?',
            'Set spring.profiles.active=dev, for example with the SPRING_PROFILES_ACTIVE variable',
            [
              'Rename the jar file to dev.jar',
              'Add @Dev to the main class',
              'Delete application.yml',
            ],
            'The active profile is a normal setting, so a property, a command-line argument or an environment variable all work.',
          ),
          q(
            'Where should production database passwords live?',
            'In environment variables or a secrets manager, never in the git repository',
            [
              'In application.yml committed to git',
              'In a comment next to the code',
              'In the README',
            ],
            'Anything committed to git is copied to every clone and stays in the history.',
          ),
        ],
      },
    ],
  },
  {
    id: 'java-architecture',
    title: 'Architecture and performance',
    summary: 'Structure that stays testable, and the three performance topics that matter most.',
    level: 'advanced',
    lessons: [
      {
        id: 'arch-layers',
        title: 'Layers, ports and adapters',
        minutes: 6,
        summary: 'Keep business rules independent of frameworks and databases.',
        blocks: [
          {
            kind: 'p',
            text: 'A layered design splits the code into controller, service and repository. Business rules should live in the service or domain layer, not in controllers or SQL.',
          },
          {
            kind: 'p',
            text: 'Ports and adapters (hexagonal architecture) goes further. The core defines ports, which are interfaces for what it needs. Adapters for REST, the database or messaging implement or call those ports. Dependencies point inward, toward the core.',
          },
          {
            kind: 'code',
            code: `// core: a port
interface OrderRepository {
    Optional<Order> find(OrderId id);
    void save(Order order);
}

// infrastructure: an adapter implements the port
@Repository
class JpaOrderRepository implements OrderRepository {
    // uses Spring Data internally
}`,
          },
          {
            kind: 'list',
            items: [
              'Benefit: test business rules with no HTTP and no database.',
              'Benefit: swap an adapter, such as a payment provider, without touching the core.',
              'Cost: more classes and mapping. Use it when the domain logic is real.',
            ],
          },
          {
            kind: 'tip',
            text: 'A simple CRUD service with no real rules rarely needs hexagonal architecture.',
          },
        ],
        quiz: [
          q(
            'In ports and adapters, which way do dependencies point?',
            'Toward the core: adapters depend on the core’s ports',
            ['Toward the database', 'Toward the web framework', 'There is no rule'],
            'The core knows nothing about frameworks. The outer layers know about the core.',
          ),
          q(
            'What is a main benefit of keeping business rules in the core instead of in controllers?',
            'You can test them without HTTP or a database',
            ['The code needs fewer classes', 'Rules run faster', 'You no longer need unit tests'],
            'Pure core code can be tested with plain objects, which makes tests fast and reliable.',
          ),
          q(
            'When is full hexagonal architecture probably overkill?',
            'A simple CRUD service with almost no business rules',
            [
              'A system with complex pricing rules',
              'A service that must swap payment providers',
              'A long-lived product with many integrations',
            ],
            'The extra structure pays off when there are rules and integrations to protect, not when you only move rows.',
          ),
        ],
      },
      {
        id: 'perf-db',
        title: 'Database performance: N+1 and indexes',
        minutes: 6,
        summary: 'The most common cause of a slow Spring service.',
        blocks: [
          {
            kind: 'p',
            text: 'The N+1 problem: one query loads a list of N rows, and then each row triggers one more query to load a lazy association. A hundred orders become 101 queries.',
          },
          {
            kind: 'code',
            code: `// 1 query for the orders + N queries for the items
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> o.getItems().size());

// Fix: load them together
@Query("select o from Order o join fetch o.items")
List<Order> findAllWithItems();`,
          },
          {
            kind: 'list',
            items: [
              'Find it: turn on SQL logging or count queries in a test.',
              'Fix it: join fetch, @EntityGraph, batch fetching, or a DTO projection.',
              'Index columns used in WHERE, JOIN and ORDER BY.',
              'Check how the database runs a query with EXPLAIN.',
              'Always paginate large lists.',
            ],
          },
          {
            kind: 'tip',
            text: 'Join-fetching a collection together with pagination makes Hibernate page in memory. Page the ids first, then fetch.',
          },
        ],
        quiz: [
          q(
            'What is the N+1 query problem?',
            'One query loads a list, then one extra query runs per item for a lazy association',
            [
              'A query that returns N+1 columns',
              'A database that has one table too many',
              'A query that needs N+1 indexes',
            ],
            'The list query is the “1”, and the per-row association loads are the “N”.',
          ),
          q(
            'Which tool shows how the database executes a query?',
            'EXPLAIN (the query plan)',
            ['javac', 'git blame', 'The garbage collector log'],
            'EXPLAIN shows whether the database uses an index or scans the whole table.',
          ),
          q(
            'Which column most deserves an index?',
            'One that is used often in WHERE clauses or join conditions',
            [
              'A column that is never queried',
              'Every column of every table',
              'A column that is only ever updated',
            ],
            'Indexes speed up lookups but slow down writes and use space, so add them where queries need them.',
          ),
        ],
      },
      {
        id: 'perf-jvm',
        title: 'JVM memory and garbage collection',
        minutes: 6,
        summary: 'Heap, stack, GC, and measuring before tuning.',
        blocks: [
          {
            kind: 'p',
            text: 'Java objects live on the heap, which the garbage collector cleans. Each thread has its own stack for method calls. Class metadata lives in metaspace. G1 has been the default collector since Java 9; ZGC targets very short pauses.',
          },
          {
            kind: 'code',
            code: 'java -Xms512m -Xmx512m -XX:+UseG1GC -Xlog:gc -jar app.jar',
            caption: 'Fixed heap size, G1 collector, GC logging.',
          },
          {
            kind: 'list',
            items: [
              'Set the maximum heap on purpose, especially in containers.',
              'Measure first: GC logs, Java Flight Recorder, a profiler.',
              'Most Java “memory leaks” are objects that are still referenced, such as a static map that only grows.',
              'OutOfMemoryError: Java heap space means the heap is full of reachable objects.',
            ],
          },
          { kind: 'tip', text: 'A bigger heap hides a leak for longer; it does not fix it.' },
        ],
        quiz: [
          q(
            'Where are Java objects allocated?',
            'On the heap, managed by the garbage collector',
            ['Only on the thread stack', 'In metaspace', 'On the disk'],
            'Objects live on the heap. Stacks hold method frames and local variables; metaspace holds class metadata.',
          ),
          q(
            'What usually causes a Java “memory leak”?',
            'Objects that stay reachable, such as entries never removed from a static map',
            [
              'The garbage collector forgetting to run',
              'Having too many comments',
              'Forgetting to call free()',
            ],
            'The collector only frees unreachable objects. If something still points to them, they stay.',
          ),
          q(
            'What should you do before changing JVM flags to tune performance?',
            'Measure with GC logs or a profiler to find the real bottleneck',
            [
              'Double the heap and hope',
              'Disable the garbage collector',
              'Switch collectors at random',
            ],
            'Tuning without measurements often makes things worse or hides the real problem.',
          ),
        ],
      },
    ],
  },
];
