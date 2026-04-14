import members from '~/config/council'

interface CouncilRequest {
  memberId: string
  messages: { role: string; content: string }[]
  ip?: string
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000

function getClientIP(event: any): string {
  return event.node?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() 
    || event.node?.req?.socket?.remoteAddress 
    || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<CouncilRequest>(event)
  const ip = getClientIP(event)
  
  if (!body.memberId || !body.messages) {
    throw createError({
      statusCode: 400,
      message: 'memberId and messages are required'
    })
  }
  
  const member = members.find(m => m.id === body.memberId)
  if (!member) {
    throw createError({
      statusCode: 404,
      message: 'Council member not found'
    })
  }
  
  if (!member.availableWhenLimited && config.limitedFeatures) {
    throw createError({
      statusCode: 403,
      message: 'This council member is not available in the hosted version'
    })
  }
  
  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      message: 'Rate limit exceeded. Please try again later.'
    })
  }
  
  if (!config.openRouterApiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenRouter API key not configured'
    })
  }
  
  const apiMessages = [
    { role: 'system', content: member.systemPrompt },
    ...body.messages.slice(-10)
  ]
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': event.node?.req?.headers?.referer || '',
        'X-Title': 'Convene the Council'
      },
      body: JSON.stringify({
        model: member.model,
        messages: apiMessages
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', error)
      throw createError({
        statusCode: 502,
        message: 'Failed to get response from AI'
      })
    }
    
    const data = await response.json()
    return {
      message: data.choices[0]?.message?.content || 'No response generated'
    }
  } catch (err: any) {
    console.error('API error:', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Internal server error'
    })
  }
})
