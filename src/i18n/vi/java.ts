/** Vietnamese strings: java. Key = the exact English source string. */
export const java: Record<string, string> = {
  'Java & Spring Boot': 'Java & Spring Boot',
  'Java core': 'Java cốt lõi',
  'The language features you use every day, and the habits that keep code correct.':
    'Những tính năng ngôn ngữ bạn dùng hằng ngày, và những thói quen giúp code luôn đúng.',
  'Classes, interfaces and records': 'Class, interface và record',
  'Contracts, implementations and immutable data carriers.':
    'Hợp đồng, phần triển khai và các đối tượng dữ liệu bất biến.',
  'A class bundles data with the behaviour that works on it. An interface lists what something can do without saying how, so callers depend on the contract and not on one implementation.':
    'Một class gói dữ liệu cùng hành vi xử lý dữ liệu đó. Một interface liệt kê những gì một đối tượng có thể làm mà không nói làm như thế nào, nên nơi gọi phụ thuộc vào hợp đồng chứ không phụ thuộc vào một cách triển khai cụ thể.',
  'Since Java 16 a record is the short way to write an immutable data carrier. The compiler generates the constructor, the accessors, equals, hashCode and toString.':
    'Từ Java 16, record là cách viết ngắn gọn cho một đối tượng mang dữ liệu bất biến. Trình biên dịch tự sinh constructor, các hàm truy cập (accessor), equals, hashCode và toString.',
  'Prefer composition over inheritance: give a class a PaymentGateway to use instead of extending a base class to reuse code.':
    'Ưu tiên composition hơn inheritance: hãy đưa cho class một PaymentGateway để dùng, thay vì kế thừa một class cha chỉ để tái sử dụng code.',
  'What does a Java record generate for you?': 'Một record trong Java tự sinh những gì cho bạn?',
  'A constructor, accessors, equals, hashCode and toString':
    'Constructor, accessor, equals, hashCode và toString',
  'Only getters and setters': 'Chỉ getter và setter',
  'A database table': 'Một bảng trong cơ sở dữ liệu',
  'A thread-safe singleton': 'Một singleton an toàn với thread',
  'A record is a compact immutable data class; the compiler writes the boilerplate members.':
    'Record là một data class bất biến gọn nhẹ; trình biên dịch viết sẵn các thành viên lặp đi lặp lại giúp bạn.',
  'Why do callers depend on an interface rather than on a class?':
    'Vì sao nơi gọi nên phụ thuộc vào interface thay vì phụ thuộc vào class?',
  'It makes the code compile faster': 'Giúp code biên dịch nhanh hơn',
  'Interfaces are always faster at runtime': 'Interface luôn chạy nhanh hơn lúc runtime',
  'They can swap implementations without changing the caller':
    'Có thể đổi phần triển khai mà không phải sửa nơi gọi',
  'Interfaces hold mutable state for every instance':
    'Interface giữ trạng thái có thể thay đổi cho mọi instance',
  'Depending on the contract keeps callers independent of how the work is done, which also makes testing with fakes easy.':
    'Phụ thuộc vào hợp đồng giúp nơi gọi độc lập với cách công việc được thực hiện, và cũng giúp việc test bằng đối tượng giả (fake) trở nên dễ dàng.',
  'Which statement about records is true?': 'Phát biểu nào về record là đúng?',
  'A record can extend another class': 'Một record có thể kế thừa một class khác',
  'Record components are final, so a record is shallowly immutable':
    'Các thành phần của record là final, nên record bất biến ở mức nông (shallow)',
  'Record fields can be reassigned with setters':
    'Có thể gán lại các trường của record bằng setter',
  'Records only work with Spring': 'Record chỉ hoạt động với Spring',
  'Record fields cannot be reassigned. They are only shallowly immutable: a List inside a record can still be changed.':
    'Các trường của record không thể gán lại. Chúng chỉ bất biến ở mức nông: một List bên trong record vẫn có thể bị thay đổi.',
  'Collections: List, Set and Map': 'Collection: List, Set và Map',
  'Choose the right collection and avoid hashCode traps.':
    'Chọn đúng collection và tránh các bẫy hashCode.',
  'A List keeps order and allows duplicates. A Set holds no duplicates. A Map links a key to a value.':
    'List giữ thứ tự và cho phép phần tử trùng. Set không chứa phần tử trùng. Map liên kết một key với một value.',
  'HashMap and HashSet find items with hashCode() and equals(). If you override equals() you must override hashCode() so that equal objects have equal hash codes. Otherwise lookups fail in ways that are hard to see.':
    'HashMap và HashSet tìm phần tử bằng hashCode() và equals(). Nếu bạn override equals() thì bạn phải override cả hashCode() để các đối tượng bằng nhau có cùng mã băm. Nếu không, việc tra cứu sẽ lỗi theo những cách rất khó nhận ra.',
  'ArrayList: fast access by index; slow to insert in the middle.':
    'ArrayList: truy cập theo chỉ số nhanh; chèn vào giữa chậm.',
  'HashMap: fast lookup by key on average; no order.':
    'HashMap: tra cứu theo key nhanh (trung bình); không có thứ tự.',
  'TreeMap: keys kept sorted; lookups cost O(log n).':
    'TreeMap: các key luôn được sắp xếp; mỗi lần tra cứu tốn O(log n).',
  'List.of(...), Set.of(...), Map.of(...) make small immutable collections.':
    'List.of(...), Set.of(...), Map.of(...) tạo các collection nhỏ bất biến.',
  'Need to find a user by id quickly? Keep a Map<Long, User>, not a List you loop over.':
    'Cần tìm người dùng theo id thật nhanh? Hãy giữ một Map<Long, User>, đừng dùng một List rồi lặp qua nó.',
  'Two objects are equal by equals() but have different hashCode() values. What can happen in a HashSet?':
    'Hai đối tượng bằng nhau theo equals() nhưng có giá trị hashCode() khác nhau. Điều gì có thể xảy ra trong HashSet?',
  'Nothing, hashCode is optional': 'Không có gì, hashCode là tùy chọn',
  'Both can be stored as if they were different objects':
    'Cả hai có thể được lưu như thể chúng là hai đối tượng khác nhau',
  'The program will not compile': 'Chương trình không biên dịch được',
  'The set throws an exception on add': 'Set ném exception khi add',
  'The set uses hashCode to choose a bucket first, so an equal object can land in another bucket and is never compared.':
    'Set dùng hashCode để chọn bucket trước, nên một đối tượng bằng nhau có thể rơi vào bucket khác và không bao giờ được đem ra so sánh.',
  'Which collection keeps its keys sorted?': 'Collection nào giữ các key theo thứ tự đã sắp xếp?',
  HashMap: 'HashMap',
  ArrayList: 'ArrayList',
  TreeMap: 'TreeMap',
  HashSet: 'HashSet',
  'TreeMap is a sorted map. HashMap and HashSet give no order guarantee.':
    'TreeMap là một map có sắp xếp. HashMap và HashSet không đảm bảo thứ tự.',
  'You need to look up a user by id many times. What is the best fit?':
    'Bạn cần tra cứu người dùng theo id rất nhiều lần. Lựa chọn nào phù hợp nhất?',
  'List<User> and a loop': 'List<User> và một vòng lặp',
  'Map<Long, User>': 'Map<Long, User>',
  'Set<User> and contains': 'Set<User> và contains',
  'Queue<User>': 'Queue<User>',
  'A hash map finds a key in constant time on average; looping a list takes time proportional to its size.':
    'Hash map tìm một key trong thời gian hằng số (trung bình); lặp qua một list tốn thời gian tỉ lệ với kích thước của nó.',
  'Lambdas and streams': 'Lambda và stream',
  'Describe data pipelines, and know when a plain loop is better.':
    'Mô tả các đường ống xử lý dữ liệu, và biết khi nào dùng vòng lặp thường thì tốt hơn.',
  'A lambda is a short function written inline, such as x -> x * 2. A method reference such as User::name is shorthand for a lambda that calls one method.':
    'Lambda là một hàm ngắn viết ngay tại chỗ, ví dụ x -> x * 2. Method reference như User::name là cách viết tắt của một lambda chỉ gọi một method.',
  'A stream describes a pipeline: a source, some intermediate steps and one terminal step. The intermediate steps are lazy. Nothing runs until the terminal step is called.':
    'Stream mô tả một đường ống (pipeline): một nguồn, vài bước trung gian và một bước kết thúc. Các bước trung gian là lazy (lười). Không có gì chạy cho đến khi bước kết thúc được gọi.',
  'Intermediate: filter, map, sorted, distinct, limit.':
    'Trung gian: filter, map, sorted, distinct, limit.',
  'Terminal: toList, collect, count, forEach, reduce, findFirst.':
    'Kết thúc: toList, collect, count, forEach, reduce, findFirst.',
  'Do not change outside variables from inside a lambda; build a result instead.':
    'Đừng thay đổi biến bên ngoài từ trong lambda; hãy tạo ra một kết quả mới.',
  'A plain for loop is fine, and often clearer, when you need early exits or you change several variables.':
    'Vòng lặp for thường vẫn ổn, và nhiều khi rõ ràng hơn, khi bạn cần thoát sớm hoặc thay đổi nhiều biến.',
  'When does a stream pipeline actually run?': 'Khi nào thì một stream pipeline thực sự chạy?',
  'As soon as filter() is called': 'Ngay khi filter() được gọi',
  'When a terminal operation such as toList() is called':
    'Khi một thao tác kết thúc như toList() được gọi',
  'When the stream is created': 'Khi stream được tạo ra',
  'Every 10 ms in the background': 'Cứ mỗi 10 ms ở chế độ nền',
  'Intermediate operations only describe work. The terminal operation starts it.':
    'Các thao tác trung gian chỉ mô tả công việc. Thao tác kết thúc mới bắt đầu chạy.',
  'What does User::name mean?': 'User::name nghĩa là gì?',
  'A static field called name': 'Một trường static tên là name',
  'A new User object': 'Một đối tượng User mới',
  'A code comment': 'Một chú thích trong code',
  'A method reference equal to u -> u.name()': 'Một method reference tương đương u -> u.name()',
  'It is a method reference: a shorter way to write a lambda that only calls one method.':
    'Đó là một method reference: cách viết ngắn hơn cho một lambda chỉ gọi một method.',
  'Which of these is a terminal operation?':
    'Thao tác nào sau đây là thao tác kết thúc (terminal)?',
  count: 'count',
  map: 'map',
  filter: 'filter',
  sorted: 'sorted',
  'count() produces a result and ends the pipeline. map, filter and sorted return another stream.':
    'count() tạo ra kết quả và kết thúc pipeline. map, filter và sorted trả về một stream khác.',
  'Exceptions done right': 'Xử lý exception đúng cách',
  'Checked vs unchecked, try-with-resources and keeping the cause.':
    'Checked và unchecked, try-with-resources và giữ lại nguyên nhân gốc.',
  'Checked exceptions (subclasses of Exception that are not RuntimeException) must be handled or declared. Unchecked exceptions (RuntimeException and its subclasses) do not. Use unchecked exceptions for programming errors and for failures the caller cannot fix.':
    'Checked exception (lớp con của Exception nhưng không phải RuntimeException) bắt buộc phải được xử lý hoặc khai báo. Unchecked exception (RuntimeException và các lớp con của nó) thì không. Hãy dùng unchecked exception cho lỗi lập trình và cho những lỗi mà nơi gọi không thể khắc phục.',
  'try-with-resources closes the reader for you, even if an exception is thrown.':
    'try-with-resources tự đóng reader cho bạn, kể cả khi có exception được ném ra.',
  'Never swallow an exception silently. At least log it.':
    'Không bao giờ nuốt exception một cách âm thầm. Ít nhất hãy ghi log.',
  'When you wrap an exception, pass the original as the cause.':
    'Khi bọc (wrap) một exception, hãy truyền exception gốc làm cause.',
  'Catch the most specific type you can handle.':
    'Hãy bắt (catch) kiểu cụ thể nhất mà bạn có thể xử lý.',
  'Do not use exceptions for normal control flow.':
    'Đừng dùng exception cho luồng điều khiển thông thường.',
  'The message should say what you were doing and with what, for example the file name.':
    'Thông điệp nên nói rõ bạn đang làm gì và với cái gì, ví dụ tên tệp.',
  'What does try-with-resources do?': 'try-with-resources làm gì?',
  'Retries the block three times': 'Thử lại khối lệnh ba lần',
  'Makes every exception checked': 'Biến mọi exception thành checked',
  'Closes AutoCloseable resources automatically, even when an exception is thrown':
    'Tự động đóng các tài nguyên AutoCloseable, kể cả khi có exception được ném ra',
  'Disables garbage collection': 'Tắt garbage collection',
  'Resources declared in the parentheses are closed in reverse order when the block ends, normally or not.':
    'Các tài nguyên khai báo trong dấu ngoặc đơn được đóng theo thứ tự ngược lại khi khối lệnh kết thúc, dù bình thường hay có lỗi.',
  'Why pass the original exception as the cause when you wrap it?':
    'Vì sao nên truyền exception gốc làm cause khi bọc nó?',
  'So the stack trace of the root problem is not lost': 'Để không mất stack trace của vấn đề gốc',
  'It makes the code faster': 'Giúp code chạy nhanh hơn',
  'The compiler requires it': 'Trình biên dịch bắt buộc',
  'It turns the exception into a checked one': 'Nó biến exception thành checked',
  'The cause keeps the first failure visible in logs, which is where you usually find the real bug.':
    'Cause giữ cho lỗi đầu tiên hiện rõ trong log, nơi bạn thường tìm ra bug thật sự.',
  'Which of these is an unchecked exception?': 'Cái nào sau đây là unchecked exception?',
  IOException: 'IOException',
  IllegalArgumentException: 'IllegalArgumentException',
  SQLException: 'SQLException',
  Exception: 'Exception',
  'IllegalArgumentException extends RuntimeException, so it is not checked by the compiler.':
    'IllegalArgumentException kế thừa RuntimeException, nên trình biên dịch không kiểm tra nó.',
  'Concurrency basics': 'Kiến thức cơ bản về đồng thời (concurrency)',
  'Race conditions, executors, atomics and virtual threads.':
    'Race condition, executor, atomic và virtual thread.',
  'A thread runs code independently of others. Most concurrency bugs come from several threads changing shared mutable state at the same time. This is called a race condition.':
    'Một thread chạy code độc lập với các thread khác. Phần lớn lỗi đồng thời xuất phát từ việc nhiều thread cùng lúc thay đổi trạng thái chia sẻ có thể thay đổi. Đây gọi là race condition.',
  'Prefer immutable data: nothing to race on.':
    'Ưu tiên dữ liệu bất biến: không có gì để tranh chấp.',
  'Use ConcurrentHashMap, not HashMap, when threads share a map.':
    'Dùng ConcurrentHashMap, không dùng HashMap, khi các thread dùng chung một map.',
  'Use AtomicInteger or LongAdder for shared counters.':
    'Dùng AtomicInteger hoặc LongAdder cho các bộ đếm dùng chung.',
  'Always shut down an ExecutorService you create.':
    'Luôn shut down một ExecutorService do bạn tạo ra.',
  'Java 21 added virtual threads: very cheap threads for tasks that mostly wait on blocking I/O. Executors.newVirtualThreadPerTaskExecutor() starts one per task.':
    'Java 21 bổ sung virtual thread: những thread rất nhẹ cho các tác vụ chủ yếu chờ I/O chặn (blocking). Executors.newVirtualThreadPerTaskExecutor() khởi chạy một thread cho mỗi tác vụ.',
  'count++ is three steps (read, add, write). Two threads can both read the same value and one update is lost.':
    'count++ gồm ba bước (đọc, cộng, ghi). Hai thread có thể cùng đọc một giá trị và một lần cập nhật bị mất.',
  'Two threads run count++ on a shared int with no synchronisation. What can go wrong?':
    'Hai thread cùng chạy count++ trên một int dùng chung mà không đồng bộ hóa. Điều gì có thể sai?',
  'Updates can be lost, because this is a race condition':
    'Cập nhật có thể bị mất, vì đây là một race condition',
  'The JVM prevents it automatically': 'JVM tự động ngăn điều đó',
  'The code will not compile': 'Code sẽ không biên dịch được',
  'count always becomes negative': 'count luôn trở thành số âm',
  'count++ reads, adds and writes. Two threads can read the same old value, so one increment disappears.':
    'count++ đọc, cộng rồi ghi. Hai thread có thể đọc cùng một giá trị cũ, nên một lần tăng biến mất.',
  'Which class is designed for a safe shared counter?':
    'Class nào được thiết kế cho bộ đếm dùng chung an toàn?',
  StringBuilder: 'StringBuilder',
  AtomicInteger: 'AtomicInteger',
  'AtomicInteger offers atomic operations such as incrementAndGet() without explicit locks.':
    'AtomicInteger cung cấp các thao tác nguyên tử (atomic) như incrementAndGet() mà không cần khóa tường minh.',
  'What are virtual threads (Java 21) best for?':
    'Virtual thread (Java 21) phù hợp nhất cho việc gì?',
  'CPU-heavy number crunching on every core': 'Tính toán số nặng bằng CPU trên mọi nhân',
  'Replacing the garbage collector': 'Thay thế garbage collector',
  'Many concurrent tasks that mostly wait on blocking I/O':
    'Nhiều tác vụ đồng thời chủ yếu chờ I/O chặn',
  'Running code without a JVM': 'Chạy code mà không cần JVM',
  'Virtual threads are cheap, so you can have one per request even when most of them are waiting on the network or a database.':
    'Virtual thread rất nhẹ, nên bạn có thể dùng một thread cho mỗi request ngay cả khi phần lớn chúng đang chờ mạng hoặc cơ sở dữ liệu.',
  'Spring Boot essentials': 'Kiến thức cốt lõi về Spring Boot',
  'Build a small service: beans, REST endpoints, data access, configuration and tests.':
    'Xây dựng một service nhỏ: bean, REST endpoint, truy cập dữ liệu, cấu hình và test.',
  'Dependency injection and beans': 'Dependency injection và bean',
  'How Spring creates and wires your objects.': 'Cách Spring tạo và kết nối các đối tượng của bạn.',
  'Spring’s container creates objects, called beans, and passes each one the other beans it needs. You declare what you need; Spring supplies it. This is dependency injection.':
    'Container của Spring tạo ra các đối tượng, gọi là bean, và truyền cho mỗi bean những bean khác mà nó cần. Bạn khai báo mình cần gì; Spring cung cấp. Đây là dependency injection.',
  'Prefer constructor injection: dependencies are explicit and final, and you can build the class in a plain unit test.':
    'Ưu tiên constructor injection: các dependency rõ ràng và là final, và bạn có thể khởi tạo class trong một unit test thông thường.',
  'Beans are singletons by default: one shared instance.':
    'Mặc định bean là singleton: chỉ có một instance dùng chung.',
  '@Component, @Service, @Repository and @RestController are found by component scanning from the package of your @SpringBootApplication class.':
    '@Component, @Service, @Repository và @RestController được tìm thấy qua component scanning, bắt đầu từ package chứa class @SpringBootApplication của bạn.',
  'Use @Configuration with @Bean methods for objects from third-party libraries.':
    'Dùng @Configuration với các method @Bean cho những đối tượng đến từ thư viện bên thứ ba.',
  'Two beans of the same type? Mark one @Primary or pick one with @Qualifier.':
    'Có hai bean cùng kiểu? Đánh dấu một bean là @Primary hoặc chọn một bean bằng @Qualifier.',
  'Why prefer constructor injection over field injection?':
    'Vì sao nên ưu tiên constructor injection hơn field injection?',
  'Dependencies are explicit and final, and the class is easy to unit test without Spring':
    'Dependency rõ ràng và là final, và class dễ unit test mà không cần Spring',
  'It is faster at runtime': 'Nó chạy nhanh hơn lúc runtime',
  'Field injection is not allowed in Spring Boot':
    'Field injection không được phép dùng trong Spring Boot',
  'It removes the need for beans': 'Nó loại bỏ nhu cầu dùng bean',
  'With a constructor you can create the object in a test by passing fakes, and the fields can be final.':
    'Với constructor, bạn có thể tạo đối tượng trong test bằng cách truyền vào các đối tượng giả, và các trường có thể là final.',
  'What is the default scope of a Spring bean?': 'Scope mặc định của một Spring bean là gì?',
  Singleton: 'Singleton',
  Prototype: 'Prototype',
  Request: 'Request',
  Session: 'Session',
  'By default Spring creates one instance of a bean and shares it, so beans must not keep per-request state.':
    'Theo mặc định Spring tạo một instance duy nhất của bean và dùng chung nó, nên bean không được giữ trạng thái riêng của từng request.',
  'Where does component scanning start with @SpringBootApplication?':
    'Với @SpringBootApplication, component scanning bắt đầu từ đâu?',
  'Only in the default package': 'Chỉ trong default package',
  'In every package on the classpath': 'Trong mọi package trên classpath',
  'In the package of the annotated class and its sub-packages':
    'Trong package của class được chú thích và các package con của nó',
  'Only in classes named *Service': 'Chỉ trong các class có tên *Service',
  'Put the main class in the root package of your application so all your beans are found.':
    'Hãy đặt class main ở package gốc của ứng dụng để mọi bean của bạn đều được tìm thấy.',
  'Building a REST controller': 'Xây dựng một REST controller',
  'Endpoints, validation, DTOs and one place for errors.':
    'Endpoint, validation, DTO và một nơi duy nhất để xử lý lỗi.',
  'A @RestController maps HTTP requests to methods. Spring converts JSON to objects and back using Jackson.':
    '@RestController ánh xạ các HTTP request tới các method. Spring chuyển JSON thành đối tượng và ngược lại bằng Jackson.',
  'Return DTOs, not JPA entities: the API stays stable when the database model changes.':
    'Trả về DTO, không trả về JPA entity: API vẫn ổn định khi mô hình cơ sở dữ liệu thay đổi.',
  'Validate input with Bean Validation: @Valid, @NotBlank, @Positive.':
    'Kiểm tra dữ liệu đầu vào bằng Bean Validation: @Valid, @NotBlank, @Positive.',
  'Handle errors in one place with @RestControllerAdvice and @ExceptionHandler.':
    'Xử lý lỗi ở một nơi bằng @RestControllerAdvice và @ExceptionHandler.',
  'Use meaningful status codes: 201 created, 400 invalid input, 404 not found, 409 conflict.':
    'Dùng mã trạng thái có ý nghĩa: 201 đã tạo, 400 dữ liệu không hợp lệ, 404 không tìm thấy, 409 xung đột.',
  'Keep controllers thin: parse, call a service, return. Business rules belong in the service.':
    'Giữ controller mỏng: phân tích request, gọi service, trả kết quả. Quy tắc nghiệp vụ thuộc về service.',
  'Which annotation reads a JSON request body into an object?':
    'Annotation nào đọc phần thân (body) JSON của request thành một đối tượng?',
  '@PathVariable': '@PathVariable',
  '@ResponseStatus': '@ResponseStatus',
  '@RequestBody': '@RequestBody',
  '@Autowired': '@Autowired',
  '@RequestBody tells Spring to deserialise the body. @PathVariable reads a value from the URL path.':
    '@RequestBody yêu cầu Spring giải tuần tự hóa (deserialise) phần body. @PathVariable đọc một giá trị từ đường dẫn URL.',
  'Where do you turn exceptions into HTTP error responses once for the whole app?':
    'Bạn chuyển exception thành phản hồi lỗi HTTP một lần cho cả ứng dụng ở đâu?',
  'A try/catch in every controller method': 'Một try/catch trong mọi method của controller',
  'The repository layer': 'Tầng repository',
  'A @RestControllerAdvice class with @ExceptionHandler methods':
    'Một class @RestControllerAdvice với các method @ExceptionHandler',
  'application.yml': 'application.yml',
  'A controller advice centralises error mapping so every endpoint returns the same error format.':
    'Controller advice tập trung việc ánh xạ lỗi, nên mọi endpoint đều trả về cùng một định dạng lỗi.',
  'Why return DTOs instead of JPA entities from controllers?':
    'Vì sao controller nên trả về DTO thay vì JPA entity?',
  'Entities cannot be turned into JSON': 'Entity không thể chuyển thành JSON',
  'The API contract stays independent of the database model, and no fields leak by accident':
    'Hợp đồng API độc lập với mô hình cơ sở dữ liệu, và không có trường nào bị lộ ra ngoài một cách vô tình',
  'Spring forbids returning entities': 'Spring cấm trả về entity',
  'DTOs are required by HTTP': 'HTTP bắt buộc phải dùng DTO',
  'Entities can be serialised, but doing so ties your API to your tables and can expose internal fields or lazy data.':
    'Entity có thể được tuần tự hóa (serialise), nhưng làm vậy sẽ gắn API của bạn với các bảng và có thể làm lộ các trường nội bộ hoặc dữ liệu lazy.',
  'Spring Data JPA and transactions': 'Spring Data JPA và transaction',
  'Repositories from interfaces, and transactions that roll back.':
    'Repository từ interface, và transaction có thể rollback.',
  'With Spring Data JPA you write a repository interface and Spring implements it. Simple queries are derived from the method name.':
    'Với Spring Data JPA, bạn viết một repository interface và Spring tự triển khai nó. Các truy vấn đơn giản được suy ra từ tên method.',
  '@Transactional on a method runs it in one database transaction. By default it commits when the method returns and rolls back when a RuntimeException escapes. A checked exception does not roll back unless you set rollbackFor.':
    '@Transactional trên một method chạy method đó trong một transaction cơ sở dữ liệu. Mặc định nó commit khi method trả về và rollback khi một RuntimeException thoát ra ngoài. Checked exception không gây rollback trừ khi bạn đặt rollbackFor.',
  'Put @Transactional on service methods that form one business operation, not on controllers.':
    'Đặt @Transactional trên các method của service tạo thành một thao tác nghiệp vụ, không đặt trên controller.',
  'By default, which exception makes @Transactional roll back?':
    'Theo mặc định, exception nào khiến @Transactional rollback?',
  'Only checked exceptions': 'Chỉ checked exception',
  'A RuntimeException (unchecked)': 'RuntimeException (unchecked)',
  'Every exception, checked or not': 'Mọi exception, dù checked hay không',
  'None; you must call rollback yourself': 'Không exception nào; bạn phải tự gọi rollback',
  'Spring rolls back on unchecked exceptions and errors by default. Use rollbackFor to include checked ones.':
    'Spring mặc định rollback với unchecked exception và error. Dùng rollbackFor để bao gồm cả checked exception.',
  'What does findByEmail(String email) in a Spring Data repository do?':
    'findByEmail(String email) trong một Spring Data repository làm gì?',
  'Spring derives a query that selects users by the email column':
    'Spring suy ra một truy vấn chọn người dùng theo cột email',
  'Nothing until you write the SQL': 'Không làm gì cho đến khi bạn viết SQL',
  'Loads every user and filters in memory': 'Tải mọi người dùng rồi lọc trong bộ nhớ',
  'Deletes the user': 'Xóa người dùng',
  'Spring Data parses the method name and builds the query for you.':
    'Spring Data phân tích tên method và dựng truy vấn giúp bạn.',
  'Where should @Transactional normally go?': '@Transactional thường nên đặt ở đâu?',
  'On controller methods only': 'Chỉ trên các method của controller',
  'On entity fields': 'Trên các trường của entity',
  'On service methods that make up one business operation':
    'Trên các method của service tạo thành một thao tác nghiệp vụ',
  'On every repository method separately': 'Trên từng method của repository một cách riêng lẻ',
  'The service method is the natural boundary: all its steps succeed together or none of them do.':
    'Method của service là ranh giới tự nhiên: mọi bước của nó cùng thành công hoặc không bước nào được áp dụng.',
  'Configuration, profiles and testing': 'Cấu hình, profile và kiểm thử',
  'Settings per environment, and the right test for each layer.':
    'Cài đặt theo từng môi trường, và loại test phù hợp cho từng tầng.',
  'Spring Boot reads settings from application.yml (or .properties). Profiles let one file hold different values for dev and production, and environment variables override file values.':
    'Spring Boot đọc cài đặt từ application.yml (hoặc .properties). Profile cho phép một tệp chứa các giá trị khác nhau cho dev và production, và biến môi trường ghi đè giá trị trong tệp.',
  'Run with the dev profile: SPRING_PROFILES_ACTIVE=dev':
    'Chạy với profile dev: SPRING_PROFILES_ACTIVE=dev',
  'Typed settings. Register with @ConfigurationPropertiesScan on your application class.':
    'Cài đặt có kiểu (typed). Đăng ký bằng @ConfigurationPropertiesScan trên class ứng dụng của bạn.',
  'Unit tests: plain JUnit and Mockito for logic. Fastest.':
    'Unit test: JUnit và Mockito thuần cho phần logic. Nhanh nhất.',
  '@WebMvcTest: only the web layer, for controllers.':
    '@WebMvcTest: chỉ tầng web, dành cho controller.',
  '@DataJpaTest: only repositories, with an in-memory or container database.':
    '@DataJpaTest: chỉ các repository, với cơ sở dữ liệu in-memory hoặc container.',
  '@SpringBootTest: the full application. Slowest, so use it sparingly.':
    '@SpringBootTest: toàn bộ ứng dụng. Chậm nhất, nên hãy dùng tiết kiệm.',
  'Never commit passwords. Read them from environment variables or a secrets manager.':
    'Không bao giờ commit mật khẩu. Hãy đọc chúng từ biến môi trường hoặc một secrets manager.',
  'Which annotation loads only the web layer for fast controller tests?':
    'Annotation nào chỉ nạp tầng web để test controller nhanh?',
  '@SpringBootTest': '@SpringBootTest',
  '@DataJpaTest': '@DataJpaTest',
  '@Configuration': '@Configuration',
  '@WebMvcTest': '@WebMvcTest',
  '@WebMvcTest starts controllers, filters and MVC infrastructure but not the whole application.':
    '@WebMvcTest khởi động controller, filter và hạ tầng MVC nhưng không khởi động toàn bộ ứng dụng.',
  'How do you activate the dev profile?': 'Làm thế nào để kích hoạt profile dev?',
  'Set spring.profiles.active=dev, for example with the SPRING_PROFILES_ACTIVE variable':
    'Đặt spring.profiles.active=dev, ví dụ bằng biến SPRING_PROFILES_ACTIVE',
  'Rename the jar file to dev.jar': 'Đổi tên tệp jar thành dev.jar',
  'Add @Dev to the main class': 'Thêm @Dev vào class main',
  'Delete application.yml': 'Xóa application.yml',
  'The active profile is a normal setting, so a property, a command-line argument or an environment variable all work.':
    'Profile đang hoạt động là một cài đặt bình thường, nên dùng property, tham số dòng lệnh hay biến môi trường đều được.',
  'Where should production database passwords live?':
    'Mật khẩu cơ sở dữ liệu production nên để ở đâu?',
  'In application.yml committed to git': 'Trong application.yml được commit lên git',
  'In a comment next to the code': 'Trong một chú thích cạnh đoạn code',
  'In environment variables or a secrets manager, never in the git repository':
    'Trong biến môi trường hoặc một secrets manager, tuyệt đối không để trong git repository',
  'In the README': 'Trong README',
  'Anything committed to git is copied to every clone and stays in the history.':
    'Mọi thứ đã commit lên git đều được sao chép tới mọi bản clone và nằm lại trong lịch sử.',
  'Architecture and performance': 'Kiến trúc và hiệu năng',
  'Structure that stays testable, and the three performance topics that matter most.':
    'Cấu trúc luôn dễ kiểm thử, và ba chủ đề hiệu năng quan trọng nhất.',
  'Layers, ports and adapters': 'Layer, port và adapter',
  'Keep business rules independent of frameworks and databases.':
    'Giữ quy tắc nghiệp vụ độc lập với framework và cơ sở dữ liệu.',
  'A layered design splits the code into controller, service and repository. Business rules should live in the service or domain layer, not in controllers or SQL.':
    'Thiết kế phân tầng chia code thành controller, service và repository. Quy tắc nghiệp vụ nên nằm ở tầng service hoặc domain, không nằm trong controller hay SQL.',
  'Ports and adapters (hexagonal architecture) goes further. The core defines ports, which are interfaces for what it needs. Adapters for REST, the database or messaging implement or call those ports. Dependencies point inward, toward the core.':
    'Ports and adapters (kiến trúc hexagonal) đi xa hơn. Phần lõi định nghĩa các port, là những interface cho những gì nó cần. Các adapter cho REST, cơ sở dữ liệu hoặc messaging triển khai hoặc gọi các port đó. Các dependency hướng vào trong, về phía phần lõi.',
  'Benefit: test business rules with no HTTP and no database.':
    'Lợi ích: test quy tắc nghiệp vụ mà không cần HTTP hay cơ sở dữ liệu.',
  'Benefit: swap an adapter, such as a payment provider, without touching the core.':
    'Lợi ích: đổi một adapter, chẳng hạn nhà cung cấp thanh toán, mà không đụng đến phần lõi.',
  'Cost: more classes and mapping. Use it when the domain logic is real.':
    'Cái giá: thêm nhiều class và việc ánh xạ (mapping). Hãy dùng khi logic domain thật sự phức tạp.',
  'A simple CRUD service with no real rules rarely needs hexagonal architecture.':
    'Một service CRUD đơn giản không có quy tắc thật sự hiếm khi cần kiến trúc hexagonal.',
  'In ports and adapters, which way do dependencies point?':
    'Trong ports and adapters, các dependency hướng về phía nào?',
  'Toward the database': 'Về phía cơ sở dữ liệu',
  'Toward the web framework': 'Về phía web framework',
  'There is no rule': 'Không có quy tắc nào',
  'Toward the core: adapters depend on the core’s ports':
    'Về phía phần lõi: các adapter phụ thuộc vào các port của phần lõi',
  'The core knows nothing about frameworks. The outer layers know about the core.':
    'Phần lõi không biết gì về framework. Các tầng bên ngoài biết về phần lõi.',
  'What is a main benefit of keeping business rules in the core instead of in controllers?':
    'Lợi ích chính của việc giữ quy tắc nghiệp vụ trong phần lõi thay vì trong controller là gì?',
  'The code needs fewer classes': 'Code cần ít class hơn',
  'Rules run faster': 'Các quy tắc chạy nhanh hơn',
  'You no longer need unit tests': 'Bạn không còn cần unit test nữa',
  'You can test them without HTTP or a database':
    'Bạn có thể test chúng mà không cần HTTP hay cơ sở dữ liệu',
  'Pure core code can be tested with plain objects, which makes tests fast and reliable.':
    'Code lõi thuần có thể được test bằng các đối tượng thông thường, giúp test nhanh và đáng tin cậy.',
  'When is full hexagonal architecture probably overkill?':
    'Khi nào kiến trúc hexagonal đầy đủ có lẽ là quá mức cần thiết?',
  'A system with complex pricing rules': 'Một hệ thống có quy tắc tính giá phức tạp',
  'A simple CRUD service with almost no business rules':
    'Một service CRUD đơn giản gần như không có quy tắc nghiệp vụ',
  'A service that must swap payment providers': 'Một service phải đổi được nhà cung cấp thanh toán',
  'A long-lived product with many integrations': 'Một sản phẩm sống lâu với nhiều tích hợp',
  'The extra structure pays off when there are rules and integrations to protect, not when you only move rows.':
    'Cấu trúc thêm vào chỉ đáng giá khi có quy tắc và tích hợp cần bảo vệ, chứ không phải khi bạn chỉ chuyển các dòng dữ liệu qua lại.',
  'Database performance: N+1 and indexes': 'Hiệu năng cơ sở dữ liệu: N+1 và index',
  'The most common cause of a slow Spring service.':
    'Nguyên nhân phổ biến nhất khiến một Spring service chạy chậm.',
  'The N+1 problem: one query loads a list of N rows, and then each row triggers one more query to load a lazy association. A hundred orders become 101 queries.':
    'Vấn đề N+1: một truy vấn tải danh sách N dòng, rồi mỗi dòng lại kích hoạt thêm một truy vấn để tải một association lazy. Một trăm đơn hàng trở thành 101 truy vấn.',
  'Find it: turn on SQL logging or count queries in a test.':
    'Tìm ra nó: bật ghi log SQL hoặc đếm số truy vấn trong một test.',
  'Fix it: join fetch, @EntityGraph, batch fetching, or a DTO projection.':
    'Cách sửa: join fetch, @EntityGraph, batch fetching, hoặc DTO projection.',
  'Index columns used in WHERE, JOIN and ORDER BY.':
    'Đánh index cho các cột dùng trong WHERE, JOIN và ORDER BY.',
  'Check how the database runs a query with EXPLAIN.':
    'Kiểm tra cách cơ sở dữ liệu chạy một truy vấn bằng EXPLAIN.',
  'Always paginate large lists.': 'Luôn phân trang (paginate) các danh sách lớn.',
  'Join-fetching a collection together with pagination makes Hibernate page in memory. Page the ids first, then fetch.':
    'Join-fetch một collection cùng với phân trang khiến Hibernate phân trang trong bộ nhớ. Hãy phân trang các id trước, rồi mới fetch.',
  'What is the N+1 query problem?': 'Vấn đề truy vấn N+1 là gì?',
  'A query that returns N+1 columns': 'Một truy vấn trả về N+1 cột',
  'A database that has one table too many': 'Một cơ sở dữ liệu thừa một bảng',
  'A query that needs N+1 indexes': 'Một truy vấn cần N+1 index',
  'One query loads a list, then one extra query runs per item for a lazy association':
    'Một truy vấn tải một danh sách, rồi cứ mỗi phần tử lại chạy thêm một truy vấn cho một association lazy',
  'The list query is the “1”, and the per-row association loads are the “N”.':
    'Truy vấn lấy danh sách là “1”, còn các lần tải association theo từng dòng là “N”.',
  'Which tool shows how the database executes a query?':
    'Công cụ nào cho biết cơ sở dữ liệu thực thi một truy vấn như thế nào?',
  javac: 'javac',
  'git blame': 'git blame',
  'The garbage collector log': 'Log của garbage collector',
  'EXPLAIN (the query plan)': 'EXPLAIN (kế hoạch truy vấn)',
  'EXPLAIN shows whether the database uses an index or scans the whole table.':
    'EXPLAIN cho biết cơ sở dữ liệu có dùng index hay quét toàn bộ bảng.',
  'Which column most deserves an index?': 'Cột nào đáng được đánh index nhất?',
  'A column that is never queried': 'Một cột không bao giờ được truy vấn',
  'Every column of every table': 'Mọi cột của mọi bảng',
  'One that is used often in WHERE clauses or join conditions':
    'Một cột thường xuyên được dùng trong mệnh đề WHERE hoặc điều kiện join',
  'A column that is only ever updated': 'Một cột chỉ được cập nhật mà không bao giờ truy vấn',
  'Indexes speed up lookups but slow down writes and use space, so add them where queries need them.':
    'Index giúp tra cứu nhanh hơn nhưng làm việc ghi chậm đi và tốn dung lượng, nên chỉ thêm ở những chỗ truy vấn thật sự cần.',
  'JVM memory and garbage collection': 'Bộ nhớ JVM và garbage collection',
  'Heap, stack, GC, and measuring before tuning.':
    'Heap, stack, GC, và đo đạc trước khi tinh chỉnh.',
  'Java objects live on the heap, which the garbage collector cleans. Each thread has its own stack for method calls. Class metadata lives in metaspace. G1 has been the default collector since Java 9; ZGC targets very short pauses.':
    'Các đối tượng Java nằm trên heap, nơi garbage collector dọn dẹp. Mỗi thread có stack riêng cho các lần gọi method. Metadata của class nằm trong metaspace. G1 là collector mặc định từ Java 9; ZGC nhắm tới thời gian tạm dừng rất ngắn.',
  'Fixed heap size, G1 collector, GC logging.':
    'Kích thước heap cố định, collector G1, ghi log GC.',
  'Set the maximum heap on purpose, especially in containers.':
    'Hãy chủ động đặt heap tối đa, đặc biệt trong container.',
  'Measure first: GC logs, Java Flight Recorder, a profiler.':
    'Đo trước: log GC, Java Flight Recorder, một profiler.',
  'Most Java “memory leaks” are objects that are still referenced, such as a static map that only grows.':
    'Phần lớn “memory leak” trong Java là các đối tượng vẫn còn được tham chiếu, chẳng hạn một static map chỉ ngày càng lớn lên.',
  'OutOfMemoryError: Java heap space means the heap is full of reachable objects.':
    'OutOfMemoryError: Java heap space nghĩa là heap đã đầy các đối tượng vẫn còn truy cập được (reachable).',
  'A bigger heap hides a leak for longer; it does not fix it.':
    'Heap lớn hơn chỉ che giấu leak lâu hơn; nó không sửa được leak.',
  'Where are Java objects allocated?': 'Các đối tượng Java được cấp phát ở đâu?',
  'Only on the thread stack': 'Chỉ trên stack của thread',
  'In metaspace': 'Trong metaspace',
  'On the heap, managed by the garbage collector': 'Trên heap, do garbage collector quản lý',
  'On the disk': 'Trên ổ đĩa',
  'Objects live on the heap. Stacks hold method frames and local variables; metaspace holds class metadata.':
    'Các đối tượng nằm trên heap. Stack giữ các frame của method và biến cục bộ; metaspace giữ metadata của class.',
  'What usually causes a Java “memory leak”?':
    'Điều gì thường gây ra một “memory leak” trong Java?',
  'The garbage collector forgetting to run': 'Garbage collector quên chạy',
  'Objects that stay reachable, such as entries never removed from a static map':
    'Các đối tượng vẫn còn truy cập được, chẳng hạn các phần tử không bao giờ bị xóa khỏi một static map',
  'Having too many comments': 'Có quá nhiều chú thích',
  'Forgetting to call free()': 'Quên gọi free()',
  'The collector only frees unreachable objects. If something still points to them, they stay.':
    'Collector chỉ giải phóng những đối tượng không còn truy cập được. Nếu vẫn còn thứ gì trỏ tới chúng thì chúng sẽ ở lại.',
  'What should you do before changing JVM flags to tune performance?':
    'Bạn nên làm gì trước khi thay đổi các cờ JVM để tinh chỉnh hiệu năng?',
  'Double the heap and hope': 'Nhân đôi heap rồi hy vọng',
  'Disable the garbage collector': 'Tắt garbage collector',
  'Switch collectors at random': 'Đổi collector một cách ngẫu nhiên',
  'Measure with GC logs or a profiler to find the real bottleneck':
    'Đo bằng log GC hoặc một profiler để tìm ra nút thắt cổ chai thật sự',
  'Tuning without measurements often makes things worse or hides the real problem.':
    'Tinh chỉnh mà không đo đạc thường khiến mọi thứ tệ hơn hoặc che giấu vấn đề thật.',
};
