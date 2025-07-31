// 开放数据域入口文件
const sharedCanvas = wx.getSharedCanvas()
const context = sharedCanvas.getContext('2d')
let canvasWidth = 0
let canvasHeight = 0

// 资源加载器
class ResourceLoader {
  constructor() {
    this.resources = {}
    this.loadingCount = 0
    this.loadedCount = 0
  }

  // 加载图片资源
  loadImage(key, src) {
    if (this.resources[key]) {
      return Promise.resolve(this.resources[key])
    }

    this.loadingCount++
    return new Promise((resolve, reject) => {
      const image = wx.createImage()
      image.src = src
      image.onload = () => {
        this.resources[key] = image
        this.loadedCount++
        resolve(image)
      }
      image.onerror = (e) => {
        console.error(`加载图片失败: ${src}`, e)
        this.loadedCount++
        reject(e)
      }
    })
  }

  // 获取已加载的资源
  get(key) {
    return this.resources[key]
  }

  // 是否全部加载完成
  isLoaded() {
    return this.loadingCount === this.loadedCount
  }

  // 加载进度
  getProgress() {
    if (this.loadingCount === 0) return 1
    return this.loadedCount / this.loadingCount
  }
}

// 排行榜渲染器
class RankingRenderer {
  constructor() {
    this.resourceLoader = new ResourceLoader()
    this.rankingData = []
    this.selfData = null
    this.currentPage = 0
    this.pageSize = 5
    this.totalPages = 0
    this.gameId = ''
    this.rankType = 'score' // score 或 time
    this.timeRange = 'all' // all, day, week, month
    
    // 初始化资源
    this.initResources()
    
    // 监听主域消息
    this.initMessageListener()
    
    // 初始化画布尺寸
    this.initCanvas()
  }
  
  // 初始化资源
  async initResources() {
    try {
      await Promise.all([
        this.resourceLoader.loadImage('defaultAvatar', 'images/default_avatar.png'),
        this.resourceLoader.loadImage('rankBg', 'images/rank_bg.png'),
        this.resourceLoader.loadImage('firstRank', 'images/rank_1.png'),
        this.resourceLoader.loadImage('secondRank', 'images/rank_2.png'),
        this.resourceLoader.loadImage('thirdRank', 'images/rank_3.png'),
        this.resourceLoader.loadImage('prevBtn', 'images/prev_btn.png'),
        this.resourceLoader.loadImage('nextBtn', 'images/next_btn.png')
      ])
    } catch (error) {
      console.error('加载资源失败', error)
    }
  }
  
  // 初始化画布
  initCanvas() {
    wx.getOpenDataContext().onMessage(data => {
      if (data.event === 'updateViewPort') {
        canvasWidth = data.width
        canvasHeight = data.height
        this.render()
      }
    })
  }
  
  // 初始化消息监听
  initMessageListener() {
    wx.onMessage(message => {
      console.log('开放数据域收到消息:', message)
      
      switch (message.event) {
        case 'showRanking':
          this.showRanking(message.gameId, message.rankType, message.timeRange)
          break
        case 'prevPage':
          this.prevPage()
          break
        case 'nextPage':
          this.nextPage()
          break
        case 'close':
          this.clear()
          break
        case 'updateViewPort':
          canvasWidth = message.width
          canvasHeight = message.height
          this.render()
          break
      }
    })
  }
  
  // 显示排行榜
  async showRanking(gameId, rankType = 'score', timeRange = 'all') {
    this.gameId = gameId
    this.rankType = rankType
    this.timeRange = timeRange
    this.currentPage = 0
    
    await this.fetchRankingData()
    this.render()
  }
  
  // 获取排行榜数据
  async fetchRankingData() {
    try {
      // 获取好友数据
      let friendRankData = await this.getFriendRankData()
      
      // 获取自己的数据
      const selfData = await this.getSelfData()
      
      // 处理数据
      this.rankingData = friendRankData
      this.selfData = selfData
      this.totalPages = Math.ceil(this.rankingData.length / this.pageSize)
      
      console.log('排行榜数据获取成功', {
        total: this.rankingData.length,
        pages: this.totalPages,
        self: this.selfData
      })
    } catch (error) {
      console.error('获取排行榜数据失败', error)
    }
  }
  
  // 获取好友排行数据
  async getFriendRankData() {
    return new Promise((resolve, reject) => {
      wx.getFriendCloudStorage({
        keyList: [`${this.gameId}_${this.rankType}`],
        success: res => {
          console.log('获取好友数据成功', res)
          
          // 处理数据
          const rankData = res.data.map(friend => {
            const scoreKey = `${this.gameId}_${this.rankType}`
            const scoreData = friend.KVDataList.find(item => item.key === scoreKey)
            const score = scoreData ? parseInt(scoreData.value) : 0
            
            return {
              openid: friend.openid,
              nickname: friend.nickname,
              avatarUrl: friend.avatarUrl,
              score: score
            }
          })
          
          // 排序
          if (this.rankType === 'score') {
            rankData.sort((a, b) => b.score - a.score)
          } else {
            rankData.sort((a, b) => a.score - b.score) // 时间越短越好
          }
          
          // 添加排名
          rankData.forEach((item, index) => {
            item.rank = index + 1
          })
          
          resolve(rankData)
        },
        fail: err => {
          console.error('获取好友数据失败', err)
          reject(err)
        }
      })
    })
  }
  
  // 获取自己的数据
  async getSelfData() {
    return new Promise((resolve, reject) => {
      wx.getUserCloudStorage({
        keyList: [`${this.gameId}_${this.rankType}`],
        success: res => {
          console.log('获取自己数据成功', res)
          
          const scoreKey = `${this.gameId}_${this.rankType}`
          const scoreData = res.KVDataList.find(item => item.key === scoreKey)
          const score = scoreData ? parseInt(scoreData.value) : 0
          
          // 查找自己在排行榜中的位置
          const selfIndex = this.rankingData.findIndex(item => item.openid === wx.getOpenDataContext().selfOpenId)
          const rank = selfIndex !== -1 ? selfIndex + 1 : -1
          
          resolve({
            score,
            rank
          })
        },
        fail: err => {
          console.error('获取自己数据失败', err)
          reject(err)
        }
      })
    })
  }
  
  // 上一页
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--
      this.render()
    }
  }
  
  // 下一页
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++
      this.render()
    }
  }
  
  // 清空画布
  clear() {
    context.clearRect(0, 0, canvasWidth, canvasHeight)
  }
  
  // 渲染排行榜
  render() {
    if (!canvasWidth || !canvasHeight) return
    
    this.clear()
    
    // 绘制背景
    const bgImg = this.resourceLoader.get('rankBg')
    if (bgImg) {
      context.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight)
    } else {
      // 默认背景
      context.fillStyle = 'rgba(0, 0, 0, 0.7)'
      context.fillRect(0, 0, canvasWidth, canvasHeight)
    }
    
    // 绘制标题
    context.fillStyle = '#ffffff'
    context.font = 'bold 20px Arial'
    context.textAlign = 'center'
    
    let title = '好友排行榜'
    if (this.gameId) {
      const gameNames = {
        'game1': '弹球游戏',
        'game2': '记忆配对',
        'game3': '飞机大战'
      }
      title = (gameNames[this.gameId] || '游戏') + '排行榜'
    }
    
    context.fillText(title, canvasWidth / 2, 40)
    
    // 绘制排行类型
    const typeText = this.rankType === 'score' ? '得分排行' : '时间排行'
    const rangeTexts = {
      'all': '全部',
      'day': '今日',
      'week': '本周',
      'month': '本月'
    }
    const subTitle = `${rangeTexts[this.timeRange]}${typeText}`
    
    context.font = '16px Arial'
    context.fillText(subTitle, canvasWidth / 2, 65)
    
    // 没有数据
    if (this.rankingData.length === 0) {
      context.fillText('暂无排行数据', canvasWidth / 2, canvasHeight / 2)
      return
    }
    
    // 计算当前页的数据
    const startIndex = this.currentPage * this.pageSize
    const endIndex = Math.min(startIndex + this.pageSize, this.rankingData.length)
    const currentPageData = this.rankingData.slice(startIndex, endIndex)
    
    // 绘制列表
    const itemHeight = 70
    const startY = 90
    
    // 绘制表头
    context.fillStyle = '#cccccc'
    context.font = '14px Arial'
    context.textAlign = 'left'
    context.fillText('排名', 50, startY)
    context.fillText('头像', 100, startY)
    context.fillText('昵称', 180, startY)
    context.fillText(this.rankType === 'score' ? '分数' : '用时', 300, startY)
    
    // 绘制分割线
    context.strokeStyle = '#cccccc'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(30, startY + 10)
    context.lineTo(canvasWidth - 30, startY + 10)
    context.stroke()
    
    // 绘制列表项
    currentPageData.forEach((item, index) => {
      const y = startY + 30 + index * itemHeight
      
      // 绘制排名
      context.textAlign = 'center'
      const rank = startIndex + index + 1
      
      // 特殊排名图标
      if (rank <= 3) {
        const rankIcons = [
          this.resourceLoader.get('firstRank'),
          this.resourceLoader.get('secondRank'),
          this.resourceLoader.get('thirdRank')
        ]
        
        const rankIcon = rankIcons[rank - 1]
        if (rankIcon) {
          context.drawImage(rankIcon, 40, y - 15, 30, 30)
        } else {
          context.fillStyle = '#ffcc00'
          context.font = 'bold 18px Arial'
          context.fillText(rank, 50, y)
        }
      } else {
        context.fillStyle = '#ffffff'
        context.font = '16px Arial'
        context.fillText(rank, 50, y)
      }
      
      // 绘制头像
      const avatar = this.resourceLoader.get('defaultAvatar')
      if (avatar) {
        context.save()
        context.beginPath()
        context.arc(100, y, 20, 0, Math.PI * 2)
        context.clip()
        context.drawImage(avatar, 80, y - 20, 40, 40)
        context.restore()
      }
      
      // 绘制昵称
      context.textAlign = 'left'
      context.fillStyle = '#ffffff'
      context.font = '16px Arial'
      
      // 昵称截断
      let nickname = item.nickname || '未知玩家'
      if (nickname.length > 10) {
        nickname = nickname.substring(0, 10) + '...'
      }
      
      context.fillText(nickname, 140, y)
      
      // 绘制分数
      context.textAlign = 'right'
      context.fillStyle = '#ffcc00'
      context.font = 'bold 16px Arial'
      
      if (this.rankType === 'score') {
        context.fillText(item.score, canvasWidth - 50, y)
      } else {
        // 时间格式化
        const minutes = Math.floor(item.score / 60)
        const seconds = item.score % 60
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`
        context.fillText(timeText, canvasWidth - 50, y)
      }
      
      // 高亮自己
      if (item.openid === wx.getOpenDataContext().selfOpenId) {
        context.strokeStyle = '#ffcc00'
        context.lineWidth = 2
        context.strokeRect(30, y - 25, canvasWidth - 60, itemHeight - 10)
      }
    })
    
    // 绘制分页
    if (this.totalPages > 1) {
      context.textAlign = 'center'
      context.fillStyle = '#ffffff'
      context.font = '14px Arial'
      context.fillText(`${this.currentPage + 1}/${this.totalPages}`, canvasWidth / 2, canvasHeight - 30)
      
      // 上一页按钮
      const prevBtn = this.resourceLoader.get('prevBtn')
      if (prevBtn && this.currentPage > 0) {
        context.drawImage(prevBtn, canvasWidth / 2 - 80, canvasHeight - 45, 30, 30)
      }
      
      // 下一页按钮
      const nextBtn = this.resourceLoader.get('nextBtn')
      if (nextBtn && this.currentPage < this.totalPages - 1) {
        context.drawImage(nextBtn, canvasWidth / 2 + 50, canvasHeight - 45, 30, 30)
      }
    }
    
    // 绘制自己的排名信息
    if (this.selfData) {
      const selfY = canvasHeight - 70
      
      context.fillStyle = 'rgba(0, 0, 0, 0.5)'
      context.fillRect(0, selfY - 25, canvasWidth, 60)
      
      context.textAlign = 'left'
      context.fillStyle = '#ffffff'
      context.font = '16px Arial'
      context.fillText('我的排名:', 50, selfY)
      
      context.textAlign = 'center'
      context.fillStyle = '#ffcc00'
      context.font = 'bold 18px Arial'
      
      const rankText = this.selfData.rank > 0 ? this.selfData.rank : '未上榜'
      context.fillText(rankText, 150, selfY)
      
      context.textAlign = 'left'
      context.fillStyle = '#ffffff'
      context.font = '16px Arial'
      context.fillText(this.rankType === 'score' ? '我的分数:' : '我的用时:', 200, selfY)
      
      context.textAlign = 'center'
      context.fillStyle = '#ffcc00'
      context.font = 'bold 18px Arial'
      
      if (this.rankType === 'score') {
        context.fillText(this.selfData.score, 300, selfY)
      } else {
        // 时间格式化
        const minutes = Math.floor(this.selfData.score / 60)
        const seconds = this.selfData.score % 60
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`
        context.fillText(timeText, 300, selfY)
      }
    }
  }
}

// 初始化排行榜渲染器
const rankingRenderer = new RankingRenderer()