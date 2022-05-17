import './App.css';
import { ethers } from 'ethers';
import abi from './contracts/KryptoTrees.json';
import { useState, useEffect } from 'react';

function App() {
  const [account, setAccount] = useState();
  const [contract, setContract] = useState();
  const [pauseState, setPauseState] = useState();

  const getPauseState = async (provider) => {

    const pauseState = await provider.pauseMintingState();
    setPauseState(pauseState);
  }

  const updatePauseState = async (state) => {
    try {
      if (state === '1' && !pauseState) {
        const txn = await contract.setPauseMinting(true);
        const receipt = await txn.wait();
        if(receipt.confirmations > 0 ) {
          setPauseState(true);
        }
        console.log('Update to true. ');
        console.log(receipt);
        
      } else if (state === '0' && pauseState) {
        const txn = await contract.setPauseMinting(false);
        const receipt = await txn.wait();
        if(receipt.confirmations > 0 ) {
          setPauseState(true);
        }
        console.log('Update to false. ');
        console.log(receipt);
      } else {
        // do nothing
      }
    } catch (error) {
      console.error(error);
    }
  }

  // MetaMask events
  const handleDisconnect = () => {
    setAccount('');
    console.log('MetaMask disconnected.');
  }

  const handleAccountChange = (account) => {
    console.log(`accountChange: ${account[0]}`);
    setAccount(account[0]);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const kryptoTrees = new ethers.Contract(
      process.env.REACT_APP_KRYPTOTREES_ADD,
      abi,
      signer
    );

    setContract(kryptoTrees);
  }

  const handleNetworkChange = (chainId) => {
    console.log(`networkChange: ${chainId}`);
    if (chainId !== 0x89) {
      window.location.reload();
    }
  }

  const initWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
      // Create provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const network = await provider.getNetwork();
      if (network.chainId !== 137) {
        alert('Please choose Polygon Matic Network');
        console.log('Please choose Polygon Matic Network');
        return;
      }

      const signer = provider.getSigner();
      const kryptoTrees = new ethers.Contract(
        process.env.REACT_APP_KRYPTOTREES_ADD,
        abi,
        signer
      );
      setContract(kryptoTrees);

      getPauseState(kryptoTrees);

      // Add MetaMask Events
      addMetaMaskEvents();

    } else {
      alert('Please install MetaMask');
    }
  }

  const addMetaMaskEvents = () => {
    window.ethereum.on('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', handleNetworkChange);
    window.ethereum.on('connect', () => console.log('MetaMask connected...'));
    window.ethereum.on('disconnect', () => console.log('MetaMask disconnected.'));
  }

  useEffect(() => {
    initWeb3();
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountChange);
      window.ethereum.removeListener('chainChanged', handleNetworkChange);
      window.ethereum.removeListener('connect', () => console.log('MetaMask connected...'));
      window.ethereum.removeListener('disconnect', handleDisconnect);
    }
  }, []);

  return (
    <div>
      <div>{typeof account !== 'undefined' ? `Account: ${account}` : <button onClick={initWeb3}>Connect</button>}</div>
      <p>Pause State: {pauseState ? 'TRUE' : 'FALSE'}</p>
      <label>Pause State:</label>
      <select onChange={(e) => updatePauseState(e.target.value)} name="isPaused">
        <option value="0">FALSE</option>
        <option value="1">TRUE</option>
      </select>
      <div><button onClick={() => getPauseState(contract)}>Get Pause State</button></div>
    </div>
  );
}

export default App;
