const LoanAuction = artifacts.require("LoanAuction");
const Lending = artifacts.require("P2PLending");

module.exports = function(deployer) {
   deployer.deploy(LoanAuction);
   deployer.deploy(Lending);
  };