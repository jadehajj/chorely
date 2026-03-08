export interface RewardChild {
  rewardMode: 'money' | 'emoji';
  rewardEmoji: string;
}

export function formatReward(child: RewardChild, amount: number, currency: string): string {
  if (child.rewardMode === 'emoji') {
    return `${Math.floor(amount)} ${child.rewardEmoji}`;
  }
  return formatMoney(amount, currency);
}

export function formatBalance(child: RewardChild, amount: number, currency: string): string {
  if (child.rewardMode === 'emoji') {
    return `${Math.floor(amount)} ${child.rewardEmoji}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
