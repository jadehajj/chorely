import { formatReward, formatBalance } from '@/utils/formatReward';

const moneyChild = { rewardMode: 'money' as const, rewardEmoji: '' };
const emojiChild = { rewardMode: 'emoji' as const, rewardEmoji: '⭐' };

describe('formatReward', () => {
  it('formats money amount with currency symbol', () => {
    expect(formatReward(moneyChild, 12.5, 'AUD')).toBe('A$12.50');
  });
  it('formats emoji amount with emoji unit', () => {
    expect(formatReward(emojiChild, 23, 'AUD')).toBe('23 ⭐');
  });
  it('formats zero money', () => {
    expect(formatReward(moneyChild, 0, 'AUD')).toBe('A$0.00');
  });
  it('formats zero emoji', () => {
    expect(formatReward(emojiChild, 0, 'AUD')).toBe('0 ⭐');
  });
});

describe('formatBalance', () => {
  it('formats large money balance', () => {
    expect(formatBalance(moneyChild, 1234.5, 'AUD')).toBe('A$1,234.50');
  });
});
