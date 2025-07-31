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
    
    // 游戏元素
    this.paddle = {
      x: this.width / 2 - 50,
      y: this.height - 30,
      width: 100,
      height: 15,
      speed: 8,
      color: '#4CAF50'
    };
    
    this.ball = {
      x: this.width / 2,
      y: this.height - 50,
      radius: 8,
      speedX: 0,
      speedY: 0,
      maxSpeed: 8,
      color: '#FFC107'
    };
    
    // 砖块配置
    this.brickConfig = {
      rows: 5,
      cols: 8,
      width: 60,
      height: 20,
      padding: 10,
      offsetX: 45,
      offsetY: 60,
      colors: ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3']
    };
    
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
    this.bricks = [];
    const { rows, cols, width, height, padding, offsetX, offsetY, colors } = this.brickConfig;
    
    for (let r = 0; r < rows; r++) {
      this.bricks[r] = [];
      for (let c = 0; c < cols; c++) {
        const brickX = c * (width + padding) + offsetX;
        const brickY = r * (height + padding) + offsetY;
        
        this.bricks[r][c] = {
          x: brickX,
          y: brickY,
          width,
          height,
          color: colors[r],
          status: 1 // 1 = 存在，0 = 被击中
        };
      }
    }
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    this.touchHandler = (e) => {
      const touch = e.touches[0];
      const touchX = touch.clientX;
      
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
      
      // 移动挡板
      const paddleHalfWidth = this.paddle.width / 2;
      this.paddle.x = touchX - paddleHalfWidth;
      
      // 确保挡板不超出边界
      if (this.paddle.x < 0) {
        this.paddle.x = 0;
      } else if (this.paddle.x + this.paddle.width > this.width) {
        this.paddle.x = this.width - this.paddle.width;
      }
    };
    
    // 注册触摸事件
    wx.onTouchMove(this.touchHandler);
    wx.onTouchStart(this.touchHandler);
  }
  
  // 开始游戏
  startGame() {
    if (this.gameState !== 'ready' && this.gameState !== 'gameOver') return;
    
    this.gameState = 'playing';
    
    // 设置球的初始速度
    this.ball.speedX = 4;
    this.ball.speedY = -4;
    
    // 重置球的位置
    this.ball.x = this.width / 2;
    this.ball.y = this.height - 50;
  }
  
  // 重置游戏
  resetGame() {
    this.score = 0;
    this.gameState = 'ready';
    
    // 重置球的位置和速度
    this.ball.x = this.width / 2;
    this.ball.y = this.height - 50;
    this.ball.speedX = 0;
    this.ball.speedY = 0;
    
    // 重置挡板位置
    this.paddle.x = this.width / 2 - this.paddle.width / 2;
    
    // 重新初始化砖块
    this.initBricks();
    
    // 显示开始界面
    this.showStartScreen();
  }
  
  // 显示开始界面
  showStartScreen() {
    const ctx = this.ctx;
    
    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制游戏标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('弹球游戏', this.width / 2, 100);
    
    // 绘制开始提示
    ctx.font = '24px Arial';
    ctx.fillText('点击屏幕开始游戏', this.width / 2, this.height / 2);
    
    // 绘制游戏说明
    ctx.font = '18px Arial';
    ctx.fillText('用手指左右滑动控制挡板', this.width / 2, this.height / 2 + 50);
    ctx.fillText('击碎所有砖块获得积分', this.width / 2, this.height / 2 + 80);
    
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
    ctx.fillStyle = '#333';
    ctx.fillRect(this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
    
    // 绘制按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', this.backButton.x + this.backButton.width / 2, this.backButton.y + this.backButton.height / 2 + 5);
    
    // 添加返回按钮点击事件
    if (!this.backButtonHandler) {
      this.backButtonHandler = (e) => {
        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // 检查是否点击了返回按钮
        if (touchX >= this.backButton.x && touchX <= this.backButton.x + this.backButton.width &&
            touchY >= this.backButton.y && touchY <= this.backButton.y + this.backButton.height) {
          this.exitGame();
        }
      };
      
      wx.onTouchStart(this.backButtonHandler);
    }
  }
  
  // 退出游戏
  exitGame() {
    // 移除事件监听
    if (this.touchHandler) {
      wx.offTouchMove(this.touchHandler);
      wx.offTouchStart(this.touchHandler);
    }
    
    if (this.backButtonHandler) {
      wx.offTouchStart(this.backButtonHandler);
    }
    
    // 调用退出回调
    if (this.callbacks && typeof this.callbacks.onExit === 'function') {
      this.callbacks.onExit();
    }
  }
  
  // 更新游戏状态
  update(deltaTime) {
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
    
    // 检查是否所有砖块都被击中
    this.checkLevelComplete();
    
    // 检查是否游戏结束（球掉落）
    this.checkGameOver();
  }
  
  // 检测球与墙壁的碰撞
  checkWallCollision() {
    // 左右墙壁
    if (this.ball.x - this.ball.radius < 0 || 
        this.ball.x + this.ball.radius > this.width) {
      this.ball.speedX = -this.ball.speedX;
      
      // 修正位置，防止卡在墙内
      if (this.ball.x - this.ball.radius < 0) {
        this.ball.x = this.ball.radius;
      } else {
        this.ball.x = this.width - this.ball.radius;
      }
    }
    
    // 上墙壁
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.speedY = -this.ball.speedY;
      this.ball.y = this.ball.radius; // 修正位置
    }
  }
  
  // 检测球与挡板的碰撞
  checkPaddleCollision() {
    if (this.ball.y + this.ball.radius > this.paddle.y && 
        this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height && 
        this.ball.x > this.paddle.x && 
        this.ball.x < this.paddle.x + this.paddle.width) {
      
      // 计算碰撞点相对于挡板中心的位置（-1到1之间）
      const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
      
      // 根据碰撞位置调整反弹角度
      const angle = hitPos * Math.PI / 3; // 最大±60度
      
      // 计算新的速度
      const speed = Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY);
      this.ball.speedX = speed * Math.sin(angle);
      this.ball.speedY = -speed * Math.cos(angle);
      
      // 确保球不会卡在挡板内
      this.ball.y = this.paddle.y - this.ball.radius;
    }
  }
  
  // 检测球与砖块的碰撞
  checkBrickCollision() {
    const { rows, cols } = this.brickConfig;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const brick = this.bricks[r][c];
        
        // 如果砖块已被击中，跳过
        if (brick.status === 0) continue;
        
        // 检查碰撞
        if (this.ball.x > brick.x && 
            this.ball.x < brick.x + brick.width && 
            this.ball.y > brick.y && 
            this.ball.y < brick.y + brick.height) {
          
          // 改变球的方向
          this.ball.speedY = -this.ball.speedY;
          
          // 标记砖块为已击中
          brick.status = 0;
          
          // 增加分数
          this.score += 10;
          
          // 播放音效
          // TODO: 添加音效
          
          // 检查是否需要增加球速
          this.increaseBallSpeed();
        }
      }
    }
  }
  
  // 增加球的速度
  increaseBallSpeed() {
    // 每得到50分增加一点速度，但不超过最大速度
    if (this.score % 50 === 0) {
      const currentSpeed = Math.sqrt(this.ball.speedX * this.ball.speedX + this.ball.speedY * this.ball.speedY);
      if (currentSpeed < this.ball.maxSpeed) {
        // 增加10%的速度
        const factor = 1.1;
        this.ball.speedX *= factor;
        this.ball.speedY *= factor;
      }
    }
  }
  
  // 检查关卡是否完成
  checkLevelComplete() {
    const { rows, cols } = this.brickConfig;
    let allBricksHit = true;
    
    // 检查是否所有砖块都被击中
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.bricks[r][c].status === 1) {
          allBricksHit = false;
          break;
        }
      }
      if (!allBricksHit) break;
    }
    
    // 如果所有砖块都被击中，游戏胜利
    if (allBricksHit) {
      // 奖励积分
      const bonusPoints = 100;
      this.score += bonusPoints;
      
      // 更新全局积分
      if (this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
        this.callbacks.onScoreUpdate(this.score);
      }
      
      // 显示胜利消息
      wx.showToast({
        title: `胜利！获得${this.score}积分`,
        icon: 'success',
        duration: 2000
      });
      
      // 重置游戏，准备下一关
      setTimeout(() => {
        this.resetGame();
      }, 2000);
    }
  }
  
  // 检查游戏是否结束
  checkGameOver() {
    // 如果球掉到屏幕底部，游戏结束
    if (this.ball.y + this.ball.radius > this.height) {
      this.gameState = 'gameOver';
      
      // 更新全局积分（只有得分大于0才更新）
      if (this.score > 0 && this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
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
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 如果游戏处于准备状态，显示开始界面
    if (this.gameState === 'ready') {
      this.showStartScreen();
      return;
    }
    
    // 如果游戏结束，显示游戏结束界面
    if (this.gameState === 'gameOver') {
      this.showGameOverScreen();
      return;
    }
    
    // 绘制砖块
    this.drawBricks();
    
    // 绘制挡板
    this.drawPaddle();
    
    // 绘制球
    this.drawBall();
    
    // 绘制分数
    this.drawScore();
    
    // 绘制返回按钮
    this.drawBackButton();
  }
  
  // 绘制砖块
  drawBricks() {
    const ctx = this.ctx;
    const { rows, cols } = this.brickConfig;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const brick = this.bricks[r][c];
        
        // 如果砖块已被击中，跳过
        if (brick.status === 0) continue;
        
        // 绘制砖块
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
    
    // 绘制挡板主体
    ctx.fillStyle = this.paddle.color;
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    
    // 绘制挡板边框
    ctx.strokeStyle = '#333';
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
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }
  
  // 绘制分数
  drawScore() {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`得分: ${this.score}`, this.width - 20, 30);
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
    if (this.touchHandler) {
      wx.offTouchMove(this.touchHandler);
      wx.offTouchStart(this.touchHandler);
    }
    
    if (this.backButtonHandler) {
      wx.offTouchStart(this.backButtonHandler);
    }
  }
}

// 导出游戏类
module.exports = {
  Game
};