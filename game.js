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
        // 用户数据存在，更新全局数据
        const userData = userRes.data[0];
        globalGameData.userInfo = userData;
        globalGameData.points = userData.points || 0;
        globalGameData.unlockedGames = userData.unlockedGames || ['game1'];
        
        console.log('用户数据加载成功', userData);
      } else {
        // 用户数据不存在，创建新用户
        await this.createNewUser();
      }
    } catch (error) {
      console.error('加载用户数据失败', error);
      // 创建本地临时用户数据
      this.createLocalUserData();
    }
  }
  
  // 创建新用户
  async createNewUser() {
    try {
      // 调用云函数创建用户
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      });
      
      if (result.result && result.result.success) {
        // 用户创建成功，更新全局数据
        const userData = result.result.data;
        globalGameData.userInfo = userData;
        globalGameData.points = userData.points || 0;
        globalGameData.unlockedGames = userData.unlockedGames || ['game1'];
        
        console.log('新用户创建成功', userData);
      } else {
        console.error('创建用户失败', result);
        this.createLocalUserData();
      }
    } catch (error) {
      console.error('创建用户失败', error);
      this.createLocalUserData();
    }
  }
  
  // 创建本地临时用户数据
  createLocalUserData() {
    globalGameData.userInfo = {
      nickName: '游客',
      avatarUrl: 'images/default_avatar.png'
    };
    globalGameData.points = 0;
    globalGameData.unlockedGames = ['game1'];
    
    console.log('创建本地临时用户数据');
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    this.touchStartHandler = this.handleTouchStart.bind(this);
    this.touchMoveHandler = this.handleTouchMove.bind(this);
    this.touchEndHandler = this.handleTouchEnd.bind(this);
    
    wx.onTouchStart(this.touchStartHandler);
    wx.onTouchMove(this.touchMoveHandler);
    wx.onTouchEnd(this.touchEndHandler);
  }
  
  // 处理触摸开始事件
  handleTouchStart(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // 检查是否点击了游戏图标
    if (this.menuState === 'main') {
      this.checkGameIconClick(x, y);
    }
    
    // 检查是否点击了返回按钮
    if (this.menuState === 'game' && this.isPointInRect(x, y, this.backButton)) {
      this.exitCurrentGame();
    }
  }
  
  // 处理触摸移动事件
  handleTouchMove(e) {
    // 可以在这里添加拖动等逻辑
  }
  
  // 处理触摸结束事件
  handleTouchEnd(e) {
    // 可以在这里添加释放等逻辑
  }
  
  // 检查点是否在矩形内
  isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }
  
  // 检查游戏图标点击
  checkGameIconClick(x, y) {
    const games = globalGameData.games;
    const iconSize = 80;
    const padding = 20;
    const startX = (this.width - (iconSize * 3 + padding * 2)) / 2;
    const startY = this.height / 2 - 40;
    
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const row = Math.floor(i / 3);
      const col = i % 3;
      const iconX = startX + col * (iconSize + padding);
      const iconY = startY + row * (iconSize + padding);
      
      if (this.isPointInRect(x, y, { x: iconX, y: iconY, width: iconSize, height: iconSize })) {
        // 检查游戏是否已解锁
        if (globalGameData.unlockedGames.includes(game.id)) {
          this.loadGame(game.id);
        } else {
          // 显示未解锁提示
          this.showUnlockTip(game);
        }
        break;
      }
    }
  }
  
  // 显示未解锁提示
  showUnlockTip(game) {
    wx.showModal({
      title: '游戏未解锁',
      content: `需要 ${game.unlockPoints} 积分才能解锁此游戏，当前积分: ${globalGameData.points}`,
      showCancel: false,
      confirmText: '知道了'
    });
  }
  
  // 加载游戏
  async loadGame(gameId) {
    try {
      // 显示加载中
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      
      // 获取游戏配置
      const gameConfig = globalGameData.games.find(game => game.id === gameId);
      if (!gameConfig) {
        throw new Error('游戏配置不存在');
      }
      
      // 加载游戏分包
      const loadTask = wx.loadSubpackage({
        name: gameConfig.package,
        success: (res) => {
          console.log('分包加载成功', res);
        },
        fail: (err) => {
          console.error('分包加载失败', err);
          throw err;
        }
      });
      
      await new Promise((resolve, reject) => {
        loadTask.onProgressUpdate(res => {
          console.log('分包加载进度', res.progress);
        });
        
        loadTask.then(resolve).catch(reject);
      });
      
      // 导入游戏模块
      const gameModule = require(`./games/${gameConfig.package}/main.js`);
      
      // 创建游戏实例
      this.menuState = 'game';
      globalGameData.currentGame = new gameModule.Game(this.canvas, this.ctx, {
        onExit: this.handleGameExit.bind(this),
        onScore: this.handleGameScore.bind(this)
      });
      
      // 隐藏加载中
      wx.hideLoading();
    } catch (error) {
      console.error('加载游戏失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载游戏失败',
        icon: 'none',
        duration: 2000
      });
    }
  }
  
  // 处理游戏退出
  handleGameExit() {
    // 清理当前游戏
    if (globalGameData.currentGame && globalGameData.currentGame.destroy) {
      globalGameData.currentGame.destroy();
    }
    
    globalGameData.currentGame = null;
    this.menuState = 'main';
    
    // 重新显示主菜单
    this.showMainMenu();
  }
  
  // 处理游戏得分
  async handleGameScore(gameId, score) {
    try {
      // 调用云函数更新分数
      const result = await wx.cloud.callFunction({
        name: 'updateScore',
        data: {
          gameId,
          score
        }
      });
      
      if (result.result && result.result.success) {
        // 更新全局积分
        globalGameData.points = result.result.points;
        
        // 检查是否解锁新游戏
        if (result.result.newUnlocked && result.result.newUnlocked.length > 0) {
          globalGameData.unlockedGames = result.result.unlockedGames;
          
          // 显示解锁提示
          this.showUnlockSuccess(result.result.newUnlocked);
        }
        
        console.log('分数更新成功', result.result);
      } else {
        console.error('分数更新失败', result);
      }
    } catch (error) {
      console.error('分数更新失败', error);
    }
  }
  
  // 显示解锁成功提示
  showUnlockSuccess(newUnlocked) {
    const gameNames = newUnlocked.map(id => {
      const game = globalGameData.games.find(g => g.id === id);
      return game ? game.name : id;
    }).join(', ');
    
    wx.showModal({
      title: '恭喜解锁新游戏',
      content: `你已解锁: ${gameNames}`,
      showCancel: false,
      confirmText: '太棒了'
    });
  }
  
  // 退出当前游戏
  exitCurrentGame() {
    if (globalGameData.currentGame) {
      // 调用游戏的退出方法
      if (typeof globalGameData.currentGame.exit === 'function') {
        globalGameData.currentGame.exit();
      } else {
        this.handleGameExit();
      }
    }
  }
  
  // 显示主菜单
  showMainMenu() {
    this.menuState = 'main';
    
    // 设置返回按钮
    this.backButton = {
      x: 10,
      y: 10,
      width: 40,
      height: 40
    };
  }
  
  // 游戏循环
  gameLoop() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    if (this.menuState === 'main') {
      // 绘制主菜单
      this.drawMainMenu();
    } else if (this.menuState === 'game' && globalGameData.currentGame) {
      // 当前有游戏运行，绘制返回按钮
      this.drawBackButton();
    }
    
    // 继续下一帧
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  // 绘制主菜单
  drawMainMenu() {
    // 绘制背景
    if (this.commonResources && this.commonResources.backgroundImage) {
      this.ctx.drawImage(this.commonResources.backgroundImage, 0, 0, this.width, this.height);
    } else {
      // 默认背景
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 绘制标题
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('小游戏集合', this.width / 2, 60);
    
    // 绘制积分
    this.ctx.font = '18px Arial';
    this.ctx.fillText(`积分: ${globalGameData.points}`, this.width / 2, 90);
    
    // 绘制游戏图标
    const games = globalGameData.games;
    const iconSize = 80;
    const padding = 20;
    const startX = (this.width - (iconSize * 3 + padding * 2)) / 2;
    const startY = this.height / 2 - 40;
    
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const row = Math.floor(i / 3);
      const col = i % 3;
      const iconX = startX + col * (iconSize + padding);
      const iconY = startY + row * (iconSize + padding);
      
      // 绘制图标背景
      this.ctx.fillStyle = globalGameData.unlockedGames.includes(game.id) ? '#4CAF50' : '#999';
      this.ctx.fillRect(iconX, iconY, iconSize, iconSize);
      
      // 绘制图标（如果已加载）
      if (this.commonResources && this.commonResources[game.id + 'Icon']) {
        this.ctx.drawImage(this.commonResources[game.id + 'Icon'], iconX, iconY, iconSize, iconSize);
      } else {
        // 默认图标文字
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(game.name, iconX + iconSize / 2, iconY + iconSize / 2);
      }
      
      // 如果未解锁，绘制锁图标
      if (!globalGameData.unlockedGames.includes(game.id)) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        // 绘制锁图标
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('🔒', iconX + iconSize / 2, iconY + iconSize / 2);
        
        // 绘制所需积分
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`${game.unlockPoints}分`, iconX + iconSize / 2, iconY + iconSize / 2 + 20);
      }
      
      // 绘制游戏名称
      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(game.name, iconX + iconSize / 2, iconY + iconSize + 15);
    }
    
    // 绘制底部信息
    this.ctx.font = '12px Arial';
    this.ctx.fillText('© 2023 小游戏集合', this.width / 2, this.height - 20);
  }
  
  // 绘制返回按钮
  drawBackButton() {
    const { x, y, width, height } = this.backButton;
    
    // 绘制按钮背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, width, height);
    
    // 绘制返回图标
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('←', x + width / 2, y + height / 2 + 5);
  }
}

// 更新积分函数
const updatePoints = async (points) => {
  if (!points || isNaN(points)) return false;
  
  try {
    // 调用云函数更新积分
    const result = await wx.cloud.callFunction({
      name: 'updateScore',
      data: {
        points
      }
    });
    
    if (result.result && result.result.success) {
      // 更新全局积分
      globalGameData.points = result.result.points;
      
      // 检查是否解锁新游戏
      if (result.result.newUnlocked && result.result.newUnlocked.length > 0) {
        globalGameData.unlockedGames = result.result.unlockedGames;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('更新积分失败', error);
    return false;
  }
};

// 创建游戏管理器实例
const gameManager = new GameManager();

// 导出全局游戏数据和更新积分函数
module.exports = {
  globalGameData,
  updatePoints
};