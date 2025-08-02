import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import {
  connect,
  sendEdit,
  sendCursorPosition,
  sendEditingStatus,
  disconnect,
} from '../services/websocket';
import './Editor.css';

function Editor() {
  const { docId } = useParams();
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingUsers, setEditingUsers] = useState([]);
  const titleRef = useRef('');
  const contentRef = useRef('');
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Track timers for editing users to remove them after inactivity
  const typingTimers = useRef({});

  const userId = 'myUserId'; // Replace with actual userId/auth info

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await api.get(`/documents/${docId}`);
        setTitle(res.data.title);
        setContent(res.data.content);
        titleRef.current = res.data.title;
        contentRef.current = res.data.content;
        if (editorRef.current) {
          editorRef.current.innerText = res.data.content;
        }
      } catch {
        setMessage('❌ Failed to load document.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    // Connect with two separate callbacks:
    connect(
      docId,
      // Document updates callback
      (incoming) => {
        if (incoming.content !== undefined) {
          if (incoming.title !== titleRef.current) {
            setTitle(incoming.title);
            titleRef.current = incoming.title;
          }

          if (
            !isFocused &&
            incoming.content !== contentRef.current &&
            incoming.senderId !== userId
          ) {
            setContent(incoming.content);
            contentRef.current = incoming.content;
            if (editorRef.current) {
              editorRef.current.innerText = incoming.content;
            }
          }
        }
      },
      // Editing status callback
      (status) => {
        if (typeof status.editing === 'boolean' && status.username) {
          if (status.username !== userId) {
            if (status.editing) {
              setEditingUsers((prev) => {
                if (!prev.includes(status.username)) {
                  return [...prev, status.username];
                }
                return prev;
              });

              if (typingTimers.current[status.username]) {
                clearTimeout(typingTimers.current[status.username]);
              }

              typingTimers.current[status.username] = setTimeout(() => {
                setEditingUsers((prev) =>
                  prev.filter((user) => user !== status.username)
                );
                delete typingTimers.current[status.username];
              }, 20000);
            } else {
              setEditingUsers((prev) =>
                prev.filter((user) => user !== status.username)
              );
              if (typingTimers.current[status.username]) {
                clearTimeout(typingTimers.current[status.username]);
                delete typingTimers.current[status.username];
              }
            }
          }
        }
      }
    );

    return () => {
      disconnect();
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [docId, userId, isFocused]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, content]);

  const handleSave = async () => {
    try {
      await api.post('/documents', { id: docId, title, content });
      setMessage('✅ Document saved successfully!');
    } catch {
      setMessage('❌ Failed to save document.');
    }
  };

  const notifyEditingStatus = (editing) => {
    sendEditingStatus(docId, {
      username: userId,
      docId,
      editing,
    });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    sendEdit(docId, {
      type: 'text',
      id: docId,
      title: e.target.value,
      content: contentRef.current,
      senderId: userId,
    });
    notifyEditingStatus(true);
  };

  const handleContentChange = (e) => {
    const plainText = e.currentTarget.innerText;
    setContent(plainText);
    contentRef.current = plainText;
    sendEdit(docId, {
      type: 'text',
      id: docId,
      title: titleRef.current,
      content: plainText,
      senderId: userId,
    });
    notifyEditingStatus(true);
  };

  const handleCursorChange = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editorRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const position = preRange.toString().length;

    sendCursorPosition(docId, {
      username: userId,
      line: 0,
      column: position,
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    notifyEditingStatus(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    notifyEditingStatus(false);
  };

  if (loading) return <p>Loading document...</p>;

  return (
    <div className="editor-container">
      <input
        className="title-input"
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Enter document title"
      />

      <div
        ref={editorRef}
        className="content-textarea"
        contentEditable
        onInput={handleContentChange}
        onKeyUp={handleCursorChange}
        onClick={handleCursorChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        spellCheck={false}
      />

      <button className="save-button" onClick={handleSave}>
        💾 Save Document
      </button>

      {message && <p className="message">{message}</p>}

      {editingUsers.length > 0 && (
        <div className="editing-indicator">
          {editingUsers.map((user) => (
            <p key={user}>
              👤 <strong>{user}</strong> is editing...
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default Editor;
