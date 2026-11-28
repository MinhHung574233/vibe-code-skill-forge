import { question as q, type Path } from '@/features/learning/domain/learning';

/** Java path: unit tests, Spring Boot test slices, Testcontainers and testable design. */
export const TESTING_PATH: Path = {
  id: 'java-testing',
  title: 'Testing and quality',
  summary:
    'Write fast unit tests, pick the right Spring Boot test slice, test against real databases and design code that is easy to test.',
  level: 'intermediate',
  lessons: [
    {
      id: 'test-unit-mockito',
      title: 'Unit tests with JUnit 5 and Mockito',
      minutes: 6,
      summary: 'Test one class in isolation, and know what is worth mocking.',
      blocks: [
        {
          kind: 'p',
          text: 'A unit test checks one class on its own, with no Spring context and no database, so it runs in milliseconds. JUnit 5 finds and runs the tests. Mockito creates test doubles for the collaborators. Constructor injection makes this easy, because the test can pass the doubles in.',
        },
        {
          kind: 'code',
          code: `@ExtendWith(MockitoExtension.class)
class PriceServiceTest {
    @Mock TaxClient taxClient;
    @InjectMocks PriceService service;

    @Test
    void addsTaxToTheNetPrice() {
        when(taxClient.rateFor("VN")).thenReturn(new BigDecimal("0.10"));

        BigDecimal gross = service.gross(new BigDecimal("100"), "VN");

        assertThat(gross).isEqualByComparingTo("110");
    }
}`,
          caption:
            'Static imports of when, assertThat and the JUnit and Mockito types are omitted.',
        },
        {
          kind: 'list',
          items: [
            'Mock what is slow, random or outside your process: HTTP clients, message brokers, the clock, other services’ repositories.',
            'Do not mock the class under test, simple values such as records, or small pure helpers. Use the real ones.',
            'Check results first: the returned value or the new state. Use verify only for a side effect that matters, such as an email being sent.',
            'A test that mirrors every call the code makes breaks whenever you refactor, even when the behaviour is still right.',
          ],
        },
        {
          kind: 'tip',
          text: 'Do not call Instant.now() in logic you want to test. Inject a java.time.Clock and give the test a fixed one with Clock.fixed(...).',
        },
      ],
      quiz: [
        q(
          'Which collaborator is a good candidate for a mock when you unit test a service?',
          'A client that calls a remote payment API',
          [
            'The class under test itself',
            'A record that holds a money amount',
            'A small pure method that formats a string',
          ],
          'Remote calls are slow and unreliable in tests, so you replace them. Real values and pure helpers are simpler and safer to use as they are.',
        ),
        q(
          'A test only checks that repository.save() was called once and never looks at what the service returns. What is the risk?',
          'The test is tied to the implementation and can pass while the result is wrong',
          [
            'verify() is not allowed on mocks',
            'The mock will write to a real database',
            'The test will run in a different thread',
          ],
          'Interaction checks describe how the code works, not what it achieves. Asserting the outcome catches real bugs and survives refactoring.',
        ),
        q(
          'How can a test control the current time of a class that needs it?',
          'Inject a java.time.Clock and pass a fixed Clock in the test',
          [
            'Call Thread.sleep in the test',
            'Change the operating system clock before each run',
            'Make the field static',
          ],
          'When time comes from a Clock dependency, a test can supply any moment it wants, and the result is repeatable.',
        ),
      ],
    },
    {
      id: 'test-spring-slices',
      title: 'Spring Boot test slices',
      minutes: 6,
      summary: '@WebMvcTest, @DataJpaTest and @SpringBootTest: what each loads and when to use it.',
      blocks: [
        {
          kind: 'p',
          text: '@SpringBootTest starts the whole application context. A test slice starts only the part you want to test, so it is faster and more focused. Pick the smallest one that covers the risk.',
        },
        {
          kind: 'code',
          code: `@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test
    void returnsTheOrderAsJson() throws Exception {
        when(service.find(7)).thenReturn(new OrderDto(7, "NEW"));

        mvc.perform(get("/api/orders/7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("NEW"));
    }
}`,
          caption: '@MockitoBean needs Spring Boot 3.4 or newer. Older 3.x versions use @MockBean.',
        },
        {
          kind: 'list',
          items: [
            '@WebMvcTest: controllers, JSON, validation, error handling and web security. Your @Service beans are not loaded, so mock them.',
            '@DataJpaTest: entities and repositories. Each test runs in a transaction that is rolled back at the end, and by default an embedded database replaces your DataSource.',
            '@SpringBootTest: the full context, optionally with a real server on a random port. Keep a small number of these as end-to-end checks that everything is wired together.',
            'Spring caches the context between tests that use the same configuration. Many different mock combinations create many contexts and slow the suite down.',
          ],
        },
        {
          kind: 'tip',
          text: 'Put the rules in plain classes and test them with plain unit tests. Use slices only for the parts that need Spring.',
        },
      ],
      quiz: [
        q(
          'A controller needs an OrderService. What do you do with it in a @WebMvcTest?',
          'Provide a mock of it, for example with @MockitoBean or @MockBean',
          [
            'Nothing: @WebMvcTest scans and loads every @Service',
            'Add @DataJpaTest to the same class',
            'Make the service class static',
          ],
          '@WebMvcTest loads only the web layer. A bean the controller depends on must be supplied by you, and a mock keeps the test focused on the controller.',
        ),
        q(
          'What does @DataJpaTest do with the data a test changes?',
          'It rolls the changes back when the test ends, by default',
          [
            'It commits them so the next test can see them',
            'It writes them to the production database',
            'It keeps them until the application context closes',
          ],
          'Rolling back after each test keeps tests independent of each other without manual cleanup.',
        ),
        q(
          'Which kind of test is the right use of @SpringBootTest?',
          'A small number of end-to-end tests that check the whole application starts and is wired together',
          [
            'Every unit test of business logic',
            'Every test of a single controller',
            'Every test of a single repository method',
          ],
          'Starting the full context is slow. It pays off for a few broad checks, while logic and single layers are better tested with unit tests and slices.',
        ),
      ],
    },
    {
      id: 'test-testcontainers',
      title: 'Integration tests with Testcontainers',
      minutes: 6,
      summary: 'Run tests against a real database in a throwaway container.',
      blocks: [
        {
          kind: 'p',
          text: 'An in-memory database such as H2 is not your production database. SQL dialects, column types and locking behave differently, so a test can pass on H2 and fail on PostgreSQL. Testcontainers starts a real database in a Docker container for the test run and removes it afterwards. It needs Docker, or a compatible container runtime, on every machine that runs these tests, including CI.',
        },
        {
          kind: 'code',
          code: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired OrderRepository orders;

    @Test
    void findsAnOrderByReference() {
        orders.save(new Order("A-1"));

        assertThat(orders.existsByReference("A-1")).isTrue();
    }
}`,
          caption:
            'Spring Boot 3.1 or newer with the spring-boot-testcontainers dependency. @ServiceConnection points the DataSource at the container.',
        },
        {
          kind: 'list',
          items: [
            'Replace.NONE tells @DataJpaTest to use the container instead of an embedded database.',
            'A static container is started once and shared by all tests in the class. A non-static one is started for every test method.',
            'Let Testcontainers choose a random free port. Do not fix the port.',
            'Use the same database image version as production. Your Flyway or Liquibase migrations then run against the real database too.',
            'Many teams name these tests *IT so the build can run them in a separate, slower step from the fast unit tests.',
          ],
        },
        {
          kind: 'tip',
          text: 'Share one container between several test classes with a common base class or a singleton, so you pay the start-up cost once.',
        },
      ],
      quiz: [
        q(
          'Why use Testcontainers instead of H2 for repository tests?',
          'The tests run on the same kind of database as production, so differences show up early',
          [
            'H2 cannot run SQL at all',
            'Containers always start faster than an in-memory database',
            'Testcontainers works without Docker',
          ],
          'Dialect, type and locking differences are hidden by H2. A real database in a container exposes them before production does.',
        ),
        q(
          'What does @ServiceConnection do in a Spring Boot test?',
          'It configures the connection details, such as the DataSource URL, from the running container',
          [
            'It starts the Docker daemon on your computer',
            'It connects two Spring beans together',
            'It encrypts the database connection',
          ],
          'Spring Boot reads the host, port and credentials from the container, so you do not set the properties by hand.',
        ),
        q(
          'Why is the container field declared static?',
          'One container is started for all the tests in the class, not one per test method',
          [
            'JUnit requires every field to be static',
            'So the container keeps running after the JVM exits',
            'So other machines can connect to the container',
          ],
          'Starting a database takes seconds. With a static field the cost is paid once per class.',
        ),
      ],
    },
    {
      id: 'test-readable-design',
      title: 'Testable code and readable tests',
      minutes: 6,
      summary: 'Design for testing, structure tests as given-when-then and use AssertJ well.',
      blocks: [
        {
          kind: 'p',
          text: 'Code is hard to test when it hides its dependencies: new inside methods, static calls, global singletons, and logic mixed with I/O. Pass dependencies in through the constructor, and keep pure decisions in small methods that take values and return values.',
        },
        {
          kind: 'code',
          code: `@Test
void rejectsAnOrderWithoutItems() {
    // given
    var order = new Order(List.of());

    // when
    var result = validator.validate(order);

    // then
    assertThat(result.errors()).containsExactly("An order needs at least one item");
}`,
          caption: 'Given, when, then: set up, act once, check the outcome.',
        },
        {
          kind: 'code',
          code: `@ParameterizedTest
@CsvSource({"2, false", "3, true", "10, true"})
void loyaltyDiscountStartsAtThreeYears(int years, boolean discounted) {
    assertThat(Discounts.applies(years)).isEqualTo(discounted);
}`,
          caption: 'One test method, several cases.',
        },
        {
          kind: 'list',
          items: [
            'Name a test after the behaviour, such as rejectsAnOrderWithoutItems, not test1 or testValidate.',
            'One behaviour per test, so a failure tells you what broke.',
            'AssertJ reads like a sentence and explains the difference when it fails. Use containsExactly for a list in order, and containsExactlyInAnyOrder when order does not matter.',
            'Tests must be independent: no shared mutable state, no required order and no Thread.sleep.',
          ],
        },
        {
          kind: 'tip',
          text: 'If a test needs a lot of setup, the class probably has too many dependencies. Treat that as feedback about the design.',
        },
      ],
      quiz: [
        q(
          'Which test method name describes behaviour best?',
          'rejectsAnOrderWithoutItems',
          ['test1', 'testValidate', 'orderServiceTest'],
          'A good name says what should happen, so a failing test report already tells you what broke.',
        ),
        q(
          'What does AssertJ’s containsExactly check on a list?',
          'That it has exactly these elements, in this order',
          [
            'That it has these elements in any order',
            'That it contains at least one of these elements',
            'That it has the same size, whatever the elements',
          ],
          'containsExactly is strict about both elements and order. Use containsExactlyInAnyOrder when the order is not part of the behaviour.',
        ),
        q(
          'Which change makes a service easier to unit test?',
          'Receive its collaborators through the constructor instead of creating them with new inside methods',
          [
            'Make all its methods static',
            'Reach its dependencies through a global getInstance() singleton',
            'Add more private helper methods',
          ],
          'With constructor injection a test passes in doubles. New objects, static calls and singletons are hidden dependencies that a test cannot replace.',
        ),
      ],
    },
  ],
};
