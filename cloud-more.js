// More Cloud learning: four new lessons, runnable Python exercises for existing lessons, a
// glossary, and extra interview/quiz questions. Merged into CLOUD by extendTrack (ai.js).
// Exercise code avoids backslashes (it lives in template literals).

extendTrack(CLOUD, {
  topics: [
    {
      id: "kubernetes", title: "Kubernetes essentials", short: "K8s",
      body: `<p>Kubernetes (K8s) runs containers across a cluster of machines and keeps them in the state you declare. Interviews for platform, DevOps and backend roles expect the core vocabulary.</p>
        <ul>
          <li><b>Cluster:</b> a <b>control plane</b> (API server, scheduler, etcd state store) plus <b>worker nodes</b> that run your containers. EKS and AKS manage the control plane for you.</li>
          <li><b>Pod:</b> the smallest unit, one or more containers sharing a network address. Pods are disposable; never rely on a particular pod staying alive.</li>
          <li><b>Deployment:</b> declares how many replicas of a pod template to run and performs rolling updates and rollbacks.</li>
          <li><b>Service:</b> a stable virtual IP/DNS name that load-balances to matching pods (ClusterIP inside the cluster, LoadBalancer to expose it). <b>Ingress</b> routes HTTP by host/path into services.</li>
          <li><b>ConfigMap / Secret:</b> configuration and sensitive values injected as environment variables or files. Base64 isn't encryption: pull real secrets from a vault.</li>
          <li><b>Probes:</b> <i>readiness</i> (should this pod get traffic?) and <i>liveness</i> (should it be restarted?).</li>
          <li><b>Requests and limits</b> reserve and cap CPU/memory; the scheduler places pods by requests. The <b>Horizontal Pod Autoscaler</b> adds replicas when metrics such as CPU exceed a target.</li>
          <li><b>Namespaces</b> separate teams/environments; <b>RBAC</b> controls who can do what; <b>Helm</b> packages manifests as reusable charts.</li></ul>`,
      map: [["Managed Kubernetes", "Amazon EKS", "Azure Kubernetes Service (AKS)"], ["Container registry", "Amazon ECR", "Azure Container Registry"], ["Pod identity to cloud APIs", "EKS Pod Identity / IRSA", "Microsoft Entra Workload ID"], ["Cluster autoscaling of nodes", "Cluster Autoscaler / Karpenter", "AKS cluster autoscaler"], ["HTTP ingress to the cluster", "AWS Load Balancer Controller (ALB)", "Application Gateway for Containers / ingress controller"]],
      code: [{ label: "A Deployment and a Service (YAML)", code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: 123456789012.dkr.ecr.ca-central-1.amazonaws.com/api:1.4.2
          ports: [{ containerPort: 8000 }]
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits: { cpu: 500m, memory: 512Mi }
          readinessProbe:
            httpGet: { path: /health, port: 8000 }
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 8000 }]` }, { label: "Everyday kubectl", code: `kubectl apply -f api.yaml                 # create or update from the manifest
kubectl get pods -l app=api               # list pods with a label
kubectl describe pod <pod-name>           # events: why is it Pending / CrashLoopBackOff?
kubectl logs deploy/api --tail=50         # recent logs
kubectl rollout status deploy/api         # watch a rolling update
kubectl rollout undo deploy/api           # roll back to the previous version
kubectl scale deploy/api --replicas=5` }],
      exercises: [{
        prompt: "Write parse_cpu(q) and parse_memory(q) for Kubernetes quantities. CPU: '250m' (millicores) = 0.25, '2' = 2.0. Memory returns bytes: binary suffixes Ki, Mi, Gi (powers of 1024), decimal K, M, G (powers of 1000), or a plain number.",
        starter: `def parse_cpu(q):
    pass

def parse_memory(q):
    pass
`,
        tests: `assert parse_cpu("250m") == 0.25 and parse_cpu("2") == 2.0 and parse_cpu("1500m") == 1.5
assert parse_memory("256Mi") == 256 * 1024 ** 2
assert parse_memory("1Gi") == 1024 ** 3
assert parse_memory("500M") == 500_000_000
assert parse_memory("128Ki") == 131072
assert parse_memory("1000") == 1000`,
      }, {
        prompt: "Write hpa_desired(current, metric, target, min_r, max_r): the Horizontal Pod Autoscaler's rule. desired = ceil(current * metric / target), clamped to [min_r, max_r]. If metric/target is within 10% of 1.0 (the default tolerance), keep current.",
        starter: `import math

def hpa_desired(current, metric, target, min_r, max_r):
    pass
`,
        tests: `assert hpa_desired(3, 90, 60, 1, 10) == 5
assert hpa_desired(4, 62, 60, 1, 10) == 4, "within tolerance: no change"
assert hpa_desired(10, 200, 50, 1, 12) == 12, "clamp to max"
assert hpa_desired(5, 10, 60, 2, 10) == 2, "clamp to min"`,
      }],
      cards: [
        ["A pod is stuck in CrashLoopBackOff. How do you debug it?", "kubectl describe pod (events, exit codes), kubectl logs --previous (logs of the crashed container), then check config/secrets, probes that kill it too early, and resource limits (OOMKilled)."],
        ["Readiness vs liveness probe?", "Readiness decides whether a pod receives traffic (e.g. still warming up). Liveness decides whether to restart it (e.g. deadlocked). A wrong liveness probe causes restart loops."],
        ["Why set resource requests?", "The scheduler places pods by requests, and autoscaling and fair sharing depend on them. Without them, nodes get overcommitted and noisy neighbours starve each other."],
      ],
    },
    {
      id: "architecture", title: "Architecture patterns & disaster recovery", short: "Arch",
      body: `<ul>
          <li><b>Monolith vs microservices:</b> start with a well-structured (modular) monolith; split into services when teams, scaling needs or release cadence demand it. Microservices add network calls, distributed data and operational cost.</li>
          <li><b>Common shapes:</b> 3-tier web app (LB, app, DB), event-driven (services react to events on a bus), serverless (functions + managed services), and data pipelines.</li>
          <li><b>Reliability patterns:</b> redundancy across AZs, timeouts and retries with backoff, circuit breakers, queues to absorb spikes, graceful degradation, idempotent operations.</li>
          <li><b>Availability math:</b> components in <i>series</i> multiply (two 99.9% services = about 99.8%); <i>redundant</i> copies in parallel fail only if all fail: 1 - (1 - a)<sup>n</sup>.</li>
          <li><b>Disaster recovery strategies</b> (cheapest and slowest first):
            <table><tr><th>Strategy</th><th>What runs in the DR region</th><th>RPO / RTO</th></tr>
            <tr><td>Backup &amp; restore</td><td>Only backups</td><td>Hours</td></tr>
            <tr><td>Pilot light</td><td>Data replicated; core infrastructure off or minimal</td><td>Minutes to hours</td></tr>
            <tr><td>Warm standby</td><td>A scaled-down but working copy</td><td>Minutes</td></tr>
            <tr><td>Multi-site active/active</td><td>Full capacity serving traffic in both</td><td>Near zero</td></tr></table></li>
          <li>Choose by business impact: a bank's payment system justifies warm standby or active/active; an internal reporting tool may be fine with backup &amp; restore. <b>Test failover</b> regularly.</li></ul>`,
      map: [["DNS failover / global routing", "Route 53 health checks", "Traffic Manager / Front Door"], ["Cross-region storage copies", "S3 Cross-Region Replication", "Geo-redundant storage (GRS)"], ["Cross-region database", "Aurora Global Database", "Azure SQL failover groups"], ["Central backups", "AWS Backup", "Azure Backup"], ["DR orchestration for servers", "AWS Elastic Disaster Recovery", "Azure Site Recovery"]],
      exercises: [{
        prompt: "Write serial(avails) and parallel(avails). serial: probability every component is up (product). parallel: probability at least one redundant copy is up: 1 - product of (1 - a).",
        starter: `def serial(avails):
    pass

def parallel(avails):
    pass
`,
        tests: `assert abs(serial([0.99, 0.99]) - 0.9801) < 1e-9
assert abs(parallel([0.99, 0.99]) - 0.9999) < 1e-9
assert abs(serial([0.999, 0.999, 0.999]) - 0.997002999) < 1e-9
assert serial([]) == 1 and parallel([0.5]) == 0.5`,
      }, {
        prompt: "Write downtime_minutes(percent) returning the allowed downtime per year (365 days) for an availability percentage, e.g. 99.9 -> 525.6 minutes.",
        starter: `def downtime_minutes(percent):
    pass
`,
        tests: `assert abs(downtime_minutes(99.9) - 525.6) < 1e-6
assert abs(downtime_minutes(99.99) - 52.56) < 1e-6
assert downtime_minutes(100) == 0`,
      }],
      cards: [
        ["Pilot light vs warm standby?", "Pilot light keeps data replicated with core infrastructure off or minimal, so you must start/scale it during a disaster. Warm standby runs a small working copy that only needs scaling up, so recovery is faster but costs more."],
        ["Your app calls three services each at 99.9%. What's the best-case availability of the request?", "About 99.7% (0.999 cubed), because they're in series; every dependency lowers availability unless you add redundancy or fallbacks."],
        ["When would you choose microservices?", "When independent teams need to deploy separately, parts have very different scaling needs, or failure isolation matters, and the team can handle the operational overhead."],
      ],
    },
    {
      id: "data", title: "Data & analytics", short: "Data",
      body: `<ul>
          <li><b>Data lake:</b> raw and processed files in object storage (S3 / Azure Data Lake Storage Gen2), organized in zones such as raw, cleaned and curated.</li>
          <li><b>Formats:</b> columnar <b>Parquet</b> reads only the columns a query needs and compresses well; CSV/JSON are easy but slow and costly to query at scale.</li>
          <li><b>Partitioning:</b> folders like <code>sales/year=2026/month=10/</code> let engines skip irrelevant data. Pay-per-scan engines charge by bytes read, so partitioning and Parquet cut cost directly.</li>
          <li><b>ETL / ELT:</b> AWS Glue / Azure Data Factory move and transform data; many teams transform inside the warehouse with SQL (dbt).</li>
          <li><b>Query and warehouse:</b> Amazon Athena / serverless SQL query files in place; Redshift, Microsoft Fabric/Synapse or Snowflake serve heavy analytics.</li>
          <li><b>Streaming:</b> Kinesis / Event Hubs ingest events; Flink or Stream Analytics process them in near real time.</li>
          <li><b>BI and governance:</b> QuickSight / Power BI (very common at Canadian banks); catalogs and permissions with Glue Data Catalog + Lake Formation / Microsoft Purview.</li></ul>`,
      map: [["Data lake storage", "Amazon S3", "Azure Data Lake Storage Gen2"], ["ETL / pipelines", "AWS Glue", "Azure Data Factory"], ["Query files with SQL", "Amazon Athena", "Synapse serverless SQL / Fabric"], ["Data warehouse", "Amazon Redshift", "Microsoft Fabric / Synapse"], ["Streaming ingestion", "Kinesis Data Streams", "Azure Event Hubs"], ["BI dashboards", "Amazon QuickSight", "Power BI"], ["Data catalog & governance", "Glue Data Catalog / Lake Formation", "Microsoft Purview"]],
      code: [{ label: "Query partitioned Parquet with Athena (SQL)", code: `-- Only the October 2026 partition and three columns are read,
-- so you pay for a tiny fraction of the table.
SELECT store_id, SUM(amount_cents) / 100.0 AS revenue
FROM sales
WHERE year = '2026' AND month = '10'
GROUP BY store_id
ORDER BY revenue DESC
LIMIT 10;` }],
      exercises: [{
        prompt: "Write partition_path(table, date_str) that turns '2026-10-05' into Hive-style partition folders: 'sales/year=2026/month=10/day=05/'.",
        starter: `def partition_path(table, date_str):
    pass
`,
        tests: `assert partition_path("sales", "2026-10-05") == "sales/year=2026/month=10/day=05/"
assert partition_path("clicks", "2025-01-31") == "clicks/year=2025/month=01/day=31/"`,
      }, {
        prompt: "Write columnar_bytes(table_bytes, total_columns, needed_columns) estimating how many bytes a columnar scan reads if columns are equally sized (table_bytes * needed / total). Then compare to a full row-format scan.",
        starter: `def columnar_bytes(table_bytes, total_columns, needed_columns):
    pass
`,
        tests: `assert columnar_bytes(1_000_000_000, 50, 3) == 60_000_000
assert columnar_bytes(500, 10, 10) == 500`,
      }],
      cards: [
        ["Why store analytics data as Parquet instead of CSV?", "Columnar layout reads only the needed columns, compresses better and keeps types, so queries are faster and cheaper, especially on pay-per-scan engines."],
        ["What does partitioning by date buy you?", "Queries filtered by date skip whole folders (partition pruning), scanning less data for lower cost and latency."],
        ["Why keep analytics off the production database?", "Heavy scans and aggregations compete with customer transactions; copy data to a lake/warehouse built for analytics."],
      ],
    },
    {
      id: "governance", title: "Governance, landing zones & migration", short: "Gov",
      body: `<ul>
          <li><b>Landing zone:</b> a pre-built, secure multi-account foundation. AWS: Organizations with organizational units, Control Tower, and SCP guardrails. Azure: management groups, subscriptions per workload/environment, Azure Policy, following the Cloud Adoption Framework.</li>
          <li>Separate <b>production and non-production</b>, and keep central <b>logging/audit</b> and <b>security</b> accounts or subscriptions that workload teams can't modify.</li>
          <li><b>Identity federation:</b> one corporate identity (often Microsoft Entra ID, even at AWS shops) with SSO into every account.</li>
          <li><b>Policy as code:</b> deny public storage, require encryption and tags, restrict regions (e.g. Canada only for residency).</li>
          <li><b>Tagging strategy:</b> owner, environment, cost-center, data-classification, enforced automatically.</li>
          <li><b>Migration strategies (the 7 Rs):</b> Retire, Retain, Rehost (lift and shift), Relocate, Repurchase (move to SaaS), Replatform (small changes, e.g. managed DB), Refactor (re-architect cloud-native). Tools: AWS Application Migration Service / Azure Migrate.</li></ul>`,
      map: [["Multi-account structure", "AWS Organizations (OUs)", "Management groups + subscriptions"], ["Landing zone automation", "AWS Control Tower", "Azure landing zone accelerators"], ["Preventive guardrails", "Service control policies", "Azure Policy (deny)"], ["Config compliance", "AWS Config rules", "Azure Policy compliance"], ["Migration tooling", "Application Migration Service", "Azure Migrate"], ["Adoption guidance", "AWS Cloud Adoption Framework", "Microsoft Cloud Adoption Framework"]],
      code: [{ label: "Azure Policy rule: deny resources without a cost-center tag (JSON)", code: `{
  "mode": "Indexed",
  "policyRule": {
    "if": { "field": "tags['cost-center']", "exists": "false" },
    "then": { "effect": "deny" }
  }
}` }],
      exercises: [{
        prompt: "Write missing_tags(tags, required): return the sorted list of required tag keys that are missing or have an empty/whitespace value. Match keys case-insensitively.",
        starter: `def missing_tags(tags, required):
    pass
`,
        tests: `tags = {"Owner": "piper", "env": "prod", "cost-center": " "}
assert missing_tags(tags, ["owner", "env", "cost-center", "data-class"]) == ["cost-center", "data-class"]
assert missing_tags({}, ["a"]) == ["a"]
assert missing_tags({"A": "1"}, ["a"]) == []`,
      }],
      cards: [
        ["Why separate production into its own account or subscription?", "It's the strongest isolation boundary: separate permissions, quotas, billing and blast radius, so a mistake or breach in dev can't touch production."],
        ["Rehost vs replatform vs refactor?", "Rehost moves as-is (fast, little benefit). Replatform makes small changes such as a managed database. Refactor re-architects for cloud-native benefits at the highest cost and effort."],
        ["How would you enforce 'data stays in Canada'?", "Policy as code that restricts allowed regions (SCPs / Azure Policy) to Canadian regions, plus monitoring for violations."],
      ],
    },
  ],

  exercises: {
    iam: [{
      prompt: "Write is_allowed(statements, action, resource) mimicking AWS evaluation: each statement is {'effect': 'Allow'|'Deny', 'actions': [...], 'resources': [...]} with * wildcards. An explicit Deny wins; otherwise any matching Allow allows; otherwise denied by default. Hint: fnmatch.fnmatchcase.",
      starter: `from fnmatch import fnmatchcase

def is_allowed(statements, action, resource):
    pass
`,
      tests: `policy = [
    {"effect": "Allow", "actions": ["s3:Get*", "s3:List*"], "resources": ["arn:aws:s3:::reports/*"]},
    {"effect": "Deny", "actions": ["s3:*"], "resources": ["arn:aws:s3:::reports/secret/*"]},
]
assert is_allowed(policy, "s3:GetObject", "arn:aws:s3:::reports/q3.pdf")
assert not is_allowed(policy, "s3:PutObject", "arn:aws:s3:::reports/q3.pdf"), "no allow: default deny"
assert not is_allowed(policy, "s3:GetObject", "arn:aws:s3:::reports/secret/keys.txt"), "explicit deny wins"
assert not is_allowed([], "s3:GetObject", "x")`,
    }],
    security: [{
      prompt: "Write risky_rules(rules): each rule is {'port': int, 'cidr': str}. Return the indexes of rules that open SSH/RDP or a database port (22, 3389, 3306, 5432, 1433, 6379, 27017) to the whole internet (0.0.0.0/0 or ::/0).",
      starter: `def risky_rules(rules):
    pass
`,
      tests: `rules = [{"port": 443, "cidr": "0.0.0.0/0"}, {"port": 22, "cidr": "0.0.0.0/0"},
         {"port": 5432, "cidr": "10.0.0.0/16"}, {"port": 3389, "cidr": "::/0"}]
assert risky_rules(rules) == [1, 3]
assert risky_rules([]) == []`,
    }],
    compute: [{
      prompt: "Write instances_needed(peak_rps, rps_per_instance, headroom, azs): instances to handle peak traffic plus headroom (e.g. 0.3 = 30%), at least one per AZ, rounded UP to a multiple of azs so each AZ gets the same number.",
      starter: `import math

def instances_needed(peak_rps, rps_per_instance, headroom, azs):
    pass
`,
      tests: `assert instances_needed(1000, 300, 0.3, 2) == 6
assert instances_needed(100, 300, 0.3, 2) == 2
assert instances_needed(900, 300, 0, 3) == 3
assert instances_needed(1000, 100, 0.5, 3) == 15`,
    }],
    containers: [{
      prompt: "Write parse_image(ref) returning {'registry', 'repository', 'tag'}. The first path part is a registry if it contains '.' or ':' or is 'localhost'; otherwise the registry is 'docker.io'. The tag follows the last ':' after the last '/', defaulting to 'latest'.",
      starter: `def parse_image(ref):
    pass
`,
      tests: `assert parse_image("nginx") == {"registry": "docker.io", "repository": "nginx", "tag": "latest"}
assert parse_image("123456789012.dkr.ecr.ca-central-1.amazonaws.com/app:1.4.2") == {"registry": "123456789012.dkr.ecr.ca-central-1.amazonaws.com", "repository": "app", "tag": "1.4.2"}
assert parse_image("myacr.azurecr.io/team/api:2026.10") == {"registry": "myacr.azurecr.io", "repository": "team/api", "tag": "2026.10"}
assert parse_image("localhost:5000/tool") == {"registry": "localhost:5000", "repository": "tool", "tag": "latest"}`,
    }],
    storage: [{
      prompt: "Write lifecycle_tier(age_days, rules) where rules is a list of (min_age_days, tier). Return the tier of the rule with the largest min_age that age_days has reached.",
      starter: `def lifecycle_tier(age_days, rules):
    pass
`,
      tests: `rules = [(0, "hot"), (30, "cool"), (90, "cold"), (180, "archive")]
assert lifecycle_tier(5, rules) == "hot"
assert lifecycle_tier(30, rules) == "cool"
assert lifecycle_tier(120, rules) == "cold"
assert lifecycle_tier(999, list(reversed(rules))) == "archive", "rules may be in any order"`,
    }],
    networking: [{
      prompt: "Write split_cidr(cidr, new_prefix) returning the subnets (as strings) when a network is divided into /new_prefix blocks, and usable_ips(cidr) for a cloud subnet: AWS and Azure both reserve 5 addresses per subnet. Hint: the ipaddress module.",
      starter: `import ipaddress

def split_cidr(cidr, new_prefix):
    pass

def usable_ips(cidr):
    pass
`,
      tests: `assert split_cidr("10.0.0.0/16", 18) == ["10.0.0.0/18", "10.0.64.0/18", "10.0.128.0/18", "10.0.192.0/18"]
assert usable_ips("10.0.1.0/24") == 251
assert usable_ips("10.0.0.0/28") == 11`,
    }],
    messaging: [{
      prompt: "Write backoff_delays(base, factor, cap, attempts): the retry delays for exponential backoff, base * factor**i for i = 0..attempts-1, each capped at cap. (In production, add random jitter so clients don't retry in lockstep.)",
      starter: `def backoff_delays(base, factor, cap, attempts):
    pass
`,
      tests: `assert backoff_delays(0.5, 2, 30, 5) == [0.5, 1, 2, 4, 8]
assert backoff_delays(1, 3, 20, 5) == [1, 3, 9, 20, 20]
assert backoff_delays(1, 2, 10, 0) == []`,
    }],
    devops: [{
      prompt: "Write bump(version, part) for semantic versions 'MAJOR.MINOR.PATCH': 'major' -> 2.0.0, 'minor' -> 1.5.0, 'patch' -> 1.4.3 (from 1.4.2). Raise ValueError for an unknown part.",
      starter: `def bump(version, part):
    pass
`,
      tests: `assert bump("1.4.2", "patch") == "1.4.3"
assert bump("1.4.2", "minor") == "1.5.0"
assert bump("1.4.2", "major") == "2.0.0"
try:
    bump("1.0.0", "huge"); raise SystemExit("expected ValueError")
except ValueError:
    pass`,
    }],
    operations: [{
      prompt: "Write crossed_thresholds(spend, budget, thresholds) returning the budget-alert thresholds (percentages) that current spend has reached.",
      starter: `def crossed_thresholds(spend, budget, thresholds):
    pass
`,
      tests: `assert crossed_thresholds(85, 100, [50, 80, 100]) == [50, 80]
assert crossed_thresholds(10, 100, [50, 80, 100]) == []
assert crossed_thresholds(100, 100, [50, 80, 100]) == [50, 80, 100]`,
    }],
  },

  groups: [
    ["Foundations", ["fundamentals", "iam", "security", "governance"]],
    ["Compute", ["compute", "containers", "kubernetes", "serverless"]],
    ["Data", ["storage", "databases", "data"]],
    ["Networking & integration", ["networking", "messaging"]],
    ["Operations & architecture", ["devops", "operations", "architecture"]],
  ],
  weeks: [
    { n: 1, title: "Cloud fundamentals, identity & governance", topics: ["fundamentals", "iam", "governance"], labs: [], goal: "Explain the shared responsibility model, set up accounts safely (MFA, budget alert), and describe a landing zone." },
    { n: 2, title: "Security & storage", topics: ["security", "storage"], labs: ["staticsite"], goal: "Host a static site on object storage behind a CDN with HTTPS." },
    { n: 3, title: "Compute & networking", topics: ["compute", "networking"], labs: [], goal: "Size an autoscaling tier and plan a VPC/VNet with public and private subnets." },
    { n: 4, title: "Containers, Kubernetes & serverless", topics: ["containers", "kubernetes", "serverless"], labs: ["serverlessapi"], goal: "Explain pods, deployments and services, and build a serverless REST API." },
    { n: 5, title: "Databases, analytics & messaging", topics: ["databases", "data", "messaging"], labs: [], goal: "Choose the right data store, design a partitioned data lake, and decouple services with queues." },
    { n: 6, title: "DevOps: IaC and CI/CD", topics: ["devops"], labs: ["containercicd", "terraformnet"], goal: "Deploy a container automatically from GitHub, with infrastructure in code." },
    { n: 7, title: "Operations, architecture & DR", topics: ["operations", "architecture"], labs: ["observability"], goal: "Add monitoring and cost guardrails, and pick a disaster-recovery strategy from RPO/RTO." },
    { n: 8, title: "Certification & interview sprint", topics: [], labs: [], goal: "Take full quizzes for your target exam, drill the question bank, and polish lab write-ups for your resume." },
  ],

  questions: [
    { id: "q25", topic: "kubernetes", q: "Explain pods, deployments and services to a teammate new to Kubernetes.", a: "A pod is one or more containers scheduled together with a shared IP. A deployment keeps N identical pods running and rolls out new versions gradually. A service gives those changing pods one stable name/IP and load-balances across them." },
    { id: "q26", topic: "kubernetes", q: "How does a rolling update avoid downtime, and how do you roll back?", a: "The deployment creates new pods and removes old ones gradually (maxSurge/maxUnavailable); readiness probes ensure only healthy pods get traffic. Roll back with kubectl rollout undo or by redeploying the previous image tag." },
    { id: "q27", topic: "kubernetes", q: "How should a pod access cloud resources such as S3 or Key Vault?", a: "With a workload identity (EKS Pod Identity/IRSA or Entra Workload ID) mapped to a least-privilege cloud role, never with keys stored in Kubernetes secrets." },
    { id: "q28", topic: "architecture", q: "Design disaster recovery for a payments API with an RPO of 1 minute and RTO of 15 minutes.", a: "Warm standby in a second region: continuous database replication (Aurora Global / SQL failover groups), infrastructure as code, a scaled-down app tier running, DNS/global load balancer failover with health checks, runbooks, and regular failover tests. Active/active if RTO must be near zero." },
    { id: "q29", topic: "architecture", q: "Monolith or microservices for a new product at a 10-person startup?", a: "Usually a modular monolith: one deployable with clear internal boundaries, simpler operations and faster iteration. Extract services later where scaling or team autonomy clearly justifies the overhead." },
    { id: "q30", topic: "architecture", q: "How do you calculate the availability of a system with dependencies?", a: "Multiply availabilities of components in series; for redundant components use 1 - product of their failure probabilities. Then reduce series dependencies or add redundancy/fallbacks where the number is too low." },
    { id: "q31", topic: "data", q: "Design a pipeline that turns daily transaction exports into dashboards.", a: "Land raw files in object storage, run a scheduled ETL job (Glue/Data Factory) that validates, cleans and writes partitioned Parquet to a curated zone, register tables in a catalog, query with Athena/serverless SQL or load to a warehouse, and build Power BI/QuickSight dashboards. Add data-quality checks and access controls." },
    { id: "q32", topic: "data", q: "Analysts complain Athena queries are slow and expensive. What do you change?", a: "Convert to Parquet, partition by common filters (date), compact small files, select only needed columns, and use the partitions in WHERE clauses; consider a warehouse for heavy repeated workloads." },
    { id: "q33", topic: "governance", q: "What is a landing zone and why do enterprises use one?", a: "A pre-configured multi-account/subscription foundation with identity, networking, logging, security and policy guardrails, so every new workload starts compliant and teams can move fast safely." },
    { id: "q34", topic: "governance", q: "A legacy on-prem app must move to the cloud in 3 months. Which migration strategy?", a: "Probably rehost (lift and shift) or light replatform (e.g. managed database) to meet the deadline, then modernize/refactor iteratively once it's running, rather than a risky big-bang rewrite." },
  ],

  quiz: [
    { id: "x32", tags: ["AZ-104"], topic: "kubernetes", q: "Which Kubernetes object gives a set of pods a stable network name and load-balances across them?", options: ["ConfigMap", "Service", "Namespace", "PersistentVolume"], answer: 1, why: "A Service selects pods by label and exposes them behind one stable virtual IP/DNS name." },
    { id: "x33", tags: [], topic: "kubernetes", q: "Which probe decides whether a pod should receive traffic?", options: ["Liveness", "Readiness", "Startup", "Heartbeat"], answer: 1, why: "Readiness gates traffic; liveness triggers restarts." },
    { id: "x34", tags: ["SAA", "CLF"], topic: "architecture", q: "Which DR strategy keeps a scaled-down but fully working copy running in another region?", options: ["Backup and restore", "Pilot light", "Warm standby", "Cold site"], answer: 2, why: "Warm standby runs a smaller working copy that's scaled up on failover." },
    { id: "x35", tags: ["SAA"], topic: "architecture", q: "Lowest-cost DR strategy, accepting hours of RTO:", options: ["Multi-site active/active", "Warm standby", "Backup and restore", "Pilot light"], answer: 2, why: "Backup and restore is cheapest but slowest to recover." },
    { id: "x36", tags: ["CLF", "AZ-900"], topic: "architecture", q: "Two services each 99% available, both required for a request. Overall availability is about:", options: ["99%", "98%", "99.99%", "100%"], answer: 1, why: "Series availability multiplies: 0.99 x 0.99 = 0.9801." },
    { id: "x37", tags: ["SAA"], topic: "data", q: "Which service runs SQL directly on files in S3 and charges by data scanned?", options: ["Amazon RDS", "Amazon Athena", "Amazon DynamoDB", "Amazon Neptune"], answer: 1, why: "Athena queries data in place and bills per bytes scanned." },
    { id: "x38", tags: ["SAA"], topic: "data", q: "Converting CSV to partitioned Parquet mainly:", options: ["Increases durability", "Reduces data scanned and query cost", "Encrypts the data", "Enables versioning"], answer: 1, why: "Columnar formats and partitions let engines read far less data." },
    { id: "x39", tags: ["AZ-900"], topic: "data", q: "Microsoft's BI and dashboarding tool commonly used at Canadian banks is:", options: ["Power BI", "Azure Monitor", "Azure Advisor", "Microsoft Purview"], answer: 0, why: "Power BI is Microsoft's business intelligence service." },
    { id: "x40", tags: ["AZ-900", "AZ-104"], topic: "governance", q: "In Azure, which feature organizes subscriptions into a hierarchy for policy and access?", options: ["Resource groups", "Management groups", "Availability sets", "Tags"], answer: 1, why: "Management groups sit above subscriptions; policies and RBAC applied there are inherited." },
    { id: "x41", tags: ["CLF", "SAA"], topic: "governance", q: "Which AWS feature sets permission guardrails across all accounts in an organization?", options: ["IAM groups", "Service control policies", "Security groups", "Bucket policies"], answer: 1, why: "SCPs in AWS Organizations limit the maximum permissions in member accounts." },
    { id: "x42", tags: ["CLF"], topic: "governance", q: "Moving an application to the cloud with no code changes is called:", options: ["Refactor", "Rehost (lift and shift)", "Repurchase", "Retire"], answer: 1, why: "Rehosting moves the app as-is, typically onto VMs." },
    { id: "x43", tags: ["SAA"], topic: "networking", q: "How many IP addresses does AWS reserve in every subnet?", options: ["2", "3", "5", "8"], answer: 2, why: "AWS reserves the first four and the last address of each subnet (Azure also reserves 5)." },
  ],

  certTopics: { clf: ["governance", "architecture"], saa: ["architecture", "data", "governance"], az900: ["governance", "data"], az104: ["kubernetes", "governance"] },

  videos: {
    kubernetes: [V("PziYflu8cB8", "Kubernetes Explained in 100 Seconds", "Fireship"), V("X48VuDVv0do", "Kubernetes Tutorial for Beginners (Full Course)", "TechWorld with Nana")],
    architecture: [V("B7IL7AuOxFQ", "Disaster Recovery on AWS: RPO, RTO & DR Strategies", "Peace Of Code")],
  },

  glossary: [
    ["Availability zone (AZ)", "One or more isolated data centers within a region, with independent power and networking."],
    ["Autoscaling", "Automatically adding or removing capacity based on metrics or schedules."],
    ["Blue/green deployment", "Running two production environments and switching traffic from old (blue) to new (green) all at once, with instant rollback."],
    ["Canary release", "Sending a small share of traffic to a new version first and increasing it while monitoring."],
    ["CDN", "Content delivery network: edge locations that cache content close to users (CloudFront, Front Door)."],
    ["CIDR", "Notation for IP ranges, e.g. 10.0.0.0/16 = 65,536 addresses."],
    ["Cold start", "Extra latency when a serverless platform starts a new instance of a function."],
    ["Container", "A packaged app with its dependencies that shares the host OS kernel."],
    ["Dead-letter queue", "Where messages go after repeatedly failing processing, for inspection and replay."],
    ["Egress", "Data transferred out of a cloud region or to the internet; usually billed."],
    ["IaaS / PaaS / SaaS", "Infrastructure, platform and software as a service: increasing levels of provider management."],
    ["IAM role / managed identity", "An identity that workloads assume to get temporary credentials, avoiding stored keys."],
    ["Idempotent", "Safe to run more than once with the same result; essential with retries and at-least-once delivery."],
    ["Infrastructure as code", "Defining cloud resources in version-controlled files (Terraform, CloudFormation, Bicep)."],
    ["Landing zone", "A pre-configured, governed multi-account/subscription foundation."],
    ["Least privilege", "Granting only the permissions required for a task."],
    ["Load balancer", "Distributes traffic across healthy targets; Layer 7 understands HTTP, Layer 4 handles TCP/UDP."],
    ["Multi-AZ", "Deploying redundant copies across availability zones to survive a data-center failure."],
    ["NAT gateway", "Lets resources in private subnets make outbound internet connections without being reachable from the internet."],
    ["OIDC federation", "Trusting an external identity provider (e.g. GitHub) to issue short-lived cloud credentials."],
    ["Pod", "The smallest deployable unit in Kubernetes: one or more containers sharing a network namespace."],
    ["Pre-signed URL / SAS", "A time-limited link granting access to a private object."],
    ["Private endpoint / PrivateLink", "Private network access to a managed service without traversing the internet."],
    ["Region", "A geographic area containing multiple availability zones."],
    ["RPO / RTO", "Recovery point objective (max data loss) and recovery time objective (max downtime)."],
    ["Security group / NSG", "Stateful firewall rules attached to resources (AWS) or subnets/NICs (Azure)."],
    ["Serverless", "Running code or services without managing servers, billed per use and scaling to zero."],
    ["Shared responsibility model", "The provider secures the cloud's infrastructure; the customer secures what they put in it."],
    ["Spot instance", "Spare capacity at a large discount that can be reclaimed with short notice."],
    ["Subnet", "A range of IP addresses within a VPC/VNet, public or private."],
    ["Terraform state", "Terraform's record of what it manages; keep it remote, locked and out of Git."],
    ["VPC / VNet", "Your logically isolated private network in AWS / Azure."],
    ["Well-Architected Framework", "Provider guidance for reviewing workloads by pillars like security, reliability and cost."],
  ],
});
