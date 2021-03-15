pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

abstract contract P2PLending is ERC721 {

    constructor() {}
    
    using SafeMath for uint256;
    using SafeMath for uint;

    // Structs
    struct Investor{
        address investor_public_key;
        string name;
        bool EXISTS;
    }

    struct Borrower{
        address borrower_public_key;
        string name;
        bool EXISTS;
    }

    struct LoanApplication{
        //For traversal and indexing
        bool openApp;
        uint applicationId;

        address borrower;
        uint duration; // In months
        uint credit_amount; // Loan amount
        uint interest_rate; //From form
        string otherData; // Encoded string with delimiters (~)

    }

    struct Loan{
        //For traversal and indexing
        bool openLoan;
        uint loanId;

        address borrower;
        address investor;
        uint interest_rate;
        uint duration;
        uint principal_amount;
        uint original_amount;
        uint amount_paid;
        uint startTime;
        uint monthlyCheckpoint;
        uint appId;
    }

    // Global Variables
    mapping (address => uint) balances; // Either investor or borrower => balance

    mapping (address => Investor) public investors; // Investor public key => Investor
    mapping (address => Borrower) public borrowers; // Borrower public key => Borrower

    //Global counters, always increment
    uint numApplications;
    uint numLoans;

    mapping(uint => LoanApplication) public applications;
    mapping(uint => Loan) public loans;

    mapping(address => bool) hasOngoingLoan;
    mapping(address => bool) hasOngoingApplication;
    mapping(address => bool) hasOngoingInvestment;

    function isBorrower(address account) public returns (bool) {return borrowers[account].EXISTS;}
    function getNumApplications() public returns (uint) { return numApplications;}
    function getNumLoans() public returns (uint) { return numLoans;}
    function isInvestor(address account) public returns (bool) {return investors[account].EXISTS;}
    function getTime() public returns (uint){return block.timestamp;}

    // Methods
    function lending() public{
        numLoans = 1;
        numApplications = 1;
    }

    function createInvestor(string memory name) public{
        Investor memory investor;
        investor.name = name;
        investor.investor_public_key = msg.sender;
        investor.EXISTS = true;
        require (borrowers[msg.sender].EXISTS != true);
        investors[msg.sender] = investor;
        hasOngoingInvestment[msg.sender] = false;
        balances[msg.sender] = 0;
    }

    function createBorrower(string memory name) public{
        Borrower memory borrower;
        borrower.name = name;
        borrower.borrower_public_key = msg.sender;
        borrower.EXISTS = true;
        require (investors[msg.sender].EXISTS != true);
        borrowers[msg.sender] = borrower;
        hasOngoingLoan[msg.sender] = false;
        hasOngoingApplication[msg.sender] = false;
        balances[msg.sender] = 0;
    }

    function viewBalance() public returns (uint){
        return balances[msg.sender];
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

    function createApplication(uint duration, uint interest_rate, uint credit_amount, string memory otherData) public{

        require(hasOngoingLoan[msg.sender] == false);
        require(hasOngoingApplication[msg.sender] == false);
        require(isBorrower(msg.sender));
        applications[numApplications] = LoanApplication(true, numApplications, msg.sender, duration, credit_amount, interest_rate, otherData);
        numApplications += 1;
        hasOngoingApplication[msg.sender] = true;
    }

    function grantLoan(uint appId) public{
        //Check sufficient balance
        require(balances[msg.sender] >= applications[appId].credit_amount);
        require(hasOngoingInvestment[msg.sender] == false);

        // Take from sender and give to reciever
        balances[msg.sender] -= applications[appId].credit_amount;
        balances[applications[appId].borrower] += applications[appId].credit_amount;

        // Populate loan object
        loans[numLoans] = Loan(true, numLoans, applications[appId].borrower, msg.sender, applications[appId].interest_rate, applications[appId].duration,
        applications[appId].credit_amount, applications[appId].credit_amount, 0, block.timestamp, 0, appId);
        numLoans += 1;

        applications[appId].openApp = false;
        hasOngoingLoan[applications[appId].borrower] = true;
        hasOngoingInvestment[msg.sender] = true;
    }

    function repayLoan(uint amount, uint estimatedInterest, uint timeSinceLastPayment) public{
        //First check if the payer has enough money
        require(balances[msg.sender] >= amount);

        //Find the loan
        uint id_ = 0;
        for(uint i=1; i<=numLoans; i++)
        {
                if(loans[i].borrower == msg.sender)
                {
                    id_ = i;
                    break;
                }
        }
        Loan memory loan = loans[id_];
        //Loan found

        //Require that a loan is ongoing
        require(loan.openLoan == true);

        //Get some params fromt the loan
        uint p = loan.principal_amount;
        uint r = loan.interest_rate;
        uint checkpoint = loan.monthlyCheckpoint;
        uint n = 12; //Number of times loan is compounded annually


        uint amountWithInterest = estimatedInterest;

        //Get just the interest for that month
        uint interest = amountWithInterest - p;
        uint t = timeSinceLastPayment;

        //Payable Amount should not exceed the amountWithInterest
        require(amountWithInterest>=amount);

        //Payable amount should be at least equal to monthly interest
        require(amount>=interest);

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

        if(loan.principal_amount == 0)
        {
            loans[id_].openLoan = false;
            hasOngoingLoan[msg.sender] = false;
            hasOngoingApplication[msg.sender] = false;
            hasOngoingApplication[loan.investor] = false;
            hasOngoingLoan[loan.investor] = false;
        }
    }

    function ifApplicationOpen(uint index) public returns (bool){
        LoanApplication memory app = applications[index];
        if(app.openApp) return true; else return false;
    }

    function ifLoanOpen(uint index) public returns (bool){
        Loan memory loan = loans[index];
        if (loan.openLoan == true) return true; else return false;
    }

    function getApplicationData(uint index) public returns (uint[] memory numericalData , string memory otherData, address){
        string memory otherData = applications[index].otherData;
        uint[] memory numericalData = new uint[](4);
        numericalData[0] = index;
        numericalData[1] = applications[index].duration;
        numericalData[2] = applications[index].credit_amount;
        numericalData[3] = applications[index].interest_rate;

        address borrower = applications[index].borrower;
        return (numericalData, otherData, borrower);
    }

    function getLoanData(uint index) public returns (uint[] memory numericalData, address, address){
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
    
}