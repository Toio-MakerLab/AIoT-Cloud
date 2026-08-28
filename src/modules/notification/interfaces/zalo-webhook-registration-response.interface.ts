/** Shared response envelope for the Zalo Bot API's setWebhook/deleteWebhook/testWebhook calls. */
export interface ZaloWebhookRegistrationResponse {
  ok: boolean;
  result?: {
    url: string;
    updated_at: number;
    verification?: {
      ok: boolean;
      url: string;
      status_code?: number;
      outcome: string;
      latency_ms: number;
      hint?: string;
    };
  };
  message?: string;
}
