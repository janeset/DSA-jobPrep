// Roles: prep driven by real job postings for three role families. This file holds the parts that
// grow as postings are added: the role definitions, the shared skill catalog and the postings.
// Lessons, questions, quiz and projects live in roles-learn.js; the pages in roleview.js.
//
// Adding a posting: append to POSTINGS below with its role, then list the skill ids it asks for
// under `required` (must-haves and core duties) and `preferred` (nice-to-haves). Add a new skill
// to SKILLS only when no existing one fits, and a new lesson only for real gaps.
// A skill's `learn` entries are [trackId, topicId] pairs: "ai" / "cloud" tracks or "roles" lessons.

const ROLE_DEFS = [
  {
    id: "ai", name: "AI Engineer", short: "AI",
    tagline: "Build production AI systems: RAG, agents, evals and model integration inside real products",
    baseline: ["llm-apis", "prompting-context", "structured", "rag", "agents", "evals", "ai-safety", "llmops", "cloud-ai", "finetune", "backend", "testing", "ai-coding"],
  },
  {
    id: "cloud", name: "Cloud Engineer", short: "Cloud",
    tagline: "Run secure, observable, automated infrastructure on Azure and AWS",
    baseline: ["cloud-fundamentals", "identity", "secrets", "networking", "containers", "kubernetes", "serverless", "iac", "cicd", "observability", "architecture", "governance"],
  },
  {
    id: "aicloud", name: "AI Cloud Engineer", short: "AI Cloud",
    tagline: "Platform and infrastructure for AI: model serving, GPUs, gateways and secure cloud AI services",
    baseline: ["cloud-ai", "llm-apis", "rag", "selfhost", "model-gateway", "gpu", "kubernetes", "iac", "cicd", "observability", "identity", "secrets", "llmops", "evals"],
  },
];

const SKILL_AREAS = ["AI systems", "Data & integration", "Cloud & platform", "Engineering practice"];

const SKILLS = [
  // AI systems
  { id: "llm-apis", area: "AI systems", name: "LLM APIs & model integration", learn: [["ai", "apis"], ["ai", "foundations"]] },
  { id: "prompting-context", area: "AI systems", name: "Prompt & context engineering", learn: [["ai", "prompting"], ["ai", "tokenization"]] },
  { id: "structured", area: "AI systems", name: "Structured outputs & validation", learn: [["ai", "structured"]] },
  { id: "rag", area: "AI systems", name: "RAG, embeddings & vector search", learn: [["ai", "embeddings"], ["ai", "vectorstores"], ["ai", "rag"]] },
  { id: "hybrid-rerank", area: "AI systems", name: "Hybrid retrieval & reranking", learn: [["roles", "permrag"], ["ai", "vectorstores"]] },
  { id: "perm-rag", area: "AI systems", name: "Permission-aware retrieval & enterprise search", learn: [["roles", "permrag"]] },
  { id: "agents", area: "AI systems", name: "Tool use & agent workflows", learn: [["ai", "tools"], ["ai", "agents"]] },
  { id: "agent-prod", area: "AI systems", name: "Production agents: memory, human review, failure handling", learn: [["roles", "entagents"]] },
  { id: "evals", area: "AI systems", name: "AI evaluation (automated & human)", learn: [["ai", "evals"]] },
  { id: "ai-safety", area: "AI systems", name: "AI security, guardrails & prompt-injection defence", learn: [["ai", "safety"], ["roles", "entagents"]] },
  { id: "selfhost", area: "AI systems", name: "Local / self-hosted model serving", learn: [["roles", "selfhost"]] },
  { id: "model-gateway", area: "AI systems", name: "Model gateways, routing & capacity testing", learn: [["roles", "selfhost"], ["ai", "llmops"]] },
  { id: "llmops", area: "AI systems", name: "LLMOps: cost, latency & caching", learn: [["ai", "llmops"]] },
  { id: "finetune", area: "AI systems", name: "Fine-tuning & model customization", learn: [["ai", "customization"]] },
  { id: "cloud-ai", area: "AI systems", name: "Managed cloud AI (Azure OpenAI / Foundry, Bedrock)", learn: [["ai", "cloudai"], ["roles", "gpucloud"]] },
  // Data & integration
  { id: "sql", area: "Data & integration", name: "SQL, schema design & safe migrations", learn: [["roles", "pgvector"], ["cloud", "databases"]] },
  { id: "pgvector", area: "Data & integration", name: "PostgreSQL + pgvector", learn: [["roles", "pgvector"]] },
  { id: "integration", area: "Data & integration", name: "REST, SOAP, GraphQL & event integration", learn: [["roles", "integration"], ["cloud", "messaging"]] },
  { id: "data-pipelines", area: "Data & integration", name: "Data pipelines, sync & indexing", learn: [["roles", "integration"], ["cloud", "data"]] },
  { id: "mfg", area: "Data & integration", name: "Manufacturing systems: CAD/PDM, PLM, ERP, MES", learn: [["roles", "mfgdata"]] },
  { id: "openusd", area: "Data & integration", name: "OpenUSD, Omniverse & digital twins", learn: [["roles", "mfgdata"]] },
  // Cloud & platform
  { id: "cloud-fundamentals", area: "Cloud & platform", name: "Cloud fundamentals (Azure & AWS)", learn: [["cloud", "fundamentals"]] },
  { id: "identity", area: "Cloud & platform", name: "Identity, auth & access control (Entra ID, OAuth)", learn: [["cloud", "iam"]] },
  { id: "secrets", area: "Cloud & platform", name: "Secrets & key management", learn: [["cloud", "security"]] },
  { id: "networking", area: "Cloud & platform", name: "Networking: VNet / VPC, DNS, private endpoints", learn: [["cloud", "networking"]] },
  { id: "containers", area: "Cloud & platform", name: "Containers & registries", learn: [["cloud", "containers"]] },
  { id: "kubernetes", area: "Cloud & platform", name: "Kubernetes", learn: [["cloud", "kubernetes"]] },
  { id: "openshift", area: "Cloud & platform", name: "Azure Red Hat OpenShift", learn: [["roles", "openshift"]] },
  { id: "serverless", area: "Cloud & platform", name: "Serverless & managed app platforms", learn: [["cloud", "serverless"]] },
  { id: "iac", area: "Cloud & platform", name: "Infrastructure as code (Terraform / Bicep)", learn: [["cloud", "devops"]] },
  { id: "cicd", area: "Cloud & platform", name: "CI/CD (Azure DevOps / GitHub Actions)", learn: [["roles", "azdevops"], ["cloud", "devops"]] },
  { id: "observability", area: "Cloud & platform", name: "Observability: logs, metrics, traces, alerts", learn: [["roles", "aiobs"], ["cloud", "operations"]] },
  { id: "gpu", area: "Cloud & platform", name: "GPU workloads & AI capacity planning", learn: [["roles", "gpucloud"], ["roles", "selfhost"]] },
  { id: "architecture", area: "Cloud & platform", name: "Architecture, reliability & disaster recovery", learn: [["cloud", "architecture"]] },
  { id: "governance", area: "Cloud & platform", name: "Governance, cost & landing zones", learn: [["cloud", "governance"], ["cloud", "operations"]] },
  // Engineering practice
  { id: "ai-frontend", area: "Engineering practice", name: "React + TypeScript frontends for AI", learn: [["roles", "aifrontend"]] },
  { id: "backend", area: "Engineering practice", name: "Backend APIs: Python + .NET/C# or Node.js", learn: [["roles", "aifrontend"], ["roles", "integration"]] },
  { id: "testing", area: "Engineering practice", name: "Automated testing: unit, integration, load, AI evals", learn: [["roles", "azdevops"], ["ai", "evals"]] },
  { id: "ai-coding", area: "Engineering practice", name: "AI coding assistants in daily work", learn: [["roles", "aicoding"]] },
  { id: "collaboration", area: "Engineering practice", name: "Design reviews, docs & evidence-based decisions", learn: [["roles", "behavioral"]] },
];

const POSTINGS = [
  {
    id: "eclipse-ai-swe", role: "ai", tier: 3,
    company: "Eclipse Automation", title: "AI Software Engineer",
    location: "Cambridge, ON", mode: "On-site", pay: "$130,000 - $155,000", seniority: "5+ years",
    added: "2026-10-06", link: "https://jobs.dayforcehcm.com/en-CA/eclipse/CANDIDATEPORTAL",
    summary: "Custom automated-manufacturing builder running a multi-year digital transformation. About 70-80% of the role is AI systems (agents, retrieval, evaluation, model integration); the rest is full-stack, APIs, data pipelines and enterprise integration. Works from the Principal AI Architect's direction and owns implementation and delivery.",
    required: ["llm-apis", "rag", "agents", "agent-prod", "structured", "prompting-context", "evals", "ai-frontend", "backend", "identity", "sql", "integration", "data-pipelines", "testing", "cicd", "containers", "observability", "ai-coding", "collaboration"],
    preferred: ["selfhost", "model-gateway", "gpu", "pgvector", "hybrid-rerank", "perm-rag", "openshift", "kubernetes", "secrets", "iac", "mfg", "openusd", "ai-safety", "cloud-ai"],
    prep: [
      "Lead with a production AI story: what you built, how you evaluated it, and what changed when real users hit it.",
      "Be ready to sketch an engineering knowledge assistant: permission-aware RAG over PDM/PLM documents, plus agent actions behind human approval.",
      "Know the manufacturing vocabulary (BOM, ECO, revisions, PLM vs ERP vs MES) well enough to ask good questions about their data.",
      "Prepare evidence-driven stories: a prototype or benchmark that changed a decision, and a time testing disproved your assumption.",
      "Show how you use Claude Code / Codex / Cursor day to day with review, tests and security still in place.",
      "Hiring note from the posting: every application is reviewed by a person, not AI. Write the resume and cover letter for a human reader and map them to the posting's own wording.",
    ],
  },
];
