import type { Request, Response } from "express";
import { handleLmsState } from "./lms.ts";
import { handleHrState } from "./hr.ts";
import { handleFinanceState } from "./finance.ts";
import { handleRegistrationState } from "./registration.ts";
import { handleInventoryState } from "./inventory.ts";
import { handleCustomizationState } from "./customization.ts";
import { handleJobOrdersState } from "./jobOrders.ts";
import { handleStudentsState } from "./students.ts";
import { handleEventsState } from "./events.ts";
import { handleUsersState } from "./users.ts";
import { handleLogsState } from "./logs.ts";
import { handleMessagesState } from "./messages.ts";
import { handleMediaState } from "./media.ts";

// Central dispatch table for /api/state/update, tried in the same relative
// order the original monolithic handler checked each dataType in. Since a
// single request only ever carries one dataType value, calling every domain
// handler unconditionally is safe - at most one of them will find a matching
// (dataType, action) branch and actually send a response.
export async function handleStateUpdate(req: Request, res: Response, dataType: string, action: string, payload: any, state: any): Promise<boolean> {
  if (await handleLmsState(req, res, dataType, action, payload, state)) return true;
  if (await handleHrState(req, res, dataType, action, payload, state)) return true;
  if (await handleFinanceState(req, res, dataType, action, payload, state)) return true;
  if (await handleRegistrationState(req, res, dataType, action, payload, state)) return true;
  if (await handleInventoryState(req, res, dataType, action, payload, state)) return true;
  if (await handleCustomizationState(req, res, dataType, action, payload, state)) return true;
  if (await handleJobOrdersState(req, res, dataType, action, payload, state)) return true;
  if (await handleStudentsState(req, res, dataType, action, payload, state)) return true;
  if (await handleEventsState(req, res, dataType, action, payload, state)) return true;
  if (await handleUsersState(req, res, dataType, action, payload, state)) return true;
  if (await handleLogsState(req, res, dataType, action, payload, state)) return true;
  if (await handleMessagesState(req, res, dataType, action, payload, state)) return true;
  if (await handleMediaState(req, res, dataType, action, payload, state)) return true;
  return false;
}
