// 游戏配置文件

module.exports = {
  // 游戏基础配置
  gameConfig: {
    name: '小游戏合集',
    version: '1.0.0',
    author: 'Developer',
    description: '一个包含多种小游戏的微信小游戏合集',
    themeColor: '#4CAF50',
    bgMusic: 'audio/bgm.mp3',
    soundEnabled: true,
    vibrationEnabled: true
  },
  
  // 积分系统配置
  pointsConfig: {
    initialPoints: 100,         // 新用户初始积分
    dailyLoginReward: 10,       // 每日登录奖励
    consecutiveLoginBonus: 5,   // 连续登录额外奖励（每天）
    maxConsecutiveDays: 7,      // 最大连续登录天数计算
    shareReward: 5,             // 分享奖励
    inviteReward: 20,           // 邀请新用户奖励
    tutorialReward: 15          // 完成新手引导奖励
  },
  
  // 游戏列表配置
  gameList: [
    {
      id: 'game1',
      name: '弹球游戏',
      description: '经典弹球游戏，击碎所有砖块获得高分',
      icon: 'images/games/game1_icon.png',
      thumbnail: 'images/games/game1_thumb.png',
      subpackage: 'game1',
      unlockPoints: 0,          // 0表示默认解锁
      category: '休闲',
      difficulty: '简单',
      estimatedTime: '3-5分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      leaderboardEnabled: true
    },
    {
      id: 'game2',
      name: '记忆配对',
      description: '考验记忆力的卡片配对游戏',
      icon: 'images/games/game2_icon.png',
      thumbnail: 'images/games/game2_thumb.png',
      subpackage: 'game2',
      unlockPoints: 50,
      category: '益智',
      difficulty: '中等',
      estimatedTime: '2-4分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      leaderboardEnabled: true
    },
    {
      id: 'game3',
      name: '飞机大战',
      description: '控制飞机躲避敌人并射击获得高分',
      icon: 'images/games/game3_icon.png',
      thumbnail: 'images/games/game3_thumb.png',
      subpackage: 'game3',
      unlockPoints: 100,
      category: '动作',
      difficulty: '困难',
      estimatedTime: '5-10分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      leaderboardEnabled: true
    },
    {
      id: 'game4',
      name: '贪吃蛇',
      description: '经典贪吃蛇游戏，吃到更多食物',
      icon: 'images/games/game4_icon.png',
      thumbnail: 'images/games/game4_thumb.png',
      subpackage: 'game4',
      unlockPoints: 150,
      category: '休闲',
      difficulty: '简单',
      estimatedTime: '3-8分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      leaderboardEnabled: true
    },
    {
      id: 'game5',
      name: '2048',
      description: '数字合并游戏，挑战最高分',
      icon: 'images/games/game5_icon.png',
      thumbnail: 'images/games/game5_thumb.png',
      subpackage: 'game5',
      unlockPoints: 200,
      category: '益智',
      difficulty: '中等',
      estimatedTime: '5-15分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      leaderboardEnabled: true
    }
  ],
  
  // 成就系统配置
  achievements: [
    {
      id: 'achievement1',
      name: '全能玩家',
      description: '玩过所有游戏',
      icon: 'images/achievements/all_games.png',
      points: 50,
      hidden: false
    },
    {
      id: 'achievement2',
      name: '高分达人',
      description: '在任意游戏中获得500分以上',
      icon: 'images/achievements/high_score.png',
      points: 30,
      hidden: false
    },
    {
      id: 'achievement3',
      name: '日常玩家',
      description: '连续登录7天',
      icon: 'images/achievements/daily_player.png',
      points: 20,
      hidden: false
    },
    {
      id: 'achievement4',
      name: '彩蛋发现者',
      description: '发现游戏中的隐藏彩蛋',
      icon: 'images/achievements/easter_egg.png',
      points: 100,
      hidden: true
    },
    {
      id: 'achievement5',
      name: '分享达人',
      description: '分享游戏10次',
      icon: 'images/achievements/share_master.png',
      points: 15,
      hidden: false
    },
    {
      id: 'achievement6',
      name: '解锁专家',
      description: '解锁所有游戏',
      icon: 'images/achievements/unlock_all.png',
      points: 40,
      hidden: false
    },
    {
      id: 'achievement7',
      name: '速度之王',
      description: '在弹球游戏中30秒内通关',
      icon: 'images/achievements/speed_king.png',
      points: 25,
      hidden: false
    },
    {
      id: 'achievement8',
      name: '记忆大师',
      description: '在记忆配对游戏中使用最少步数完成',
      icon: 'images/achievements/memory_master.png',
      points: 25,
      hidden: false
    },
    {
      id: 'achievement9',
      name: '飞行王牌',
      description: '在飞机大战中获得1000分以上',
      icon: 'images/achievements/flying_ace.png',
      points: 35,
      hidden: false
    },
    {
      id: 'achievement10',
      name: '社交蝴蝶',
      description: '邀请5位好友玩游戏',
      icon: 'images/achievements/social_butterfly.png',
      points: 30,
      hidden: false
    }
  ],
  
  // 商店配置
  shop: {
    items: [
      {
        id: 'theme1',
        name: '深色主题',
        description: '应用深色主题到游戏界面',
        icon: 'images/shop/dark_theme.png',
        price: 200,
        category: '主题'
      },
      {
        id: 'theme2',
        name: '霓虹主题',
        description: '应用霓虹灯效果主题',
        icon: 'images/shop/neon_theme.png',
        price: 300,
        category: '主题'
      },
      {
        id: 'avatar1',
        name: '太空人头像',
        description: '太空人风格的用户头像',
        icon: 'images/shop/astronaut_avatar.png',
        price: 150,
        category: '头像'
      },
      {
        id: 'avatar2',
        name: '机器人头像',
        description: '机器人风格的用户头像',
        icon: 'images/shop/robot_avatar.png',
        price: 150,
        category: '头像'
      },
      {
        id: 'booster1',
        name: '双倍积分',
        description: '1小时内获得双倍积分',
        icon: 'images/shop/double_points.png',
        price: 100,
        category: '加速器',
        duration: 3600 // 秒
      },
      {
        id: 'unlock_all',
        name: '全部解锁',
        description: '立即解锁所有游戏',
        icon: 'images/shop/unlock_all.png',
        price: 500,
        category: '特殊'
      }
    ]
  },
  
  // 活动配置
  events: [
    {
      id: 'event1',
      name: '周末双倍积分',
      description: '周末期间获得双倍积分',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      daysOfWeek: [6, 0], // 周六和周日
      multiplier: 2
    },
    {
      id: 'event2',
      name: '新年活动',
      description: '新年期间登录获得特殊奖励',
      startDate: '2023-12-25',
      endDate: '2024-01-05',
      reward: 50
    }
  ]
};