// Cloud Prep track: AWS + Azure side by side. Concepts are provider-neutral; each topic maps
// the concept to the AWS and Azure service names. body HTML is trusted (written here).
// Exam codes and service names change: the Certs tab tells learners to confirm on official pages.

const CLOUD = {
  id: "cloud", name: "Cloud Prep", short: "Cloud", tagline: "AWS + Azure for interviews, hands-on labs and certifications",
  labsName: "Labs",
  groups: [
    ["Foundations", ["fundamentals", "iam", "security"]],
    ["Compute", ["compute", "containers", "serverless"]],
    ["Data", ["storage", "databases"]],
    ["Networking & integration", ["networking", "messaging"]],
    ["Operations", ["devops", "operations"]],
  ],
  weeks: [
    { n: 1, title: "Cloud fundamentals & identity", topics: ["fundamentals", "iam"], labs: [], goal: "Explain the shared responsibility model and set up accounts safely (MFA, budget alert, no root/global-admin use)." },
    { n: 2, title: "Security & storage", topics: ["security", "storage"], labs: ["staticsite"], goal: "Host a static site on object storage behind a CDN with HTTPS." },
    { n: 3, title: "Compute & networking", topics: ["compute", "networking"], labs: [], goal: "Explain VPC/VNet design with public and private subnets." },
    { n: 4, title: "Containers & serverless", topics: ["containers", "serverless"], labs: ["serverlessapi"], goal: "Build a serverless REST API backed by a NoSQL table." },
    { n: 5, title: "Databases & messaging", topics: ["databases", "messaging"], labs: [], goal: "Choose the right database and decouple services with queues and events." },
    { n: 6, title: "DevOps: IaC and CI/CD", topics: ["devops"], labs: ["containercicd", "terraformnet"], goal: "Deploy a container automatically from GitHub, with infrastructure in code." },
    { n: 7, title: "Observability, cost & Well-Architected", topics: ["operations"], labs: ["observability"], goal: "Add monitoring, alerts and cost guardrails; reason with the Well-Architected pillars." },
    { n: 8, title: "Certification & interview sprint", topics: [], labs: [], goal: "Take full quizzes for your target exam, drill the question bank, and polish lab write-ups for your resume." },
  ],

  topics: [
    {
      id: "fundamentals", title: "Cloud fundamentals", short: "1",
      body: `<p>The cloud is renting computing as a utility: you pay for what you use, provision in minutes, and let the provider run the data centers.</p>
        <ul>
          <li><b>Service models:</b> IaaS (virtual machines, networks: you manage the OS), PaaS (managed runtimes and databases: you manage the app), SaaS (finished software like Microsoft 365).</li>
          <li><b>Regions and availability zones:</b> a region is a geographic area; each has several isolated data centers (AZs). Spread across AZs for high availability, across regions for disaster recovery.</li>
          <li><b>Canadian regions</b> matter for data residency (banks, government, healthcare): AWS <code>ca-central-1</code> (Montreal) and <code>ca-west-1</code> (Calgary); Azure <b>Canada Central</b> (Toronto) and <b>Canada East</b> (Quebec City).</li>
          <li><b>Shared responsibility:</b> the provider secures the cloud (hardware, facilities, hypervisor); you secure what you put <em>in</em> it (identities, data, configuration, OS patches on VMs). The more managed the service, the less you own.</li>
          <li><b>Economics:</b> capital expense becomes operating expense. Pricing: on-demand, commitments (AWS Savings Plans/Reserved Instances, Azure Reservations/Savings Plans) and spare capacity (Spot) at deep discounts but interruptible.</li>
          <li><b>Key properties:</b> elasticity (scale with demand), high availability, fault tolerance, and disaster recovery (RPO = how much data you can lose, RTO = how long you can be down).</li></ul>`,
      map: [["Geographic area", "Region", "Region"], ["Isolated data center(s)", "Availability Zone", "Availability Zone"], ["Account / billing boundary", "AWS account (Organizations)", "Subscription (Management groups)"], ["Grouping resources", "Tags, CloudFormation stacks", "Resource groups, tags"], ["Command line", "AWS CLI", "Azure CLI (az)"]],
      code: [{ label: "First commands (CLI)", code: `# AWS: configure credentials, then confirm who you are
aws configure                      # or: aws configure sso
aws sts get-caller-identity

# Azure: sign in, then confirm the active subscription
az login
az account show --output table` }],
      cards: [
        ["Under shared responsibility, who patches the OS of a VM?", "You do. The provider secures the physical host and hypervisor; the guest OS, apps and data on an IaaS VM are yours. On PaaS/serverless, the provider patches the runtime."],
        ["High availability vs disaster recovery?", "HA keeps a service running through component failures (multiple AZs, health checks). DR restores service after a large-scale event (another region), measured by RPO and RTO."],
        ["Why might a Toronto bank insist on Canada Central or ca-central-1?", "Data residency and regulatory requirements: customer data must stay in Canada."],
      ],
    },
    {
      id: "iam", title: "Identity & access (IAM)", short: "2",
      body: `<p>Identity is the new perimeter: most cloud breaches come from leaked credentials or over-broad permissions, not broken encryption.</p>
        <ul>
          <li><b>Authentication</b> proves who you are; <b>authorization</b> decides what you can do.</li>
          <li><b>Least privilege:</b> grant only the actions and resources needed, then tighten further. Prefer groups and roles over permissions on individual users.</li>
          <li><b>Protect the top account:</b> MFA everywhere; don't use the AWS root user or a Global Administrator for daily work.</li>
          <li><b>Workloads use roles, not keys:</b> EC2/Lambda get an IAM role; Azure resources get a managed identity. CI/CD should use OIDC federation instead of long-lived access keys.</li>
          <li><b>AWS:</b> users, groups, roles and JSON policies (an explicit Deny always wins). <b>Azure:</b> identities live in Microsoft Entra ID; access is granted with RBAC role assignments at a scope (management group, subscription, resource group, resource).</li>
          <li><b>Guardrails</b> across many accounts: AWS Organizations SCPs; Azure Policy and management groups.</li></ul>`,
      map: [["Identity directory / SSO", "IAM Identity Center", "Microsoft Entra ID"], ["Permissions", "IAM policies (JSON)", "Azure RBAC role assignments"], ["Identity for workloads", "IAM roles (instance profiles)", "Managed identities"], ["Org-wide guardrails", "Service control policies", "Azure Policy"], ["Temporary credentials", "STS AssumeRole", "Entra tokens"]],
      code: [{ label: "AWS policy: read-only access to one bucket", code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::reports-bucket",
        "arn:aws:s3:::reports-bucket/*"
      ]
    }
  ]
}` }, { label: "Azure: give a group read access to one resource group", code: `az role assignment create \\
  --assignee-object-id <group-object-id> \\
  --assignee-principal-type Group \\
  --role "Reader" \\
  --scope /subscriptions/<sub-id>/resourceGroups/rg-reports` }],
      cards: [
        ["An app on a VM needs to read from object storage. How do you give it access?", "Attach an IAM role (AWS) or a managed identity (Azure) with least-privilege permissions. Never bake access keys into the code or the image."],
        ["In AWS, a policy allows an action and another denies it. What happens?", "An explicit Deny always wins over an Allow."],
        ["How should GitHub Actions deploy to the cloud without stored secrets?", "OIDC federation: the workflow exchanges a short-lived GitHub token for temporary cloud credentials via a trusted role or federated identity."],
      ],
    },
    {
      id: "security", title: "Security, keys & secrets", short: "3",
      body: `<ul>
          <li><b>Encrypt in transit</b> (TLS everywhere) and <b>at rest</b> (usually on by default; use customer-managed keys when compliance requires control over the keys).</li>
          <li><b>Key management:</b> AWS KMS / Azure Key Vault keys. <b>Secrets</b> (DB passwords, API keys): AWS Secrets Manager (or Parameter Store) / Azure Key Vault secrets, with rotation. Never put secrets in code, images, or Git.</li>
          <li><b>Audit everything:</b> AWS CloudTrail and Azure Activity Log record who did what. Banks rely on these trails.</li>
          <li><b>Threat detection and posture:</b> GuardDuty and Security Hub / Microsoft Defender for Cloud flag risky configurations and suspicious activity.</li>
          <li><b>Edge protection:</b> WAF (AWS WAF / Azure WAF) for app-layer attacks, DDoS protection (AWS Shield / Azure DDoS Protection).</li>
          <li><b>Network isolation:</b> private subnets, private endpoints, no public databases.</li>
          <li><b>Common mistakes:</b> public storage buckets, wide-open security groups (0.0.0.0/0 on SSH or RDP), overly broad IAM, unrotated keys.</li></ul>`,
      map: [["Encryption keys", "AWS KMS", "Azure Key Vault (keys)"], ["Secrets storage", "Secrets Manager / Parameter Store", "Azure Key Vault (secrets)"], ["Audit log of API calls", "CloudTrail", "Activity Log"], ["Threat detection & posture", "GuardDuty, Security Hub", "Microsoft Defender for Cloud"], ["Web application firewall", "AWS WAF", "Azure WAF (Front Door / App Gateway)"]],
      code: [{ label: "Read a secret at runtime (Python, AWS)", code: `import json
import boto3

def get_db_credentials(secret_id="prod/app/db"):
    client = boto3.client("secretsmanager")
    secret = client.get_secret_value(SecretId=secret_id)
    return json.loads(secret["SecretString"])     # {"username": ..., "password": ...}

# The function's IAM role, not a stored key, grants secretsmanager:GetSecretValue.` }],
      cards: [
        ["Where should a database password live?", "In a secrets manager (Secrets Manager or Key Vault), fetched at runtime by an identity with least-privilege access, ideally rotated automatically."],
        ["What's the most common cloud data leak?", "Misconfiguration: publicly readable storage or overly permissive access, not broken encryption."],
        ["Why do auditors care about CloudTrail / Activity Log?", "They provide an immutable record of who changed what and when, which is essential for investigations and compliance."],
      ],
    },
    {
      id: "compute", title: "Compute: VMs & autoscaling", short: "4",
      body: `<ul>
          <li><b>Virtual machines:</b> AWS EC2 and Azure Virtual Machines. Choose an instance size by vCPU, memory, network and GPU needs; start small and rightsize from metrics.</li>
          <li><b>Images:</b> AMIs / Azure images capture a configured OS so new instances boot ready to serve.</li>
          <li><b>Autoscaling:</b> EC2 Auto Scaling groups / Virtual Machine Scale Sets add or remove instances based on CPU, request count or schedules. Keep instances stateless so any can be removed.</li>
          <li><b>Load balancers:</b> Layer 7 (HTTP routing, TLS): Application Load Balancer / Azure Application Gateway. Layer 4 (TCP/UDP, very high throughput): Network Load Balancer / Azure Load Balancer.</li>
          <li><b>Cost:</b> Spot VMs for fault-tolerant batch work; commitments for steady baseline load; shut down dev machines at night.</li>
          <li><b>When to choose VMs:</b> lift-and-shift legacy apps, special OS or licensing needs, full control. Otherwise prefer containers or serverless.</li></ul>`,
      map: [["Virtual machine", "EC2", "Azure Virtual Machines"], ["Machine image", "AMI", "Managed image / Compute Gallery"], ["Autoscaling group", "EC2 Auto Scaling group", "Virtual Machine Scale Sets"], ["HTTP (L7) load balancer", "Application Load Balancer", "Application Gateway"], ["TCP (L4) load balancer", "Network Load Balancer", "Azure Load Balancer"], ["Simple PaaS web hosting", "Elastic Beanstalk", "Azure App Service"]],
      code: [{ label: "List running VMs", code: `aws ec2 describe-instances \\
  --filters "Name=instance-state-name,Values=running" \\
  --query "Reservations[].Instances[].[InstanceId,InstanceType]" --output table

az vm list --show-details --query "[?powerState=='VM running'].{name:name, size:hardwareProfile.vmSize}" -o table` }],
      cards: [
        ["Why must instances in an autoscaling group be stateless?", "Instances are added and removed at any time; sessions, uploads and state must live in shared services (cache, database, object storage) or they're lost."],
        ["ALB/Application Gateway or NLB/Azure Load Balancer?", "Layer 7 for HTTP routing by path/host, TLS termination, WAF. Layer 4 for raw TCP/UDP, extreme throughput, or static IPs."],
        ["When are Spot VMs a good idea?", "Interruptible, fault-tolerant work: batch jobs, CI runners, stateless workers. Not for a single critical database."],
      ],
    },
    {
      id: "containers", title: "Containers & Kubernetes", short: "5",
      body: `<ul>
          <li>A <b>container</b> packages an app with its dependencies so it runs the same on a laptop, in CI, and in the cloud. Build from a <code>Dockerfile</code> and push to a <b>registry</b> (Amazon ECR / Azure Container Registry).</li>
          <li><b>Orchestration</b> runs many containers: scheduling, health checks, restarts, rolling deploys, scaling.</li>
          <li><b>Kubernetes</b> (EKS / AKS) is the industry standard: pods, deployments, services, ingress. Powerful, but operationally heavy.</li>
          <li><b>Simpler managed options:</b> Amazon ECS (often with serverless <b>Fargate</b>) and <b>Azure Container Apps</b> run containers without managing a cluster. Great defaults for small teams.</li>
          <li>Good practice: small base images, a non-root user, one process per container, config via environment variables, image scanning, and immutable tags (a git SHA rather than <code>latest</code>).</li></ul>`,
      map: [["Container registry", "Amazon ECR", "Azure Container Registry"], ["Managed Kubernetes", "Amazon EKS", "Azure Kubernetes Service (AKS)"], ["Containers without a cluster", "ECS on Fargate, App Runner", "Azure Container Apps"], ["Single containers, quick", "ECS task / App Runner", "Azure Container Instances"]],
      code: [{ label: "Dockerfile for a small Python API", code: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --create-home appuser
USER appuser                          # don't run as root
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]` }],
      cards: [
        ["Container vs VM?", "A VM virtualizes hardware and runs a full OS; a container shares the host kernel and packages only the app and its dependencies, so it starts in seconds and is much lighter."],
        ["Why might a team choose ECS Fargate or Container Apps over Kubernetes?", "Far less operational overhead (no cluster upgrades, node management or complex networking) when they don't need Kubernetes' flexibility."],
        ["Why avoid the 'latest' image tag in production?", "It's mutable, so you can't tell exactly what's running or roll back reliably. Tag images with the commit SHA or a version."],
      ],
    },
    {
      id: "serverless", title: "Serverless functions & APIs", short: "6",
      body: `<ul>
          <li><b>Functions as a service:</b> AWS Lambda / Azure Functions run your code in response to events (HTTP, queue messages, file uploads, schedules). No servers to manage; pay per invocation and duration; scale to zero.</li>
          <li><b>Limits to know:</b> execution time limits (a Lambda invocation runs at most 15 minutes), memory/CPU caps, and <b>cold starts</b> (extra latency when a new instance spins up).</li>
          <li><b>API front doors:</b> Amazon API Gateway / Azure API Management handle routing, auth, throttling and API keys.</li>
          <li><b>Workflows:</b> AWS Step Functions / Azure Durable Functions or Logic Apps orchestrate multi-step processes with retries.</li>
          <li><b>Great for:</b> spiky or low traffic, glue code, scheduled jobs, event processing. <b>Weaker for:</b> long-running jobs, steady high load (can cost more than containers), and very latency-sensitive paths.</li>
          <li>Design functions to be <b>idempotent</b> because events can be delivered more than once.</li></ul>`,
      map: [["Functions", "AWS Lambda", "Azure Functions"], ["API front door", "Amazon API Gateway", "Azure API Management"], ["Workflow orchestration", "AWS Step Functions", "Durable Functions / Logic Apps"], ["Scheduled triggers", "EventBridge Scheduler", "Timer trigger"]],
      code: [{ label: "A Lambda handler behind API Gateway (Python)", code: `import json

def handler(event, context):
    name = (event.get("queryStringParameters") or {}).get("name", "world")
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": f"Hello, {name}!"}),
    }` }],
      cards: [
        ["What is a cold start and how do you reduce it?", "Extra latency when the platform starts a new instance for your function. Reduce it with smaller packages, lighter runtimes, initializing clients outside the handler, or provisioned concurrency / premium plans."],
        ["When is serverless the wrong choice?", "Long-running work beyond time limits, steady heavy traffic where always-on containers are cheaper, or ultra-low-latency paths that can't tolerate cold starts."],
        ["Why must event handlers be idempotent?", "Most event sources deliver at least once, so the same event can arrive twice; processing it again must not double-charge or duplicate records."],
      ],
    },
    {
      id: "storage", title: "Storage: object, block & file", short: "7",
      body: `<ul>
          <li><b>Object storage</b> (Amazon S3 / Azure Blob Storage): virtually unlimited files addressed by key, accessed over HTTP. Use for uploads, backups, static sites, data lakes.</li>
          <li><b>Block storage</b> (EBS / Managed Disks): a disk attached to one VM, for OS and databases you run yourself.</li>
          <li><b>File storage</b> (EFS, FSx / Azure Files): shared network file systems mounted by many machines.</li>
          <li><b>Tiers:</b> pay less for rarely accessed data. S3 Standard, Standard-IA and Glacier classes; Blob Hot, Cool, Cold and Archive tiers. <b>Lifecycle rules</b> move data automatically.</li>
          <li><b>Protect data:</b> block public access by default, enable versioning, and share files temporarily with <b>pre-signed URLs</b> (S3) or <b>SAS tokens</b> (Azure).</li>
          <li><b>Durability vs availability:</b> object storage is designed for extremely high durability; replicate across regions for disaster recovery.</li></ul>`,
      map: [["Object storage", "Amazon S3", "Azure Blob Storage"], ["VM disks", "Amazon EBS", "Azure Managed Disks"], ["Shared file system", "Amazon EFS / FSx", "Azure Files"], ["Archive tier", "S3 Glacier classes", "Blob Archive tier"], ["Temporary access link", "Pre-signed URL", "Shared access signature (SAS)"]],
      code: [{ label: "Upload a file and share it for 15 minutes (Python, AWS)", code: `import boto3

s3 = boto3.client("s3")
s3.upload_file("report.pdf", "reports-bucket", "2026/report.pdf")

url = s3.generate_presigned_url(
    "get_object",
    Params={"Bucket": "reports-bucket", "Key": "2026/report.pdf"},
    ExpiresIn=900,                    # seconds
)
print(url)                            # anyone with this link can download until it expires` }],
      cards: [
        ["Object, block or file storage for user-uploaded photos?", "Object storage (S3 / Blob): cheap, durable, HTTP-accessible, and easy to put behind a CDN."],
        ["How do you let a user download a private file without making the bucket public?", "Generate a short-lived pre-signed URL (S3) or SAS token (Azure)."],
        ["How do you cut storage costs for old logs automatically?", "Lifecycle rules that move objects to cooler/archive tiers after N days and delete them after the retention period."],
      ],
    },
    {
      id: "databases", title: "Managed databases & caching", short: "8",
      body: `<ul>
          <li><b>Managed relational:</b> Amazon RDS and Aurora / Azure SQL Database and Azure Database for PostgreSQL or MySQL. The provider handles patching, backups, failover and replicas.</li>
          <li><b>High availability:</b> a standby in another AZ with automatic failover (RDS Multi-AZ / zone-redundant Azure SQL). <b>Read replicas</b> scale reads.</li>
          <li><b>NoSQL:</b> DynamoDB / Azure Cosmos DB for massive scale with simple key-based access. Design the table around your access patterns and partition key.</li>
          <li><b>Caching:</b> Amazon ElastiCache / Azure's managed Redis offerings take load off the database for hot reads and sessions.</li>
          <li><b>Analytics:</b> warehouses such as Amazon Redshift and Microsoft Fabric / Synapse; keep analytics off the transactional database.</li>
          <li><b>Backups:</b> automated backups plus point-in-time restore; test restores regularly. An untested backup isn't a backup.</li></ul>`,
      map: [["Managed SQL", "Amazon RDS / Aurora", "Azure SQL Database / Azure Database for PostgreSQL"], ["NoSQL key-value / document", "Amazon DynamoDB", "Azure Cosmos DB"], ["In-memory cache", "Amazon ElastiCache", "Azure managed Redis"], ["Data warehouse", "Amazon Redshift", "Microsoft Fabric / Synapse"]],
      code: [{ label: "DynamoDB: write and read by key (Python)", code: `import boto3

table = boto3.resource("dynamodb").Table("Orders")
table.put_item(Item={"customer_id": "c42", "order_id": "o1001", "total_cents": 2599})

resp = table.get_item(Key={"customer_id": "c42", "order_id": "o1001"})
print(resp.get("Item"))` }],
      cards: [
        ["Multi-AZ standby vs read replica?", "A Multi-AZ standby is for availability (automatic failover, not used for reads). A read replica is for scaling reads and can lag behind the primary."],
        ["When would you pick DynamoDB or Cosmos DB over a relational database?", "Huge scale with predictable key-based access, single-digit-millisecond latency, flexible schema, and no need for complex joins or multi-table transactions."],
        ["Why test restores?", "Backups can be incomplete, corrupted or misconfigured; only a successful restore proves you can recover within your RTO."],
      ],
    },
    {
      id: "networking", title: "Networking: VPC / VNet, DNS & CDN", short: "9",
      body: `<ul>
          <li>A <b>VPC</b> (AWS) / <b>VNet</b> (Azure) is your private network in the cloud, with an IP range (e.g. 10.0.0.0/16) split into <b>subnets</b>.</li>
          <li><b>Public subnets</b> route to the internet (load balancers). <b>Private subnets</b> hold apps and databases; outbound internet goes through a <b>NAT gateway</b>.</li>
          <li><b>Firewalls:</b> AWS security groups (stateful, per resource) and network ACLs (stateless, per subnet); Azure Network Security Groups.</li>
          <li><b>Connecting networks:</b> peering between VPCs/VNets; site-to-site VPN; dedicated private links to on-premises (AWS Direct Connect / Azure ExpressRoute), common at banks.</li>
          <li><b>Private access to PaaS:</b> PrivateLink / Private Endpoints keep traffic to managed services off the public internet.</li>
          <li><b>DNS and edge:</b> Route 53 / Azure DNS; CDNs (CloudFront / Azure Front Door) cache content near users and terminate TLS.</li></ul>`,
      map: [["Private network", "VPC", "Virtual Network (VNet)"], ["Instance firewall", "Security group", "Network Security Group"], ["Outbound internet for private subnets", "NAT gateway", "NAT Gateway"], ["Private link to on-prem", "Direct Connect", "ExpressRoute"], ["Private access to PaaS", "PrivateLink / VPC endpoints", "Private Endpoint"], ["DNS", "Route 53", "Azure DNS"], ["CDN / global edge", "CloudFront", "Azure Front Door"]],
      code: [{ label: "Terraform: a VPC with a public and a private subnet (AWS)", code: `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags       = { Name = "app-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ca-central-1a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ca-central-1a"
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}` }],
      cards: [
        ["Your database is in a private subnet. How does it get OS updates?", "Outbound traffic goes through a NAT gateway in a public subnet; nothing on the internet can initiate a connection back in."],
        ["Security group vs network ACL?", "Security groups are stateful and attached to resources (return traffic is allowed automatically). NACLs are stateless subnet-level rules that need explicit inbound and outbound entries."],
        ["How does a bank connect its data center to Azure privately?", "ExpressRoute (or a site-to-site VPN for smaller needs); AWS's equivalent is Direct Connect."],
      ],
    },
    {
      id: "messaging", title: "Messaging, events & integration", short: "10",
      body: `<ul>
          <li><b>Queues</b> (Amazon SQS / Azure Service Bus queues) decouple producers and consumers, absorb spikes, and enable retries with dead-letter queues.</li>
          <li><b>Pub/sub</b> (Amazon SNS / Service Bus topics, Event Grid) fans one event out to many subscribers.</li>
          <li><b>Event routing</b> (Amazon EventBridge / Azure Event Grid) routes events from services and SaaS by rules.</li>
          <li><b>Streaming</b> (Amazon Kinesis or managed Kafka / Azure Event Hubs) handles high-volume ordered event streams for analytics and logs.</li>
          <li>Choose by need: <b>work distribution</b> means a queue; <b>notify many</b> means pub/sub; <b>replayable high-volume stream</b> means streaming.</li>
          <li>Expect <b>at-least-once</b> delivery: make consumers idempotent and watch dead-letter queues.</li></ul>`,
      map: [["Queue", "Amazon SQS", "Service Bus queue / Storage queue"], ["Pub/sub topic", "Amazon SNS", "Service Bus topic"], ["Event router", "Amazon EventBridge", "Azure Event Grid"], ["Event streaming", "Kinesis / Amazon MSK", "Azure Event Hubs"]],
      code: [{ label: "Send and process queue messages (Python, AWS SQS)", code: `import json
import boto3

sqs = boto3.client("sqs")
queue_url = sqs.get_queue_url(QueueName="orders")["QueueUrl"]

sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps({"order_id": "o1001"}))

resp = sqs.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=10, WaitTimeSeconds=20)
for msg in resp.get("Messages", []):
    process(json.loads(msg["Body"]))                     # must be idempotent
    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=msg["ReceiptHandle"])` }],
      cards: [
        ["Queue or topic for 'order placed' that email, inventory and analytics all need?", "A topic (pub/sub): each subscriber gets its own copy, often each feeding its own queue."],
        ["What happens to a message that keeps failing?", "After the maximum receive count it moves to a dead-letter queue for inspection and replay."],
        ["Why does SQS use a visibility timeout?", "A received message is hidden from other consumers while one processes it; if not deleted in time, it reappears for retry."],
      ],
    },
    {
      id: "devops", title: "DevOps: infrastructure as code & CI/CD", short: "11",
      body: `<ul>
          <li><b>Infrastructure as code (IaC):</b> define cloud resources in files, review them in pull requests, and apply them repeatably. <b>Terraform</b> works across clouds; native options are AWS CloudFormation/CDK and Azure Bicep/ARM.</li>
          <li>Terraform workflow: <code>init</code>, <code>plan</code> (preview changes), <code>apply</code>. Keep <b>state</b> remote and locked (an S3 backend or Azure Storage), never in Git.</li>
          <li><b>CI/CD:</b> every push runs tests, builds an artifact or image, and deploys through environments (dev, staging, prod). Tools: GitHub Actions, Azure DevOps Pipelines, AWS CodePipeline, GitLab.</li>
          <li><b>Deployment strategies:</b> rolling, blue/green (switch traffic between two environments), canary (send a small percentage first). Always have a rollback.</li>
          <li><b>Security in pipelines:</b> OIDC instead of stored keys, secret scanning, dependency and image scanning, least-privilege deploy roles. Your QA background fits right in: automated tests are the gate.</li></ul>`,
      map: [["Native IaC", "CloudFormation / CDK", "Bicep / ARM templates"], ["Multi-cloud IaC", "Terraform", "Terraform"], ["CI/CD service", "CodePipeline / CodeBuild", "Azure DevOps Pipelines"], ["Popular CI/CD (either)", "GitHub Actions", "GitHub Actions"]],
      code: [{ label: "GitHub Actions: test, build, push to Amazon ECR with OIDC", code: `name: deploy
on:
  push:
    branches: [main]
permissions:
  id-token: write                 # needed for OIDC
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt && pytest
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-deploy
          aws-region: ca-central-1
      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr
      - run: |
          docker build -t \${{ steps.ecr.outputs.registry }}/app:\${{ github.sha }} .
          docker push \${{ steps.ecr.outputs.registry }}/app:\${{ github.sha }}` }],
      cards: [
        ["Why keep Terraform state remote and locked?", "So the whole team shares one source of truth and two applies can't run at once and corrupt it. State can also contain secrets, so it must not live in Git."],
        ["Blue/green vs canary?", "Blue/green flips all traffic from the old environment to a full new one (instant rollback by flipping back). Canary shifts a small percentage first and grows it while watching metrics."],
        ["What does 'terraform plan' protect you from?", "Surprises: it shows exactly what will be created, changed or destroyed before you apply, and is ideal to review in a pull request."],
      ],
    },
    {
      id: "operations", title: "Observability, cost & Well-Architected", short: "12",
      body: `<ul>
          <li><b>Monitoring:</b> Amazon CloudWatch (metrics, logs, alarms) and X-Ray tracing / Azure Monitor with Application Insights and Log Analytics. Alert on symptoms users feel: error rate, latency (p95/p99), saturation.</li>
          <li><b>Cost control:</b> budgets with alerts (AWS Budgets / Azure Cost Management budgets), tagging every resource (team, env, cost-center), rightsizing, deleting idle resources, commitments for steady load. Watch for silent cost traps: NAT gateways, data egress, idle databases, forgotten snapshots.</li>
          <li><b>AWS Well-Architected</b> has six pillars: operational excellence, security, reliability, performance efficiency, cost optimization, sustainability. <b>Azure Well-Architected Framework</b> has five: reliability, security, cost optimization, operational excellence, performance efficiency.</li>
          <li>In design interviews, walking through the pillars is an easy way to sound senior: "For reliability I'd go multi-AZ; for cost I'd use autoscaling with a savings plan for the baseline..."</li></ul>`,
      map: [["Metrics, logs, alarms", "Amazon CloudWatch", "Azure Monitor / Log Analytics"], ["App performance & tracing", "AWS X-Ray", "Application Insights"], ["Budgets & cost analysis", "AWS Budgets / Cost Explorer", "Cost Management + Billing"], ["Best-practice review", "Well-Architected Tool, Trusted Advisor", "Azure Advisor, Well-Architected review"]],
      code: [{ label: "A monthly budget alert (AWS CLI)", code: `aws budgets create-budget --account-id 123456789012 \\
  --budget '{"BudgetName":"monthly-cap","BudgetLimit":{"Amount":"20","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \\
  --notifications-with-subscribers '[{"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":80},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"you@example.com"}]}]'` }],
      cards: [
        ["Name three hidden cloud cost traps.", "NAT gateway hourly and data charges, data transfer out (egress), and idle resources such as stopped-but-attached disks, unused IPs, old snapshots or oversized databases."],
        ["Which metrics would you alert on for a web API?", "Error rate, latency percentiles (p95/p99), traffic, and saturation (CPU, memory, queue depth): the 'golden signals'."],
        ["Name the AWS Well-Architected pillars.", "Operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability."],
      ],
    },
  ],

  questions: [
    { id: "q1", topic: "fundamentals", q: "Explain the shared responsibility model with an example.", a: "The provider secures the infrastructure (data centers, hardware, hypervisor, managed service internals); the customer secures what they configure: identities, data, network rules, and the OS on VMs. Example: with EC2 you patch the OS; with Lambda the provider patches the runtime but you still own your code, permissions and data." },
    { id: "q2", topic: "fundamentals", q: "How would you design for high availability vs disaster recovery?", a: "HA: run across multiple availability zones behind a load balancer with health checks and a multi-AZ database. DR: replicate data and infrastructure-as-code to another region, choose a strategy by RPO/RTO (backup-restore, pilot light, warm standby, active-active), and test failover." },
    { id: "q3", topic: "iam", q: "What does least privilege mean in practice?", a: "Grant only the specific actions on the specific resources a person or workload needs, scoped as narrowly as possible, using roles/groups instead of individual grants, reviewing access regularly, and removing unused permissions." },
    { id: "q4", topic: "iam", q: "How do you avoid long-lived credentials in applications and pipelines?", a: "Use IAM roles / managed identities for workloads, OIDC federation for CI/CD, and SSO with temporary credentials for humans. Remaining secrets go in a secrets manager with rotation." },
    { id: "q5", topic: "security", q: "A storage bucket with customer data was found public. What do you do?", a: "Immediately block public access, then review access logs (CloudTrail / storage logs) to see what was read, rotate any exposed secrets, notify security/compliance (privacy obligations may apply), find the root cause, and add guardrails: account-level public-access blocks, policy-as-code checks, alerts." },
    { id: "q6", topic: "security", q: "How do you manage encryption keys and secrets?", a: "Keys in KMS / Key Vault (customer-managed when compliance requires), secrets in Secrets Manager / Key Vault, access granted to specific identities, rotation enabled, and all access audited. Nothing in code, images or Git." },
    { id: "q7", topic: "compute", q: "How would you make a web app on VMs scale automatically?", a: "Bake an image or use startup scripts, put instances in an Auto Scaling group / VM Scale Set across AZs behind a load balancer with health checks, scale on CPU or request count, and keep the app stateless (sessions in Redis or the database, files in object storage)." },
    { id: "q8", topic: "containers", q: "Kubernetes vs a managed container service like ECS Fargate or Azure Container Apps?", a: "Kubernetes offers maximum flexibility, portability and ecosystem but needs real operational expertise. Managed services run containers with far less overhead. For a small team or simple services start managed; choose Kubernetes when you need its features or already have platform expertise." },
    { id: "q9", topic: "containers", q: "What makes a good production container image?", a: "Small, pinned base image; dependencies installed in a cached layer; non-root user; no secrets baked in; health check; config from environment; scanned for vulnerabilities; tagged immutably with a version or commit SHA." },
    { id: "q10", topic: "serverless", q: "When would you choose serverless functions over containers?", a: "Event-driven or spiky workloads, glue code, scheduled tasks, and quick APIs with low or variable traffic. Choose containers for long-running processes, steady high traffic, special runtimes, or strict latency requirements." },
    { id: "q11", topic: "serverless", q: "How do you handle a slow third-party call inside a Lambda behind API Gateway?", a: "Don't make the client wait: accept the request, put a message on a queue, return 202 Accepted with a job ID, process asynchronously, and let the client poll or receive a webhook. Add timeouts and retries with backoff." },
    { id: "q12", topic: "storage", q: "Design storage for user-uploaded documents in a banking app.", a: "Object storage in a Canadian region with public access blocked, encryption (customer-managed keys if required), versioning, lifecycle rules for retention, uploads via pre-signed URLs or SAS directly from the client, malware scanning on upload, access logs, and least-privilege access for the app identity." },
    { id: "q13", topic: "databases", q: "How do you choose between RDS/Azure SQL and DynamoDB/Cosmos DB?", a: "Relational when you need transactions across tables, joins, flexible queries and strong consistency (most business apps). NoSQL when access patterns are simple and known, scale is huge, and you want predictable low latency with horizontal scaling." },
    { id: "q14", topic: "databases", q: "Your relational database CPU is at 90% from read traffic. Options?", a: "Add a cache for hot reads, add read replicas, optimize slow queries and indexes, then scale up the instance. Check whether some reads can be served by an analytics store instead." },
    { id: "q15", topic: "networking", q: "Walk through a typical secure VPC/VNet layout for a 3-tier app.", a: "Across two or more AZs: public subnets with only the load balancer (and NAT gateway); private app subnets with the compute; private data subnets with the database. Security groups allow LB to app and app to DB only; private endpoints for managed services; no SSH from the internet (use SSM Session Manager / Azure Bastion)." },
    { id: "q16", topic: "networking", q: "What happens when a user types your domain into a browser?", a: "DNS (Route 53 / Azure DNS) resolves the name, often to a CDN edge (CloudFront / Front Door) which serves cached content or forwards to the origin load balancer over TLS, which routes to healthy app instances in private subnets, which query the database." },
    { id: "q17", topic: "messaging", q: "How would you decouple an order service from email and inventory processing?", a: "Publish an OrderPlaced event to a topic or event bus; each consumer (email, inventory, analytics) gets its own queue subscribed to it, processes idempotently, and failed messages land in a dead-letter queue. The order API stays fast and services fail independently." },
    { id: "q18", topic: "devops", q: "Why infrastructure as code, and how do you manage changes safely?", a: "Repeatable, reviewable, versioned environments with no click-ops drift. Changes go through pull requests that show the plan output, automated checks (formatting, policy, security scanning), apply from CI with a least-privilege role, and remote locked state." },
    { id: "q19", topic: "devops", q: "Describe a CI/CD pipeline you'd set up for a containerized service.", a: "On pull request: lint, unit tests, build image, scan. On merge to main: build and tag with the commit SHA, push to the registry, deploy to staging, run smoke/integration tests, then a canary or blue/green to production with automatic rollback on alarms. OIDC for cloud access." },
    { id: "q20", topic: "operations", q: "How do you keep a cloud bill under control?", a: "Budgets and alerts from day one, mandatory tags for ownership, regular cost reviews, rightsizing, autoscaling and schedules for non-prod, commitments for steady baseline, storage lifecycle policies, and watching egress and NAT costs." },
    { id: "q21", topic: "operations", q: "An API's p99 latency doubled after a deploy. How do you investigate?", a: "Check dashboards and traces to find which dependency or endpoint slowed; compare with the deploy timeline; look at errors, saturation and DB metrics; roll back if user impact is significant, then root-cause with traces/logs, and add a regression test or alert." },
    { id: "q22", topic: "fundamentals", q: "AWS or Azure: how do you answer 'which cloud do you know?'", a: "Be honest about depth, then show the concepts transfer: 'I've built X on AWS; the Azure equivalents are Y. The fundamentals (identity, networking, compute choices, IaC) are the same, and I pick up service specifics quickly.'" },
    { id: "q23", topic: "security", q: "How would you secure a public web API end to end?", a: "TLS, WAF and DDoS protection at the edge, authentication (OAuth2/OIDC tokens) and authorization in the app, rate limiting at the gateway, input validation, least-privilege identities to backends, private networking for data stores, secrets in a vault, and logging/alerting on suspicious activity." },
    { id: "q24", topic: "storage", q: "How do you protect against accidental deletion of important files?", a: "Versioning, soft delete, object lock / immutable storage for compliance data, cross-region replication for DR, restricted delete permissions, and backups with tested restores." },
  ],

  quiz: [
    { id: "x1", tags: ["CLF", "AZ-900"], topic: "fundamentals", q: "Under the shared responsibility model, who is responsible for patching the guest OS on a virtual machine?", options: ["The cloud provider", "The customer", "Both equally", "Neither: it's automatic"], answer: 1, why: "IaaS VMs leave the guest OS to the customer. The provider handles physical hardware and the hypervisor." },
    { id: "x2", tags: ["CLF", "AZ-900"], topic: "fundamentals", q: "Which pricing option gives the deepest discount but can be interrupted with short notice?", options: ["On-demand", "Reserved / savings plan", "Spot", "Dedicated host"], answer: 2, why: "Spot uses spare capacity at large discounts and can be reclaimed by the provider." },
    { id: "x3", tags: ["CLF", "AZ-900", "SAA"], topic: "fundamentals", q: "To keep running if one data center fails, you should deploy across multiple:", options: ["Regions only", "Availability zones", "Edge locations", "Accounts"], answer: 1, why: "Availability zones are isolated data centers within a region and protect against a single facility failure." },
    { id: "x4", tags: ["CLF", "SAA"], topic: "iam", q: "An EC2 instance needs to read from S3. What's the recommended approach?", options: ["Store access keys in the code", "Attach an IAM role to the instance", "Make the bucket public", "Use the root user's keys"], answer: 1, why: "IAM roles provide temporary credentials automatically; nothing long-lived is stored on the instance." },
    { id: "x5", tags: ["AZ-900", "AZ-104"], topic: "iam", q: "In Azure, where do users and groups for sign-in live?", options: ["Azure Policy", "Microsoft Entra ID", "Azure Monitor", "Key Vault"], answer: 1, why: "Microsoft Entra ID (formerly Azure Active Directory) is Azure's identity service." },
    { id: "x6", tags: ["AZ-900", "AZ-104"], topic: "iam", q: "Which Azure feature grants a group the Reader role on a resource group?", options: ["Azure Policy", "Resource locks", "Azure RBAC role assignment", "Management group tags"], answer: 2, why: "RBAC role assignments grant permissions to a principal at a scope. Azure Policy enforces rules on resources rather than granting access." },
    { id: "x7", tags: ["CLF", "SAA"], topic: "iam", q: "In an AWS policy evaluation, an explicit Deny and an explicit Allow both match. The result is:", options: ["Allow", "Deny", "Whichever was attached last", "An error"], answer: 1, why: "An explicit Deny always overrides any Allow." },
    { id: "x8", tags: ["CLF", "AZ-900"], topic: "security", q: "Which service records API calls made in your AWS account for auditing?", options: ["CloudWatch", "CloudTrail", "AWS Config", "Inspector"], answer: 1, why: "CloudTrail logs who made which API call, when and from where." },
    { id: "x9", tags: ["AZ-900", "AZ-104"], topic: "security", q: "Where should an Azure app store a database connection secret?", options: ["App source code", "Azure Key Vault", "A blob in a public container", "Environment variable in the repository"], answer: 1, why: "Key Vault stores secrets securely; the app reads them with a managed identity." },
    { id: "x10", tags: ["SAA"], topic: "compute", q: "Which load balancer routes HTTP requests by URL path (e.g. /api vs /images)?", options: ["Network Load Balancer", "Application Load Balancer", "Gateway Load Balancer", "Classic DNS round robin"], answer: 1, why: "Layer 7 load balancers (ALB, Azure Application Gateway) understand HTTP and can route by path and host." },
    { id: "x11", tags: ["AZ-104"], topic: "compute", q: "Azure's equivalent of an EC2 Auto Scaling group is:", options: ["Availability set", "Virtual Machine Scale Sets", "Azure Batch only", "App Service plan"], answer: 1, why: "Virtual Machine Scale Sets manage a group of identical, autoscaling VMs." },
    { id: "x12", tags: ["CLF", "SAA"], topic: "containers", q: "Which lets you run containers on AWS without managing servers or a cluster's nodes?", options: ["EC2", "ECS with Fargate", "EBS", "Lightsail"], answer: 1, why: "Fargate is serverless compute for containers: you define tasks, AWS runs them." },
    { id: "x13", tags: ["AZ-900"], topic: "containers", q: "Which Azure service is managed Kubernetes?", options: ["Azure Container Instances", "Azure Kubernetes Service (AKS)", "Azure Functions", "Azure Batch"], answer: 1, why: "AKS is Azure's managed Kubernetes service." },
    { id: "x14", tags: ["CLF", "SAA"], topic: "serverless", q: "What's the maximum execution time of a single AWS Lambda invocation?", options: ["1 minute", "5 minutes", "15 minutes", "Unlimited"], answer: 2, why: "Lambda invocations time out at a maximum of 15 minutes. Longer work belongs in containers, Step Functions or batch." },
    { id: "x15", tags: ["AZ-900"], topic: "serverless", q: "An Azure service that runs code in response to events and bills per execution is:", options: ["Azure Functions", "Azure VMs", "Azure DevTest Labs", "Azure Bastion"], answer: 0, why: "Azure Functions is Azure's serverless functions service." },
    { id: "x16", tags: ["CLF", "SAA"], topic: "storage", q: "Which storage type is best for user-uploaded images served to a website?", options: ["Amazon EBS", "Amazon S3", "Instance store", "Amazon EFS"], answer: 1, why: "Object storage like S3 is durable, cheap, HTTP-accessible and easy to put behind a CDN." },
    { id: "x17", tags: ["AZ-900", "AZ-104"], topic: "storage", q: "Which Azure Blob tier has the lowest storage cost but requires rehydration before reading?", options: ["Hot", "Cool", "Cold", "Archive"], answer: 3, why: "Archive is cheapest to store, but blobs are offline and must be rehydrated (taking hours) before access." },
    { id: "x18", tags: ["SAA"], topic: "storage", q: "How do you give a user temporary download access to a private S3 object?", options: ["Make the object public for an hour", "Generate a pre-signed URL", "Email the IAM user's keys", "Use a bucket ACL for everyone"], answer: 1, why: "Pre-signed URLs grant time-limited access to a specific object without changing its permissions." },
    { id: "x19", tags: ["SAA"], topic: "databases", q: "An RDS database must survive an availability zone failure with automatic failover. Use:", options: ["A read replica", "Multi-AZ deployment", "A larger instance", "Manual snapshots"], answer: 1, why: "Multi-AZ keeps a synchronous standby in another AZ and fails over automatically." },
    { id: "x20", tags: ["CLF", "AZ-900"], topic: "databases", q: "Which is a globally distributed, multi-model NoSQL database on Azure?", options: ["Azure SQL Database", "Azure Cosmos DB", "Azure Database for MySQL", "Azure Synapse"], answer: 1, why: "Cosmos DB is Azure's globally distributed NoSQL database." },
    { id: "x21", tags: ["SAA"], topic: "networking", q: "Instances in a private subnet need to download updates from the internet. What do you add?", options: ["An internet gateway on the private subnet", "A NAT gateway in a public subnet", "Public IPs on each instance", "A VPC peering connection"], answer: 1, why: "A NAT gateway allows outbound-only internet access for private subnets." },
    { id: "x22", tags: ["SAA"], topic: "networking", q: "Security groups are:", options: ["Stateless, subnet-level", "Stateful, attached to resources", "Only for IPv6", "A DNS feature"], answer: 1, why: "Security groups are stateful and attached to network interfaces; network ACLs are stateless and subnet-level." },
    { id: "x23", tags: ["AZ-900", "AZ-104"], topic: "networking", q: "Which provides a private, dedicated connection from on-premises to Azure?", options: ["Azure VPN Gateway over the internet", "ExpressRoute", "Azure Front Door", "Azure DNS"], answer: 1, why: "ExpressRoute is a private connection via a connectivity provider, not over the public internet." },
    { id: "x24", tags: ["CLF", "AZ-900"], topic: "networking", q: "A CDN improves performance mainly by:", options: ["Encrypting the database", "Caching content at edge locations near users", "Adding more CPUs to the origin", "Compressing the VPC"], answer: 1, why: "CDNs (CloudFront, Front Door) serve cached content from locations close to users." },
    { id: "x25", tags: ["SAA"], topic: "messaging", q: "Decouple a web tier from a slow image-processing worker so requests return quickly:", options: ["Call the worker synchronously", "Put jobs on an SQS queue", "Increase the web tier timeout", "Use a bigger EC2 instance"], answer: 1, why: "A queue lets the web tier accept work immediately while workers process at their own pace with retries." },
    { id: "x26", tags: ["SAA"], topic: "messaging", q: "One event must be delivered to email, analytics and inventory services. Use:", options: ["A single SQS queue", "SNS topic (fan-out) with subscribers", "A cron job", "An S3 bucket"], answer: 1, why: "Pub/sub fans one message out to multiple subscribers, often each backed by its own queue." },
    { id: "x27", tags: ["AZ-104"], topic: "devops", q: "Azure's native, declarative infrastructure-as-code language is:", options: ["Bicep", "PowerShell only", "YAML pipelines", "Kusto"], answer: 0, why: "Bicep (which compiles to ARM templates) is Azure's native IaC language." },
    { id: "x28", tags: ["CLF", "SAA"], topic: "devops", q: "AWS's native infrastructure-as-code service is:", options: ["CloudTrail", "CloudFormation", "CloudWatch", "Config"], answer: 1, why: "CloudFormation provisions resources from templates; the CDK generates CloudFormation from code." },
    { id: "x29", tags: ["CLF", "AZ-900"], topic: "operations", q: "You want an email when monthly spend passes 80% of a limit. Use:", options: ["A budget with an alert", "Cost allocation tags only", "A support plan", "Reserved instances"], answer: 0, why: "AWS Budgets / Azure Cost Management budgets send alerts at thresholds you set." },
    { id: "x30", tags: ["CLF", "SAA"], topic: "operations", q: "Which is NOT a pillar of the AWS Well-Architected Framework?", options: ["Reliability", "Cost optimization", "Sustainability", "Marketing"], answer: 3, why: "The six pillars are operational excellence, security, reliability, performance efficiency, cost optimization and sustainability." },
    { id: "x31", tags: ["AZ-900", "AZ-104"], topic: "operations", q: "Which Azure service collects metrics and logs and provides alerting?", options: ["Azure Monitor", "Azure Advisor", "Azure Arc", "Azure Policy"], answer: 0, why: "Azure Monitor (with Log Analytics and Application Insights) handles metrics, logs and alerts." },
  ],

  labs: [
    {
      id: "staticsite", title: "Static website with HTTPS and a CDN", level: "Beginner", time: "2-3 hours", stack: ["S3 + CloudFront", "or Azure Storage static website + Front Door"],
      goal: "Host your portfolio (or this prep app!) on object storage behind a CDN with HTTPS and a custom domain.",
      steps: [
        "Create a budget alert (e.g. $10) and turn on MFA before anything else",
        "Create a bucket / storage account in a Canadian region and keep public access blocked",
        "Upload the site files (aws s3 sync / az storage blob upload-batch)",
        "Create a CDN distribution with the storage as origin (CloudFront origin access control, or Front Door)",
        "Add HTTPS with a certificate (ACM in us-east-1 for CloudFront, or Front Door managed certificate)",
        "Optional: point a custom domain at the CDN with DNS",
        "Write a short README with an architecture diagram and the cost per month",
        "Tear down or keep (static hosting costs pennies), and confirm the budget alert works",
      ],
      resume: "Deployed a static website on AWS S3 and CloudFront with HTTPS, private origin access and a custom domain, scripted with the AWS CLI.",
      cost: "Very low cost (pennies to a few dollars a month). Keep the bucket private and serve only through the CDN.",
      stretch: ["Define everything in Terraform", "Add a GitHub Actions workflow that syncs on every push and invalidates the CDN cache"],
    },
    {
      id: "serverlessapi", title: "Serverless REST API", level: "Intermediate", time: "4-6 hours", stack: ["API Gateway + Lambda + DynamoDB", "or Azure Functions + Cosmos DB"],
      goal: "Build a small CRUD API (e.g. job-application tracker) with serverless functions and a NoSQL table.",
      steps: [
        "Design the API: POST/GET/PUT/DELETE /applications and the table's partition key",
        "Create the table (DynamoDB on-demand / Cosmos DB serverless)",
        "Write the function in Python with input validation and proper status codes",
        "Grant the function least-privilege access to only that table (IAM role / managed identity)",
        "Expose it through API Gateway / an HTTP trigger and test with curl or Postman",
        "Add authentication (Cognito / Entra ID, or an API key at minimum) and throttling",
        "Add structured logs and an alarm on errors",
        "Write tests for the handler (your QA strength) and a README with the architecture",
      ],
      resume: "Built a serverless REST API with AWS Lambda (Python), API Gateway and DynamoDB, with least-privilege IAM, authentication, throttling, automated tests and CloudWatch alarms.",
      cost: "Usually inside free tiers at low traffic. Set a budget alert anyway.",
      stretch: ["Deploy with AWS SAM / Terraform / Bicep", "Process new records asynchronously with a queue"],
    },
    {
      id: "containercicd", title: "Containerized app with CI/CD", level: "Intermediate", time: "5-8 hours", stack: ["Docker + ECR + ECS Fargate", "or ACR + Azure Container Apps", "GitHub Actions"],
      goal: "Containerize a small web app and deploy it automatically on every push to main.",
      steps: [
        "Write a Dockerfile (slim base image, non-root user) and run it locally",
        "Create a registry (ECR / ACR) and push the image tagged with the git SHA",
        "Deploy to ECS Fargate behind a load balancer, or to Azure Container Apps with ingress",
        "Set up OIDC between GitHub and the cloud (no stored access keys)",
        "Create a GitHub Actions workflow: test, build, scan, push, deploy",
        "Add a health check endpoint and verify rolling deploys have zero downtime",
        "Document the pipeline with a diagram and screenshots",
        "Tear down the load balancer / environment when finished to stop charges",
      ],
      resume: "Containerized a Python web app and built a GitHub Actions pipeline that tests, scans and deploys to AWS ECS Fargate using OIDC (no long-lived credentials).",
      cost: "Load balancers and always-on containers cost money every hour. Tear down after demoing, or use scale-to-zero (Container Apps).",
      stretch: ["Add a staging environment with manual approval for production", "Canary deploys with automatic rollback on alarms"],
    },
    {
      id: "terraformnet", title: "Network & infrastructure as code", level: "Intermediate", time: "4-6 hours", stack: ["Terraform", "AWS VPC or Azure VNet"],
      goal: "Build a production-style network in Terraform: public and private subnets across two zones, with no SSH exposed.",
      steps: [
        "Set up a remote Terraform state backend with locking (S3 / Azure Storage)",
        "Create a VPC/VNet with public and private subnets in two availability zones",
        "Add routing: internet gateway for public subnets, NAT for private",
        "Launch a small VM in a private subnet reachable only through SSM Session Manager / Azure Bastion",
        "Use variables and outputs; run terraform fmt and validate",
        "Review terraform plan in a pull request before applying",
        "Destroy everything with terraform destroy when done",
      ],
      resume: "Provisioned a multi-AZ AWS VPC with public/private subnets, NAT and private compute using Terraform with remote locked state and plan reviews in pull requests.",
      cost: "NAT gateways bill hourly even when idle. Destroy the stack after practicing.",
      stretch: ["Turn the network into a reusable Terraform module", "Add policy checks (tflint / Checkov) in CI"],
    },
    {
      id: "observability", title: "Monitoring, alerts & cost guardrails", level: "Beginner", time: "2-4 hours", stack: ["CloudWatch + SNS + Budgets", "or Azure Monitor + Action groups + Cost Management"],
      goal: "Add production-grade visibility to one of your labs: dashboards, alerts, log queries and budget controls.",
      steps: [
        "Create a dashboard with request count, error rate and latency for your API",
        "Add an alarm on errors and p95 latency that notifies you by email",
        "Write a log query that finds the slowest requests (CloudWatch Logs Insights / KQL)",
        "Tag every resource with project, env and owner; filter costs by tag",
        "Set monthly budget alerts at 50%, 80% and 100%",
        "Write a one-page runbook: what each alert means and the first steps to take",
      ],
      resume: "Implemented monitoring for a serverless API with CloudWatch dashboards, latency/error alarms, Logs Insights queries, cost tagging and budget alerts, documented in an on-call runbook.",
      cost: "Minimal; mostly free-tier metrics and alarms.",
      stretch: ["Add distributed tracing (X-Ray / Application Insights)", "Run a small load test and watch the dashboard react"],
    },
  ],

  certs: [
    { id: "clf", code: "CLF-C02", name: "AWS Certified Cloud Practitioner", provider: "AWS", level: "Foundational", tag: "CLF", link: "https://aws.amazon.com/certification/",
      why: "Broad, non-technical-to-light-technical intro to AWS: cloud concepts, core services, security, billing. A quick first win if your target employers use AWS.", topics: ["fundamentals", "iam", "security", "compute", "storage", "databases", "operations"] },
    { id: "saa", code: "SAA-C03", name: "AWS Certified Solutions Architect - Associate", provider: "AWS", level: "Associate", tag: "SAA", link: "https://aws.amazon.com/certification/",
      why: "The most requested AWS cert in job postings. Designing resilient, secure, cost-effective architectures; pairs perfectly with system design interviews.", topics: ["iam", "compute", "containers", "serverless", "storage", "databases", "networking", "messaging", "operations"] },
    { id: "az900", code: "AZ-900", name: "Microsoft Certified: Azure Fundamentals", provider: "Azure", level: "Fundamentals", tag: "AZ-900", link: "https://learn.microsoft.com/credentials/",
      why: "Azure's entry cert: cloud concepts, core Azure services, identity, governance and cost. Good signal for banks and insurers, which lean Azure.", topics: ["fundamentals", "iam", "security", "compute", "storage", "networking", "operations"] },
    { id: "az104", code: "AZ-104", name: "Microsoft Certified: Azure Administrator Associate", provider: "Azure", level: "Associate", tag: "AZ-104", link: "https://learn.microsoft.com/credentials/",
      why: "Hands-on Azure administration: identities, governance, storage, compute, virtual networking and monitoring. Strong for platform/DevOps-leaning roles.", topics: ["iam", "compute", "containers", "storage", "networking", "devops", "operations"] },
  ],

  videos: {
    courses: [V("NhDYbskXRgc", "AWS Cloud Practitioner (CLF-C02) - Full Course", "freeCodeCamp.org"), V("c3Cn4xYfxJY", "AWS Solutions Architect Associate (SAA-C03) - Full Course", "freeCodeCamp.org"),
      V("NKEFWyqJ5XA", "Azure Fundamentals (AZ-900) - Full Course", "freeCodeCamp.org"), V("10PbGbTUSAg", "Azure Administrator (AZ-104) - Full Course", "freeCodeCamp.org")],
    fundamentals: [V("JIbIYCM48to", "Top 50+ AWS Services Explained in 10 Minutes", "Fireship")],
    containers: [V("Gjnup-PuquQ", "Docker in 100 Seconds", "Fireship"), V("PziYflu8cB8", "Kubernetes Explained in 100 Seconds", "Fireship"), V("3c-iBn73dDE", "Docker Tutorial for Beginners (Full Course)", "TechWorld with Nana"), V("X48VuDVv0do", "Kubernetes Tutorial for Beginners (Full Course)", "TechWorld with Nana")],
    devops: [V("tomUWcQ0P3k", "Terraform in 100 Seconds", "Fireship"), V("scEDHsr3APg", "DevOps CI/CD Explained in 100 Seconds", "Fireship"), V("7xngnjfIlK4", "Complete Terraform Course", "DevOps Directive")],
  },
};
