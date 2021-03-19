const { assert } = require("chai");

const P2PLending = artifacts.require("P2PLending");

contract("P2PLending", function(accounts) {
  const AccountOne = accounts[0];
	const AccountTwo = accounts[1];
  console.log('Borrower Account: ' + AccountOne)
  console.log('Lender Account: ' + AccountTwo)
    
  before(async () => {
		p2p_lending_contract = await P2PLending.deployed();
  });

  describe('deployment', async () => {
    it('deploys successfully', async () => {

      const p2p_address = p2p_lending_contract.address
      assert.notEqual(p2p_address, 0x0)
      assert.notEqual(p2p_address, '')
      assert.notEqual(p2p_address, null)
      assert.notEqual(p2p_address, undefined)
    });

    it('has a name', async () => {
      const name = await p2p_lending_contract.name()
      assert.equal(name, 'Embark Loan')
    });
  })

  it("", async() => {
    // Arrange
    let err = null;
  
    // Act
    try {
      await p2p_lending_contract.withdraw(10, { from: AccountOne });
    } catch (error) {
      err = error;
    }
    //console.log(tTokenURI);
    // Assert
    assert.isNotNull(err);
  })

});

