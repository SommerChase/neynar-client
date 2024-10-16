import neynarClient from "@/lib/neynarClient";
import { ViemLocalEip712Signer } from "@farcaster/hub-nodejs";
import { bytesToHex, hexToBytes } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { getFid } from "@/utils/getFid";

export const getSignedKey = async () => {
  const createSigner = await neynarClient.createSigner();
  const { deadline, signature } = await generate_signature(
    createSigner.public_key
  );

  if (deadline === 0 || signature === "") {
    throw new Error("Failed to generate signature");
  }

  const fid = await getFid();

  // Generate a new signature for sponsoring
  const sponsorSignature = await generate_sponsor_signature(createSigner.signer_uuid, fid, deadline);

  const options = {
    sponsor: {
      fid: fid,
      signature: sponsorSignature
    }
  };

  const signedKey = await neynarClient.registerSignedKey(
    createSigner.signer_uuid,
    fid,
    deadline,
    signature,
    options
  );

  return signedKey;
};

const generate_signature = async function (public_key: string) {
  if (typeof process.env.FARCASTER_DEVELOPER_MNEMONIC === "undefined") {
    throw new Error("FARCASTER_DEVELOPER_MNEMONIC is not defined");
  }

  const FARCASTER_DEVELOPER_MNEMONIC = process.env.FARCASTER_DEVELOPER_MNEMONIC;
  const FID = await getFid();

  const account = mnemonicToAccount(FARCASTER_DEVELOPER_MNEMONIC);
  const appAccountKey = new ViemLocalEip712Signer(account as any);

  // Generates an expiration date for the signature (24 hours from now).
  const deadline = Math.floor(Date.now() / 1000) + 86400;

  const uintAddress = hexToBytes(public_key as `0x${string}`);

  const signature = await appAccountKey.signKeyRequest({
    requestFid: BigInt(FID),
    key: uintAddress,
    deadline: BigInt(deadline),
  });

  if (signature.isErr()) {
    return {
      deadline,
      signature: "",
    };
  }

  const sigHex = bytesToHex(signature.value);

  return { deadline, signature: sigHex };
};

const generate_sponsor_signature = async (signerUuid: string, fid: number, deadline: number) => {
  if (typeof process.env.FARCASTER_DEVELOPER_MNEMONIC === "undefined") {
    throw new Error("FARCASTER_DEVELOPER_MNEMONIC is not defined");
  }

  const account = mnemonicToAccount(process.env.FARCASTER_DEVELOPER_MNEMONIC);
  const appAccountKey = new ViemLocalEip712Signer(account as any);

  const signature = await appAccountKey.signKeyRequest({
    requestFid: BigInt(fid),
    key: hexToBytes(signerUuid as `0x${string}`),
    deadline: BigInt(deadline),
  });

  if (signature.isErr()) {
    throw new Error("Failed to generate sponsor signature");
  }

  return bytesToHex(signature.value);
};