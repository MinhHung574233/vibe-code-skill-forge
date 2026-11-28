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
  'Data and transactions': 'Dữ liệu và transaction',
  'Map entities with JPA, query them with Spring Data, keep data consistent with transactions and evolve the schema safely.':
    'Ánh xạ entity bằng JPA, truy vấn bằng Spring Data, giữ dữ liệu nhất quán với transaction và thay đổi schema một cách an toàn.',
  'JPA entities and relationships': 'JPA entity và các quan hệ',
  'Map classes to tables, own the foreign key correctly and spot the N+1 trap.':
    'Ánh xạ class sang bảng, đặt khóa ngoại đúng phía và nhận ra bẫy N+1.',
  'An entity is a class that JPA maps to a database table. Hibernate is the JPA implementation that Spring Boot uses by default. In Spring Boot 3 the annotations live in the jakarta.persistence package, not javax.persistence.':
    'Entity là một class mà JPA ánh xạ sang một bảng trong cơ sở dữ liệu. Hibernate là bản triển khai JPA mà Spring Boot dùng mặc định. Trong Spring Boot 3, các annotation nằm trong package jakarta.persistence, không còn là javax.persistence.',
  'A bidirectional relationship. Imports from jakarta.persistence are omitted.':
    'Một quan hệ hai chiều (bidirectional). Các import từ jakarta.persistence được lược bớt.',
  'The @ManyToOne side owns the foreign key. The mappedBy on the @OneToMany side says that the relationship is already mapped from the other side. When you change the relationship in Java, update both sides so they agree.':
    'Phía @ManyToOne là phía sở hữu khóa ngoại. Thuộc tính mappedBy ở phía @OneToMany cho biết quan hệ đã được ánh xạ từ phía bên kia. Khi bạn thay đổi quan hệ trong Java, hãy cập nhật cả hai phía để chúng khớp nhau.',
  '@OneToMany and @ManyToMany are lazy by default. @ManyToOne and @OneToOne are eager by default, so set fetch = FetchType.LAZY on them yourself.':
    '@OneToMany và @ManyToMany mặc định là lazy. @ManyToOne và @OneToOne mặc định là eager, vì vậy hãy tự đặt fetch = FetchType.LAZY cho chúng.',
  'A lazy association is loaded on first access. Looping over a list of entities and touching a lazy association in each one causes the N+1 problem.':
    'Một association lazy được nạp ở lần truy cập đầu tiên. Lặp qua một danh sách entity và chạm vào association lazy của từng entity sẽ gây ra vấn đề N+1.',
  'Reading a lazy association when no Hibernate session is open throws LazyInitializationException.':
    'Đọc một association lazy khi không có Hibernate session nào đang mở sẽ ném LazyInitializationException.',
  'Entities need a mutable class with a no-argument constructor, so a record is not a good entity. Records are fine as DTOs and projections.':
    'Entity cần một class có thể thay đổi (mutable) và có constructor không tham số, nên record không phải là lựa chọn tốt cho entity. Record thích hợp để làm DTO và projection.',
  'Spring Boot enables open-in-view by default, which keeps a session open for the whole web request and hides lazy-loading mistakes. Many teams set spring.jpa.open-in-view=false and load what they need inside the service.':
    'Spring Boot bật open-in-view theo mặc định: session được giữ mở trong suốt một web request và che giấu các lỗi lazy loading. Nhiều đội đặt spring.jpa.open-in-view=false và nạp những gì cần dùng ngay trong service.',
  'In a bidirectional @OneToMany and @ManyToOne relationship, which side owns the foreign key?':
    'Trong một quan hệ hai chiều @OneToMany và @ManyToOne, phía nào sở hữu khóa ngoại?',
  'The @ManyToOne side, the one without mappedBy': 'Phía @ManyToOne, tức phía không có mappedBy',
  'The @OneToMany side, the one with mappedBy': 'Phía @OneToMany, tức phía có mappedBy',
  'Both sides equally': 'Cả hai phía như nhau',
  'The class that was written first': 'Class nào được viết trước',
  'The many side has the foreign key column in its table. mappedBy marks the other side as the mirror of that mapping.':
    'Phía “nhiều” có cột khóa ngoại nằm trong bảng của nó. mappedBy đánh dấu phía còn lại là bản phản chiếu của ánh xạ đó.',
  'A page loads 50 orders and runs 51 queries because the lazy items of each order are read in a loop. What is a good first fix?':
    'Một trang nạp 50 order và chạy 51 query vì các item lazy của mỗi order được đọc trong một vòng lặp. Cách sửa đầu tiên nào là hợp lý?',
  'Add a database index on the order id': 'Thêm một index vào cột id của order',
  'Fetch the items in the same query with join fetch or an @EntityGraph':
    'Nạp các item trong cùng một query bằng join fetch hoặc @EntityGraph',
  'Call getItems().size() on every order before returning':
    'Gọi getItems().size() cho từng order trước khi trả về',
  'Make the relationship eager everywhere': 'Đặt quan hệ thành eager ở mọi nơi',
  'Loading the orders and their items in one query removes the extra per-row queries. Eager mapping alone can still run one query per row, and touching each collection is exactly what causes the problem.':
    'Nạp order cùng item của chúng trong một query sẽ loại bỏ các query phát sinh theo từng dòng. Chỉ đặt eager thì vẫn có thể chạy một query cho mỗi dòng, còn việc chạm vào từng collection chính là nguyên nhân gây ra vấn đề.',
  'With no open Hibernate session, what happens when you read a lazy collection that was never loaded?':
    'Khi không có Hibernate session nào đang mở, điều gì xảy ra nếu bạn đọc một collection lazy chưa từng được nạp?',
  'It returns an empty list': 'Nó trả về một list rỗng',
  'It quietly opens a new connection and loads the data':
    'Nó lặng lẽ mở một kết nối mới và nạp dữ liệu',
  'The code does not compile': 'Code không biên dịch được',
  'Hibernate throws LazyInitializationException': 'Hibernate ném LazyInitializationException',
  'A lazy collection can only load while its session is open. Outside the session Hibernate cannot reach the database for it, so it fails with this exception.':
    'Một collection lazy chỉ có thể nạp khi session của nó còn mở. Ngoài session, Hibernate không thể truy cập cơ sở dữ liệu cho nó, nên thao tác lỗi với exception này.',
  'Spring Data repositories and queries': 'Spring Data repository và truy vấn',
  'Derived queries, @Query, paging and projections without writing boilerplate.':
    'Derived query, @Query, phân trang và projection mà không phải viết code lặp.',
  'JpaRepository<T, ID> gives you save, findById, findAll, deleteById, count and paging with no code. findById returns an Optional. Beyond that, Spring Data builds queries from method names.':
    'JpaRepository<T, ID> cho bạn sẵn save, findById, findAll, deleteById, count và phân trang mà không cần viết code. findById trả về một Optional. Ngoài ra, Spring Data tự dựng query từ tên method.',
  'When a method name would become too long or the query is complex, write it with @Query. Use named parameters. Never build the query by joining strings with user input, because that opens the door to injection.':
    'Khi tên method trở nên quá dài hoặc query phức tạp, hãy viết query bằng @Query. Dùng tham số có tên (named parameter). Đừng bao giờ ghép chuỗi với dữ liệu người dùng để tạo query, vì như vậy bạn mở cửa cho injection.',
  'Paging: PageRequest.of(0, 20, Sort.by("createdAt").descending()). A Page also knows the total count, which costs an extra count query. A Slice skips it.':
    'Phân trang: PageRequest.of(0, 20, Sort.by("createdAt").descending()). Một Page còn biết tổng số phần tử, việc này tốn thêm một query count. Slice thì bỏ qua bước đó.',
  'Projections: return a record or an interface with only the fields you need, so the query selects fewer columns.':
    'Projection: trả về một record hoặc một interface chỉ chứa các trường bạn cần, để query chọn ít cột hơn.',
  'Inside a transaction, changes to a loaded entity are saved at commit by dirty checking. You do not need to call save again.':
    'Bên trong một transaction, các thay đổi trên entity đã nạp sẽ được lưu khi commit nhờ dirty checking. Bạn không cần gọi save lần nữa.',
  'Derived queries are checked when the application starts, so a typo in a property name fails early.':
    'Derived query được kiểm tra khi ứng dụng khởi động, nên lỗi gõ sai tên thuộc tính sẽ báo lỗi sớm.',
  'Use findById(id).orElseThrow(...) with a clear exception, so a missing row becomes a 404 instead of a NullPointerException later.':
    'Hãy dùng findById(id).orElseThrow(...) với một exception rõ ràng, để một dòng không tồn tại trở thành lỗi 404 thay vì một NullPointerException về sau.',
  'What does Spring Data derive from the method name existsByReference(String reference)?':
    'Spring Data suy ra điều gì từ tên method existsByReference(String reference)?',
  'A query that checks whether a row with that reference exists and returns a boolean':
    'Một query kiểm tra xem có dòng nào với reference đó hay không và trả về boolean',
  'A query that deletes the row with that reference': 'Một query xóa dòng có reference đó',
  'A query that loads every row and filters in Java': 'Một query nạp mọi dòng rồi lọc trong Java',
  'Nothing: exists is not a supported keyword':
    'Không gì cả: exists không phải là từ khóa được hỗ trợ',
  'Prefixes such as findBy, existsBy, countBy and deleteBy are parsed, and the rest of the name becomes the condition.':
    'Các tiền tố như findBy, existsBy, countBy và deleteBy được phân tích, và phần còn lại của tên trở thành điều kiện.',
  'Why use named parameters in @Query instead of building the string with +?':
    'Vì sao nên dùng named parameter trong @Query thay vì dựng chuỗi bằng dấu +?',
  'String concatenation does not compile in annotations':
    'Ghép chuỗi không biên dịch được trong annotation',
  'Named parameters make the query run on another thread':
    'Named parameter khiến query chạy trên một thread khác',
  'The values are bound safely, which prevents injection':
    'Giá trị được gán (bind) an toàn, nhờ đó ngăn được injection',
  'JPQL cannot contain any literal values': 'JPQL không thể chứa bất kỳ giá trị literal nào',
  'Bound parameters are sent as data, never as part of the query text, so a malicious value cannot change the query.':
    'Tham số được gán là dữ liệu, không bao giờ là một phần của câu query, nên một giá trị độc hại không thể làm thay đổi query.',
  'A repository method returns Page<Order>. What does a Page carry that a plain List does not?':
    'Một method của repository trả về Page<Order>. Một Page mang thêm điều gì mà một List thường không có?',
  'The lazy collections of every order, already loaded':
    'Các collection lazy của mọi order, đã được nạp sẵn',
  'A cache of the next page of results': 'Một cache chứa trang kết quả kế tiếp',
  'A guarantee that the data will not change': 'Một đảm bảo rằng dữ liệu sẽ không thay đổi',
  'The total number of elements and pages, which needs an extra count query':
    'Tổng số phần tử và số trang, việc này cần thêm một query count',
  'A Page knows how many elements exist in total, so a UI can show page numbers. Counting costs one more query; a Slice avoids it.':
    'Một Page biết tổng cộng có bao nhiêu phần tử, nên giao diện có thể hiển thị số trang. Việc đếm tốn thêm một query; Slice tránh được điều này.',
  'Transactions: propagation, rollback and traps':
    'Transaction: propagation, rollback và các cái bẫy',
  'How @Transactional really works, and why it sometimes seems to do nothing.':
    '@Transactional thực sự hoạt động thế nào, và vì sao đôi khi nó có vẻ không làm gì cả.',
  '@Transactional works through a proxy. Spring wraps the bean in a proxy object that starts the transaction before the method and commits or rolls back after it. Only calls that go through the proxy are intercepted.':
    '@Transactional hoạt động thông qua một proxy. Spring bọc bean trong một đối tượng proxy: proxy bắt đầu transaction trước method rồi commit hoặc rollback sau method. Chỉ những lời gọi đi qua proxy mới bị chặn lại.',
  'The call to this.create skips the proxy, so the annotation is ignored. Move the method to another bean, or put @Transactional on createAll.':
    'Lời gọi this.create bỏ qua proxy nên annotation bị phớt lờ. Hãy chuyển method sang một bean khác, hoặc đặt @Transactional lên createAll.',
  'REQUIRED (default): join the current transaction, or start one if there is none.':
    'REQUIRED (mặc định): tham gia transaction hiện tại, hoặc bắt đầu một transaction mới nếu chưa có.',
  'REQUIRES_NEW: suspend the current transaction and run in a new, independent one that commits or rolls back on its own.':
    'REQUIRES_NEW: tạm dừng transaction hiện tại và chạy trong một transaction mới, độc lập, tự commit hoặc rollback riêng.',
  'MANDATORY: a transaction must already exist, otherwise an exception is thrown.':
    'MANDATORY: phải có sẵn một transaction, nếu không sẽ ném exception.',
  'Rollback happens for RuntimeException and Error. A checked exception commits unless you set rollbackFor.':
    'Rollback xảy ra với RuntimeException và Error. Một checked exception sẽ vẫn commit trừ khi bạn đặt rollbackFor.',
  'If an inner method that joined your transaction throws, the transaction is marked rollback-only. Catching the exception in the outer method does not save it, and the commit fails with UnexpectedRollbackException.':
    'Nếu một method bên trong đã tham gia transaction của bạn ném exception, transaction bị đánh dấu chỉ-rollback (rollback-only). Bắt exception ở method bên ngoài cũng không cứu được, và lúc commit sẽ lỗi với UnexpectedRollbackException.',
  'readOnly = true is a hint that lets Spring and Hibernate skip work such as dirty checking for queries.':
    'readOnly = true là một gợi ý giúp Spring và Hibernate bỏ qua một số việc, chẳng hạn dirty checking, khi chỉ đọc dữ liệu.',
  'Roll back for checked exceptions too.': 'Rollback cả với checked exception.',
  'Keep transactions short. Do not call a slow remote service inside one: it holds a database connection the whole time.':
    'Hãy giữ transaction ngắn. Đừng gọi một dịch vụ từ xa chậm bên trong transaction: nó giữ một kết nối cơ sở dữ liệu suốt thời gian đó.',
  'A method calls another @Transactional method of the same class with this.method(). What happens to the annotation on the called method?':
    'Một method gọi một method @Transactional khác của cùng class bằng this.method(). Điều gì xảy ra với annotation trên method được gọi?',
  'It starts a new transaction with REQUIRES_NEW':
    'Nó bắt đầu một transaction mới với REQUIRES_NEW',
  'It is ignored, because the call does not pass through the Spring proxy':
    'Nó bị phớt lờ, vì lời gọi không đi qua proxy của Spring',
  'Spring throws an exception at startup': 'Spring ném exception lúc khởi động',
  'It is applied twice, once for each call': 'Nó được áp dụng hai lần, mỗi lời gọi một lần',
  'The proxy sits outside the object. A call from inside the object goes straight to the method, so no transaction logic runs.':
    'Proxy nằm bên ngoài đối tượng. Một lời gọi từ bên trong đối tượng đi thẳng vào method, nên không có logic transaction nào chạy.',
  'An audit record must be saved even when the main operation rolls back. Which propagation fits the audit method, when it lives in another bean?':
    'Một bản ghi audit phải được lưu ngay cả khi thao tác chính bị rollback. Propagation nào phù hợp cho method ghi audit, khi nó nằm trong một bean khác?',
  REQUIRED: 'REQUIRED',
  MANDATORY: 'MANDATORY',
  REQUIRES_NEW: 'REQUIRES_NEW',
  SUPPORTS: 'SUPPORTS',
  'REQUIRES_NEW suspends the outer transaction and commits the audit on its own. With REQUIRED the audit would roll back together with the main operation.':
    'REQUIRES_NEW tạm dừng transaction bên ngoài và commit bản audit riêng. Với REQUIRED, bản audit sẽ bị rollback cùng với thao tác chính.',
  'How do you make a checked exception cause a rollback?':
    'Làm thế nào để một checked exception gây ra rollback?',
  'Declare the method private': 'Khai báo method là private',
  'Set readOnly = true': 'Đặt readOnly = true',
  'Catch the exception and return null': 'Bắt exception rồi trả về null',
  'Set rollbackFor = Exception.class (or the specific type) on @Transactional':
    'Đặt rollbackFor = Exception.class (hoặc kiểu cụ thể) trên @Transactional',
  'By default only unchecked exceptions and errors roll back. rollbackFor adds the exception types you list.':
    'Theo mặc định chỉ unchecked exception và error mới gây rollback. rollbackFor thêm vào các kiểu exception mà bạn liệt kê.',
  'Migrations and connection pooling': 'Migration và connection pool',
  'Change the schema with versioned scripts, and size the connection pool sensibly.':
    'Thay đổi schema bằng các script có đánh số phiên bản, và chọn kích thước connection pool hợp lý.',
  'In production the schema should change only through reviewed, versioned migrations. Set spring.jpa.hibernate.ddl-auto to validate or none, and keep update and create for experiments on your own machine. Flyway and Liquibase are the two common tools. Spring Boot runs them at startup when the dependency is on the classpath.':
    'Trên production, schema chỉ nên thay đổi thông qua các migration có đánh số phiên bản và đã được review. Hãy đặt spring.jpa.hibernate.ddl-auto là validate hoặc none, còn update và create chỉ dành cho thử nghiệm trên máy của bạn. Flyway và Liquibase là hai công cụ phổ biến. Spring Boot chạy chúng khi khởi động nếu dependency có trong classpath.',
  'Flyway reads files named V<version>__<description>.sql in order.':
    'Flyway đọc các file tên V<version>__<description>.sql theo thứ tự.',
  'Flyway stores a checksum of each applied migration. Never edit one that has run; add a new version instead.':
    'Flyway lưu checksum của mỗi migration đã áp dụng. Đừng bao giờ sửa một migration đã chạy; hãy thêm một phiên bản mới.',
  'Liquibase works the same way, with changelogs and changesets written in YAML, XML or SQL.':
    'Liquibase hoạt động tương tự, với changelog và changeset viết bằng YAML, XML hoặc SQL.',
  'Make changes backward compatible, such as adding a column before using it, so old and new versions of the app can run side by side during a rolling deploy.':
    'Hãy làm các thay đổi tương thích ngược, chẳng hạn thêm một cột trước khi dùng nó, để phiên bản cũ và mới của ứng dụng có thể chạy song song trong lúc rolling deploy.',
  'Run the migrations against a real database in your tests.':
    'Hãy chạy các migration trên một cơ sở dữ liệu thật trong test của bạn.',
  'Opening a database connection is expensive, so applications keep a pool of ready connections. Spring Boot uses HikariCP by default. The pool is small on purpose: the database can only do so much work at once.':
    'Mở một kết nối cơ sở dữ liệu rất tốn kém, nên ứng dụng giữ sẵn một pool các kết nối. Spring Boot dùng HikariCP theo mặc định. Pool được giữ nhỏ có chủ ý: cơ sở dữ liệu chỉ làm được một lượng việc nhất định cùng lúc.',
  'At most 10 connections, and wait at most 5000 ms for a free one. The default size is also 10.':
    'Tối đa 10 kết nối, và chờ tối đa 5000 ms để có một kết nối rảnh. Kích thước mặc định cũng là 10.',
  'A bigger pool is not faster. Pool size times the number of app instances must stay below the database’s connection limit.':
    'Pool lớn hơn không có nghĩa là nhanh hơn. Kích thước pool nhân với số instance của ứng dụng phải nằm dưới giới hạn kết nối của cơ sở dữ liệu.',
  'The error “Connection is not available, request timed out” usually means connections are held too long, not that the pool is too small.':
    'Lỗi “Connection is not available, request timed out” thường có nghĩa là các kết nối bị giữ quá lâu, chứ không phải pool quá nhỏ.',
  'Before raising the pool size, look for slow queries, long transactions and remote calls made inside a transaction.':
    'Trước khi tăng kích thước pool, hãy tìm các query chậm, transaction kéo dài và các lời gọi từ xa nằm bên trong transaction.',
  'Why is spring.jpa.hibernate.ddl-auto=update a poor way to change a production schema?':
    'Vì sao spring.jpa.hibernate.ddl-auto=update là cách kém để thay đổi schema trên production?',
  'Changes are not versioned or reviewed, and they can be unsafe or incomplete':
    'Các thay đổi không có phiên bản và không được review, và có thể không an toàn hoặc không đầy đủ',
  'The update setting was removed in Hibernate 6':
    'Tùy chọn update đã bị loại bỏ trong Hibernate 6',
  'It makes every query slower': 'Nó làm mọi query chậm đi',
  'It only works with the H2 database': 'Nó chỉ hoạt động với cơ sở dữ liệu H2',
  'Versioned migrations give you a reviewed, repeatable history of every change. Automatic schema updates give you neither.':
    'Migration có phiên bản cho bạn một lịch sử thay đổi đã được review và lặp lại được. Tự động cập nhật schema thì không cho bạn cả hai.',
  'You already applied V3__add_index.sql in production and then find a mistake in it. What should you do?':
    'Bạn đã áp dụng V3__add_index.sql trên production rồi phát hiện một lỗi trong đó. Bạn nên làm gì?',
  'Add a new migration, V4, that fixes it': 'Thêm một migration mới, V4, để sửa nó',
  'Edit the V3 file and redeploy': 'Sửa file V3 rồi deploy lại',
  'Rename the file to V2': 'Đổi tên file thành V2',
  'Delete the V3 file from the project': 'Xóa file V3 khỏi dự án',
  'Flyway compares a checksum with the one stored when V3 ran. A changed or missing file makes validation fail, so corrections go in a new version.':
    'Flyway so sánh checksum với giá trị đã lưu khi V3 chạy. Một file bị đổi hoặc bị mất sẽ làm bước validate thất bại, nên việc sửa lỗi phải nằm trong một phiên bản mới.',
  'Requests fail with “Connection is not available, request timed out”. What is the best first step?':
    'Các request lỗi với “Connection is not available, request timed out”. Bước đầu tiên tốt nhất là gì?',
  'Raise the pool size to 1000': 'Tăng kích thước pool lên 1000',
  'Turn the connection pool off': 'Tắt connection pool',
  'Look for slow queries and long transactions that hold connections':
    'Tìm các query chậm và transaction kéo dài đang giữ kết nối',
  'Restart the application every night': 'Khởi động lại ứng dụng mỗi đêm',
  'A huge pool can overload the database. Finding what keeps connections busy fixes the cause instead of hiding it.':
    'Một pool quá lớn có thể làm quá tải cơ sở dữ liệu. Tìm ra thứ giữ kết nối bận sẽ xử lý nguyên nhân thay vì che giấu nó.',
  'Testing and quality': 'Kiểm thử và chất lượng',
  'Write fast unit tests, pick the right Spring Boot test slice, test against real databases and design code that is easy to test.':
    'Viết unit test nhanh, chọn đúng test slice của Spring Boot, kiểm thử trên cơ sở dữ liệu thật và thiết kế code dễ test.',
  'Unit tests with JUnit 5 and Mockito': 'Unit test với JUnit 5 và Mockito',
  'Test one class in isolation, and know what is worth mocking.':
    'Test một class một cách độc lập, và biết thứ gì đáng để mock.',
  'A unit test checks one class on its own, with no Spring context and no database, so it runs in milliseconds. JUnit 5 finds and runs the tests. Mockito creates test doubles for the collaborators. Constructor injection makes this easy, because the test can pass the doubles in.':
    'Một unit test kiểm tra một class riêng lẻ, không có Spring context và không có cơ sở dữ liệu, nên chạy trong vài mili giây. JUnit 5 tìm và chạy các test. Mockito tạo ra các test double cho các collaborator. Constructor injection khiến việc này dễ dàng, vì test có thể truyền các double vào.',
  'Static imports of when, assertThat and the JUnit and Mockito types are omitted.':
    'Các static import của when, assertThat và các kiểu của JUnit, Mockito được lược bớt.',
  'Mock what is slow, random or outside your process: HTTP clients, message brokers, the clock, other services’ repositories.':
    'Hãy mock những gì chậm, ngẫu nhiên hoặc nằm ngoài process của bạn: HTTP client, message broker, đồng hồ (clock), repository của dịch vụ khác.',
  'Do not mock the class under test, simple values such as records, or small pure helpers. Use the real ones.':
    'Đừng mock chính class đang được test, các giá trị đơn giản như record, hay các helper thuần túy nhỏ. Hãy dùng đối tượng thật.',
  'Check results first: the returned value or the new state. Use verify only for a side effect that matters, such as an email being sent.':
    'Hãy kiểm tra kết quả trước: giá trị trả về hoặc trạng thái mới. Chỉ dùng verify cho một side effect quan trọng, chẳng hạn một email đã được gửi.',
  'A test that mirrors every call the code makes breaks whenever you refactor, even when the behaviour is still right.':
    'Một test lặp lại mọi lời gọi mà code thực hiện sẽ vỡ mỗi khi bạn refactor, ngay cả khi hành vi vẫn đúng.',
  'Do not call Instant.now() in logic you want to test. Inject a java.time.Clock and give the test a fixed one with Clock.fixed(...).':
    'Đừng gọi Instant.now() trong logic bạn muốn test. Hãy inject một java.time.Clock và đưa cho test một clock cố định bằng Clock.fixed(...).',
  'Which collaborator is a good candidate for a mock when you unit test a service?':
    'Collaborator nào là ứng viên tốt để mock khi bạn unit test một service?',
  'The class under test itself': 'Chính class đang được test',
  'A record that holds a money amount': 'Một record chứa số tiền',
  'A small pure method that formats a string': 'Một method thuần túy nhỏ để định dạng chuỗi',
  'A client that calls a remote payment API': 'Một client gọi tới API thanh toán từ xa',
  'Remote calls are slow and unreliable in tests, so you replace them. Real values and pure helpers are simpler and safer to use as they are.':
    'Các lời gọi từ xa chậm và không ổn định trong test, nên bạn thay chúng đi. Giá trị thật và helper thuần túy thì đơn giản và an toàn hơn khi dùng nguyên bản.',
  'A test only checks that repository.save() was called once and never looks at what the service returns. What is the risk?':
    'Một test chỉ kiểm tra repository.save() đã được gọi đúng một lần và không bao giờ xem service trả về gì. Rủi ro là gì?',
  'verify() is not allowed on mocks': 'verify() không được phép dùng trên mock',
  'The test is tied to the implementation and can pass while the result is wrong':
    'Test bị gắn chặt với cách triển khai và vẫn có thể pass trong khi kết quả sai',
  'The mock will write to a real database': 'Mock sẽ ghi vào cơ sở dữ liệu thật',
  'The test will run in a different thread': 'Test sẽ chạy trên một thread khác',
  'Interaction checks describe how the code works, not what it achieves. Asserting the outcome catches real bugs and survives refactoring.':
    'Việc kiểm tra tương tác mô tả code hoạt động thế nào, chứ không phải nó đạt được gì. Kiểm tra kết quả giúp bắt lỗi thật và vẫn đúng sau khi refactor.',
  'How can a test control the current time of a class that needs it?':
    'Làm thế nào để một test điều khiển thời gian hiện tại của một class cần đến nó?',
  'Inject a java.time.Clock and pass a fixed Clock in the test':
    'Inject một java.time.Clock và truyền một Clock cố định trong test',
  'Call Thread.sleep in the test': 'Gọi Thread.sleep trong test',
  'Change the operating system clock before each run':
    'Đổi đồng hồ của hệ điều hành trước mỗi lần chạy',
  'Make the field static': 'Đặt field là static',
  'When time comes from a Clock dependency, a test can supply any moment it wants, and the result is repeatable.':
    'Khi thời gian đến từ một dependency Clock, test có thể cung cấp bất kỳ thời điểm nào nó muốn, và kết quả lặp lại được.',
  'Spring Boot test slices': 'Test slice của Spring Boot',
  '@WebMvcTest, @DataJpaTest and @SpringBootTest: what each loads and when to use it.':
    '@WebMvcTest, @DataJpaTest và @SpringBootTest: mỗi cái nạp gì và khi nào nên dùng.',
  '@SpringBootTest starts the whole application context. A test slice starts only the part you want to test, so it is faster and more focused. Pick the smallest one that covers the risk.':
    '@SpringBootTest khởi động toàn bộ application context. Một test slice chỉ khởi động phần bạn muốn test, nên nhanh hơn và tập trung hơn. Hãy chọn slice nhỏ nhất đủ bao phủ rủi ro.',
  '@MockitoBean needs Spring Boot 3.4 or newer. Older 3.x versions use @MockBean.':
    '@MockitoBean cần Spring Boot 3.4 trở lên. Các bản 3.x cũ hơn dùng @MockBean.',
  '@WebMvcTest: controllers, JSON, validation, error handling and web security. Your @Service beans are not loaded, so mock them.':
    '@WebMvcTest: controller, JSON, validation, xử lý lỗi và web security. Các bean @Service của bạn không được nạp, nên hãy mock chúng.',
  '@DataJpaTest: entities and repositories. Each test runs in a transaction that is rolled back at the end, and by default an embedded database replaces your DataSource.':
    '@DataJpaTest: entity và repository. Mỗi test chạy trong một transaction được rollback khi kết thúc, và theo mặc định một cơ sở dữ liệu nhúng (embedded) sẽ thay thế DataSource của bạn.',
  '@SpringBootTest: the full context, optionally with a real server on a random port. Keep a small number of these as end-to-end checks that everything is wired together.':
    '@SpringBootTest: toàn bộ context, có thể kèm một server thật trên cổng ngẫu nhiên. Hãy giữ một số ít test loại này làm kiểm tra end-to-end rằng mọi thứ đã được nối với nhau.',
  'Spring caches the context between tests that use the same configuration. Many different mock combinations create many contexts and slow the suite down.':
    'Spring cache context giữa các test dùng cùng một cấu hình. Nhiều tổ hợp mock khác nhau sẽ tạo ra nhiều context và làm cả bộ test chậm đi.',
  'Put the rules in plain classes and test them with plain unit tests. Use slices only for the parts that need Spring.':
    'Hãy đặt các quy tắc vào các class thông thường và test chúng bằng unit test thông thường. Chỉ dùng slice cho những phần thật sự cần Spring.',
  'A controller needs an OrderService. What do you do with it in a @WebMvcTest?':
    'Một controller cần một OrderService. Bạn xử lý nó thế nào trong @WebMvcTest?',
  'Provide a mock of it, for example with @MockitoBean or @MockBean':
    'Cung cấp một mock của nó, ví dụ bằng @MockitoBean hoặc @MockBean',
  'Nothing: @WebMvcTest scans and loads every @Service':
    'Không làm gì: @WebMvcTest quét và nạp mọi @Service',
  'Add @DataJpaTest to the same class': 'Thêm @DataJpaTest vào cùng class',
  'Make the service class static': 'Đặt class service là static',
  '@WebMvcTest loads only the web layer. A bean the controller depends on must be supplied by you, and a mock keeps the test focused on the controller.':
    '@WebMvcTest chỉ nạp tầng web. Một bean mà controller phụ thuộc phải do bạn cung cấp, và một mock giúp test tập trung vào controller.',
  'What does @DataJpaTest do with the data a test changes?':
    '@DataJpaTest làm gì với dữ liệu mà một test thay đổi?',
  'It commits them so the next test can see them': 'Nó commit để test kế tiếp nhìn thấy',
  'It writes them to the production database': 'Nó ghi vào cơ sở dữ liệu production',
  'It keeps them until the application context closes':
    'Nó giữ lại cho đến khi application context đóng',
  'It rolls the changes back when the test ends, by default':
    'Theo mặc định, nó rollback các thay đổi khi test kết thúc',
  'Rolling back after each test keeps tests independent of each other without manual cleanup.':
    'Rollback sau mỗi test giúp các test độc lập với nhau mà không cần dọn dẹp thủ công.',
  'Which kind of test is the right use of @SpringBootTest?':
    'Loại test nào là cách dùng đúng của @SpringBootTest?',
  'Every unit test of business logic': 'Mọi unit test của business logic',
  'Every test of a single controller': 'Mọi test của một controller riêng lẻ',
  'Every test of a single repository method': 'Mọi test của một method repository riêng lẻ',
  'A small number of end-to-end tests that check the whole application starts and is wired together':
    'Một số ít test end-to-end kiểm tra toàn bộ ứng dụng khởi động được và được nối đúng với nhau',
  'Starting the full context is slow. It pays off for a few broad checks, while logic and single layers are better tested with unit tests and slices.':
    'Khởi động toàn bộ context rất chậm. Nó đáng giá với một vài kiểm tra bao quát, còn logic và từng tầng riêng lẻ thì test tốt hơn bằng unit test và slice.',
  'Integration tests with Testcontainers': 'Integration test với Testcontainers',
  'Run tests against a real database in a throwaway container.':
    'Chạy test trên một cơ sở dữ liệu thật trong một container dùng một lần.',
  'An in-memory database such as H2 is not your production database. SQL dialects, column types and locking behave differently, so a test can pass on H2 and fail on PostgreSQL. Testcontainers starts a real database in a Docker container for the test run and removes it afterwards. It needs Docker, or a compatible container runtime, on every machine that runs these tests, including CI.':
    'Một cơ sở dữ liệu in-memory như H2 không phải là cơ sở dữ liệu production của bạn. Phương ngữ SQL, kiểu cột và cơ chế khóa hoạt động khác nhau, nên một test có thể pass trên H2 nhưng lỗi trên PostgreSQL. Testcontainers khởi động một cơ sở dữ liệu thật trong container Docker cho lần chạy test rồi xóa nó đi sau đó. Nó cần Docker, hoặc một container runtime tương thích, trên mọi máy chạy các test này, kể cả CI.',
  'Spring Boot 3.1 or newer with the spring-boot-testcontainers dependency. @ServiceConnection points the DataSource at the container.':
    'Spring Boot 3.1 trở lên với dependency spring-boot-testcontainers. @ServiceConnection trỏ DataSource tới container.',
  'Replace.NONE tells @DataJpaTest to use the container instead of an embedded database.':
    'Replace.NONE bảo @DataJpaTest dùng container thay vì cơ sở dữ liệu nhúng.',
  'A static container is started once and shared by all tests in the class. A non-static one is started for every test method.':
    'Một container static được khởi động một lần và dùng chung cho mọi test trong class. Một container không static sẽ được khởi động cho mỗi method test.',
  'Let Testcontainers choose a random free port. Do not fix the port.':
    'Hãy để Testcontainers chọn một cổng trống ngẫu nhiên. Đừng cố định cổng.',
  'Use the same database image version as production. Your Flyway or Liquibase migrations then run against the real database too.':
    'Hãy dùng cùng phiên bản image cơ sở dữ liệu như production. Khi đó các migration Flyway hoặc Liquibase của bạn cũng chạy trên cơ sở dữ liệu thật.',
  'Many teams name these tests *IT so the build can run them in a separate, slower step from the fast unit tests.':
    'Nhiều đội đặt tên các test này là *IT để quá trình build chạy chúng ở một bước riêng, chậm hơn, tách khỏi các unit test nhanh.',
  'Share one container between several test classes with a common base class or a singleton, so you pay the start-up cost once.':
    'Hãy dùng chung một container giữa nhiều class test bằng một base class hoặc singleton, để chỉ trả chi phí khởi động một lần.',
  'Why use Testcontainers instead of H2 for repository tests?':
    'Vì sao dùng Testcontainers thay vì H2 cho test repository?',
  'The tests run on the same kind of database as production, so differences show up early':
    'Test chạy trên cùng loại cơ sở dữ liệu như production, nên các khác biệt lộ ra sớm',
  'H2 cannot run SQL at all': 'H2 hoàn toàn không chạy được SQL',
  'Containers always start faster than an in-memory database':
    'Container luôn khởi động nhanh hơn cơ sở dữ liệu in-memory',
  'Testcontainers works without Docker': 'Testcontainers hoạt động mà không cần Docker',
  'Dialect, type and locking differences are hidden by H2. A real database in a container exposes them before production does.':
    'H2 che giấu các khác biệt về phương ngữ, kiểu dữ liệu và cơ chế khóa. Một cơ sở dữ liệu thật trong container làm chúng lộ ra trước khi production làm điều đó.',
  'What does @ServiceConnection do in a Spring Boot test?':
    '@ServiceConnection làm gì trong một test Spring Boot?',
  'It starts the Docker daemon on your computer':
    'Nó khởi động Docker daemon trên máy tính của bạn',
  'It connects two Spring beans together': 'Nó nối hai bean Spring với nhau',
  'It configures the connection details, such as the DataSource URL, from the running container':
    'Nó cấu hình thông tin kết nối, chẳng hạn URL của DataSource, từ container đang chạy',
  'It encrypts the database connection': 'Nó mã hóa kết nối cơ sở dữ liệu',
  'Spring Boot reads the host, port and credentials from the container, so you do not set the properties by hand.':
    'Spring Boot đọc host, cổng và thông tin đăng nhập từ container, nên bạn không phải đặt các property bằng tay.',
  'Why is the container field declared static?': 'Vì sao field container được khai báo là static?',
  'JUnit requires every field to be static': 'JUnit yêu cầu mọi field phải là static',
  'So the container keeps running after the JVM exits':
    'Để container tiếp tục chạy sau khi JVM thoát',
  'So other machines can connect to the container': 'Để các máy khác có thể kết nối tới container',
  'One container is started for all the tests in the class, not one per test method':
    'Một container được khởi động cho tất cả test trong class, thay vì một container cho mỗi method test',
  'Starting a database takes seconds. With a static field the cost is paid once per class.':
    'Khởi động một cơ sở dữ liệu mất vài giây. Với field static, chi phí chỉ phải trả một lần cho mỗi class.',
  'Testable code and readable tests': 'Code dễ test và test dễ đọc',
  'Design for testing, structure tests as given-when-then and use AssertJ well.':
    'Thiết kế để dễ test, cấu trúc test theo given-when-then và dùng AssertJ cho tốt.',
  'Code is hard to test when it hides its dependencies: new inside methods, static calls, global singletons, and logic mixed with I/O. Pass dependencies in through the constructor, and keep pure decisions in small methods that take values and return values.':
    'Code khó test khi nó giấu các dependency của mình: new ngay trong method, lời gọi static, singleton toàn cục, và logic trộn lẫn với I/O. Hãy truyền dependency vào qua constructor, và giữ các quyết định thuần túy trong những method nhỏ nhận giá trị và trả về giá trị.',
  'Given, when, then: set up, act once, check the outcome.':
    'Given, when, then: chuẩn bị, thực hiện một lần, kiểm tra kết quả.',
  'One test method, several cases.': 'Một method test, nhiều trường hợp.',
  'Name a test after the behaviour, such as rejectsAnOrderWithoutItems, not test1 or testValidate.':
    'Hãy đặt tên test theo hành vi, chẳng hạn rejectsAnOrderWithoutItems, chứ không phải test1 hay testValidate.',
  'One behaviour per test, so a failure tells you what broke.':
    'Một hành vi cho mỗi test, để khi lỗi bạn biết cái gì đã hỏng.',
  'AssertJ reads like a sentence and explains the difference when it fails. Use containsExactly for a list in order, and containsExactlyInAnyOrder when order does not matter.':
    'AssertJ đọc như một câu văn và giải thích sự khác biệt khi lỗi. Dùng containsExactly cho một list có thứ tự, và containsExactlyInAnyOrder khi thứ tự không quan trọng.',
  'Tests must be independent: no shared mutable state, no required order and no Thread.sleep.':
    'Các test phải độc lập: không có trạng thái mutable dùng chung, không yêu cầu thứ tự chạy và không có Thread.sleep.',
  'If a test needs a lot of setup, the class probably has too many dependencies. Treat that as feedback about the design.':
    'Nếu một test cần rất nhiều bước chuẩn bị, class đó có lẽ có quá nhiều dependency. Hãy coi đó là phản hồi về thiết kế.',
  'Which test method name describes behaviour best?': 'Tên method test nào mô tả hành vi tốt nhất?',
  test1: 'test1',
  testValidate: 'testValidate',
  rejectsAnOrderWithoutItems: 'rejectsAnOrderWithoutItems',
  orderServiceTest: 'orderServiceTest',
  'A good name says what should happen, so a failing test report already tells you what broke.':
    'Một cái tên tốt cho biết điều gì cần xảy ra, nên báo cáo test lỗi đã cho bạn biết cái gì hỏng.',
  'What does AssertJ’s containsExactly check on a list?':
    'containsExactly của AssertJ kiểm tra điều gì trên một list?',
  'That it has these elements in any order': 'Có các phần tử này theo thứ tự bất kỳ',
  'That it has exactly these elements, in this order':
    'Có đúng các phần tử này, theo đúng thứ tự này',
  'That it contains at least one of these elements': 'Chứa ít nhất một trong các phần tử này',
  'That it has the same size, whatever the elements': 'Có cùng kích thước, bất kể các phần tử',
  'containsExactly is strict about both elements and order. Use containsExactlyInAnyOrder when the order is not part of the behaviour.':
    'containsExactly nghiêm ngặt về cả phần tử lẫn thứ tự. Hãy dùng containsExactlyInAnyOrder khi thứ tự không thuộc về hành vi.',
  'Which change makes a service easier to unit test?':
    'Thay đổi nào giúp một service dễ unit test hơn?',
  'Make all its methods static': 'Biến mọi method của nó thành static',
  'Reach its dependencies through a global getInstance() singleton':
    'Lấy các dependency qua một singleton toàn cục getInstance()',
  'Add more private helper methods': 'Thêm nhiều method private hỗ trợ hơn',
  'Receive its collaborators through the constructor instead of creating them with new inside methods':
    'Nhận các collaborator qua constructor thay vì tạo chúng bằng new bên trong method',
  'With constructor injection a test passes in doubles. New objects, static calls and singletons are hidden dependencies that a test cannot replace.':
    'Với constructor injection, test truyền vào các double. Đối tượng new, lời gọi static và singleton là các dependency ẩn mà test không thể thay thế.',
};
