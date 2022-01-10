import { AccountInfo, MintInfo, Token } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
declare type UseSplTokenAccountResult = {
    loading: boolean;
    account?: AccountInfo;
    error?: string;
};
export declare function useSplTokenAccount(token: Token | null | undefined, accountPubkey: PublicKey | null | undefined): UseSplTokenAccountResult;
declare type UseLiveSplTokenAccountResult = UseSplTokenAccountResult & {
    slotUpdated?: number;
};
export declare function useLiveSplTokenAccount(token: Token | null | undefined, accountPubkey: PublicKey | null | undefined, connection: Connection | null | undefined): UseLiveSplTokenAccountResult;
declare type UseSplMintResult = {
    loading: boolean;
    mint?: MintInfo;
    error?: string;
};
export declare function useSplMint(token: Token | null | undefined): UseSplMintResult;
declare type UseLiveSplMintResult = UseSplMintResult & {
    slotUpdated?: number;
};
export declare function useLiveSplMint(token: Token | null | undefined, connection: Connection | null | undefined): UseLiveSplMintResult;
export declare type UseFindATAResult = {
    accountPubkey?: PublicKey;
    error?: string;
};
export declare function useFindATA(token: Token | null | undefined, owner: PublicKey | null | undefined, allowOwnerOffCurve?: boolean): UseFindATAResult;
export declare type UseSplATAResult = UseSplTokenAccountResult & {
    accountPubkey?: PublicKey;
};
export declare function useSplATA(token: Token | null | undefined, owner: PublicKey | null | undefined, allowOwnerOffCurve?: boolean): UseSplATAResult;
export declare type useLiveSplATAResult = UseLiveSplTokenAccountResult & {
    accountPubkey?: PublicKey;
};
export declare function useLiveSplATA(token: Token | null | undefined, owner: PublicKey | null | undefined, connection: Connection | null | undefined, allowOwnerOffCurve?: boolean): useLiveSplATAResult;
export {};
