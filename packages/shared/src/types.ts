export type Json = any;

export type Workflows = {
  id: string;
  name?: string | null;
  userId: string;
  isActive: boolean;
  createdAt: Date;
};

export type Trigger = {
  id: string;
  userId: string;
  triggerId: string;
  workflowId: string;
  metaData: Json;
};

export type Action = {
  id: string;
  actionId: string;
  workflowId: string;
  order: number;
  metaData?: Json;
};

export type AvailableTriggers = {
  id: string;
  name: string;
};

export type AvailableActions = {
  id: string;
  name: string;
};