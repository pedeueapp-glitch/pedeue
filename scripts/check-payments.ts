import { prisma } from "../src/lib/prisma";

async function main() {
  const transactions = await (prisma as any).platform_transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log("ULTIMAS TRANSAÇÕES:");
  transactions.forEach((t: any) => {
    console.log(`- ID: ${t.id} | Status: ${t.status} | Amount: ${t.amount} | TXID: ${t.externalId} | Created: ${t.createdAt}`);
  });
}

main().catch(console.error);
