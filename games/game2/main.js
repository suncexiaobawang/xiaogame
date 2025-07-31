// 记忆配对游戏主文件

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
    this.moves = 0;
    
    // 卡片配置
    this.cardConfig = {
      rows: 4,
      cols: 4,
      width: 70,
      height: 70,
      padding: 10,
      backColor: '#3F51B5',
      frontColors: ['#F44336', '#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FFC107', '#FF5722', '#795548']
    };
    
    // 游戏数据
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    
    // 初始化触摸事件
    this.initTouchEvents();
    
    // 开始游戏循环
    this.lastTime = 0;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    // 显示开始界面
    this.showStartScreen();
  }
  
  // 初始化卡片
  initCards() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    
    const { rows, cols, width, height, padding, frontColors } = this.cardConfig;
    
    // 创建卡片对数组
    const pairs = [];
    for (let i = 0; i < (rows * cols) / 2; i++) {
      const colorIndex = i % frontColors.length;
      pairs.push({
        id: i,
        color: frontColors[colorIndex],
        flipped: false,
        matched: false
      });
      pairs.push({
        id: i + 100, // 确保ID不重复
        color: frontColors[colorIndex],
        flipped: false,
        matched: false
      });
    }
    
    // 随机洗牌
    this.shuffleArray(pairs);
    
    // 创建卡片网格
    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cardX = c * (width + padding) + padding * 2;
        const cardY = r * (height + padding) + padding * 2 + 100; // 顶部留出空间
        
        this.cards.push({
          ...pairs[index],
          x: cardX,
          y: cardY,
          width,
          height
        });
        
        index++;
      }
    }
  }
  
  // 洗牌算法
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    this.touchHandler = (e) => {
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
      
      // 如果游戏正在进行，检查卡片点击
      if (this.gameState === 'playing') {
        this.checkCardClick(touchX, touchY);
      }
      
      // 检查返回按钮点击
      this.checkBackButtonClick(touchX, touchY);
    };
    
    // 注册触摸事件
    wx.onTouchStart(this.touchHandler);
  }
  
  // 开始游戏
  startGame() {
    if (this.gameState !== 'ready' && this.gameState !== 'gameOver') return;
    
    this.gameState = 'playing';
    this.score = 0;
    this.moves = 0;
    
    // 初始化卡片
    this.initCards();
  }
  
  // 重置游戏
  resetGame() {
    this.gameState = 'ready';
    this.score = 0;
    this.moves = 0;
    this.flippedCards = [];
    this.matchedPairs = 0;
    
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
    ctx.fillText('记忆配对', this.width / 2, 100);
    
    // 绘制开始提示
    ctx.font = '24px Arial';
    ctx.fillText('点击屏幕开始游戏', this.width / 2, this.height / 2);
    
    // 绘制游戏说明
    ctx.font = '18px Arial';
    ctx.fillText('翻开卡片找到所有配对', this.width / 2, this.height / 2 + 50);
    ctx.fillText('用最少的步数完成挑战', this.width / 2, this.height / 2 + 80);
    
    // 绘制返回按钮
    this.drawBackButton();
  }
  
  // 显示游戏结束界面
  showGameOverScreen() {
    const ctx = this.ctx;
    
    // 半透明覆盖层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制游戏完成文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('恭喜完成!', this.width / 2, this.height / 2 - 50);
    
    // 绘制分数和步数
    ctx.font = '24px Arial';
    ctx.fillText(`得分: ${this.score}`, this.width / 2, this.height / 2);
    ctx.fillText(`步数: ${this.moves}`, this.width / 2, this.height / 2 + 40);
    
    // 绘制重新开始提示
    ctx.font = '18px Arial';
    ctx.fillText('点击屏幕重新开始', this.width / 2, this.height / 2 + 90);
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
  }
  
  // 检查返回按钮点击
  checkBackButtonClick(x, y) {
    if (x >= this.backButton.x && x <= this.backButton.x + this.backButton.width &&
        y >= this.backButton.y && y <= this.backButton.y + this.backButton.height) {
      this.exitGame();
    }
  }
  
  // 退出游戏
  exitGame() {
    // 移除事件监听
    if (this.touchHandler) {
      wx.offTouchStart(this.touchHandler);
    }
    
    // 调用退出回调
    if (this.callbacks && typeof this.callbacks.onExit === 'function') {
      this.callbacks.onExit();
    }
  }
  
  // 检查卡片点击
  checkCardClick(x, y) {
    // 如果已经翻开两张卡片，等待匹配检查完成
    if (this.flippedCards.length >= 2) return;
    
    // 检查每张卡片
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      
      // 如果卡片已经匹配或已经翻开，跳过
      if (card.matched || card.flipped) continue;
      
      // 检查点击是否在卡片范围内
      if (x >= card.x && x <= card.x + card.width &&
          y >= card.y && y <= card.y + card.height) {
        
        // 翻开卡片
        this.flipCard(i);
        break;
      }
    }
  }
  
  // 翻开卡片
  flipCard(index) {
    const card = this.cards[index];
    
    // 标记卡片为已翻开
    card.flipped = true;
    
    // 添加到已翻开卡片数组
    this.flippedCards.push(card);
    
    // 如果翻开了两张卡片，检查是否匹配
    if (this.flippedCards.length === 2) {
      this.moves++;
      
      // 延迟检查匹配，让玩家有时间看到第二张卡片
      setTimeout(() => {
        this.checkMatch();
      }, 500);
    }
  }
  
  // 检查卡片匹配
  checkMatch() {
    const [card1, card2] = this.flippedCards;
    
    // 检查两张卡片是否匹配（相同颜色）
    if (card1.id % 100 === card2.id % 100) {
      // 匹配成功
      card1.matched = true;
      card2.matched = true;
      
      // 增加匹配对数和分数
      this.matchedPairs++;
      this.score += 20;
      
      // 播放匹配成功音效
      // TODO: 添加音效
      
      // 检查游戏是否完成
      this.checkGameComplete();
    } else {
      // 匹配失败，翻回卡片
      card1.flipped = false;
      card2.flipped = false;
      
      // 减少分数（但不低于0）
      this.score = Math.max(0, this.score - 5);
      
      // 播放匹配失败音效
      // TODO: 添加音效
    }
    
    // 清空已翻开卡片数组
    this.flippedCards = [];
  }
  
  // 检查游戏是否完成
  checkGameComplete() {
    const { rows, cols } = this.cardConfig;
    const totalPairs = (rows * cols) / 2;
    
    if (this.matchedPairs >= totalPairs) {
      // 游戏完成
      this.gameState = 'gameOver';
      
      // 计算最终得分（基础分数 + 步数奖励）
      const maxMoves = totalPairs * 3; // 理论上的最大步数
      const moveBonus = Math.max(0, maxMoves - this.moves) * 5; // 步数越少，奖励越多
      this.score += moveBonus;
      
      // 更新全局积分
      if (this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
        this.callbacks.onScoreUpdate(this.score);
      }
    }
  }
  
  // 更新游戏状态
  update(deltaTime) {
    // 游戏逻辑更新
    if (this.gameState === 'playing') {
      // 记忆配对游戏主要是基于事件的，这里不需要每帧更新逻辑
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
    
    // 如果游戏正在进行或已结束
    if (this.gameState === 'playing' || this.gameState === 'gameOver') {
      // 绘制游戏标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('记忆配对', this.width / 2, 50);
      
      // 绘制分数和步数
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`得分: ${this.score}`, 120, 30);
      ctx.fillText(`步数: ${this.moves}`, 120, 50);
      
      // 绘制卡片
      this.drawCards();
      
      // 绘制返回按钮
      this.drawBackButton();
      
      // 如果游戏已结束，显示游戏结束界面
      if (this.gameState === 'gameOver') {
        this.showGameOverScreen();
      }
    }
  }
  
  // 绘制卡片
  drawCards() {
    const ctx = this.ctx;
    const { backColor } = this.cardConfig;
    
    for (const card of this.cards) {
      // 绘制卡片背景
      ctx.fillStyle = card.flipped || card.matched ? card.color : backColor;
      ctx.fillRect(card.x, card.y, card.width, card.height);
      
      // 绘制卡片边框
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(card.x, card.y, card.width, card.height);
      
      // 如果卡片已匹配，绘制对勾标记
      if (card.matched) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(card.x + card.width * 0.3, card.y + card.height * 0.5);
        ctx.lineTo(card.x + card.width * 0.45, card.y + card.height * 0.7);
        ctx.lineTo(card.x + card.width * 0.7, card.y + card.height * 0.3);
        ctx.stroke();
      }
    }
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
      wx.offTouchStart(this.touchHandler);
    }
  }
}

// 导出游戏类
module.exports = {
  Game
};