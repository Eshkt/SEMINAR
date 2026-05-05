// Dual-mode realtime hook
// VITE_RUNTIME=local → Polling
// VITE_RUNTIME=lambda → AppSync GraphQL subscription

import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

const VITE_RUNTIME = import.meta.env.VITE_RUNTIME || 'local';
const VITE_API_URL = import.meta.env.VITE_API_URL;

// AppSync config (filled by Terraform outputs for prod)
const appsyncConfig = {
  graphqlUrl: import.meta.env.VITE_APPSYNC_URL,
  apiKey: import.meta.env.VITE_APPSYNC_KEY,
  cognitoPoolId: import.meta.env.VITE_COGNITO_POOL_ID,
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

if (VITE_RUNTIME === 'lambda' && appsyncConfig.graphqlUrl) {
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
}

const client = (VITE_RUNTIME === 'lambda' && appsyncConfig.graphqlUrl) ? generateClient() : null;

const ON_QUESTION_UPDATE = `subscription OnQuestionUpdate {
  onQuestionUpdate {
    id txt stat gid ts
  }
}`;

export function useRealtimeQuestions(initialQuestions) {
  const [questions, setQuestions] = useState(initialQuestions || []);

  useEffect(() => {
    if (VITE_RUNTIME === 'local') {
      // Use Polling as a replacement for Socket.io
      const fetchApproved = async () => {
        try {
          const res = await fetch(`${VITE_API_URL}/questions/approved`);
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.questions || data.data || []);
            setQuestions(list);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      };

      const interval = setInterval(fetchApproved, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    } else if (client) {
      const sub = client.graphql({
        query: ON_QUESTION_UPDATE,
      }).subscribe({
        next: ({ data }) => {
          const q = data?.onQuestionUpdate;
          if (!q) return;
          
          setQuestions((prev) => {
            const current = Array.isArray(prev) ? prev : [];
            if (q.stat === 'apprv') {
              // Add if not exists
              if (!current.find(x => x.id === q.id)) {
                return [...current, { ...q, status: 'approved' }];
              }
            }
            if (q.stat === 'flag') {
              return current.filter((x) => x.id !== q.id);
            }
            return current;
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
