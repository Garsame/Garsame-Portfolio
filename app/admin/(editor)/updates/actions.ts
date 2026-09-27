"use server";

import {
  cancelScheduledBroadcast,
  deleteBroadcast,
  saveBroadcastDraft,
  scheduleBroadcast,
  sendTestBroadcast,
  triggerBroadcastDispatch,
} from "@/lib/admin/updates";
import {
  retryFailedBroadcastLogs,
  retrySingleMailLog,
} from "@/lib/admin/mail-logs";

export async function saveDraftAction(data: {
  id?: string;
  subject: string;
  previewText?: string;
  body?: unknown;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  try {
    return await saveBroadcastDraft(data);
  } catch (err) {
    console.error("[actions:saveDraftAction]", err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to save draft.",
    };
  }
}

export async function sendTestAction(data: {
  subject: string;
  previewText?: string;
  body?: unknown;
}): Promise<{ ok: boolean; message?: string; to?: string }> {
  try {
    return await sendTestBroadcast(data);
  } catch (err) {
    console.error("[actions:sendTestAction]", err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to send test email.",
    };
  }
}

export async function scheduleAction(
  id: string,
  scheduledForIso: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const date = new Date(scheduledForIso);
    return await scheduleBroadcast(id, date);
  } catch (err) {
    console.error("[actions:scheduleAction]", err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to schedule broadcast.",
    };
  }
}

export async function cancelScheduleAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await cancelScheduledBroadcast(id);
  } catch (err) {
    console.error("[actions:cancelScheduleAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to cancel scheduled send.",
    };
  }
}

export async function sendBroadcastAction(
  id: string,
): Promise<{ ok: boolean; delivered: number; failed: number; message?: string }> {
  try {
    return await triggerBroadcastDispatch(id);
  } catch (err) {
    console.error("[actions:sendBroadcastAction]", err);
    return {
      ok: false,
      delivered: 0,
      failed: 0,
      message:
        err instanceof Error ? err.message : "Failed to dispatch broadcast.",
    };
  }
}

export async function deleteBroadcastAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await deleteBroadcast(id);
  } catch (err) {
    console.error("[actions:deleteBroadcastAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to delete broadcast.",
    };
  }
}

export async function retrySingleLogAction(
  logId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await retrySingleMailLog(logId);
  } catch (err) {
    console.error("[actions:retrySingleLogAction]", err);
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to retry send.",
    };
  }
}

export async function retryAllFailedLogsAction(
  broadcastId: string,
): Promise<{ ok: boolean; retried: number; succeeded: number; failed: number }> {
  try {
    return await retryFailedBroadcastLogs(broadcastId);
  } catch (err) {
    console.error("[actions:retryAllFailedLogsAction]", err);
    return {
      ok: false,
      retried: 0,
      succeeded: 0,
      failed: 0,
    };
  }
}
