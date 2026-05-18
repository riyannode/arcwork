// Register Apolo in A2AAgentRegistry and seed reputation stats.
// Not committed. Run: node scripts/register-apolo.mjs

import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  stringToBytes,
  decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'node:fs';

const RPC = 'https://rpc.drpc.testnet.arc.network';
const CHAIN_ID = 5042002;
const A2A_AGENT_REGISTRY = '0xB263336055dD65FF501e36CA39941760D943703C';
const REPUTATION_REGISTRY = '0x9c97CAE866397d94e295632B3BFCF342ea20f1Cc';
const PK_PATH = '/root/.secrets/agent_registry_v2_deployer.pk';

const HERMES_AGENT_ID = '0xe0704f9716c028e812f9a6651af63bf49d8a5476dc32ff04093d217459044234';
const APOLO_REPUTATION_ID = keccak256(stringToBytes('apolo'));
const RECEIPT_HASH = keccak256(stringToBytes(`apolo-decision-seed-${Date.now()}`));

// A2AAgentRegistry.AgentRole: MARKET_DATA=0, TRADER=1, EXECUTOR=2, ORACLE=3, AGGREGATOR=4
const APOLO_ROLE_AGGREGATOR = 4;
const ENDPOINT = 'https://arclayers.xyz/api/a2a/live-signal';
const METADATA_URI = 'arclayer://agent/apolo?skill=decision-engine&role=decision';

const arcTestnet = {
  id: CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC] }, public: { http: [RPC] } },
};

const A2A_AGENT_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'registerAgent',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'role', type: 'uint8' },
      { name: 'endpoint', type: 'string' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [{ name: 'agentId', type: 'bytes32' }],
  },
  {
    type: 'event',
    name: 'AgentRegistered',
    inputs: [
      { indexed: true, name: 'agentId', type: 'bytes32' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'role', type: 'uint8' },
      { indexed: false, name: 'endpoint', type: 'string' },
      { indexed: false, name: 'metadataURI', type: 'string' },
    ],
  },
];

const REPUTATION_ABI = [
  {
    type: 'function',
    name: 'recordInteraction',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'providerAgentId', type: 'bytes32' },
      { name: 'buyerAgentId', type: 'bytes32' },
      { name: 'receiptHash', type: 'bytes32' },
      { name: 'amount', type: 'uint128' },
      { name: 'delivered', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getStats',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'uint64', name: 'callsServed' },
          { type: 'uint64', name: 'callsFailed' },
          { type: 'uint64', name: 'signalsCorrect' },
          { type: 'uint64', name: 'signalsWrong' },
          { type: 'int128', name: 'cumulativePnlBps' },
          { type: 'uint64', name: 'calibrationScore' },
          { type: 'uint128', name: 'totalRevenue' },
          { type: 'int128', name: 'reputationScore' },
        ],
      },
    ],
  },
];

function findAgentIdFromReceipt(receipt) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== A2A_AGENT_REGISTRY.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: A2A_AGENT_REGISTRY_ABI, data: log.data, topics: log.topics });
      if (decoded.eventName === 'AgentRegistered') return decoded.args.agentId;
    } catch {}
  }
  return null;
}

async function main() {
  const pkRaw = readFileSync(PK_PATH, 'utf8').trim();
  const pk = pkRaw.startsWith('0x') ? pkRaw : `0x${pkRaw}`;
  const account = privateKeyToAccount(pk);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http(RPC) });

  console.log('Apolo on-chain registration');
  console.log('controller:', account.address);
  console.log('registry  :', A2A_AGENT_REGISTRY);
  console.log('rep id    :', APOLO_REPUTATION_ID);
  console.log('endpoint  :', ENDPOINT);
  console.log('metadata  :', METADATA_URI);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('native wei:', balance.toString());
  if (balance === 0n) throw new Error('controller has 0 native gas balance');

  console.log('\n1) registerAgent(role=AGGREGATOR/Decision)…');
  const registerTx = await walletClient.writeContract({
    address: A2A_AGENT_REGISTRY,
    abi: A2A_AGENT_REGISTRY_ABI,
    functionName: 'registerAgent',
    args: [APOLO_ROLE_AGGREGATOR, ENDPOINT, METADATA_URI],
  });
  console.log('register tx:', registerTx);
  const registerReceipt = await publicClient.waitForTransactionReceipt({ hash: registerTx });
  console.log('register status:', registerReceipt.status, 'block:', registerReceipt.blockNumber.toString());
  if (registerReceipt.status !== 'success') throw new Error('registerAgent reverted');
  const onchainA2aAgentId = findAgentIdFromReceipt(registerReceipt);
  console.log('a2a agentId:', onchainA2aAgentId ?? '(event parse failed)');

  console.log('\n2) seed Apolo reputation via recordInteraction(provider=apolo, buyer=hermes)…');
  const amount = 10_000n; // 0.01 USDC (6 decimals) demonstration request settlement
  const repTx = await walletClient.writeContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_ABI,
    functionName: 'recordInteraction',
    args: [APOLO_REPUTATION_ID, HERMES_AGENT_ID, RECEIPT_HASH, amount, true],
  });
  console.log('reputation tx:', repTx);
  const repReceipt = await publicClient.waitForTransactionReceipt({ hash: repTx });
  console.log('reputation status:', repReceipt.status, 'block:', repReceipt.blockNumber.toString());
  if (repReceipt.status !== 'success') throw new Error('recordInteraction reverted');

  const stats = await publicClient.readContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_ABI,
    functionName: 'getStats',
    args: [APOLO_REPUTATION_ID],
  });

  console.log('\nApolo REGISTERED + reputation seeded ✓');
  console.log('Apolo reputation id:', APOLO_REPUTATION_ID);
  console.log('callsServed:', stats.callsServed.toString());
  console.log('totalRevenue:', stats.totalRevenue.toString());
  console.log('reputation :', stats.reputationScore.toString());
  console.log('register   : https://arcscan.org/tx/' + registerTx);
  console.log('reputation : https://arcscan.org/tx/' + repTx);
}

main().catch((e) => { console.error(e); process.exit(1); });
