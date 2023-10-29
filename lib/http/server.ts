import { Server as NodeServer } from "http";

export interface Server {
  nodeServer: NodeServer;
  close(): void;
}
