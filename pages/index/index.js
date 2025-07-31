// index.js
const app = getApp();
const config = require('../../utils/config.js');

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    points: 0,
    games: [],
    unlockedGames: [],
    activeTab: 'all', // all, arcade, puzzle, action
    showSettings: false,
    settings: {
      bgmEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true
    },
    achievements: [],
    showAchievements: false,
    showShop: false,
    shopItems: [],
    activities: [],
    showActivities: false
  },
  
  onLoad: function() {
    // 检查是否可以使用 wx.getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 初始化游戏列表
    this.initGames();
    
    // 初始化商店
    this.initShop();
    
    // 初始化活动
    this.initActivities();
    
    // 获取用户设置
    this.getSettings();
  },
  
  onShow: function() {
    // 更新用户信息和积分
    this.updateUserInfo();
    
    // 检查当前活动
    this.checkCurrentActivities();
  },
  
  // 初始化游戏列表
  initGames: function() {
    this.setData({
      games: config.games
    });
  },
  
  // 初始化商店
  initShop: function() {
    this.setData({
      shopItems: config.shop
    });
  },
  
  // 初始化活动
  initActivities: function() {
    this.setData({
      activities: config.activities
    });
  },
  
  // 获取用户设置
  getSettings: function() {
    const settings = app.globalData.settings || {
      bgmEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true
    };
    
    this.setData({
      settings: settings
    });
  },
  
  // 更新用户信息和积分
  updateUserInfo: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        points: app.globalData.points,
        unlockedGames: app.globalData.unlockedGames,
        achievements: app.globalData.achievements
      });
    }
  },
  
  // 获取用户信息
  getUserProfile: function() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 更新用户信息
        app.globalData.userInfo = res.userInfo;
        
        // 调用云函数更新用户信息
        wx.cloud.callFunction({
          name: 'updateUserInfo',
          data: {
            userInfo: res.userInfo
          },
          success: () => {
            this.setData({
              userInfo: res.userInfo,
              hasUserInfo: true
            });
          }
        });
      }
    });
  },
  
  // 切换标签
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },
  
  // 打开游戏
  openGame: function(e) {
    const gameId = e.currentTarget.dataset.id;
    const game = this.data.games.find(g => g.id === gameId);
    
    if (!game) return;
    
    // 检查游戏是否已解锁
    if (!this.data.unlockedGames.includes(gameId)) {
      // 显示解锁确认
      wx.showModal({
        title: '解锁游戏',
        content: `需要消耗 ${game.unlockPoints} 积分解锁「${game.name}」，是否继续？`,
        success: (res) => {
          if (res.confirm) {
            // 调用解锁游戏
            app.unlockGame(gameId, (data) => {
              // 更新积分和已解锁游戏
              this.setData({
                points: data.points,
                unlockedGames: data.unlockedGames
              });
              
              // 解锁成功后打开游戏
              this.navigateToGame(gameId);
              
              // 检查成就：收藏家
              if (data.unlockedGames.length === config.games.length) {
                app.checkAchievement('achievement5');
              }
            });
          }
        }
      });
      return;
    }
    
    // 已解锁，直接打开游戏
    this.navigateToGame(gameId);
  },
  
  // 跳转到游戏页面
  navigateToGame: function(gameId) {
    const game = this.data.games.find(g => g.id === gameId);
    
    if (!game) return;
    
    // 记录游戏历史
    wx.cloud.callFunction({
      name: 'recordGamePlay',
      data: {
        gameId: gameId
      }
    });
    
    // 检查成就：游戏新手
    if (!this.data.achievements.includes('achievement1')) {
      app.checkAchievement('achievement1');
    }
    
    // 跳转到游戏页面
    wx.navigateTo({
      url: `/pages/game/game?id=${gameId}`
    });
  },
  
  // 打开设置
  openSettings: function() {
    this.setData({
      showSettings: true
    });
  },
  
  // 关闭设置
  closeSettings: function() {
    this.setData({
      showSettings: false
    });
  },
  
  // 切换背景音乐
  toggleBGM: function() {
    const bgmEnabled = !this.data.settings.bgmEnabled;
    
    // 更新设置
    app.globalData.settings.bgmEnabled = bgmEnabled;
    this.setData({
      'settings.bgmEnabled': bgmEnabled
    });
    
    // 控制背景音乐
    if (bgmEnabled) {
      if (app.globalData.bgmAudioContext) {
        app.globalData.bgmAudioContext.play();
      } else {
        app.initBackgroundMusic();
      }
    } else {
      if (app.globalData.bgmAudioContext) {
        app.globalData.bgmAudioContext.pause();
      }
    }
  },
  
  // 切换音效
  toggleSound: function() {
    const soundEnabled = !this.data.settings.soundEnabled;
    
    // 更新设置
    app.globalData.settings.soundEnabled = soundEnabled;
    this.setData({
      'settings.soundEnabled': soundEnabled
    });
    
    // 播放测试音效
    if (soundEnabled) {
      app.playSound('/audio/click.mp3');
    }
  },
  
  // 切换振动
  toggleVibration: function() {
    const vibrationEnabled = !this.data.settings.vibrationEnabled;
    
    // 更新设置
    app.globalData.settings.vibrationEnabled = vibrationEnabled;
    this.setData({
      'settings.vibrationEnabled': vibrationEnabled
    });
    
    // 测试振动
    if (vibrationEnabled) {
      app.vibrate();
    }
  },
  
  // 打开成就列表
  openAchievements: function() {
    this.setData({
      showAchievements: true
    });
  },
  
  // 关闭成就列表
  closeAchievements: function() {
    this.setData({
      showAchievements: false
    });
  },
  
  // 打开商店
  openShop: function() {
    this.setData({
      showShop: true
    });
  },
  
  // 关闭商店
  closeShop: function() {
    this.setData({
      showShop: false
    });
  },
  
  // 购买商品
  buyItem: function(e) {
    const itemId = e.currentTarget.dataset.id;
    const item = this.data.shopItems.find(i => i.id === itemId);
    
    if (!item) return;
    
    // 检查积分是否足够
    if (this.data.points < item.price) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    // 显示购买确认
    wx.showModal({
      title: '购买商品',
      content: `确定花费 ${item.price} 积分购买「${item.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          // 调用云函数购买商品
          wx.cloud.callFunction({
            name: 'purchaseItem',
            data: {
              itemId: itemId,
              price: item.price
            },
            success: (res) => {
              if (res.result && res.result.code === 0) {
                // 更新积分
                this.setData({
                  points: res.result.data.points
                });
                
                // 更新全局积分
                app.globalData.points = res.result.data.points;
                
                wx.showToast({
                  title: '购买成功',
                  icon: 'success'
                });
              }
            },
            fail: () => {
              wx.showToast({
                title: '购买失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },
  
  // 打开活动列表
  openActivities: function() {
    this.setData({
      showActivities: true
    });
  },
  
  // 关闭活动列表
  closeActivities: function() {
    this.setData({
      showActivities: false
    });
  },
  
  // 检查当前活动
  checkCurrentActivities: function() {
    const now = new Date();
    const today = now.getDay(); // 0-6，0是周日
    
    // 筛选当前日期适用的活动
    const currentActivities = this.data.activities.filter(activity => {
      // 检查活动日期范围
      const startDate = new Date(activity.startDate);
      const endDate = new Date(activity.endDate);
      
      if (now < startDate || now > endDate) {
        return false;
      }
      
      // 检查星期几
      return activity.weekdays.includes(today);
    });
    
    // 如果有活动，显示提示
    if (currentActivities.length > 0) {
      const activity = currentActivities[0]; // 取第一个活动
      
      wx.showToast({
        title: `${activity.name}进行中！`,
        icon: 'none',
        duration: 3000
      });
    }
  },
  
  // 分享小程序
  onShareAppMessage: function() {
    // 记录分享行为
    wx.cloud.callFunction({
      name: 'recordShare',
      success: (res) => {
        if (res.result && res.result.code === 0) {
          // 更新积分
          this.setData({
            points: res.result.data.points
          });
          
          // 更新全局积分
          app.globalData.points = res.result.data.points;
        }
      }
    });
    
    return app.shareApp();
  }
});
