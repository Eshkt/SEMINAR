// Realtime abstraction
// Lambda → AppSync HTTP mutation
const axios = require('axios');

const APPSYNC_URL = process.env.APPSYNC_URL;
const APPSYNC_KEY = process.env.APPSYNC_KEY;

function init() {
  // Socket.io removed
}

async function publish(event, payload) {
  if (APPSYNC_URL && APPSYNC_KEY) {
    // Map event to publishQuestion mutation for AppSync
    const mutation = `
      mutation PublishQuestion($id: ID!, $txt: String!, $stat: String!, $gid: ID, $ts: AWSDateTime) {
        publishQuestion(id: $id, txt: $txt, stat: $stat, gid: $gid, ts: $ts) {
          id
          txt
          stat
          gid
          ts
        }
      }
    `;

    const variables = {
      id: payload.id,
      txt: payload.txt || '',
      stat: payload.stat || 'pend',
      gid: payload.gid || null,
      ts: payload.ts || new Date().toISOString(),
    };

    try {
      const response = await axios.post(APPSYNC_URL, {
        query: mutation,
        variables
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': APPSYNC_KEY,
        }
      });

      if (response.data.errors) {
        console.error('AppSync mutation errors:', response.data.errors);
      }
    } catch (error) {
      console.error('AppSync publish error:', error.message);
    }
  }
}

module.exports = { init, publish };
