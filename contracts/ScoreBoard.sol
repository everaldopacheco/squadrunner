// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SquadRunnerBoard
 * @dev Endless runner leaderboard on Monad Testnet with score signature verification.
 */
contract SquadRunnerBoard {

    struct Entry {
        address player;
        uint32  score;
        uint8   charId;     // 0=Chog, 1=Emo, 2=Moncock, 3=Bob, 4=Monigga
        uint32  timestamp;
    }

    address public signer;
    address public owner;

    mapping(address => uint32) public bestScore;
    Entry[] public leaderboard;
    uint256 public constant MAX_ENTRIES = 100;

    event ScoreSubmitted(address indexed player, uint32 score, uint8 charId);
    event NewRecord(address indexed player, uint32 score);

    constructor(address _signer) {
        signer = _signer;
        owner  = msg.sender;
    }

    function submitScore(
        uint32 score,
        uint8  charId,
        bytes  calldata signature
    ) external {
        // 1. Verify backend signature
        bytes32 hash = keccak256(abi.encodePacked(
            msg.sender, score, charId, block.chainid
        ));
        bytes32 ethHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32", hash
        ));
        require(_recover(ethHash, signature) == signer, "Invalid signature");

        // 2. Update stats
        if (score > bestScore[msg.sender]) {
            bestScore[msg.sender] = score;
            emit NewRecord(msg.sender, score);
        }

        // 3. Entry to leaderboard
        _insertLeaderboard(msg.sender, score, charId);

        emit ScoreSubmitted(msg.sender, score, charId);
    }

    function _insertLeaderboard(
        address player,
        uint32  score,
        uint8   charId
    ) internal {
        // Remove old entry if exists and score is better
        for (uint j = 0; j < leaderboard.length; j++) {
            if (leaderboard[j].player == player) {
                if (score <= leaderboard[j].score) return;
                leaderboard[j] = leaderboard[leaderboard.length - 1];
                leaderboard.pop();
                break;
            }
        }

        Entry memory newEntry = Entry(player, score, charId, uint32(block.timestamp));

        if (leaderboard.length < MAX_ENTRIES) {
            leaderboard.push(newEntry);
        } else if (score > leaderboard[leaderboard.length - 1].score) {
            leaderboard[leaderboard.length - 1] = newEntry;
        } else {
            return;
        }

        // Insertion Sort
        uint i = leaderboard.length - 1;
        while (i > 0 && leaderboard[i].score > leaderboard[i - 1].score) {
            Entry memory temp = leaderboard[i - 1];
            leaderboard[i - 1] = leaderboard[i];
            leaderboard[i] = temp;
            i--;
        }
    }

    function getLeaderboard() external view returns (Entry[] memory) {
        return leaderboard;
    }

    function _recover(bytes32 hash, bytes calldata sig) internal pure returns (address) {
        require(sig.length == 65, "Bad signature length");
        bytes32 r;
        bytes32 s;
        uint8   v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        return ecrecover(hash, v, r, s);
    }

    function setSigner(address _signer) external {
        require(msg.sender == owner, "Not owner");
        signer = _signer;
    }

    function transferOwnership(address _newOwner) external {
        require(msg.sender == owner, "Not owner");
        owner = _newOwner;
    }
}
