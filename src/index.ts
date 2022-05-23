import {
  AccountInfo,
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintInfo,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { Connection, PublicKey, Signer } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

interface CancelablePromise<T> {
  promise: Promise<T>;
  cancel: () => void;
}

const makeCancelable = <T>(promise: Promise<T>): CancelablePromise<T> => {
  let rejectFn;
  const p: Promise<T> = new Promise((resolve, reject) => {
    rejectFn = reject;
    Promise.resolve(promise).then(resolve).catch(reject);
  });
  return {
    promise: p,
    cancel: () => {
      rejectFn({ canceled: true });
    },
  };
};

export function useSplToken(
  connection: Connection | null | undefined,
  mint: PublicKey | null | undefined,
  payer?: Signer | null | undefined
): Token | undefined {
  return useMemo(() => {
    if (!connection || !mint) return undefined;
    return new Token(
      connection,
      mint,
      TOKEN_PROGRAM_ID,
      payer as unknown as Signer
    );
  }, [connection, mint, payer]);
}

interface UseSplTokenAccountResult {
  loading: boolean;
  account?: AccountInfo;
  error?: string;
}

export function useSplTokenAccount(
  token: Token | null | undefined,
  accountPubkey: PublicKey | null | undefined
): UseSplTokenAccountResult {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<AccountInfo | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!token || !accountPubkey) {
      return;
    }
    setLoading(true);
    setAccount(undefined);
    setError(undefined);
    const { promise, cancel } = makeCancelable(
      token.getAccountInfo(accountPubkey)
    );
    promise
      .then(setAccount)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return cancel;
  }, [token, accountPubkey]);

  return {
    loading,
    account,
    error,
  };
}

interface UseLiveSplTokenAccountResult extends UseSplTokenAccountResult {
  slotUpdated?: number;
}

enum AccountState {
  Uninitialized = 0,
  Initialized = 1,
  Frozen = 2,
}

export function useLiveSplTokenAccount(
  token: Token | null | undefined,
  accountPubkey: PublicKey | null | undefined,
  connection: Connection | null | undefined
): UseLiveSplTokenAccountResult {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<AccountInfo | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [slotUpdated, setSlotUpdated] = useState<number | undefined>();

  useEffect(() => {
    if (!token || !accountPubkey) {
      return;
    }
    setLoading(true);
    setAccount(undefined);
    setError(undefined);
    const { promise, cancel } = makeCancelable(
      token.getAccountInfo(accountPubkey)
    );
    promise
      .then(setAccount)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return cancel;
  }, [token, accountPubkey]);

  useEffect(() => {
    if (!accountPubkey || !connection) {
      return;
    }
    const listener = connection.onAccountChange(
      accountPubkey,
      (accountInfo, context) => {
        try {
          const rawAccount = AccountLayout.decode(
            Buffer.from(accountInfo.data)
          );
          setAccount({
            address: accountPubkey,
            mint: new PublicKey(rawAccount.mint),
            owner: new PublicKey(rawAccount.owner),
            amount: u64.fromBuffer(rawAccount.amount),
            delegate: rawAccount.delegateOption
              ? new PublicKey(rawAccount.delegate)
              : null,
            delegatedAmount: rawAccount.delegateOption
              ? new u64(0)
              : u64.fromBuffer(rawAccount.delegatedAmount),
            isInitialized: rawAccount.state !== AccountState.Uninitialized,
            isFrozen: rawAccount.state === AccountState.Frozen,
            isNative: !!rawAccount.isNativeOption,
            rentExemptReserve: rawAccount.isNativeOption
              ? u64.fromBuffer(rawAccount.isNative)
              : null,
            closeAuthority: rawAccount.closeAuthorityOption
              ? new PublicKey(rawAccount.closeAuthority)
              : null,
          });
          setSlotUpdated(context.slot);
        } catch (e) {
          setError((e as Error).message);
        }
      }
    );

    return () => {
      connection.removeAccountChangeListener(listener);
    };
  }, [accountPubkey, connection]);

  return {
    loading,
    account,
    error,
    slotUpdated,
  };
}

interface UseSplMintResult {
  loading: boolean;
  mint?: MintInfo;
  error?: string;
}

export function useSplMint(token: Token | null | undefined): UseSplMintResult {
  const [loading, setLoading] = useState(true);
  const [mint, setMint] = useState<MintInfo | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    setMint(undefined);
    setError(undefined);
    const { promise, cancel } = makeCancelable(token.getMintInfo());
    promise
      .then(setMint)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return cancel;
  }, [token]);

  return {
    loading,
    mint,
    error,
  };
}

interface UseLiveSplMintResult extends UseSplMintResult {
  slotUpdated?: number;
}

export function useLiveSplMint(
  token: Token | null | undefined,
  connection: Connection | null | undefined
): UseLiveSplMintResult {
  const [loading, setLoading] = useState(true);
  const [mint, setMint] = useState<MintInfo | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [slotUpdated, setSlotUpdated] = useState<number | undefined>();

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    setMint(undefined);
    setError(undefined);
    const { promise, cancel } = makeCancelable(token.getMintInfo());
    promise
      .then(setMint)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return cancel;
  }, [token]);

  useEffect(() => {
    if (!token || !connection) {
      return;
    }

    const listener = connection.onAccountChange(
      token.publicKey,
      (accountInfo, context) => {
        try {
          const rawMint = MintLayout.decode(Buffer.from(accountInfo.data));
          setMint({
            mintAuthority: rawMint.mintAuthorityOption
              ? new PublicKey(rawMint.mintAuthority)
              : null,
            supply: u64.fromBuffer(rawMint.supply),
            decimals: rawMint.decimals,
            isInitialized: rawMint.isInitialized != 0,
            freezeAuthority: rawMint.freezeAuthorityOption
              ? new PublicKey(rawMint.freezeAuthority)
              : null,
          });
          setSlotUpdated(context.slot);
        } catch (e) {
          setError((e as Error).message);
        }
      }
    );

    return () => {
      connection.removeAccountChangeListener(listener);
    };
  }, [token, connection]);

  return {
    loading,
    mint,
    error,
    slotUpdated,
  };
}

export interface UseFindATAResult {
  accountPubkey?: PublicKey;
  error?: string;
}

export function useFindATA(
  token: Token | null | undefined,
  owner: PublicKey | null | undefined,
  allowOwnerOffCurve?: boolean
): UseFindATAResult {
  const [accountPubkey, setAccountPubkey] = useState<PublicKey | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!token || !owner) {
      return;
    }
    const { promise, cancel } = makeCancelable(
      Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        token.publicKey,
        owner,
        allowOwnerOffCurve
      )
    );
    promise.then(setAccountPubkey).catch((e: Error) => setError(e.message));
    return cancel;
  }, [token, owner, allowOwnerOffCurve]);

  return {
    accountPubkey,
    error,
  };
}

export interface UseSplATAResult extends UseSplTokenAccountResult {
  accountPubkey?: PublicKey;
}

export function useSplATA(
  token: Token | null | undefined,
  owner: PublicKey | null | undefined,
  allowOwnerOffCurve?: boolean
): UseSplATAResult {
  const { accountPubkey, error: pdaError } = useFindATA(
    token,
    owner,
    allowOwnerOffCurve
  );
  const { error, ...rest } = useSplTokenAccount(token, accountPubkey);
  return {
    error: pdaError ?? error,
    accountPubkey,
    ...rest,
  };
}

export interface useLiveSplATAResult extends UseLiveSplTokenAccountResult {
  accountPubkey?: PublicKey;
}

export function useLiveSplATA(
  token: Token | null | undefined,
  owner: PublicKey | null | undefined,
  connection: Connection | null | undefined,
  allowOwnerOffCurve?: boolean
): useLiveSplATAResult {
  const { accountPubkey, error: pdaError } = useFindATA(
    token,
    owner,
    allowOwnerOffCurve
  );
  const { error, ...rest } = useLiveSplTokenAccount(
    token,
    accountPubkey,
    connection
  );
  return {
    error: pdaError ?? error,
    accountPubkey,
    ...rest,
  };
}
