//app.js
const config = require('./utils/config.js');

App({
  globalData: {
    userInfo: null,
    points: 0,
    unlockedGames: [],
    achievements: [],
    settings: {
      bgmEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true
    },
    gameData: {}, // 存储各个游戏的数据
    theme: config.baseConfig.theme,
    bgmAudioContext: null
  },
  
  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-8gfqj9v2f9b9d9a9',
        traceUser: true,
      });
    }
    
    // 初始化背景音乐
    this.initBackgroundMusic();
    
    // 获取用户信息
    this.getUserInfo();
    
    // 检查更新
    this.checkUpdate();
  },
  
  // 初始化背景音乐
  initBackgroundMusic: function() {
    if (this.globalData.settings.bgmEnabled && config.baseConfig.bgm) {
      const bgmAudioContext = wx.createInnerAudioContext();
      bgmAudioContext.src = config.baseConfig.bgm;
      bgmAudioContext.loop = true;
      bgmAudioContext.autoplay = true;
      this.globalData.bgmAudioContext = bgmAudioContext;
    }
  },
  
  // 播放音效
  playSound: function(soundSrc) {
    if (this.globalData.settings.soundEnabled && soundSrc) {
      const soundContext = wx.createInnerAudioContext();
      soundContext.src = soundSrc;
      soundContext.play();
    }
  },
  
  // 振动
  vibrate: function(isShort = true) {
    if (this.globalData.settings.vibrationEnabled) {
      if (isShort) {
        wx.vibrateShort();
      } else {
        wx.vibrateLong();
      }
    }
  },
  
  // 获取用户信息
  getUserInfo: function() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('登录成功', res);
        if (res.result && res.result.code === 0) {
          const userData = res.result.data;
          
          // 更新全局数据
          this.globalData.userInfo = {
            nickName: userData.nickName,
            avatarUrl: userData.avatarUrl,
            openid: userData._openid
          };
          this.globalData.points = userData.points;
          this.globalData.unlockedGames = userData.unlockedGames || [];
          this.globalData.achievements = userData.achievements || [];
          
          // 如果是今天第一次登录，显示登录奖励
          if (userData.todayFirstLogin && userData.loginReward > 0) {
            wx.showToast({
              title: `登录奖励 +${userData.loginReward} 积分`,
              icon: 'none',
              duration: 2000
            });
          }
          
          // 如果是新用户，显示欢迎信息并引导
          if (userData.isNewUser) {
            setTimeout(() => {
              wx.showModal({
                title: '欢迎来到迷你游戏集',
                content: '这是一个有趣的小游戏合集，通过玩游戏可以获得积分，解锁更多游戏！',
                showCancel: false,
                success: () => {
                  // 显示新手引导
                  this.showTutorial();
                }
              });
            }, 1000);
          }
        }
      },
      fail: err => {
        console.error('登录失败', err);
        wx.showToast({
          title: '登录失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },
  
  // 显示新手引导
  showTutorial: function() {
    // 这里可以实现新手引导逻辑
    // 例如使用wx.showModal依次介绍游戏的各个功能
    wx.showModal({
      title: '新手引导',
      content: '点击游戏图标开始游戏，获得积分可以解锁更多游戏！完成成就还能获得额外奖励！',
      showCancel: false,
      success: () => {
        // 奖励用户完成新手引导
        this.rewardNewUserTutorial();
      }
    });
  },
  
  // 奖励用户完成新手引导
  rewardNewUserTutorial: function() {
    const reward = config.pointsConfig.tutorialReward;
    
    wx.cloud.callFunction({
      name: 'updatePoints',
      data: {
        points: reward,
        reason: '完成新手引导'
      },
      success: res => {
        if (res.result && res.result.code === 0) {
          // 更新全局积分
          this.globalData.points += reward;
          
          wx.showToast({
            title: `完成新手引导 +${reward} 积分`,
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },
  
  // 检查更新
  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function(res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
          
          updateManager.onUpdateFailed(function() {
            wx.showModal({
              title: '更新提示',
              content: '新版本下载失败，请检查网络后重试',
              showCancel: false
            });
          });
        }
      });
    }
  },
  
  // 分享游戏
  shareApp: function() {
    return {
      title: config.baseConfig.name,
      imageUrl: '/images/share.png',
      path: '/pages/index/index'
    };
  },
  
  // 更新用户积分
  updatePoints: function(points, callback) {
    wx.cloud.callFunction({
      name: 'updatePoints',
      data: {
        points: points,
        reason: '游戏奖励'
      },
      success: res => {
        if (res.result && res.result.code === 0) {
          // 更新全局积分
          this.globalData.points = res.result.data.points;
          
          if (callback && typeof callback === 'function') {
            callback(res.result.data);
          }
        }
      },
      fail: err => {
        console.error('更新积分失败', err);
        wx.showToast({
          title: '更新积分失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 解锁游戏
  unlockGame: function(gameId, callback) {
    // 查找游戏配置
    const gameConfig = config.games.find(game => game.id === gameId);
    
    if (!gameConfig) {
      wx.showToast({
        title: '游戏不存在',
        icon: 'none'
      });
      return;
    }
    
    // 检查积分是否足够
    if (this.globalData.points < gameConfig.unlockPoints) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    // 调用云函数解锁游戏
    wx.cloud.callFunction({
      name: 'unlockGame',
      data: {
        gameId: gameId,
        cost: gameConfig.unlockPoints
      },
      success: res => {
        if (res.result && res.result.code === 0) {
          // 更新全局数据
          this.globalData.points = res.result.data.points;
          this.globalData.unlockedGames = res.result.data.unlockedGames;
          
          wx.showToast({
            title: `成功解锁 ${gameConfig.name}`,
            icon: 'success'
          });
          
          if (callback && typeof callback === 'function') {
            callback(res.result.data);
          }
        }
      },
      fail: err => {
        console.error('解锁游戏失败', err);
        wx.showToast({
          title: '解锁失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 保存游戏数据
  saveGameData: function(gameId, data) {
    this.globalData.gameData[gameId] = data;
    
    // 可以选择是否同步到云端
    // wx.cloud.callFunction({
    //   name: 'saveGameData',
    //   data: {
    //     gameId: gameId,
    //     gameData: data
    //   }
    // });
  },
  
  // 获取游戏数据
  getGameData: function(gameId) {
    return this.globalData.gameData[gameId] || null;
  },
  
  // 检查成就
  checkAchievement: function(achievementId) {
    // 检查是否已获得该成就
    if (this.globalData.achievements.includes(achievementId)) {
      return false; // 已获得，不需要再次奖励
    }
    
    // 查找成就配置
    const achievementConfig = config.achievements.find(a => a.id === achievementId);
    
    if (!achievementConfig) {
      return false;
    }
    
    // 调用云函数解锁成就
    wx.cloud.callFunction({
      name: 'unlockAchievement',
      data: {
        achievementId: achievementId
      },
      success: res => {
        if (res.result && res.result.code === 0) {
          // 更新全局数据
          this.globalData.points = res.result.data.points;
          this.globalData.achievements = res.result.data.achievements;
          
          // 显示成就解锁提示
          wx.showModal({
            title: '成就解锁',
            content: `恭喜解锁成就「${achievementConfig.name}」\n奖励 ${achievementConfig.points} 积分`,
            showCancel: false
          });
        }
      }
    });
    
    return true;
  }
});
