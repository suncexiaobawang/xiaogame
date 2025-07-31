// 游戏集合体主入口文件

// 初始化云开发
wx.cloud.init({
  env: 'cloud-env-id', // 替换为你的云环境ID
  traceUser: true
});

// 全局游戏数据
const globalGameData = {
  // 用户信息
  userInfo: null,
  // 积分系统
  points: 0,
  // 已解锁的游戏
  unlockedGames: ['game1'],
  // 当前加载的游戏
  currentGame: null,
  // 游戏配置
  games: [
    {
      id: 'game1',
      name: '游戏一',
      icon: 'images/game1_icon.png',
      package: 'game1',
      unlockPoints: 0
    },
    {
      id: 'game2',
      name: '游戏二',
      icon: 'images/game2_icon.png',
      package: 'game2',
      unlockPoints: 100
    },
    {
      id: 'game3',
      name: '游戏三',
      icon: 'images/game3_icon.png',
      package: 'game3',
      unlockPoints: 300
    }
  ]
};

// 游戏管理器
class GameManager {
  constructor() {
    // 初始化画布
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    // 获取系统信息
    this.systemInfo = wx.getSystemInfoSync();
    this.width = this.systemInfo.windowWidth;
    this.height = this.systemInfo.windowHeight;
    
    // 加载公共资源
    this.loadCommonResources();
    
    // 初始化用户数据
    this.initUserData();
    
    // 初始化触摸事件
    this.initTouchEvents();
    
    // 显示主菜单
    this.showMainMenu();
    
    // 开始游戏循环
    this.gameLoop();
  }
  
  // 加载公共资源
  async loadCommonResources() {
    // 加载公共图片、音频等资源
    this.commonResources = {
      // 可以在这里添加公共资源
      backgroundImage: await this.loadImage('images/background.png'),
      buttonImage: await this.loadImage('images/button.png'),
      // 添加更多资源...
    };
  }
  
  // 加载图片辅助函数
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = wx.createImage();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  // 初始化用户数据
  async initUserData() {
    try {
      // 尝试从云数据库获取用户数据
      const db = wx.cloud.database();
      const userRes = await db.collection('users').where({
        _openid: wx.getOpenId()
      }).get();
      
      if (userRes.data.length > 0) {
        // 用户存在，加载数据
        const userData = userRes.data[0];
        globalGameData.points = userData.points || 0;
        globalGameData.unlockedGames = userData.unlockedGames || ['game1'];
      } else {
        // 新用户，创建数据
        await db.collection('users').add({
          data: {
            points: 0,
            unlockedGames: ['game1'],
            createTime: db.serverDate()
          }
        });
      }
      
      // 获取用户信息
      wx.getUserInfo({
        success: (res) => {
          globalGameData.userInfo = res.userInfo;
        }
      });
    } catch (error) {
      console.error('初始化用户数据失败:', error);
      // 使用默认数据
    }
  }
  
  // 更新用户积分
  async updatePoints(points) {
    globalGameData.points += points;
    
    try {
      // 更新云数据库
      const db = wx.cloud.database();
      await db.collection('users').where({
        _openid: wx.getOpenId()
      }).update({
        data: {
          points: globalGameData.points
        }
      });
      
      // 检查是否解锁新游戏
      this.checkGameUnlock();
    } catch (error) {
      console.error('更新积分失败:', error);
    }
  }
  
  // 检查游戏解锁
  checkGameUnlock() {
    globalGameData.games.forEach(game => {
      if (!globalGameData.unlockedGames.includes(game.id) && 
          globalGameData.points >= game.unlockPoints) {
        // 解锁新游戏
        globalGameData.unlockedGames.push(game.id);
        
        // 更新云数据库
        const db = wx.cloud.database();
        db.collection('users').where({
          _openid: wx.getOpenId()
        }).update({
          data: {
            unlockedGames: globalGameData.unlockedGames
          }
        }).catch(console.error);
        
        // 显示解锁提示
        wx.showToast({
          title: `解锁新游戏: ${game.name}`,
          icon: 'success'
        });
      }
    });
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    wx.onTouchStart(this.handleTouchStart.bind(this));
    wx.onTouchMove(this.handleTouchMove.bind(this));
    wx.onTouchEnd(this.handleTouchEnd.bind(this));
  }
  
  // 触摸开始处理
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    
    // 检查是否点击了游戏图标
    if (this.currentScreen === 'mainMenu') {
      this.checkGameIconClick(touch.clientX, touch.clientY);
    }
  }
  
  // 触摸移动处理
  handleTouchMove(e) {
    // 可以实现滑动效果
  }
  
  // 触摸结束处理
  handleTouchEnd(e) {
    // 处理触摸结束事件
  }
  
  // 检查游戏图标点击
  checkGameIconClick(x, y) {
    // 计算每个游戏图标的位置和大小
    const iconSize = 100;
    const padding = 20;
    const startY = 200;
    
    globalGameData.games.forEach((game, index) => {
      const iconX = (this.width - iconSize) / 2;
      const iconY = startY + (iconSize + padding) * index;
      
      // 检查点击是否在图标范围内
      if (x >= iconX && x <= iconX + iconSize && 
          y >= iconY && y <= iconY + iconSize) {
        // 检查游戏是否已解锁
        if (globalGameData.unlockedGames.includes(game.id)) {
          this.loadGame(game.id);
        } else {
          // 显示未解锁提示
          wx.showToast({
            title: `需要${game.unlockPoints}积分解锁`,
            icon: 'none'
          });
        }
      }
    });
  }
  
  // 加载游戏
  async loadGame(gameId) {
    const game = globalGameData.games.find(g => g.id === gameId);
    if (!game) return;
    
    // 显示加载中
    wx.showLoading({
      title: '加载中...'
    });
    
    try {
      // 加载分包
      await wx.loadSubpackage({
        name: game.package,
        success: (res) => {
          console.log('分包加载成功', res);
        },
        fail: (err) => {
          console.error('分包加载失败', err);
          throw err;
        }
      });
      
      // 设置当前游戏
      globalGameData.currentGame = gameId;
      
      // 初始化游戏
      this.currentScreen = 'game';
      
      // 引入游戏主模块
      const gameModule = require(`./games/${game.package}/main.js`);
      this.currentGameInstance = new gameModule.Game(this.canvas, this.ctx, {
        onExit: this.exitGame.bind(this),
        onScoreUpdate: this.updatePoints.bind(this)
      });
      
      wx.hideLoading();
    } catch (error) {
      console.error('加载游戏失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载游戏失败',
        icon: 'none'
      });
      
      // 返回主菜单
      this.showMainMenu();
    }
  }
  
  // 退出游戏
  exitGame() {
    // 清理当前游戏实例
    if (this.currentGameInstance && typeof this.currentGameInstance.destroy === 'function') {
      this.currentGameInstance.destroy();
    }
    
    this.currentGameInstance = null;
    globalGameData.currentGame = null;
    
    // 返回主菜单
    this.showMainMenu();
  }
  
  // 显示主菜单
  showMainMenu() {
    this.currentScreen = 'mainMenu';
  }
  
  // 渲染主菜单
  renderMainMenu() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('小游戏集合', width / 2, 80);
    
    // 绘制积分
    ctx.font = '24px Arial';
    ctx.fillText(`积分: ${globalGameData.points}`, width / 2, 130);
    
    // 绘制游戏图标
    const iconSize = 100;
    const padding = 20;
    const startY = 200;
    
    globalGameData.games.forEach((game, index) => {
      const iconX = (width - iconSize) / 2;
      const iconY = startY + (iconSize + padding) * index;
      
      // 绘制图标背景
      ctx.fillStyle = globalGameData.unlockedGames.includes(game.id) ? '#4CAF50' : '#9E9E9E';
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      
      // 绘制游戏名称
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText(game.name, width / 2, iconY + iconSize / 2);
      
      // 如果未解锁，显示所需积分
      if (!globalGameData.unlockedGames.includes(game.id)) {
        ctx.font = '16px Arial';
        ctx.fillText(`需要 ${game.unlockPoints} 积分`, width / 2, iconY + iconSize / 2 + 25);
      }
    });
  }
  
  // 游戏主循环
  gameLoop() {
    // 根据当前屏幕状态渲染
    if (this.currentScreen === 'mainMenu') {
      this.renderMainMenu();
    } else if (this.currentScreen === 'game' && this.currentGameInstance) {
      // 游戏自己负责渲染
      if (typeof this.currentGameInstance.update === 'function') {
        this.currentGameInstance.update();
      }
    }
    
    // 继续下一帧
    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// 创建游戏管理器实例
const gameManager = new GameManager();

// 导出全局数据，供子游戏使用
module.exports = {
  globalGameData,
  updatePoints: gameManager.updatePoints.bind(gameManager)
};