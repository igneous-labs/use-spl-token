import { AccountInfo, MintInfo, Token } from "@solana/spl-token";
import { Connection, PublicKey, Signer } from "@solana/web3.js";
export declare function useSplToken(connection: Connection | null | undefined, mint: PublicKey | null | undefined, payer?: Signer | null | undefined): Token | undefined;
interface UseSplTokenAccountResult {
    loading: boolean;
    account?: AccountInfo;
    error?: string;
}
export declare function useSplTokenAccount(token: Token | null | undefined, accountPubkey: PublicKey | null | undefined): UseSplTokenAccountResult;
interface UseLiveSplTokenAccountResult extends UseSplTokenAccountResult {
    slotUpdated?: number;
}
export declare function useLiveSplTokenAccount(token: Token | null | undefined, accountPubkey: PublicKey | null | undefined, connection: Connection | null | undefined): UseLiveSplTokenAccountResult;
interface UseSplMintResult {
    loading: boolean;
    mint?: MintInfo;
    error?: string;
}
export declare function useSplMint(token: Token | null | undefined): UseSplMintResult;
interface UseLiveSplMintResult extends UseSplMintResult {
    slotUpdated?: number;
}
export declare function useLiveSplMint(token: Token | null | undefined, connection: Connection | null | undefined): UseLiveSplMintResult;
export interface UseFindATAResult {
    accountPubkey?: PublicKey;
    error?: string;
}
export declare function useFindATA(token: Token | null | undefined, owner: PublicKey | null | undefined, allowOwnerOffCurve?: boolean): UseFindATAResult;
export interface UseSplATAResult extends UseSplTokenAccountResult {
    accountPubkey?: PublicKey;
}
export declare function useSplATA(token: Token | null | undefined, owner: PublicKey | null | undefined, allowOwnerOffCurve?: boolean): UseSplATAResult;
export interface useLiveSplATAResult extends UseLiveSplTokenAccountResult {
    accountPubkey?: PublicKey;
}
export declare function useLiveSplATA(token: Token | null | undefined, owner: PublicKey | null | undefined, connection: Connection | null | undefined, allowOwnerOffCurve?: boolean): useLiveSplATAResult;
export {};
