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
      name: '弹球游戏',
      description: '经典的弹球游戏，控制挡板反弹小球击碎砖块',
      icon: 'images/game1_icon.png',
      thumbnail: 'images/game1_thumbnail.jpg',
      package: 'game1',
      unlockPoints: 0,
      maxScore: 1000,
      pointsPerPlay: 5,
      pointsPerWin: 20,
      achievements: [
        {
          id: 'game1_score_100',
          name: '初级弹球手',
          description: '在弹球游戏中获得100分',
          points: 10,
          condition: { type: 'score', value: 100 }
        },
        {
          id: 'game1_score_500',
          name: '中级弹球手',
          description: '在弹球游戏中获得500分',
          points: 30,
          condition: { type: 'score', value: 500 }
        },
        {
          id: 'game1_score_1000',
          name: '高级弹球手',
          description: '在弹球游戏中获得1000分',
          points: 50,
          condition: { type: 'score', value: 1000 }
        },
        {
          id: 'game1_perfect',
          name: '完美通关',
          description: '不损失生命的情况下完成一局游戏',
          points: 100,
          condition: { type: 'perfect', value: true }
        }
      ]
    },
    {
      id: 'game2',
      name: '记忆配对',
      description: '考验记忆力的卡片配对游戏，翻开所有配对的卡片获胜',
      icon: 'images/game2_icon.png',
      thumbnail: 'images/game2_thumbnail.jpg',
      package: 'game2',
      unlockPoints: 100,
      maxScore: 1000,
      pointsPerPlay: 5,
      pointsPerWin: 20,
      achievements: [
        {
          id: 'game2_win_1',
          name: '初级记忆师',
          description: '完成一局记忆配对游戏',
          points: 10,
          condition: { type: 'wins', value: 1 }
        },
        {
          id: 'game2_win_5',
          name: '中级记忆师',
          description: '完成5局记忆配对游戏',
          points: 30,
          condition: { type: 'wins', value: 5 }
        },
        {
          id: 'game2_win_10',
          name: '高级记忆师',
          description: '完成10局记忆配对游戏',
          points: 50,
          condition: { type: 'wins', value: 10 }
        },
        {
          id: 'game2_fast',
          name: '闪电记忆',
          description: '在30秒内完成一局游戏',
          points: 100,
          condition: { type: 'time', value: 30 }
        }
      ]
    },
    {
      id: 'game3',
      name: '飞机大战',
      description: '经典的飞机射击游戏，躲避敌机并射击获得高分',
      icon: 'images/game3_icon.png',
      thumbnail: 'images/game3_thumbnail.jpg',
      package: 'game3',
      unlockPoints: 300,
      maxScore: 10000,
      pointsPerPlay: 5,
      pointsPerWin: 20,
      achievements: [
        {
          id: 'game3_score_1000',
          name: '初级飞行员',
          description: '在飞机大战中获得1000分',
          points: 10,
          condition: { type: 'score', value: 1000 }
        },
        {
          id: 'game3_score_5000',
          name: '中级飞行员',
          description: '在飞机大战中获得5000分',
          points: 30,
          condition: { type: 'score', value: 5000 }
        },
        {
          id: 'game3_score_10000',
          name: '王牌飞行员',
          description: '在飞机大战中获得10000分',
          points: 50,
          condition: { type: 'score', value: 10000 }
        },
        {
          id: 'game3_boss',
          name: '击败Boss',
          description: '成功击败一个Boss',
          points: 100,
          condition: { type: 'boss', value: true }
        }
      ]
    }
  ],
  
  // 商店配置
  shop: {
    // 商店物品
    items: [
      {
        id: 'theme_dark',
        name: '暗黑主题',
        description: '应用暗黑主题到游戏界面',
        price: 200,
        type: 'theme',
        icon: 'images/shop/theme_dark.png'
      },
      {
        id: 'theme_neon',
        name: '霓虹主题',
        description: '应用霓虹主题到游戏界面',
        price: 300,
        type: 'theme',
        icon: 'images/shop/theme_neon.png'
      },
      {
        id: 'avatar_frame_gold',
        name: '金色头像框',
        description: '为你的头像添加金色边框',
        price: 500,
        type: 'avatar_frame',
        icon: 'images/shop/avatar_frame_gold.png'
      },
      {
        id: 'game1_skin_rainbow',
        name: '彩虹球皮肤',
        description: '为弹球游戏中的球应用彩虹皮肤',
        price: 150,
        type: 'game_skin',
        gameId: 'game1',
        icon: 'images/shop/game1_skin_rainbow.png'
      },
      {
        id: 'game3_skin_fire',
        name: '火焰飞机皮肤',
        description: '为飞机大战中的飞机应用火焰皮肤',
        price: 250,
        type: 'game_skin',
        gameId: 'game3',
        icon: 'images/shop/game3_skin_fire.png'
      }
    ]
  },
  
  // 活动配置
  events: [
    {
      id: 'double_points',
      name: '双倍积分',
      description: '限时双倍积分活动',
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-07T23:59:59Z',
      effect: { type: 'points_multiplier', value: 2 }
    },
    {
      id: 'discount_shop',
      name: '商店折扣',
      description: '商店物品限时7折',
      startTime: '2023-02-01T00:00:00Z',
      endTime: '2023-02-07T23:59:59Z',
      effect: { type: 'shop_discount', value: 0.7 }
    }
  ]
};