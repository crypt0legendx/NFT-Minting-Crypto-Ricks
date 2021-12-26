import './styles/App.css';

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ReactSlider from "react-slider";
import myCryptoRicks from './utils/CryptoRicks.json';
import { css } from "@emotion/react";
import ClockLoader from "react-spinners/ClipLoader";
import items from './item-list'

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';

// Demo styles, see 'Styles' section below for some notes on use.
import 'react-accessible-accordion/dist/fancy-example.css';

const override = css`
  display: block;
  margin: 0 auto;
  border-color: #c1f762;
  border: 3px dashed;
`;

const CONTRACT_ADDRESS = "0xFc2c697783361cCdd11a16642264c3d116C49763";
const METADATA_BASE_TOKENURI = "https://gateway.pinata.cloud/ipfs/QmWqiQCrcA2zGasYXPjC3XJVChNeUGdapC1k61qmdk146d/";

const App = () => {

  const [currentAccount, setCurrentAccount] = useState("");
  const [mintCount, setMintCount] = useState(1);
  const [mintedCount, setMintedCount] = useState(1);
  const [mintLoading, setMintLoading] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)

        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        setupEventListener()
        getMintedCount();
        checkowner(accounts[0]);
    } else {
        console.log("No authorized account found")
    }
  }

  const getMintedCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myCryptoRicks.abi, signer);

        let tokenId = await connectedContract.getTokenID();
        console.log("tokenId ========================== ", tokenId)
        
        setMintedCount(parseInt(tokenId._hex.toString(16), 16));  // convert hex to decimal
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log("getMintedCount", error)
    }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener() 
      getMintedCount();
      checkowner(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const checkowner = async(auth) => {
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myCryptoRicks.abi, signer);

      let owner = await connectedContract.owner();

      if(owner.toLowerCase() === auth.toLowerCase()) {
        setShowWithdraw(true);
      }
  }

  const withdrawToWallet = async() => {
    try {
      setWithdrawLoading(true)
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myCryptoRicks.abi, signer);
      let res = await connectedContract.withdraw();
      setWithdrawLoading(false)
    } catch (error) {
      setWithdrawLoading(false)
    }
  }

  const checkNetwork = async() => {
    try {
      const { ethereum } = window;
      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);
    
      const rinkebyChainId = "0xA4B1"; //"0x66eeb" => arbitrum test net
      if (chainId.toLowerCase() !== rinkebyChainId.toLowerCase()) {
        alert("You are not connected to the Arbitrum Network!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  checkNetwork();

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;
      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myCryptoRicks.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
      try {
        setMintLoading(true)
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myCryptoRicks.abi, signer);
          console.log(signer)
  
          console.log("Going to pop wallet now to pay gas...")
          
          let nftTxn = '';
          if(mintedCount <= 3000) {
            nftTxn = await connectedContract.mint(mintCount, METADATA_BASE_TOKENURI, {value:ethers.utils.parseEther((0.05 * mintCount).toString())}); // 0.05
          } else if(mintedCount > 3000) {
            nftTxn = await connectedContract.mint(mintCount, METADATA_BASE_TOKENURI, {value:ethers.utils.parseEther((0.075 * mintCount).toString())}); // 
          }

          console.log("Mining...please wait.")
          await nftTxn.wait();

          // update minted count
          let tokenId = await connectedContract.getTokenID();
          setMintedCount(parseInt(tokenId._hex.toString(16), 16));
          setMintLoading(false)

          // alert(`Mined, see transaction: https://rinkeby-explorer.arbitrum.io/tx/${nftTxn.hash}`);
          alert("Successfully minted! Please check your metamask now!");
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        setMintLoading(false)
        console.log(error)
      }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  /*
  * Added a conditional render! We don't want to show Connect to Wallet if we're already conencted :).
  */
  return (
    <div className="App">
      <div id="__next">
          <div>
              <main>
                  <div className="background"></div>
                  {showWithdraw ? 
                    <div className="withdraw">
                      <button onClick={withdrawToWallet} className="cta-button connect-wallet-button">
                        { withdrawLoading? <ClockLoader color={'#c1f762'} css={override} loading={true} size={30} /> : "Withdraw" }
                      </button>
                    </div> : ''
                  }
                  <div className="container-top container">
                      <div className="section-top row">
                          <div className="section-top-left col-md-6 col-12">
                              <h1 className="neonText">Crypto Ricks</h1>
                              <p>10k Rick NFTs on Arbitrum.</p>
                          </div>
                          <div className="section-top-right col-md-6 col-12"><img className="img-fluid" src="bears3.gif" style={{margin: "auto"}} />
                          </div>
                      </div>
                  </div>
                  <div className="timer-container-bg">
                      <div className="timer-container container">
                          <div className="timer-top row">
                              <div className="col-md-12 col-12">
                                  <p><span>Minting On Arbitrum!</span></p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="faq-container-bg">
                      <div className="accordian-container accordion">
                          <Accordion allowZeroExpanded>
                            {items.map((item, index) => (
                                <AccordionItem key={index}>
                                    <AccordionItemHeading>
                                        <AccordionItemButton>
                                            {item.heading}
                                        </AccordionItemButton>
                                    </AccordionItemHeading>
                                    <AccordionItemPanel>
                                      {item.content}
                                    </AccordionItemPanel>
                                </AccordionItem>
                            ))}
                            <AccordionItem>
                                <AccordionItemHeading>
                                    <AccordionItemButton>
                                      How do I mint a Rick?
                                    </AccordionItemButton>
                                </AccordionItemHeading>
                                <AccordionItemPanel>
                                  Our team wrote a guide <a href="https://hackmd.io/@CryptoRicksNFT/HJwAdCZIF">here!</a>
                                </AccordionItemPanel>
                            </AccordionItem>
                          </Accordion>
                      </div>
                  </div>
                  <div className="block-container" style={{minWidth: 'unset'}}>
                      {currentAccount === "" ? (
                        <button onClick={connectWallet} className="cta-button connect-wallet-button">
                          Connect to Wallet
                        </button>
                      ) : (
                        <div>
                          <h1>Mint-A-Crypto Ricks</h1>
                          <p>{ mintedCount == 0? 0 : mintedCount - 1}/10000 minted</p>
                          <p>How many Crypto Ricks would you like to mint?</p>
                          <div className="amount-slider">
                            <ReactSlider
                                className="horizontal-slider"
                                thumbClassName="example-thumb"
                                trackClassName="example-track"
                                min={1}
                                max={20}
                                renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
                                onChange={(value) => setMintCount(value)}
                            />
                          </div>
                          <p style={{marginBottom: '30px'}}>Total: {mintCount * 5 / 100} ETH + gas</p>
                          <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                            { mintLoading? <ClockLoader color={'#c1f762'} css={override} loading={true} size={30} /> : "Mint NFT" }
                          </button>
                        </div>
                      )}
                  </div>
              </main>
              <footer className="footer">
                  <h1 style={{marginTop: "10px"}}>Crypto Ricks © 2021</h1>
                  <p>Smart Contract Address: <a
                          href="https://arbiscan.io/address/0xFc2c697783361cCdd11a16642264c3d116C49763">0xFc2c697783361cCdd11a16642264c3d116C49763</a>
                  </p>
                  <div className="socials"><a href="https://twitter.com/CryptoRicksNFT"><span><svg stroke="currentColor"
                                  fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em"
                                  xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z">
                                  </path>
                              </svg>      </span></a><a href="https://discord.com/invite/Uzef6EeD5Y"><span><svg
                                  stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512"
                                  height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M297.216 243.2c0 15.616-11.52 28.416-26.112 28.416-14.336 0-26.112-12.8-26.112-28.416s11.52-28.416 26.112-28.416c14.592 0 26.112 12.8 26.112 28.416zm-119.552-28.416c-14.592 0-26.112 12.8-26.112 28.416s11.776 28.416 26.112 28.416c14.592 0 26.112-12.8 26.112-28.416.256-15.616-11.52-28.416-26.112-28.416zM448 52.736V512c-64.494-56.994-43.868-38.128-118.784-107.776l13.568 47.36H52.48C23.552 451.584 0 428.032 0 398.848V52.736C0 23.552 23.552 0 52.48 0h343.04C424.448 0 448 23.552 448 52.736zm-72.96 242.688c0-82.432-36.864-149.248-36.864-149.248-36.864-27.648-71.936-26.88-71.936-26.88l-3.584 4.096c43.52 13.312 63.744 32.512 63.744 32.512-60.811-33.329-132.244-33.335-191.232-7.424-9.472 4.352-15.104 7.424-15.104 7.424s21.248-20.224 67.328-33.536l-2.56-3.072s-35.072-.768-71.936 26.88c0 0-36.864 66.816-36.864 149.248 0 0 21.504 37.12 78.08 38.912 0 0 9.472-11.52 17.152-21.248-32.512-9.728-44.8-30.208-44.8-30.208 3.766 2.636 9.976 6.053 10.496 6.4 43.21 24.198 104.588 32.126 159.744 8.96 8.96-3.328 18.944-8.192 29.44-15.104 0 0-12.8 20.992-46.336 30.464 7.68 9.728 16.896 20.736 16.896 20.736 56.576-1.792 78.336-38.912 78.336-38.912z">
                                  </path>
                              </svg>      </span></a><span className="fa fa-linkedin-square"></span></div>
                  <script src="https://unpkg.com/react/umd/react.production.min.js"></script>
                  <script src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"></script>
                  <script src="https://unpkg.com/react-bootstrap@next/dist/react-bootstrap.min.js"></script>
              </footer>
          </div>
      </div>
    </div>
  );
};

export default App;
