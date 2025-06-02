(function () {
  const sessionId = localStorage.getItem('session_id') || (() => {
    const id = Math.random().toString(36).substring(2);
    localStorage.setItem('session_id', id);
    return id;
  })();

  const style = document.createElement('style');
  style.innerHTML = `
    #chat-bubble {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4e54c8;
      color: white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      z-index: 1000;
    }
    #chat-box {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 300px;
      height: 400px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 10px;
      display: none;
      flex-direction: column;
      z-index: 1000;
    }
    #chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      font-family: sans-serif;
      font-size: 14px;
    }
    #chat-input {
      display: flex;
      border-top: 1px solid #ccc;
    }
    #chat-input input {
      flex: 1;
      padding: 10px;
      border: none;
      outline: none;
    }
    #chat-input button {
      padding: 10px;
      background: #4e54c8;
      color: white;
      border: none;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement('div');
  bubble.id = 'chat-bubble';
  bubble.innerHTML = '💬';
  document.body.appendChild(bubble);

  const box = document.createElement('div');
  box.id = 'chat-box';
  box.innerHTML = `
    <div id="chat-messages"></div>
    <div id="chat-input">
      <input type="text" placeholder="Digite..." />
      <button>Enviar</button>
    </div>
  `;
  document.body.appendChild(box);

  bubble.onclick = () => {
    box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
  };

  const input = box.querySelector('input');
  const button = box.querySelector('button');
  const messagesDiv = box.querySelector('#chat-messages');

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    await fetch('/api/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, from: 'user', message: msg })
    });
  }

  async function loadMessages() {
    const res = await fetch(`/api/getMessages?session_id=${sessionId}`);
    const data = await res.json();
    messagesDiv.innerHTML = '';
    data.messages.forEach(m => {
      const el = document.createElement('div');
      el.innerHTML = `<strong>${m.from === 'user' ? 'Você' : 'Suporte'}:</strong> ${m.message}`;
      messagesDiv.appendChild(el);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  button.onclick = sendMessage;
  setInterval(loadMessages, 3000);
  loadMessages();
})();
