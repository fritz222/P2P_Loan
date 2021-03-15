pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract LoanAuction is ERC721 {
    
  using SafeMath for uint256;  

  mapping(uint256 => LoanItem) private _loanItems; 
  address public owner;   //owner
  
  //variables that are dynamic or change
  uint256 public _tokenIds;  //Unique Image ID that are tokenized
  uint256 public _loanItemIds; //Unique ID up images for sale but not tokenized
  bool public canceled;
  mapping(uint256=>mapping(address => uint256)) public fundsByBidder; //map tokenid to fundsByBidder
  mapping(uint256=>bidding) public bid;  //mapping tokenid to bidding
  bool auctionstarted = false;  //to check if auction started
  bool firsttime = false;  //to mart first successfull bid

   //Events
    event LogBid(address bidder, uint bid, address highestBidder, uint highestBid, uint highestBindingBid);   
    event LogWithdrawal(address withdrawer, address withdrawalAccount, uint amount);
    event LogCanceled();

  //Art Item 
  struct LoanItem {
        address payable seller; //address of seller
        uint256 minbid; //minimum price by artist
        string tokenURI;  //IPFS URL
        bool exists;    //token by id exists or not
        uint bidIncrement; //incremention of bid
    }
    
    struct bidding{
     uint highestBindingBid; //highestBindingBid of the tokenid
     address payable highestBidder;
    }


  constructor() public ERC721("DART", "ART")  //Initializing ERC721 
  {   
    owner=msg.sender;
  }
  
   //modifiers
  
  modifier loanItemExist(uint256 id) {   //check if item exists
        require(_loanItems[id].exists, "Not Found");
        _;
    }
    
    modifier onlyNotOwner(uint256 id) {            //Check if owner is calling
      LoanItem memory loanItem = _loanItems[id];   
      if (msg.sender == loanItem.seller) revert();
    _;
     }

    modifier onlyNotCanceled{        //Auction only if is not cancelled
    if (canceled) revert();
    _;
     }
    modifier onlyOwner(uint256 id)
     {
        LoanItem memory loanItem = _loanItems[id];   
        if (msg.sender != loanItem.seller) revert();
         _;
     }
     
    modifier minbid(uint256 id)
    {
        LoanItem memory loanItem = _loanItems[id];
        if(msg.value<loanItem.minbid) revert();
        _;
    }

  function addLoanItem(uint256 price, string memory tokenURI, uint _bidincrement) public {
        require(price >= 0, "Price cannot be lesss than 0");

        _loanItemIds++;
        _loanItems[_loanItemIds] = LoanItem(msg.sender, price, tokenURI, true, _bidincrement );
    }

  function getLoanItem(uint256 id)   //get Loan item info
        public
        view
        loanItemExist(id)
        returns (
            uint256,
            uint256,
            string memory,
            uint256
        )
    {
        LoanItem memory loanItem = _loanItems[id];
        bidding memory bid = bid[id]; 
        return (id, loanItem.minbid, loanItem.tokenURI, bid.highestBindingBid);
    }
    
    //auction functions : 
    
    //Cancel auction
    function cancelAuction(uint256 id) public payable
    onlyOwner(id)
    onlyNotCanceled()
    returns (bool success)
   {
    canceled = true;
    
    if(auctionstarted==true)  //mint token if auctionstarted
    {
    LoanItem memory loanItem = _loanItems[id];   
    bidding storage bid = bid[id]; 
    _tokenIds++; 
    _safeMint(msg.sender, _tokenIds);
    _setTokenURI(_tokenIds, loanItem.tokenURI);
     // the auction's owner should be allowed to withdraw the highestBindingBid
    
    if (bid.highestBindingBid == 0) revert();
    fundsByBidder[id][bid.highestBidder] -= bid.highestBindingBid;
    // send the funds
    if (!msg.sender.send(bid.highestBindingBid)) revert();
        } 
    
    LogCanceled();
    return true;
   }
   
   function placeBid(uint256 id) public
    payable
    onlyNotCanceled
    onlyNotOwner(id)
    minbid(id)
    
    returns (bool success)
{
    // reject payments of 0 ETH
    if (msg.value == 0) revert();
    
    // calculate the user's total bid based on the current amount they've sent to the contract
    // plus whatever has been sent with this transaction
    bidding storage bid = bid[id]; 
    auctionstarted = true;
    LoanItem memory loanItem = _loanItems[id];  

    uint newBid = fundsByBidder[id][msg.sender] + msg.value;
    

    // if the user isn't even willing to overbid the highest binding bid, there's nothing for us
    // to do except revert the transaction.
    if (newBid <= bid.highestBindingBid) revert();

    // grab the previous highest bid (before updating fundsByBidder, in case msg.sender is the
    // highestBidder and is just increasing their maximum bid).
    uint highestBid = fundsByBidder[id][bid.highestBidder];

    fundsByBidder[id][msg.sender] = newBid;

    if (newBid <= highestBid) {
        // if the user has overbid the highestBindingBid but not the highestBid, we simply
        // increase the highestBindingBid and leave highestBidder alone.

        // note that this case is impossible if msg.sender == highestBidder because you can never
        // bid less ETH than you already have.
        if(newBid+loanItem.bidIncrement> highestBid)
        {
            bid.highestBindingBid = highestBid;
        }
        else
        {
            bid.highestBindingBid = newBid+loanItem.bidIncrement;
        }
    } else {
        // if msg.sender is already the highest bidder, they must simply be wanting to raise
        // their maximum bid, in which case we shouldn't increase the highestBindingBid.

        // if the user is NOT highestBidder, and has overbid highestBid completely, we set them
        // as the new highestBidder and recalculate highestBindingBid.

        if (msg.sender != bid.highestBidder) {
            bid.highestBidder = msg.sender;
        if(newBid+loanItem.bidIncrement> highestBid)
        {   if(firsttime==false)
            bid.highestBindingBid = highestBid;
            else
            {bid.highestBindingBid = loanItem.minbid + loanItem.bidIncrement;
            firsttime=true;
            }
        }
        else
        {
            bid.highestBindingBid = newBid+loanItem.bidIncrement;
        }
        }
        highestBid = newBid;
    }

    LogBid(msg.sender, newBid, bid.highestBidder, highestBid, bid.highestBindingBid);
    return true;
    }
    
    function withdraw(uint256 id) public payable onlyNotOwner(id)
    returns (bool success) 
{   
    require(canceled==true);
    require(auctionstarted==true);
    address payable withdrawalAccount;
    uint withdrawalAmount;
    bidding storage bid = bid[id]; 
    
        if (msg.sender == bid.highestBidder) {
            // the highest bidder should only be allowed to withdraw the difference between their
            // highest bid and the highestBindingBid
            withdrawalAccount = bid.highestBidder;
            withdrawalAmount = fundsByBidder[id][bid.highestBidder];
        }
        else {
            // anyone who participated but did not win the auction should be allowed to withdraw
            // the full amount of their funds
            withdrawalAccount = msg.sender;
            withdrawalAmount = fundsByBidder[id][withdrawalAccount];
        }

    if (withdrawalAmount == 0) revert();

    fundsByBidder[id][withdrawalAccount] -= withdrawalAmount;

    // send the funds
    if (!msg.sender.send(withdrawalAmount)) revert();

    LogWithdrawal(msg.sender, withdrawalAccount, withdrawalAmount);

    return true;
}
        
}