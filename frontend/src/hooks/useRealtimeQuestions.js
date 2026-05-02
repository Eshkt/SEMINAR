// Dual-mode realtime hook
// VITE_RUNTIME=local → Socket.io
// VITE_RUNTIME=lambda → AppSync GraphQL subscription

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

const VITE_RUNTIME = import.meta.env.VITE_RUNTIME || 'local';
const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// AppSync config (filled by Terraform outputs for prod)
const appsyncConfig = {
  graphqlUrl: import.meta.env.VITE_APPSYNC_URL,
  apiKey: import.meta.env.VITE_APPSYNC_KEY,
  cognitoPoolId: import.meta.env.VITE_COGNITO_POOL_ID,
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const ON_QUESTION_UPDATE = `subscription OnQuestionUpdate {
  onQuestionUpdate {
    id txt stat gid ts
  }
}`;

export function useRealtimeQuestions(initialQuestions) {
  const [questions, setQuestions] = useState(initialQuestions || []);

  useEffect(() => {
    if (VITE_RUNTIME === 'local') {
      const socket = io(VITE_API_URL);

      socket.on('questionSubmitted', (q) => {
        console.log('New question submitted:', q);
      });

      socket.on('questionApproved', (q) => {
        setQuestions((prev) => {
          const updated = prev.map((x) => (x.id === q.id ? { ...q, status: 'approved' } : x));
          return updated;
        });
      });

      socket.on('questionHidden', ({ id }) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      });

      socket.on('questionDeleted', ({ id }) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      });

      return () => {
        socket.disconnect();
      };
    } else if (VITE_RUNTIME === 'lambda' && appsyncConfig.graphqlUrl) {
      Amplify.configure({
        API: {
          GraphQL: {
            endpoint: appsyncConfig.graphqlUrl,
            region: 'ap-southeast-1',
            defaultAuthMode: 'apiKey',
            apiKey: appsyncConfig.apiKey,
          },
        },
      });

      const client = generateClient();
      const sub = client.graphql({
        query: ON_QUESTION_UPDATE,
      }).subscribe({
        next: ({ data }) => {
          const q = data.onQuestionUpdate;
          setQuestions((prev) => {
            if (q.stat === 'apprv') {
              return [...prev, { ...q, status: 'approved' }];
            }
            if (q.stat === 'flag') {
              return prev.filter((x) => x.id !== q.id);
            }
            return prev;
          });
        },
        error: (err) => console.error('AppSync error:', err),
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, []);

  return [questions, setQuestions];
}
