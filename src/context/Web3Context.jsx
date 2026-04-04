import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import TrustChainABI from "../artifacts/contracts/TrustChain.sol/TrustChain.json";

export const Web3Context = createContext();

// Make sure to replace with your deployed contract address from Hardhat deployment
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        
        setAccount(accounts[0]);
        
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
        
        const ethersSigner = await ethersProvider.getSigner();
        setSigner(ethersSigner);

        const trustChainContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          TrustChainABI.abi, // from compiled artifacts
          ethersSigner
        );
        
        setContract(trustChainContract);
        console.log("Connected to Wallet:", accounts[0]);

        // Auto-Register user globally for the Hackathon Demo
        try {
          const userCheck = await trustChainContract.users(accounts[0]);
          if (!userCheck.isRegistered) {
            console.log("On-Chain Auto Registration initiated...");
            const tx = await trustChainContract.registerUser(72);
            await tx.wait();
            console.log("Successfully registered on blockchain!");
          } else {
             console.log("User already registered on blockchain.");
          }
        } catch(e) {
          console.error("Auto-registration silently failed or aborted", e);
        }

        return { account: accounts[0], signer: ethersSigner };

      } catch (error) {
        console.error("Wallet connection failed", error);
        return null;
      }
    } else {
      alert("Please install MetaMask to use this feature!");
      return null;
    }
  };

  // The cryptograph Signature challenge to link Web3 identity to Supabase
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

  // Re-connect on load if already connected
  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      connectWallet();
    }
    
    // Auto refresh on account change
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if(accounts.length > 0) {
          connectWallet();
        } else {
          setAccount("");
          setContract(null);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, connectWallet, signAuthMessage, contract, provider, signer }}>
      {children}
    </Web3Context.Provider>
  );
};
