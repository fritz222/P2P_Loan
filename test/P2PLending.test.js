const { default: BigNumber } = require("bignumber.js");
const { assert } = require("chai");

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

  //console.log('Borrower Account: ' + borrower);
    
  beforeEach(async () => {
    ([dai, bat, rep, zrx] = await Promise.all([
      Dai.new(), 
      Bat.new(), 
      Rep.new(), 
      Zrx.new()
    ]));

    p2p_lending = await P2PLending.new();

    //console.log('Contract Address: ', p2p_lending.address);


    await Promise.all([
      p2p_lending.addToken(DAI, dai.address),
      p2p_lending.addToken(BAT, bat.address),
      p2p_lending.addToken(REP, rep.address),
      p2p_lending.addToken(ZRX, zrx.address)
    ]);

    const amount = 11000;
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

  describe('deployment', async () => {
    it('deploys successfully', async () => {

      const p2p_address = p2p_lending.address
      assert.notEqual(p2p_address, 0x0)
      assert.notEqual(p2p_address, '')
      assert.notEqual(p2p_address, null)
      assert.notEqual(p2p_address, undefined)
    });
  });


  describe('Application - Happy Path', async () => {
    it('create new Loan Application', async () => {      
      await p2p_lending.createLoanApplication(5, bone(10000), bone(12), bone(24), DAI, {from: borrower});
      const event = await p2p_lending.getPastEvents(
        "Transfer",
        {
          filter: {
            _to: borrower
          },
          fromBlock: 0
        });

        const id = event[0].returnValues.tokenId;
        const loan = await p2p_lending.getLoan(id);

        assert(id == 1);
        assert(loan.principal_amount/10**18 == 10000);
        assert(loan.status == STATUS.Application);
    });
    
    it('adds Loan Params', async () => {

      const investors = [[investor1, bone(5000), bone(0.05), 0, false, true], [investor2, bone(5000), bone(0.05), 0, false, true]];
      
      await p2p_lending.createLoanApplication(5, bone(10000), bone(12), bone(24), DAI, {from: borrower});
      const event = await p2p_lending.getPastEvents(
        "Transfer",
        {
          filter: {
            _to: borrower
          },
          fromBlock: 0
        });

        const id = event[0].returnValues.tokenId;
        await p2p_lending.writeLoanParams(id, investors);

        const loan = await p2p_lending.getLoan(id);
        const investors_check = loan.investors_index;

        const investor1_check = await p2p_lending.getInvestor(investors_check[0]);
        const investor2_check = await p2p_lending.getInvestor(investors_check[1]);

        assert(investor1_check.investor_address == investor1);
        assert(investor2_check.investor_address == investor2);
    });

    it('is able to pay in', async () => {

      const investors = [[investor1, bone(5000), bone(0.05), 0, false, true], [investor2, bone(5000), bone(0.05), 0, false, true]];
      
      await p2p_lending.createLoanApplication(5, bone(10000), bone(12), bone(24), DAI, {from: borrower});
      const Transferevents = await p2p_lending.getPastEvents(
        "Transfer",
        {
          filter: {
            _to: borrower
          },
          fromBlock: 0
        });

        const id = Transferevents[0].returnValues.tokenId;
        await p2p_lending.writeLoanParams(id, investors);
        var loan = await p2p_lending.getLoan(id);
        assert(loan.status, STATUS.PayIn);

        //TODO
        await p2p_lending.payIn(id, 5000, {from: investor1});

        const i1_data = await p2p_lending.getInvestor(investor1);
        assert(i1_data.paid_in, true);


        const balanceI1 = await dai.balanceOf(investor1);
        const balanceSmartContract = await p2p_lending.getBalance(borrower, DAI);
        //console.log(parseInt(balanceSmartContract));
        assert(parseInt(balanceI1) == 6000);
        assert(parseInt(balanceSmartContract) == 5000);

    });
    
      it('is able to calculate annuity and start loan - compound library', async () => {
      
      const investors = [[investor1, bone(5000), bone(0.05), 0, false, true], [investor2, bone(5000), bone(0.05), 0, false, true]];
      
      await p2p_lending.createLoanApplication(5, bone(10000), bone(12), bone(24), DAI, {from: borrower});
      const Transferevents = await p2p_lending.getPastEvents(
        "Transfer",
        {
          filter: {
            _to: borrower
          },
          fromBlock: 0
        });

        const id = Transferevents[0].returnValues.tokenId;
        await p2p_lending.writeLoanParams(id, investors);
        var loan = await p2p_lending.getLoan(id);
        assert(loan.status, STATUS.PayIn);

        //TODO
        //console.log(investor1);
        await p2p_lending.payIn(id, 5000, {from: investor1});

        const i1_data = await p2p_lending.getInvestor(investor1);
        assert(i1_data.paid_in, true);

        await p2p_lending.payIn(id, 5000, {from: investor2});
        
        await p2p_lending.checkAndStartLoan(id);
        loan = await p2p_lending.getLoan(id);
        
        const newLoanEvent = await p2p_lending.getPastEvents(
          "newLoanStarted",
          {
            filter: {
              _borrower: borrower
            },
            fromBlock: 0
          });
          const id_check = newLoanEvent[0].returnValues._id;

          const inv_check = await p2p_lending.getInvestor(investor1);
          const payment = new BigNumber(inv_check.investor_annuity)/10**18;
          // console.log(inv_check);
          // console.log(payment);
          assert(Math.round(payment) == 219);
          assert(inv_check.paid_in == true);
          assert(id_check == id);
          assert(loan.status == STATUS.Loan);        
    });

    it('is able to pay back', async () => {
      
      const investors = [[investor1, bone(5000), bone(0.05), 0, false, true], [investor2, bone(5000), bone(0.05), 0, false, true]];
      
      await p2p_lending.createLoanApplication(5, bone(10000), bone(12), bone(24), DAI, {from: borrower});
      const Transferevents = await p2p_lending.getPastEvents(
        "Transfer",
        {
          filter: {
            _to: borrower
          },
          fromBlock: 0
        });

        const id = Transferevents[0].returnValues.tokenId;
        await p2p_lending.writeLoanParams(id, investors);
        var loan = await p2p_lending.getLoan(id);
        assert(loan.status, STATUS.PayIn);

        //TODO
        //console.log(investor1);
        await p2p_lending.payIn(id, 5000, {from: investor1});

        const i1_data = await p2p_lending.getInvestor(investor1);
        assert(i1_data.paid_in, true);

        await p2p_lending.payIn(id, 5000, {from: investor2});
        
        await p2p_lending.checkAndStartLoan(id);
        loan = await p2p_lending.getLoan(id);
        
         await p2p_lending.repayLoan(id, 438, { from: borrower });
          
          const inv1_balance = parseInt(await dai.balanceOf(investor1));
          const inv2_balance = parseInt(await dai.balanceOf(investor1));

          //console.log(inv1_balance, inv2_balance);
          
          assert(loan.status == STATUS.Loan);   
          assert(inv1_balance == 6219);
          assert(inv2_balance == 6219);     
    });
    
    it('is able to fully repay loan', async () => {
      
      const investors = [[investor1, bone(5000), bone(0.05), 0, false, true], [investor2, bone(5000), bone(0.05), 0, false, true]];
      
      await p2p_lending.createLoanApplication(5, bone(10000), bone(12), bone(24), DAI, {from: borrower});
      const Transferevents = await p2p_lending.getPastEvents(
        "Transfer",
        {
          filter: {
            _to: borrower
          },
          fromBlock: 0
        });

        const id = Transferevents[0].returnValues.tokenId;
        await p2p_lending.writeLoanParams(id, investors);
        var loan = await p2p_lending.getLoan(id);
        assert(loan.status, STATUS.PayIn);

        //TODO
        //console.log(investor1);
        await p2p_lending.payIn(id, 5000, {from: investor1});

        const i1_data = await p2p_lending.getInvestor(investor1);
        assert(i1_data.paid_in, true);

        await p2p_lending.payIn(id, 5000, {from: investor2});
        
        await p2p_lending.checkAndStartLoan(id);
        loan = await p2p_lending.getLoan(id);
        assert(loan.status == STATUS.Loan);
        
        var loanIsDone = false;
        var i = 0;
        while(!loanIsDone){
          await p2p_lending.repayLoan(id, 438, { from: borrower });
          var status = await p2p_lending.getStatus(id);
          i++
          status == STATUS.Done ? loanIsDone=true:loansIsDone = false;
        }
        loan = await p2p_lending.getLoan(id);

        const inv1_balance = parseInt(await dai.balanceOf(investor1));
        const inv2_balance = parseInt(await dai.balanceOf(investor1));

        //console.log(inv1_balance, inv2_balance);
        
        assert(inv1_balance == 11256);
        assert(inv2_balance == 11256); 
        
        
        assert(loan.status == STATUS.Done);
        assert(loan.repaymentsMade == i);
        assert(loan.repaymentsMade == loan.total_payments/10**18);
    });
   });

  describe('Application - Unhappy Path', async () => {
    // it('credit doesnt start when not all paid in', async () => {

    //   const investors = [[investor1, 5000, 2, false, true], [investor2, 5000, 2, false, true]];
      
    //   await p2p_lending.createLoanApplication(2, 5, 10000, 12, 24, DAI, {from: borrower});
    //   const Transferevents = await p2p_lending.getPastEvents(
    //     "Transfer",
    //     {
    //       filter: {
    //         _to: borrower
    //       },
    //       fromBlock: 0
    //     });

    //     const id = Transferevents[0].returnValues.tokenId;
    //     await p2p_lending.writeLoanParams(id, investors);
    //     var loan = await p2p_lending.getLoan(id);
    //     assert(loan.status, STATUS.PayIn);

    //     //TODO
    //     await p2p_lending.payIn(id, DAI, 5000, {from: investor1});

    //     const i1_data = await p2p_lending.getInvestor(investor1);
    //     assert(i1_data.paid_in, true);
        
    //     await p2p_lending.checkAndStartLoan(id,{from: borrower});
    //     loan = await p2p_lending.getLoan(id);
        
      
    //     assert(loan.status == STATUS.PayIn);
    // });
  });
});

