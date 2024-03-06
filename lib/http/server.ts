import { Server as NodeServer } from "node:http";

export interface Server {
  nodeServer: NodeServer;
  close(): void;
}
