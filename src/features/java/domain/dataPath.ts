import { question as q, type Path } from '@/features/learning/domain/learning';

/** Java path: persistence with JPA and Spring Data, transactions, migrations and pooling. */
export const DATA_PATH: Path = {
  id: 'java-data',
  title: 'Data and transactions',
  summary:
    'Map entities with JPA, query them with Spring Data, keep data consistent with transactions and evolve the schema safely.',
  level: 'intermediate',
  lessons: [
    {
      id: 'data-jpa-entities',
      title: 'JPA entities and relationships',
      minutes: 6,
      summary: 'Map classes to tables, own the foreign key correctly and spot the N+1 trap.',
      blocks: [
        {
          kind: 'p',
          text: 'An entity is a class that JPA maps to a database table. Hibernate is the JPA implementation that Spring Boot uses by default. In Spring Boot 3 the annotations live in the jakarta.persistence package, not javax.persistence.',
        },
        {
          kind: 'code',
          code: `@Entity
@Table(name = "orders") // "order" is a reserved word in SQL
class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}

@Entity
class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Order order; // this side holds the foreign key column
}`,
          caption: 'A bidirectional relationship. Imports from jakarta.persistence are omitted.',
        },
        {
          kind: 'p',
          text: 'The @ManyToOne side owns the foreign key. The mappedBy on the @OneToMany side says that the relationship is already mapped from the other side. When you change the relationship in Java, update both sides so they agree.',
        },
        {
          kind: 'list',
          items: [
            '@OneToMany and @ManyToMany are lazy by default. @ManyToOne and @OneToOne are eager by default, so set fetch = FetchType.LAZY on them yourself.',
            'A lazy association is loaded on first access. Looping over a list of entities and touching a lazy association in each one causes the N+1 problem.',
            'Reading a lazy association when no Hibernate session is open throws LazyInitializationException.',
            'Entities need a mutable class with a no-argument constructor, so a record is not a good entity. Records are fine as DTOs and projections.',
          ],
        },
        {
          kind: 'tip',
          text: 'Spring Boot enables open-in-view by default, which keeps a session open for the whole web request and hides lazy-loading mistakes. Many teams set spring.jpa.open-in-view=false and load what they need inside the service.',
        },
      ],
      quiz: [
        q(
          'In a bidirectional @OneToMany and @ManyToOne relationship, which side owns the foreign key?',
          'The @ManyToOne side, the one without mappedBy',
          [
            'The @OneToMany side, the one with mappedBy',
            'Both sides equally',
            'The class that was written first',
          ],
          'The many side has the foreign key column in its table. mappedBy marks the other side as the mirror of that mapping.',
        ),
        q(
          'A page loads 50 orders and runs 51 queries because the lazy items of each order are read in a loop. What is a good first fix?',
          'Fetch the items in the same query with join fetch or an @EntityGraph',
          [
            'Add a database index on the order id',
            'Call getItems().size() on every order before returning',
            'Make the relationship eager everywhere',
          ],
          'Loading the orders and their items in one query removes the extra per-row queries. Eager mapping alone can still run one query per row, and touching each collection is exactly what causes the problem.',
        ),
        q(
          'With no open Hibernate session, what happens when you read a lazy collection that was never loaded?',
          'Hibernate throws LazyInitializationException',
          [
            'It returns an empty list',
            'It quietly opens a new connection and loads the data',
            'The code does not compile',
          ],
          'A lazy collection can only load while its session is open. Outside the session Hibernate cannot reach the database for it, so it fails with this exception.',
        ),
      ],
    },
    {
      id: 'data-repositories',
      title: 'Spring Data repositories and queries',
      minutes: 6,
      summary: 'Derived queries, @Query, paging and projections without writing boilerplate.',
      blocks: [
        {
          kind: 'p',
          text: 'JpaRepository<T, ID> gives you save, findById, findAll, deleteById, count and paging with no code. findById returns an Optional. Beyond that, Spring Data builds queries from method names.',
        },
        {
          kind: 'code',
          code: `interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdAndStatus(long customerId, Status status);
    boolean existsByReference(String reference);
    Page<Order> findByStatus(Status status, Pageable pageable);
}`,
        },
        {
          kind: 'p',
          text: 'When a method name would become too long or the query is complex, write it with @Query. Use named parameters. Never build the query by joining strings with user input, because that opens the door to injection.',
        },
        {
          kind: 'code',
          code: `@Query("select o from Order o where o.total > :min order by o.createdAt desc")
List<Order> findBig(@Param("min") BigDecimal min);`,
        },
        {
          kind: 'list',
          items: [
            'Paging: PageRequest.of(0, 20, Sort.by("createdAt").descending()). A Page also knows the total count, which costs an extra count query. A Slice skips it.',
            'Projections: return a record or an interface with only the fields you need, so the query selects fewer columns.',
            'Inside a transaction, changes to a loaded entity are saved at commit by dirty checking. You do not need to call save again.',
            'Derived queries are checked when the application starts, so a typo in a property name fails early.',
          ],
        },
        {
          kind: 'tip',
          text: 'Use findById(id).orElseThrow(...) with a clear exception, so a missing row becomes a 404 instead of a NullPointerException later.',
        },
      ],
      quiz: [
        q(
          'What does Spring Data derive from the method name existsByReference(String reference)?',
          'A query that checks whether a row with that reference exists and returns a boolean',
          [
            'A query that deletes the row with that reference',
            'A query that loads every row and filters in Java',
            'Nothing: exists is not a supported keyword',
          ],
          'Prefixes such as findBy, existsBy, countBy and deleteBy are parsed, and the rest of the name becomes the condition.',
        ),
        q(
          'Why use named parameters in @Query instead of building the string with +?',
          'The values are bound safely, which prevents injection',
          [
            'String concatenation does not compile in annotations',
            'Named parameters make the query run on another thread',
            'JPQL cannot contain any literal values',
          ],
          'Bound parameters are sent as data, never as part of the query text, so a malicious value cannot change the query.',
        ),
        q(
          'A repository method returns Page<Order>. What does a Page carry that a plain List does not?',
          'The total number of elements and pages, which needs an extra count query',
          [
            'The lazy collections of every order, already loaded',
            'A cache of the next page of results',
            'A guarantee that the data will not change',
          ],
          'A Page knows how many elements exist in total, so a UI can show page numbers. Counting costs one more query; a Slice avoids it.',
        ),
      ],
    },
    {
      id: 'data-transactions',
      title: 'Transactions: propagation, rollback and traps',
      minutes: 7,
      summary: 'How @Transactional really works, and why it sometimes seems to do nothing.',
      blocks: [
        {
          kind: 'p',
          text: '@Transactional works through a proxy. Spring wraps the bean in a proxy object that starts the transaction before the method and commits or rolls back after it. Only calls that go through the proxy are intercepted.',
        },
        {
          kind: 'code',
          code: `@Service
class InvoiceService {
    @Transactional
    public void create(Invoice invoice) { /* ... */ }

    public void createAll(List<Invoice> invoices) {
        invoices.forEach(this::create); // self-invocation: no proxy, no transaction
    }
}`,
          caption:
            'The call to this.create skips the proxy, so the annotation is ignored. Move the method to another bean, or put @Transactional on createAll.',
        },
        {
          kind: 'list',
          items: [
            'REQUIRED (default): join the current transaction, or start one if there is none.',
            'REQUIRES_NEW: suspend the current transaction and run in a new, independent one that commits or rolls back on its own.',
            'MANDATORY: a transaction must already exist, otherwise an exception is thrown.',
            'Rollback happens for RuntimeException and Error. A checked exception commits unless you set rollbackFor.',
            'If an inner method that joined your transaction throws, the transaction is marked rollback-only. Catching the exception in the outer method does not save it, and the commit fails with UnexpectedRollbackException.',
            'readOnly = true is a hint that lets Spring and Hibernate skip work such as dirty checking for queries.',
          ],
        },
        {
          kind: 'code',
          code: `@Transactional(rollbackFor = Exception.class)
public void importFile(Path file) throws IOException { /* ... */ }`,
          caption: 'Roll back for checked exceptions too.',
        },
        {
          kind: 'tip',
          text: 'Keep transactions short. Do not call a slow remote service inside one: it holds a database connection the whole time.',
        },
      ],
      quiz: [
        q(
          'A method calls another @Transactional method of the same class with this.method(). What happens to the annotation on the called method?',
          'It is ignored, because the call does not pass through the Spring proxy',
          [
            'It starts a new transaction with REQUIRES_NEW',
            'Spring throws an exception at startup',
            'It is applied twice, once for each call',
          ],
          'The proxy sits outside the object. A call from inside the object goes straight to the method, so no transaction logic runs.',
        ),
        q(
          'An audit record must be saved even when the main operation rolls back. Which propagation fits the audit method, when it lives in another bean?',
          'REQUIRES_NEW',
          ['REQUIRED', 'MANDATORY', 'SUPPORTS'],
          'REQUIRES_NEW suspends the outer transaction and commits the audit on its own. With REQUIRED the audit would roll back together with the main operation.',
        ),
        q(
          'How do you make a checked exception cause a rollback?',
          'Set rollbackFor = Exception.class (or the specific type) on @Transactional',
          [
            'Declare the method private',
            'Set readOnly = true',
            'Catch the exception and return null',
          ],
          'By default only unchecked exceptions and errors roll back. rollbackFor adds the exception types you list.',
        ),
      ],
    },
    {
      id: 'data-migrations-pool',
      title: 'Migrations and connection pooling',
      minutes: 6,
      summary: 'Change the schema with versioned scripts, and size the connection pool sensibly.',
      blocks: [
        {
          kind: 'p',
          text: 'In production the schema should change only through reviewed, versioned migrations. Set spring.jpa.hibernate.ddl-auto to validate or none, and keep update and create for experiments on your own machine. Flyway and Liquibase are the two common tools. Spring Boot runs them at startup when the dependency is on the classpath.',
        },
        {
          kind: 'code',
          code: `-- src/main/resources/db/migration/V2__add_order_status.sql
alter table orders add column status varchar(20) not null default 'NEW';`,
          caption: 'Flyway reads files named V<version>__<description>.sql in order.',
        },
        {
          kind: 'list',
          items: [
            'Flyway stores a checksum of each applied migration. Never edit one that has run; add a new version instead.',
            'Liquibase works the same way, with changelogs and changesets written in YAML, XML or SQL.',
            'Make changes backward compatible, such as adding a column before using it, so old and new versions of the app can run side by side during a rolling deploy.',
            'Run the migrations against a real database in your tests.',
          ],
        },
        {
          kind: 'p',
          text: 'Opening a database connection is expensive, so applications keep a pool of ready connections. Spring Boot uses HikariCP by default. The pool is small on purpose: the database can only do so much work at once.',
        },
        {
          kind: 'code',
          code: `spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      connection-timeout: 5000`,
          caption:
            'At most 10 connections, and wait at most 5000 ms for a free one. The default size is also 10.',
        },
        {
          kind: 'list',
          items: [
            'A bigger pool is not faster. Pool size times the number of app instances must stay below the database’s connection limit.',
            'The error “Connection is not available, request timed out” usually means connections are held too long, not that the pool is too small.',
          ],
        },
        {
          kind: 'tip',
          text: 'Before raising the pool size, look for slow queries, long transactions and remote calls made inside a transaction.',
        },
      ],
      quiz: [
        q(
          'Why is spring.jpa.hibernate.ddl-auto=update a poor way to change a production schema?',
          'Changes are not versioned or reviewed, and they can be unsafe or incomplete',
          [
            'The update setting was removed in Hibernate 6',
            'It makes every query slower',
            'It only works with the H2 database',
          ],
          'Versioned migrations give you a reviewed, repeatable history of every change. Automatic schema updates give you neither.',
        ),
        q(
          'You already applied V3__add_index.sql in production and then find a mistake in it. What should you do?',
          'Add a new migration, V4, that fixes it',
          [
            'Edit the V3 file and redeploy',
            'Rename the file to V2',
            'Delete the V3 file from the project',
          ],
          'Flyway compares a checksum with the one stored when V3 ran. A changed or missing file makes validation fail, so corrections go in a new version.',
        ),
        q(
          'Requests fail with “Connection is not available, request timed out”. What is the best first step?',
          'Look for slow queries and long transactions that hold connections',
          [
            'Raise the pool size to 1000',
            'Turn the connection pool off',
            'Restart the application every night',
          ],
          'A huge pool can overload the database. Finding what keeps connections busy fixes the cause instead of hiding it.',
        ),
      ],
    },
  ],
};
