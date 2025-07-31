// 飞机大战游戏主文件

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
    this.player = {
      x: this.width / 2 - 25,
      y: this.height - 100,
      width: 50,
      height: 60,
      speed: 5,
      color: '#4CAF50',
      bullets: [],
      bulletSpeed: 10,
      bulletCooldown: 0,
      bulletCooldownMax: 10,
      lives: 3
    };
    
    // 敌人配置
    this.enemyConfig = {
      minWidth: 30,
      maxWidth: 60,
      minHeight: 30,
      maxHeight: 60,
      minSpeed: 2,
      maxSpeed: 5,
      spawnRate: 60, // 每60帧生成一个敌人
      spawnCounter: 0,
      colors: ['#F44336', '#E91E63', '#9C27B0', '#3F51B5', '#2196F3']
    };
    
    // 敌人数组
    this.enemies = [];
    
    // 爆炸效果数组
    this.explosions = [];
    
    // 道具配置
    this.powerupConfig = {
      width: 30,
      height: 30,
      speed: 3,
      spawnRate: 300, // 每300帧生成一个道具
      spawnCounter: 0,
      types: [
        { type: 'extraLife', color: '#4CAF50', chance: 0.2 },
        { type: 'shield', color: '#2196F3', chance: 0.3 },
        { type: 'rapidFire', color: '#FFC107', chance: 0.5 }
      ]
    };
    
    // 道具数组
    this.powerups = [];
    
    // 玩家状态
    this.playerState = {
      shield: false,
      shieldTime: 0,
      rapidFire: false,
      rapidFireTime: 0,
      invincible: false,
      invincibleTime: 0
    };
    
    // 游戏难度
    this.difficulty = 1;
    this.difficultyIncreaseInterval = 1000; // 每1000分增加难度
    
    // 初始化触摸事件
    this.initTouchEvents();
    
    // 开始游戏循环
    this.lastTime = 0;
    this.frameCount = 0;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    // 显示开始界面
    this.showStartScreen();
  }
  
  // 初始化触摸事件
  initTouchEvents() {
    // 触摸移动处理函数
    this.touchMoveHandler = (e) => {
      if (this.gameState !== 'playing') return;
      
      const touch = e.touches[0];
      const touchX = touch.clientX;
      
      // 移动飞机（中心对齐）
      this.player.x = touchX - this.player.width / 2;
      
      // 确保飞机不超出边界
      if (this.player.x < 0) {
        this.player.x = 0;
      } else if (this.player.x + this.player.width > this.width) {
        this.player.x = this.width - this.player.width;
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
      
      // 如果游戏正在进行，移动飞机
      if (this.gameState === 'playing') {
        this.player.x = touchX - this.player.width / 2;
        
        // 确保飞机不超出边界
        if (this.player.x < 0) {
          this.player.x = 0;
        } else if (this.player.x + this.player.width > this.width) {
          this.player.x = this.width - this.player.width;
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
    this.player.lives = 3;
    this.enemies = [];
    this.powerups = [];
    this.explosions = [];
    this.difficulty = 1;
    this.frameCount = 0;
    
    // 重置玩家状态
    this.playerState = {
      shield: false,
      shieldTime: 0,
      rapidFire: false,
      rapidFireTime: 0,
      invincible: false,
      invincibleTime: 0
    };
    
    // 重置玩家位置
    this.player.x = this.width / 2 - this.player.width / 2;
    this.player.y = this.height - 100;
    this.player.bullets = [];
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
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制星空背景
    this.drawStars();
    
    // 绘制游戏标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('飞机大战', this.width / 2, 100);
    
    // 绘制开始提示
    ctx.font = '24px Arial';
    ctx.fillText('点击屏幕开始游戏', this.width / 2, this.height / 2);
    
    // 绘制游戏说明
    ctx.font = '18px Arial';
    ctx.fillText('移动飞机躲避敌人并射击', this.width / 2, this.height / 2 + 50);
    ctx.fillText('收集道具获得特殊能力', this.width / 2, this.height / 2 + 80);
    
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
    
    this.frameCount++;
    
    // 更新玩家状态
    this.updatePlayerState();
    
    // 发射子弹
    this.fireBullet();
    
    // 更新子弹位置
    this.updateBullets();
    
    // 生成敌人
    this.spawnEnemies();
    
    // 更新敌人位置
    this.updateEnemies();
    
    // 生成道具
    this.spawnPowerups();
    
    // 更新道具位置
    this.updatePowerups();
    
    // 更新爆炸效果
    this.updateExplosions();
    
    // 检测碰撞
    this.checkCollisions();
    
    // 增加难度
    this.increaseDifficulty();
  }
  
  // 更新玩家状态
  updatePlayerState() {
    // 更新护盾状态
    if (this.playerState.shield) {
      this.playerState.shieldTime--;
      if (this.playerState.shieldTime <= 0) {
        this.playerState.shield = false;
      }
    }
    
    // 更新快速射击状态
    if (this.playerState.rapidFire) {
      this.playerState.rapidFireTime--;
      if (this.playerState.rapidFireTime <= 0) {
        this.playerState.rapidFire = false;
        this.player.bulletCooldownMax = 10; // 恢复正常射击速度
      }
    }
    
    // 更新无敌状态
    if (this.playerState.invincible) {
      this.playerState.invincibleTime--;
      if (this.playerState.invincibleTime <= 0) {
        this.playerState.invincible = false;
      }
    }
    
    // 更新子弹冷却
    if (this.player.bulletCooldown > 0) {
      this.player.bulletCooldown--;
    }
  }
  
  // 发射子弹
  fireBullet() {
    // 如果子弹冷却结束，发射新子弹
    if (this.player.bulletCooldown <= 0) {
      // 创建子弹
      const bullet = {
        x: this.player.x + this.player.width / 2 - 3, // 子弹从飞机中心发射
        y: this.player.y,
        width: 6,
        height: 15,
        speed: this.player.bulletSpeed,
        color: '#FFF'
      };
      
      this.player.bullets.push(bullet);
      
      // 如果有快速射击能力，同时发射三发子弹
      if (this.playerState.rapidFire) {
        // 左侧子弹
        const leftBullet = {
          x: this.player.x + 10,
          y: this.player.y + 10,
          width: 6,
          height: 15,
          speed: this.player.bulletSpeed,
          color: '#FFF'
        };
        
        // 右侧子弹
        const rightBullet = {
          x: this.player.x + this.player.width - 16,
          y: this.player.y + 10,
          width: 6,
          height: 15,
          speed: this.player.bulletSpeed,
          color: '#FFF'
        };
        
        this.player.bullets.push(leftBullet, rightBullet);
      }
      
      // 重置子弹冷却
      this.player.bulletCooldown = this.player.bulletCooldownMax;
    }
  }
  
  // 更新子弹位置
  updateBullets() {
    for (let i = this.player.bullets.length - 1; i >= 0; i--) {
      const bullet = this.player.bullets[i];
      
      // 移动子弹
      bullet.y -= bullet.speed;
      
      // 如果子弹超出屏幕，移除子弹
      if (bullet.y + bullet.height < 0) {
        this.player.bullets.splice(i, 1);
      }
    }
  }
  
  // 生成敌人
  spawnEnemies() {
    const { spawnRate, spawnCounter, minWidth, maxWidth, minHeight, maxHeight, minSpeed, maxSpeed, colors } = this.enemyConfig;
    
    // 根据难度调整生成速率
    const adjustedSpawnRate = Math.max(10, spawnRate - (this.difficulty - 1) * 5);
    
    // 增加计数器
    this.enemyConfig.spawnCounter++;
    
    // 如果达到生成间隔，生成新敌人
    if (this.enemyConfig.spawnCounter >= adjustedSpawnRate) {
      // 随机敌人宽度和高度
      const width = Math.random() * (maxWidth - minWidth) + minWidth;
      const height = Math.random() * (maxHeight - minHeight) + minHeight;
      
      // 随机敌人位置（确保完全在屏幕内）
      const x = Math.random() * (this.width - width);
      
      // 随机敌人速度（根据难度增加）
      const speedMultiplier = 1 + (this.difficulty - 1) * 0.2;
      const speed = (Math.random() * (maxSpeed - minSpeed) + minSpeed) * speedMultiplier;
      
      // 随机敌人颜色
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 创建敌人
      const enemy = {
        x,
        y: -height, // 从屏幕顶部生成
        width,
        height,
        speed,
        color,
        health: Math.ceil(width / 10) // 血量与大小相关
      };
      
      this.enemies.push(enemy);
      
      // 重置计数器
      this.enemyConfig.spawnCounter = 0;
    }
  }
  
  // 更新敌人位置
  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // 移动敌人
      enemy.y += enemy.speed;
      
      // 如果敌人超出屏幕底部，移除敌人并减少生命值
      if (enemy.y > this.height) {
        this.enemies.splice(i, 1);
        
        // 如果不是无敌状态，减少生命值
        if (!this.playerState.invincible) {
          this.player.lives--;
          
          // 检查游戏是否结束
          if (this.player.lives <= 0) {
            this.gameOver();
          } else {
            // 短暂无敌时间
            this.playerState.invincible = true;
            this.playerState.invincibleTime = 60; // 60帧无敌时间
          }
        }
      }
    }
  }
  
  // 生成道具
  spawnPowerups() {
    const { spawnRate, spawnCounter, width, height, speed, types } = this.powerupConfig;
    
    // 增加计数器
    this.powerupConfig.spawnCounter++;
    
    // 如果达到生成间隔，生成新道具
    if (this.powerupConfig.spawnCounter >= spawnRate) {
      // 随机选择道具类型（基于概率）
      let randomValue = Math.random();
      let cumulativeProbability = 0;
      let selectedType = null;
      
      for (const type of types) {
        cumulativeProbability += type.chance;
        if (randomValue <= cumulativeProbability) {
          selectedType = type;
          break;
        }
      }
      
      // 随机道具位置
      const x = Math.random() * (this.width - width);
      
      // 创建道具
      const powerup = {
        x,
        y: -height, // 从屏幕顶部生成
        width,
        height,
        speed,
        type: selectedType.type,
        color: selectedType.color
      };
      
      this.powerups.push(powerup);
      
      // 重置计数器
      this.powerupConfig.spawnCounter = 0;
    }
  }
  
  // 更新道具位置
  updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      
      // 移动道具
      powerup.y += powerup.speed;
      
      // 如果道具超出屏幕底部，移除道具
      if (powerup.y > this.height) {
        this.powerups.splice(i, 1);
      }
    }
  }
  
  // 创建爆炸效果
  createExplosion(x, y, size) {
    const explosion = {
      x,
      y,
      size,
      alpha: 1, // 透明度
      particles: [],
      lifespan: 30 // 爆炸持续帧数
    };
    
    // 创建爆炸粒子
    const particleCount = Math.floor(size / 2);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const radius = Math.random() * 3 + 1;
      const color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`; // 红黄色调
      
      explosion.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius,
        color
      });
    }
    
    this.explosions.push(explosion);
  }
  
  // 更新爆炸效果
  updateExplosions() {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      
      // 更新爆炸生命周期
      explosion.lifespan--;
      explosion.alpha = explosion.lifespan / 30; // 逐渐变透明
      
      // 更新粒子位置
      for (const particle of explosion.particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
      }
      
      // 如果爆炸结束，移除爆炸
      if (explosion.lifespan <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }
  
  // 检测碰撞
  checkCollisions() {
    // 检测子弹与敌人的碰撞
    for (let i = this.player.bullets.length - 1; i >= 0; i--) {
      const bullet = this.player.bullets[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        // 检查碰撞
        if (this.checkRectCollision(bullet, enemy)) {
          // 减少敌人血量
          enemy.health--;
          
          // 移除子弹
          this.player.bullets.splice(i, 1);
          
          // 如果敌人血量为0，移除敌人并增加分数
          if (enemy.health <= 0) {
            // 创建爆炸效果
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
            
            // 移除敌人
            this.enemies.splice(j, 1);
            
            // 增加分数（分数与敌人大小相关）
            const scoreValue = Math.ceil(enemy.width);
            this.score += scoreValue;
          }
          
          break; // 一颗子弹只能击中一个敌人
        }
      }
    }
    
    // 如果玩家不是无敌状态，检测玩家与敌人的碰撞
    if (!this.playerState.invincible) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        
        if (this.checkRectCollision(this.player, enemy)) {
          // 创建爆炸效果
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);
          
          // 移除敌人
          this.enemies.splice(i, 1);
          
          // 如果有护盾，消耗护盾
          if (this.playerState.shield) {
            this.playerState.shield = false;
            this.playerState.shieldTime = 0;
          } else {
            // 减少生命值
            this.player.lives--;
            
            // 检查游戏是否结束
            if (this.player.lives <= 0) {
              this.gameOver();
            } else {
              // 短暂无敌时间
              this.playerState.invincible = true;
              this.playerState.invincibleTime = 60; // 60帧无敌时间
            }
          }
        }
      }
    }
    
    // 检测玩家与道具的碰撞
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      
      if (this.checkRectCollision(this.player, powerup)) {
        // 应用道具效果
        this.applyPowerup(powerup.type);
        
        // 移除道具
        this.powerups.splice(i, 1);
      }
    }
  }
  
  // 检查矩形碰撞
  checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  // 应用道具效果
  applyPowerup(type) {
    switch (type) {
      case 'extraLife':
        // 增加生命值
        this.player.lives = Math.min(this.player.lives + 1, 5); // 最多5条命
        
        // 显示提示
        wx.showToast({
          title: '获得额外生命',
          icon: 'none',
          duration: 1000
        });
        break;
        
      case 'shield':
        // 激活护盾
        this.playerState.shield = true;
        this.playerState.shieldTime = 300; // 300帧护盾时间
        
        // 显示提示
        wx.showToast({
          title: '获得护盾',
          icon: 'none',
          duration: 1000
        });
        break;
        
      case 'rapidFire':
        // 激活快速射击
        this.playerState.rapidFire = true;
        this.playerState.rapidFireTime = 300; // 300帧快速射击时间
        this.player.bulletCooldownMax = 5; // 减少子弹冷却时间
        
        // 显示提示
        wx.showToast({
          title: '获得快速射击',
          icon: 'none',
          duration: 1000
        });
        break;
    }
  }
  
  // 增加难度
  increaseDifficulty() {
    if (this.score > 0 && this.score % this.difficultyIncreaseInterval === 0) {
      // 每达到一定分数增加难度
      this.difficulty = 1 + Math.floor(this.score / this.difficultyIncreaseInterval);
    }
  }
  
  // 游戏结束
  gameOver() {
    this.gameState = 'gameOver';
    
    // 更新全局积分
    if (this.callbacks && typeof this.callbacks.onScoreUpdate === 'function') {
      this.callbacks.onScoreUpdate(this.score);
    }
  }
  
  // 绘制星空背景
  drawStars() {
    const ctx = this.ctx;
    
    // 如果没有初始化星星，创建星星
    if (!this.stars) {
      this.stars = [];
      const starCount = 100;
      
      for (let i = 0; i < starCount; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.5 + 0.1
        });
      }
    }
    
    // 绘制并更新星星
    for (const star of this.stars) {
      // 更新星星位置
      if (this.gameState === 'playing') {
        star.y += star.speed;
        
        // 如果星星超出屏幕底部，重置到顶部
        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
        }
      }
      
      // 绘制星星
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fill();
    }
  }
  
  // 渲染游戏
  render() {
    const ctx = this.ctx;
    
    // 清空画布
    ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制星空背景
    this.drawStars();
    
    // 如果游戏处于准备状态，显示开始界面
    if (this.gameState === 'ready') {
      this.showStartScreen();
      return;
    }
    
    // 如果游戏正在进行或已结束
    if (this.gameState === 'playing' || this.gameState === 'gameOver') {
      // 绘制玩家飞机
      this.drawPlayer();
      
      // 绘制子弹
      this.drawBullets();
      
      // 绘制敌人
      this.drawEnemies();
      
      // 绘制道具
      this.drawPowerups();
      
      // 绘制爆炸效果
      this.drawExplosions();
      
      // 绘制UI
      this.drawUI();
      
      // 如果游戏已结束，显示游戏结束界面
      if (this.gameState === 'gameOver') {
        this.showGameOverScreen();
      }
    }
  }
  
  // 绘制玩家飞机
  drawPlayer() {
    const ctx = this.ctx;
    
    // 如果玩家处于无敌状态，闪烁效果
    if (this.playerState.invincible && this.frameCount % 10 < 5) {
      return; // 跳过绘制
    }
    
    // 绘制飞机主体
    ctx.fillStyle = this.player.color;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // 绘制飞机细节
    ctx.fillStyle = '#333';
    ctx.fillRect(this.player.x + this.player.width / 2 - 5, this.player.y - 10, 10, 10);
    
    // 如果有护盾，绘制护盾
    if (this.playerState.shield) {
      ctx.beginPath();
      ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 
              this.player.width / 2 + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // 如果有快速射击，绘制指示器
    if (this.playerState.rapidFire) {
      ctx.fillStyle = '#FFC107';
      ctx.fillRect(this.player.x, this.player.y + this.player.height - 5, 
                  this.player.width * (this.playerState.rapidFireTime / 300), 5);
    }
  }
  
  // 绘制子弹
  drawBullets() {
    const ctx = this.ctx;
    
    for (const bullet of this.player.bullets) {
      ctx.fillStyle = bullet.color;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }
  
  // 绘制敌人
  drawEnemies() {
    const ctx = this.ctx;
    
    for (const enemy of this.enemies) {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // 绘制敌人细节
      ctx.fillStyle = '#333';
      ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
    }
  }
  
  // 绘制道具
  drawPowerups() {
    const ctx = this.ctx;
    
    for (const powerup of this.powerups) {
      // 绘制道具背景
      ctx.fillStyle = powerup.color;
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      
      // 根据道具类型绘制不同图标
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let icon = '';
      switch (powerup.type) {
        case 'extraLife':
          icon = '♥';
          break;
        case 'shield':
          icon = '⛨';
          break;
        case 'rapidFire':
          icon = '⚡';
          break;
      }
      
      ctx.fillText(icon, powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
    }
  }
  
  // 绘制爆炸效果
  drawExplosions() {
    const ctx = this.ctx;
    
    for (const explosion of this.explosions) {
      ctx.save();
      ctx.globalAlpha = explosion.alpha;
      ctx.translate(explosion.x, explosion.y);
      
      for (const particle of explosion.particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      }
      
      ctx.restore();
    }
  }
  
  // 绘制UI
  drawUI() {
    const ctx = this.ctx;
    
    // 绘制分数
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${this.score}`, 120, 30);
    
    // 绘制生命值
    ctx.fillText('生命: ', 120, 60);
    for (let i = 0; i < this.player.lives; i++) {
      ctx.fillStyle = '#F44336';
      ctx.fillRect(180 + i * 25, 45, 20, 20);
    }
    
    // 绘制难度
    ctx.fillStyle = '#fff';
    ctx.fillText(`难度: ${this.difficulty}`, 120, 90);
    
    // 绘制返回按钮
    this.drawBackButton();
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