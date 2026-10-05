// More AI/LLM learning: five new lessons, responsible-AI frameworks (tested on AIF-C01 and
// AI-900), extra exercises, a glossary, and more interview/quiz questions. Merged into AI by
// extendTrack (ai.js). Exercise code avoids backslashes (it lives in template literals).

extendTrack(AI, {
  topics: [
    {
      id: "mlbasics", title: "Machine learning fundamentals", short: "ML",
      body: `<p>Generative AI sits on top of classic machine learning, and the AI certifications (AIF-C01, AI-900) test these basics directly. Interviewers use them to check you can reason about model quality.</p>
        <ul>
          <li><b>Supervised learning</b> learns from labelled examples: <b>classification</b> (fraud / not fraud) or <b>regression</b> (predict a price). <b>Unsupervised</b> finds structure without labels (clustering customers, anomaly detection). <b>Reinforcement learning</b> learns from rewards.</li>
          <li><b>Deep learning</b> uses neural networks with many layers; LLMs are very large deep-learning models trained mostly with self-supervised next-token prediction.</li>
          <li><b>Data splits:</b> train (fit the model), validation (tune choices), test (final, untouched estimate). Leaking test data into training gives falsely good results.</li>
          <li><b>Overfitting</b> memorizes training data and fails on new data (high variance); <b>underfitting</b> is too simple to capture the pattern (high bias).</li>
          <li><b>Metrics:</b> accuracy misleads on imbalanced data (99% of transactions are legitimate). Use <b>precision</b> (of flagged items, how many were right?), <b>recall</b> (of real positives, how many did we catch?) and <b>F1</b> (their balance). Regression uses MAE/RMSE.</li>
          <li><b>ML lifecycle:</b> define the problem, collect and prepare data, train, evaluate, deploy, then <b>monitor for drift</b> as real-world data changes.</li>
          <li>Don't use ML when simple rules work, data is scarce, or errors can't be tolerated or explained.</li></ul>`,
      exercises: [{
        prompt: "Write confusion(y_true, y_pred) for binary labels (1 = positive) returning a dict with counts 'tp', 'fp', 'fn', 'tn'.",
        starter: `def confusion(y_true, y_pred):
    pass
`,
        tests: `assert confusion([1, 0, 1, 1, 0], [1, 1, 0, 1, 0]) == {"tp": 2, "fp": 1, "fn": 1, "tn": 1}
assert confusion([], []) == {"tp": 0, "fp": 0, "fn": 0, "tn": 0}`,
      }, {
        prompt: "Write prf1(y_true, y_pred) returning (precision, recall, f1) for the positive class 1. Return 0.0 for any metric whose denominator is zero.",
        starter: `def prf1(y_true, y_pred):
    pass
`,
        tests: `p, r, f = prf1([1, 0, 1, 1, 0], [1, 1, 0, 1, 0])
assert abs(p - 2/3) < 1e-9 and abs(r - 2/3) < 1e-9 and abs(f - 2/3) < 1e-9
p, r, f = prf1([1, 1, 1, 1], [1, 0, 0, 0])
assert p == 1.0 and r == 0.25 and abs(f - 0.4) < 1e-9
assert prf1([0, 0], [0, 0]) == (0.0, 0.0, 0.0)`,
      }],
      cards: [
        ["A fraud model has 99.5% accuracy. Why might it be useless?", "If 99.5% of transactions are legitimate, predicting 'not fraud' every time scores 99.5% while catching zero fraud. Check recall and precision on the fraud class."],
        ["Precision vs recall: which matters more for fraud alerts?", "Usually recall (don't miss fraud), balanced against precision so investigators aren't flooded with false alarms. The business cost of each error type decides."],
        ["What is model drift?", "Real-world data or relationships change after deployment (new fraud patterns, new products), so performance degrades; monitor metrics and retrain."],
      ],
    },
    {
      id: "tokenization", title: "Tokenization & context management", short: "Tok",
      body: `<ul>
          <li>Models use <b>subword tokenization</b> (e.g. byte-pair encoding, BPE): frequent character sequences become single tokens, rare words split into pieces. That's why models can stumble on letter-level tasks like counting the r's in "strawberry".</li>
          <li>Token counts vary by content: code, numbers, URLs and many non-English languages use more tokens per character. Different model families tokenize differently, so <b>count with the provider's tokenizer or token-counting endpoint</b>, never by guessing.</li>
          <li><b>Context budgeting:</b> system prompt + conversation history + retrieved documents + tool results + room for the output must fit the window, and every token costs money and latency.</li>
          <li><b>Strategies for long conversations:</b> keep the most recent turns, summarize older ones, retrieve relevant past messages, or use server-side compaction features. Keep the stable prefix (system prompt, documents) unchanged so prompt caching keeps working.</li>
          <li><b>Placement matters:</b> put long documents before the question, label them clearly, and repeat key instructions near the end of very long prompts.</li></ul>`,
      code: [{ label: "Count tokens before sending (Anthropic Python SDK)", code: `import anthropic

client = anthropic.Anthropic()
count = client.messages.count_tokens(
    model="claude-opus-5-5",
    system="You are a helpful assistant.",
    messages=[{"role": "user", "content": open("long_report.txt").read() + "\\n\\nSummarize this."}],
)
print(count.input_tokens)   # decide: send as-is, trim, chunk, or summarize first` }],
      exercises: [{
        prompt: "Implement two byte-pair-encoding steps. most_frequent_pair(tokens) returns the adjacent pair that occurs most often (ties: the one seen first). merge_pair(tokens, pair) replaces each non-overlapping occurrence (left to right) with the joined string.",
        starter: `def most_frequent_pair(tokens):
    pass

def merge_pair(tokens, pair):
    pass
`,
        tests: `toks = list("aaabdaaabac")
assert most_frequent_pair(toks) == ("a", "a")
assert merge_pair(toks, ("a", "a")) == ["aa", "a", "b", "d", "aa", "a", "b", "a", "c"]
assert most_frequent_pair(list("abab")) == ("a", "b")
assert merge_pair(list("abc"), ("x", "y")) == ["a", "b", "c"]`,
      }, {
        prompt: "Write fit_history(messages, budget, count) that keeps the most recent messages whose total count(content) fits within budget, preserving order and never splitting a message. The kept history must start with a 'user' message, so drop any leading assistant messages.",
        starter: `def fit_history(messages, budget, count):
    pass
`,
        tests: `words = lambda s: len(s.split())
msgs = [{"role": "user", "content": "a b c"}, {"role": "assistant", "content": "d e"},
        {"role": "user", "content": "f g h i"}, {"role": "assistant", "content": "j"}]
assert fit_history(msgs, 100, words) == msgs
assert fit_history(msgs, 5, words) == msgs[2:]
assert fit_history(msgs, 7, words) == msgs[2:], "msgs[1:] fits but starts with assistant"
assert fit_history(msgs, 0, words) == []`,
      }],
      cards: [
        ["Why can't you estimate cost by counting words?", "Tokenizers split text into subword pieces whose count depends on the content and the model family. Use the provider's token counter."],
        ["Your chatbot hits the context limit after long sessions. Options?", "Trim old turns, summarize earlier conversation, retrieve only relevant past messages, or use server-side compaction, while keeping the system prompt stable for caching."],
        ["Why do models struggle to count letters in a word?", "They see tokens (word pieces), not individual characters, so character-level questions require reasoning about something they don't directly observe."],
      ],
    },
    {
      id: "customization", title: "Fine-tuning & model customization", short: "FT",
      body: `<p>Climb the ladder from cheapest to most expensive, and stop as soon as quality is good enough:</p>
        <ol><li><b>Prompt engineering</b> (instructions, examples)</li><li><b>RAG</b> (give the model the right facts at query time)</li><li><b>Tool use</b> (let it fetch or compute)</li><li><b>Fine-tuning</b> (change the model's behaviour with training examples)</li><li>Training from scratch (almost never for application teams)</li></ol>
        <ul>
          <li><b>Supervised fine-tuning</b> trains on input/output examples to teach a consistent style, format, tone or narrow task. It does <b>not</b> reliably add fresh or changing facts; that's RAG's job.</li>
          <li><b>Parameter-efficient fine-tuning (PEFT, e.g. LoRA)</b> trains small adapter matrices instead of all weights: far cheaper, and you can keep many adapters.</li>
          <li><b>Distillation:</b> use a large model's outputs to train a smaller, cheaper, faster model for a narrow task.</li>
          <li><b>You need:</b> hundreds to thousands of high-quality, representative examples, a held-out evaluation set, and before/after evals.</li>
          <li><b>Costs and risks:</b> training and hosting cost, overfitting, losing general skills, and retraining when the base model changes. Not every model can be fine-tuned by customers; check what your provider/cloud offers (Amazon Bedrock, SageMaker AI, Microsoft Foundry).</li></ul>`,
      exercises: [{
        prompt: "Write validate_dataset(lines) for a chat fine-tuning file (one JSON object per line). Each line needs a 'messages' list whose roles alternate user/assistant starting with 'user' and ending with 'assistant', each with non-empty string content. Return a list of (line_number, error) tuples (1-based); an empty list means valid.",
        starter: `import json

def validate_dataset(lines):
    pass
`,
        tests: `good = '{"messages": [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello!"}]}'
assert validate_dataset([good, good]) == []
bad_json = '{"messages": [}'
ends_user = '{"messages": [{"role": "user", "content": "Hi"}]}'
empty = '{"messages": [{"role": "user", "content": ""}, {"role": "assistant", "content": "x"}]}'
errs = validate_dataset([good, bad_json, ends_user, empty])
assert [n for n, _ in errs] == [2, 3, 4], errs`,
      }],
      cards: [
        ["The model doesn't know your company's latest product prices. Fine-tune it?", "No: prices change and need to be exact. Use RAG or a tool that reads the current price list; fine-tuning is for behaviour and format."],
        ["What does LoRA change?", "It freezes the base model and trains small low-rank adapter matrices, cutting compute and storage while specializing the model."],
        ["When is distillation worth it?", "When a narrow, high-volume task works well on a big model and you need lower cost or latency: train a smaller model on the big model's outputs and verify with evals."],
      ],
    },
    {
      id: "multimodal", title: "Multimodal: images, documents & audio", short: "MM",
      body: `<ul>
          <li><b>Vision-capable LLMs</b> read screenshots, charts, photos, diagrams and scanned pages, and can reason about them (compare two receipts, explain a dashboard).</li>
          <li><b>PDFs:</b> some APIs accept PDFs directly (text plus page images), useful for forms, contracts and statements.</li>
          <li><b>Specialized document AI vs LLM vision:</b> for high-volume structured extraction (invoices, IDs, cheques) dedicated services such as Amazon Textract or Azure AI Document Intelligence are cheaper and more predictable; use an LLM when you need reasoning or flexible understanding.</li>
          <li><b>Audio:</b> transcribe with speech-to-text (Amazon Transcribe / Azure AI Speech), then process the text with an LLM.</li>
          <li><b>Cost:</b> images consume tokens roughly in proportion to their resolution, so resize to what the task needs.</li>
          <li><b>Privacy:</b> documents often contain personal data (IDs, account numbers): redact, restrict retention, and follow your bank's data policies.</li></ul>`,
      code: [{ label: "Send an image and a PDF (Anthropic Python SDK)", code: `import base64
import anthropic

client = anthropic.Anthropic()
with open("dashboard.png", "rb") as f:
    image_b64 = base64.standard_b64encode(f.read()).decode("utf-8")
with open("statement.pdf", "rb") as f:
    pdf_b64 = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_b64}},
        {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_b64}},
        {"type": "text", "text": "Does the dashboard total match the statement total? Answer yes/no and explain."},
    ]}],
)
print(next(b.text for b in response.content if b.type == "text"))` }],
      exercises: [{
        prompt: "Write to_image_block(data, media_type) that returns an API image block: {'type': 'image', 'source': {'type': 'base64', 'media_type': ..., 'data': <base64 text>}}. Only image/jpeg, image/png, image/gif and image/webp are allowed; raise ValueError otherwise.",
        starter: `import base64

def to_image_block(data, media_type):
    pass
`,
        tests: `b = to_image_block(b"abc", "image/png")
assert b == {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "YWJj"}}
try:
    to_image_block(b"abc", "image/tiff"); raise SystemExit("expected ValueError")
except ValueError:
    pass`,
      }],
      cards: [
        ["Extract fields from 2 million standard invoices a month: LLM vision or a document AI service?", "A document AI service (Textract / Document Intelligence) for cost and consistency at scale, possibly with an LLM for the hard exceptions."],
        ["How do you cut the cost of image inputs?", "Resize or crop images to the resolution the task needs, and avoid sending images when extracted text would do."],
        ["How would you build a meeting-notes assistant?", "Speech-to-text transcription, then an LLM to summarize decisions and action items, with speaker consent and secure storage of recordings."],
      ],
    },
    {
      id: "cloudai", title: "AI services on AWS & Azure", short: "Cloud",
      body: `<p>Most enterprises (especially banks and insurers) consume models through their cloud provider for billing, networking, identity and data-residency controls. Know the main services and how they map. Product names change often, so check current docs.</p>
        <ul>
          <li><b>Foundation models:</b> Amazon Bedrock and Microsoft Foundry (which includes Azure OpenAI) give managed access to models from several providers, including Anthropic's Claude.</li>
          <li><b>RAG building blocks:</b> Bedrock Knowledge Bases; Azure AI Search for retrieval over your data.</li>
          <li><b>Safety:</b> Bedrock Guardrails; Azure AI Content Safety, for filtering harmful content and detecting sensitive data.</li>
          <li><b>Agents:</b> Bedrock Agents (and AgentCore); Foundry Agent Service.</li>
          <li><b>Classic ML platforms:</b> Amazon SageMaker AI; Azure Machine Learning, for training, fine-tuning and hosting your own models.</li>
          <li><b>Pre-built AI:</b> Textract / Document Intelligence (documents), Transcribe and Polly / Azure AI Speech, Rekognition / Azure AI Vision, Comprehend / Azure AI Language.</li>
          <li><b>Enterprise checks:</b> is the model offered in your required region (or via cross-region inference)? Private networking (PrivateLink / Private Endpoints), IAM or Entra authentication, quotas, logging, and data-retention terms.</li></ul>`,
      map: [["Foundation model access", "Amazon Bedrock", "Microsoft Foundry (incl. Azure OpenAI)"], ["Managed RAG / retrieval", "Bedrock Knowledge Bases", "Azure AI Search"], ["Content safety guardrails", "Bedrock Guardrails", "Azure AI Content Safety"], ["Agents", "Bedrock Agents / AgentCore", "Foundry Agent Service"], ["ML platform", "Amazon SageMaker AI", "Azure Machine Learning"], ["Document extraction", "Amazon Textract", "Azure AI Document Intelligence"], ["Speech", "Transcribe / Polly", "Azure AI Speech"]],
      code: [{ label: "Calling Claude through Amazon Bedrock or Microsoft Foundry (Anthropic Python SDK)", code: `import os
from anthropic import AnthropicBedrockMantle, AnthropicFoundry

# Amazon Bedrock: AWS credentials come from your normal AWS config / IAM role.
bedrock = AnthropicBedrockMantle(aws_region="us-east-1")    # choose a region where the model is offered
response = bedrock.messages.create(
    model="anthropic.claude-opus-5-5",                      # Bedrock model IDs carry an "anthropic." prefix
    max_tokens=1024,
    messages=[{"role": "user", "content": "Summarize our refund policy in 3 bullets."}],
)

# Microsoft Foundry: authenticate against your Foundry resource.
foundry = AnthropicFoundry(api_key=os.environ["FOUNDRY_API_KEY"], resource="my-foundry-resource")
# then foundry.messages.create(...) with the same request shape` }],
      exercises: [{
        prompt: "Write pick_region(available, preferred): given the regions where a model is offered and your preferred regions in priority order (e.g. Canadian first), return the first preferred region that's available, or None so the caller can escalate (cross-region inference needs a data-residency review).",
        starter: `def pick_region(available, preferred):
    pass
`,
        tests: `assert pick_region({"us-east-1", "ca-central-1"}, ["ca-central-1", "us-east-1"]) == "ca-central-1"
assert pick_region({"us-east-1", "us-west-2"}, ["ca-central-1", "us-east-1"]) == "us-east-1"
assert pick_region({"eu-west-1"}, ["ca-central-1"]) is None`,
      }],
      cards: [
        ["Why might a bank use Bedrock or Foundry rather than calling a model provider directly?", "Existing cloud contracts and billing, IAM/Entra integration, private networking, centralized logging, regional controls and procurement/compliance already approved for that cloud."],
        ["Bedrock Knowledge Bases vs building RAG yourself?", "Managed ingestion, chunking, embedding and retrieval for speed of delivery; building your own gives more control over chunking, hybrid search, reranking and evaluation."],
        ["What must you check before using a model for Canadian customer data?", "Regional availability and data residency, whether cross-region processing is allowed, retention and training terms, encryption, access controls and logging."],
      ],
    },
  ],

  append: {
    safety: `<h3>Responsible AI frameworks (on the certification exams)</h3>
      <div class="cols-2">
        <div><b>Microsoft's six principles</b><ul><li>Fairness</li><li>Reliability and safety</li><li>Privacy and security</li><li>Inclusiveness</li><li>Transparency</li><li>Accountability</li></ul></div>
        <div><b>AWS's responsible AI dimensions</b><ul><li>Fairness</li><li>Explainability</li><li>Privacy and security</li><li>Safety</li><li>Controllability</li><li>Veracity and robustness</li><li>Governance</li><li>Transparency</li></ul></div>
      </div>
      <p>In interviews, translate principles into practice: bias testing across groups, human oversight for high-stakes decisions, model and data documentation, audit logs, and clear user disclosure that they're talking to AI.</p>`,
  },

  cards: {
    safety: [["Name Microsoft's six responsible AI principles.", "Fairness, reliability and safety, privacy and security, inclusiveness, transparency, and accountability."]],
  },

  groups: [
    ["Foundations", ["mlbasics", "foundations", "tokenization", "apis", "prompting", "structured"]],
    ["Retrieval & inputs", ["embeddings", "vectorstores", "rag", "multimodal"]],
    ["Agents", ["tools", "agents"]],
    ["Quality & production", ["evals", "safety", "llmops", "customization", "cloudai"]],
  ],
  weeks: [
    { n: 1, title: "ML & LLM foundations", topics: ["mlbasics", "foundations", "tokenization"], labs: [], goal: "Explain ML basics and metrics, how LLMs generate text, and how tokens and context windows work." },
    { n: 2, title: "Calling models, prompting & structured output", topics: ["apis", "prompting", "structured"], labs: ["chatapp"], goal: "Build a streaming chat app and get reliable JSON back." },
    { n: 3, title: "Embeddings, vector search & multimodal", topics: ["embeddings", "vectorstores", "multimodal"], labs: [], goal: "Implement similarity search and chunking; send images and PDFs to a model." },
    { n: 4, title: "Retrieval-augmented generation", topics: ["rag"], labs: ["rag"], goal: "Ship a RAG app over your own documents with citations and retrieval metrics." },
    { n: 5, title: "Tool use & agents", topics: ["tools", "agents"], labs: ["agent"], goal: "Build a tool-using assistant with guardrails." },
    { n: 6, title: "Evals, testing & safety", topics: ["evals", "safety"], labs: ["evalharness"], goal: "Turn your QA skills into an LLM eval harness that runs in CI; know the responsible-AI frameworks." },
    { n: 7, title: "Production, customization & cloud AI", topics: ["llmops", "customization", "cloudai"], labs: ["deploy"], goal: "Deploy on AWS or Azure with caching, monitoring and cost limits; know when fine-tuning is worth it." },
    { n: 8, title: "Certification & interview sprint", topics: [], labs: [], goal: "Drill the question bank and quizzes, and polish your projects' READMEs and demos." },
  ],

  questions: [
    { id: "q25", topic: "mlbasics", q: "Explain precision and recall with a real example.", a: "For a fraud model: precision = of the transactions we flagged, how many were actually fraud; recall = of all real fraud, how many we flagged. Raising the threshold usually increases precision and lowers recall; the business cost of missed fraud vs false alarms decides the balance." },
    { id: "q26", topic: "mlbasics", q: "How do you detect and fix overfitting?", a: "Training performance is much better than validation/test performance. Fix with more or more varied data, simpler models, regularization, early stopping, or better features; always judge on held-out data." },
    { id: "q27", topic: "tokenization", q: "How would you manage context for a long-running support chat?", a: "Budget tokens per component; keep the system prompt stable (cacheable); keep recent turns verbatim; summarize or compact older turns; retrieve relevant earlier facts on demand; and store structured state (customer ID, issue) outside the prompt." },
    { id: "q28", topic: "customization", q: "Your team wants to fine-tune a model to answer HR questions. What's your advice?", a: "Start with RAG over the HR policies (facts change, need citations and permissions). Fine-tune only if evals show a persistent style/format gap that prompting can't fix, and keep RAG for the facts." },
    { id: "q29", topic: "customization", q: "What do you need before fine-tuning?", a: "A clear failing behaviour measured by an eval, hundreds to thousands of clean representative examples, a held-out test set, a baseline from prompting/RAG, and a plan for cost, hosting and retraining when the base model changes." },
    { id: "q30", topic: "multimodal", q: "Design a system that reads uploaded bank statements and answers questions about spending.", a: "Store uploads securely; extract transactions with a document AI service (or LLM for unusual layouts); validate totals; store structured transactions; answer questions with an LLM over that data (SQL or tool calls) with citations to statement lines; redact PII and restrict retention." },
    { id: "q31", topic: "cloudai", q: "Compare Amazon Bedrock and Microsoft Foundry for an enterprise.", a: "Both offer managed access to multiple model providers with cloud-native identity, networking, logging and billing, plus RAG, guardrails and agent tooling. Choose based on the company's primary cloud, model availability in required regions, compliance approvals and existing skills." },
    { id: "q32", topic: "safety", q: "How do you apply responsible AI principles to an LLM feature in a bank?", a: "Fairness testing across customer groups, human review for consequential decisions, transparency that users are interacting with AI, explanations and citations, privacy controls and data minimization, audit logging, documented model limitations, and a clear owner accountable for the system." },
  ],

  quiz: [
    { id: "x26", tags: ["AIF", "AI-900"], topic: "mlbasics", q: "Predicting a house's sale price from its features is:", options: ["Classification", "Regression", "Clustering", "Reinforcement learning"], answer: 1, why: "Regression predicts a continuous number." },
    { id: "x27", tags: ["AIF", "AI-900"], topic: "mlbasics", q: "Grouping customers by behaviour without predefined labels is:", options: ["Supervised learning", "Unsupervised learning (clustering)", "Regression", "Fine-tuning"], answer: 1, why: "Clustering finds structure in unlabelled data." },
    { id: "x28", tags: ["AIF", "MLA"], topic: "mlbasics", q: "A model scores 99% on training data and 70% on test data. This suggests:", options: ["Underfitting", "Overfitting", "Data drift", "Perfect generalization"], answer: 1, why: "A large gap between training and test performance indicates overfitting." },
    { id: "x29", tags: ["AIF", "AI-900"], topic: "mlbasics", q: "In a fraud model, recall measures:", options: ["Of flagged transactions, how many were fraud", "Of all fraud, how many were flagged", "Overall accuracy", "Model latency"], answer: 1, why: "Recall = true positives / all actual positives." },
    { id: "x30", tags: ["AIF"], topic: "mlbasics", q: "Which data split should be used only once, for the final unbiased estimate?", options: ["Training set", "Validation set", "Test set", "Augmented set"], answer: 2, why: "The test set stays untouched until the end." },
    { id: "x31", tags: [], topic: "tokenization", q: "Byte-pair encoding builds a vocabulary by:", options: ["Splitting on spaces only", "Repeatedly merging the most frequent adjacent pairs", "Hashing every word", "Using one token per character"], answer: 1, why: "BPE merges frequent pairs into new tokens iteratively." },
    { id: "x32", tags: [], topic: "tokenization", q: "The most reliable way to know a prompt's token count is:", options: ["Divide characters by 4", "Count words", "Use the provider's token-counting tool", "Count sentences"], answer: 2, why: "Tokenizers differ by model; rules of thumb are only rough." },
    { id: "x33", tags: ["AIF", "AI-102"], topic: "customization", q: "The best way to keep a model's answers current with weekly-changing policies:", options: ["Fine-tune weekly", "RAG over the policy documents", "Raise the temperature", "Train a new model"], answer: 1, why: "RAG supplies current documents at query time; fine-tuning isn't for fast-changing facts." },
    { id: "x34", tags: ["AIF", "MLA"], topic: "customization", q: "LoRA is a technique for:", options: ["Faster tokenization", "Parameter-efficient fine-tuning with small adapter matrices", "Vector search", "Image generation"], answer: 1, why: "LoRA trains low-rank adapters instead of all weights." },
    { id: "x35", tags: ["AIF"], topic: "customization", q: "Training a smaller model on a larger model's outputs is called:", options: ["Distillation", "Quantization", "Tokenization", "Retrieval"], answer: 0, why: "Distillation transfers behaviour from a large 'teacher' to a smaller 'student'." },
    { id: "x36", tags: ["AI-102", "AI-900"], topic: "multimodal", q: "Which Azure service is built for extracting fields from invoices and forms?", options: ["Azure AI Document Intelligence", "Azure Monitor", "Azure Front Door", "Azure DevOps"], answer: 0, why: "Document Intelligence specializes in form and document extraction." },
    { id: "x37", tags: ["AIF"], topic: "multimodal", q: "Which AWS service extracts text and form data from scanned documents?", options: ["Amazon Polly", "Amazon Textract", "Amazon Lex", "Amazon Kendra"], answer: 1, why: "Textract extracts printed text, forms and tables from documents." },
    { id: "x38", tags: ["AI-900"], topic: "cloudai", q: "Which Azure service provides content filtering for harmful text and images?", options: ["Azure AI Content Safety", "Azure Key Vault", "Azure Policy", "Azure Arc"], answer: 0, why: "Azure AI Content Safety detects harmful content." },
    { id: "x39", tags: ["AIF", "MLA"], topic: "cloudai", q: "Which AWS service is the platform for building, training and deploying your own ML models?", options: ["Amazon SageMaker AI", "Amazon Bedrock Guardrails", "AWS Glue", "Amazon Athena"], answer: 0, why: "SageMaker AI covers the full ML lifecycle for custom models." },
    { id: "x40", tags: ["AI-900", "AI-102"], topic: "safety", q: "Which is one of Microsoft's six responsible AI principles?", options: ["Profitability", "Inclusiveness", "Virality", "Exclusivity"], answer: 1, why: "The six are fairness, reliability and safety, privacy and security, inclusiveness, transparency and accountability." },
    { id: "x41", tags: ["AIF"], topic: "safety", q: "Which is one of AWS's responsible AI dimensions?", options: ["Controllability", "Monetization", "Gamification", "Speed"], answer: 0, why: "AWS lists fairness, explainability, privacy and security, safety, controllability, veracity and robustness, governance and transparency." },
  ],

  certs: [
    { id: "aip", code: "AIP-C01", name: "AWS Certified Generative AI Developer - Professional", provider: "AWS", level: "Professional", tag: "AIP", link: "https://aws.amazon.com/certification/certified-generative-ai-developer-professional/",
      why: "AWS's professional-level GenAI exam: building production RAG, agents, guardrails, evaluation and monitoring on Bedrock. Aimed at developers with real GenAI project experience; take it after AIF-C01 and the projects in this track.", topics: ["apis", "prompting", "vectorstores", "rag", "tools", "agents", "evals", "safety", "llmops", "cloudai"] },
  ],

  certTopics: { aif: ["mlbasics", "customization", "cloudai", "multimodal", "tokenization"], ai900: ["mlbasics", "multimodal", "cloudai"], ai102: ["multimodal", "cloudai", "customization"], mla: ["mlbasics", "customization", "cloudai"] },

  videos: {
    mlbasics: [V("aircAruvnKk", "But what is a neural network?", "3Blue1Brown"), V("Kdsp6soqA7o", "Machine Learning Fundamentals: The Confusion Matrix", "StatQuest with Josh Starmer"), V("EuBBz3bI-aA", "Machine Learning Fundamentals: Bias and Variance", "StatQuest with Josh Starmer")],
    tokenization: [V("zduSFxRajkE", "Let's build the GPT Tokenizer", "Andrej Karpathy")],
    customization: [V("6SO-8FcSkz4", "Prompt Engineering vs RAG vs Fine-tuning Explained", "Krish Naik"), V("t1caDsMzWBk", "LoRA & QLoRA Fine-tuning Explained In-Depth", "Mark Hennings")],
  },

  glossary: [
    ["Agent", "An LLM that uses tools in a loop, choosing its own next steps toward a goal."],
    ["Attention", "The transformer mechanism that lets each token weigh the relevance of other tokens in the context."],
    ["BPE (byte-pair encoding)", "A tokenization method that merges frequent character pairs into subword tokens."],
    ["Chunking", "Splitting documents into retrievable pieces, often with overlap."],
    ["Context window", "The maximum number of tokens (input plus output) a model can process at once."],
    ["Cosine similarity", "A measure of how similar two vectors' directions are, from -1 to 1."],
    ["Distillation", "Training a smaller model to imitate a larger model's outputs."],
    ["Drift", "Degradation when real-world data or patterns change after deployment."],
    ["Embedding", "A vector of numbers representing the meaning of text, images or other data."],
    ["Eval", "A repeatable test suite measuring model or prompt quality on a fixed dataset."],
    ["F1 score", "The harmonic mean of precision and recall."],
    ["Few-shot prompting", "Including worked examples in the prompt to show the desired behaviour."],
    ["Fine-tuning", "Further training a pretrained model on task-specific examples."],
    ["Foundation model", "A large model pretrained on broad data that can be adapted to many tasks."],
    ["Grounding", "Constraining answers to supplied sources so they're verifiable."],
    ["Guardrails", "Controls that filter or block unsafe inputs/outputs and constrain model actions."],
    ["Hallucination", "Fluent output that is false or unsupported by the provided information."],
    ["Hybrid search", "Combining keyword (BM25) and vector search results."],
    ["LLM-as-judge", "Using a model with a rubric to grade another model's output."],
    ["LoRA", "Low-rank adaptation: parameter-efficient fine-tuning with small adapter matrices."],
    ["MCP", "Model Context Protocol: an open standard for connecting AI apps to tools and data."],
    ["Overfitting", "A model memorizes training data and generalizes poorly to new data."],
    ["Precision / recall", "Precision: correct share of predicted positives. Recall: share of actual positives found."],
    ["Prompt caching", "Reusing the processed form of a repeated prompt prefix to cut cost and latency."],
    ["Prompt injection", "Input crafted to override an AI system's instructions, directly or via retrieved content."],
    ["RAG", "Retrieval-augmented generation: retrieve relevant documents and include them in the prompt."],
    ["Reranker", "A model that reorders retrieved candidates by relevance to the query."],
    ["Structured output", "Constraining a model's response to a schema such as JSON."],
    ["Temperature", "A sampling setting controlling randomness; lower is more deterministic."],
    ["Token", "A unit of text (often a word piece) that models read and generate."],
    ["Tool use / function calling", "The model requests a function call with arguments; your code executes it and returns the result."],
    ["Transformer", "The neural-network architecture behind modern LLMs, built around attention."],
    ["Vector database", "A store optimized for similarity search over embeddings."],
  ],
});
