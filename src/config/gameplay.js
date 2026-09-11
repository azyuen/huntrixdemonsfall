export const GAMEPLAY = {
  width: 1560, height: 720, worldWidth: 4200, gravity: 1100,
  jumpSpeed: 570, dodgeDuration: 180, dodgeCooldown: 650,
  enemyAggroRange: 460, playerInvulnerability: 650,
  fallDamage: 20, fallSyncLoss: 12,
  syncHitGain: 6, syncFinisherGain: 10,

  // Current grunt defaults retained for the existing combat loop.
  enemyMaxHealth: 70, enemySpeed: 92, enemyAttackRange: 78,
  enemyAttackDamage: 12, enemyAttackCooldown: 1050,

  // Phase 6 archetypes: these are now the source values for the encounter pass.
  enemies: {
    grunt: { name:'STALKER', health:70, speed:92, range:78, damage:12, cooldown:1050, width:48, height:76, color:0x271a35, outline:0x8d5b91 },
    brute: { name:'BRUTE', health:135, speed:58, range:92, damage:20, cooldown:1450, width:66, height:92, color:0x321d35, outline:0xa36a82 },
    ranged: { name:'WRAITH', health:52, speed:72, range:360, damage:10, cooldown:1650, width:44, height:68, color:0x202642, outline:0x7083a8 }
  },

  hunters: {
    rumi: { name:'RUMI', role:'Balanced', texture:'rumi', health:100, moveSpeed:300, dodgeSpeed:760, comboReset:520, attackDamage:[22,26,36], attackReach:[88,98,118], attackDuration:[210,230,300], accent:0xff75c8 },
    mira: { name:'MIRA', role:'Power + Reach', texture:'mira', health:110, moveSpeed:275, dodgeSpeed:700, comboReset:610, attackDamage:[27,32,44], attackReach:[145,175,205], attackDuration:[285,315,380], accent:0x9d78ff },
    zoey: { name:'ZOEY', role:'Speed + Range', texture:'zoey', health:88, moveSpeed:335, dodgeSpeed:840, comboReset:430, attackDamage:[16,18,24], attackReach:[68,74,80], attackDuration:[145,155,195], accent:0x6edcff }
  }
};
