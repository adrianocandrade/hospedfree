import {FileEntry} from '@app/gen/schemas/file-entry';
import {UploadType} from '@app/site-config';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {UploadStrategyConfig} from '@common/uploads/uploader/strategy/upload-strategy';
import {useActiveUpload} from '@common/uploads/uploader/use-active-upload';
import {Button} from '@shadcn/button/button';
import {Progress} from '@shadcn/progress/progress';
import {toast} from '@shadcn/toast/toast';
import {Trans} from '@ui/i18n/trans';
import {cn} from '@ui/utils/cn';
import {FileInputType} from '@ui/utils/files/file-input-config';
import {
  FileAudioIcon,
  MousePointer2Icon,
  UploadIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import {ChangeEvent, ReactNode, useMemo, useRef} from 'react';
import {useBiolinkEditorStore} from '@app/dashboard/biolink/biolink-editor/biolink-editor-store';

interface BiolinkFileSelectorProps {
  accept: FileInputType | string;
  className?: string;
  disabled?: boolean;
  emptyLabel: ReactNode;
  icon?: ReactNode;
  uploadType: keyof typeof UploadType;
  value?: string | null;
  onChange: (newValue: string, entry?: FileEntry) => void;
}

export function BiolinkFileSelector({
  accept,
  className,
  disabled,
  emptyLabel,
  icon,
  onChange,
  uploadType,
  value,
}: BiolinkFileSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queueFileCleanup = useBiolinkEditorStore(s => s.queueFileCleanup);
  const queueFileRollback = useBiolinkEditorStore(s => s.queueFileRollback);
  const {uploadFile, uploadStatus, deleteEntry, isDeletingEntry, percentage} =
    useActiveUpload();
  const isUploading = uploadStatus === 'inProgress';

  const uploadOptions: UploadStrategyConfig = useMemo(
    () => ({
      uploadType,
      showToastOnRestrictionFail: true,
      restrictions: restrictionsFromConfig({uploadType}),
      onSuccess: entry => {
        if (value && value !== entry.url) {
          queueFileCleanup(value);
        }
        if (value !== entry.url) {
          queueFileRollback(entry.url);
        }
        onChange(entry.url, entry);
      },
      onError: message => {
        if (message) {
          toast.error(message);
        }
      },
    }),
    [onChange, queueFileCleanup, queueFileRollback, uploadType, value],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    uploadFile(file, uploadOptions);
    event.target.value = '';
  };

  const isBusy = disabled || isUploading || isDeletingEntry;

  return (
    <div
      className={cn(
        'rounded-card-sm border bg-card p-3 text-sm',
        disabled && 'opacity-60',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={isBusy}
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-input bg-accent text-muted-foreground">
          {icon ?? <UploadIcon className="size-4" />}
        </span>
        <div className="min-w-0 flex-auto">
          <div className="truncate font-medium">
            {value ? readableFileName(value) : emptyLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            {value ? (
              <Trans message="Stored file" />
            ) : (
              <Trans message="No file selected" />
            )}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <UploadIcon data-icon="inline-start" />
          {value ? <Trans message="Replace" /> : <Trans message="Upload" />}
        </Button>
        {value ? (
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={isBusy}
            onClick={() =>
              deleteEntry({
                entryPath: value ?? undefined,
                onSuccess: () => onChange(''),
              })
            }
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      {isUploading ? (
        <Progress.Root className="mt-3" value={percentage}>
          <Progress.Track className="h-1">
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ) : null}
      {uploadStatus === 'failed' ? (
        <p className="mt-2 text-xs text-destructive">
          <Trans message="Upload failed. Choose the file again to retry." />
        </p>
      ) : null}
    </div>
  );
}

export const BiolinkFileSelectorIcons = {
  audio: <FileAudioIcon className="size-4" />,
  cursor: <MousePointer2Icon className="size-4" />,
  video: <VideoIcon className="size-4" />,
};

function readableFileName(value: string): string {
  const cleanValue = value.split('?')[0] ?? value;
  return decodeURIComponent(cleanValue.split('/').pop() || cleanValue);
}
