const { assert } = require("chai");


const P2PLending = artifacts.require("P2PLending");

contract("P2PLending", function(accounts) {
  const AccountOne = accounts[0];
	const AccountTwo = accounts[1];
  console.log('Borrower Account: ' + AccountOne)
  console.log('Lender Account: ' + AccountTwo)
    
  before(async () => {
		contract = await P2PLending.deployed();
  });

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = contract.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
  })
});
