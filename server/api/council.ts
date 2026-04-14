import { COUNCIL_MEMBERS, LOCKED_MEMBERS, JUDGE_CONFIG } from '~/config/council'

const ALL_MEMBERS = [...COUNCIL_MEMBERS, ...LOCKED_MEMBERS]

interface CouncilRequest {
  question: string
  memberIds?: string[]
  judgeOnly?: boolean
}

interface MemberResponse {
  memberId: string
  name: string
  response: string | null
  error: string | null
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function getClientIP(event: any): string {
  return event.node?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || event.node?.req?.headers?.['x-nf-client-connection-ip']
    || event.node?.req?.socket?.remoteAddress
    || 'unknown'
}

function checkRateLimit(ip: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

async function callOpenRouter(model: string, systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> {
  const config = useRuntimeConfig()
  const apiKey = config.openRouterApiKey

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      // Explicitly disable chain-of-thought reasoning for all models.
      // Prevents thinking tokens from consuming the token budget and stops
      // models from returning content: null with reasoning: "..." instead.
      reasoning: { exclude: true },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // Log full shape in dev so failures are easy to diagnose
  if (process.env.NODE_ENV !== 'production' && !data.choices?.[0]?.message?.content) {
    console.warn(`[council] Unexpected response from ${model}:`, JSON.stringify(data).slice(0, 500))
  }

  // OpenRouter sometimes returns a 200 with an error payload instead of choices
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`)
  }

  const rawContent   = data.choices?.[0]?.message?.content
  const rawReasoning = data.choices?.[0]?.message?.reasoning

  // Some models return content as an array of typed parts (multimodal/vision)
  let content: string
  if (typeof rawContent === 'string' && rawContent.trim()) {
    content = rawContent
  } else if (Array.isArray(rawContent)) {
    content = rawContent
      .filter((part: any) => part?.type === 'text')
      .map((part: any) => part.text ?? '')
      .join('')
  } else if (typeof rawReasoning === 'string' && rawReasoning.trim()) {
    // Thinking/reasoning models (e.g. MiMo, MiniMax M2.7) write to `reasoning`
    // and only produce `content` once thinking is complete. If max_tokens is too
    // low they exhaust the budget mid-think. Use the reasoning as a fallback so
    // the card shows something rather than an error.
    content = rawReasoning.trim()
  } else {
    throw new Error('Unexpected response shape from OpenRouter')
  }

  if (!content.trim()) {
    throw new Error('Model returned an empty response')
  }

  return content
}

async function getCouncilResponses(question: string, maxTokensPerMember: number, memberIds?: string[], limited?: boolean): Promise<MemberResponse[]> {
  const pool = limited ? COUNCIL_MEMBERS : ALL_MEMBERS
  const members = memberIds
    ? pool.filter(m => memberIds!.includes(m.id))
    : pool

  const promises = members.map(member =>
    callOpenRouter(member.model, member.systemPrompt, question, maxTokensPerMember)
      .then(response => ({
        memberId: member.id,
        name: member.name,
        response,
        error: null,
      }))
      .catch(error => ({
        memberId: member.id,
        name: member.name,
        response: null,
        error: error.message,
      }))
  )

  return Promise.all(promises)
}

async function getJudgeVerdict(question: string, memberResponses: MemberResponse[], maxTokensJudge: number): Promise<string> {
  const responsesText = memberResponses
    .map(m => `${m.name}: ${m.response || `Error: ${m.error}`}`)
    .join('\n\n')

  const judgePrompt = `Question: ${question}\n\nCouncil Responses:\n${responsesText}`

  return callOpenRouter(JUDGE_CONFIG.model, JUDGE_CONFIG.systemPrompt, judgePrompt, maxTokensJudge)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rateLimit = config.rateLimit as number
  const rateLimitWindowMs = config.rateLimitWindowMs as number
  const maxTokensPerMember = config.maxTokensPerMember as number
  const maxTokensJudge = config.maxTokensJudge as number

  const ip = getClientIP(event)
  const rateLimitResult = checkRateLimit(ip, rateLimit, rateLimitWindowMs)

  if (!rateLimitResult.allowed) {
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Maximum ${rateLimit} requests per window.`,
    })
  }

  const body = await readBody<CouncilRequest>(event)

  if (!body.question?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Question is required',
    })
  }

  const question = body.question.trim()

  if (body.judgeOnly) {
    try {
      const previousResponses = (body as any).previousResponses as MemberResponse[] | undefined
      if (!previousResponses?.length) {
        throw createError({ statusCode: 400, message: 'previousResponses required for judgeOnly' })
      }
      const verdict = await getJudgeVerdict(question, previousResponses, maxTokensJudge)
      return { verdict, remaining: rateLimitResult.remaining }
    } catch (err: any) {
      if (err.statusCode) throw err
      throw createError({ statusCode: 500, message: err.message || 'Failed to get verdict' })
    }
  }

  try {
    const limited = config.public.limitedFeatures as boolean
    const memberResponses = await getCouncilResponses(question, maxTokensPerMember, body.memberIds, limited)
    const verdict = await getJudgeVerdict(question, memberResponses, maxTokensJudge)

    return {
      question,
      rounds: [memberResponses.map(m => ({
        memberId: m.memberId,
        name: m.name,
        response: m.response,
        error: m.error,
      }))],
      verdict,
      remaining: rateLimitResult.remaining,
    }
  } catch (err: any) {
    console.error('Council API error:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Internal server error',
    })
  }
})