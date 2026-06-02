export const SOCKET_EVENTS = {
  // Bağlantı
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USER_ONLINE: 'user:online',
  USER_ONLINE_LIST: 'user:online:list',
  USER_OFFLINE: 'user:offline',

  // Konuşma
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',

  // Mesajlaşma
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_READ: 'message:read',

  // Yazıyor
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Bildirim
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Anket
  POLL_JOIN: 'poll:join',
  POLL_LEAVE: 'poll:leave',
  POLL_VOTE: 'poll:vote',
  POLL_RESULTS_UPDATE: 'poll:results:update',
}