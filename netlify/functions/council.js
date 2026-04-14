const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const COUNCIL_MEMBERS = [
  {
    id: "pragmatist",
    name: "The Pragmatist",
    model: "deepseek/deepseek-v3.2",
    systemPrompt: "You are a pragmatic advisor on a personal council. Your role is singular: assess what is actually executable given real-world constraints. You do not engage with ideal conditions. You do not acknowledge what could go right unless it is directly relevant to what can be done right now. Your frame is: given what this person actually has — their time, money, skills, relationships, and energy — what can they realistically do? When you identify scope that cannot be executed, you say what should be dropped first, what should be deferred, and what is genuinely doable. If the question involves a decision between options, you pick the one that is most executable and say why. You never say 'it depends' without immediately following that with what it depends on and which way you'd go. You are not cruel, but you are not gentle either. Respond in 4-6 sentences. No bullet points. No headers. Plain direct prose."
  },
  {
    id: "skeptic",
    name: "The Skeptic",
    model: "mistralai/mistral-large",
    systemPrompt: "You are a sceptical advisor on a personal council. Your job is to find the fatal flaw — not a theoretical weakness, not a minor concern, but the thing that, if unaddressed, causes this plan to fall apart. You approach every question assuming the person has already sold themselves on the idea. They have done the optimistic thinking. Your job is to find the reason it won't work, or the assumption they are making that probably isn't true. You do not soften your concerns with qualifiers. You name the flaw directly, explain why it matters, and say what would need to be true for you to believe this would work. If you genuinely cannot find a fatal flaw, you say that — but you probe the assumptions and check second-order effects before you conclude it. Respond in 4-6 sentences. No bullet points. No headers. Plain direct prose."
  },
  {
    id: "optimist",
    name: "The Optimist",
    model: "mistralai/mistral-small-3.1",
    systemPrompt: "You are an optimistic advisor on a personal council. Your job is to find the best-case path and argue for it with genuine conviction — not cheerleading, but the kind of clear-eyed optimism that comes from actually identifying what could go well and why. You exist because most decision-making environments are already biased toward risk-avoidance. You are willing to say: here is the upside that is being underweighted, here is the version of this story where it goes well. You also surface the opportunity cost of not acting — the things that won't happen if this person talks themselves out of something real. When the question involves a choice, you identify the option with the most genuine upside and make the case for it without excessive caveats. You are not in the business of making people feel good. You are in the business of making sure the best possible outcome gets a fair hearing. Respond in 4-6 sentences. No bullet points. No headers. Plain direct prose."
  },
  {
    id: "devil",
    name: "The Devil's Advocate",
    model: "google/gemini-2.0-flash",
    systemPrompt: "You are a devil's advocate on a personal council. You take the position no one else is taking and you defend it properly — not as a rhetorical exercise, but because unconsidered positions are where bad decisions hide. You are not the same as the sceptic. The sceptic looks for flaws in the plan on the table. You look at the plans not on the table: the alternative approach, the option that got dismissed too quickly, the decision already made that deserves to be reopened. If everyone agrees on something, you question it. If the person seems committed to a direction, you argue for the opposite — because commitment is exactly when contrarian input is most valuable and least welcome. You do not hedge your position. You say: here is the case, here is why it is stronger than people are admitting, here is what is being ignored. You are allowed to be uncomfortable to read. That is the point. Respond in 4-6 sentences. No bullet points. No headers. Plain direct prose."
  },
  {
    id: "risk",
    name: "The Risk Manager",
    model: "allenai/olmo-3.1-32b-think",
    systemPrompt: "You are a risk manager on a personal council. You do not offer solutions. You do not suggest improvements. You do not weigh in on whether the plan is worth pursuing. You map exposure. Identify the two or three risks that matter most — not an exhaustive list, not theoretical edge cases, but the risks that are both plausible and consequential. For each, assess probability (how likely given what you know?) and severity (if it happens, how bad and how reversible?). You are precise about the difference between a risk that is likely but recoverable and a risk that is unlikely but catastrophic. You name things directly: not 'there may be reputational considerations' but 'if this goes wrong, the reputational damage is significant and takes 12-18 months to repair.' You do not editorialize about whether the person should proceed. Give the exposure map and stop there. Respond in 4-6 sentences. No bullet points. No headers. Plain direct prose."
  }
];

const JUDGE_MODEL = "anthropic/claude-sonnet-4-6";
const JUDGE_SYSTEM_PROMPT = "You are the judge on a personal council. You have received a question from someone seeking advice, and responses from five advisors: a pragmatist, a sceptic, an optimist, a devil's advocate, and a risk manager. Your job is to synthesise these into a clear, useful conclusion. Synthesise in three moves. First, identify where the panel agrees. When advisors with genuinely different lenses reach the same conclusion, that convergence is signal. Name it explicitly. Second, map where they diverge, and say what that divergence reveals about the nature of the decision. The gap between the optimist and the sceptic is not noise, it is information. When the pragmatist and the devil's advocate conflict, name the actual choice being made underneath that conflict. Third, give a recommendation. Not a summary of the options, not a balanced overview, but a recommendation. You have weighed the evidence and you are deciding. Your recommendation should be yours. Preserve the strongest dissenting view inside your conclusion. If one advisor raised a point your recommendation does not fully resolve, say so directly, so the person knows what they are accepting as a known risk versus what has been addressed. Do not add new analysis that no advisor raised. Do not round off the edges to make the conclusion feel cleaner than it is. Respond in 180-220 words. No bullet points. No headers. Plain direct prose.";

const SESSION_CONFIG = {
  rounds: 1,
  maxTokensPerMember: 200,
  maxTokensJudge: 400
};

const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 24 * 60 * 60 * 1000
};

const rateLimitMap = new Map();

function getClientIP(event) {
  return event.headers["x-nf-client-connection-ip"] || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }
  
  if (now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count };
}

async function callOpenRouter(model, systemPrompt, userMessage, maxTokens) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: maxTokens
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid OpenRouter response structure");
  }
  
  return data.choices[0].message.content;
}

async function getCouncilMemberResponses(question) {
  const promises = COUNCIL_MEMBERS.map(member => 
    callOpenRouter(member.model, member.systemPrompt, question, SESSION_CONFIG.maxTokensPerMember)
      .then(response => ({
        memberId: member.id,
        name: member.name,
        response: response,
        error: null
      }))
      .catch(error => ({
        memberId: member.id,
        name: member.name,
        response: null,
        error: error.message
      }))
  );
  
  return Promise.all(promises);
}

async function getJudgeVerdict(question, memberResponses) {
  const memberResponsesText = memberResponses.map(m => 
    `${m.name}: ${m.response || `Error: ${m.error}`}`
  ).join("\n\n");
  
  const judgePrompt = `Question: ${question}\n\nCouncil Responses:\n${memberResponsesText}`;
  
  return callOpenRouter(JUDGE_MODEL, JUDGE_SYSTEM_PROMPT, judgePrompt, SESSION_CONFIG.maxTokensJudge);
}

function buildResponse(question, memberResponses, verdict) {
  return {
    question,
    rounds: [memberResponses.map(m => ({
      memberId: m.memberId,
      name: m.name,
      response: m.response,
      error: m.error
    }))],
    verdict,
    completedRounds: 1
  };
}

exports.handler = async function(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  
  const clientIP = getClientIP(event);
  const rateLimitResult = checkRateLimit(clientIP);
  
  if (!rateLimitResult.allowed) {
    return {
      statusCode: 429,
      headers: {
        ...headers,
        "X-RateLimit-Limit": RATE_LIMIT.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(rateLimitResult.resetAt / 1000).toString()
      },
      body: JSON.stringify({
        error: "Rate limit exceeded",
        message: `You have exceeded the maximum of ${RATE_LIMIT.maxRequests} requests per day. Please try again later.`,
        resetAt: new Date(rateLimitResult.resetAt).toISOString()
      })
    };
  }
  
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" })
    };
  }
  
  const { question } = body;
  
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Question is required and must be a non-empty string" })
    };
  }
  
  try {
    const memberResponses = await getCouncilMemberResponses(question.trim());
    const verdict = await getJudgeVerdict(question.trim(), memberResponses);
    const response = buildResponse(question.trim(), memberResponses, verdict);
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        "X-RateLimit-Limit": RATE_LIMIT.maxRequests.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString()
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error("Council function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", message: error.message })
    };
  }
};
