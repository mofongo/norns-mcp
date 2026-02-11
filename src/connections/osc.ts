import { Client, Message } from "node-osc";

export class NornsOSC {
  private client: Client;

  constructor(host: string, port = 10111) {
    this.client = new Client(host, port);
  }

  send(path: string, ...args: (string | number | boolean)[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const msg = new Message(path, ...args);
      this.client.send(msg, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close(): void {
    this.client.close();
  }
}
