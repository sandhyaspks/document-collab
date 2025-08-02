import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

/**
 * Connects to WebSocket and subscribes to document and editing topics.
 * @param {string} docId - Document ID to join the room.
 * @param {function} onDocumentMessage - Callback for document updates.
 * @param {function} onEditingStatus - Callback for editing status updates.
 */
export function connect(docId, onDocumentMessage, onEditingStatus) {
  const socket = new SockJS('http://localhost:8080/ws');
  stompClient = new Client({
    webSocketFactory: () => socket,
    debug: () => {},
    reconnectDelay: 5000,
    onConnect: () => {
      // Subscribe to document updates
      stompClient.subscribe(`/topic/document/${docId}`, (message) => {
        const parsed = JSON.parse(message.body);
        onDocumentMessage(parsed);
      });

      // Subscribe to editing status updates
      stompClient.subscribe(`/topic/editing/${docId}`, (message) => {
        const parsed = JSON.parse(message.body);
        onEditingStatus(parsed);
      });
    },
  });

  stompClient.activate();
}

/**
 * Sends document edit data to backend.
 */
export function sendEdit(docId, document) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/edit/${docId}`,
      body: JSON.stringify(document),
    });
  }
}

/**
 * Sends cursor position data to backend.
 */
export function sendCursorPosition(docId, cursorData) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/cursor/${docId}`,
      body: JSON.stringify(cursorData),
    });
  }
}

/**
 * Sends editing status to backend.
 */
export function sendEditingStatus(docId, status) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: `/app/editing`,
      body: JSON.stringify(status),
    });
  }
}

/**
 * Disconnects from WebSocket.
 */
export function disconnect() {
  if (stompClient) {
    stompClient.deactivate();
  }
}
