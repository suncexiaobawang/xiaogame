// 弹球游戏主文件

// 导入全局游戏数据
const { globalGameData, updatePoints } = require('../../game.js');

// 游戏类
class Game {
  constructor(canvas, ctx, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.callbacks = callbacks;
    
    // 获取画布尺寸
    this.width = canvas.width;
    this.height = canvas.height;
    
    // 游戏状态
    this.gameState = 'ready'; // ready, playing, paused, gameOver
    
    // 游戏分数
    this.score = 0;
    
    // 挡板配置
    this.paddle = {
      width: 100,
      height: 15,
      x: 0,
      y: this.height - 30,
      speed: 8,
      color: '#2196F3'
    };
    
    // 球配置
    this.ball = {
      x: 0,
      y: 0,
      radius: 10,
      speedX: 5,
      speedY: -5,
      color: '#F44336',
      maxSpeed: 15
    };
    
    // 砖块配置
    this.brickConfig = {
      rows: 5,
      cols: 8,
      width: 60,
      height: 20,
      padding: 10,
      offsetTop: 80,
      offsetLeft: 35,
      colors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5']
    };
    
    // 砖块数组
    this.bricks = [];
    
    // 初始化砖块
    this.initBricks();
    
    // 初始化触摸事件
    this.initTouchEvents();
    
    // 开始游戏循环
    this.lastTime = 0;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    // 显示开始界面
    this.showStartScreen();
  }
  
  // 初始化砖块
  initBricks() {
    const { rows, cols, width, height, padding, offsetTop, offsetLeft, colors } = this.brickConfig;
    
    this.bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const brick = {
          x: c * (width + padding) + offsetLeft,
          y: r * (height + padding) + offsetTop,
          width,
          height,
          color: colors[r % colors.length],
          hit: false
        };
        this.bricks.push(brick);
      }
    }
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    // 触摸移动处理函数
    this.touchMoveHandler = (e) => {
      if (this.gameState !== 'playing') return;
      
      const touch = e.touches[0];
      const touchX = touch.clientX;
      
      // 移动挡板（中心对齐）
      this.paddle.x = touchX - this.paddle.width / 2;
      
      // 确保挡板不超出边界
      if (this.paddle.x < 0) {
        this.paddle.x = 0;
      } else if (this.paddle.x + this.paddle.width > this.width) {
        this.paddle.x = this.width - this.paddle.width;
      }
    };
    
    // 触摸开始处理函数
    this.touchStartHandler = (e) => {
      const touch = e.touches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // 如果游戏处于准备状态，开始游戏
      if (this.gameState === 'ready') {
        this.startGame();
        return;
      }
      
      // 如果游戏已结束，重新开始
      if (this.gameState === 'gameOver') {
        this.resetGame();
        return;
      }
      
      // 检查返回按钮点击
      if (this.backButton && 
          touchX >= this.backButton.x && touchX <= this.backButton.x + this.backButton.width &&
          touchY >= this.backButton.y && touchY <= this.backButton.y + this.backButton.height) {
        this.exitGame();
        return;
      }
      
      // 如果游戏正在进行，移动挡板
      if (this.gameState === 'playing') {
        this.paddle.x = touchX - this.paddle.width / 2;
        
        // 确保挡板不超出边界
        if (this.paddle.x < 0) {
          this.paddle.x = 0;
        } else if (this.paddle.x + this.paddle.width > this.width) {
          this.paddle.x = this.width - this.paddle.width;
        }
      }
    };
    
    // 注册触摸事件
    wx.onTouchMove(this.touchMoveHandler);
    wx.onTouchStart(this.touchStartHandler);
  }
  
  // 开始游戏
  startGame() {
    if (this.gameState !== 'ready' && this.gameState !== 'gameOver') return;
    
    this.gameState = 'playing';
    this.score = 0;
    
    // 重置挡板位置
    this.paddle.x = (this.width - this.paddle.width) / 2;
    
    // 重置球位置和速度
    this.ball.x = this.width / 2;
    this.ball.y = this.height - 50;
    this.ball.speedX = 5;
    this.ball.speedY = -5;
    
    // 重置砖块
    this.initBricks();
  }
  
  // 重置游戏
  resetGame() {
    this.gameState = 'ready';
    this.showStartScreen();
  }
  
  // 显示开始界面
  showStartScreen() {
    const ctx = this.ctx;
    
    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    ctx.fillStyle = '#ECEFF1';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制游戏标题
    ctx.fillStyle = '#2196F3';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('弹球游戏', this.width / 2, 100);
    
    // 绘制开始提示
    ctx.fillStyle = '#455A64';
    ctx.font = '24px Arial';
    ctx.fillText('点击屏幕开始游戏', this.width / 2, this.height / 2);
    
    // 绘制游戏说明
    ctx.font = '18px Arial';
    ctx.fillText('移动挡板反弹球，击碎所有砖块', this.width / 2, this.height / 2 + 40);
    
    // 绘制返回按钮
    this.drawBackButton();
  }
  
  // 显示游戏结束界面
  showGameOverScreen() {
    const ctx = this.ctx;
    
    // 半透明覆盖层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制游戏结束文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 50);
    
    // 绘制分数
    ctx.font = '24px Arial';
    ctx.fillText(`得分: ${this.score}`, this.width / 2, this.height / 2);
    
    // 绘制重新开始提示
    ctx.font = '18px Arial';
    ctx.fillText('点击屏幕重新开始', this.width / 2, this.height / 2 + 50);
  }
  
  // 绘制返回按钮
  drawBackButton() {
    const ctx = this.ctx;
    
    // 按钮位置和大小
    this.backButton = {
      x: 20,
      y: 20,
      width: 80,
      height: 40
    };
    
    // 绘制按钮
    ctx.fillStyle = '#CFD8DC';
    ctx.fillRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
    
    // 绘制按钮边框
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
    
    // 绘制按钮文字
    ctx.fillStyle = '#455A64';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', this.backButton.x + this.backButton.width / 2, this.backButton.y + this.backButton.height / 2 + 5);
  }
  
  // 退出游戏
  exitGame() {
    // 移除事件监听
    if (this.touchMoveHandler) {
      wx.offTouchMove(this.touchMoveHandler);
    }
    
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler);
    }
    
    // 调用退出回调
    if (this.callbacks && typeof this.callbacks.onExit === 'function') {
      this.callbacks.onExit();
    }
  }
  
  // 更新游戏状态
  update() {
    if (this.gameState !== 'playing') return;
    
    // 移动球
    this.ball.x += this.ball.speedX;
    this.ball.y += this.ball.speedY;
    
    // 检测球与墙壁的碰撞
    this.checkWallCollision();
    
    // 检测球与挡板的碰撞
    this.checkPaddleCollision();
    
    // 检测球与砖块的碰撞
    this.checkBrickCollision();
    
    // 检查关卡是否完成
    this.checkLevelComplete();
    
    // 检查游戏是否结束
    this.checkGameOver();
  }
  
  // 检测球与墙壁的碰撞
  checkWallCollision() {
    // 左右墙壁碰撞
    if (this.ball.x - this.ball.radius < 0 || 
        this.ball.x + this.ball.radius > this.width) {
      this.ball.speedX = -this.ball.speedX;
      
      // 确保球不会卡在墙内
      if (this.ball.x - this.ball.radius < 0) {
        this.ball.x = this.ball.radius;
      } else if (this.ball.x + this.ball.radius > this.width) {
        this.ball.x = this.width - this.ball.radius;
      }
    }
    
    // 上墙壁碰撞
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.speedY = -this.ball.speedY;
      this.ball.y = this.ball.radius; // 确保球不会卡在墙内
    }
  }
  
  // 检测球与挡板的碰撞
  checkPaddleCollision() {
    if (this.ball.y + this.ball.radius > this.paddle.y && 
        this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height && 
        this.ball.x > this.paddle.x && 
        this.ball.x < this.paddle.x + this.paddle.width) {
      
      // 计算球击中挡板的位置（相对于挡板中心的偏移）
      const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
      
      // 根据击中位置调整球的水平速度（-1.0到1.0的范围）
      this.ball.speedX = hitPos * 8;
      
      // 反弹球
      this.ball.speedY = -Math.abs(this.ball.speedY);
      
      // 确保球不会卡在挡板内
      this.ball.y = this.paddle.y - this.ball.radius;
      
      // 增加球速（随着游戏进行，球会越来越快）
      this.increaseBallSpeed();
    }
  }
  
  // 检测球与砖块的碰撞
  checkBrickCollision() {
    for (const brick of this.bricks) {
      if (!brick.hit && 
          this.ball.x + this.ball.radius > brick.x && 
          this.ball.x - this.ball.radius < brick.x + brick.width && 
          this.ball.y + this.ball.radius > brick.y && 
          this.ball.y - this.ball.radius < brick.y + brick.height) {
        
        // 标记砖块为已击中
        brick.hit = true;
        
        // 增加分数
        this.score += 10;
        
        // 确定球从哪个方向击中砖块
        // 计算球心到砖块四条边的距离
        const distLeft = Math.abs(this.ball.x - brick.x);
        const distRight = Math.abs(this.ball.x - (brick.x + brick.width));
        const distTop = Math.abs(this.ball.y - brick.y);
        const distBottom = Math.abs(this.ball.y - (brick.y + brick.height));
        
        // 找出最小距离，确定碰撞方向
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        
        if (minDist === distLeft || minDist === distRight) {
          // 水平碰撞
          this.ball.speedX = -this.ball.speedX;
        } else {
          // 垂直碰撞
          this.ball.speedY = -this.ball.speedY;
        }
        
        // 只处理一次碰撞（防止一帧内多次碰撞）
        break;
      }
    }
  }
  
  // 增加球速
  increaseBallSpeed() {
    // 每次击中挡板，球速略微增加
    const speedIncrease = 0.2;
    
    // 增加X速度（保持方向）
    if (this.ball.speedX > 0) {
      this.ball.speedX = Math.min(this.ball.speedX + speedIncrease, this.ball.maxSpeed);
    } else {
      this.ball.speedX = Math.max(this.ball.speedX - speedIncrease, -this.ball.maxSpeed);
    }
    
    // 增加Y速度（保持方向）
    if (this.ball.speedY > 0) {
      this.ball.speedY = Math.min(this.ball.speedY + speedIncrease, this.ball.maxSpeed);
    } else {
      this.ball.speedY = Math.max(this.ball.speedY - speedIncrease, -this.ball.maxSpeed);
    }
  }
  
  // 检查关卡是否完成
  checkLevelComplete() {
    // 检查是否所有砖块都被击中
    const allBricksHit = this.bricks.every(brick => brick.hit);
    
    if (allBricksHit) {
      // 关卡完成
      this.gameState = 'gameOver';
      
      // 奖励积分
      const levelCompleteBonus = 100;
      this.score += levelCompleteBonus;
      
      // 更新全局积分
      if (this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
        this.callbacks.onScoreUpdate(this.score);
      }
      
      // 显示胜利消息
      wx.showToast({
        title: '恭喜通关！',
        icon: 'success',
        duration: 2000
      });
    }
  }
  
  // 检查游戏是否结束
  checkGameOver() {
    // 如果球掉落到屏幕底部，游戏结束
    if (this.ball.y + this.ball.radius > this.height) {
      this.gameState = 'gameOver';
      
      // 更新全局积分
      if (this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
        this.callbacks.onScoreUpdate(this.score);
      }
    }
  }
  
  // 渲染游戏
  render() {
    const ctx = this.ctx;
    
    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    ctx.fillStyle = '#ECEFF1';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 如果游戏处于准备状态，显示开始界面
    if (this.gameState === 'ready') {
      this.showStartScreen();
      return;
    }
    
    // 如果游戏已结束，显示游戏结束界面
    if (this.gameState === 'gameOver') {
      // 先绘制游戏元素，再绘制结束界面
      this.drawBricks();
      this.drawPaddle();
      this.drawBall();
      this.drawScore();
      this.drawBackButton();
      
      this.showGameOverScreen();
      return;
    }
    
    // 绘制游戏元素
    this.drawBricks();
    this.drawPaddle();
    this.drawBall();
    this.drawScore();
    this.drawBackButton();
  }
  
  // 绘制砖块
  drawBricks() {
    const ctx = this.ctx;
    
    for (const brick of this.bricks) {
      if (!brick.hit) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // 绘制砖块边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    }
  }
  
  // 绘制挡板
  drawPaddle() {
    const ctx = this.ctx;
    
    ctx.fillStyle = this.paddle.color;
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    
    // 绘制挡板边框
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
  }
  
  // 绘制球
  drawBall() {
    const ctx = this.ctx;
    
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.ball.color;
    ctx.fill();
    ctx.closePath();
    
    // 绘制球的边框
    ctx.strokeStyle = '#C62828';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // 绘制分数
  drawScore() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#455A64';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${this.score}`, 120, 30);
  }
  
  // 游戏动画循环
  animate(currentTime) {
    // 计算时间差
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // 更新游戏状态
    this.update(deltaTime);
    
    // 渲染游戏
    this.render();
    
    // 继续下一帧
    requestAnimationFrame(this.animate);
  }
  
  // 销毁游戏实例
  destroy() {
    // 移除事件监听
    if (this.touchMoveHandler) {
      wx.offTouchMove(this.touchMoveHandler);
    }
    
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler);
    }
  }
}

// 导出游戏类
module.exports = {
  Game
};