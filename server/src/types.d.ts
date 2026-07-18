declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    query<T = any>(text: string, values?: any[]): Promise<{ rows: T[] }>;
    connect(): Promise<any>;
    end(): Promise<void>;
  }
}

declare module 'express' {
  const express: any;
  export default express;
  export function Router(): any;
  export function json(options?: any): any;
  export function urlencoded(options?: any): any;
  export function static(root: string, options?: any): any;
  export interface Request {
    [key: string]: any;
    headers: Record<string, string>;
    body: any;
    query: Record<string, string>;
    params: Record<string, string>;
    protocol: string;
    ip: string;
    file?: any;
    socket: any;
    rawBody?: any;
    get(name: string): string | undefined;
    header(name: string): string | undefined;
  }
  export interface Response {
    [key: string]: any;
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    redirect(url: string): Response;
    setHeader(name: string, value: string | string[]): Response;
  }
  export type NextFunction = (err?: any) => void;
}

declare module 'cors' {
  function cors(options?: any): any;
  export default cors;
}

declare module 'node-cron' {
  const cron: {
    schedule(expression: string, func: () => void | Promise<void>): void;
  };
  export default cron;
}

declare module 'bcryptjs' {
  const bcrypt: {
    hash(data: string, salt: string | number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
    genSalt(rounds?: number): Promise<string>;
  };
  export default bcrypt;
}

declare module 'jsonwebtoken' {
  const jwt: {
    sign(payload: any, secretOrPrivateKey: string, options?: any): string;
    verify(token: string, secretOrPublicKey: string, callback: (err: any, decoded: any) => void): void;
  };
  export default jwt;
}

declare module 'multer' {
  function multer(options?: any): any;
  namespace multer {
    function diskStorage(options: any): any;
  }
  export default multer;
}

declare module 'stripe' {
  class Stripe {
    constructor(apiKey: string, options?: any);
    checkout: {
      sessions: {
        create(params: any): Promise<any>;
        retrieve(id: string): Promise<any>;
      };
    };
  }
  export default Stripe;
}

declare module 'dotenv' {
  function config(options?: any): void;
  export default { config };
}
