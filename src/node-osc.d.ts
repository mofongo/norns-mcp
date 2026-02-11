declare module "node-osc" {
  export class Message {
    constructor(address: string, ...args: unknown[]);
    append(arg: unknown): void;
  }

  export class Client {
    constructor(host: string, port: number);
    send(message: Message, callback?: (err: Error | null) => void): void;
    send(...args: unknown[]): void;
    close(callback?: () => void): void;
  }

  export class Server {
    constructor(port: number, host?: string, callback?: () => void);
    on(event: string, callback: (...args: unknown[]) => void): void;
    close(): void;
  }
}
