import { createPublicClient, createWalletClient, http, keccak256, stringToBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'node:fs';

const RPC = 'https://rpc.drpc.testnet.arc.network';
const REPUTATION = '0x9c97CAE866397d94e295632B3BFCF342ea20f1Cc';
const PK = readFileSync('/root/.secrets/agent_registry_v2_deployer.pk', 'utf8').trim();
const account = privateKeyToAccount(PK.startsWith('0x') ? PK : `0x${PK}`);

const HERMES_AGENT_ID = '0xe0704f9716c028e812f9a6651af63bf49d8a5476dc32ff04093d217459044234';
const APOLO_ID = keccak256(stringToBytes('apolo'));
const RECEIPT_HASH = keccak256(stringToBytes(`apolo-decision-seed-${Date.now()}`));

const ABI = [
  { type: 'function', name: 'owner', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'authorizedOracles', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'authorizeOracle', stateMutability: 'nonpayable', inputs: [{ type: 'address', name: 'oracle' }], outputs: [] },
  {
    type: 'function', name: 'recordInteraction', stateMutability: 'nonpayable',
    inputs: [
      { name: 'providerAgentId', type: 'bytes32' },
      { name: 'buyerAgentId', type: 'bytes32' },
      { name: 'receiptHash', type: 'bytes32' },
      { name: 'amount', type: 'uint128' },
      { name: 'delivered', type: 'bool' },
    ], outputs: [],
  },
  {
    type: 'function', name: 'getStats', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [{
      type: 'tuple', components: [
        { type: 'uint64', name: 'callsServed' }, { type: 'uint64', name: 'callsFailed' },
        { type: 'uint64', name: 'signalsCorrect' }, { type: 'uint64', name: 'signalsWrong' },
        { type: 'int128', name: 'cumulativePnlBps' }, { type: 'uint64', name: 'calibrationScore' },
        { type: 'uint128', name: 'totalRevenue' }, { type: 'int128', name: 'reputationScore' },
      ],
    }],
  },
];

const arc = { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } } };
const pub = createPublicClient({ chain: arc, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: arc, transport: http(RPC) });

const owner = await pub.readContract({ address: REPUTATION, abi: ABI, functionName: 'owner' });
const authed = await pub.readContract({ address: REPUTATION, abi: ABI, functionName: 'authorizedOracles', args: [account.address] });
console.log('reputation owner   :', owner);
console.log('our wallet         :', account.address);
console.log('we are owner?      :', owner.toLowerCase() === account.address.toLowerCase());
console.log('we are authorized? :', authed);

if (!authed && owner.toLowerCase() === account.address.toLowerCase()) {
  console.log('\nauthorizing self as oracle…');
  const tx = await wallet.writeContract({ address: REPUTATION, abi: ABI, functionName: 'authorizeOracle', args: [account.address] });
  console.log('tx:', tx);
  const r = await pub.waitForTransactionReceipt({ hash: tx });
  console.log('status:', r.status);
}

if (!authed && owner.toLowerCase() !== account.address.toLowerCase()) {
  console.log('not owner and not oracle — cannot seed. apolo registration is enough.');
  process.exit(0);
}

console.log('\nseeding apolo reputation…');
const tx = await wallet.writeContract({
  address: REPUTATION, abi: ABI, functionName: 'recordInteraction',
  args: [APOLO_ID, HERMES_AGENT_ID, RECEIPT_HASH, 10000n, true],
});
console.log('seed tx:', tx);
const r = await pub.waitForTransactionReceipt({ hash: tx });
console.log('status:', r.status, 'block:', r.blockNumber.toString());

const stats = await pub.readContract({ address: REPUTATION, abi: ABI, functionName: 'getStats', args: [APOLO_ID] });
console.log('\napolo stats:', {
  callsServed: stats.callsServed.toString(),
  totalRevenue: stats.totalRevenue.toString(),
  reputationScore: stats.reputationScore.toString(),
});
console.log('seed tx: https://arcscan.org/tx/' + tx);
