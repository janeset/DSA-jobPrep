// System design refresher: fundamentals (lessons + flashcards), case studies (try first,
// then reveal a model answer and self-check with a rubric) and one object-oriented design.
// body/notes HTML is trusted (written here). Diagrams: columns of boxes, arrows between
// neighbouring columns. Numbers in estimates are deliberately rough orders of magnitude.

const SD = [
  // ---------------- Fundamentals ----------------
  {
    id: "framework", kind: "lesson", title: "How to approach a design interview", short: "1",
    body: `<p>System design rounds are open-ended on purpose. Interviewers grade <b>how you think</b>: whether you clarify, make reasonable assumptions, explain trade-offs, and adapt. There's no single right answer.</p>
      <h3>A 45-minute plan</h3>
      <ol>
        <li><b>Clarify requirements (5-8 min).</b> Functional: what must it do? Non-functional: scale, latency, availability, consistency, security. Agree on what's out of scope.</li>
        <li><b>Estimate (3-5 min).</b> Requests per second, storage, bandwidth. Only as precise as needed to drive decisions (one server or a hundred?).</li>
        <li><b>High-level design (10-15 min).</b> APIs, data model, then boxes and arrows. Walk one request end to end.</li>
        <li><b>Deep dive (15-20 min).</b> Bottlenecks, scaling, failure modes, and trade-offs on the parts the interviewer cares about.</li>
        <li><b>Wrap up (2-3 min).</b> Summarize, then mention monitoring, what you'd improve, and the risks.</li>
      </ol>
      <h3>Habits that score well</h3>
      <ul><li>Think out loud and ask before assuming ("Is eventual consistency OK for the feed?").</li>
        <li>Start simple (one server, one database), then scale the part that breaks first.</li>
        <li>Name trade-offs explicitly: "A cache gives us fast reads at the cost of possibly stale data."</li>
        <li>Let numbers drive choices instead of reaching for buzzwords.</li></ul>
      <div class="callout"><b>For Toronto &amp; KW mid-size and bank roles:</b> design rounds are usually practical: a REST API, a relational database, a cache and a queue, with emphasis on data modelling, transactions, security and auditability. Some replace system design with <b>object-oriented design</b> (see the parking lot). Big tech goes deeper into distributed systems and scale.</div>`,
    cards: [
      ["What should the first 5 minutes cover?", "Clarifying functional and non-functional requirements, scale, and what's out of scope. Don't draw boxes yet."],
      ["Why estimate at all?", "Numbers decide the architecture: 50 requests/s fits one server and one database; 50,000/s needs caching, replicas and sharding."],
      ["The interviewer stays quiet while you design. What do you do?", "Keep narrating your reasoning, state assumptions, and periodically check in: 'Should I go deeper on storage or on the API?'"],
    ],
  },
  {
    id: "estimates", kind: "lesson", title: "Back-of-the-envelope estimates", short: "2",
    body: `<p>Estimates are about <b>orders of magnitude</b>, so round aggressively. The goal is to know whether you need 1 machine or 1,000.</p>
      <div class="cols-2">
        <div><h3>Handy numbers</h3><ul>
          <li>1 day = 86,400 s, roughly 10<sup>5</sup> s</li>
          <li>1M requests/day is about 12 requests/s</li>
          <li>Peak traffic is about 2-3x the average</li>
          <li>KB = 10<sup>3</sup>, MB = 10<sup>6</sup>, GB = 10<sup>9</sup>, TB = 10<sup>12</sup> bytes</li>
          <li>One app server: roughly 1k-10k simple requests/s</li>
          <li>One relational DB: a few thousand writes/s; more reads with replicas</li>
          <li>Redis: on the order of 100k operations/s per node</li></ul></div>
        <div><h3>Latency, roughly</h3><ul>
          <li>Memory read: ~100 ns</li>
          <li>SSD random read: ~100 µs</li>
          <li>Round trip in the same data center: ~0.5 ms</li>
          <li>Spinning disk seek: ~10 ms</li>
          <li>Toronto to Europe and back: ~100 ms</li></ul></div>
      </div>
      <h3>Formulas</h3>
      <ul><li><b>QPS</b> = daily active users x actions per user per day / 86,400</li>
        <li><b>Storage</b> = new items per day x size per item x days retained</li>
        <li><b>Bandwidth</b> = QPS x response size</li></ul>
      <p>Try the calculator below with your own assumptions.</p>`,
    calc: true,
    cards: [
      ["10M daily users each post twice a day. Average write QPS?", "10M x 2 / 86,400 is about 230 writes/s on average, maybe ~700/s at peak."],
      ["20M posts/day at 1 KB each, kept 5 years. Storage?", "20 GB/day x 365 x 5 is about 36.5 TB (before replication, usually x3)."],
      ["Why multiply storage by ~3?", "Databases keep replicas (often 3 copies) for durability and availability."],
    ],
  },
  {
    id: "scaling", kind: "lesson", title: "Scaling: load balancers, stateless services, CDNs", short: "3",
    body: `<ul>
        <li><b>Vertical scaling</b> (a bigger machine) is simple but has a ceiling and a single point of failure. <b>Horizontal scaling</b> (more machines) is how most systems grow.</li>
        <li>Make app servers <b>stateless</b>: keep sessions in Redis or the database, or use signed tokens (JWT). Then any server can handle any request and you can add or remove servers freely.</li>
        <li>A <b>load balancer</b> spreads traffic and runs health checks. Algorithms: round robin, least connections, and hashing (consistent hashing) when the same key should hit the same server.</li>
        <li>An <b>API gateway / reverse proxy</b> centralizes TLS, authentication, rate limiting and routing.</li>
        <li>A <b>CDN</b> serves static files and media from locations near users, cutting latency and origin load.</li>
        <li><b>Autoscaling</b> adds servers when CPU or latency rises. Design so a new server needs no manual setup.</li></ul>`,
    diagram: [["Users"], ["DNS + CDN"], ["Load balancer"], ["App server", "App server", "App server"], ["Cache", "Database"]],
    cards: [
      ["Why do we want stateless app servers?", "Any server can serve any request, so you can scale horizontally, deploy, and survive server failures without losing sessions."],
      ["Round robin or least connections?", "Round robin is fine when requests are similar. Least connections is better when request durations vary widely."],
      ["What does consistent hashing solve?", "When servers are added or removed, only a small fraction of keys move, instead of almost all of them with hash % N."],
    ],
  },
  {
    id: "caching", kind: "lesson", title: "Caching", short: "4",
    body: `<p>Caches trade <b>freshness for speed</b>. They're the first tool for read-heavy systems.</p>
      <ul>
        <li><b>Where:</b> browser, CDN, in-process memory, a distributed cache (Redis, Memcached), the database's own buffer.</li>
        <li><b>Cache-aside</b> (most common): read the cache; on a miss read the DB and fill the cache. On writes, update the DB and <b>delete</b> the cache key.</li>
        <li>Also: <b>write-through</b> (write cache and DB together), <b>write-behind</b> (write cache, flush to DB later, which risks loss), <b>read-through</b> (the cache loads for you).</li>
        <li><b>Eviction:</b> LRU (least recently used) is the usual default; TTLs bound staleness.</li>
        <li><b>Pitfalls:</b> stale data; a <b>cache stampede</b> when a hot key expires and thousands of requests hit the DB (fix with locking/request coalescing and jittered TTLs); hot keys; caching misses for keys that don't exist.</li>
        <li>Don't cache what must be exactly right at all times (an account balance during a transfer).</li></ul>`,
    code: `def get_user(user_id):
    key = f"user:{user_id}"
    cached = redis.get(key)
    if cached is not None:
        return deserialize(cached)                    # cache hit
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)   # miss: go to the DB
    redis.set(key, serialize(user), ex=300)           # keep for 5 minutes
    return user

def update_user(user_id, fields):
    db.update("users", user_id, fields)
    redis.delete(f"user:{user_id}")                   # invalidate; the next read refills it`,
    cards: [
      ["On a write, why delete the cache key instead of updating it?", "Deleting avoids races where two writers update the cache in the wrong order; the next read loads the fresh value."],
      ["What is a cache stampede and how do you prevent it?", "Many requests miss the same expired hot key at once and overload the DB. Fix: one request recomputes (lock or request coalescing), others wait or get the stale value; add random jitter to TTLs."],
      ["When is caching a bad idea?", "When data must be strongly consistent (balances, inventory at checkout) or is rarely re-read."],
    ],
  },
  {
    id: "databases", kind: "lesson", title: "Databases: SQL, NoSQL, replication & sharding", short: "5",
    body: `<ul>
        <li><b>Relational</b> (PostgreSQL, MySQL, SQL Server, Oracle, common at banks): schemas, joins, <b>ACID transactions</b>. A great default.</li>
        <li><b>NoSQL</b>, chosen by access pattern: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra) for huge write volumes, graph (Neo4j) for relationships.</li>
        <li><b>Indexes</b> (B-trees) make lookups and range scans fast but slow down writes. Composite index column order matters.</li>
        <li><b>Replication:</b> a leader takes writes; followers serve reads. Watch for <b>replication lag</b>: a user may not see their own write, so read your own writes from the leader.</li>
        <li><b>Sharding</b> splits data across machines by a key (hash or range). Pick a key that spreads load evenly and keeps common queries on one shard. Re-sharding is painful, and consistent hashing helps.</li>
        <li><b>CAP:</b> during a network partition you choose consistency or availability. Banks lean consistent; social feeds lean available.</li>
        <li><b>Denormalize</b> (duplicate data) to make hot reads cheap, at the cost of more complex writes.</li></ul>`,
    code: `CREATE TABLE orders (
    id          BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    status      VARCHAR(20) NOT NULL,
    total_cents BIGINT NOT NULL,          -- money as integer cents, never floating point
    created_at  TIMESTAMP NOT NULL
);

-- "recent orders for a customer" becomes an index range scan instead of a full table scan
CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at DESC);`,
    cards: [
      ["When would you pick NoSQL over SQL?", "Very high write volume, simple key-based access patterns, flexible schemas, or easy horizontal scaling, and you don't need multi-row transactions or joins."],
      ["A user updates their profile and immediately sees the old one. Why?", "Replication lag: the read went to a follower that hasn't caught up. Read-your-writes from the leader (or a caught-up replica) for that user."],
      ["What makes a good shard key?", "High cardinality, even distribution, and it matches the main query (e.g. user_id for per-user data). Avoid keys that create hot spots, like a timestamp."],
    ],
  },
  {
    id: "async", kind: "lesson", title: "Queues, events & background work", short: "6",
    body: `<ul>
        <li>Queues <b>decouple</b> services, absorb traffic spikes, and move slow work (emails, image processing, reports) off the request path.</li>
        <li><b>Message queues</b> (RabbitMQ, SQS) hand each message to one consumer. <b>Logs/streams</b> (Kafka) keep messages for replay, support many consumer groups, and keep order within a partition.</li>
        <li>Delivery is usually <b>at-least-once</b>, so duplicates happen and consumers must be <b>idempotent</b>. Exactly-once is expensive and rarely truly needed.</li>
        <li>Failed messages go to a <b>dead-letter queue</b> after N retries so they don't block everything.</li>
        <li><b>Outbox pattern:</b> write your DB change and an "event to publish" row in the same transaction, then a relay publishes it. You never update the DB without sending the event (or vice versa).</li>
        <li><b>Pub/sub</b> fans one event out to many subscribers (notifications, analytics, search indexing).</li></ul>`,
    diagram: [["API"], ["Database", "Outbox table"], ["Message broker"], ["Email worker", "Analytics", "Search indexer"]],
    code: `def handle(message):
    if processed.exists(message.id):        # duplicate delivery: already handled
        queue.ack(message)
        return
    with db.transaction():
        apply_side_effects(message)
        processed.insert(message.id)        # same transaction as the side effect
    queue.ack(message)`,
    cards: [
      ["Your queue delivers at-least-once. What must consumers do?", "Be idempotent: processing the same message twice has the same effect as once (dedupe by message ID or use naturally idempotent operations)."],
      ["What's a dead-letter queue for?", "Parking messages that keep failing so they can be inspected and replayed, without blocking the rest of the queue."],
      ["What problem does the outbox pattern solve?", "The dual-write problem: updating a database and publishing an event atomically, so neither happens without the other."],
    ],
  },
  {
    id: "apis", kind: "lesson", title: "API design", short: "7",
    body: `<ul>
        <li><b>REST:</b> nouns as resources, HTTP verbs as actions. <code>GET /v1/accounts/42</code>, <code>POST /v1/transfers</code>. GET, PUT and DELETE are idempotent; POST is not, unless you add an idempotency key.</li>
        <li><b>Status codes:</b> 200 OK, 201 Created, 400 bad input, 401 not authenticated, 403 not allowed, 404 not found, 409 conflict, 429 too many requests, 500 server error.</li>
        <li><b>Pagination:</b> cursor-based (<code>?cursor=...</code>) is stable and fast on large, changing data; offset (<code>?page=3</code>) is simple but slow and shifts as rows are added.</li>
        <li><b>Idempotency keys</b> let clients safely retry payments and orders.</li>
        <li><b>Versioning</b> (<code>/v1/</code>), <b>rate limiting</b> (429 + Retry-After) and <b>auth</b> (OAuth 2 / JWT, API keys) are expected talking points.</li>
        <li>Alternatives: <b>gRPC</b> for fast internal service-to-service calls, <b>GraphQL</b> when clients need flexible queries, <b>WebSockets/SSE</b> for real-time updates.</li></ul>`,
    code: `POST /v1/transfers
Idempotency-Key: 6f1c2a9e-4b7d-4e1a-9c55-0d2f8e7a1b3c     # client-generated; retries reuse it
{ "from_account": "A123", "to_account": "B456", "amount_cents": 2500, "currency": "CAD" }

201 Created
{ "id": "tr_789", "status": "completed" }

GET /v1/accounts/A123/transactions?limit=50&cursor=eyJpZCI6InRyXzc4OSJ9    # cursor pagination
200 OK
{ "items": [ ... ], "next_cursor": "eyJpZCI6InRyXzc0MSJ9" }`,
    cards: [
      ["Why prefer cursor pagination for a transaction history?", "New rows don't shift pages (no duplicates or gaps), and the DB can seek with an index instead of scanning and skipping OFFSET rows."],
      ["A mobile client times out on POST /payments and retries. How do you avoid charging twice?", "Require an Idempotency-Key header; store it with a unique constraint and return the original result on repeats."],
      ["Which HTTP methods are idempotent?", "GET, PUT, DELETE (and HEAD, OPTIONS). POST and PATCH aren't by default."],
    ],
  },
  {
    id: "reliability", kind: "lesson", title: "Reliability, observability & security", short: "8",
    body: `<p>This is where a QA background shines. Interviewers love candidates who think about failure, testing and monitoring.</p>
      <ul>
        <li><b>Availability:</b> 99.9% allows about 8.8 hours of downtime a year; 99.99% about 53 minutes. Each extra nine costs much more.</li>
        <li><b>No single points of failure:</b> redundant servers, multiple availability zones, database failover.</li>
        <li><b>Timeouts on every call</b>, and <b>retries with exponential backoff and jitter</b> (not instant retries that create a retry storm). <b>Circuit breakers</b> stop calling a failing dependency; <b>graceful degradation</b> serves partial results.</li>
        <li><b>Observability:</b> logs, metrics and traces. Track latency percentiles (p50, p95, <b>p99</b>), error rate, traffic and saturation. Define SLOs and alert on them.</li>
        <li><b>Safe releases:</b> load tests, canary deploys, feature flags, chaos testing, and fast rollback.</li>
        <li><b>Security:</b> TLS everywhere, authentication plus authorization (least privilege), encryption at rest, secrets in a vault, input validation, <b>audit logs</b>. In Canada, personal data falls under privacy law such as PIPEDA, and banks face strict regulators.</li></ul>`,
    cards: [
      ["Why look at p99 latency instead of the average?", "Averages hide the slowest requests. p99 shows what 1 in 100 users experiences, and in fan-out systems one slow call slows the whole request."],
      ["Why add jitter to retries?", "Without it, many clients retry at the same moments and hammer a recovering service (thundering herd). Randomness spreads them out."],
      ["What is a canary deployment?", "Releasing to a small slice of traffic first, comparing metrics with the old version, then rolling out or rolling back."],
    ],
  },

  // ---------------- Case studies ----------------
  {
    id: "urlshortener", kind: "case", title: "Design a URL shortener", short: "URL",
    prompt: "Design a service like bit.ly: users submit a long URL and get a short link that redirects to it.",
    clarify: ["Custom aliases? Expiring links?", "Do we need click analytics?", "How many new links per month, and what's the read:write ratio?", "Should codes be hard to guess?"],
    functional: ["Create a short URL (optional custom alias and expiry)", "Redirect a short code to its long URL", "Optional: click counts"],
    nonfunctional: ["Redirects are very fast (< 50 ms) and highly available", "Read-heavy, roughly 100 reads per write", "Codes never collide", "Durable: links must not disappear"],
    estimates: `100M new links/month is about 40 writes/s. At 100:1 reads that's ~4,000 redirects/s on average, ~10k/s at peak. Storage: 100M x 500 bytes = 50 GB/month, about 3 TB over 5 years. A 7-character base-62 code gives 62<sup>7</sup>, about 3.5 trillion combinations.`,
    api: `POST /v1/urls   { "long_url": "https://...", "alias": "optional", "expires_at": "optional" }
  -> 201 { "code": "aZ3kP9q", "short_url": "https://sho.rt/aZ3kP9q" }

GET /{code}     -> 302 redirect to long_url   (404 if missing or expired)`,
    data: `urls(code PRIMARY KEY, long_url, owner_id, created_at, expires_at)

-- Access is almost always "look up by code": a key-value store (DynamoDB, Cassandra)
-- or a single indexed SQL table both work. Shard by hash(code) when it grows.`,
    diagram: [["Client"], ["Load balancer"], ["URL service\n(stateless)"], ["Redis cache", "URL database", "Key generator"]],
    deep: [
      ["Generating codes", "Option 1: a counter encoded in base 62. Unique and compact, but sequential (guessable), and one counter is a bottleneck; fix by giving each server its own range of IDs from a key-generation service. Option 2: random 7 characters, insert with a unique constraint, retry on collision. Option 3: hash the URL (MD5/SHA, take 7 chars) and handle collisions. Ranges or random with retry are the usual picks."],
      ["Fast redirects", "Cache hot codes in Redis (cache-aside); most traffic goes to a small set of popular links. Read replicas behind the cache handle the rest."],
      ["301 vs 302", "301 (permanent) lets browsers cache the redirect: less load, but you lose click analytics. 302 (temporary) sends every click through you."],
      ["Analytics without slowing redirects", "Publish a click event to a queue and aggregate asynchronously. Never write analytics synchronously on the redirect path."],
    ],
    tradeoffs: ["Random codes vs counters: unguessable vs compact and collision-free", "301 vs 302: lower load vs analytics", "SQL vs key-value: familiarity and constraints vs effortless horizontal scale"],
    followups: ["Expired links: delete lazily on read plus a background cleanup job", "Abuse: rate-limit creation and scan for malicious URLs", "Custom alias conflicts: unique constraint, return 409"],
    rubric: ["Asked about scale and read:write ratio", "Estimated QPS and storage", "Defined create and redirect APIs", "Chose a code-generation strategy and handled collisions", "Put a cache on the redirect path", "Kept analytics off the hot path", "Discussed 301 vs 302"],
  },
  {
    id: "ratelimiter", kind: "case", title: "Design a rate limiter", short: "RL",
    prompt: "Design a rate limiter for a public API, e.g. each user may make at most 100 requests per minute.",
    clarify: ["Limit per user, API key, or IP?", "One server or many? (Almost always many.)", "Hard limit, or allow short bursts?", "What happens when the limiter itself fails?"],
    functional: ["Limit requests per identity per time window", "Different rules per endpoint or plan tier", "Reject with HTTP 429 and a Retry-After header"],
    nonfunctional: ["Adds only a few milliseconds of latency", "Accurate across many API servers", "Highly available, with a deliberate fail-open or fail-closed choice"],
    estimates: `1M requests/s at the gateway. One counter per user in Redis, about 100 bytes each: 10M users is about 1 GB, which fits comfortably in memory.`,
    api: `allow(key = "user:42:/v1/search", rule) -> (allowed, remaining, reset_at)

Response headers:  X-RateLimit-Limit: 100   X-RateLimit-Remaining: 37   Retry-After: 12
Rejected:          429 Too Many Requests`,
    data: `import time

class TokenBucket:
    """Allows bursts up to capacity, refilled at a steady rate."""
    def __init__(self, capacity, refill_per_sec):
        self.capacity = capacity
        self.tokens = capacity
        self.refill = refill_per_sec
        self.last = time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.refill)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False`,
    diagram: [["Clients"], ["API gateway\n(rate limiter)"], ["Redis counters", "Rules config", "API servers"]],
    deep: [
      ["Algorithms", "Token bucket (allows bursts, the common default), leaky bucket (smooths output), fixed window counter (simple, but allows double bursts at window edges), sliding window log (exact, memory-heavy), sliding window counter (a good approximation with little memory)."],
      ["Counting across many servers", "Keep counters in a shared Redis and update them atomically (INCR + EXPIRE, or a Lua script for the token bucket) to avoid race conditions. For lower latency, servers can keep local counters and sync periodically, accepting some inaccuracy."],
      ["When Redis is down", "Fail open (allow traffic) to protect availability, or fail closed (reject) to protect the backend. Choose per endpoint: e.g. fail closed on login to block credential stuffing."],
      ["Where it lives", "In the API gateway or middleware, before expensive work happens. Rules (limits per plan) come from a config store, cached in memory."],
    ],
    tradeoffs: ["Accuracy vs memory (sliding log vs counters)", "Central Redis (exact) vs local counters (fast, approximate)", "Fail open vs fail closed"],
    followups: ["Different limits per pricing tier", "Many users behind one office NAT IP: prefer API keys or user IDs", "DDoS needs edge protection (CDN/WAF), not just an app-level limiter"],
    rubric: ["Clarified the identity being limited and the distributed setup", "Compared at least two algorithms", "Explained atomic counting in a shared store", "Returned 429 with useful headers", "Made a fail-open/fail-closed decision", "Placed the limiter before expensive work"],
  },
  {
    id: "chat", kind: "case", title: "Design a chat app", short: "Chat",
    prompt: "Design one-to-one and small-group chat, like WhatsApp or Slack direct messages.",
    clarify: ["1:1 only, or groups? How large?", "Online presence, typing indicators, read receipts?", "Media attachments?", "How long is history kept? End-to-end encryption?"],
    functional: ["Send and receive messages in real time", "Message history per conversation", "Deliver to offline users when they reconnect (plus a push notification)", "Delivered/read status; optional presence"],
    nonfunctional: ["Low latency (< 200 ms)", "Messages ordered within a conversation", "Never lose an acknowledged message", "Highly available"],
    estimates: `50M daily users x 40 messages = 2B messages/day, about 23k/s on average. At ~100 bytes each, that's 200 GB/day of new messages: write-heavy.`,
    api: `WebSocket (persistent connection per device)
  -> send     { "conversation_id": "c1", "client_msg_id": "m-uuid", "text": "hi" }
  <- ack      { "client_msg_id": "m-uuid", "message_id": "1817...", "ts": "..." }
  <- message  { "conversation_id": "c1", "message_id": "1817...", "from": "u2", "text": "..." }

GET /v1/conversations/c1/messages?before=<message_id>&limit=50     (history, REST)`,
    data: `messages(conversation_id, message_id, sender_id, body, created_at)
    -- partition key: conversation_id; sort key: message_id (time-ordered, e.g. Snowflake IDs)
conversations(id, type, member_ids, last_message_at)
read_state(user_id, conversation_id, last_read_message_id)`,
    diagram: [["Clients"], ["WebSocket\ngateways"], ["Chat service"], ["Message store\n(Cassandra)", "Sessions /\npresence (Redis)", "Push\nnotifications"]],
    deep: [
      ["Real-time delivery", "Each device holds a WebSocket to a gateway server. A session registry in Redis maps user -> gateway. The chat service stores the message first, then routes it to the recipient's gateway; if the user is offline, it sends a push notification and the client fetches on reconnect."],
      ["Ordering and duplicates", "Assign time-ordered message IDs per conversation. Clients send a client_msg_id so retries after a dropped connection don't create duplicates."],
      ["Storage", "Writes dominate and reads are 'latest N messages in a conversation', a perfect fit for a wide-column store partitioned by conversation_id."],
      ["Groups", "Small groups: fan out to each member's connection. Very large channels: store once and let clients pull (fan-out on read)."],
    ],
    tradeoffs: ["WebSockets vs long polling (efficiency vs simplicity)", "Fan-out on write vs read for groups", "Strong ordering per conversation vs global ordering (not needed)"],
    followups: ["Media: upload to object storage, send a link, serve through a CDN", "Multi-device sync via per-device read state", "End-to-end encryption: the server stores ciphertext and can't read messages"],
    rubric: ["Chose persistent connections and explained routing to the right server", "Handled offline users", "Ordered messages within a conversation", "Prevented duplicates on retry", "Picked storage that fits the write-heavy pattern", "Discussed group fan-out"],
  },
  {
    id: "newsfeed", kind: "case", title: "Design a news feed", short: "Feed",
    prompt: "Design a home timeline like Twitter/X or Instagram: users follow others and see their recent posts.",
    clarify: ["Chronological or ranked?", "Text only, or images and video?", "How many users and follows? Are there celebrity accounts?", "How fresh must the feed be?"],
    functional: ["Create a post", "Follow and unfollow users", "View a home feed, newest first, paginated"],
    nonfunctional: ["Feed loads fast (< 200 ms)", "Eventual consistency is fine (a few seconds' delay)", "Highly available", "Very read-heavy"],
    estimates: `200M daily users x 10 feed loads = 2B reads/day, about 23k/s. 20M posts/day is only about 230 writes/s, so optimize reads.`,
    api: `POST /v1/posts                       { "text": "...", "media_ids": [] }
GET  /v1/feed?cursor=<post_id>&limit=20
POST /v1/users/{id}/follow`,
    data: `posts(id, author_id, text, media_url, created_at)
follows(follower_id, followee_id)                 -- index both directions
feed_cache:  user_id -> sorted set of recent post_ids (Redis), capped at ~800 entries`,
    diagram: [["Clients"], ["Load balancer"], ["Post service", "Feed service"], ["Post DB +\npost cache", "Fan-out workers\n(queue)", "Feed cache\n(Redis)"]],
    deep: [
      ["Fan-out on write (push)", "When someone posts, workers add the post ID to every follower's cached feed. Reads become a single cache lookup. But a celebrity with 50M followers makes one post cost 50M writes."],
      ["Fan-out on read (pull)", "Build the feed at read time by merging recent posts from everyone you follow. Writes are cheap, reads are slow and expensive."],
      ["Hybrid (the usual answer)", "Push for normal accounts; for celebrities, skip the push and merge their recent posts in at read time."],
      ["Serving the feed", "The feed cache holds only post IDs; hydrate them from a post cache in one batch. Paginate with a cursor (the last post ID seen). Serve media through a CDN."],
    ],
    tradeoffs: ["Push (fast reads, write amplification) vs pull (cheap writes, slow reads)", "Freshness vs cost", "Chronological (simple) vs ranked (needs a ranking service)"],
    followups: ["Ranking: a separate service scores candidate posts", "Inactive users: don't fan out to them; build their feed on demand", "Deletes: tombstone the post and filter at read time"],
    rubric: ["Identified the system as read-heavy", "Explained push vs pull", "Handled celebrity accounts (hybrid)", "Used a feed cache of IDs plus hydration", "Used cursor pagination", "Accepted eventual consistency explicitly"],
  },
  {
    id: "ledger", kind: "case", title: "Design a bank transfer service", short: "Bank",
    prompt: "Design a service that moves money between accounts at a bank (think RBC, TD or Wealthsimple). Correctness matters more than anything.",
    clarify: ["Internal transfers only, or external too (Interac e-Transfer, wires)?", "Single currency (CAD) or several?", "Limits, holds, fraud checks?", "Real time or batch? What audit and regulatory requirements?"],
    functional: ["Transfer between two accounts", "Show balance and transaction history", "Prevent overdrafts (or enforce limits)", "Support reversals"],
    nonfunctional: ["No money is ever created or lost", "Strong consistency for balances", "Retries never double-charge (idempotency)", "Full, immutable audit trail", "Secure; highly available, but correctness wins over availability"],
    estimates: `10M customers x 5 transfers/day = 50M/day, about 600/s on average and ~2k/s at peak: well within a tuned relational database, sharded by account if needed.`,
    api: `POST /v1/transfers
Idempotency-Key: 6f1c2a9e-...
{ "from_account": "A123", "to_account": "B456", "amount_cents": 2500, "currency": "CAD" }
  -> 201 { "id": "tr_789", "status": "completed" }      (a repeat with the same key returns this same result)

GET /v1/accounts/A123/balance
GET /v1/accounts/A123/entries?cursor=...`,
    data: `accounts(id, owner_id, currency, status)
account_balances(account_id PRIMARY KEY, balance_cents)        -- cached sum, updated in the same transaction
transfers(id, idempotency_key UNIQUE, from_account, to_account, amount_cents, status, created_at)
ledger_entries(id, transfer_id, account_id, amount_cents, created_at)   -- append-only, double-entry

BEGIN;
SELECT balance_cents FROM account_balances
 WHERE account_id IN ('A123', 'B456') ORDER BY account_id FOR UPDATE;   -- lock rows in a fixed order
-- abort if A123's balance < 2500
INSERT INTO transfers (id, idempotency_key, from_account, to_account, amount_cents, status)
     VALUES ('tr_789', '6f1c2a9e-...', 'A123', 'B456', 2500, 'completed');
INSERT INTO ledger_entries (transfer_id, account_id, amount_cents)
     VALUES ('tr_789', 'A123', -2500), ('tr_789', 'B456', 2500);          -- entries sum to zero
UPDATE account_balances SET balance_cents = balance_cents - 2500 WHERE account_id = 'A123';
UPDATE account_balances SET balance_cents = balance_cents + 2500 WHERE account_id = 'B456';
COMMIT;`,
    diagram: [["Mobile / web"], ["API gateway\n(auth, rate limit)"], ["Transfer service"], ["Ledger DB\n(PostgreSQL)", "Fraud / limits\nchecks", "Event stream\n(notify, audit)"]],
    deep: [
      ["Double-entry ledger", "Every transfer writes two entries that sum to zero (debit one account, credit the other). Entries are append-only: corrections are new reversing entries, never UPDATEs or DELETEs. That's what makes the audit trail trustworthy."],
      ["Atomicity and concurrency", "Do the checks, entries and balance updates in one ACID transaction. Lock the two balance rows in a consistent order (e.g. sorted account ID) to avoid deadlocks, or use optimistic version checks."],
      ["Idempotency", "A unique constraint on idempotency_key means a retried request can't create a second transfer; return the stored result instead."],
      ["Money representation", "Integer minor units (cents) or a decimal type, never floating point. Store the currency with the amount."],
      ["External transfers", "Calls to other banks can't share your transaction. Model a state machine (pending -> completed/failed) as a saga with compensating entries, publish events via the outbox pattern, and run daily reconciliation against the external system's records."],
    ],
    tradeoffs: ["Strong consistency and locking vs throughput", "Cached balances (fast reads) vs summing entries (always exact)", "Synchronous fraud checks (safer, slower) vs asynchronous (faster, needs holds)"],
    followups: ["Audit and compliance: immutable logs, access controls, and reporting to regulators (such as FINTRAC in Canada)", "Multi-currency: FX rates locked at transfer time", "Scaling: shard by account; cross-shard transfers become sagas"],
    rubric: ["Put correctness and consistency first", "Used a double-entry, append-only ledger", "Wrapped the transfer in one ACID transaction", "Handled concurrency (locking order / deadlocks)", "Made retries safe with idempotency keys", "Represented money as integers or decimals, not floats", "Covered audit, security and reconciliation"],
  },
  {
    id: "parkinglot", kind: "case", ood: true, title: "Object-oriented design: parking lot", short: "OOD",
    prompt: "Design a parking lot system: model the classes, their responsibilities and relationships, then code the core. Common at banks and mid-size companies instead of (or alongside) distributed system design.",
    clarify: ["Which vehicle types and spot sizes?", "One level or several?", "Tickets and payment? How is the price calculated?", "Entry and exit gates, and concurrent cars?"],
    functional: ["Park a vehicle in a spot that fits it", "Issue a ticket on entry", "Free the spot and charge on exit", "Report free spots by size"],
    nonfunctional: ["Easy to extend (new vehicle types, pricing rules)", "Safe when several gates operate at once", "Clear separation of responsibilities"],
    estimates: `Not a scale problem. Interviewers grade modelling: nouns become classes, verbs become methods, and extension points use interfaces.`,
    api: `ParkingLot.park(vehicle)   -> Optional<Ticket>    (empty when no spot fits)
ParkingLot.leave(ticketId) -> price in cents
PricingStrategy.priceCents(ticket, exitTime)       (swap in hourly, flat, weekend pricing...)`,
    data: `import java.time.*;
import java.util.*;

enum Size { SMALL, MEDIUM, LARGE }

abstract class Vehicle {
    final String plate;
    Vehicle(String plate) { this.plate = plate; }
    abstract Size size();
}
class Motorcycle extends Vehicle { Motorcycle(String p) { super(p); } Size size() { return Size.SMALL; } }
class Car extends Vehicle        { Car(String p)        { super(p); } Size size() { return Size.MEDIUM; } }
class Bus extends Vehicle        { Bus(String p)        { super(p); } Size size() { return Size.LARGE; } }

class Spot {
    final int id;
    final Size size;
    Vehicle parked;
    Spot(int id, Size size) { this.id = id; this.size = size; }
    boolean fits(Vehicle v) { return parked == null && v.size().compareTo(size) <= 0; }
}

record Ticket(String id, Vehicle vehicle, Spot spot, Instant entry) {}

interface PricingStrategy { long priceCents(Ticket t, Instant exit); }

class HourlyPricing implements PricingStrategy {
    public long priceCents(Ticket t, Instant exit) {
        long minutes = Duration.between(t.entry(), exit).toMinutes();
        long hours = Math.max(1, (minutes + 59) / 60);      // every started hour counts
        return hours * 400;                                  // $4.00 per hour
    }
}

class ParkingLot {
    private final List<Spot> spots;
    private final Map<String, Ticket> active = new HashMap<>();
    private final PricingStrategy pricing;

    ParkingLot(List<Spot> spots, PricingStrategy pricing) {
        this.spots = spots;
        this.pricing = pricing;
    }

    synchronized Optional<Ticket> park(Vehicle v) {
        for (Spot s : spots) {
            if (s.fits(v)) {
                s.parked = v;
                Ticket t = new Ticket(UUID.randomUUID().toString(), v, s, Instant.now());
                active.put(t.id(), t);
                return Optional.of(t);
            }
        }
        return Optional.empty();                             // full for this size
    }

    synchronized long leave(String ticketId) {
        Ticket t = active.remove(ticketId);
        if (t == null) throw new IllegalArgumentException("unknown ticket");
        t.spot().parked = null;
        return pricing.priceCents(t, Instant.now());
    }
}`,
    diagram: [["ParkingLot"], ["Spot", "Ticket", "PricingStrategy"], ["Vehicle", "HourlyPricing"], ["Car / Bus /\nMotorcycle"]],
    deep: [
      ["Responsibilities", "ParkingLot coordinates; Spot knows whether a vehicle fits; Vehicle knows its size; PricingStrategy computes price. Each class has one reason to change (single responsibility)."],
      ["Extension points", "Pricing is an interface (strategy pattern), so new rules don't touch ParkingLot (open/closed principle). New vehicle types only need a subclass."],
      ["Finding spots faster", "The linear scan is O(spots). Keep a free list per size (Map<Size, Deque<Spot>>) for O(1) allocation."],
      ["Concurrency", "Two gates could grab the same spot. Here park/leave are synchronized; at scale use per-level locks or atomic compare-and-set on the spot."],
    ],
    tradeoffs: ["Inheritance for vehicles vs a single class with a size field (simpler, less extensible)", "Coarse lock (simple, safe) vs fine-grained locks (more throughput)"],
    followups: ["Multiple levels: a Level class owning spots", "Payment methods: another strategy (card, app, cash)", "Reservations and EV charging spots"],
    rubric: ["Clarified vehicle types, sizes and pricing", "Identified core classes and responsibilities", "Used an enum or hierarchy for sizes and vehicles", "Made pricing pluggable (interface/strategy)", "Handled the full lot and unknown tickets", "Considered concurrency at the gates"],
  },
];

// Verified videos (YouTube oEmbed: channel + title).
const SD_VIDEOS = {
  framework: [V("i7twT3x5yv8", "System Design Interview: A Step-By-Step Guide", "ByteByteGo"), V("m8Icp_Cid5o", "System Design for Beginners Course", "freeCodeCamp.org")],
  estimates: [V("xbgzl2maQUU", "Algorithms You Should Know Before System Design Interviews", "ByteByteGo")],
  scaling: [V("K0Ta65OqQkY", "What is Load Balancing?", "Gaurav Sen"), V("dBmxNsS3BGE", "Top 6 Load Balancing Algorithms", "ByteByteGo"), V("zaRkONvyGr8", "What is Consistent Hashing?", "Gaurav Sen")],
  caching: [V("dGAgxozNWFE", "Cache Systems Every Developer Should Know", "ByteByteGo")],
  databases: [V("5faMjKuB9bc", "What is Database Sharding?", "Gaurav Sen"), V("ufCvXzGSQ_M", "How to Choose a Database (SQL vs. NoSQL)", "Marko")],
  async: [V("Ch5VhJzaoaI", "Apache Kafka in 6 minutes", "James Cutajar"), V("UNUz1-msbOM", "System Design: Why is Kafka fast?", "ByteByteGo")],
  apis: [V("-mN3VyJuCjM", "What Is REST API? Crash Course System Design #3", "ByteByteGo")],
  reliability: [],
  urlshortener: [V("qSJAvd5Mgio", "Design a URL Shortener (Bitly)", "NeetCodeIO")],
  ratelimiter: [V("SgWb6tWx3S8", "Mock Interview: Design a Rate Limiter", "Aced (formerly Exponent)")],
  chat: [V("vvhC64hQZMk", "WhatsApp System Design: Chat Messaging Systems", "Gaurav Sen")],
  newsfeed: [V("gbysuvl2TZo", "Twitter / Newsfeed: System Design Interview", "TechPrep")],
  ledger: [V("AfkWaDALUsM", "Banking Ledger: System Design Interview", "interviewing.io"), V("wYprypKHZiA", "Stop Double Payments: Idempotency", "Lazy Programmer")],
  parkinglot: [V("P6WaVsP9cqs", "Parking Lot System Design in Java (OOD)", "Code Decode")],
};
