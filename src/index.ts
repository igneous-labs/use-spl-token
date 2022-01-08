import {
  AccountInfo,
  AccountLayout,
  MintInfo,
  MintLayout,
  Token,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

type UseSplTokenAccountResult = {
  loading: boolean;
  account?: AccountInfo;
  error?: string;
};

export function useSplTokenAccount(
  token: Token,
  accountPubkey: PublicKey
): UseSplTokenAccountResult {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    token
      .getAccountInfo(accountPubkey)
      .then(setAccount)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
  token: Token,
  accountPubkey: PublicKey,
  connection: Connection
): UseLiveSplTokenAccountResult {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [slotUpdated, setSlotUpdated] = useState<number | undefined>();

  useEffect(() => {
    let listener: number;

    if (loading) {
      token
        .getAccountInfo(accountPubkey)
        .then(setAccount)
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (account) {
      listener = connection.onAccountChange(
        accountPubkey,
        (accountInfo, context) => {
          try {
            const rawAccount = AccountLayout.decode(accountInfo.data);
            setAccount({
              address: accountPubkey,
              mint: rawAccount.mint,
              owner: rawAccount.owner,
              amount: rawAccount.amount,
              delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
              delegatedAmount: rawAccount.delegatedAmount,
              isInitialized: rawAccount.state !== AccountState.Uninitialized,
              isFrozen: rawAccount.state === AccountState.Frozen,
              isNative: !!rawAccount.isNativeOption,
              rentExemptReserve: rawAccount.isNativeOption
                ? rawAccount.isNative
                : null,
              closeAuthority: rawAccount.closeAuthorityOption
                ? rawAccount.closeAuthority
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
      if (listener) {
        connection.removeAccountChangeListener(listener);
      }
    };
  }, [loading]);

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

export function useSplMint(token: Token): UseSplMintResult {
  const [loading, setLoading] = useState(true);
  const [mint, setMint] = useState<MintInfo | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    token
      .getMintInfo()
      .then(setMint)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
  token: Token,
  connection: Connection
): UseLiveSplMintResult {
  const [loading, setLoading] = useState(true);
  const [mint, setMint] = useState<MintInfo | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [slotUpdated, setSlotUpdated] = useState<number | undefined>();

  useEffect(() => {
    let listener: number;

    if (loading) {
      token
        .getMintInfo()
        .then(setMint)
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (mint) {
      listener = connection.onAccountChange(
        token.publicKey,
        (accountInfo, context) => {
          try {
            const rawMint = MintLayout.decode(accountInfo.data);
            setMint({
              mintAuthority: rawMint.mintAuthorityOption
                ? rawMint.mintAuthority
                : null,
              supply: rawMint.supply,
              decimals: rawMint.decimals,
              isInitialized: rawMint.isInitialized,
              freezeAuthority: rawMint.freezeAuthorityOption
                ? rawMint.freezeAuthority
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
      if (listener) {
        connection.removeAccountChangeListener(listener);
      }
    };
  }, [loading]);

  return {
    loading,
    mint,
    error,
    slotUpdated,
  };
}
