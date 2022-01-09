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
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

type UseSplTokenAccountResult = {
  loading: boolean;
  account?: AccountInfo;
  error?: string;
};

type CancellablePromise<T> = Promise<T> & {
  cancel: () => void;
};

const makeCancelable = <T>(promise: Promise<T>) => {
  let rejectFn;
  const wrappedPromise = new Promise((resolve, reject) => {
    rejectFn = reject;
    Promise.resolve(promise).then(resolve).catch(reject);
  }) as CancellablePromise<T>;

  wrappedPromise.cancel = () => {
    rejectFn({ canceled: true });
  };
  return wrappedPromise;
};

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
    const promise = makeCancelable(token.getAccountInfo(accountPubkey));
    promise
      .then(setAccount)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return promise.cancel;
  }, [token, accountPubkey]);

  return {
    loading,
    account,
    error,
  };
}

type UseLiveSplTokenAccountResult = UseSplTokenAccountResult & {
  slotUpdated?: number;
};

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
    const promise = makeCancelable(token.getAccountInfo(accountPubkey));
    promise
      .then(setAccount)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return promise.cancel;
  }, [token, accountPubkey]);

  useEffect(() => {
    let listener: number = 0;

    if (account && accountPubkey && connection) {
      listener = connection.onAccountChange(
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
    }

    return () => {
      if (listener && connection) {
        connection.removeAccountChangeListener(listener);
      }
    };
  }, [account]);

  return {
    loading,
    account,
    error,
    slotUpdated,
  };
}

type UseSplMintResult = {
  loading: boolean;
  mint?: MintInfo;
  error?: string;
};

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
    const promise = makeCancelable(token.getMintInfo());
    promise
      .then(setMint)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return promise.cancel;
  }, [token]);

  return {
    loading,
    mint,
    error,
  };
}

type UseLiveSplMintResult = UseSplMintResult & {
  slotUpdated?: number;
};

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
    const promise = makeCancelable(token.getMintInfo());
    promise
      .then(setMint)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    return promise.cancel;
  }, [token]);

  useEffect(() => {
    let listener: number;

    if (mint && token && connection) {
      listener = connection.onAccountChange(
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
    }

    return () => {
      if (listener && connection) {
        connection.removeAccountChangeListener(listener);
      }
    };
  }, [mint]);

  return {
    loading,
    mint,
    error,
    slotUpdated,
  };
}

export type UseATAResult = {
  accountPubkey?: PublicKey;
  error?: string;
};

export function useFindATA(
  token: Token | null | undefined,
  owner: PublicKey | null | undefined,
  allowOwnerOffCurve?: boolean
): UseATAResult {
  const [accountPubkey, setAccountPubkey] = useState<PublicKey | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!token || !owner) {
      return;
    }
    const promise = makeCancelable(
      Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        token.publicKey,
        owner,
        allowOwnerOffCurve
      )
    );
    promise.then(setAccountPubkey).catch((e: Error) => setError(e.message));
    return promise.cancel;
  }, [token]);

  return {
    accountPubkey,
    error,
  };
}

export function useSplATA(
  token: Token | null | undefined,
  owner: PublicKey | null | undefined,
  allowOwnerOffCurve?: boolean
): UseSplTokenAccountResult {
  const { accountPubkey, error: pdaError } = useFindATA(
    token,
    owner,
    allowOwnerOffCurve
  );
  const { error, ...rest } = useSplTokenAccount(token, accountPubkey);
  return {
    error: pdaError ?? error,
    ...rest,
  };
}

export function useLiveSplATA(
  token: Token | null | undefined,
  owner: PublicKey | null | undefined,
  connection: Connection | null | undefined,
  allowOwnerOffCurve?: boolean
): UseLiveSplTokenAccountResult {
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
    ...rest,
  };
}
