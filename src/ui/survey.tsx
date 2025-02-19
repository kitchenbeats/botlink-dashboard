import { Survey, SurveyQuestion as PostHogSurveyQuestion } from 'posthog-js'
import { useState, useMemo } from 'react'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cardVariants,
} from '@/ui/primitives/card'
import { Button } from '@/ui/primitives/button'
import { Textarea } from '@/ui/primitives/textarea'
import { Loader } from '@/ui/loader'
import {
  PiSmileyXEyesFill,
  PiSmileyMehFill,
  PiSmileyBlankFill,
  PiSmileyFill,
  PiSmileyMeltingFill,
} from 'react-icons/pi'
import { cn } from '@/lib/utils'

const EMOJI_SIZE = '32px'

const EMOJIS_3 = [
  <PiSmileyXEyesFill size={EMOJI_SIZE} key="emoji-icon-0" />,
  <PiSmileyMehFill size={EMOJI_SIZE} key="emoji-icon-1" />,
  <PiSmileyMeltingFill size={EMOJI_SIZE} key="emoji-icon-2" />,
]

const EMOJIS_5 = [
  <PiSmileyXEyesFill size={EMOJI_SIZE} key="emoji-icon-0" />,
  <PiSmileyBlankFill size={EMOJI_SIZE} key="emoji-icon-1" />,
  <PiSmileyMehFill size={EMOJI_SIZE} key="emoji-icon-2" />,
  <PiSmileyFill size={EMOJI_SIZE} key="emoji-icon-3" />,
  <PiSmileyMeltingFill size={EMOJI_SIZE} key="emoji-icon-4" />,
]

interface SurveyContentProps {
  survey: Survey | null
  isLoading: boolean
  onSubmit: (responses: Record<number, string>) => void
}

export function SurveyContent({
  survey,
  isLoading,
  onSubmit,
}: SurveyContentProps) {
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const currentQuestion = useMemo(() => {
    if (!survey) return null
    return survey.questions[currentQuestionIndex]
  }, [survey, currentQuestionIndex])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(responses)
    // Reset state
    setResponses({})
    setCurrentQuestionIndex(0)
  }

  const renderQuestion = (question: PostHogSurveyQuestion) => {
    const index = question.originalQuestionIndex

    switch (question.type) {
      case 'rating':
        return (
          <div className="flex justify-center gap-3">
            {question.display === 'emoji'
              ? // Emoji ratings
                (question.scale === 3 ? EMOJIS_3 : EMOJIS_5).map(
                  (emoji, emojiIndex) => (
                    <Button
                      key={emojiIndex}
                      type="button"
                      variant={'ghost'}
                      size="iconLg"
                      className={cn('text-fg-500 size-12', {
                        'bg-bg-300 border-border-200 text-fg rounded-xl border':
                          responses[index] === String(emojiIndex + 1),
                      })}
                      onClick={() =>
                        setResponses((prev) => ({
                          ...prev,
                          [index]: String(emojiIndex + 1),
                        }))
                      }
                    >
                      {emoji}
                    </Button>
                  )
                )
              : // Numeric ratings
                Array.from({ length: question.scale }, (_, i) => i + 1).map(
                  (num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={
                        responses[index] === String(num) ? 'default' : 'outline'
                      }
                      size="iconLg"
                      onClick={() =>
                        setResponses((prev) => ({
                          ...prev,
                          [index]: String(num),
                        }))
                      }
                    >
                      {num}
                    </Button>
                  )
                )}
          </div>
        )

      case 'open':
        return (
          <Textarea
            placeholder={survey?.appearance?.placeholder}
            value={responses[index] || ''}
            onChange={(e) =>
              setResponses((prev) => ({
                ...prev,
                [index]: e.target.value,
              }))
            }
          />
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!survey) {
    return (
      <p className="text-fg-500 text-center">No active surveys available</p>
    )
  }

  return (
    <div>
      <CardHeader>
        <CardTitle className="font-sans text-xl normal-case">
          {currentQuestion?.question}
        </CardTitle>
        <CardDescription className="text-md">
          {currentQuestion?.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {currentQuestion && renderQuestion(currentQuestion)}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Back
            </Button>
            {currentQuestionIndex === survey.questions.length - 1 ? (
              <Button type="submit">{currentQuestion?.buttonText}</Button>
            ) : (
              <Button
                type="button"
                disabled={responses[currentQuestionIndex] === undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentQuestionIndex((i) =>
                    Math.min(survey.questions.length - 1, i + 1)
                  )
                }}
              >
                {currentQuestion?.buttonText}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </div>
  )
}
