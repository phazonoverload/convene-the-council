# Multi-Round Conversations

## Problem

The council currently handles a single question-respond-synthesize cycle. After
the verdict, the user resets and starts over with no continuity. Users cannot
ask follow-ups or explore a decision across multiple rounds.

## Design

### Round 1

Identical to today's behavior. One question produces member responses then a
judge verdict.

### Round 2+

The user asks a new question. The server receives both the new question and the
full history of prior rounds. The history contains, for each prior round: the
question, every member's response/error, and the verdict.

- **Council members** (round 2+ only): Each member's prompt is prefixed with
  the full text of all prior judge verdicts. Members do not see other members'
  responses from prior rounds -- only the judge's synthesis.

- **Judge**: Receives all member responses from *all* rounds (current +
  historical) along with all prior verdicts. The judge synthesizes the full
  unfolding conversation.

- **History cap**: At most the last 10 rounds are sent as history to prevent
  token overflow. Older rounds are silently dropped from the context.

### Data Structures

```
ConversationRound:
  question: string
  memberResponses: { memberId, name, response, error }[]
  verdict: string
```

### Server changes (`server/api/council.ts`)

Accept optional `history: ConversationRound[]` in request body.

```
POST /api/council
{
  question: "What about X?",
  history: [
    { question: "Should I do Y?", memberResponses: [...], verdict: "..." }
  ]
}
```

When `history` is present and non-empty:

- Build a `previousVerdicts` string from `history.map(r => r.verdict).join("\n\n")`
- For each council member call, append to the user message:
  `"Previous discussion:\n\nJudge's verdicts:\n{previousVerdicts}\n\nNew question: {question}"`
- For the judge call, flatten all member responses from all rounds (history +
  current), build the standard judge context with the full response history.
- Before building the judge context, prepend the history's verdict text so the
  judge knows what it previously ruled.

### Client changes (`pages/index.vue`)

New reactive state:

```typescript
const rounds = ref<CouncilRound[]>([])
```

Where `CouncilRound` is:

```typescript
interface CouncilRound {
  id: number
  question: string
  memberResponses: Record<string, string>
  memberErrors: Record<string, string>
  verdict: string
  verdictError: string
  activeRound: boolean  // true for the round being loaded
}
```

- Submit appends a new `CouncilRound` to `rounds` with `activeRound: true`
- API call sends `{ question, history: rounds.filter(r => !r.activeRound).map(...) }`
- On API response, populate the active round with responses/verdict, set `activeRound: false`
- Reset clears all rounds

### UI: Collapsible rounds

- Each round is a collapsible section
- The most recent round is expanded by default
- Older rounds collapse into a header: *"Round 2 — {truncated question}"*
- Collapsed round shows the question and verdict excerpt; expand to see member
  cards
- "Ask another question" button appends a new round
- If the active round is loading, show loading state on the latest round only

### Files touched

| File | Changes |
|------|---------|
| `pages/index.vue` | Rewrite state management to `rounds[]`, accordion UI, history-passing submit |
| `server/api/council.ts` | Accept `history`, inject verdicts into member/judge context, cap at 10 |

No changes to `CouncilMemberCard.vue`, `JudgeVerdict.vue`, or `config/council.ts`.
