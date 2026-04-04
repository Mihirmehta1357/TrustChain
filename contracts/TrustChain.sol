// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrustChain
 * @notice Uncollateralized P2P lending with on-chain interest, 
 *         dynamic TrustScore, and community endorsements.
 */
contract TrustChain {

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum LoanStatus { Pending, Funded, Repaid }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Loan {
        uint256 id;
        address borrower;
        address funder;
        uint256 principal;       // original amount requested (wei)
        uint256 interestRate;    // flat rate %, e.g. 12 = 12%
        uint256 totalOwed;       // principal + interest (computed at origination)
        string  purpose;
        LoanStatus status;
        uint256 fundedAt;        // block.timestamp when funded (for future time-based interest upgrade)
    }

    struct User {
        bool     isRegistered;
        uint256  trustScore;     // 0–100+, starts at base
        uint256  loansRepaid;    // successful repayment count
        uint256  loansDefaulted; // future: penalty logic hook
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(address  => User)                          public users;
    mapping(uint256  => Loan)                          public loans;
    mapping(address  => mapping(address => bool))      public hasEndorsed; // endorser → endorsee → bool

    uint256 public loanCounter;

    // TrustScore reward config (owner-configurable in production)
    uint256 public constant REPAY_SCORE_REWARD    = 10;
    uint256 public constant ENDORSE_SCORE_REWARD  = 5;
    uint256 public constant FUND_SCORE_REWARD     = 2;
    uint256 public constant BASE_TRUST_SCORE      = 50;

    // ─── Events ───────────────────────────────────────────────────────────────

    event UserRegistered  (address indexed user,     uint256 initialScore);
    event LoanRequested   (uint256 indexed loanId,   address indexed borrower, uint256 principal, uint256 interestRate, string purpose);
    event LoanFunded      (uint256 indexed loanId,   address indexed funder,   uint256 principal);
    event LoanRepaid      (uint256 indexed loanId,   address indexed borrower, uint256 totalRepaid);
    event UserEndorsed    (address indexed endorser,  address indexed endorsee, uint256 newScore);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "TrustChain: caller not registered");
        _;
    }

    // ─── User Functions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new user. TrustScore initialised to BASE.
     */
    function registerUser() external {
        require(!users[msg.sender].isRegistered, "TrustChain: already registered");
        users[msg.sender] = User({
            isRegistered:   true,
            trustScore:     BASE_TRUST_SCORE,
            loansRepaid:    0,
            loansDefaulted: 0
        });
        emit UserRegistered(msg.sender, BASE_TRUST_SCORE);
    }

    // ─── Internal: Interest Tier ──────────────────────────────────────────────

    /**
     * @dev Derives flat interest rate from TrustScore.
     *      High trust  → low rate (less risky for lender).
     */
    function _interestRate(uint256 score) internal pure returns (uint256) {
        if (score >= 80) return 12; // Low risk
        if (score >= 60) return 16; // Medium risk
        return 20;                  // High risk
    }

    // ─── Borrower Functions ───────────────────────────────────────────────────

    /**
     * @notice Request a new loan. Interest rate locked at origination.
     */
    function requestLoan(uint256 _principal, string calldata _purpose)
        external onlyRegistered
    {
        require(_principal > 0, "TrustChain: principal must be > 0");

        uint256 score    = users[msg.sender].trustScore;
        uint256 rate     = _interestRate(score);
        uint256 interest = (_principal * rate) / 100;
        uint256 owed     = _principal + interest;

        loans[loanCounter] = Loan({
            id:           loanCounter,
            borrower:     msg.sender,
            funder:       address(0),
            principal:    _principal,
            interestRate: rate,
            totalOwed:    owed,
            purpose:      _purpose,
            status:       LoanStatus.Pending,
            fundedAt:     0
        });

        emit LoanRequested(loanCounter, msg.sender, _principal, rate, _purpose);
        loanCounter++;
    }

    /**
     * @notice Borrower repays principal + interest to the funder.
     * @dev    Send exactly loan.totalOwed as msg.value.
     */
    function repayLoan(uint256 _loanId) external payable onlyRegistered {
        Loan storage loan = loans[_loanId];

        require(loan.status  == LoanStatus.Funded,  "TrustChain: loan not active");
        require(msg.sender   == loan.borrower,       "TrustChain: only borrower can repay");
        require(msg.value    == loan.totalOwed,      "TrustChain: must send exact amount owed");

        loan.status = LoanStatus.Repaid;

        // Route repayment directly to funder (no intermediate hold)
        (bool ok, ) = payable(loan.funder).call{value: msg.value}("");
        require(ok, "TrustChain: transfer to funder failed");

        // Reward borrower TrustScore
        users[msg.sender].trustScore  += REPAY_SCORE_REWARD;
        users[msg.sender].loansRepaid += 1;

        emit LoanRepaid(_loanId, msg.sender, msg.value);
    }

    // ─── Lender Functions ──────────────────────────────────────────────────────

    /**
     * @notice Fund a pending loan. Send exactly loan.principal as msg.value.
     */
    function fundLoan(uint256 _loanId) external payable onlyRegistered {
        Loan storage loan = loans[_loanId];

        require(loan.status  == LoanStatus.Pending,  "TrustChain: loan not available");
        require(msg.sender   != loan.borrower,        "TrustChain: cannot fund own loan");
        require(msg.value    == loan.principal,       "TrustChain: send exact principal");

        loan.status   = LoanStatus.Funded;
        loan.funder   = msg.sender;
        loan.fundedAt = block.timestamp;

        // Route principal directly to borrower
        (bool ok, ) = payable(loan.borrower).call{value: msg.value}("");
        require(ok, "TrustChain: transfer to borrower failed");

        // Small trust reward for lenders
        users[msg.sender].trustScore += FUND_SCORE_REWARD;

        emit LoanFunded(_loanId, msg.sender, msg.value);
    }

    // ─── Community / Endorsement ───────────────────────────────────────────────

    /**
     * @notice Endorse another registered user, boosting their TrustScore.
     *         Each endorser can only endorse the same address once.
     */
    function endorseUser(address _endorsee) external onlyRegistered {
        require(users[_endorsee].isRegistered,          "TrustChain: endorsee not registered");
        require(msg.sender != _endorsee,                 "TrustChain: cannot endorse yourself");
        require(!hasEndorsed[msg.sender][_endorsee],     "TrustChain: already endorsed");

        hasEndorsed[msg.sender][_endorsee] = true;
        users[_endorsee].trustScore += ENDORSE_SCORE_REWARD;

        emit UserEndorsed(msg.sender, _endorsee, users[_endorsee].trustScore);
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    function getLoanCount() external view returns (uint256) {
        return loanCounter;
    }

    function getTrustScore(address _user) external view returns (uint256) {
        return users[_user].trustScore;
    }

    function computeInterestRate(address _user) external view returns (uint256) {
        return _interestRate(users[_user].trustScore);
    }
}
