import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from "identicon.js";
import './App.css';
import SocialNetwork from '../abis/SocialNetwork.json'
import Navbar from './Navbar'
import Main from './Main'

class App extends Component {

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }
  
  async refreshBlockchainData(){
    await this.loadBlockchainData()
  }
  async loadWeb3(){
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
    }
    else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async loadBlockchainData(){
    this.setState({
      posts: []
    })
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    // Network Id
    const networkId = await web3.eth.net.getId()
    const networkData = SocialNetwork.networks[networkId]
    if(networkData){
      const socialNetwork = web3.eth.Contract(SocialNetwork.abi, networkData.address)
      this.setState({socialNetwork})
      const postCount = await socialNetwork.methods.postCount().call()
      this.setState({ postCount })
      // Load Posts
      for(var i=1;i<=postCount; i++){
        const post = await socialNetwork.methods.posts(i).call()
        this.setState({
          posts: [...this.state.posts, post]
        })
      }
      // Sort posts. Show highest tupped posts first
      this.setState({
        posts: this.state.posts.sort((a,b) => b.tipAmount - a.tipAmount)
      })
      this.setState({loading: false})
      console.log({ posts: this.state.posts })
    }else{
      window.alert('SocialNetwork contract not deployed to detected network.')
    }
  }

  createPost(content){
    this.setState({ loading: true })
    console.log("μΈμλ");
    this.state.socialNetwork.methods.createPost(content).send({ from: this.state.account })
    .on('confirmation', (confirmationNumber, receipt) => {
        console.log(confirmationNumber)
        console.log(receipt)
        this.refreshBlockchainData()
     })
  }

  tipPost(id, tipAmount){
    this.setState({ loading: true })
    this.state.socialNetwork.methods.tipPost(id).send({ from: this.state.account, value: tipAmount })
    .on('confirmation', (confirmationNumber, receipt) => {
      this.refreshBlockchainData()
   })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      socialNetwork: null,
      postCount: 0,
      posts: [],
      loading: true
    }
    this.createPost = this.createPost.bind(this)
    this.tipPost = this.tipPost.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account}/>
        { this.state.loading 
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main 
              posts={this.state.posts} 
              createPost = {this.createPost}
              tipPost = {this.tipPost}
            />
        }        
       </div>
    );
  }
}

export default App;
