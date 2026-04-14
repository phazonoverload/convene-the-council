import { COUNCIL_MEMBERS, JUDGE_CONFIG, SESSION_CONFIG } from '~/config/council'

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
const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000

function getClientIP(event: any): string {
  return event.node?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || event.node?.req?.headers?.['x-nf-client-connection-ip']
    || event.node?.req?.socket?.remoteAddress
    || 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
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
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid OpenRouter response structure')
  }

  return data.choices[0].message.content
}

async function getCouncilResponses(question: string, memberIds?: string[]): Promise<MemberResponse[]> {
  const members = memberIds
    ? COUNCIL_MEMBERS.filter(m => memberIds!.includes(m.id))
    : COUNCIL_MEMBERS

  const promises = members.map(member =>
    callOpenRouter(member.model, member.systemPrompt, question, SESSION_CONFIG.maxTokensPerMember)
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

async function getJudgeVerdict(question: string, memberResponses: MemberResponse[]): Promise<string> {
  const responsesText = memberResponses
    .map(m => `${m.name}: ${m.response || `Error: ${m.error}`}`)
    .join('\n\n')

  const judgePrompt = `Question: ${question}\n\nCouncil Responses:\n${responsesText}`

  return callOpenRouter(JUDGE_CONFIG.model, JUDGE_CONFIG.systemPrompt, judgePrompt, JUDGE_CONFIG.maxTokens)
}

export default defineEventHandler(async (event) => {
  const ip = getClientIP(event)
  const rateLimitResult = checkRateLimit(ip)

  if (!rateLimitResult.allowed) {
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Maximum ${RATE_LIMIT} requests per day.`,
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
      const verdict = await getJudgeVerdict(question, previousResponses)
      return { verdict, remaining: rateLimitResult.remaining }
    } catch (err: any) {
      if (err.statusCode) throw err
      throw createError({ statusCode: 500, message: err.message || 'Failed to get verdict' })
    }
  }

  try {
    const memberResponses = await getCouncilResponses(question, body.memberIds)
    const verdict = await getJudgeVerdict(question, memberResponses)

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