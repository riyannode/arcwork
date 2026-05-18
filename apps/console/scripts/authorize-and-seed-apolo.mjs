// Authorize deployer as oracle on ReputationRegistry, then seed Apolo reputation.
// Uses Ignia PK from arclayer-private-keys-20260518-173230.zip in-memory (no disk write).

import { execFileSync } from 'node:child_process';
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RPC = 'https://rpc.drpc.testnet.arc.network';
const REPUTATION = '0x9c97CAE866397d94e295632B3BFCF342ea20f1Cc';
const ZIP = '/root/arclayer-private-keys-20260518-173230.zip';
const IGNIA_FILE = 'tmp_ignia_burner_1.pk';
const DEPLOYER = '0x9fC73BE13EAB35DD55547f89b1aD2663b9038eE5';

const HERMES_ID = '0xe0704f9716c028e812f9a6651af63bf49d8a5476dc32ff04093d217459044234';
const APOLO_ID = keccak256(stringToBytes('apolo'));
const RECEIPT = keccak256(stringToBytes(`apolo-decision-seed-${Date.now()}`));

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

const arc = {
  id: 5042002, name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
};

// Pull Ignia PK from zip into memory only.
const igniaRaw = execFileSync('unzip', ['-p', ZIP, IGNIA_FILE], { encoding: 'utf8' }).trim();
const igniaPk = igniaRaw.startsWith('0x') ? igniaRaw : `0x${igniaRaw}`;
const ignia = privateKeyToAccount(igniaPk);

const pub = createPublicClient({ chain: arc, transport: http(RPC) });
const wallet = createWalletClient({ account: ignia, chain: arc, transport: http(RPC) });

const owner = await pub.readContract({ address: REPUTATION, abi: ABI, functionName: 'owner' });
console.log('reputation owner :', owner);
console.log('signing as       :', ignia.address);
if (owner.toLowerCase() !== ignia.address.toLowerCase()) throw new Error('signer is not owner');

const bal = await pub.getBalance({ address: ignia.address });
console.log('ignia gas wei    :', bal.toString());
if (bal === 0n) throw new Error('ignia has 0 native balance');

const authedDeployer = await pub.readContract({ address: REPUTATION, abi: ABI, functionName: 'authorizedOracles', args: [DEPLOYER] });
console.log('deployer authed? :', authedDeployer);

if (!authedDeployer) {
  console.log('\nauthorizing deployer as oracle…');
  const txA = await wallet.writeContract({ address: REPUTATION, abi: ABI, functionName: 'authorizeOracle', args: [DEPLOYER] });
  console.log('authorize tx     :', txA);
  const rA = await pub.waitForTransactionReceipt({ hash: txA });
  console.log('status           :', rA.status, 'block', rA.blockNumber.toString());
  if (rA.status !== 'success') throw new Error('authorizeOracle reverted');
} else {
  console.log('deployer already authorized — skipping');
}

console.log('\nseeding Apolo reputation (call from owner = also authorized)…');
const txB = await wallet.writeContract({
  address: REPUTATION, abi: ABI, functionName: 'recordInteraction',
  args: [APOLO_ID, HERMES_ID, RECEIPT, 10_000n, true],
});
console.log('seed tx          :', txB);
const rB = await pub.waitForTransactionReceipt({ hash: txB });
console.log('status           :', rB.status, 'block', rB.blockNumber.toString());

const stats = await pub.readContract({ address: REPUTATION, abi: ABI, functionName: 'getStats', args: [APOLO_ID] });
console.log('\napolo on-chain stats:');
console.log('  callsServed     :', stats.callsServed.toString());
console.log('  totalRevenue    :', stats.totalRevenue.toString(), '(uUSDC, 6 dec)');
console.log('  reputationScore :', stats.reputationScore.toString());
console.log('\narcscan:');
console.log('  https://arcscan.org/tx/' + txB);
