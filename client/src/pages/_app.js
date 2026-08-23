import '../styles/globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <Head>
        <title>Agentflow_AI | Agentic AI Operations Automation Platform</title>
        <meta
          name="description"
          content="Agentic AI Operations Automation Platform that converts natural language into executable visual workflows orchestrated by cooperating AI agents."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
