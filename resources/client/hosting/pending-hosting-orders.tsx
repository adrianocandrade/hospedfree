import {
  cancelPendingHostingOrderOptions,
  pendingHostingOrdersOptions,
} from '@app/hosting/hosting-queries';
import {HostingOrder} from '@app/hosting/hosting-types';
import {
  withCheckoutReturnPath,
  withHostingOrderReference,
} from '@common/billing/checkout/checkout-return-path';
import {FormattedPrice} from '@common/billing/formatted-price';
import {showHttpErrorToast} from '@common/http/errors/show-http-error-toast';
import {Alert} from '@shadcn/alert/alert';
import {AlertDialog} from '@shadcn/alert-dialog/alert-dialog';
import {Badge} from '@shadcn/badge/badge';
import {Button, LinkButton} from '@shadcn/button/button';
import {Skeleton} from '@shadcn/skeleton/skeleton';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {
  Clock3Icon,
  CreditCardIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  ServerIcon,
  Trash2Icon,
} from 'lucide-react';
import {useState} from 'react';

export function PendingHostingOrders() {
  const query = useQuery(pendingHostingOrdersOptions());

  if (query.isLoading) {
    return (
      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-32 rounded-card" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert.Root className="mb-5" variant="warning" fillStyle="subtleFill">
        <Clock3Icon />
        <Alert.Title>
          <Trans message="Não foi possível consultar seus pedidos pendentes" />
        </Alert.Title>
        <Alert.Description>
          <Trans message="As hospedagens ativas continuam disponíveis. Tente carregar os pedidos novamente." />
        </Alert.Description>
        <Alert.Action>
          <Button
            size="sm"
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCwIcon
              className={query.isFetching ? 'animate-spin' : undefined}
            />
            <Trans message="Tentar novamente" />
          </Button>
        </Alert.Action>
      </Alert.Root>
    );
  }

  if (!query.data?.length) return null;

  return (
    <section className="mb-6" aria-labelledby="pending-hosting-orders-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="pending-hosting-orders-title"
            className="text-base font-semibold"
          >
            <Trans message="Pedidos aguardando pagamento" />
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans message="Retome o checkout ou cancele a reserva antes do vencimento." />
          </p>
        </div>
        <Badge variant="secondary">{query.data.length}</Badge>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {query.data.map(order => (
          <PendingOrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}

function PendingOrderCard({order}: {order: HostingOrder}) {
  const canCheckout = Boolean(order.plan?.product_id && order.price?.id);

  return (
    <article className="rounded-card border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-primary/5 text-primary">
            <ServerIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{order.fqdn}</h3>
              <Badge variant="outline">
                <Clock3Icon />
                <Trans message="Aguardando pagamento" />
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.plan?.name ?? <Trans message="Hospedagem paga" />}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {order.price ? (
                <FormattedPrice
                  price={order.price}
                  className="font-medium text-foreground"
                />
              ) : null}
              {order.expires_at ? (
                <span>
                  <Trans message="Reserva expira" />{' '}
                  <FormattedRelativeTime date={order.expires_at} />
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {canCheckout ? (
            <LinkButton
              size="sm"
              to={withHostingOrderReference(
                withCheckoutReturnPath(
                  `/checkout/${order.plan!.product_id}/${order.price!.id}`,
                  '/dashboard/hosting',
                ),
                order.uuid,
              )}
            >
              <CreditCardIcon />
              <Trans message="Continuar pagamento" />
            </LinkButton>
          ) : null}
          {order.can_cancel ? <CancelPendingOrder order={order} /> : null}
        </div>
      </div>
    </article>
  );
}

function CancelPendingOrder({order}: {order: HostingOrder}) {
  const [open, setOpen] = useState(false);
  const cancelOrder = useMutation({
    ...cancelPendingHostingOrderOptions(),
    onSuccess: () => {
      setOpen(false);
      toast.success(<Trans message="Pedido cancelado e endereço liberado." />);
    },
    onError: error => showHttpErrorToast(error),
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger
        render={
          <Button
            size="sm"
            variant="outline"
            color="danger"
            aria-label="Cancelar pedido de hospedagem"
          />
        }
      >
        <Trash2Icon />
        <Trans message="Cancelar" />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Content size="sm">
          <AlertDialog.Header>
            <AlertDialog.Media>
              <Trash2Icon />
            </AlertDialog.Media>
            <AlertDialog.Title>
              <Trans message="Cancelar pedido de hospedagem?" />
            </AlertDialog.Title>
            <AlertDialog.Description>
              <Trans
                message="A reserva de :domain será liberada. Nenhuma cobrança será criada por este pedido."
                values={{domain: order.fqdn}}
              />
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={cancelOrder.isPending}>
              <Trans message="Voltar" />
            </AlertDialog.Cancel>
            <AlertDialog.Action
              color="danger"
              disabled={cancelOrder.isPending}
              onClick={() => cancelOrder.mutate(order.id)}
            >
              {cancelOrder.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <Trash2Icon />
              )}
              <Trans message="Cancelar pedido" />
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
