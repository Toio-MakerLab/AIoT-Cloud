/** Shape of events POSTed by the Zalo Bot API webhook (https://bot.zapps.me/docs/webhook/). */
export interface ZaloWebhookMessage {
  message_id: string;
  date: number;
  from: { id: string; display_name: string; is_bot: boolean };
  chat: { id: string; chat_type: 'PRIVATE' | 'GROUP' };
  text?: string;
}

export interface ZaloWebhookPayload {
  ok: boolean;
  result?: {
    event_name:
      | 'message.text.received'
      | 'message.image.received'
      | 'message.sticker.received'
      | 'message.voice.received'
      | 'message.unsupported.received';
    message?: ZaloWebhookMessage;
  };
}
