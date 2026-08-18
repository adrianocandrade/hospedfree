import type {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {ArrowLeftIcon, ArrowRightIcon, SearchIcon} from 'lucide-react';
import {useEffect, useState} from 'react';
import type {FormEvent, ReactNode} from 'react';

export function PublicEditorialSearch({
  value,
  onSearch,
  placeholder,
}: {
  value: string;
  onSearch: (value: string) => void;
  placeholder: MessageDescriptor;
}) {
  const {trans} = useTrans();
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(draft.trim());
  };

  return (
    <form className="hf-editorial-search" onSubmit={submit} role="search">
      <SearchIcon aria-hidden="true" />
      <input
        value={draft}
        onChange={event => setDraft(event.target.value)}
        placeholder={trans(placeholder)}
        aria-label={trans(placeholder)}
      />
      <button type="submit">
        <Trans message="Pesquisar" />
      </button>
    </form>
  );
}

export function PublicEditorialPagination({
  currentPage,
  hasPrevious,
  hasNext,
  onPageChange,
  disabled,
}: {
  currentPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const {trans} = useTrans();

  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <nav
      className="hf-editorial-pagination"
      aria-label={trans({message: 'Paginação'})}
    >
      <span>
        <Trans message="Página :page" values={{page: currentPage}} />
      </span>
      <div>
        <button
          type="button"
          className="hf-editorial-page-button"
          disabled={disabled || !hasPrevious}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          <Trans message="Anterior" />
        </button>
        <button
          type="button"
          className="hf-editorial-page-button"
          disabled={disabled || !hasNext}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <Trans message="Próxima" />
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export function PublicEditorialEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <section className="hf-editorial-empty">
      {icon}
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
