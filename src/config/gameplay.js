export const GAMEPLAY = {
  // Mobile-first logical canvas: 19.5:9, close to modern phone landscape screens.
  width: 1560,
  height: 720,
  worldWidth: 4200,
  gravity: 1100,
  moveSpeed: 300,
  jumpSpeed: 570,
  dodgeSpeed: 760,
  dodgeDuration: 180,
  dodgeCooldown: 650,

  // Phase 3 combat tuning.
  playerMaxHealth: 100,
  enemyMaxHealth: 70,
  enemySpeed: 92,
  enemyAggroRange: 420,
  enemyAttackRange: 78,
  enemyAttackDamage: 12,
  enemyAttackCooldown: 1050,
  playerInvulnerability: 650,
  comboReset: 520,
  attackDamage: [22, 26, 36],
  attackReach: [88, 98, 118],
  attackDuration: [210, 230, 300]
};
