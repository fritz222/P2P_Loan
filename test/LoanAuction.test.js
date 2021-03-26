// const LoanAuction = artifacts.require("LoanAuction");

// contract("LoanAuction", function(accounts) {
//   const AccountOne = accounts[0];
// 	const AccountTwo = accounts[1];
//   console.log('Account 1: ' + AccountOne)
//   console.log('Account 2: ' + AccountTwo)
    
//   before(async () => {
// 		contract = await LoanAuction.deployed();
//   });

//   describe('deployment', async () => {
//     it('deploys successfully', async () => {
//       const address = contract.address
//       assert.notEqual(address, 0x0)
//       assert.notEqual(address, '')
//       assert.notEqual(address, null)
//       assert.notEqual(address, undefined)
//     })

//     it('has a name', async () => {
//       const name = await contract.name()
//       assert.equal(name, 'Embark Loan Auction')
//     })

//     it('has a symbol', async () => {
//       const symbol = await contract.symbol()
//       assert.equal(symbol, 'EMKa')
//     })

//   })
  

// 	it('It should set an Loan item', async()=>{
//     let error = null;
//     try{
//     const LoanAuction = await LoanAuction.deployed();
//     await LoanAuction.addLoanItem(100, "ipfshash", 10);
//     }
//     catch(error)
//     {error=error;}
//     assert.isNull(error);
//   });


// it("should not add Loan item with price of zero", async () => {
//   // Arrange
//   let err = null;

//   // Act
//   try {
//     await contract.addLoanItem(0, tTokenURI, 10, { from: AccountTwo });
//   } catch (error) {
//     err = error;
//   }

//   // Assert
//   assert.isNotNull(err);
// });

// it("should not cancel an auction that does not exists",async() =>{
//   let err=null;

//   try{
//     await contract.cancelAuction(100, {from: AccountOne});
//   }
//   catch(error)
//   {
//     err=error;
//   }
//   assert.isNotNull(err);
// });

// it("Bidder with Account 1 should be able to bid 1eth", async() => {
//   // Arrange
//   let err = null;

//   // Act
//   try {
//     await contract.placeBid(0, tTokenURI, 1, { from: AccountOne });
//   } catch (error) {
//     err = error;
//   }
//   //console.log(tTokenURI);
//   // Assert
//   assert.isNotNull(err);
// });

// it("Bidder with Account 1 should be able to withdraw 1eth", async() => {
//   // Arrange
//   let err = null;

//   // Act
//   try {
//     await contract.withdraw(0, tTokenURI, 1, { from: AccountOne });
//   } catch (error) {
//     err = error;
//   }
//   //console.log(tTokenURI);
//   // Assert
//   assert.isNotNull(err);
// });

// });
