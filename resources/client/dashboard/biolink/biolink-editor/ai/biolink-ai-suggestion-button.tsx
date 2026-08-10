import {suggestBiolinkAiCopy} from '@app/gen/biolink-ai-suggestions';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Field} from '@shadcn/forms/field';
import {Select} from '@shadcn/forms/select/select';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {useMutation} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SparklesIcon} from 'lucide-react';
import {useState} from 'react';

type AiPurpose = 'bio' | 'title' | 'cta' | 'product' | 'service' | 'rewrite';
type AiTone = 'clear' | 'friendly' | 'professional' | 'direct' | 'playful';

type SuggestionResponse = {
  data: {
    suggestion: string;
    usage: {used: number; total: number | null};
  };
};

export function BiolinkAiSuggestionButton({
  biolinkId,
  purpose,
  value,
  onApply,
}: {
  biolinkId: number | string;
  purpose: AiPurpose;
  value?: string;
  onApply: (suggestion: string) => void;
}) {
  const {trans} = useTrans();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState('');
  const [tone, setTone] = useState<AiTone>('clear');
  const [result, setResult] = useState<SuggestionResponse['data'] | null>(null);
  const suggest = useMutation({
    mutationFn: () =>
      suggestBiolinkAiCopy(Number(biolinkId), {
        purpose,
        tone,
        input: [
          value?.trim() ? `Current copy:\n${value.trim()}` : '',
          direction.trim() ? `Requested direction:\n${direction.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      }).then(response => ({
        suggestion: response.data.suggestion,
        usage: {
          used: Number(response.data.usage.used),
          total:
            response.data.usage.total === null
              ? null
              : Number(response.data.usage.total),
        },
      })),
    onSuccess: setResult,
    onError: error => showHttpErrorToast(error),
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={isOpen => {
        setOpen(isOpen);
        if (!isOpen) {
          setResult(null);
          setDirection('');
        }
      }}
    >
      <Dialog.Trigger
        render={<Button type="button" variant="outline" size="xs" />}
      >
        <SparklesIcon />
        <Trans message="Suggest with AI" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Content className="sm:max-w-xl">
          <Dialog.Header>
            <Dialog.Title>
              <SparklesIcon />
              <Trans message="AI writing assistant" />
            </Dialog.Title>
            <Dialog.Description>
              <Trans message="Generate a draft in context. Nothing changes until you review and apply it." />
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body className="space-y-5">
            {!result ? (
              <>
                <Field.Root>
                  <Field.Label>
                    <Trans message="What should the suggestion improve?" />
                  </Field.Label>
                  <Textarea
                    rows={4}
                    value={direction}
                    onChange={event => setDirection(event.target.value)}
                    placeholder={trans({
                      message:
                        'Audience, offer, important facts or desired action',
                    })}
                  />
                  <Field.Description>
                    <Trans message="Only include facts the assistant may use. It is instructed not to invent claims." />
                  </Field.Description>
                </Field.Root>
                <Field.Root>
                  <Field.Label>
                    <Trans message="Tone" />
                  </Field.Label>
                  <Select.Root
                    value={tone}
                    onValueChange={value => setTone(value as AiTone)}
                    items={[
                      {value: 'clear', label: <Trans message="Clear" />},
                      {value: 'friendly', label: <Trans message="Friendly" />},
                      {
                        value: 'professional',
                        label: <Trans message="Professional" />,
                      },
                      {value: 'direct', label: <Trans message="Direct" />},
                      {value: 'playful', label: <Trans message="Playful" />},
                    ]}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="clear">
                        <Trans message="Clear" />
                      </Select.Item>
                      <Select.Item value="friendly">
                        <Trans message="Friendly" />
                      </Select.Item>
                      <Select.Item value="professional">
                        <Trans message="Professional" />
                      </Select.Item>
                      <Select.Item value="direct">
                        <Trans message="Direct" />
                      </Select.Item>
                      <Select.Item value="playful">
                        <Trans message="Playful" />
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Field.Root>
              </>
            ) : (
              <>
                <div className="rounded-card-sm border bg-muted/40 p-4">
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">
                    <Trans message="Suggested draft" />
                  </div>
                  <p className="text-sm leading-6 whitespace-pre-wrap">
                    {result.suggestion}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.usage.total === null ? (
                    <Trans
                      message=":count suggestions used this month"
                      values={{count: result.usage.used}}
                    />
                  ) : (
                    <Trans
                      message=":used of :total suggestions used this month"
                      values={{
                        used: result.usage.used,
                        total: result.usage.total,
                      }}
                    />
                  )}
                </p>
              </>
            )}
          </Dialog.Body>
          <Dialog.Footer variant="muted">
            <Dialog.CloseButton>
              <Trans message="Cancel" />
            </Dialog.CloseButton>
            {result ? (
              <Button
                type="button"
                onClick={() => {
                  onApply(result.suggestion);
                  setOpen(false);
                }}
              >
                <Trans message="Apply suggestion" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={
                  suggest.isPending || (!value?.trim() && !direction.trim())
                }
                onClick={() => suggest.mutate(undefined)}
              >
                <SparklesIcon />
                {suggest.isPending ? (
                  <Trans message="Generating..." />
                ) : (
                  <Trans message="Generate draft" />
                )}
              </Button>
            )}
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
