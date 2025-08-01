// 游戏配置文件
module.exports = {
  // 游戏基础配置
  gameConfig: {
    // 游戏名称
    name: '小游戏集合体',
    // 游戏版本
    version: '1.0.0',
    // 游戏作者
    author: 'Developer',
    // 游戏描述
    description: '多款小游戏集合在一起的微信小游戏',
    // 游戏主题色
    themeColor: '#4CAF50',
    // 默认背景音乐
    bgm: 'audio/bgm.mp3',
    // 默认音效开关
    soundEnabled: true,
    // 默认振动开关
    vibrationEnabled: true
  },
  
  // 积分系统配置
  pointsSystem: {
    // 初始积分
    initialPoints: 0,
    // 每日登录奖励
    dailyLoginBonus: 10,
    // 连续登录额外奖励（每天）
    consecutiveLoginBonus: 5,
    // 最大连续登录天数计数
    maxConsecutiveDays: 7,
    // 分享游戏奖励
    shareBonus: 5,
    // 邀请好友奖励
    inviteBonus: 20,
    // 完成新手引导奖励
    tutorialBonus: 15
  },
  
  // 游戏列表配置
  games: [
    {
      id: 'game1',
      name: '新三国英杰传',
      description: '三国题材的卡牌收集与回合制战斗游戏，组建你的英雄阵容征战天下',
      icon: 'images/game1_icon.png',
      thumbnail: 'images/game1_thumbnail.jpg',
      package: 'game1',
      unlockPoints: 0,
      category: '策略',
      difficulty: '中等',
      estimatedTime: '5-10分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      rankingEnabled: true
    },
    {
      id: 'game2',
      name: '记忆配对',
      description: '考验记忆力的卡片配对游戏，翻开卡片找到相同的图案',
      icon: 'images/game2_icon.png',
      thumbnail: 'images/game2_thumbnail.jpg',
      package: 'game2',
      unlockPoints: 100,
      category: '益智',
      difficulty: '中等',
      estimatedTime: '2-4分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      rankingEnabled: true
    },
    {
      id: 'game3',
      name: '飞机大战',
      description: '控制飞机躲避障碍物并射击敌人的射击游戏',
      icon: 'images/game3_icon.png',
      thumbnail: 'images/game3_thumbnail.jpg',
      package: 'game3',
      unlockPoints: 300,
      category: '动作',
      difficulty: '困难',
      estimatedTime: '5-8分钟',
      highscoreEnabled: true,
      multiplayerEnabled: false,
      rankingEnabled: true
    }
  ],
  
  // 成就系统配置
  achievements: [
    {
      id: 'first_game',
      name: '初次体验',
      description: '完成第一局游戏',
      icon: 'images/achievement_first_game.png',
      points: 10,
      hidden: false
    },
    {
      id: 'all_games',
      name: '全能玩家',
      description: '尝试所有游戏至少一次',
      icon: 'images/achievement_all_games.png',
      points: 50,
      hidden: false
    },
    {
      id: 'high_score',
      name: '高分达人',
      description: '在任意游戏中获得超过1000分',
      icon: 'images/achievement_high_score.png',
      points: 30,
      hidden: false
    },
    {
      id: 'daily_player',
      name: '日常玩家',
      description: '连续7天登录游戏',
      icon: 'images/achievement_daily_player.png',
      points: 70,
      hidden: false
    },
    {
      id: 'secret_game',
      name: '彩蛋发现者',
      description: '发现隐藏的彩蛋游戏',
      icon: 'images/achievement_secret.png',
      points: 100,
      hidden: true
    }
  ],
  
  // 商店系统配置
  shop: {
    enabled: true,
    categories: [
      {
        id: 'themes',
        name: '主题',
        description: '更换游戏界面主题'
      },
      {
        id: 'powerups',
        name: '道具',
        description: '游戏中使用的特殊道具'
      },
      {
        id: 'characters',
        name: '角色',
        description: '游戏中的可选角色'
      }
    ],
    items: [
      {
        id: 'theme_dark',
        name: '暗黑主题',
        description: '酷炫的暗黑界面主题',
        category: 'themes',
        price: 200,
        icon: 'images/shop_theme_dark.png',
        previewImage: 'images/preview_theme_dark.jpg'
      },
      {
        id: 'powerup_shield',
        name: '护盾道具',
        description: '在游戏中提供10秒无敌时间',
        category: 'powerups',
        price: 150,
        icon: 'images/shop_powerup_shield.png',
        usageLimit: 3
      },
      {
        id: 'character_ninja',
        name: '忍者角色',
        description: '速度更快的特殊角色',
        category: 'characters',
        price: 500,
        icon: 'images/shop_character_ninja.png',
        previewImage: 'images/preview_character_ninja.jpg'
      }
    ]
  },
  
  // 活动系统配置
  events: {
    enabled: true,
    current: [
      {
        id: 'summer_event',
        name: '夏日狂欢',
        description: '夏日限定活动，完成特定任务获得额外奖励',
        startDate: '2023-07-01',
        endDate: '2023-08-31',
        icon: 'images/event_summer.png',
        tasks: [
          {
            id: 'summer_task1',
            name: '炎炎夏日',
            description: '在夏日活动期间累计游戏30分钟',
            reward: 50,
            progress: 0,
            maxProgress: 1800 // 秒
          },
          {
            id: 'summer_task2',
            name: '分享快乐',
            description: '在活动期间分享游戏3次',
            reward: 30,
            progress: 0,
            maxProgress: 3
          }
        ],
        specialRewards: [
          {
            id: 'summer_theme',
            name: '夏日主题',
            description: '限定夏日主题界面',
            type: 'theme',
            requiredTasks: 2 // 需要完成的任务数
          }
        ]
      }
    ]
  },
  
  // 社交系统配置
  social: {
    enabled: true,
    features: [
      {
        id: 'friends',
        name: '好友系统',
        description: '添加好友并查看他们的游戏进度',
        enabled: true
      },
      {
        id: 'rankings',
        name: '排行榜',
        description: '查看全球玩家排名',
        enabled: true,
        categories: ['总积分', '单局最高', '每日挑战']
      },
      {
        id: 'challenges',
        name: '好友挑战',
        description: '向好友发起游戏挑战',
        enabled: true
      },
      {
        id: 'sharing',
        name: '分享功能',
        description: '分享游戏成绩到朋友圈',
        enabled: true
      }
    ]
  },
  
  // 云开发配置
  cloud: {
    env: 'cloud-env-id', // 替换为实际的云环境ID
    collections: {
      users: 'users',
      scores: 'game_scores',
      achievements: 'user_achievements',
      purchases: 'user_purchases',
      events: 'user_events',
      feedback: 'user_feedback'
    },
    functions: {
      login: 'user_login',
      updateScore: 'update_score',
      getRanking: 'get_ranking',
      unlockAchievement: 'unlock_achievement',
      purchaseItem: 'purchase_item',
      completeEventTask: 'complete_event_task'
    }
  },
  
  // 系统配置
  system: {
    // 最大缓存大小（MB）
    maxCacheSize: 50,
    // 资源预加载
    preloadResources: true,
    // 自动保存间隔（秒）
    autoSaveInterval: 60,
    // 调试模式
    debugMode: false,
    // 错误报告
    errorReporting: true,
    // 性能监控
    performanceMonitoring: true,
    // 网络超时（毫秒）
    networkTimeout: 10000,
    // 最大重试次数
    maxRetries: 3,
    // 重试间隔（毫秒）
    retryInterval: 1000,
    // 加载超时（毫秒）
    loadingTimeout: 15000
  }
};