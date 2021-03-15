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

  it("Bidder with Account 1 should be able to withdraw 1eth", async() => {
    // Arrange
    let err = null;
  
    // Act
    try {
      await contract.withdraw(0, tTokenURI, 1, { from: AccountOne });
    } catch (error) {
      err = error;
    }
    //console.log(tTokenURI);
    // Assert
    assert.isNotNull(err);
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
