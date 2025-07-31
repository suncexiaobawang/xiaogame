// 游戏配置文件

module.exports = {
  // 基础配置
  baseConfig: {
    name: '迷你游戏集',
    version: '1.0.0',
    author: 'Developer',
    description: '一个有趣的小游戏合集，包含多种休闲游戏',
    theme: '#4a90e2', // 主题色
    bgm: '/audio/bgm.mp3', // 背景音乐
    soundEnabled: true, // 音效开关
    vibrationEnabled: true // 振动开关
  },
  
  // 积分系统配置
  pointsConfig: {
    initialPoints: 100, // 新用户初始积分
    dailyLoginReward: 20, // 每日登录奖励
    consecutiveLoginBonus: 10, // 连续登录额外奖励
    maxConsecutiveDays: 7, // 最大连续登录天数计算
    shareReward: 5, // 分享奖励
    inviteReward: 50, // 邀请新用户奖励
    tutorialReward: 30 // 完成新手引导奖励
  },
  
  // 游戏列表配置
  games: [
    {
      id: 'game1',
      name: '弹球游戏',
      description: '经典的弹球游戏，打破所有砖块获得高分',
      icon: '/images/games/game1_icon.png',
      thumbnail: '/images/games/game1_thumb.png',
      package: 'game1', // 分包名称
      unlockPoints: 0, // 解锁所需积分，0表示默认解锁
      category: 'arcade', // 游戏分类
      difficulty: 'easy', // 难度
      estimatedTime: '3-5分钟', // 预计游戏时间
      highScore: true, // 是否有高分榜
      multiplayer: false, // 是否支持多人
      leaderboard: true // 是否有排行榜
    },
    {
      id: 'game2',
      name: '记忆配对',
      description: '考验记忆力的卡片配对游戏，找出所有匹配的卡片',
      icon: '/images/games/game2_icon.png',
      thumbnail: '/images/games/game2_thumb.png',
      package: 'game2',
      unlockPoints: 50,
      category: 'puzzle',
      difficulty: 'medium',
      estimatedTime: '2-4分钟',
      highScore: true,
      multiplayer: false,
      leaderboard: true
    },
    {
      id: 'game3',
      name: '飞机大战',
      description: '控制飞机躲避敌人并射击，尽可能生存更久',
      icon: '/images/games/game3_icon.png',
      thumbnail: '/images/games/game3_thumb.png',
      package: 'game3',
      unlockPoints: 100,
      category: 'action',
      difficulty: 'hard',
      estimatedTime: '5-10分钟',
      highScore: true,
      multiplayer: false,
      leaderboard: true
    },
    {
      id: 'game4',
      name: '贪吃蛇',
      description: '经典的贪吃蛇游戏，吃到食物变得更长',
      icon: '/images/games/game4_icon.png',
      thumbnail: '/images/games/game4_thumb.png',
      package: 'game4',
      unlockPoints: 150,
      category: 'arcade',
      difficulty: 'medium',
      estimatedTime: '3-8分钟',
      highScore: true,
      multiplayer: false,
      leaderboard: true
    },
    {
      id: 'game5',
      name: '2048',
      description: '合并数字方块，尝试得到2048',
      icon: '/images/games/game5_icon.png',
      thumbnail: '/images/games/game5_thumb.png',
      package: 'game5',
      unlockPoints: 200,
      category: 'puzzle',
      difficulty: 'medium',
      estimatedTime: '5-15分钟',
      highScore: true,
      multiplayer: false,
      leaderboard: true
    },
    {
      id: 'game6',
      name: '跳跃忍者',
      description: '控制忍者角色跳跃躲避障碍物',
      icon: '/images/games/game6_icon.png',
      thumbnail: '/images/games/game6_thumb.png',
      package: 'game6',
      unlockPoints: 250,
      category: 'action',
      difficulty: 'hard',
      estimatedTime: '2-5分钟',
      highScore: true,
      multiplayer: false,
      leaderboard: true
    }
  ],
  
  // 成就系统配置
  achievements: [
    {
      id: 'achievement1',
      name: '游戏新手',
      description: '完成第一个游戏',
      icon: '/images/achievements/achievement1.png',
      points: 20,
      hidden: false
    },
    {
      id: 'achievement2',
      name: '游戏达人',
      description: '玩过所有游戏',
      icon: '/images/achievements/achievement2.png',
      points: 50,
      hidden: false
    },
    {
      id: 'achievement3',
      name: '日常玩家',
      description: '连续登录7天',
      icon: '/images/achievements/achievement3.png',
      points: 30,
      hidden: false
    },
    {
      id: 'achievement4',
      name: '高分达人',
      description: '在任意游戏中获得1000分以上',
      icon: '/images/achievements/achievement4.png',
      points: 40,
      hidden: false
    },
    {
      id: 'achievement5',
      name: '收藏家',
      description: '解锁所有游戏',
      icon: '/images/achievements/achievement5.png',
      points: 100,
      hidden: false
    },
    {
      id: 'achievement6',
      name: '神秘成就',
      description: '???',
      icon: '/images/achievements/achievement6.png',
      points: 200,
      hidden: true
    }
  ],
  
  // 商店配置
  shop: [
    {
      id: 'item1',
      name: '双倍积分卡',
      description: '使用后24小时内游戏积分翻倍',
      icon: '/images/shop/item1.png',
      price: 100,
      category: 'boost',
      duration: 86400 // 24小时，单位秒
    },
    {
      id: 'item2',
      name: '复活卡',
      description: '在游戏中失败时可以立即复活一次',
      icon: '/images/shop/item2.png',
      price: 50,
      category: 'consumable',
      duration: 0 // 一次性使用
    },
    {
      id: 'item3',
      name: '游戏提示',
      description: '在游戏中获得提示',
      icon: '/images/shop/item3.png',
      price: 30,
      category: 'consumable',
      duration: 0
    }
  ],
  
  // 活动配置
  activities: [
    {
      id: 'activity1',
      name: '周末狂欢',
      description: '周末期间游戏积分翻倍',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      weekdays: [0, 6], // 周日和周六
      multiplier: 2,
      reward: 0
    },
    {
      id: 'activity2',
      name: '每日挑战',
      description: '完成每日挑战获得额外积分',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      weekdays: [1, 2, 3, 4, 5], // 工作日
      multiplier: 1,
      reward: 50
    }
  ]
};
