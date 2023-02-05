import { useCallback, useState, useEffect } from 'react';
import { Button, Link, Text, VStack } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useGoogleLogin, CodeResponse } from '@react-oauth/google';

import CodeBlock from './CodeBlock';

const code = `
const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
        console.log(codeResponse);
        const tokens = await axios.post(
            'http://localhost:3001/auth/google', {
                code: codeResponse.code,
            });

        console.log(tokens);
    },
    onError: errorResponse => console.log(errorResponse),
});
`;
const LS_NONCE_KEY = 'nonce';
export const generateNonce = () => {
  const randomValues = window.crypto.getRandomValues(new Int16Array(1));
  return String(Math.abs(randomValues[0]));
};

const compareNonceWithLocalStorage = (nonce: string | null) => {
  try {
    const lsNonce = localStorage.getItem(LS_NONCE_KEY);
    return typeof lsNonce === 'string' && lsNonce === nonce;
  } catch (error) {}
  return false;
};

export const checkIsNonceValid = () => {
  const { searchParams } = new URL(window.location.href);
  const authCode = searchParams.get('code');
  const state = searchParams.get('state');
  if (authCode && state) {
    return compareNonceWithLocalStorage(state);
  }
  return false;
};

export default function CodeFlow() {
  const [codeResponse, setCodeResponse] = useState<CodeResponse | null>();
  const [state, setState] = useState<string>();
  const [isStateValid, setIsStateValid] = useState<boolean | null>(null);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async codeResponse => {
      setCodeResponse(codeResponse);
    },
    onError: errorResponse => console.log(errorResponse),
    redirect_uri: 'http://localhost:3000',
    state,
    ux_mode: 'redirect',
  });
  const generateNonceAndStoreInLocalStorage = useCallback(() => {
    const nonce = generateNonce();
    try {
      window.localStorage.setItem(LS_NONCE_KEY, nonce);
      setState(nonce);
    } catch (error) {
      // no access to ls
    }
  }, []);

  useEffect(() => {
    const isStateValid = checkIsNonceValid();
    if (isStateValid) {
      setIsStateValid(true);
      // do some async call to exchange tokens
    }
  }, []);
  useEffect(() => {
    if (state) {
      googleLogin();
    }
  }, [state, googleLogin]);

  return (
    <VStack spacing="5">
      <Link
        href="https://github.com/MomenSherif/react-oauth#usegooglelogin-both-implicit--authorization-code-flow"
        color="blue.600"
        fontWeight="semibold"
        target="_blank"
        rel="noopener noreferrer"
      >
        useGoogleLogin Props
      </Link>
      <Button colorScheme="blue" onClick={generateNonceAndStoreInLocalStorage}>
        Login with Google 🚀
      </Button>
      {isStateValid !== null && isStateValid && (
        <Text>
          State is Valid! <CheckCircleIcon />
        </Text>
      )}

      <CodeBlock imgSrc="/images/Code-snap.png" code={code} />
      <CodeBlock
        imgSrc="/images/CodeResponse-snap.png"
        code={codeResponse ? JSON.stringify(codeResponse, null, 2) : undefined}
      />

      <Text fontWeight="bold" maxW="container.md">
        Exchange "code" for tokens from your backend
      </Text>

      <CodeBlock imgSrc="/images/serverTokens-snap.png" />

      <Link
        href="https://github.com/MomenSherif/react-oauth/issues/12#issuecomment-1131408898"
        target="_blank"
        rel="noopener noreferrer"
      >
        Check backend (express) implementation
      </Link>
    </VStack>
  );
}
