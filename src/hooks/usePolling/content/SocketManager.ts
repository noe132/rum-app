import { IReactionDisposer, when } from 'mobx';
import getBase from 'utils/getBase';
import sleep from 'utils/sleep';
import type { ContentTaskManager } from './ContentTaskManager';
import type { EmptyContentManager } from './EmptyContentManager';

export class SocketManager {
  private ws: WebSocket | null = null;
  private dispose: IReactionDisposer | null = null;

  public constructor(
    private contentTaskManager: ContentTaskManager,
    private emptyContentManager: EmptyContentManager,
  ) {}

  public start() {
    this.dispose = when(
      () => this.contentTaskManager.reactive.lazyMode,
      () => {
        this.connect();
      },
    );
  }

  public stop() {
    this.dispose?.();
    this.dispose = null;
    this.disconnect();
  }

  public destroy() {
    this.stop();
  }

  private connect() {
    if (this.ws) { return; }
    const url = new URL(getBase());
    const uri = `${url.protocol === 'http:' ? 'ws' : 'wss'}://${url.host}/api/v1/ws/trx`;
    this.ws = new WebSocket(uri);

    this.ws.addEventListener('close', async () => {
      this.ws = null;
      await sleep(1000);
      this.connect();
    });

    this.ws.addEventListener('message', (e) => {
      try {
        const trx = JSON.parse(e.data);
        const groupId = trx.GroupId;
        const trxId = trx.TrxId;
        this.emptyContentManager.handleNewTrx([{ groupId, trxId }]);
        if (!('type' in trx)) {
          if (this.contentTaskManager.reactive.lazyMode) {
            this.contentTaskManager.jumpIn(groupId);
          }
        }
      } catch (e) {}
    });
  }

  private disconnect() {
    this.ws?.close();
  }
}
