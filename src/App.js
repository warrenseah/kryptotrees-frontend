import './App.css';
import {ethers} from 'ethers';
import abi from './contracts/KryptoTrees.json';
import {useState, useEffect} from 'react';

function App() {
  const [account, setAccount] = useState();
  const [contract, setContract] = useState();
  const [pauseState, setPauseState] = useState();

  const fetchGasStation = async () => {
    const res = await fetch("https://gasstation-mainnet.matic.network/v2");    
    const resJson = await res.json();
    return resJson;
  }

  const getPauseState = async () => {
    
    if(contract) {
      const pauseState = await contract.pauseMintingState();
      setPauseState(pauseState);
    } else {
      console.log('contract is not found.');
    }
  }

  const updatePauseState = async (state) => {
    try {
      if(state === '1' && !pauseState) {
        const txn = await contract.setPauseMinting(true);
        const receipt = await txn.wait();
        console.log('Update to true. ', receipt);
        await getPauseState();
      } else if(state === '0' && pauseState) {
        const txn = await contract.setPauseMinting(false);
        const receipt = await txn.wait();
        console.log('Update to false. ', receipt);
        await getPauseState();
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
    if(chainId !== 0x89){
      window.location.reload();
    }
  }
  
  const initWeb3 = async () => {
    if(typeof window.ethereum !== 'undefined') {
      // Create provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const network = await provider.getNetwork();
      if(network.chainId !== 137){
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

      const pauseState = await kryptoTrees.pauseMintingState();
      setPauseState(pauseState);
      
      // Add MetaMask Events
      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('chainChanged', handleNetworkChange);
      window.ethereum.on('connect', () => console.log('MetaMask connected...'));
      window.ethereum.on('disconnect', () => console.log('MetaMask disconnected.'));

    } else {
      alert('Please install MetaMask');
    }
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
      <div><button onClick={getPauseState}>Get Pause State</button></div>
    </div>
  );
}

export default App;
