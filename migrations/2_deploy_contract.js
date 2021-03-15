const LoanAuction = artifacts.require("LoanAuction");

module.exports = function(deployer) {
  deployer.deploy(LoanAuction);
};

// const Lending = artifacts.require("P2Plending");

// module.exports = function(deployer) {
//   deployer.deploy(Lending);
// };