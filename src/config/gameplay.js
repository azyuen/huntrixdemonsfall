export const GAMEPLAY = {
  width: 1560,
  height: 720,
  worldWidth: 4200,
  gravity: 1100,
  jumpSpeed: 570,
  dodgeDuration: 180,
  dodgeCooldown: 650,

  enemyMaxHealth: 70,
  enemySpeed: 92,
  enemyAggroRange: 420,
  enemyAttackRange: 78,
  enemyAttackDamage: 12,
  enemyAttackCooldown: 1050,
  playerInvulnerability: 650,

  hunters: {
    rumi: {
      name: 'RUMI', role: 'Balanced', texture: 'rumi', health: 100,
      moveSpeed: 300, dodgeSpeed: 760, comboReset: 520,
      attackDamage: [22,26,36], attackReach: [88,98,118], attackDuration: [210,230,300],
      accent: 0xff75c8
    },
    mira: {
      name: 'MIRA', role: 'Power + Reach', texture: 'mira', health: 110,
      moveSpeed: 275, dodgeSpeed: 700, comboReset: 610,
      attackDamage: [27,32,44], attackReach: [145,175,205], attackDuration: [285,315,380],
      accent: 0x9d78ff
    },
    zoey: {
      name: 'ZOEY', role: 'Speed + Range', texture: 'zoey', health: 88,
      moveSpeed: 335, dodgeSpeed: 840, comboReset: 430,
      attackDamage: [16,18,24], attackReach: [68,74,80], attackDuration: [145,155,195],
      accent: 0x6edcff
    }
  }
};
