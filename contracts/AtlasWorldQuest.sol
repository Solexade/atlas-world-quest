// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

/// @notice Records game-server-authorized testnet scores. No tokens, money or redemption rights.
/// @dev The trusted scorer checks answers offchain. A record is not proof of human identity or asset ownership.
contract AtlasWorldQuest is EIP712 {
    address public immutable scorer;
    mapping(address => uint256) public totalPoints;
    mapping(address => mapping(uint256 => bool)) public recordedDay;
    mapping(bytes32 => bool) public recordedRound;
    bytes32 public constant SCORE_TYPEHASH = keccak256('Score(address player,bytes32 roundId,uint256 day,uint256 points,uint256 deadline)');
    event ScoreRecorded(address indexed player, bytes32 indexed roundId, uint256 indexed day, uint256 points);
    constructor(address trustedScorer) EIP712('AtlasWorldQuest','1') {
        require(trustedScorer != address(0), 'Zero scorer');
        scorer = trustedScorer;
    }
    function recordScore(bytes32 roundId, uint256 day, uint256 points, uint256 deadline, bytes calldata signature) external {
        require(block.chainid == 46630, 'Wrong chain');
        require(block.timestamp <= deadline, 'Expired receipt');
        require(day <= block.timestamp / 1 days, 'Future day');
        require(points <= 650, 'Score out of range');
        require(!recordedDay[msg.sender][day] && !recordedRound[roundId], 'Already recorded');
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(SCORE_TYPEHASH,msg.sender,roundId,day,points,deadline)));
        require(ECDSA.recover(digest,signature) == scorer, 'Invalid scorer');
        recordedDay[msg.sender][day]=true;
        recordedRound[roundId]=true;
        totalPoints[msg.sender]+=points;
        emit ScoreRecorded(msg.sender,roundId,day,points);
    }
}
