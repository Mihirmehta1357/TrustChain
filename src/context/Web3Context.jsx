import React, { createContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import TrustChainABI from "../artifacts/contracts/TrustChain.sol/TrustChain.json";

export const Web3Context = createContext();

const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

export const Web3Provider = ({ children }) => {
  const [account, setAccount]       = useState("");
  const [contract, setContract]     = useState(null);
  const [provider, setProvider]     = useState(null);
  const [signer, setSigner]         = useState(null);
  const [trustScore, setTrustScore] = useState(null);

  const refreshTrustScore = useCallback(async (addr, c) => {
    if (!addr || !c) return;
    try {
      const userData = await c.users(addr);
      setTrustScore(Number(userData.trustScore));
    } catch (_) {}
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this feature!");
      return null;
    }
    try {
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (err) {
        if (err.code === -32002) {
          alert("🦊 MetaMask is already waiting for your approval!\n\nPlease click the MetaMask extension icon in the top right of your browser to approve the connection.");
          return null;
        }
        throw err;
      }
      
      const addr = accounts[0];
      setAccount(addr);

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);

      const ethersSigner = await ethersProvider.getSigner();
      setSigner(ethersSigner);

      const c = new ethers.Contract(CONTRACT_ADDRESS, TrustChainABI.abi, ethersSigner);
      setContract(c);
      console.log("Connected to Wallet:", addr);

      // Auto-register new user — registerUser() takes no args
      try {
        const userCheck = await c.users(addr);
        if (!userCheck.isRegistered) {
          console.log("Auto-registering on blockchain... base score = 50");
          const tx = await c.registerUser();
          await tx.wait();
          console.log("Registered on blockchain!");
        } else {
          console.log("User already registered.");
        }
      } catch (e) {
        console.error("Auto-registration failed", e);
      }

      await refreshTrustScore(addr, c);
      return { account: addr, signer: ethersSigner };
    } catch (error) {
      console.error("Wallet connection failed", error);
      return null;
    }
  };

  // Cryptographic signature to link Web3 identity to Supabase
  const signAuthMessage = async (activeSigner = signer) => {
    try {
      if (!activeSigner) throw new Error("No signer available");
      const message = "Sign this message to securely log into TrustChain with your wallet.";
      const signature = await activeSigner.signMessage(message);
      return signature;
    } catch (err) {
      console.error("Signature rejected by user", err);
      return null;
    }
  };

  useEffect(() => {
    if (window.ethereum?.selectedAddress) connectWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) connectWallet();
        else { setAccount(""); setContract(null); setTrustScore(null); }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, connectWallet, signAuthMessage, contract, provider, signer, trustScore, refreshTrustScore }}>
      {children}
    </Web3Context.Provider>
  );
};
