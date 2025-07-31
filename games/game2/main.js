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
    
    // 移动次数
    this.moves = 0;
    
    // 卡片配置
    this.cardConfig = {
      rows: 4,
      cols: 4,
      width: 70,
      height: 70,
      padding: 10,
      borderRadius: 10,
      backColor: '#3F51B5',
      frontColors: ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#2196F3', '#00BCD4', '#009688', '#4CAF50'],
      symbols: ['♠', '♥', '♦', '♣', '★', '☆', '✿', '❀']
    };
    
    // 卡片数组
    this.cards = [];
    
    // 已翻开的卡片
    this.flippedCards = [];
    
    // 已匹配的卡片对数
    this.matchedPairs = 0;
    
    // 是否可以翻牌
    this.canFlip = true;
    
    // 初始化卡片
    this.initCards();
    
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
    const { rows, cols, width, height, padding, frontColors, symbols } = this.cardConfig;
    
    // 计算卡片总数
    const totalCards = rows * cols;
    
    // 确保卡片数量是偶数
    if (totalCards % 2 !== 0) {
      console.error('卡片总数必须是偶数');
      return;
    }
    
    // 计算需要的不同卡片对数
    const pairsNeeded = totalCards / 2;
    
    // 创建卡片对
    const cardValues = [];
    for (let i = 0; i < pairsNeeded; i++) {
      const colorIndex = i % frontColors.length;
      const symbolIndex = i % symbols.length;
      
      // 每对卡片使用相同的颜色和符号
      cardValues.push({
        color: frontColors[colorIndex],
        symbol: symbols[symbolIndex],
        id: i
      });
      
      cardValues.push({
        color: frontColors[colorIndex],
        symbol: symbols[symbolIndex],
        id: i
      });
    }
    
    // 洗牌
    this.shuffleArray(cardValues);
    
    // 计算卡片网格的起始位置（居中）
    const gridWidth = cols * (width + padding) - padding;
    const gridHeight = rows * (height + padding) - padding;
    const startX = (this.width - gridWidth) / 2;
    const startY = (this.height - gridHeight) / 2 + 50; // 向下偏移一点，为标题留出空间
    
    // 创建卡片对象
    this.cards = [];
    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (width + padding);
        const y = startY + row * (height + padding);
        
        this.cards.push({
          x,
          y,
          width,
          height,
          color: cardValues[index].color,
          symbol: cardValues[index].symbol,
          id: cardValues[index].id,
          isFlipped: false,
          isMatched: false
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
      
      // 如果游戏正在进行，检查卡片点击
      if (this.gameState === 'playing') {
        this.checkCardClick(touchX, touchY);
      }
    };
    
    // 注册触摸事件
    wx.onTouchStart(this.touchStartHandler);
  }
  
  // 开始游戏
  startGame() {
    if (this.gameState !== 'ready' && this.gameState !== 'gameOver') return;
    
    this.gameState = 'playing';
    this.score = 0;
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.canFlip = true;
    
    // 重置所有卡片
    for (const card of this.cards) {
      card.isFlipped = false;
      card.isMatched = false;
    }
  }
  
  // 重置游戏
  resetGame() {
    // 重新初始化卡片（重新洗牌）
    this.initCards();
    
    // 重置游戏状态
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
    ctx.fillStyle = '#3F51B5';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('记忆配对', this.width / 2, 80);
    
    // 绘制开始提示
    ctx.fillStyle = '#455A64';
    ctx.font = '24px Arial';
    ctx.fillText('点击屏幕开始游戏', this.width / 2, this.height / 2);
    
    // 绘制游戏说明
    ctx.font = '18px Arial';
    ctx.fillText('翻开卡片，找到所有匹配的对子', this.width / 2, this.height / 2 + 40);
    ctx.fillText('尽量减少移动次数以获得更高分数', this.width / 2, this.height / 2 + 70);
    
    // 绘制返回按钮
    this.drawBackButton();
  }
  
  // 显示游戏完成界面
  showGameCompleteScreen() {
    const ctx = this.ctx;
    
    // 半透明覆盖层
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制完成文字
    ctx.fillStyle = '#3F51B5';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('恭喜完成!', this.width / 2, this.height / 2 - 50);
    
    // 绘制分数
    ctx.fillStyle = '#455A64';
    ctx.font = '24px Arial';
    ctx.fillText(`得分: ${this.score}`, this.width / 2, this.height / 2);
    ctx.fillText(`步数: ${this.moves}`, this.width / 2, this.height / 2 + 40);
    
    // 绘制重新开始提示
    ctx.font = '18px Arial';
    ctx.fillText('点击屏幕重新开始', this.width / 2, this.height / 2 + 80);
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
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler);
    }
    
    // 调用退出回调
    if (this.callbacks && typeof this.callbacks.onExit === 'function') {
      this.callbacks.onExit();
    }
  }
  
  // 检查卡片点击
  checkCardClick(x, y) {
    // 如果不能翻牌，直接返回
    if (!this.canFlip) return;
    
    // 检查每张卡片
    for (const card of this.cards) {
      // 如果卡片已经翻开或已匹配，跳过
      if (card.isFlipped || card.isMatched) continue;
      
      // 检查点击是否在卡片范围内
      if (x >= card.x && x <= card.x + card.width &&
          y >= card.y && y <= card.y + card.height) {
        // 翻开卡片
        this.flipCard(card);
        break;
      }
    }
  }
  
  // 翻开卡片
  flipCard(card) {
    // 如果已经翻开了两张卡片，不能再翻
    if (this.flippedCards.length >= 2) return;
    
    // 翻开卡片
    card.isFlipped = true;
    this.flippedCards.push(card);
    
    // 如果翻开了两张卡片，检查是否匹配
    if (this.flippedCards.length === 2) {
      // 增加移动次数
      this.moves++;
      
      // 检查匹配
      this.checkMatch();
    }
  }
  
  // 检查卡片匹配
  checkMatch() {
    const [card1, card2] = this.flippedCards;
    
    // 暂时禁止翻牌
    this.canFlip = false;
    
    // 延迟检查，让玩家有时间看到第二张牌
    setTimeout(() => {
      // 如果两张卡片ID相同，表示匹配成功
      if (card1.id === card2.id) {
        // 标记为已匹配
        card1.isMatched = true;
        card2.isMatched = true;
        
        // 增加匹配对数
        this.matchedPairs++;
        
        // 增加分数（匹配成功加10分）
        this.score += 10;
        
        // 检查游戏是否完成
        this.checkGameComplete();
      } else {
        // 匹配失败，翻回卡片
        card1.isFlipped = false;
        card2.isFlipped = false;
        
        // 减少分数（匹配失败减2分，但不低于0）
        this.score = Math.max(0, this.score - 2);
      }
      
      // 清空已翻开的卡片
      this.flippedCards = [];
      
      // 允许继续翻牌
      this.canFlip = true;
    }, 1000);
  }
  
  // 检查游戏是否完成
  checkGameComplete() {
    const totalPairs = this.cards.length / 2;
    
    if (this.matchedPairs >= totalPairs) {
      // 游戏完成
      this.gameState = 'gameOver';
      
      // 计算最终得分
      // 基础分数 + 步数奖励（步数越少奖励越多）
      const maxPossibleMoves = this.cards.length * 2; // 理论最大步数
      const moveBonus = Math.max(0, Math.floor((maxPossibleMoves - this.moves) * 2));
      this.score += moveBonus;
      
      // 更新全局积分
      if (this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
        this.callbacks.onScoreUpdate(this.score);
      }
    }
  }
  
  // 更新游戏状态
  update() {
    // 游戏逻辑更新
    if (this.gameState === 'playing') {
      // 记忆配对游戏主要逻辑在事件处理中
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
    
    // 绘制游戏标题
    ctx.fillStyle = '#3F51B5';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('记忆配对', this.width / 2, 40);
    
    // 绘制分数和步数
    ctx.fillStyle = '#455A64';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${this.score}`, 120, 30);
    ctx.fillText(`步数: ${this.moves}`, 120, 60);
    
    // 绘制卡片
    this.drawCards();
    
    // 绘制返回按钮
    this.drawBackButton();
    
    // 如果游戏已结束，显示完成界面
    if (this.gameState === 'gameOver') {
      this.showGameCompleteScreen();
    }
  }
  
  // 绘制卡片
  drawCards() {
    const ctx = this.ctx;
    const { borderRadius, backColor } = this.cardConfig;
    
    for (const card of this.cards) {
      // 绘制卡片背景
      ctx.fillStyle = card.isFlipped || card.isMatched ? card.color : backColor;
      
      // 绘制圆角矩形
      ctx.beginPath();
      ctx.moveTo(card.x + borderRadius, card.y);
      ctx.lineTo(card.x + card.width - borderRadius, card.y);
      ctx.quadraticCurveTo(card.x + card.width, card.y, card.x + card.width, card.y + borderRadius);
      ctx.lineTo(card.x + card.width, card.y + card.height - borderRadius);
      ctx.quadraticCurveTo(card.x + card.width, card.y + card.height, card.x + card.width - borderRadius, card.y + card.height);
      ctx.lineTo(card.x + borderRadius, card.y + card.height);
      ctx.quadraticCurveTo(card.x, card.y + card.height, card.x, card.y + card.height - borderRadius);
      ctx.lineTo(card.x, card.y + borderRadius);
      ctx.quadraticCurveTo(card.x, card.y, card.x + borderRadius, card.y);
      ctx.closePath();
      ctx.fill();
      
      // 绘制卡片边框
      ctx.strokeStyle = '#90A4AE';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 如果卡片已翻开或已匹配，绘制符号
      if (card.isFlipped || card.isMatched) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.symbol, card.x + card.width / 2, card.y + card.height / 2);
      }
      
      // 如果卡片已匹配，绘制匹配标记
      if (card.isMatched) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(card.x + 15, card.y + card.height / 2);
        ctx.lineTo(card.x + 30, card.y + card.height - 20);
        ctx.lineTo(card.x + card.width - 15, card.y + 20);
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
    if (this.touchStartHandler) {
      wx.offTouchStart(this.touchStartHandler);
    }
  }
}

// 导出游戏类
module.exports = {
  Game
};