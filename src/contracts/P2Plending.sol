//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract P2PLending is ERC721("Embark Loan", "EMK") {

    
    using SafeMath for uint256;
    using SafeMath for uint;

    struct Loan{
        uint loanId;   //NFT Id
        address borrower; // Address of borrower
        uint max_interest_rate;
        uint duration;
        uint principal_amount;
        uint principal_balance;
        uint amount_paid;
        uint startTime;
        uint monthlyCheckpoint;
        Status status;
        mapping (address => Investor) investors;
        address[] investors_index;
        bytes32 currency;
    }

    struct Investor{
        address investor_address;
        uint investor_amount;
        uint interest;
        bool paid_in;
        bool exists;
    }

    //Struct for supported tokens as payment
    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    enum Status{
        Application,
        PayIn,
        Loan,
        Done
    }

    //Global counters, always increment, used as Id for NFT
    uint numLoans;
    address admin;

    mapping(uint => Loan) public loans;

    mapping (bytes32 => Token) public tokens;
    bytes32[] tokenList;

    mapping(address => mapping(bytes32 => uint)) public balances;

    constructor () {
        admin = msg.sender;
    }

    function addToken(
        bytes32 ticker,
        address tokenAddress)
        onlyAdmin()
        external {
        tokens[ticker] = Token(ticker, tokenAddress);
        tokenList.push(ticker);
    }

    function deposit(uint amount) public{
        balances[msg.sender] += amount;
    }

    function withdraw(uint amount) public returns (uint){
        require(amount <= balances[msg.sender]);
        balances[msg.sender] -= amount;
        return amount;
    }

    function transfer(address giver, address taker, uint amount) public{
        require(balances[giver] >= amount);
        balances[giver] -= amount;
        balances[taker] += amount;
    }

    function createApplication(uint _duration, uint _max_interest_rate, uint credit_amount, address _merkleTree) public returns(uint256 loanId){ 
        uint256 newId = numLoans.add(1);
        Loan memory _loan = new Loan(
            newId,
            msg.sender,
            _max_interest_rate,
            _duration,
            credit_amount,
            credit_amount,
            0,
            0,
            0,
            Status.Application,
            0,
            [],
            0x444149 // bytes value for 'DAI' string
        );
        _mint(msg.sender, newId);
        loans[newId]=_loan;
        numLoans = newId;
        return newId;
    }


    function writeLoanParams(uint _id, Investor[] _investors) public {
        require(loans[_id] != 0, "LoanId doesnt exist!");
        
        //write Investors into Mapping
        for(uint i = 0; i < _investors.length; i++){
            address tempAd = _investors[i].investor_address;
            loans[_id].investors_index.push(tempAd);
            loans[_id].investors[tempAd] = _investors[i]; 
        }

        loans[_id].status = Status.PreLoan;
        loans[_id].startTime = now;
    }

    function payIn (uint _id, bytes32 ticker, uint256 amount) public {
        require(loans[_id].investor[msg.sender].exists == true);
        require(loans[_id].investor[msg.sender].paid_in == false);
        address borrower = loans[_id].borrower;
        //transferFrom
        IERC20(tokens[ticker].tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        balances[borrower][ticker] = balances[borrower][ticker].add(amount);
        loans[_id].investor[msg.sender].paid_in = true;
    }

    function checkAndStartLoan(uint256 _id) public returns (bool){
        address[] memory ia = loans[_id].investors_index;
        for(uint i = 0; i > ia.length; i++){
            if(loans[_id].investors[ia[i]] == false){
                return false;
            }
        }
        loans[_id].status = Status.Loan;
        return true;
    }

    function repayLoan(uint _id,uint amount, uint amountWithInterest, uint timeSinceLastPayment) public{
        //amount with interest: rest amount
        //First check if the payer has enough money
        require(balances[msg.sender] >= amount);
        require(loans[_id].borrower == msg.sender);
        //Find the loan
       
        Loan memory _loan = loans[_id];
        //Loan found

        //Require that a loan is ongoing
        require(_loan.status == Status.Loan);

        //Get some params fromt the loan
        uint p = _loan.principal_amount;
        // uint r = loan.interest_rate;
        // uint checkpoint = loan.monthlyCheckpoint;
        // uint n = 12; //Number of times loan is compounded annually

        //Get just the interest for that month
        uint interest = amountWithInterest - p;
        // uint t = timeSinceLastPayment;

        //Payable Amount should not exceed the amountWithInterest
        require(amountWithInterest >= amount);

        //Payable amount should be at least equal to monthly interest
        require(amount >= interest);

        // Update balance for interest first
        balances[msg.sender] -= interest;
        balances[loan.investor] += interest;

        amount -= interest;
        loan.monthlyCheckpoint += timeSinceLastPayment;
        loan.amount_paid += interest;

        // Extra payment after interest is paid
        if(amount > 0)
        {
            loan.principal_amount -= amount;
            loan.amount_paid += amount;

            balances[msg.sender] -= amount;
            balances[loan.investor] += amount;
        }
    }

    function getLoanData(uint index) public view returns (uint[] memory, address, address){
        uint[] memory numericalData = new uint[](9);
        numericalData[0] = index;
        numericalData[1] = loans[index].interest_rate;
        numericalData[2] = loans[index].duration;
        numericalData[3] = loans[index].principal_amount;
        numericalData[4] = loans[index].original_amount;
        numericalData[5] = loans[index].amount_paid;
        numericalData[6] = loans[index].startTime;
        numericalData[7] = loans[index].monthlyCheckpoint;
        numericalData[8] = loans[index].appId;

        return (numericalData, loans[index].borrower, loans[index].investor);
    }

     modifier onlyAdmin() {
        require(msg.sender == admin, 'only admin');
        _;
    }
    
}