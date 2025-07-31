// game.js
const app = getApp();
const config = require('../../utils/config.js');

Page({
  data: {
    gameId: '',
    gameInfo: null,
    gameInstance: null,
    isLoading: true,
    loadingText: '加载中...',
    loadingProgress: 0,
    showGameUI: false
  },
  
  onLoad: function(options) {
    if (options.id) {
      const gameId = options.id;
      const gameInfo = config.games.find(game => game.id === gameId);
      
      if (gameInfo) {
        this.setData({
          gameId: gameId,
          gameInfo: gameInfo,
          loadingText: `正在加载 ${gameInfo.name}...`
        });
        
        // 开始加载游戏
        this.loadGame(gameId);
      } else {
        wx.showToast({
          title: '游戏不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } else {
      wx.navigateBack();
    }
  },
  
  onReady: function() {
    // 获取画布上下文
    this.initCanvas();
  },
  
  onShow: function() {
    // 如果游戏实例存在，恢复游戏
    if (this.data.gameInstance && typeof this.data.gameInstance.resume === 'function') {
      this.data.gameInstance.resume();
    }
  },
  
  onHide: function() {
    // 如果游戏实例存在，暂停游戏
    if (this.data.gameInstance && typeof this.data.gameInstance.pause === 'function') {
      this.data.gameInstance.pause();
    }
  },
  
  onUnload: function() {
    // 销毁游戏实例
    this.destroyGame();
  },
  
  // 初始化画布
  initCanvas: function() {
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置画布大小
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          
          // 保存画布和上下文
          this.canvas = canvas;
          this.ctx = ctx;
          
          // 如果游戏已加载完成，初始化游戏
          if (this.gameModule && !this.data.gameInstance) {
            this.initGame();
          }
        }
      });
  },
  
  // 加载游戏
  loadGame: function(gameId) {
    // 模拟加载进度
    this.simulateLoading();
    
    // 根据游戏ID加载对应的游戏模块
    const gameInfo = this.data.gameInfo;
    
    // 使用require动态加载游戏模块
    try {
      this.gameModule = require(`../../games/${gameId}/main.js`);
      
      // 如果画布已初始化，初始化游戏
      if (this.canvas && this.ctx) {
        this.initGame();
      }
    } catch (error) {
      console.error('加载游戏失败', error);
      this.setData({
        loadingText: '加载游戏失败，请重试'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  // 模拟加载进度
  simulateLoading: function() {
    let progress = 0;
    const timer = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        
        // 加载完成后，如果游戏模块已加载，显示游戏UI
        if (this.gameModule) {
          this.setData({
            isLoading: false,
            showGameUI: true
          });
        }
      }
      
      this.setData({
        loadingProgress: progress
      });
    }, 200);
  },
  
  // 初始化游戏
  initGame: function() {
    if (!this.gameModule || !this.canvas || !this.ctx) return;
    
    const GameClass = this.gameModule.default || this.gameModule;
    
    // 创建游戏实例
    const gameInstance = new GameClass({
      canvas: this.canvas,
      ctx: this.ctx,
      width: this.canvas.width / wx.getSystemInfoSync().pixelRatio,
      height: this.canvas.height / wx.getSystemInfoSync().pixelRatio,
      onExit: this.onGameExit.bind(this),
      onGameOver: this.onGameOver.bind(this),
      onScoreChange: this.onScoreChange.bind(this)
    });
    
    // 保存游戏实例
    this.setData({
      gameInstance: gameInstance
    });
    
    // 开始游戏
    gameInstance.start();
  },
  
  // 游戏退出回调
  onGameExit: function() {
    wx.navigateBack();
  },
  
  // 游戏结束回调
  onGameOver: function(score) {
    console.log('游戏结束，得分：', score);
    
    // 更新积分
    if (score > 0) {
      // 计算奖励积分（根据得分的10%，最少1分，最多100分）
      const reward = Math.max(1, Math.min(100, Math.floor(score * 0.1)));
      
      // 调用更新积分的方法
      app.updatePoints(reward, (data) => {
        // 显示奖励提示
        wx.showToast({
          title: `获得 ${reward} 积分奖励`,
          icon: 'none',
          duration: 2000
        });
        
        // 检查高分成就
        if (score >= 1000) {
          app.checkAchievement('achievement4');
        }
      });
      
      // 记录游戏分数
      this.recordGameScore(score);
    }
  },
  
  // 分数变化回调
  onScoreChange: function(score) {
    // 可以在这里实时更新UI显示的分数
    console.log('当前分数：', score);
  },
  
  // 记录游戏分数
  recordGameScore: function(score) {
    wx.cloud.callFunction({
      name: 'updateScore',
      data: {
        gameId: this.data.gameId,
        score: score
      }
    });
  },
  
  // 销毁游戏实例
  destroyGame: function() {
    if (this.data.gameInstance && typeof this.data.gameInstance.destroy === 'function') {
      this.data.gameInstance.destroy();
    }
  },
  
  // 返回按钮点击事件
  onBackTap: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出游戏吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },
  
  // 分享游戏
  onShareAppMessage: function() {
    const gameInfo = this.data.gameInfo;
    
    return {
      title: `我正在玩「${gameInfo.name}」，一起来挑战吧！`,
      imageUrl: gameInfo.thumbnail,
      path: `/pages/game/game?id=${this.data.gameId}`
    };
  }
});
