import { ExternalLink, RotateCw, Unplug } from 'lucide-react';

import type {
  ConnectionStatus,
  ConnectorConfig,
} from '@/lib/onboarding/connectors';
import { Button } from '@/components/ui/button';

const BTN =
  'h-7 w-full gap-2 rounded border border-gray-300 bg-white py-0 text-label-sm font-medium text-gray-700 shadow-xs hover:bg-white/90 cursor-pointer';

/**
 * Dark integration card for a financial data source (194px on desktop). Its
 * action reflects the connection status: connect / connecting / connected
 * (disconnect) / error (reconnect). Connect + reconnect both call `onConnect`.
 */
export function ConnectCard({
  connector,
  status,
  onConnect,
  onDisconnect,
}: {
  connector: ConnectorConfig;
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { icon: Icon, name, tag, cardDescription } = connector;

  return (
    <div className='flex w-full flex-col gap-2'>
      <div className='flex flex-1 flex-col gap-4 rounded-lg bg-primary p-3 text-primary-foreground'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <span className='flex size-6 shrink-0 items-center justify-center rounded bg-gray-200'>
              <Icon className='size-3.5 text-primary' />
            </span>
            <div className='flex flex-col'>
              <p className='text-xs font-semibold text-mineral-white'>{name}</p>
              <p className='text-[10px] text-gray-500'>{tag}</p>
            </div>
          </div>
          <p className='text-[10px] leading-4 text-mineral-white'>
            {cardDescription}
          </p>
        </div>

        <div className='mt-auto'>
          {status === 'connecting' ? (
            <Button
              type='button'
              variant='secondary'
              loading
              disabled
              className={BTN}
            >
              Connecting…
            </Button>
          ) : status === 'connected' ? (
            <Button
              type='button'
              variant='secondary'
              onClick={onDisconnect}
              className={BTN}
            >
              <Unplug className='size-3' />
              Disconnect
            </Button>
          ) : status === 'error' ? (
            <Button
              type='button'
              variant='secondary'
              onClick={onConnect}
              className={BTN}
            >
              <RotateCw className='size-3' />
              {connector.reconnectCta}
            </Button>
          ) : (
            <Button
              type='button'
              variant='secondary'
              onClick={onConnect}
              className={BTN}
            >
              {connector.connectCta}
              <ExternalLink className='size-3' />
            </Button>
          )}
        </div>
      </div>

      {status === 'error' && (
        <p className='text-label-sm text-destructive'>
          {connector.errorMessage}
        </p>
      )}
    </div>
  );
}
