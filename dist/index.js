var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID, u64, } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
const makeCancelable = (promise) => {
    let rejectFn;
    const p = new Promise((resolve, reject) => {
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
export function useSplToken(connection, mint, payer) {
    return useMemo(() => {
        if (!connection || !mint)
            return undefined;
        return new Token(connection, mint, TOKEN_PROGRAM_ID, payer);
    }, [connection, mint, payer]);
}
export function useSplTokenAccount(token, accountPubkey) {
    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        if (!token || !accountPubkey) {
            return;
        }
        setLoading(true);
        setAccount(undefined);
        setError(undefined);
        const { promise, cancel } = makeCancelable(token.getAccountInfo(accountPubkey));
        promise
            .then(setAccount)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        return cancel;
    }, [token, accountPubkey]);
    return {
        loading,
        account,
        error,
    };
}
var AccountState;
(function (AccountState) {
    AccountState[AccountState["Uninitialized"] = 0] = "Uninitialized";
    AccountState[AccountState["Initialized"] = 1] = "Initialized";
    AccountState[AccountState["Frozen"] = 2] = "Frozen";
})(AccountState || (AccountState = {}));
export function useLiveSplTokenAccount(token, accountPubkey, connection) {
    const [loading, setLoading] = useState(false);
    const [account, setAccount] = useState();
    const [error, setError] = useState();
    const [slotUpdated, setSlotUpdated] = useState();
    useEffect(() => {
        if (!token || !accountPubkey) {
            return;
        }
        setLoading(true);
        setAccount(undefined);
        setError(undefined);
        const { promise, cancel } = makeCancelable(token.getAccountInfo(accountPubkey));
        promise
            .then(setAccount)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        return cancel;
    }, [token, accountPubkey]);
    useEffect(() => {
        if (!accountPubkey || !connection) {
            return;
        }
        const listener = connection.onAccountChange(accountPubkey, (accountInfo, context) => {
            try {
                const rawAccount = AccountLayout.decode(Buffer.from(accountInfo.data));
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
            }
            catch (e) {
                setError(e.message);
            }
        });
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
export function useSplMint(token) {
    const [loading, setLoading] = useState(true);
    const [mint, setMint] = useState();
    const [error, setError] = useState();
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
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        return cancel;
    }, [token]);
    return {
        loading,
        mint,
        error,
    };
}
export function useLiveSplMint(token, connection) {
    const [loading, setLoading] = useState(true);
    const [mint, setMint] = useState();
    const [error, setError] = useState();
    const [slotUpdated, setSlotUpdated] = useState();
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
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        return cancel;
    }, [token]);
    useEffect(() => {
        if (!token || !connection) {
            return;
        }
        const listener = connection.onAccountChange(token.publicKey, (accountInfo, context) => {
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
            }
            catch (e) {
                setError(e.message);
            }
        });
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
export function useFindATA(token, owner, allowOwnerOffCurve) {
    const [accountPubkey, setAccountPubkey] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        if (!token || !owner) {
            return;
        }
        const { promise, cancel } = makeCancelable(Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, token.publicKey, owner, allowOwnerOffCurve));
        promise.then(setAccountPubkey).catch((e) => setError(e.message));
        return cancel;
    }, [token, owner, allowOwnerOffCurve]);
    return {
        accountPubkey,
        error,
    };
}
export function useSplATA(token, owner, allowOwnerOffCurve) {
    const { accountPubkey, error: pdaError } = useFindATA(token, owner, allowOwnerOffCurve);
    const _a = useSplTokenAccount(token, accountPubkey), { error } = _a, rest = __rest(_a, ["error"]);
    return Object.assign({ error: pdaError !== null && pdaError !== void 0 ? pdaError : error, accountPubkey }, rest);
}
export function useLiveSplATA(token, owner, connection, allowOwnerOffCurve) {
    const { accountPubkey, error: pdaError } = useFindATA(token, owner, allowOwnerOffCurve);
    const _a = useLiveSplTokenAccount(token, accountPubkey, connection), { error } = _a, rest = __rest(_a, ["error"]);
    return Object.assign({ error: pdaError !== null && pdaError !== void 0 ? pdaError : error, accountPubkey }, rest);
}
