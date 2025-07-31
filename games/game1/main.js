// 弹球游戏主文件

// 导入全局游戏数据和更新积分函数
const { globalGameData, updatePoints } = require('../../game');

// 游戏类
class Game {
  constructor(canvas, ctx, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.callbacks = callbacks || {};
    
    // 获取系统信息
    this.systemInfo = wx.getSystemInfoSync();
    this.width = this.systemInfo.windowWidth;
    this.height = this.systemInfo.windowHeight;
    
    // 游戏状态
    this.state = 'start'; // start, playing, paused, gameover
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    // 游戏元素
    this.paddle = {
      x: this.width / 2 - 40,
      y: this.height - 30,
      width: 80,
      height: 10,
      speed: 8
    };
    
    this.ball = {
      x: this.width / 2,
      y: this.height - 50,
      radius: 8,
      dx: 4,
      dy: -4,
      speed: 4,
      maxSpeed: 8
    };
    
    // 砖块配置
    this.brickRowCount = 5;
    this.brickColumnCount = 8;
    this.brickWidth = (this.width - 50) / this.brickColumnCount;
    this.brickHeight = 20;
    this.brickPadding = 5;
    this.brickOffsetTop = 80;
    this.brickOffsetLeft = 25;
    
    // 初始化砖块
    this.initBricks();
    
    // 返回按钮
    this.backButton = {
      x: 10,
      y: 10,
      width: 40,
      height: 40
    };
    
    // 初始化触摸事件
    this.initTouchEvents();
    
    // 显示开始界面
    this.showStartScreen();
  }
  
  // 初始化砖块
  initBricks() {
    this.bricks = [];
    for (let c = 0; c < this.brickColumnCount; c++) {
      this.bricks[c] = [];
      for (let r = 0; r < this.brickRowCount; r++) {
        // 根据行数设置不同的砖块颜色和分数
        let points = (this.brickRowCount - r) * 10;
        let color;
        switch (r) {
          case 0: color = '#FF5252'; break; // 红色
          case 1: color = '#FF9800'; break; // 橙色
          case 2: color = '#FFEB3B'; break; // 黄色
          case 3: color = '#4CAF50'; break; // 绿色
          case 4: color = '#2196F3'; break; // 蓝色
          default: color = '#9C27B0'; break; // 紫色
        }
        
        this.bricks[c][r] = {
          x: c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
          y: r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
          width: this.brickWidth,
          height: this.brickHeight,
          status: 1, // 1 = 未被击中
          color: color,
          points: points
        };
      }
    }
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    this.touchStartX = 0;
    this.touchMoveX = 0;
    this.isTouching = false;
    
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
    this.touchStartX = touch.clientX;
    this.touchMoveX = touch.clientX;
    this.isTouching = true;
    
    // 检查是否点击了返回按钮
    if (this.isPointInRect(touch.clientX, touch.clientY, this.backButton)) {
      this.exit();
      return;
    }
    
    // 如果在开始界面，点击任意位置开始游戏
    if (this.state === 'start') {
      this.startGame();
      return;
    }
    
    // 如果游戏结束，点击任意位置重新开始
    if (this.state === 'gameover') {
      this.resetGame();
      return;
    }
    
    // 如果游戏暂停，点击任意位置继续
    if (this.state === 'paused') {
      this.resumeGame();
      return;
    }
  }
  
  // 处理触摸移动事件
  handleTouchMove(e) {
    if (!this.isTouching || this.state !== 'playing') return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchMoveX;
    this.touchMoveX = touch.clientX;
    
    // 移动挡板
    this.paddle.x += deltaX;
    
    // 确保挡板不会移出屏幕
    if (this.paddle.x < 0) {
      this.paddle.x = 0;
    } else if (this.paddle.x + this.paddle.width > this.width) {
      this.paddle.x = this.width - this.paddle.width;
    }
  }
  
  // 处理触摸结束事件
  handleTouchEnd(e) {
    this.isTouching = false;
  }
  
  // 检查点是否在矩形内
  isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }
  
  // 显示开始界面
  showStartScreen() {
    this.state = 'start';
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制游戏标题
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('弹球游戏', this.width / 2, this.height / 3);
    
    // 绘制开始提示
    this.ctx.font = '18px Arial';
    this.ctx.fillText('点击屏幕开始游戏', this.width / 2, this.height / 2);
    
    // 绘制游戏说明
    this.ctx.font = '14px Arial';
    this.ctx.fillText('移动挡板反弹小球击碎砖块', this.width / 2, this.height / 2 + 40);
    
    // 绘制返回按钮
    this.drawBackButton();
    
    // 请求下一帧动画
    requestAnimationFrame(this.showStartScreen.bind(this));
  }
  
  // 开始游戏
  startGame() {
    this.state = 'playing';
    this.gameLoop();
  }
  
  // 暂停游戏
  pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }
  
  // 继续游戏
  resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.gameLoop();
    }
  }
  
  // 重置游戏
  resetGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    // 重置挡板
    this.paddle.x = this.width / 2 - this.paddle.width / 2;
    
    // 重置球
    this.ball.x = this.width / 2;
    this.ball.y = this.height - 50;
    this.ball.dx = 4;
    this.ball.dy = -4;
    this.ball.speed = 4;
    
    // 重置砖块
    this.initBricks();
    
    // 开始游戏
    this.startGame();
  }
  
  // 游戏退出
  exit() {
    // 移除触摸事件监听
    wx.offTouchStart(this.touchStartHandler);
    wx.offTouchMove(this.touchMoveHandler);
    wx.offTouchEnd(this.touchEndHandler);
    
    // 调用退出回调
    if (this.callbacks.onExit) {
      this.callbacks.onExit();
    }
  }
  
  // 游戏状态更新
  update() {
    if (this.state !== 'playing') return;
    
    // 移动球
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
    
    // 检测球与墙壁的碰撞
    // 左右墙壁
    if (this.ball.x + this.ball.radius > this.width || this.ball.x - this.ball.radius < 0) {
      this.ball.dx = -this.ball.dx;
    }
    
    // 上墙壁
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.dy = -this.ball.dy;
    }
    
    // 下墙壁（失败）
    if (this.ball.y + this.ball.radius > this.height) {
      this.lives--;
      
      if (this.lives <= 0) {
        // 游戏结束
        this.gameOver();
      } else {
        // 重置球位置
        this.ball.x = this.width / 2;
        this.ball.y = this.height - 50;
        this.ball.dx = 4;
        this.ball.dy = -4;
        this.ball.speed = 4;
        
        // 重置挡板位置
        this.paddle.x = this.width / 2 - this.paddle.width / 2;
      }
    }
    
    // 检测球与挡板的碰撞
    if (
      this.ball.y + this.ball.radius > this.paddle.y &&
      this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
      this.ball.x > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.width
    ) {
      // 计算球击中挡板的位置（相对于挡板中心的偏移）
      const hitPos = (this.ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
      
      // 根据击中位置调整反弹角度
      const angle = hitPos * Math.PI / 3; // 最大±60度
      
      // 设置球的新方向
      this.ball.dx = this.ball.speed * Math.sin(angle);
      this.ball.dy = -this.ball.speed * Math.cos(angle);
      
      // 增加球速（有上限）
      this.increaseBallSpeed();
    }
    
    // 检测球与砖块的碰撞
    let bricksLeft = 0;
    for (let c = 0; c < this.brickColumnCount; c++) {
      for (let r = 0; r < this.brickRowCount; r++) {
        const brick = this.bricks[c][r];
        
        if (brick.status === 1) {
          bricksLeft++;
          
          if (
            this.ball.x > brick.x &&
            this.ball.x < brick.x + brick.width &&
            this.ball.y > brick.y &&
            this.ball.y < brick.y + brick.height
          ) {
            this.ball.dy = -this.ball.dy;
            brick.status = 0;
            
            // 增加分数
            this.score += brick.points;
            
            // 增加球速
            this.increaseBallSpeed();
          }
        }
      }
    }
    
    // 检查是否完成关卡
    if (bricksLeft === 0) {
      this.level++;
      this.ball.speed = 4; // 重置球速
      
      // 重置球位置
      this.ball.x = this.width / 2;
      this.ball.y = this.height - 50;
      this.ball.dx = 4;
      this.ball.dy = -4;
      
      // 重置挡板位置
      this.paddle.x = this.width / 2 - this.paddle.width / 2;
      
      // 初始化新的砖块
      this.initBricks();
    }
  }
  
  // 增加球速
  increaseBallSpeed() {
    if (this.ball.speed < this.ball.maxSpeed) {
      this.ball.speed += 0.1;
      
      // 保持方向不变，只增加速度
      const direction = Math.atan2(this.ball.dx, -this.ball.dy);
      this.ball.dx = this.ball.speed * Math.sin(direction);
      this.ball.dy = -this.ball.speed * Math.cos(direction);
    }
  }
  
  // 游戏结束
  gameOver() {
    this.state = 'gameover';
    
    // 更新积分
    if (this.callbacks.onScore) {
      this.callbacks.onScore('game1', this.score);
    }
    
    // 绘制游戏结束界面
    this.drawGameOver();
  }
  
  // 绘制游戏
  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制砖块
    this.drawBricks();
    
    // 绘制挡板
    this.drawPaddle();
    
    // 绘制球
    this.drawBall();
    
    // 绘制分数
    this.drawScore();
    
    // 绘制生命值
    this.drawLives();
    
    // 绘制关卡
    this.drawLevel();
    
    // 绘制返回按钮
    this.drawBackButton();
    
    // 如果游戏暂停，绘制暂停提示
    if (this.state === 'paused') {
      this.drawPaused();
    }
  }
  
  // 绘制砖块
  drawBricks() {
    for (let c = 0; c < this.brickColumnCount; c++) {
      for (let r = 0; r < this.brickRowCount; r++) {
        const brick = this.bricks[c][r];
        
        if (brick.status === 1) {
          this.ctx.fillStyle = brick.color;
          this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          
          // 绘制砖块边框
          this.ctx.strokeStyle = '#FFF';
          this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
      }
    }
  }
  
  // 绘制挡板
  drawPaddle() {
    // 绘制挡板主体
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    
    // 绘制挡板边框
    this.ctx.strokeStyle = '#FFF';
    this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    
    // 绘制挡板装饰
    this.ctx.fillStyle = '#81C784';
    this.ctx.fillRect(this.paddle.x + 5, this.paddle.y + 2, this.paddle.width - 10, this.paddle.height - 4);
  }
  
  // 绘制球
  drawBall() {
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFF';
    this.ctx.fill();
    this.ctx.closePath();
    
    // 绘制球的光晕效果
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x - 2, this.ball.y - 2, this.ball.radius / 3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();
    this.ctx.closePath();
  }
  
  // 绘制分数
  drawScore() {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`分数: ${this.score}`, 10, 25);
  }
  
  // 绘制生命值
  drawLives() {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`生命: ${this.lives}`, this.width - 10, 25);
  }
  
  // 绘制关卡
  drawLevel() {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`关卡: ${this.level}`, this.width / 2, 25);
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
  
  // 绘制暂停提示
  drawPaused() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏暂停', this.width / 2, this.height / 2);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText('点击屏幕继续', this.width / 2, this.height / 2 + 40);
  }
  
  // 绘制游戏结束界面
  drawGameOver() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制游戏结束文字
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#FF5252';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.width / 2, this.height / 3);
    
    // 绘制最终分数
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillText(`最终分数: ${this.score}`, this.width / 2, this.height / 2);
    
    // 绘制重新开始提示
    this.ctx.font = '18px Arial';
    this.ctx.fillText('点击屏幕重新开始', this.width / 2, this.height / 2 + 40);
    
    // 绘制返回按钮
    this.drawBackButton();
    
    // 请求下一帧动画
    requestAnimationFrame(this.drawGameOver.bind(this));
  }
  
  // 游戏循环
  gameLoop() {
    if (this.state !== 'playing') return;
    
    // 更新游戏状态
    this.update();
    
    // 绘制游戏
    this.draw();
    
    // 请求下一帧动画
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  // 销毁方法
  destroy() {
    // 移除触摸事件监听
    wx.offTouchStart(this.touchStartHandler);
    wx.offTouchMove(this.touchMoveHandler);
    wx.offTouchEnd(this.touchEndHandler);
  }
}

// 导出游戏类
module.exports = {
  Game
};