const Lending = artifacts.require("P2PLending");

module.exports = function(deployer) {
   deployer.deploy(Lending);
  };