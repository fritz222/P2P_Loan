const { assert } = require("chai");
const BigNumber = require('bignumber.js');

const P2PLending = artifacts.require("P2PLending");
const Dai = artifacts.require('mocks/Dai.sol');
const Bat = artifacts.require('mocks/Bat.sol');
const Rep = artifacts.require('mocks/Rep.sol');
const Zrx = artifacts.require('mocks/Zrx.sol');



function bone(numb){
  return new BigNumber(numb).multipliedBy(new BigNumber(10).exponentiatedBy(18));
}



contract("P2PLending", function(accounts) {

  let dai, bat, rep, zrx; 
  const [admin, borrower, investor1, investor2, investor3] = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]];

  const [DAI, BAT, REP, ZRX] = ['DAI', 'BAT', 'REP', 'ZRX']
  .map(ticker => web3.utils.fromAscii(ticker));

  const STATUS = {
        Application: 0,
        PayIn: 1,
        Loan: 2,
        Done: 3
  }

  console.log('Borrower Account: ' + borrower);
    
  beforeEach(async () => {
    ([dai, bat, rep, zrx] = await Promise.all([
      Dai.new(), 
      Bat.new(), 
      Rep.new(), 
      Zrx.new()
    ]));

    p2p_lending = await P2PLending.new();



    await Promise.all([
      p2p_lending.addToken(DAI, dai.address),
      p2p_lending.addToken(BAT, bat.address),
      p2p_lending.addToken(REP, rep.address),
      p2p_lending.addToken(ZRX, zrx.address)
    ]);

    const amount = web3.utils.toWei('1000');
    const seedTokenBalance = async (token, trader) => {
      await token.faucet(trader, amount)
      await token.approve(
        p2p_lending.address, 
        amount, 
        {from: trader}
      );
    };
    await Promise.all(
      [dai, bat, rep, zrx].map(
        token => seedTokenBalance(token, borrower)
      )
    );
    await Promise.all(
      [dai, bat, rep, zrx].map(
        token => seedTokenBalance(token, investor1) 
      )
    );
    await Promise.all(
      [dai, bat, rep, zrx].map(
        token => seedTokenBalance(token, investor2) 
      )
    );
  });


  describe('Math Works', async () => {

    // it('is able to divide - abdk library', async () => {
    //   const stringResult = await p2p_lending.divisionTest(5,2, {from: borrower});
      
    //   const result = stringResult/2**64;

    //   // console.log("2^64", 2**64);
    //   // console.log("Resultat: ", result);
    //   // console.log("Typeof: ", typeof result);
    //   assert(parseInt(result) == 2);
    // });
    // it('is able to divide - compound library', async () => {
      
    //   const a = new BigNumber(5.5*10**18);
    //   const b = new BigNumber(2*10**18);
      
    //   const tempResult = await p2p_lending.divisionTest(a, b, {from: borrower});
    //   const result = new BigNumber(tempResult/10**18);
    //   console.log(parseFloat(result));
    //   assert(result == 2.75);
    // });

    // it('is able to divide - compound library', async () => {
      
    //   const a = new BigNumber(bone(0.05));
    //   const b = new BigNumber(bone(360));
      
    //   const tempResult = await p2p_lending.divisionTest(a, b, {from: borrower});
    //   const result = new BigNumber(tempResult/10**18);
    //  console.log(parseFloat(result));
    //  console.log(parseFloat(0.05/360));
    //  assert(parseFloat(result)== parseFloat(0.05/360));
    // });

    
    it('is able to calculate amortisation factor - compound library', async () => {
      
      
      const interest = new BigNumber(0.05*10**18);
      const payments = new BigNumber(24*10**18);
      const yearlyPayments = new BigNumber(12*10**18);
      const principal = new BigNumber(5000*10**18);

      console.log('Contract Address: ', p2p_lending.address);

      const tempResult = await p2p_lending.calculateInterest(interest, payments, yearlyPayments, principal, {from: borrower});
      // console.log("s0", parseFloat(tempResult[0]/10**18));
      // console.log("s1", parseFloat(tempResult[1]/10**18));
      // console.log("s2", parseFloat(tempResult[2]/10**18));
      // console.log("s3", parseFloat(tempResult[3]/10**18));

      const result = new BigNumber(tempResult)/10**18;
      console.log(parseFloat(result));

    });
  });
});

